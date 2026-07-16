<template>
  <div class="relative flex h-screen bg-[var(--bujo-page)] overflow-hidden text-[var(--bujo-ink)]">
    <AppSidebar
      v-if="showSidebar"
      :isOpen="sidebarOpen"
      :filters="filters"
      @toggle-filter="toggleFilter"
    />

    <SidebarToggleButton
      v-if="showSidebar"
      class="hidden md:flex"
      :class="
        sidebarOpen
          ? 'app-sidebar-toggle app-sidebar-toggle--open'
          : 'app-sidebar-toggle app-sidebar-toggle--closed'
      "
      @click="sidebarOpen = !sidebarOpen"
    />

    <main
      class="flex-1 min-w-0 flex flex-col"
      :class="[
        isCalendarPage || isAuthPage ? 'overflow-hidden' : 'overflow-auto',
        {
          'pb-20':
            route.path !== '/activity' &&
            !isCalendarPage &&
            !isAuthPage &&
            !isLandingPage &&
            !isNotFoundPage,
        },
      ]"
    >
      <RouterView v-slot="{ Component }">
        <component :is="Component" :sidebarOpen="sidebarOpen" :filters="filters" />
      </RouterView>
    </main>
  </div>
</template>

<script setup>
import { RouterView, useRoute } from 'vue-router'
import { ref, computed } from 'vue'
import AppSidebar from './components/AppSidebar.vue'
import SidebarToggleButton from './components/ui/SidebarToggleButton.vue'

const route = useRoute()
const sidebarOpen = ref(true)
const filters = ref({ formedByMe: true, formedByOthers: true })

const isNotFoundPage = computed(() => route.name === 'not-found')
const showSidebar = computed(
  () => !['/login', '/register', '/'].includes(route.path) && !isNotFoundPage.value,
)
const isAuthPage = computed(() => ['/login', '/register'].includes(route.path))
const isLandingPage = computed(() => route.path === '/')
const isCalendarPage = computed(() => route.name === 'calendar-page')

function toggleFilter(key) {
  filters.value[key] = !filters.value[key]
}
</script>

<style scoped>
.app-sidebar-toggle {
  position: absolute;
  top: 22px;
  z-index: 20;
  transition: left 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.app-sidebar-toggle--open {
  left: 156px;
}

.app-sidebar-toggle--closed {
  left: 16px;
}
</style>
