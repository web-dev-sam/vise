<script setup lang="ts">
import { computed } from "vue";
import { format } from "date-fns";
import { CalendarClock } from "lucide-vue-next";
import { formatDateTime } from "@shared/lib/format";
import { withDate, withTime } from "@shared/lib/date";
import { Button } from "@shared/ui/button";
import { Calendar } from "@shared/ui/calendar";
import { Input } from "@shared/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@shared/ui/popover";

const model = defineModel<Date>({ required: true });
const props = withDefaults(defineProps<{ id?: string; minuteStep?: number }>(), { minuteStep: 15 });

// The calendar edits the date; a native time field edits the time. Both write
// back into a single source-of-truth Date so the two halves never drift apart.
const timeValue = computed(() => format(model.value, "HH:mm"));

function onDateChange(value: Date): void {
  model.value = withDate(model.value, value);
}

function onTimeChange(value: string | number | undefined): void {
  if (value === undefined) return;
  const next = withTime(model.value, String(value));
  if (next) model.value = next;
}
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        :id="id"
        type="button"
        variant="outline"
        class="w-full justify-start gap-2 font-normal"
      >
        <CalendarClock class="size-4 shrink-0 opacity-70" />
        <span>{{ formatDateTime(model) }}</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0" align="start">
      <Calendar :model-value="model" @update:model-value="onDateChange" />
      <div class="border-t border-border p-3">
        <Input
          type="time"
          aria-label="Time"
          :step="minuteStep * 60"
          :model-value="timeValue"
          @update:model-value="onTimeChange"
        />
      </div>
    </PopoverContent>
  </Popover>
</template>
