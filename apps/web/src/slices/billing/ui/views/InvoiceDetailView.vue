<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { ArrowLeft, ReceiptText } from "lucide-vue-next";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardFooter } from "@shared/ui/card";
import { PageHeader } from "@shared/ui/page-header";
import { formatDate, formatMoney } from "@shared/lib/format";
import { useInvoiceDetail } from "../composables/useInvoiceDetail";
import InvoiceStatusBadge from "../components/InvoiceStatusBadge.vue";
import InvoiceLinesTable from "../components/InvoiceLinesTable.vue";

const route = useRoute();
const id = computed(() => String(route.params.id));
const { invoice, loading, totals, canVoidInvoice, voidCurrent } = useInvoiceDetail(id);
</script>

<template>
  <div class="space-y-6">
    <RouterLink
      to="/invoices"
      class="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft class="size-4" />
      All invoices
    </RouterLink>

    <p v-if="loading && !invoice" class="text-sm text-muted-foreground">Loading…</p>

    <template v-else-if="invoice">
      <PageHeader :title="invoice.number" :description="`Due ${formatDate(invoice.dueDate)}`">
        <template #icon><ReceiptText /></template>
        <template #actions>
          <InvoiceStatusBadge :status="invoice.status" />
        </template>
      </PageHeader>

      <Card>
        <CardContent class="space-y-6 pt-6">
          <InvoiceLinesTable :lines="invoice.lines" :currency="invoice.currency" />
          <dl class="ml-auto w-full max-w-xs space-y-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-muted-foreground">Subtotal</dt>
              <dd class="tabular-nums">
                {{ formatMoney(totals.subtotalMinor, invoice.currency) }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-muted-foreground">Tax</dt>
              <dd class="tabular-nums">{{ formatMoney(totals.taxMinor, invoice.currency) }}</dd>
            </div>
            <div
              class="flex justify-between border-t border-border/60 pt-2 text-base font-semibold"
            >
              <dt>Total</dt>
              <dd class="tabular-nums">{{ formatMoney(totals.totalMinor, invoice.currency) }}</dd>
            </div>
          </dl>
        </CardContent>
        <CardFooter v-if="canVoidInvoice" class="border-t border-border/60 pt-6">
          <Button variant="destructive" @click="voidCurrent">Void invoice</Button>
        </CardFooter>
      </Card>
    </template>
  </div>
</template>
