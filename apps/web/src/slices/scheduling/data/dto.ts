import { z } from "zod";

/**
 * SERVER SHAPES for scheduling. snake_case keys, ISO date strings, integer
 * status enum — structurally different from core so the mapper is real. Must
 * never escape data/.
 */
export const appointmentDtoSchema = z.object({
  id: z.string(),
  client_id: z.string(),
  resource_id: z.string(),
  status: z.number().int().min(0).max(2), // 0 scheduled, 1 completed, 2 cancelled
  starts_at: z.string(),
  ends_at: z.string(),
});

export type AppointmentDto = z.infer<typeof appointmentDtoSchema>;
