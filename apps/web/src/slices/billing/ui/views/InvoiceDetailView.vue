<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@shared/ui/card";
import { formatDate, formatMoney } from "@shared/lib/format";
import { useInvoiceDetail } from "../composables/useInvoiceDetail";
import InvoiceStatusBadge from "../components/InvoiceStatusBadge.vue";
import InvoiceLinesTable from "../components/InvoiceLinesTable.vue";

const route = useRoute();
const id = computed(() => String(route.params.id));
const { invoice, loading, totals, canVoidInvoice, voidCurrent } = useInvoiceDetail(id);
</script>

<template>
  <p v-if="loading && !invoice" class="text-sm text-muted-foreground">Loading…</p>
  <Card v-else-if="invoice">
    <CardHeader class="flex-row items-center justify-between">
      <div class="flex items-center gap-3">
        <CardTitle>{{ invoice.number }}</CardTitle>
        <InvoiceStatusBadge :status="invoice.status" />
      </div>
      <span class="text-sm text-muted-foreground">Due {{ formatDate(invoice.dueDate) }}</span>
    </CardHeader>
    <CardContent class="space-y-6">
      <InvoiceLinesTable :lines="invoice.lines" :currency="invoice.currency" />
      <dl class="ml-auto w-64 space-y-1 text-sm">
        <div class="flex justify-between">
          <dt class="text-muted-foreground">Subtotal</dt>
          <dd>{{ formatMoney(totals.subtotalMinor, invoice.currency) }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-muted-foreground">Tax</dt>
          <dd>{{ formatMoney(totals.taxMinor, invoice.currency) }}</dd>
        </div>
        <div class="flex justify-between border-t pt-1 font-semibold">
          <dt>Total</dt>
          <dd>{{ formatMoney(totals.totalMinor, invoice.currency) }}</dd>
        </div>
      </dl>
    </CardContent>
    <CardFooter>
      <Button v-if="canVoidInvoice" variant="destructive" @click="voidCurrent">Void invoice</Button>
    </CardFooter>
  </Card>
</template>
