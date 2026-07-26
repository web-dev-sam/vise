<script setup lang="ts">
import { Clock, MapPin, TriangleAlert } from "lucide-vue-next";
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
  <Card
    :class="props.conflicting ? 'border-destructive/50 ring-1 ring-destructive/20' : 'shadow-sm'"
  >
    <CardContent class="flex items-center justify-between gap-4 p-4">
      <div class="flex items-center gap-3">
        <div
          class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground"
          :class="props.conflicting ? 'bg-destructive/10 text-destructive' : ''"
        >
          <Clock class="size-5" />
        </div>
        <div class="space-y-0.5">
          <p class="font-medium">
            {{ formatDateTime(props.appointment.start) }} ·
            {{ durationMinutes(props.appointment) }} min
          </p>
          <p class="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin class="size-3.5" />
            {{ props.appointment.resourceId }}
          </p>
        </div>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <Badge v-if="props.conflicting" variant="destructive">
          <TriangleAlert />
          Conflict
        </Badge>
        <Badge :variant="VARIANT_BY_STATUS[props.appointment.status]" class="capitalize">
          {{ props.appointment.status }}
        </Badge>
      </div>
    </CardContent>
  </Card>
</template>
