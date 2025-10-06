const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
// const taskDate = todo.deadline.split("T")[0]; // normalize for comparison


const filepath = path.join(__dirname, "../data/users.json");

router.get("/", (req, res) => {
  const username = req.session.username || "guest";
  if (username === "guest") {
    return res.render("today", { username, tasks: [] });
  }

  fs.readFile(filepath, "utf-8", (err, data) => {
    if (err) return res.status(500).send("Internal Server Error");
    let users = [];
    try {
      users = JSON.parse(data).users || [];
    } catch {
      return res.status(500).send("Internal Server Error");
    }

    const user = users.find(u => u.username === username);
    if (!user) return res.render("today", { username, tasks: [] });

    const today = new Date().toISOString().split("T")[0];
    const tasks = (user.todos || []).filter(
      t => t.deadline === today && !t.completed
    );

    res.render("today", { username, tasks });
  });
});

module.exports = router;
