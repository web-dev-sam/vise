<script setup lang="ts">
import { Badge } from "@shared/ui/badge";
import type { BadgeVariants } from "@shared/ui/badge";
import { Card, CardContent } from "@shared/ui/card";
import { formatDateTime } from "@shared/lib/format";
import { durationMinutes } from "../../core/rules";
import type { Appointment, AppointmentStatus } from "../../core/types";

const props = defineProps<{ appointment: Appointment; conflicting?: boolean }>();

const VARIANT_BY_STATUS: Record<AppointmentStatus, NonNullable<BadgeVariants["variant"]>> = {
  scheduled: "default",
  completed: "success",
  cancelled: "outline",
};
</script>

<template>
  <Card :class="props.conflicting ? 'border-destructive' : ''">
    <CardContent class="flex items-center justify-between p-4">
      <div>
        <p class="font-medium">
          {{ formatDateTime(props.appointment.start) }} ·
          {{ durationMinutes(props.appointment) }} min
        </p>
        <p class="text-sm text-muted-foreground">Resource: {{ props.appointment.resourceId }}</p>
      </div>
      <div class="flex items-center gap-2">
        <Badge v-if="props.conflicting" variant="destructive">Conflict</Badge>
        <Badge :variant="VARIANT_BY_STATUS[props.appointment.status]" class="capitalize">
          {{ props.appointment.status }}
        </Badge>
      </div>
    </CardContent>
  </Card>
</template>
