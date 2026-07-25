<script lang="ts">
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        success: "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
        warning: "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;
</script>

<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@shared/lib/utils";

const props = defineProps<{
  variant?: BadgeVariants["variant"];
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <span data-slot="badge" :class="cn(badgeVariants({ variant: props.variant }), props.class)">
    <slot />
  </span>
</template>
