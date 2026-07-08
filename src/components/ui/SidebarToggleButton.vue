<!-- 側邊欄收合按鈕（僅桌機顯示）：外觀沿用原本 Activity 頁面的漢堡選單樣式。
定位交給使用端決定（App.vue 會依 sidebar 開關狀態放到不同位置）。
用到這個樣式時：
引入：
  import SidebarToggleButton from '@/components/ui/SidebarToggleButton.vue'

  <SidebarToggleButton @click="doSomething" />
-->

<template>
  <button type="button" class="sidebar-toggle-button" aria-label="切換側邊欄">☰</button>
</template>

<style scoped>
.sidebar-toggle-button {
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 1px solid var(--bujo-line);
  background: var(--bujo-white);
  color: var(--bujo-ink);
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.sidebar-toggle-button:hover {
  background: var(--bujo-ink);
  color: var(--bujo-white);
}

.sidebar-toggle-button:active {
  transform: translateY(1px);
}
</style>
