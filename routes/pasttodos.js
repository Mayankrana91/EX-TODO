const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

const filepath2 = path.join(process.cwd(), "data", "pasttodos.json");
const filepath = path.join(process.cwd(), "data", "users.json");

// Past Todos page
router.get("/", (req, res) => {
  const username = req.session.username || "guest";

  if (username === "guest") {
    return res.render("past", { username: "guest", pastTodos: [] });
  }

  fs.readFile(filepath2, "utf8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        return res.render("past", { username, pastTodos: [] });
      }
      console.error("❌ Error reading pasttodos.json:", err);
      return res.render("past", { username, pastTodos: [] });
    }

    let pastTodos = [];
    try {
      const parsed = JSON.parse(data);
      pastTodos = Array.isArray(parsed.pastTodos) ? parsed.pastTodos : [];
    } catch (e) {
      console.error("❌ Error parsing pasttodos.json:", e);
    }

    const userPastTodos = pastTodos.filter(
      (todo) =>
        todo.username &&
        todo.username.toLowerCase().trim() === username.toLowerCase().trim()
    );

    return res.render("past", { username, pastTodos: userPastTodos });
  });
});

router.post("/restore", (req, res) => {
  const { username, taskId } = req.body;

  fs.readFile(filepath2, "utf8", (err, data) => {
    if (err) {
      console.error(" Error reading pasttodos.json:", err);
      return res.redirect("/past");
    }

    let pastTodos = [];
    try {
      pastTodos = JSON.parse(data).pastTodos || [];
    } catch (e) {
      console.error(" Error parsing pasttodos.json:", e);
      return res.redirect("/past");
    }

    const todoIndex = pastTodos.findIndex(
      (t) =>
        String(t.id) === String(taskId) &&
        t.username.toLowerCase().trim() === username.toLowerCase().trim()
    );

    if (todoIndex === -1) {
      console.warn("Restore failed: Task not found for user", username);
      return res.redirect("/past");
    }

    const restoredTodo = {
      id: pastTodos[todoIndex].id,
      text: pastTodos[todoIndex].text,
      completed: false,
    };

    pastTodos.splice(todoIndex, 1);

    fs.writeFile(filepath2, JSON.stringify({ pastTodos }, null, 2), (err) => {
      if (err) {
        console.error(" Error writing pasttodos.json:", err);
        return res.redirect("/past");
      }

      fs.readFile(filepath, "utf8", (err, data) => {
        if (err) {
          console.error(" Error reading users.json:", err);
          return res.redirect("/past");
        }

        let users = [];
        try {
          users = JSON.parse(data).users || [];
        } catch (e) {
          console.error(" Error parsing users.json:", e);
          return res.redirect("/past");
        }

        const userIndex = users.findIndex(
          (u) => u.username.toLowerCase().trim() === username.toLowerCase().trim()
        );

        users[userIndex].todos.unshift(restoredTodo);

        fs.writeFile(filepath, JSON.stringify({ users }, null, 2), (err) => {
          if (err) {
            console.error(" Error writing users.json:", err);
            return res.redirect("/past");
          }
          console.log(" Restored todo for", username, ":", restoredTodo.text);
                      return res.redirect("/past");

        });
      });
    });
  });
});

module.exports = router;
