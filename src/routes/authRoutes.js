const router = require('express').Router();
const { register, login, forgotPassword, resetPassword } = require('../controllers/authController');

router.post('/register', register);          // REQ-1,2
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
