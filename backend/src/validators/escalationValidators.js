const { z } = require("zod");

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format.");

const stepSchema = z.object({
  order: z.number().int().min(0),
  timeoutMinutes: z.number().int().min(1, "Timeout must be at least 1 minute."),
  notifyUserId: objectIdSchema,
});

const createPolicySchema = z.object({
  serviceId: objectIdSchema,
  steps: z.array(stepSchema).min(1, "At least one escalation step is required."),
});

const updatePolicySchema = z.object({
  steps: z.array(stepSchema).min(1).optional(),
});

module.exports = { createPolicySchema, updatePolicySchema };