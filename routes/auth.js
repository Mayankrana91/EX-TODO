const express = require('express');
const router = express.Router();
const { verifyuser , registeruser } = require('../controllers/authcontroller');


router.get('/signup', function(req, res, next) {
      console.log("inside /signup");

  res.render('signup', { error:"",success:"" });
});
router.post('/signup', registeruser);



router.get('/login', function(req,res,next){
      console.log("inside /login");

    res.render('login',{ error:"",success:""});
});
router.post('/login', verifyuser);





router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).send("Internal Server Error");
    }
    res.redirect('/home'); 
  });
});


module.exports = router;
