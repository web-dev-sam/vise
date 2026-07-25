import { defineComponent, h, onErrorCaptured, ref } from "vue";

/**
 * A minimal error boundary. It is a provider, not a feature, and Vue error
 * boundaries have no template — so this is a plain .ts component (no .vue file
 * escapes the ui/layouts/views boundary).
 */
export const ErrorBoundary = defineComponent({
  name: "ErrorBoundary",
  setup(_, { slots }) {
    const error = ref<Error | null>(null);
    onErrorCaptured((caught) => {
      error.value = caught instanceof Error ? caught : new Error(String(caught));
      return false;
    });
    return () =>
      error.value
        ? h(
            "div",
            { class: "rounded-md border border-destructive p-4 text-sm text-destructive" },
            `Something went wrong: ${error.value.message}`,
          )
        : slots.default?.();
  },
});
