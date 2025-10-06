const Brevo = require("@getbrevo/brevo");

const client = new Brevo.TransactionalEmailsApi();
client.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

async function sendReminderEmail(toEmail, subject, message) {
  try {
    const email = {
      sender: {
        email: process.env.EMAIL_SENDER,
        name: process.env.EMAIL_SENDER_NAME,
      },
      to: [{ email: toEmail }],
      subject,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>⏰ Reminder from ExTodo</h2>
          <p>${message}</p>
          <p><b>Stay productive 🌿</b></p>
        </div>
      `,
    };

    const response = await client.sendTransacEmail(email);
    console.log("✅ Reminder email sent:", response.messageId);
  } catch (error) {
    console.error("❌ Error sending reminder:", error.response?.body || error);
  }
}

module.exports = sendReminderEmail;
