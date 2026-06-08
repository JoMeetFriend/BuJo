<script setup>
import { ref } from 'vue'
import AppSidebar from './components/AppSidebar.vue'
import CalendarMain from './components/CalendarMain.vue'

const sidebarOpen = ref(true)
</script>


<template>
  <!-- 主頁面日曆 -->
  <div class="flex h-screen bg-[#FEF7E8] overflow-hidden">
     <!-- 左側導覽列 -->
    <AppSidebar :isOpen="sidebarOpen" />

    <!-- 右側主內容 -->
    <main class="flex-1 overflow-hidden flex flex-col px-12 pb-20 md:px-16 md:pb-20">
    
      <CalendarMain @toggle-sidebar="sidebarOpen = !sidebarOpen" :sidebarOpen="sidebarOpen" />
    </main>
  </div>
</template>
