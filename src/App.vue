<template>
  <div class="flex h-screen bg-[#FEF7E8] overflow-hidden">
    <AppSidebar
      v-if="showSidebar"
      :isOpen="sidebarOpen"
      :filters="filters"
      @toggle-filter="toggleFilter"
    />

    <main class="flex-1 overflow-auto flex flex-col pb-20">
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
import { ref, computed } from 'vue'
import AppSidebar from './components/AppSidebar.vue'

const route = useRoute()
const sidebarOpen = ref(true)
const filters = ref({ joined: true, formed: true, personal: true })

const showSidebar = computed(() => !['/login', '/register'].includes(route.path))

function toggleFilter(key) {
  filters.value[key] = !filters.value[key]
}
</script>
