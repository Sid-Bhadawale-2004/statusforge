const { z } = require("zod");

const createServiceSchema = z.object({
  name: z.string().trim().min(1, "Service name is required.").max(100),
  description: z.string().trim().max(500).optional(),
});

const updateServiceSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional(),
  currentStatus: z.enum(["operational", "degraded", "outage"]).optional(),
});

module.exports = { createServiceSchema, updateServiceSchema };