import { http, HttpResponse } from "msw";
import type { AppointmentDto } from "./dto";

// Server-shaped seed. appt-1 and appt-2 share room-1 and overlap on 2026-07-25,
// so the day view has a real conflict to highlight. client_id / id values line
// up with the billing seed.
const appointments: AppointmentDto[] = [
  {
    id: "appt-1",
    client_id: "c-ana",
    resource_id: "room-1",
    status: 0,
    starts_at: "2026-07-25T09:00:00.000Z",
    ends_at: "2026-07-25T10:00:00.000Z",
  },
  {
    id: "appt-2",
    client_id: "c-ana",
    resource_id: "room-1",
    status: 0,
    starts_at: "2026-07-25T09:30:00.000Z",
    ends_at: "2026-07-25T10:30:00.000Z",
  },
  {
    id: "appt-5",
    client_id: "c-ana",
    resource_id: "staff-jo",
    status: 0,
    starts_at: "2026-07-25T11:00:00.000Z",
    ends_at: "2026-07-25T12:00:00.000Z",
  },
  {
    id: "appt-3",
    client_id: "c-ben",
    resource_id: "staff-jo",
    status: 1,
    starts_at: "2026-05-02T13:00:00.000Z",
    ends_at: "2026-05-02T14:00:00.000Z",
  },
  {
    id: "appt-4",
    client_id: "c-ana",
    resource_id: "staff-jo",
    status: 0,
    starts_at: "2026-08-20T14:00:00.000Z",
    ends_at: "2026-08-20T15:00:00.000Z",
  },
];

interface ReschedulePayload {
  starts_at: string;
  ends_at: string;
}

export const schedulingMockHandlers = [
  http.get("/api/appointments", () => HttpResponse.json(appointments)),
  http.patch("/api/appointments/:id", async ({ params, request }) => {
    const found = appointments.find((appointment) => appointment.id === params.id);
    if (!found) return new HttpResponse(null, { status: 404 });
    const body = (await request.json()) as ReschedulePayload;
    found.starts_at = body.starts_at;
    found.ends_at = body.ends_at;
    return HttpResponse.json(found);
  }),
];
