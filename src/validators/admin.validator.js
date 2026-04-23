const { z } = require('zod');

// ---------------- Courses ----------------
exports.adminCourseCreateSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    description: z.string().optional(),
    image: z.string().url().optional(),

    category: z.string().min(2),
    topics: z.array(z.string()).optional(),
    level: z.enum(["Beginner", "Intermediate", "Advanced"]),

    instructor: z.string().min(10), // Instructor _id

    price: z.number().min(0),
    oldPrice: z.number().min(0).optional(),
    isFree: z.boolean().optional(),

    durationHours: z.number().min(0).optional(),
    unitsCount: z.number().min(0).optional(),
    modulesCount: z.number().min(0).optional(),

    isTrending: z.boolean().optional(),
    isPublished: z.boolean().optional(),

    // content
    contentType: z.enum(["pdf", "video", "mixed"]).default("pdf"),
    videoUrl: z.string().url().optional(),
    // pdfUrl is NOT needed here - it will be generated from uploaded file
  }),
});

exports.adminCourseUpdateSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    image: z.string().url().optional(),

    category: z.string().min(2).optional(),
    topics: z.array(z.string()).optional(),
    level: z.enum(["Beginner", "Intermediate", "Advanced"]).optional(),

    instructor: z.string().min(10).optional(),
    price: z.number().min(0).optional(),
    oldPrice: z.number().min(0).optional(),
    isFree: z.boolean().optional(),

    durationHours: z.number().min(0).optional(),
    unitsCount: z.number().min(0).optional(),
    modulesCount: z.number().min(0).optional(),

    isTrending: z.boolean().optional(),
    isPublished: z.boolean().optional(),

    contentType: z.enum(["pdf", "video", "mixed"]).optional(),
    pdfUrl: z.string().url().optional(),
    videoUrl: z.string().url().optional(),
  }),
});

// ---------------- Instructors ----------------
exports.adminInstructorCreateSchema = z.object({
  body: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),

    profile: z.object({
      name: z.string().min(2),
      role: z.string().optional(),
      bio: z.string().optional(),
      image: z.string().url().optional(),
    }),
  }),
});

exports.adminInstructorUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    role: z.string().optional(),
    bio: z.string().optional(),
    image: z.string().url().optional(),
    rating: z.number().min(0).max(5).optional(),
    coursesCount: z.number().min(0).optional(),
  }).strict(),
});

// ---------------- Notifications ----------------
exports.adminNotificationBroadcastSchema = z.object({
  body: z.object({
    audience: z.enum(["all", "enrolled_in_course", "single_user"]),
    userId: z.string().optional(),
    courseId: z.string().optional(),

    type: z.enum(["course_upload", "resume", "coupon", "discount", "system"]).default("system"),
    title: z.string().min(2),
    description: z.string().min(2),

    icon: z.string().optional(),
    link: z.string().optional(),
  }).superRefine((val, ctx) => {
    if (val.audience === "single_user" && !val.userId) {
      ctx.addIssue({ code: "custom", path: ["userId"], message: "userId is required" });
    }
    if (val.audience === "enrolled_in_course" && !val.courseId) {
      ctx.addIssue({ code: "custom", path: ["courseId"], message: "courseId is required" });
    }
  }),
});
