const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const { signupSchema, loginSchema } = require('../validators/auth.validator');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/signup',  validate(signupSchema), ctrl.signup);
router.post('/login',   validate(loginSchema),  ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/change-password', verifyToken, ctrl.changePassword);
router.patch('/me', verifyToken, ctrl.updateMe);


module.exports = router;