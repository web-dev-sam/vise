<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Badge } from "@shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
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

onMounted(async () => {
  const now = new Date();
  invoices.value = await fetchUnpaidInvoiceSummaries(clientId, now);
  appointments.value = await fetchUpcomingAppointments(clientId, now);
});
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold">Client overview — {{ clientId }}</h1>
    <div class="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Unpaid invoices</CardTitle></CardHeader>
        <CardContent class="space-y-3">
          <p v-if="invoices.length === 0" class="text-sm text-muted-foreground">
            Nothing outstanding.
          </p>
          <div
            v-for="invoice in invoices"
            :key="invoice.id"
            class="flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <span class="font-medium">{{ invoice.number }}</span>
              <Badge v-if="invoice.overdue" variant="destructive">overdue</Badge>
            </div>
            <span>{{ formatMoney(invoice.totalMinor, invoice.currency) }}</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Upcoming appointments</CardTitle></CardHeader>
        <CardContent class="space-y-3">
          <p v-if="appointments.length === 0" class="text-sm text-muted-foreground">
            No upcoming appointments.
          </p>
          <div
            v-for="appointment in appointments"
            :key="appointment.id"
            class="flex items-center justify-between"
          >
            <span>{{ formatDateTime(appointment.start) }}</span>
            <span class="text-sm text-muted-foreground"
              >{{ appointment.durationMinutes }} min · {{ appointment.resourceId }}</span
            >
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
