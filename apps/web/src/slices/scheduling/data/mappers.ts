import type { Appointment, AppointmentStatus } from "../core/types";
import type { AppointmentDto } from "./dto";

const STATUS_BY_CODE: Record<number, AppointmentStatus | undefined> = {
  0: "scheduled",
  1: "completed",
  2: "cancelled",
};
const CODE_BY_STATUS: Record<AppointmentStatus, number> = {
  scheduled: 0,
  completed: 1,
  cancelled: 2,
};

export function toAppointment(dto: AppointmentDto): Appointment {
  const status = STATUS_BY_CODE[dto.status];
  if (status === undefined) {
    throw new Error(`Unknown appointment status code: ${dto.status}`);
  }
  return {
    id: dto.id,
    clientId: dto.client_id,
    resourceId: dto.resource_id,
    status,
    start: new Date(dto.starts_at),
    end: new Date(dto.ends_at),
  };
}

export function toAppointmentDto(appointment: Appointment): AppointmentDto {
  return {
    id: appointment.id,
    client_id: appointment.clientId,
    resource_id: appointment.resourceId,
    status: CODE_BY_STATUS[appointment.status],
    starts_at: appointment.start.toISOString(),
    ends_at: appointment.end.toISOString(),
  };
}
