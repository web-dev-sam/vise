<script setup lang="ts">
import { Clock, MapPin, TriangleAlert } from "lucide-vue-next";
import { Badge } from "@shared/ui/badge";
import type { BadgeVariants } from "@shared/ui/badge";
import { Card } from "@shared/ui/card";
import { formatDateTime } from "@shared/lib/format";
import { durationMinutes } from "../../core/rules";
import type { Appointment, AppointmentStatus } from "../../core/types";

// The card owns the whole appointment row: its summary, its trailing action
// (an #action slot the view fills), and — when `active` — an in-place panel
// (the default slot) that expands under a divider. Editing never spawns a
// detached sibling card; it belongs to the appointment it edits.
defineProps<{
  appointment: Appointment;
  conflicting?: boolean;
  active?: boolean;
}>();

// Calm, tinted status colours so the badge never out-shouts the action beside
// it; the loud solid variants are reserved for genuine alerts (conflicts).
const VARIANT_BY_STATUS: Record<AppointmentStatus, NonNullable<BadgeVariants["variant"]>> = {
  scheduled: "info",
  completed: "success",
  cancelled: "muted",
};
</script>

<template>
  <Card
    :class="
      conflicting
        ? 'border-destructive/50 ring-1 ring-destructive/20'
        : active
          ? 'ring-1 ring-primary/25'
          : ''
    "
  >
    <div class="flex items-center gap-4 p-4">
      <div
        class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground"
        :class="conflicting ? 'bg-destructive/10 text-destructive' : ''"
      >
        <Clock class="size-5" />
      </div>
      <div class="min-w-0 space-y-0.5">
        <p class="font-medium">
          {{ formatDateTime(appointment.start) }} · {{ durationMinutes(appointment) }} min
        </p>
        <p class="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin class="size-3.5" />
          {{ appointment.resourceId }}
        </p>
      </div>
      <div class="ml-auto flex shrink-0 items-center gap-2">
        <Badge v-if="conflicting" variant="destructive">
          <TriangleAlert />
          Conflict
        </Badge>
        <Badge :variant="VARIANT_BY_STATUS[appointment.status]" class="capitalize">
          {{ appointment.status }}
        </Badge>
        <slot name="action" />
      </div>
    </div>
    <div v-if="active" class="border-t border-border/60 p-4">
      <slot />
    </div>
  </Card>
</template>
