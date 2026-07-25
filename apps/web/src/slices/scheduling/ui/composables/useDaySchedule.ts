import { computed, onMounted, ref } from "vue";
import type { ComputedRef, Ref } from "vue";
import { fetchAppointmentsForDay } from "../../data/queries";
import { findConflicts } from "../../core/rules";
import type { Appointment, AppointmentConflict } from "../../core/types";

export interface DayScheduleState {
  readonly appointments: Ref<Appointment[]>;
  readonly conflicts: Ref<AppointmentConflict[]>;
  /** Ids involved in any conflict, for row highlighting. */
  readonly conflictIds: ComputedRef<Set<string>>;
  readonly loading: Ref<boolean>;
  readonly refresh: () => Promise<void>;
}

export function useDaySchedule(day: Ref<Date>): DayScheduleState {
  const appointments = ref<Appointment[]>([]);
  const conflicts = ref<AppointmentConflict[]>([]);
  const loading = ref(false);

  async function refresh(): Promise<void> {
    loading.value = true;
    try {
      appointments.value = await fetchAppointmentsForDay(day.value);
      conflicts.value = findConflicts(appointments.value);
    } finally {
      loading.value = false;
    }
  }

  const conflictIds = computed(() => {
    const ids = new Set<string>();
    for (const conflict of conflicts.value) {
      ids.add(conflict.firstId);
      ids.add(conflict.secondId);
    }
    return ids;
  });

  onMounted(refresh);

  return { appointments, conflicts, conflictIds, loading, refresh };
}
