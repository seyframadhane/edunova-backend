const router = require("express").Router();

const { verifyToken, requireRole } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { uploadCoursePdf } = require("../middleware/upload.middleware");

const {
  adminCourseCreateSchema,
  adminCourseUpdateSchema,
  adminInstructorCreateSchema,
  adminInstructorUpdateSchema,
  adminNotificationBroadcastSchema,
} = require("../validators/admin.validator");

const courses = require("../controllers/admin/adminCourses.controller");
const instructors = require("../controllers/admin/adminInstructors.controller");
const notifications = require("../controllers/admin/adminNotifications.controller");

// protect all admin routes
router.use(verifyToken, requireRole("admin"));

// Courses
router.post("/courses", uploadCoursePdf, validate(adminCourseCreateSchema), courses.createCourse);
router.get("/courses", courses.listCourses);
router.get("/courses/:id", courses.getCourse);
router.patch("/courses/:id", validate(adminCourseUpdateSchema), courses.updateCourse);
router.delete("/courses/:id", courses.deleteOrUnpublishCourse);

// Instructors
router.post("/instructors", validate(adminInstructorCreateSchema), instructors.createInstructor);
router.get("/instructors", instructors.listInstructors);
router.patch("/instructors/:id", validate(adminInstructorUpdateSchema), instructors.updateInstructor);

// Notifications
router.post(
  "/notifications/broadcast",
  validate(adminNotificationBroadcastSchema),
  notifications.broadcastNotification
);

module.exports = router;
