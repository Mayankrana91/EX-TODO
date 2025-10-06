const express = require('express');
const router = express.Router();
const homecontroller = require('../controllers/homecontroller');

router.get('/', homecontroller.getHome);
router.post('/add', homecontroller.addTask);
router.post('/toggle', homecontroller.toggleTask);
router.post('/delete', homecontroller.deleteTask);
router.post('/edit', homecontroller.editTask);
module.exports = router;
