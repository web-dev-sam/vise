import { ref } from "vue";
import type { Ref } from "vue";
import { validateReschedule } from "../../core/policy";
import { rescheduleAppointment } from "../../data/mutations";
import type { Appointment } from "../../core/types";

export interface RescheduleState {
  readonly start: Ref<string>;
  readonly end: Ref<string>;
  readonly error: Ref<string | null>;
  readonly submitting: Ref<boolean>;
  readonly submit: () => Promise<Appointment | null>;
}

function toLocalInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * View state for the reschedule flow. `now` is injected (the UI boundary is
 * where the clock is read) and every attempt runs the pure core rule, so the
 * violation message the user sees comes straight from the domain.
 */
export function useReschedule(appointment: Ref<Appointment>, now: () => Date): RescheduleState {
  const start = ref(toLocalInput(appointment.value.start));
  const end = ref(toLocalInput(appointment.value.end));
  const error = ref<string | null>(null);
  const submitting = ref(false);

  async function submit(): Promise<Appointment | null> {
    error.value = null;
    const result = validateReschedule(
      appointment.value,
      { start: new Date(start.value), end: new Date(end.value) },
      now(),
    );
    if (!result.ok) {
      error.value = result.error;
      return null;
    }
    submitting.value = true;
    try {
      return await rescheduleAppointment(
        appointment.value.id,
        result.value.start,
        result.value.end,
      );
    } finally {
      submitting.value = false;
    }
  }

  return { start, end, error, submitting, submit };
}
