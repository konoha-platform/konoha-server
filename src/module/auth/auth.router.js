const router = require('express').Router();

const authController = require('./auth.controller');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/auto-login', authController.autoLogin);

module.exports = router;
