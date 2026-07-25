<script setup lang="ts">
import { RouterLink } from "vue-router";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@shared/ui/table";
import { formatDate, formatMoney } from "@shared/lib/format";
import { invoiceTotalMinor } from "../../core/rules";
import { useInvoiceList } from "../composables/useInvoiceList";
import InvoiceStatusBadge from "../components/InvoiceStatusBadge.vue";

const { invoices, appointmentStartById, loading } = useInvoiceList();
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Invoices</CardTitle>
    </CardHeader>
    <CardContent>
      <p v-if="loading" class="text-sm text-muted-foreground">Loading…</p>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead>Number</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Generated from</TableHead>
            <TableHead class="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="invoice in invoices" :key="invoice.id">
            <TableCell class="font-medium">
              <RouterLink class="text-primary hover:underline" :to="`/invoices/${invoice.id}`">
                {{ invoice.number }}
              </RouterLink>
            </TableCell>
            <TableCell><InvoiceStatusBadge :status="invoice.status" /></TableCell>
            <TableCell class="text-muted-foreground">
              {{
                appointmentStartById.get(invoice.appointmentId)
                  ? formatDate(appointmentStartById.get(invoice.appointmentId) as Date)
                  : "—"
              }}
            </TableCell>
            <TableCell class="text-right">{{
              formatMoney(invoiceTotalMinor(invoice), invoice.currency)
            }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</template>
