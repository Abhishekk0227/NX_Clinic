const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const authenticate = require('../middleware/auth');

router.post('/login', AuthController.login);
router.get('/me', authenticate, AuthController.me);
router.post('/switch-branch', authenticate, AuthController.switchBranch);

module.exports = router;
