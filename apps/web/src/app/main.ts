import { createApp } from "vue";
import { createPinia } from "pinia";
import { router } from "./router";
import { startMockApi } from "./providers/msw";
import DefaultLayout from "./layouts/DefaultLayout.vue";
import "./styles.css";

// Composition root. Start the mock API, then mount the layout (which hosts the
// router view). DefaultLayout is the root component, so there is no stray
// App.vue outside app/layouts.
async function bootstrap(): Promise<void> {
  await startMockApi();
  createApp(DefaultLayout).use(createPinia()).use(router).mount("#app");
}

void bootstrap();
