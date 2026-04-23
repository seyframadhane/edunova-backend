const router = require('express').Router();
const ctrl = require('../controllers/enrollment.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);
router.get('/me',               ctrl.myEnrollments);
router.post('/',                ctrl.enroll);
router.patch('/:id/progress',   ctrl.updateProgress);

module.exports = router;