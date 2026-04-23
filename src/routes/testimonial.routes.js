const router = require('express').Router();
const ctrl = require('../controllers/testimonial.controller');

router.get('/', ctrl.list);

module.exports = router;