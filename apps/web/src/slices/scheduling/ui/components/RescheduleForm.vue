<script setup lang="ts">
import { toRef } from "vue";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { DateTimePicker } from "@shared/ui/date-time-picker";
import { Label } from "@shared/ui/label";
import { useReschedule } from "../composables/useReschedule";
import type { Appointment } from "../../core/types";

const props = defineProps<{ appointment: Appointment }>();
const emit = defineEmits<{
  rescheduled: [appointment: Appointment];
  cancel: [];
}>();

const { start, end, error, submitting, submit } = useReschedule(
  toRef(props, "appointment"),
  () => new Date(),
);

async function onSubmit(): Promise<void> {
  const updated = await submit();
  if (updated) emit("rescheduled", updated);
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="onSubmit">
    <div class="grid gap-4 sm:grid-cols-2">
      <div class="grid gap-1.5">
        <Label for="reschedule-start">New start</Label>
        <DateTimePicker id="reschedule-start" v-model="start" />
      </div>
      <div class="grid gap-1.5">
        <Label for="reschedule-end">New end</Label>
        <DateTimePicker id="reschedule-end" v-model="end" />
      </div>
    </div>
    <Alert v-if="error" variant="destructive">
      <AlertTitle>Cannot reschedule</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>
    <div class="flex items-center gap-2">
      <Button type="submit" size="sm" :disabled="submitting">Save new time</Button>
      <Button type="button" variant="ghost" size="sm" @click="emit('cancel')">Cancel</Button>
    </div>
  </form>
</template>
