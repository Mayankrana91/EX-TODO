const fs = require("node:fs");
const path = require("path");
const { register } = require("node:module");


const verifyuser = (req,res,next) =>{
  const authuser = req.body;
  console.log("now verifying");

  const filepath = path.join(__dirname,"../data/users.json");

  fs.readFile(filepath,"utf-8",(err,data)=>{
    if(err){
      console.error("error in user.json",err);
      return res.status(500).send("internal error ")
    }

    let users = [];
    try{
      users = JSON.parse(data).users || [];   
    }
    catch(parseErr){
      console.error("parsing error in user.json");
      return res.status(500).send("internal error ");
    }
    const user = users.find(
      (usr)=>
        usr.email == authuser.email && usr.password == authuser.password
    );
if (user) {
      
      console.log("User verified:", user.username);
    req.session.username = user.username;  

    return res.redirect('/home');         
     

    } else {
      return res.render("login", { success: "", error: "Wrong credentials" });
    }
  });
};
  




const registeruser = (req,res,next) =>{
  const newuser = req.body;

  const filepath = path.join(__dirname,"../data/users.json");

  fs.readFile(filepath,"utf-8",(err,data)=>{
    let users = [];

    if(!err && data){
      try{
        users = JSON.parse(data).users || [];
      }
      catch(parseErr){
        console.error("parsing error in user.json");
        return res.status(500).send("internal error ");
      }
    }

    if (users.find((usr) => usr.email === newuser.email || usr.username === newuser.username)) {
      return res.render("signup", { error: "Username already taken", success:"" });
    }

 
    newuser.todos = [];

    users.push(newuser);

    fs.writeFile(filepath,JSON.stringify({users},null,2),(err)=>{
      if(err){
        console.error("Error writing users.json:", err);
        return res.status(500).send("Internal Server Error");
      }
      console.log("User registered:", newuser.username);
      return res.render("login", {error:"", success: "Signup successful! Please log in."});
    });
  });
}


















module.exports = { verifyuser,registeruser };
