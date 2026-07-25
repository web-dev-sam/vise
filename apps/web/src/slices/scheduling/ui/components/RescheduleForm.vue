<script setup lang="ts">
import { toRef } from "vue";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { useReschedule } from "../composables/useReschedule";
import type { Appointment } from "../../core/types";

const props = defineProps<{ appointment: Appointment }>();
const emit = defineEmits<{ rescheduled: [appointment: Appointment] }>();

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
  <form class="space-y-3" @submit.prevent="onSubmit">
    <div class="grid gap-1.5">
      <Label for="reschedule-start">New start</Label>
      <Input id="reschedule-start" v-model="start" type="datetime-local" />
    </div>
    <div class="grid gap-1.5">
      <Label for="reschedule-end">New end</Label>
      <Input id="reschedule-end" v-model="end" type="datetime-local" />
    </div>
    <Alert v-if="error" variant="destructive">
      <AlertTitle>Cannot reschedule</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>
    <Button type="submit" size="sm" :disabled="submitting">Save new time</Button>
  </form>
</template>
