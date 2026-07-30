const { z } = require("zod");

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format.");

const createScheduleSchema = z.object({
  serviceId: objectIdSchema,
  rotationMembers: z.array(objectIdSchema).min(1, "At least one rotation member is required."),
  rotationType: z.enum(["daily", "weekly"], {
    errorMap: () => ({ message: "Rotation type must be daily or weekly." }),
  }),
  startDate: z.coerce.date({ errorMap: () => ({ message: "A valid start date is required." }) }),
});

const updateScheduleSchema = z.object({
  rotationMembers: z.array(objectIdSchema).min(1).optional(),
  rotationType: z.enum(["daily", "weekly"]).optional(),
  startDate: z.coerce.date().optional(),
});

module.exports = { createScheduleSchema, updateScheduleSchema };