const router = require('express').Router();
const ctrl = require('../controllers/wishlist.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);
router.get('/',             ctrl.get);
router.post('/:courseId',   ctrl.toggle);

module.exports = router;