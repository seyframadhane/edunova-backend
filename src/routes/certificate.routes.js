const router = require('express').Router();
const ctrl = require('../controllers/certificate.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);
router.get('/me', ctrl.mine);
router.get('/:id', ctrl.getById);
router.post('/claim', ctrl.claim);

module.exports = router;