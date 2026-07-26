<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { CalendarClock, LayoutDashboard, ReceiptText } from "lucide-vue-next";
import { Badge } from "@shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { PageHeader } from "@shared/ui/page-header";
import { formatDateTime, formatMoney } from "@shared/lib/format";
// The ONE legitimate cross-slice composition: which slices appear together is
// an app concern. This view imports ONLY the public surfaces of billing and
// scheduling — never their core/ or data/.
import { fetchUnpaidInvoiceSummaries } from "@slices/billing";
import type { InvoiceSummary } from "@slices/billing";
import { fetchUpcomingAppointments } from "@slices/scheduling";
import type { AppointmentSummary } from "@slices/scheduling";

const clientId = "c-ana";
const invoices = ref<InvoiceSummary[]>([]);
const appointments = ref<AppointmentSummary[]>([]);

const outstandingMinor = computed(() =>
  invoices.value.reduce((total, invoice) => total + invoice.totalMinor, 0),
);
const currency = computed(() => invoices.value[0]?.currency ?? "USD");

onMounted(async () => {
  const now = new Date();
  invoices.value = await fetchUnpaidInvoiceSummaries(clientId, now);
  appointments.value = await fetchUpcomingAppointments(clientId, now);
});
</script>

<template>
  <div class="space-y-8">
    <PageHeader title="Client overview" description="Outstanding balance and upcoming visits.">
      <template #icon><LayoutDashboard /></template>
      <template #actions>
        <Badge variant="secondary" class="font-mono">{{ clientId }}</Badge>
      </template>
    </PageHeader>

    <div class="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader
          class="flex-row items-center justify-between space-y-0 border-b border-border/60 pb-4"
        >
          <div class="flex items-center gap-2.5">
            <ReceiptText class="size-4 text-muted-foreground" />
            <CardTitle>Unpaid invoices</CardTitle>
          </div>
          <span class="text-lg font-semibold tabular-nums">
            {{ formatMoney(outstandingMinor, currency) }}
          </span>
        </CardHeader>
        <CardContent class="pt-2">
          <p v-if="invoices.length === 0" class="py-6 text-center text-sm text-muted-foreground">
            Nothing outstanding.
          </p>
          <ul v-else class="divide-y divide-border/60">
            <li
              v-for="invoice in invoices"
              :key="invoice.id"
              class="flex items-center justify-between py-3"
            >
              <div class="flex items-center gap-2">
                <span class="font-medium">{{ invoice.number }}</span>
                <Badge v-if="invoice.overdue" variant="destructive">overdue</Badge>
              </div>
              <span class="tabular-nums font-medium">
                {{ formatMoney(invoice.totalMinor, invoice.currency) }}
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          class="flex-row items-center justify-between space-y-0 border-b border-border/60 pb-4"
        >
          <div class="flex items-center gap-2.5">
            <CalendarClock class="size-4 text-muted-foreground" />
            <CardTitle>Upcoming appointments</CardTitle>
          </div>
          <Badge variant="secondary">{{ appointments.length }}</Badge>
        </CardHeader>
        <CardContent class="pt-2">
          <p
            v-if="appointments.length === 0"
            class="py-6 text-center text-sm text-muted-foreground"
          >
            No upcoming appointments.
          </p>
          <ul v-else class="divide-y divide-border/60">
            <li
              v-for="appointment in appointments"
              :key="appointment.id"
              class="flex items-center justify-between py-3"
            >
              <span class="font-medium">{{ formatDateTime(appointment.start) }}</span>
              <span class="text-sm text-muted-foreground">
                {{ appointment.durationMinutes }} min · {{ appointment.resourceId }}
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
