<template>
  <BaseModal :isOpen="isOpen" :title="t('friendAdd.title')" @close="handleClose">
    <div class="grid gap-4">
      <label class="grid gap-2" for="friend-search">
        <span class="text-sm font-semibold text-[var(--bujo-ink)]">{{
          t('friendAdd.searchLabel')
        }}</span>

        <input
          id="friend-search"
          v-model="searchQuery"
          @input="handleInput"
          class="min-h-[44px] w-full border border-[var(--bujo-line)] bg-[var(--bujo-surface)] px-4 text-sm leading-none text-[var(--bujo-ink)] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[var(--bujo-muted)] focus:border-[var(--bujo-accent)] focus:shadow-[inset_0_0_0_1px_var(--bujo-accent)]"
          type="search"
          :placeholder="t('friendAdd.inputPlaceholder')"
          maxlength="5"
        />
      </label>

      <div class="grid gap-2">
        <p class="m-0 text-xs leading-none text-[var(--bujo-muted-strong)]">
          <span v-if="isSearching">{{ t('friendAdd.searching') }}</span>
          <span v-else-if="error" class="text-[var(--bujo-danger)]">{{ error }}</span>
          <span v-else-if="hasSearched && searchResults.length === 0">{{
            t('friendAdd.notFound')
          }}</span>
          <span v-else-if="searchResults.length > 0">{{ t('friendAdd.searchResult') }}</span>
        </p>

        <article
          v-for="user in searchResults"
          :key="user.id"
          class="grid grid-cols-[auto_1fr_auto] items-center gap-3 border border-[var(--bujo-line)] bg-[var(--bujo-surface)] px-4 py-3 max-sm:grid-cols-[auto_1fr] max-sm:gap-x-3 max-sm:gap-y-3"
        >
          <div
            v-if="user.avatar_url"
            class="size-10 shrink-0 overflow-hidden border border-[var(--bujo-line)]"
          >
            <img :src="user.avatar_url" alt="" class="h-full w-full object-cover" loading="lazy" />
          </div>
          <div
            v-else
            class="grid size-10 shrink-0 place-items-center bg-[linear-gradient(var(--bujo-ink)_0_0)] [clip-path:polygon(25%_12%,75%_12%,75%_25%,88%_25%,88%_75%,75%_75%,75%_88%,25%_88%,25%_75%,12%_75%,12%_25%,25%_25%)]"
            aria-hidden="true"
          >
            <div
              class="size-6 bg-[var(--bujo-surface)] [clip-path:polygon(0_25%,25%_25%,25%_0,75%_0,75%_25%,100%_25%,100%_75%,75%_75%,75%_100%,25%_100%,25%_75%,0_75%)]"
            ></div>
          </div>

          <div class="min-w-0">
            <h2 class="m-0 truncate text-sm font-semibold leading-tight text-[var(--bujo-ink)]">
              {{ user.display_name }}
            </h2>
          </div>

          <PixelButton
            type="button"
            :disabled="actionStatus[user.id] === 'loading' || actionStatus[user.id] === 'success'"
            class="max-sm:col-span-2 max-sm:w-full"
            @click="handleAddFriend(user.id)"
          >
            <span v-if="actionStatus[user.id] === 'loading'">{{ t('friendAdd.processing') }}</span>
            <span v-else-if="actionStatus[user.id] === 'success'">{{
              t('friendAdd.inviteSent')
            }}</span>
            <span v-else>{{ t('friendAdd.sendInvite') }}</span>
          </PixelButton>
        </article>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseModal from './ui/BaseModal.vue'
import PixelButton from './ui/PixelButton.vue'
import { useUserSearch } from '@/composables/useUserSearch'
import { useFriendStore } from '@/stores/friendStore'

defineProps({ isOpen: Boolean })
const emit = defineEmits(['close'])

const { t } = useI18n()

const { searchResults, isSearching, error, hasSearched, searchUsers, clearSearch } = useUserSearch()
const friendStore = useFriendStore()

const searchQuery = ref('')
const actionStatus = ref({})
let debounceTimer = null

const handleInput = () => {
  clearTimeout(debounceTimer)

  debounceTimer = setTimeout(() => {
    const sanitizedValue = searchQuery.value.trim().toLowerCase()

    if (sanitizedValue.length === 5) {
      searchUsers(sanitizedValue)
    } else {
      clearSearch()
    }
  }, 300)
}

const handleAddFriend = async (id) => {
  actionStatus.value[id] = 'loading'
  const result = await friendStore.addFriend(id)

  if (result.success) {
    actionStatus.value[id] = 'success'
  } else {
    actionStatus.value[id] = 'idle'
    if (result.status !== 401) {
      alert(result.message)
    }
  }
}

const handleClose = () => {
  searchQuery.value = ''
  actionStatus.value = {}
  clearSearch()
  emit('close')
}

onUnmounted(() => clearTimeout(debounceTimer))
</script>
