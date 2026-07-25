<script setup lang="ts">
import { computed } from "vue";
import { Badge } from "@shared/ui/badge";
import type { BadgeVariants } from "@shared/ui/badge";
import type { InvoiceStatus } from "../../core/types";

const props = defineProps<{ status: InvoiceStatus; overdue?: boolean }>();

// Static, string-keyed lookup → Record (not a Map).
const VARIANT_BY_STATUS: Record<InvoiceStatus, NonNullable<BadgeVariants["variant"]>> = {
  draft: "secondary",
  issued: "default",
  paid: "success",
  void: "outline",
};

const variant = computed<NonNullable<BadgeVariants["variant"]>>(() =>
  props.overdue ? "destructive" : VARIANT_BY_STATUS[props.status],
);
const label = computed(() => (props.overdue ? "overdue" : props.status));
</script>

<template>
  <Badge :variant="variant" class="capitalize">{{ label }}</Badge>
</template>
