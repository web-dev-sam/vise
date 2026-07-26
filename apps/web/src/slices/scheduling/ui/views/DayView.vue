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

// A fixed demo day whose seed contains a room double-booking.
const day = ref(new Date("2026-07-25T00:00:00Z"));
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
      <div v-else class="space-y-4">
        <div v-for="appointment in appointments" :key="appointment.id" class="space-y-2">
          <div class="flex items-start gap-3">
            <div class="flex-1">
              <AppointmentCard
                :appointment="appointment"
                :conflicting="conflictIds.has(appointment.id)"
              />
            </div>
            <Button
              v-if="appointment.status === 'scheduled'"
              :variant="selectedId === appointment.id ? 'secondary' : 'outline'"
              size="sm"
              @click="toggle(appointment)"
            >
              Reschedule
            </Button>
          </div>
          <RescheduleForm
            v-if="selectedId === appointment.id"
            :appointment="appointment"
            class="rounded-xl border border-border/70 bg-muted/30 p-4"
            @rescheduled="onRescheduled"
          />
        </div>
      </div>
    </template>
  </div>
</template>
