import type { RouteRecordRaw } from "vue-router";

export const schedulingRoutes: RouteRecordRaw[] = [
  {
    path: "/schedule",
    name: "day-view",
    component: () => import("./ui/views/DayView.vue"),
  },
];
