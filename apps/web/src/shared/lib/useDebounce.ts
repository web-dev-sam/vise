import { ref, watch } from "vue";
import type { Ref } from "vue";

/** Return a ref that trails `source` by `delayMs`. Domain-free UI primitive. */
export function useDebounce<T>(source: Ref<T>, delayMs = 300): Ref<T> {
  const debounced = ref(source.value) as Ref<T>;
  let handle: ReturnType<typeof setTimeout> | undefined;
  watch(source, (value) => {
    clearTimeout(handle);
    handle = setTimeout(() => {
      debounced.value = value;
    }, delayMs);
  });
  return debounced;
}
