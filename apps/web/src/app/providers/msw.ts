import { setupWorker } from "msw/browser";
import { billingMockHandlers } from "@slices/billing";
import { schedulingMockHandlers } from "@slices/scheduling";

// MSW bootstrap is app-level: composing every slice's mock API is a composition
// concern. Each slice owns its own handlers (data/ layer knowledge) and exposes
// them through its public index — DTO shapes never leak up here.
export async function startMockApi(): Promise<void> {
  const worker = setupWorker(...billingMockHandlers, ...schedulingMockHandlers);
  await worker.start({ onUnhandledRequest: "bypass", quiet: true });
}
