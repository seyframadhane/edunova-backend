const router = require('express').Router();
const ctrl = require('../controllers/notification.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);
router.get('/',             ctrl.list);
router.patch('/:id/read',   ctrl.markRead);

module.exports = router;