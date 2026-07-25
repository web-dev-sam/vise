import { onMounted, ref } from "vue";
import type { Ref } from "vue";
import { storeToRefs } from "pinia";
import { useInvoiceCacheStore } from "../../data/store";
import type { Invoice } from "../../core/types";
// ─── CANONICAL CROSS-SLICE IMPORT ───────────────────────────────────────────
// Billing shows the appointment date each invoice was generated from. It gets
// this through scheduling's PUBLIC surface (the @slices/scheduling alias) — a
// query plus a read-model type. Billing must never import scheduling/core or
// scheduling/data; the tsconfig alias, oxlint and dependency-cruiser all make a
// deep import unresolvable. This join is the exact spot that tempts a sideways
// import — done correctly here on purpose.
import { fetchAppointmentSummaries } from "@slices/scheduling";
import type { AppointmentSummary } from "@slices/scheduling";

export interface InvoiceListState {
  readonly invoices: Ref<Invoice[]>;
  readonly appointmentStartById: Ref<Map<string, Date>>;
  readonly loading: Ref<boolean>;
  readonly refresh: () => Promise<void>;
}

export function useInvoiceList(): InvoiceListState {
  const store = useInvoiceCacheStore();
  const { invoices, loading } = storeToRefs(store);
  const appointmentStartById = ref<Map<string, Date>>(new Map());

  async function refresh(): Promise<void> {
    await store.ensureLoaded();
    const ids = [...new Set(invoices.value.map((invoice) => invoice.appointmentId))];
    const summaries: AppointmentSummary[] = await fetchAppointmentSummaries(ids);
    appointmentStartById.value = new Map(summaries.map((summary) => [summary.id, summary.start]));
  }

  onMounted(refresh);

  return { invoices, appointmentStartById, loading, refresh };
}
