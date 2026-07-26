<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { HTMLAttributes } from "vue";
import { addMonths, isSameDay, isSameMonth, startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import { cn } from "@shared/lib/utils";
import { formatDateFull, formatMonthYear } from "@shared/lib/format";
import { buttonVariants } from "@shared/ui/button";
import { monthGrid, weekdayInitials } from "./grid";

const props = defineProps<{ modelValue?: Date; class?: HTMLAttributes["class"] }>();
defineEmits<{ "update:modelValue": [value: Date] }>();

// The month on screen is seeded from the selection (or today) and then driven
// solely by the prev/next controls, so browsing other months never mutates the
// selected value. A selection arriving from outside re-centres the view.
const viewMonth = ref(startOfMonth(props.modelValue ?? new Date()));
watch(
  () => props.modelValue,
  (value) => {
    if (value) viewMonth.value = startOfMonth(value);
  },
);

const today = new Date();

interface DayCell {
  readonly date: Date;
  readonly selected: boolean;
  readonly today: boolean;
  readonly outside: boolean;
}

// Pre-compute every cell's state once per view so the template stays declarative.
const weeks = computed<DayCell[][]>(() =>
  monthGrid(viewMonth.value).map((week) =>
    week.map((date) => ({
      date,
      selected: props.modelValue != null && isSameDay(date, props.modelValue),
      today: isSameDay(date, today),
      outside: !isSameMonth(date, viewMonth.value),
    })),
  ),
);
</script>

<template>
  <div :class="cn('p-3', props.class)">
    <div class="relative flex w-full items-center justify-between pt-1">
      <button
        type="button"
        aria-label="Go to previous month"
        :class="
          cn(
            buttonVariants({ variant: 'outline' }),
            'size-7 bg-transparent p-0 opacity-60 hover:opacity-100',
          )
        "
        @click="viewMonth = addMonths(viewMonth, -1)"
      >
        <ChevronLeft class="size-4" />
      </button>
      <div class="text-sm font-medium" role="heading" aria-level="2">
        {{ formatMonthYear(viewMonth) }}
      </div>
      <button
        type="button"
        aria-label="Go to next month"
        :class="
          cn(
            buttonVariants({ variant: 'outline' }),
            'size-7 bg-transparent p-0 opacity-60 hover:opacity-100',
          )
        "
        @click="viewMonth = addMonths(viewMonth, 1)"
      >
        <ChevronRight class="size-4" />
      </button>
    </div>

    <table class="mt-4 w-full border-collapse space-y-1">
      <thead>
        <tr class="flex">
          <th
            v-for="(day, index) in weekdayInitials"
            :key="index"
            scope="col"
            class="w-8 rounded-md text-[0.8rem] font-normal text-muted-foreground"
          >
            {{ day }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="week in weeks" :key="week[0].date.getTime()" class="mt-2 flex w-full">
          <td
            v-for="cell in week"
            :key="cell.date.getTime()"
            class="relative p-0 text-center text-sm focus-within:relative focus-within:z-20"
          >
            <button
              type="button"
              :aria-label="formatDateFull(cell.date)"
              :aria-pressed="cell.selected"
              :class="
                cn(
                  buttonVariants({ variant: 'ghost' }),
                  'size-8 p-0 font-normal',
                  cell.today && !cell.selected && 'bg-accent text-accent-foreground',
                  cell.selected &&
                    'bg-primary text-primary-foreground opacity-100 hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                  cell.outside && 'text-muted-foreground opacity-50',
                )
              "
              @click="$emit('update:modelValue', cell.date)"
            >
              {{ cell.date.getDate() }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
