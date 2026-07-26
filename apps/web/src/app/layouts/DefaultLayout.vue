<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink, RouterView } from "vue-router";
import { CalendarDays, LayoutDashboard, Moon, ReceiptText, Sun } from "lucide-vue-next";
import { Button } from "@shared/ui/button";
import { ErrorBoundary } from "../providers/errorBoundary";

const links = [
  { to: "/overview", label: "Overview", icon: LayoutDashboard },
  { to: "/invoices", label: "Invoices", icon: ReceiptText },
  { to: "/schedule", label: "Schedule", icon: CalendarDays },
];

// Theme is an app-shell concern: toggle the `.dark` class the token layer keys
// off and persist the choice. The early inline script in index.html applies it
// before first paint; here we just keep the ref in sync and let the user flip it.
const isDark = ref(false);

onMounted(() => {
  isDark.value = document.documentElement.classList.contains("dark");
});

function toggleTheme(): void {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle("dark", isDark.value);
  try {
    localStorage.setItem("vise-theme", isDark.value ? "dark" : "light");
  } catch {
    /* storage unavailable — theme still applies for this session */
  }
}
</script>

<template>
  <div class="relative flex min-h-screen flex-col bg-background text-foreground">
    <!-- Decorative, non-interactive backdrop so pages never feel empty. -->
    <div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        class="absolute inset-x-0 top-0 h-[460px] bg-gradient-to-b from-primary/[0.08] via-primary/[0.02] to-transparent"
      />
    </div>

    <header
      class="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60"
    >
      <div class="mx-auto flex h-16 max-w-5xl items-center gap-4 px-6">
        <RouterLink to="/overview" class="group flex items-center gap-2.5">
          <span
            class="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm"
          >
            <svg viewBox="0 0 32 32" class="size-5" aria-hidden="true">
              <path d="M8 9h4l4 10 4-10h4l-6 14h-4z" fill="currentColor" />
            </svg>
          </span>
          <span class="text-base font-semibold tracking-tight">Vise</span>
        </RouterLink>

        <nav class="ml-2 flex items-center gap-1">
          <RouterLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground [&_svg]:size-4 [&_svg]:shrink-0"
            active-class="!bg-accent !text-accent-foreground"
          >
            <component :is="link.icon" />
            <span class="hidden sm:inline">{{ link.label }}</span>
          </RouterLink>
        </nav>

        <div class="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            :aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
            @click="toggleTheme"
          >
            <Moon v-if="isDark" />
            <Sun v-else />
          </Button>
        </div>
      </div>
    </header>

    <main class="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <ErrorBoundary>
        <RouterView />
      </ErrorBoundary>
    </main>

    <footer class="border-t border-border/70">
      <div
        class="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-muted-foreground sm:flex-row"
      >
        <span>Vise — a slice-architecture starter.</span>
        <span>Billing · Scheduling</span>
      </div>
    </footer>
  </div>
</template>
