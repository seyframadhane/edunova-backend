const { z } = require('zod');

exports.signupSchema = z.object({
  body: z.object({
    firstName: z.string().min(1),
    lastName:  z.string().min(1),
    email:     z.string().email(),
    password:  z.string().min(6),
  }),
});

exports.loginSchema = z.object({
  body: z.object({
    email:    z.string().email(),
    password: z.string().min(6),
  }),
});
