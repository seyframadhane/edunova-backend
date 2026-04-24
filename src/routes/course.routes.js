const router = require('express').Router();
const ctrl = require('../controllers/course.controller');
const { verifyToken, requireRole, optionalAuth } = require('../middleware/auth.middleware');
const { uploadCoursePdf, uploadCourseVideo } = require('../middleware/upload.middleware');

router.get('/', ctrl.list);

// ✅ NEW — must come BEFORE the /:id route
router.get('/recommended', verifyToken, ctrl.recommended);

router.get('/:id', optionalAuth || ((req, _res, next) => next()), ctrl.detail);

router.post('/',      verifyToken, requireRole('admin', 'instructor'), ctrl.create);
router.patch('/:id',  verifyToken, requireRole('admin', 'instructor'), ctrl.update);
router.delete('/:id', verifyToken, requireRole('admin'),                ctrl.remove);

router.post('/:id/pdf',   verifyToken, requireRole('admin', 'instructor'), uploadCoursePdf,   ctrl.uploadPdf);
router.post('/:id/video', verifyToken, requireRole('admin', 'instructor'), uploadCourseVideo, ctrl.uploadVideo);

module.exports = router;