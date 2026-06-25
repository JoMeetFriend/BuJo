<template>
  <BaseModal :isOpen="true" title="我的帳號" @close="emit('close')">
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <div
          class="grid h-[60px] w-[60px] shrink-0 place-items-center border border-[#87C06D] bg-[#DEF4CD]"
        >
          <img
            v-if="user?.avatar_url"
            :src="user.avatar_url"
            :alt="displayName"
            class="h-full w-full object-cover"
          />
          <span v-else class="profile-modal-face" aria-hidden="true"></span>
        </div>
        <div class="min-w-0">
          <p class="text-sm font-semibold leading-tight md:text-base">{{ displayName }}</p>
          <p v-if="accountLabel" class="mt-1 text-sm text-[#87C06D]">{{ accountLabel }}</p>
        </div>
      </div>

      <RouterLink
        to="/profile/edit"
        class="flex min-h-[60px] items-center gap-4 border border-[#9DBD86] bg-white px-3 py-2 transition hover:bg-[#FAF8F4]"
        @click="emit('close')"
      >
        <span class="profile-action-icon profile-action-icon--edit" aria-hidden="true"></span>
        <span class="flex flex-1 flex-col items-center leading-tight">
          <span class="text-sm font-semibold">個人編輯</span>
          <span class="mt-1 text-xs text-[#87C06D]">頭貼、名稱</span>
        </span>
      </RouterLink>

      <button
        type="button"
        class="flex min-h-[60px] w-full items-center gap-4 border border-[#9DBD86] bg-white px-3 py-2 transition hover:bg-[#FAF8F4]"
        @click="emit('logout')"
      >
        <span class="profile-action-icon profile-action-icon--logout" aria-hidden="true"></span>
        <span class="flex flex-1 flex-col items-center leading-tight">
          <span class="text-sm font-semibold">登出</span>
          <span class="mt-1 text-xs text-[#87C06D]">離開 BuJo</span>
        </span>
      </button>
    </div>
  </BaseModal>
</template>

<script setup>
import { computed } from 'vue'
import BaseModal from './ui/BaseModal.vue'

const props = defineProps({
  user: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'logout'])

const displayName = computed(() => props.user?.display_name || '未登入')
const accountLabel = computed(() => props.user?.email || '')
</script>

<style scoped>
.profile-modal-face {
  position: relative;
  display: block;
  width: 32px;
  height: 32px;
  background:
    linear-gradient(#4a5040 0 0) 8px 4px / 16px 4px no-repeat,
    linear-gradient(#4a5040 0 0) 4px 8px / 4px 16px no-repeat,
    linear-gradient(#4a5040 0 0) 24px 8px / 4px 16px no-repeat,
    linear-gradient(#4a5040 0 0) 8px 24px / 16px 4px no-repeat,
    linear-gradient(#4a5040 0 0) 12px 12px / 4px 4px no-repeat,
    linear-gradient(#4a5040 0 0) 20px 12px / 4px 4px no-repeat,
    linear-gradient(#4a5040 0 0) 16px 20px / 4px 4px no-repeat;
}

.profile-modal-face::before,
.profile-modal-face::after {
  position: absolute;
  top: 0;
  width: 8px;
  height: 8px;
  background: #4a5040;
  content: '';
}

.profile-modal-face::before {
  left: 4px;
}

.profile-modal-face::after {
  right: 4px;
}

.profile-action-icon {
  position: relative;
  display: block;
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
}

.profile-action-icon--edit {
  background:
    linear-gradient(#4a5040 0 0) 2px 2px / 4px 8px no-repeat,
    linear-gradient(#4a5040 0 0) 10px 2px / 4px 8px no-repeat,
    linear-gradient(#4a5040 0 0) 18px 2px / 4px 8px no-repeat,
    linear-gradient(#4a5040 0 0) 2px 14px / 4px 10px no-repeat,
    linear-gradient(#4a5040 0 0) 10px 18px / 4px 8px no-repeat,
    linear-gradient(#4a5040 0 0) 18px 14px / 4px 10px no-repeat,
    linear-gradient(#4a5040 0 0) 24px 6px / 4px 4px no-repeat,
    linear-gradient(#4a5040 0 0) 24px 22px / 4px 4px no-repeat;
}

.profile-action-icon--logout {
  background:
    linear-gradient(#4a5040 0 0) 12px 2px / 6px 6px no-repeat,
    linear-gradient(#4a5040 0 0) 9px 8px / 12px 4px no-repeat,
    linear-gradient(#4a5040 0 0) 6px 12px / 4px 4px no-repeat,
    linear-gradient(#4a5040 0 0) 20px 12px / 4px 4px no-repeat,
    linear-gradient(#4a5040 0 0) 3px 16px / 4px 4px no-repeat,
    linear-gradient(#4a5040 0 0) 23px 16px / 4px 4px no-repeat,
    linear-gradient(#4a5040 0 0) 6px 20px / 18px 4px no-repeat,
    linear-gradient(#4a5040 0 0) 2px 24px / 26px 4px no-repeat;
}
</style>
