const User = require("../../models/User");
const Instructor = require("../../models/Instructor");
const ApiError = require("../../utils/ApiError");
const asyncHandler = require("../../utils/asyncHandler");

exports.createInstructor = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, profile } = req.body;

  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(409, "Email already registered");

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: "instructor",
  });

  const instructor = await Instructor.create({
    user: user._id,
    name: profile.name,
    role: profile.role,
    bio: profile.bio,
    image: profile.image,
    rating: 0,
    coursesCount: 0,
  });

  res.status(201).json({ success: true, data: { user, instructor } });
});

exports.listInstructors = asyncHandler(async (_req, res) => {
  const instructors = await Instructor.find().populate(
    "user",
    "firstName lastName email role"
  );
  res.json({ success: true, data: instructors });
});

exports.updateInstructor = asyncHandler(async (req, res) => {
  const instructor = await Instructor.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!instructor) throw new ApiError(404, "Instructor not found");
  res.json({ success: true, data: instructor });
});
