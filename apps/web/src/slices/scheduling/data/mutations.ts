import { httpTransport } from "@shared/http/transport";
import type { Appointment } from "../core/types";
import { appointmentDtoSchema } from "./dto";
import { toAppointment } from "./mappers";

export async function rescheduleAppointment(
  id: string,
  start: Date,
  end: Date,
): Promise<Appointment> {
  const raw = await httpTransport.patch(`/api/appointments/${id}`, {
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
  });
  return toAppointment(appointmentDtoSchema.parse(raw));
}
