<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import { ErrorBoundary } from "../providers/errorBoundary";

const links = [
  { to: "/overview", label: "Overview" },
  { to: "/invoices", label: "Invoices" },
  { to: "/schedule", label: "Schedule" },
];
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <header class="border-b">
      <nav class="mx-auto flex max-w-5xl items-center gap-6 px-6 py-4">
        <span class="text-base font-semibold">Vise</span>
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="text-sm text-muted-foreground transition-colors hover:text-foreground"
          active-class="text-foreground font-medium"
        >
          {{ link.label }}
        </RouterLink>
      </nav>
    </header>
    <main class="mx-auto max-w-5xl px-6 py-8">
      <ErrorBoundary>
        <RouterView />
      </ErrorBoundary>
    </main>
  </div>
</template>
