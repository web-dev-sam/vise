import { http, HttpResponse } from "msw";
import type { AppointmentDto } from "./dto";

// This is the fake server, so reading a clock here is legitimate — the seed is
// anchored to "now" instead of a fixed calendar date so the demo never rots.
// DEMO_DAY_OFFSET keeps the day-view cluster a couple days out: comfortably
// beyond the 24h reschedule cutoff (see core/policy.ts) so every appointment on
// it stays reschedulable, and >24h in the future no matter when it's opened.
// DayView mirrors this offset to land on the same day.
const DEMO_DAY_OFFSET = 2;
const STORAGE_KEY = "vise-appointments";

function localDayStart(base: Date, addDays: number): Date {
  const day = new Date(base);
  day.setHours(0, 0, 0, 0);
  day.setDate(day.getDate() + addDays);
  return day;
}

function at(day: Date, hours: number, minutes: number): string {
  const when = new Date(day);
  when.setHours(hours, minutes, 0, 0);
  return when.toISOString();
}

// appt-1 and appt-2 share room-1 and overlap on the demo day, so the day view
// has a real conflict to highlight. client_id / id values line up with the
// billing seed's appointment_id join.
function seedAppointments(now: Date): AppointmentDto[] {
  const demoDay = localDayStart(now, DEMO_DAY_OFFSET);
  const soonPast = localDayStart(now, -85);
  const farFuture = localDayStart(now, 30);
  return [
    {
      id: "appt-1",
      client_id: "c-ana",
      resource_id: "room-1",
      status: 0,
      starts_at: at(demoDay, 9, 0),
      ends_at: at(demoDay, 10, 0),
    },
    {
      id: "appt-2",
      client_id: "c-ana",
      resource_id: "room-1",
      status: 0,
      starts_at: at(demoDay, 9, 30),
      ends_at: at(demoDay, 10, 30),
    },
    {
      id: "appt-5",
      client_id: "c-ana",
      resource_id: "staff-jo",
      status: 0,
      starts_at: at(demoDay, 11, 0),
      ends_at: at(demoDay, 12, 0),
    },
    {
      id: "appt-3",
      client_id: "c-ben",
      resource_id: "staff-jo",
      status: 1,
      starts_at: at(soonPast, 13, 0),
      ends_at: at(soonPast, 14, 0),
    },
    {
      id: "appt-4",
      client_id: "c-ana",
      resource_id: "staff-jo",
      status: 0,
      starts_at: at(farFuture, 14, 0),
      ends_at: at(farFuture, 15, 0),
    },
  ];
}

interface StoredAppointments {
  readonly day: string;
  readonly appointments: AppointmentDto[];
}

function isStoredAppointments(value: unknown): value is StoredAppointments {
  return typeof value === "object" && value !== null && "day" in value && "appointments" in value;
}

// Persist to localStorage so a reschedule survives a reload, but key the store
// by the current calendar day: if it was seeded on an earlier day the relative
// dates are stale, so we drop it and reseed. This keeps persistence AND the
// non-rotting guarantee — edits stick within the day, freshness carries across.
const dayKey = localDayStart(new Date(), 0).toISOString();

function load(): AppointmentDto[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isStoredAppointments(parsed) && parsed.day === dayKey) return parsed.appointments;
    }
  } catch {
    /* storage unavailable or corrupt — fall through to a fresh seed */
  }
  const seeded = seedAppointments(new Date());
  save(seeded);
  return seeded;
}

function save(appointments: AppointmentDto[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ day: dayKey, appointments }));
  } catch {
    /* storage unavailable — changes stay in memory for this session */
  }
}

const appointments = load();

interface ReschedulePayload {
  starts_at: string;
  ends_at: string;
}

export const schedulingMockHandlers = [
  http.get("/api/appointments", () => HttpResponse.json(appointments)),
  http.patch<{ id: string }, ReschedulePayload, AppointmentDto>(
    "/api/appointments/:id",
    async ({ params, request }) => {
      const found = appointments.find((appointment) => appointment.id === params.id);
      if (!found) return new HttpResponse(null, { status: 404 });
      const body = await request.json();
      found.starts_at = body.starts_at;
      found.ends_at = body.ends_at;
      save(appointments);
      return HttpResponse.json(found);
    },
  ),
];
