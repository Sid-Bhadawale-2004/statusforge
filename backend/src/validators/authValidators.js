const { z } = require("zod");

const emailSchema = z.string().trim().toLowerCase().email("Please provide a valid email address.");
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be at most 72 characters.");

const signupSchema = z.object({
  orgName: z.string().trim().min(1, "Organization name is required.").max(100),
  name: z.string().trim().min(1, "Name is required.").max(100),
  email: emailSchema,
  password: passwordSchema,
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

const resetPasswordSchema = z.object({
  newPassword: passwordSchema,
});

const setPasswordSchema = z.object({
  newPassword: passwordSchema,
});

const googleAuthSchema = z.object({
  credential: z.string().min(1, "Google credential is required."),
});

module.exports = {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  setPasswordSchema,
  googleAuthSchema,
};