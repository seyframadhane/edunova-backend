const router = require('express').Router();
const ctrl = require('../controllers/cart.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);
router.get('/',             ctrl.get);
router.post('/',            ctrl.add);
router.delete('/:courseId', ctrl.remove);
router.post('/checkout',    ctrl.checkout);

module.exports = router;