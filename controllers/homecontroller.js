const fs = require("fs");
const path = require("path");


const filepath = path.join(__dirname, "../data/users.json");
const filepath2 = path.join(__dirname, "../data/pasttodos.json");


const getHome = (req, res) => {
  const username = req.session.username || "guest";

  // ✅ If guest → render guest.ejs
  if (username === "guest") {
    return res.render("guest", { username: "guest" });
  }

  // ✅ Otherwise load tasks for logged-in user
  fs.readFile(filepath, "utf-8", (err, data) => {
    if (err) return res.status(500).send("Internal Server Error");
    let users = [];
    try {
      const parsed = JSON.parse(data);
      users = Array.isArray(parsed.users) ? parsed.users : [];
    } catch (err) {
      return res.status(500).send("Internal Server Error");
    }

    const user = users.find(u => u.username === username);
    if (!user) return res.status(404).send("User not found");

    // Show only pending tasks in Inbox
    const todos = Array.isArray(user.todos)
      ? user.todos.filter(t => !t.completed)
      : [];

    const completedCount = user.todos.filter(t => t.completed).length;
    const pendingCount = todos.length;
    const overdueCount = user.todos.filter(
      t => !t.completed && t.deadline && new Date(t.deadline) < new Date()
    ).length;

    res.render("home", {
      username,
      todos,
      completedCount,
      pendingCount,
      overdueCount,
      page: "home"
    });
  });
};





const addTask = (req, res) => {
  const { username, task, category, priority, deadline, reminder, reminderOffset } = req.body;
  if (!task) return res.redirect(`/home`);

  fs.readFile(filepath, "utf-8", (err, data) => {
    if (err) return res.status(500).send("Internal Server Error");
    let users = [];
    try {
      users = JSON.parse(data).users || [];
    } catch {
      return res.status(500).send("Internal Server Error");
    }

    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex === -1) return res.redirect(`/home`);

    // Compute absolute reminder time:
    let computedReminder = null;
    try {
      // 1) explicit reminder datetime from input (datetime-local)
      if (reminder) {
        const d = new Date(reminder);
        if (!isNaN(d.getTime())) computedReminder = d.toISOString();
      }

      // 2) if no explicit reminder, but reminderOffset (minutes) + deadline provided
      if (!computedReminder && reminderOffset && deadline) {
        const offsetMin = parseInt(reminderOffset, 10);
        const dl = new Date(deadline);
        if (!isNaN(dl.getTime()) && !isNaN(offsetMin)) {
          const ms = dl.getTime() - offsetMin * 60 * 1000;
          if (ms > 0) computedReminder = new Date(ms).toISOString();
          else {
            // offset calculation produced a past time — set to now (or skip)
            computedReminder = new Date().toISOString();
          }
        }
      }

      // 3) if reminderOffset provided but no deadline (fallback): reminderOffset minutes from now
      if (!computedReminder && reminderOffset && !deadline) {
        const offsetMin = parseInt(reminderOffset, 10);
        if (!isNaN(offsetMin)) {
          computedReminder = new Date(Date.now() + offsetMin * 60 * 1000).toISOString();
        }
      }
    } catch (e) {
      computedReminder = null;
    }

    const newTask = { 
      id: Date.now(), 
      text: task, 
      description: req.body.description || "",
      completed: false, 
      category: category || "General", 
      priority: priority || "Medium", 
      deadline: deadline || null,
      reminder: computedReminder,              // store absolute ISO datetime or null
      reminderSent: false
    };

    users[userIndex].todos = users[userIndex].todos || [];
    users[userIndex].todos.push(newTask);

    fs.writeFile(filepath, JSON.stringify({ users }, null, 2), err => {
      if (err) return res.status(500).send("Internal Server Error");
      // worker will pick up reminders soon (or you can schedule immediate)
      res.redirect(`/home`);
    });
  });
};





