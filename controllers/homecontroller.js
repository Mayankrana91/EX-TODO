const fs = require("fs");
const path = require("path");

const filepath = path.join(__dirname, "../data/users.json");


const getHome = (req, res) => {
  const username = req.session.username || "guest"; 
  console.log("Inside getHome, username =", username);

  if (username === "guest") {
   
    return res.render("home", { username : "guest", todos: [] });
  }
  fs.readFile(filepath, "utf-8", (err, data) => {
    if (err) {
      console.error("Read file error:", err);
      return res.status(500).send("Internal Server Error");
    }

    let users = [];
    try {
      const parsed = JSON.parse(data);
      users = Array.isArray(parsed.users) ? parsed.users : [];
    } catch (err) {
      console.error("JSON parse error:", err);
      return res.status(500).send("Internal Server Error");
    }

    const user = users.find(u => u.username === username);
    if (!user) {
      console.error("User not found:", username);
      return res.status(404).send("User not found");
    }

    const todos = Array.isArray(user.todos) ? user.todos : [];
    console.log("Rendering home with todos:", todos);
    res.render("home", { username, todos });
  });
};


const addTask = (req, res) => {
  const { username, task } = req.body;
  if (!task) return res.redirect(`/home?username=${username}`);

  fs.readFile(filepath, "utf-8", (err, data) => {
    if (err) return res.status(500).send("Internal Server Error");

    let users = [];
    try {
      users = JSON.parse(data).users || [];
    } catch {
      return res.status(500).send("Internal Server Error");
    }

    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex === -1) return res.redirect(`/home?username=${username}`);

    const newTask = { id: Date.now(), text: task, completed: false };
    users[userIndex].todos = users[userIndex].todos || [];
    users[userIndex].todos.push(newTask);

    fs.writeFile(filepath, JSON.stringify({ users }, null, 2), err => {
      if (err) return res.status(500).send("Internal Server Error");
      res.redirect(`/home?username=${username}`);
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
    if (userIndex === -1) return res.redirect(`/home?username=${username}`);

    const todo = users[userIndex].todos.find(t => t.id == taskId);
    if (todo) todo.completed = !todo.completed;

    fs.writeFile(filepath, JSON.stringify({ users }, null, 2), err => {
      if (err) return res.status(500).send("Internal Server Error");
      res.redirect(`/home?username=${username}`);
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
    if (userIndex === -1) return res.redirect(`/home?username=${username}`);

    users[userIndex].todos = users[userIndex].todos.filter(t => t.id != taskId);

    fs.writeFile(filepath, JSON.stringify({ users }, null, 2), err => {
      if (err) return res.status(500).send("Internal Server Error");
      res.redirect(`/home?username=${username}`);
    });
  });
};


module.exports = { getHome, addTask, toggleTask, deleteTask };