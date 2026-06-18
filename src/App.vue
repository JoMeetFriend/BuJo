<script setup>
import { RouterView } from 'vue-router'
import { ref } from 'vue'
import AppSidebar from './components/AppSidebar.vue'

const sidebarOpen = ref(true)
const filters = ref({ joined: true, formed: true, personal: true })

function toggleFilter(key) {
  filters.value[key] = !filters.value[key]
}
</script>

<template>
  <div class="flex h-screen bg-[#FEF7E8] overflow-hidden">
    <AppSidebar :isOpen="sidebarOpen" :filters="filters" @toggle-filter="toggleFilter" />

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
