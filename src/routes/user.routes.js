const router = require('express').Router();
const ctrl = require('../controllers/user.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);
router.get('/me',    ctrl.me);
router.patch('/me',  ctrl.updateMe);

module.exports = router;