import { defineStore } from "pinia";
import { ref } from "vue";
import type { Invoice } from "../core/types";
import { fetchInvoices } from "./queries";

/**
 * The ONE demonstration store in the whole starter. A store is a cache with an
 * IO habit, so it lives in data/ — never a top-level stores/ folder. Prefer
 * plain query functions elsewhere; reach for a store only when you need shared,
 * cached, reactive state across views.
 */
export const useInvoiceCacheStore = defineStore("billing/invoice-cache", () => {
  const invoices = ref<Invoice[]>([]);
  const loading = ref(false);
  const loaded = ref(false);

  async function ensureLoaded(): Promise<void> {
    if (loaded.value || loading.value) return;
    loading.value = true;
    try {
      invoices.value = await fetchInvoices();
      loaded.value = true;
    } finally {
      loading.value = false;
    }
  }

  return { invoices, loading, loaded, ensureLoaded };
});
