const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const userFile = path.join(__dirname, "../data/users.json");


function loadUsers() {
  try {
    const data = fs.readFileSync(userFile, "utf8");
    return data ? JSON.parse(data) : { users: [] };
  } catch (err) {
    console.error("Error reading users.json:", err);
    return { users: [] };
  }
}

function saveUsers(data) {
  fs.writeFileSync(userFile, JSON.stringify(data, null, 2));
}


router.get("/", (req, res) => {
  const username = req.session.username || "guest";

  const data = loadUsers();
  const user = data.users.find(u => u.username === username);

  const completedTodos = user ? user.todos.filter(t => t.completed) : [];

  res.render("completed", { username, completedTodos });
});

router.post("/restore", (req, res) => {
  const { taskId } = req.body;
  const username = req.session.username || "guest";

  const data = loadUsers();
  const user = data.users.find(u => u.username === username);

  if (user) {
    const task = user.todos.find(t => t.id == taskId);
    if (task) {
      task.completed = false;
      delete task.completedAt;
    }
    saveUsers(data);
  }

  res.redirect("/completed");
});

module.exports = router;
