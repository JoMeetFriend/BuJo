<script setup>
import { ref } from 'vue'
import AppSidebar from './components/AppSidebar.vue'
import { RouterView } from 'vue-router'
import EventPage from './components/EventPage.vue'
import ProfileEditPage from './components/ProfileEditPage.vue'

const sidebarOpen = ref(true)
const filters = ref({ joined: true, formed: true, personal: true })

function toggleFilter(key) {
  filters.value[key] = !filters.value[key]
}
</script>

<template>
  <div class="flex h-screen bg-[#FEF7E8] overflow-hidden">
    <!-- 左側導覽列（每頁共用） -->
    <AppSidebar :isOpen="sidebarOpen" :filters="filters" @toggle-filter="toggleFilter" />

    <!-- 右側主內容：pb-20 = 為手機版 fixed 底部導覽列（AppSidebar）保留空間 -->
    <main class="flex-1 overflow-hidden flex flex-col pb-20">
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