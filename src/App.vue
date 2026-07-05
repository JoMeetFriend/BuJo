<template>
  <div class="flex h-screen bg-[var(--bujo-page)] overflow-hidden text-[var(--bujo-ink)]">
    <AppSidebar
      v-if="showSidebar"
      :isOpen="sidebarOpen"
      :filters="filters"
      @toggle-filter="toggleFilter"
    />

    <main
      class="flex-1 min-w-0 flex flex-col"
      :class="[
        isCalendarPage || isAuthPage ? 'overflow-hidden' : 'overflow-auto',
        { 'pb-20': route.path !== '/activity' && !isCalendarPage && !isAuthPage },
      ]"
    >
      <RouterView v-slot="{ Component }">
        <component
          :is="Component"
          :sidebarOpen="sidebarOpen"
          :filters="filters"
          @toggle-sidebar="sidebarOpen = !sidebarOpen"
        />
      </RouterView>
    </main>
  </div>
</template>

<script setup>
import { RouterView, useRoute } from 'vue-router'
import { ref, computed, watch } from 'vue'
import AppSidebar from './components/AppSidebar.vue'

const route = useRoute()
const sidebarOpen = ref(true)
const filters = ref({ joined: true, formed: true, personal: true })

const showSidebar = computed(() => !['/login', '/register'].includes(route.path))
const isAuthPage = computed(() => ['/login', '/register'].includes(route.path))
const isCalendarPage = computed(() => route.name === 'calendar-page')

watch(
  () => route.path,
  (path) => {
    sidebarOpen.value = path !== '/activity'
  },
  { immediate: true },
)

function toggleFilter(key) {
  filters.value[key] = !filters.value[key]
}
</script>
