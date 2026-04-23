const router = require('express').Router();
const ctrl = require('../controllers/instructor.controller');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');

router.get('/',    ctrl.list);
router.get('/:id', ctrl.detail);
router.post('/',   verifyToken, requireRole('admin'), ctrl.create);

module.exports = router;