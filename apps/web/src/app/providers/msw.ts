import { setupWorker } from "msw/browser";
import { billingMockHandlers } from "@slices/billing";
import { schedulingMockHandlers } from "@slices/scheduling";

// MSW bootstrap is app-level: composing every slice's mock API is a composition
// concern. Each slice owns its own handlers (data/ layer knowledge) and exposes
// them through its public index — DTO shapes never leak up here.
export async function startMockApi(): Promise<void> {
  const worker = setupWorker(...billingMockHandlers, ...schedulingMockHandlers);
  const startOptions = { onUnhandledRequest: "bypass", quiet: true } as const;
  await worker.start(startOptions);

  // The browser terminates an idle or backgrounded service worker, which wipes
  // MSW's in-memory client registry; after that, requests silently bypass the
  // mock and hit the dev server (see mswjs/msw#2115, #2635). MSW's 5s keepalive
  // only holds while the tab is visible, and a bare worker.start() no-ops while
  // mocking is "enabled" — so re-assert via stop()+start() when the tab regains
  // focus, restoring the mock before the next query fires.
  let reviving = false;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible" || reviving) return;
    reviving = true;
    void (async () => {
      try {
        worker.stop();
        await worker.start(startOptions);
      } finally {
        reviving = false;
      }
    })();
  });
}
