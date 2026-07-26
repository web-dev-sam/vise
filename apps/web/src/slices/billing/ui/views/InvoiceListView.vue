<script setup lang="ts">
import { RouterLink } from "vue-router";
import { ReceiptText } from "lucide-vue-next";
import { Badge } from "@shared/ui/badge";
import { Card, CardContent } from "@shared/ui/card";
import { PageHeader } from "@shared/ui/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@shared/ui/table";
import { formatDate, formatMoney } from "@shared/lib/format";
import { invoiceTotalMinor } from "../../core/rules";
import { useInvoiceList } from "../composables/useInvoiceList";
import InvoiceStatusBadge from "../components/InvoiceStatusBadge.vue";

const { invoices, appointmentStartById, loading } = useInvoiceList();
</script>

<template>
  <div class="space-y-8">
    <PageHeader title="Invoices" description="Every invoice raised for this client.">
      <template #icon><ReceiptText /></template>
      <template #actions>
        <Badge v-if="!loading" variant="secondary">{{ invoices.length }} total</Badge>
      </template>
    </PageHeader>

    <Card>
      <CardContent class="p-0">
        <p v-if="loading" class="p-6 text-center text-sm text-muted-foreground">Loading…</p>
        <Table v-else>
          <TableHeader>
            <TableRow class="hover:bg-transparent">
              <TableHead class="pl-6">Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Generated from</TableHead>
              <TableHead class="pr-6 text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="invoice in invoices" :key="invoice.id" class="group">
              <TableCell class="py-3 pl-6 font-medium">
                <RouterLink
                  class="text-foreground underline-offset-4 transition-colors group-hover:text-primary group-hover:underline"
                  :to="`/invoices/${invoice.id}`"
                >
                  {{ invoice.number }}
                </RouterLink>
              </TableCell>
              <TableCell class="py-3"><InvoiceStatusBadge :status="invoice.status" /></TableCell>
              <TableCell class="py-3 text-muted-foreground">
                {{
                  appointmentStartById.get(invoice.appointmentId)
                    ? formatDate(appointmentStartById.get(invoice.appointmentId) as Date)
                    : "—"
                }}
              </TableCell>
              <TableCell class="py-3 pr-6 text-right font-medium tabular-nums">{{
                formatMoney(invoiceTotalMinor(invoice), invoice.currency)
              }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>
