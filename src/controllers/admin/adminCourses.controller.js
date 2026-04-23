const Course = require("../../models/Course");
const ApiError = require("../../utils/ApiError");
const asyncHandler = require("../../utils/asyncHandler");
const mongoose = require("mongoose");

exports.createCourse = asyncHandler(async (req, res) => {
  const courseData = req.body;

  // Validate instructor field is a valid MongoDB ObjectId
  if (!courseData.instructor) {
    throw new ApiError(400, "Instructor ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(courseData.instructor)) {
    throw new ApiError(400, `Invalid instructor ID. Must be a valid MongoDB ObjectId, got: "${courseData.instructor}"`);
  }

  // If a PDF file was uploaded, generate the URL
  if (req.file) {
    courseData.pdfUrl = `/uploads/pdfs/${req.file.filename}`;
  }

  // Validate that if contentType is pdf, we have a pdfUrl (either uploaded or provided)
  if (courseData.contentType === 'pdf' && !courseData.pdfUrl) {
    throw new ApiError(400, 'PDF file is required when contentType is pdf');
  }

  const course = await Course.create(courseData);
  res.status(201).json({ success: true, data: course });
});

exports.updateCourse = asyncHandler(async (req, res) => {
  const updateData = req.body;

  // Validate instructor field if provided and is a valid MongoDB ObjectId
  if (updateData.instructor && !mongoose.Types.ObjectId.isValid(updateData.instructor)) {
    throw new ApiError(400, `Invalid instructor ID. Must be a valid MongoDB ObjectId, got: "${updateData.instructor}"`);
  }

  const course = await Course.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!course) throw new ApiError(404, "Course not found");
  res.json({ success: true, data: course });
});

// safer than delete: unpublish
exports.deleteOrUnpublishCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndUpdate(
    req.params.id,
    { isPublished: false },
    { new: true }
  );
  if (!course) throw new ApiError(404, "Course not found");
  res.json({ success: true, data: course });
});

exports.listCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find().populate("instructor");
  res.json({ success: true, data: courses });
});

exports.getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).populate("instructor");
  if (!course) throw new ApiError(404, "Course not found");
  res.json({ success: true, data: course });
});
