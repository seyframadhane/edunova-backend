const { z } = require('zod');

exports.createCourseSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    image: z.string().url().optional(),
    category: z.string().min(1),
    topics: z.array(z.string()).optional(),
    level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
    instructor: z.string().min(1),
    price: z.number().min(0),
    oldPrice: z.number().min(0).optional(),
    isFree: z.boolean().optional(),
    durationHours: z.number().min(0).optional(),
  }),
});

exports.updateCourseSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: exports.createCourseSchema.shape.body.partial(),
});