const router = require('express').Router();
const ctrl = require('../controllers/contact.controller');

router.post('/', ctrl.create);

module.exports = router;