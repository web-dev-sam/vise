import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import { billingRoutes } from "@slices/billing";
import { schedulingRoutes } from "@slices/scheduling";

// The composition root knows route PATHS and nothing about what renders there.
// Each slice owns its own route definitions and exports them from index.ts;
// here we only concatenate. There is deliberately no app/pages/ folder.
const routes: RouteRecordRaw[] = [
  { path: "/", redirect: "/overview" },
  {
    path: "/overview",
    name: "client-overview",
    component: async () => import("../views/ClientOverviewView.vue"),
  },
  ...billingRoutes,
  ...schedulingRoutes,
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
