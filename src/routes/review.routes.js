const router = require('express').Router();
const ctrl = require('../controllers/review.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/course/:id', ctrl.forCourse);
router.post('/',          verifyToken, ctrl.create);

module.exports = router;