const toggleTask = (req, res) => {
  const { username, taskId } = req.body;

  fs.readFile(filepath, "utf-8", (err, data) => {
    if (err) return res.status(500).send("Internal Server Error");
    let users = [];
    try {
      users = JSON.parse(data).users || [];
    } catch {
      return res.status(500).send("Internal Server Error");
    }

    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex === -1) return res.redirect(`/home`);

    const todo = users[userIndex].todos.find(t => t.id == taskId);

    if (todo) {
      if (!todo.completed) {
        // Mark as completed → add timestamp
        todo.completed = true;
        todo.completedAt = new Date().toISOString();
      } else {
        // Mark as not completed → remove timestamp
        todo.completed = false;
        delete todo.completedAt;
      }
    }

    fs.writeFile(filepath, JSON.stringify({ users }, null, 2), err => {
      if (err) return res.status(500).send("Internal Server Error");
      res.redirect(`/home`);
    });
  });
};



const deleteTask = (req, res) => {
  const { username, taskId } = req.body;
  fs.readFile(filepath, "utf-8", (err, data) => {
    if (err) return res.status(500).send("Internal Server Error");
    let users = [];
    try {
      users = JSON.parse(data).users || [];
    } catch {
      return res.status(500).send("Internal Server Error");
    }
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex === -1) return res.redirect(`/home`);
    const deletedTask = users[userIndex].todos.find(t => t.id == taskId);
    users[userIndex].todos = users[userIndex].todos.filter(t => t.id != taskId);
    fs.writeFile(filepath, JSON.stringify({ users }, null, 2), err => {
      if (err) return res.status(500).send("Internal Server Error");
      if (deletedTask) {
        fs.readFile(filepath2, "utf-8", (err, data) => {
          let pastTodos = [];
          if (!err && data) {
            try {
              const parsed = JSON.parse(data);
              pastTodos = Array.isArray(parsed.pastTodos) ? parsed.pastTodos : [];
            } catch (e) {
            }
          }
          pastTodos.push({
            username,
            ...deletedTask,
            deletedAt: new Date().toISOString(),
          });
          fs.writeFile(filepath2, JSON.stringify({ pastTodos }, null, 2), (err) => {
            if (err) return res.status(500).send("Internal Server Error");
            res.redirect(`/home`);
          });
        });
      } else {
        res.redirect(`/home`);
      }
    });
  });
};

const editTask = (req, res) => {
  const { username, taskId, task, priority, deadline, reminder, reminderOffset, description } = req.body;

  fs.readFile(filepath, "utf-8", (err, data) => {
    if (err) return res.status(500).send("Internal Server Error");

    let users = [];
    try {
      users = JSON.parse(data).users || [];
    } catch {
      return res.status(500).send("Internal Server Error");
    }

    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex === -1) return res.redirect(`/home`);

    const todo = users[userIndex].todos.find(t => t.id == taskId);
    if (todo) {
      // update fields
      todo.text = task;
      todo.description = description || todo.description || "";
      todo.priority = priority || todo.priority || "Medium";
      todo.deadline = deadline || null;

      // recompute reminder similar to addTask
      let computedReminder = null;
      try {
        if (reminder) {
          const d = new Date(reminder);
          if (!isNaN(d.getTime())) computedReminder = d.toISOString();
        }
        if (!computedReminder && reminderOffset && todo.deadline) {
          const offsetMin = parseInt(reminderOffset, 10);
          const dl = new Date(todo.deadline);
          if (!isNaN(dl.getTime()) && !isNaN(offsetMin)) {
            const ms = dl.getTime() - offsetMin * 60 * 1000;
            if (ms > 0) computedReminder = new Date(ms).toISOString();
          }
        }
        // if updating reminder, reset reminderSent so worker can resend if desired
        if (computedReminder) {
          todo.reminder = computedReminder;
          todo.reminderSent = false;
        } else if (reminder === "" || reminder === null) {
          // optional: if user cleared reminder input -> remove it
          todo.reminder = null;
          todo.reminderSent = false;
        }
      } catch (e) {
        // ignore
      }
    }

    fs.writeFile(filepath, JSON.stringify({ users }, null, 2), err => {
      if (err) return res.status(500).send("Internal Server Error");
      res.redirect(`/home`);
    });
  });
};


module.exports = { getHome, addTask, toggleTask, deleteTask, editTask };