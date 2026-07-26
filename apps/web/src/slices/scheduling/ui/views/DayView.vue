<script setup lang="ts">
import { ref } from "vue";
import { CalendarDays, CalendarX, TriangleAlert } from "lucide-vue-next";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { PageHeader } from "@shared/ui/page-header";
import { formatDate } from "@shared/lib/format";
import { useDaySchedule } from "../composables/useDaySchedule";
import AppointmentCard from "../components/AppointmentCard.vue";
import RescheduleForm from "../components/RescheduleForm.vue";
import type { Appointment } from "../../core/types";

// The demo day mirrors the mock seed's offset (a couple days out, kept beyond
// the 24h reschedule cutoff) so the view lands on the seeded cluster and every
// appointment on it stays reschedulable — no fixed calendar date to go stale.
function demoDay(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 2);
  return d;
}
const day = ref(demoDay());
const { appointments, conflictIds, loading, refresh } = useDaySchedule(day);
const selectedId = ref<string | null>(null);

function toggle(appointment: Appointment): void {
  selectedId.value = selectedId.value === appointment.id ? null : appointment.id;
}

function onRescheduled(): void {
  selectedId.value = null;
  void refresh();
}
</script>

<template>
  <div class="space-y-8">
    <PageHeader title="Day schedule" :description="formatDate(day)">
      <template #icon><CalendarDays /></template>
      <template #actions>
        <Badge v-if="conflictIds.size > 0" variant="destructive">
          <TriangleAlert />
          {{ conflictIds.size }} conflicts
        </Badge>
      </template>
    </PageHeader>

    <p v-if="loading" class="text-sm text-muted-foreground">Loading…</p>
    <template v-else>
      <div
        v-if="appointments.length === 0"
        class="flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-center text-muted-foreground"
      >
        <CalendarX class="size-8 opacity-60" />
        <p class="text-sm">No appointments scheduled for this day.</p>
      </div>
      <div v-else class="space-y-3">
        <AppointmentCard
          v-for="appointment in appointments"
          :key="appointment.id"
          :appointment="appointment"
          :conflicting="conflictIds.has(appointment.id)"
          :active="selectedId === appointment.id"
        >
          <template #action>
            <Button
              v-if="appointment.status === 'scheduled' && selectedId !== appointment.id"
              variant="outline"
              size="sm"
              @click="toggle(appointment)"
            >
              Reschedule
            </Button>
          </template>
          <RescheduleForm
            v-if="selectedId === appointment.id"
            :appointment="appointment"
            @rescheduled="onRescheduled"
            @cancel="selectedId = null"
          />
        </AppointmentCard>
      </div>
    </template>
  </div>
</template>
