<script setup lang="ts">
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@shared/ui/table";
import { formatMoney } from "@shared/lib/format";
import { lineSubtotalMinor, lineTaxMinor, lineTotalMinor } from "../../core/rules";
import type { InvoiceLine } from "../../core/types";

const props = defineProps<{ lines: readonly InvoiceLine[]; currency: string }>();
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow class="hover:bg-transparent">
        <TableHead>Description</TableHead>
        <TableHead class="text-right">Qty</TableHead>
        <TableHead class="text-right">Unit</TableHead>
        <TableHead class="text-right">Subtotal</TableHead>
        <TableHead class="text-right">Tax</TableHead>
        <TableHead class="text-right">Total</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="line in props.lines" :key="line.id">
        <TableCell class="font-medium">{{ line.description }}</TableCell>
        <TableCell class="text-right tabular-nums">{{ line.quantity }}</TableCell>
        <TableCell class="text-right tabular-nums">{{
          formatMoney(line.unitPriceMinor, props.currency)
        }}</TableCell>
        <TableCell class="text-right tabular-nums">{{
          formatMoney(lineSubtotalMinor(line), props.currency)
        }}</TableCell>
        <TableCell class="text-right tabular-nums text-muted-foreground">{{
          formatMoney(lineTaxMinor(line), props.currency)
        }}</TableCell>
        <TableCell class="text-right font-medium tabular-nums">{{
          formatMoney(lineTotalMinor(line), props.currency)
        }}</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
