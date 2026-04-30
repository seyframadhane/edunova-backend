const router = require('express').Router();
const ctrl = require('../controllers/ai.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.post('/chat',         ctrl.chat);
router.post('/chat/stream',  ctrl.chatStream);
router.post('/summary',      ctrl.summary);
router.post('/quiz',         ctrl.quiz);
router.post('/emotion',      ctrl.logEmotion);
router.get('/emotion/stats', ctrl.emotionStats);

module.exports = router;