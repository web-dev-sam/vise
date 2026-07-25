<script setup lang="ts">
import { ref } from "vue";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
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
  <Card>
    <CardHeader>
      <CardTitle>Day schedule — {{ formatDate(day) }}</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <p v-if="loading" class="text-sm text-muted-foreground">Loading…</p>
      <template v-else>
        <p v-if="appointments.length === 0" class="text-sm text-muted-foreground">
          No appointments.
        </p>
        <div v-for="appointment in appointments" :key="appointment.id" class="space-y-2">
          <div class="flex items-start gap-2">
            <div class="flex-1">
              <AppointmentCard
                :appointment="appointment"
                :conflicting="conflictIds.has(appointment.id)"
              />
            </div>
            <Button
              v-if="appointment.status === 'scheduled'"
              variant="outline"
              size="sm"
              @click="toggle(appointment)"
            >
              Reschedule
            </Button>
          </div>
          <RescheduleForm
            v-if="selectedId === appointment.id"
            :appointment="appointment"
            class="rounded-md border p-4"
            @rescheduled="onRescheduled"
          />
        </div>
      </template>
    </CardContent>
  </Card>
</template>
