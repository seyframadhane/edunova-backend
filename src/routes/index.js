const router = require('express').Router();

router.use('/auth',          require('./auth.routes'));
router.use('/users',         require('./user.routes'));
router.use('/courses',       require('./course.routes'));
router.use('/instructors',   require('./instructor.routes'));
router.use('/enrollments',   require('./enrollment.routes'));
router.use('/cart',          require('./cart.routes'));
router.use('/wishlist',      require('./wishlist.routes'));
router.use('/reviews',       require('./review.routes'));
router.use('/certificates',  require('./certificate.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/coupons',       require('./coupon.routes'));
router.use('/contact',       require('./contact.routes'));
router.use('/testimonials',  require('./testimonial.routes'));
router.use("/admin", require("./admin.routes"));
router.use("/chat", require("./chat.routes"));
router.use('/ai', require('./ai.routes'));

module.exports = router;
