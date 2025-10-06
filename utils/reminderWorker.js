// utils/reminderWorker.js
const fs = require('fs');
const path = require('path');
const sendReminderEmail = require('./brevo'); // adjust path if needed
require('dotenv').config();

const USERS_FILE = path.join(__dirname, '../data/users.json');
const INTERVAL_MS = parseInt(process.env.REMINDER_WORKER_INTERVAL_MS, 10) || 30 * 1000;

function safeReadUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8') || '';
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.users) ? parsed.users : [];
  } catch (e) {
    console.error('reminderWorker: error parsing users.json', e);
    return [];
  }
}

function safeWriteUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users }, null, 2));
  } catch (e) {
    console.error('reminderWorker: error writing users.json', e);
  }
}

async function checkAndSend() {
  let users = safeReadUsers();
  const now = Date.now();
  let changed = false;

  for (const user of users) {
    if (!user.todos || !Array.isArray(user.todos)) continue;
    const toEmail = user.email || process.env.EMAIL_SENDER;
    if (!toEmail) continue;

    for (const todo of user.todos) {
      try {
        if (todo.reminderSent) continue;

        let reminderTime = null;

        // Case 1: custom datetime
        if (todo.reminder) {
          reminderTime = new Date(todo.reminder).getTime();
        }
        // Case 2: offset (needs deadline)
        else if (todo.reminderOffset && todo.deadline) {
          const deadlineTime = new Date(todo.deadline).getTime();
          const offsetMinutes = parseInt(todo.reminderOffset, 10) || 0;
          reminderTime = deadlineTime - offsetMinutes * 60 * 1000;
        }

        if (!reminderTime || isNaN(reminderTime)) continue;

        if (reminderTime <= now) {
          const subject = `Reminder: ${todo.text}`;
          const html = `
            <div style="font-family: Arial, sans-serif; line-height:1.5;">
              <p>Hi ${user.username || ''},</p>
              <p>This is your reminder for the task:</p>
              <p><strong>${todo.text}</strong></p>
              ${todo.deadline ? `<p>Deadline: ${todo.deadline}</p>` : ''}
              <p style="color:#888; font-size:0.9rem;">Sent by ExTodo</p>
            </div>
          `;

          try {
            await sendReminderEmail(toEmail, subject, html);
            todo.reminderSent = true;
            changed = true;
            console.log(`✅ reminderWorker: sent reminder to ${toEmail} for task ${todo.id}`);
          } catch (err) {
            console.error('❌ reminderWorker: error sending email', err);
          }
        }
      } catch (err) {
        console.error('reminderWorker: task iteration error', err);
      }
    }
  }

  if (changed) {
    safeWriteUsers(users);
  }
}

let intervalHandle = null;
function start() {
  checkAndSend().catch(err => console.error('reminderWorker initial run error', err));
  intervalHandle = setInterval(() => {
    checkAndSend().catch(err => console.error('reminderWorker error', err));
  }, INTERVAL_MS);
  console.log('⏰ reminderWorker started, checking every', INTERVAL_MS, 'ms');
}

function stop() {
  if (intervalHandle) clearInterval(intervalHandle);
}

module.exports = { start, stop };
