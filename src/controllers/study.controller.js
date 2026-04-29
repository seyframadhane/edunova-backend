const Course = require("../models/Course");
const Module = require("../models/Module");
const Lesson = require("../models/Lesson");
const Enrollment = require("../models/Enrollment");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const getUserId = (req) => {
	return req.user?.sub || req.user?._id || req.user?.id;
};

exports.getStudyCourse = asyncHandler(async (req, res) => {
	const userId = getUserId(req);
	const { courseId } = req.params;

	if (!userId) {
		throw new ApiError(401, "Authentication required");
	}

	const course = await Course.findById(courseId).populate("instructor").lean();

	if (!course) {
		throw new ApiError(404, "Course not found");
	}

	let enrollment = await Enrollment.findOne({
		user: userId,
		course: courseId,
	});

	if (!enrollment) {
		enrollment = await Enrollment.create({
			user: userId,
			course: courseId,
			progress: 0,
			completedLessons: [],
			status: "active",
		});
	}

	const modules = await Module.find({ course: courseId }).sort("order").lean();

	const moduleIds = modules.map((module) => module._id);

	const lessons = await Lesson.find({
		module: { $in: moduleIds },
	})
		.sort("order")
		.lean();

	const modulesWithLessons = modules.map((module) => {
		const moduleLessons = lessons
			.filter((lesson) => String(lesson.module) === String(module._id))
			.map((lesson) => ({
				...lesson,
				isCompleted: enrollment.completedLessons.some(
					(completedLessonId) =>
						String(completedLessonId) === String(lesson._id)
				),
			}));

		return {
			...module,
			lessons: moduleLessons,
			lessonsCount: moduleLessons.length,
			durationMinutes: moduleLessons.reduce(
				(total, lesson) => total + (lesson.durationMinutes || 0),
				0
			),
		};
	});

	const totalLessons = lessons.length;
	const completedLessons = enrollment.completedLessons.length;

	const progress =
		totalLessons > 0
			? Math.round((completedLessons / totalLessons) * 100)
			: 0;

	enrollment.progress = progress;

	if (progress >= 100) {
		enrollment.status = "completed";
		enrollment.completedAt = enrollment.completedAt || new Date();
	}

	await enrollment.save();

	res.json({
		success: true,
		data: {
			course: {
				...course,
				modules: modulesWithLessons,
			},
			enrollment,
			progress,
			totalLessons,
			completedLessons,
		},
	});
});

exports.completeLesson = asyncHandler(async (req, res) => {
	const userId = getUserId(req);
	const { courseId, lessonId } = req.params;

	if (!userId) {
		throw new ApiError(401, "Authentication required");
	}

	const course = await Course.findById(courseId).lean();

	if (!course) {
		throw new ApiError(404, "Course not found");
	}

	const lesson = await Lesson.findById(lessonId).lean();

	if (!lesson) {
		throw new ApiError(404, "Lesson not found");
	}

	let enrollment = await Enrollment.findOne({
		user: userId,
		course: courseId,
	});

	if (!enrollment) {
		enrollment = await Enrollment.create({
			user: userId,
			course: courseId,
			progress: 0,
			completedLessons: [],
			status: "active",
		});
	}

	const alreadyCompleted = enrollment.completedLessons.some(
		(completedLessonId) => String(completedLessonId) === String(lessonId)
	);

	if (!alreadyCompleted) {
		enrollment.completedLessons.push(lessonId);
	}

	const modules = await Module.find({ course: courseId }).select("_id").lean();

	const totalLessons = await Lesson.countDocuments({
		module: { $in: modules.map((module) => module._id) },
	});

	const completedLessons = enrollment.completedLessons.length;

	enrollment.progress =
		totalLessons > 0
			? Math.round((completedLessons / totalLessons) * 100)
			: 0;

	if (enrollment.progress >= 100) {
		enrollment.status = "completed";
		enrollment.completedAt = enrollment.completedAt || new Date();
	}

	await enrollment.save();

	res.json({
		success: true,
		message: "Lesson completed",
		data: {
			enrollment,
			progress: enrollment.progress,
			completedLessons,
			totalLessons,
		},
	});
});

exports.uncompleteLesson = asyncHandler(async (req, res) => {
	const userId = getUserId(req);
	const { courseId, lessonId } = req.params;

	if (!userId) {
		throw new ApiError(401, "Authentication required");
	}

	const enrollment = await Enrollment.findOne({
		user: userId,
		course: courseId,
	});

	if (!enrollment) {
		throw new ApiError(404, "Enrollment not found");
	}

	enrollment.completedLessons = enrollment.completedLessons.filter(
		(completedLessonId) => String(completedLessonId) !== String(lessonId)
	);

	const modules = await Module.find({ course: courseId }).select("_id").lean();

	const totalLessons = await Lesson.countDocuments({
		module: { $in: modules.map((module) => module._id) },
	});

	const completedLessons = enrollment.completedLessons.length;

	enrollment.progress =
		totalLessons > 0
			? Math.round((completedLessons / totalLessons) * 100)
			: 0;

	enrollment.status = "active";
	enrollment.completedAt = undefined;

	await enrollment.save();

	res.json({
		success: true,
		message: "Lesson marked incomplete",
		data: {
			enrollment,
			progress: enrollment.progress,
			completedLessons,
			totalLessons,
		},
	});
});