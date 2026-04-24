const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const { signupSchema, loginSchema } = require('../validators/auth.validator');
const { verifyToken } = require('../middleware/auth.middleware');
const { uploadAvatar, uploadCover } = require('../middleware/upload.middleware');

router.post('/signup', validate(signupSchema), ctrl.signup);
router.post('/login',  validate(loginSchema),  ctrl.login);
router.post('/refresh', ctrl.refresh);

router.post('/change-password', verifyToken, ctrl.changePassword);
router.patch('/me',              verifyToken, ctrl.updateMe);

// ✅ NEW: onboarding save
router.post('/me/onboarding', verifyToken, ctrl.completeOnboarding);

// Existing file uploads (kept)
router.post('/me/avatar', verifyToken, uploadAvatar, ctrl.uploadAvatar);
router.post('/me/cover',  verifyToken, uploadCover,  ctrl.uploadCover);

module.exports = router;