const { z } = require("zod");

const inviteTeammateSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  email: z.string().trim().toLowerCase().email("Please provide a valid email address."),
  role: z.enum(["admin", "responder", "viewer"], {
    errorMap: () => ({ message: "Role must be admin, responder, or viewer." }),
  }),
});

module.exports = { inviteTeammateSchema };