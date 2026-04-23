const { z } = require("zod");

exports.courseChatSchema = z.object({
  body: z.object({
    courseId: z.string().min(10),
    prompt: z.string().min(1),
  }),
});
