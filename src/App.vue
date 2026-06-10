<script setup>
import { ref } from 'vue'
import AppSidebar from './components/AppSidebar.vue'
import CalendarMain from './components/CalendarMain.vue'

const sidebarOpen = ref(true)
const filters = ref({ joined: true, formed: true, personal: true })
</script>


<template>
  <!-- 主頁面日曆 -->
  <div class="flex h-screen bg-[#FEF7E8] overflow-hidden">
     <!-- 左側導覽列 -->
    <AppSidebar :isOpen="sidebarOpen" @update-filters="filters = $event" />

    <!-- 右側主內容 -->
    <main class="flex-1 overflow-hidden flex flex-col px-0 pb-20 md:pb-20">
    
      <CalendarMain @toggle-sidebar="sidebarOpen = !sidebarOpen" :sidebarOpen="sidebarOpen" :filters="filters" />
    </main>
  </div>
</template>
