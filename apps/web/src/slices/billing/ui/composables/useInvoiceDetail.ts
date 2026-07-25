import { computed, ref, watch } from "vue";
import type { ComputedRef, Ref } from "vue";
import { fetchInvoiceById } from "../../data/queries";
import { voidInvoice } from "../../data/mutations";
import { invoiceSubtotalMinor, invoiceTaxMinor, invoiceTotalMinor } from "../../core/rules";
import { canVoid } from "../../core/policy";
import type { Invoice } from "../../core/types";

export interface InvoiceTotals {
  readonly subtotalMinor: number;
  readonly taxMinor: number;
  readonly totalMinor: number;
}

export interface InvoiceDetailState {
  readonly invoice: Ref<Invoice | null>;
  readonly loading: Ref<boolean>;
  readonly totals: ComputedRef<InvoiceTotals>;
  readonly canVoidInvoice: ComputedRef<boolean>;
  readonly voidCurrent: () => Promise<void>;
}

export function useInvoiceDetail(id: Ref<string>): InvoiceDetailState {
  const invoice = ref<Invoice | null>(null);
  const loading = ref(false);

  async function load(): Promise<void> {
    loading.value = true;
    try {
      invoice.value = await fetchInvoiceById(id.value);
    } finally {
      loading.value = false;
    }
  }

  watch(id, load, { immediate: true });

  const totals = computed<InvoiceTotals>(() => {
    const current = invoice.value;
    if (!current) return { subtotalMinor: 0, taxMinor: 0, totalMinor: 0 };
    return {
      subtotalMinor: invoiceSubtotalMinor(current),
      taxMinor: invoiceTaxMinor(current),
      totalMinor: invoiceTotalMinor(current),
    };
  });

  const canVoidInvoice = computed(() => (invoice.value ? canVoid(invoice.value) : false));

  async function voidCurrent(): Promise<void> {
    if (!invoice.value) return;
    invoice.value = await voidInvoice(invoice.value.id);
  }

  return { invoice, loading, totals, canVoidInvoice, voidCurrent };
}
