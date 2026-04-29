const router = require("express").Router();
const ctrl = require("../controllers/study.controller");
const { verifyToken } = require("../middleware/auth.middleware");

router.get("/:courseId", verifyToken, ctrl.getStudyCourse);

router.patch(
	"/:courseId/lessons/:lessonId/complete",
	verifyToken,
	ctrl.completeLesson
);

router.patch(
	"/:courseId/lessons/:lessonId/uncomplete",
	verifyToken,
	ctrl.uncompleteLesson
);

module.exports = router;