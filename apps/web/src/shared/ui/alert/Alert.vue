<script lang="ts">
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

export const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg+div]:translate-y-[-3px] [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 text-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export type AlertVariants = VariantProps<typeof alertVariants>;
</script>

<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@shared/lib/utils";

const props = defineProps<{
  variant?: AlertVariants["variant"];
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <div
    data-slot="alert"
    role="alert"
    :class="cn(alertVariants({ variant: props.variant }), props.class)"
  >
    <slot />
  </div>
</template>
