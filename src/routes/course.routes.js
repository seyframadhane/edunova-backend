// const router = require('express').Router();
// const ctrl = require('../controllers/course.controller');
// const { verifyToken, requireRole } = require('../middleware/auth.middleware');

// router.get('/',       ctrl.list);
// router.get('/:id',    ctrl.detail);
// router.post('/',      verifyToken, requireRole('admin','instructor'), ctrl.create);
// router.patch('/:id',  verifyToken, requireRole('admin','instructor'), ctrl.update);
// router.delete('/:id', verifyToken, requireRole('admin'),              ctrl.remove);

// module.exports = router;

const router = require('express').Router();
const ctrl = require('../controllers/course.controller');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { uploadCoursePdf } = require('../middleware/upload.middleware');

router.get('/', ctrl.list);
router.get('/:id', ctrl.detail);

router.post('/', verifyToken, requireRole('admin','instructor'), ctrl.create);
router.patch('/:id', verifyToken, requireRole('admin','instructor'), ctrl.update);
router.delete('/:id', verifyToken, requireRole('admin'), ctrl.remove);

// ✅ NEW: upload PDF to a course (admin/instructor)
router.post(
  '/:id/pdf',
  verifyToken,
  requireRole('admin', 'instructor'),
  uploadCoursePdf,
  ctrl.uploadPdf
);

module.exports = router;
