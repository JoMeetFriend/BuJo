<template>
  <div class="flex h-screen bg-[#FEF7E8] overflow-hidden">
    <AppSidebar v-if="showSidebar" :isOpen="sidebarOpen" :filters="filters" @toggle-filter="toggleFilter" />

    <main class="flex-1 overflow-auto flex flex-col pb-20">
      <div
        v-if="loginError"
        class="mx-4 mt-3 flex items-center justify-between border-2 border-brand-text bg-primary-pale px-4 py-2 text-sm text-brand-text shadow-pixel"
      >
        <span>{{ loginError }}</span>
        <button @click="loginError = ''" class="ml-4 font-bold leading-none">✕</button>
      </div>

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
import { RouterView, useRoute, useRouter } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import AppSidebar from './components/AppSidebar.vue'

const route = useRoute()
const router = useRouter()
const sidebarOpen = ref(true)
const filters = ref({ joined: true, formed: true, personal: true })
const loginError = ref('')

const showSidebar = computed(() => !['/login', '/register'].includes(route.path))

function toggleFilter(key) {
  filters.value[key] = !filters.value[key]
}

onMounted(() => {
  if (route.query.error === 'line_login_failed') {
    loginError.value = 'LINE 登入失敗，請再試一次'
    router.replace({ query: {} })
  }
})
</script>
