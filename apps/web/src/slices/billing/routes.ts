import type { RouteRecordRaw } from "vue-router";

/** This slice owns its route paths. The app router only concatenates them. */
export const billingRoutes: RouteRecordRaw[] = [
  {
    path: "/invoices",
    name: "invoice-list",
    component: () => import("./ui/views/InvoiceListView.vue"),
  },
  {
    path: "/invoices/:id",
    name: "invoice-detail",
    component: () => import("./ui/views/InvoiceDetailView.vue"),
  },
];
