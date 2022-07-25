const express = require('express');
const router = express.Router();


const UserController = require("../controllers/userController.js");

router.post('/register', UserController.createUser);
router.post('/login', UserController.loginUser);
router.get('/user/:userId/profile', UserController.getUser);
router.put('/user/:userId/profile', UserController.updateProfile);

module.exports = router;