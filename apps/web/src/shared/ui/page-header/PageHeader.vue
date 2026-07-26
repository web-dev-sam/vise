<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@shared/lib/utils";

// Generic, domain-free page heading: a leading icon slot, a title + optional
// description, and a trailing actions slot. Views compose it; it names no domain.
const props = defineProps<{
  title: string;
  description?: string;
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <div
    :class="cn('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', props.class)"
  >
    <div class="flex items-center gap-3.5">
      <div
        v-if="$slots.icon"
        class="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary [&_svg]:size-5.5"
      >
        <slot name="icon" />
      </div>
      <div class="space-y-1">
        <h1 class="text-2xl font-semibold tracking-tight">{{ title }}</h1>
        <p v-if="description" class="text-sm text-muted-foreground">{{ description }}</p>
      </div>
    </div>
    <div v-if="$slots.actions" class="flex items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
