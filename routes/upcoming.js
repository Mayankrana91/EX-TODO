const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
// const taskDate = todo.deadline.split("T")[0]; // normalize for comparison


const filepath = path.join(__dirname, "../data/users.json");

router.get("/", (req, res) => {
  const username = req.session.username || "guest";
  if (username === "guest") {
    return res.render("upcoming", { username, tasks: [] });
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
    if (!user) return res.render("upcoming", { username, tasks: [] });

    const now = new Date();
    const next7 = new Date();
    next7.setDate(now.getDate() + 7);

    const tasks = (user.todos || []).filter(t => {
      if (!t.deadline || t.completed) return false;
      const d = new Date(t.deadline);
      return d >= now && d <= next7;
    });

    res.render("upcoming", { username, tasks });
  });
});

module.exports = router;
