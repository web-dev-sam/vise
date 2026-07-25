import { z } from "zod";
import { isSameDay } from "date-fns";
import { httpTransport } from "@shared/http/transport";
import { summarizeAppointment } from "../core/rules";
import type { Appointment, AppointmentSummary } from "../core/types";
import { appointmentDtoSchema } from "./dto";
import { toAppointment } from "./mappers";

export async function fetchAppointments(): Promise<Appointment[]> {
  const raw = await httpTransport.get<unknown>("/api/appointments");
  return z.array(appointmentDtoSchema).parse(raw).map(toAppointment);
}

export async function fetchAppointmentsForDay(day: Date): Promise<Appointment[]> {
  const appointments = await fetchAppointments();
  return appointments
    .filter((appointment) => isSameDay(appointment.start, day))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** Public read model: a client's future, still-scheduled appointments. */
export async function fetchUpcomingAppointments(
  clientId: string,
  now: Date,
): Promise<AppointmentSummary[]> {
  const appointments = await fetchAppointments();
  return appointments
    .filter(
      (appointment) =>
        appointment.clientId === clientId &&
        appointment.status === "scheduled" &&
        appointment.start.getTime() > now.getTime(),
    )
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .map(summarizeAppointment);
}

/**
 * Public read model used by billing to show the appointment each invoice was
 * generated from. Billing calls this through @slices/scheduling only.
 */
export async function fetchAppointmentSummaries(
  ids: readonly string[],
): Promise<AppointmentSummary[]> {
  const wanted = new Set(ids);
  const appointments = await fetchAppointments();
  return appointments.filter((appointment) => wanted.has(appointment.id)).map(summarizeAppointment);
}
