import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, test, vi, afterEach } from 'vitest'
import ActivityView from '@/components/ActivityView.vue'
import activityViewSource from '@/components/ActivityView.vue?raw'
import ActivityDetailModal from '@/components/ActivityDetailModal.vue'
import { createTestI18n } from './testUtils'

function makeActivity(overrides = {}) {
  return {
    id: 'act-1',
    title: '活動',
    status: 'recruiting',
    is_creator: false,
    has_joined: false,
    date: '',
    ...overrides,
  }
}

function stubFetch(activities) {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ activities }),
    }),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  delete global.fetch
})

async function mountActivityView(path = '/activity') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/activity', component: ActivityView }],
  })
  router.push(path)
  await router.isReady()
  return mount(ActivityView, {
    global: {
      plugins: [router, createTestI18n()],
      stubs: { ActivityDetailModal: true, EventPage: true },
    },
  })
}

async function clickFilter(wrapper, text) {
  const button = wrapper.findAll('button.activity-filter').find((b) => b.text().includes(text))
  await button.trigger('click')
}

describe('ActivityView - 手機短螢幕響應式版面', () => {
  test('頁首與篩選工具列為獨立區塊，建立活動按鈕留在頁首右側', async () => {
    stubFetch([makeActivity()])
    const wrapper = await mountActivityView()
    await flushPromises()

    const header = wrapper.find('header.activity-gallery-header')
    const toolbar = wrapper.find('nav.activity-filter-toolbar')

    expect(header.find('.activity-filter').exists()).toBe(false)
    expect(header.find('.activity-create-button').exists()).toBe(true)
    expect(toolbar.exists()).toBe(true)
    expect(toolbar.findAll('.activity-filter')).toHaveLength(5)
  })

  test('獨立篩選工具列使用 40px 按鈕與較大的標籤、數量字級', () => {
    expect(activityViewSource).toMatch(
      /\.activity-gallery-page\s*{[^}]*grid-template-rows: auto auto minmax\(390px, 1fr\);/s,
    )
    expect(activityViewSource).toMatch(
      /\.activity-filter-toolbar\s*{[^}]*min-height: 56px;[^}]*border-top:[^;]+;[^}]*border-bottom:[^;]+;/s,
    )
    expect(activityViewSource).toMatch(
      /\.activity-filter-scroller\s*{[^}]*margin-block: -4px;[^}]*padding-block: 4px;[^}]*overflow-x: auto;/s,
    )
    expect(activityViewSource).toMatch(
      /\.activity-filter\s*{[^}]*min-height: 40px;[^}]*font-size: 13px;[^}]*padding: 9px 16px;/s,
    )
    expect(activityViewSource).toMatch(/\.activity-filter b\s*{[^}]*font-size: 14px;/s)
  })

  test('桌機標題、篩選群組與主活動卡共用主內容欄中心線', () => {
    expect(activityViewSource).toMatch(
      /\.activity-gallery-page\s*{[^}]*--activity-rail-width: clamp\(190px, 18vw, 240px\);[^}]*--activity-column-gap: clamp\(18px, 2\.2vw, 32px\);/s,
    )
    expect(activityViewSource).toMatch(
      /\.activity-gallery-header\s*{[^}]*grid-template-columns: minmax\(0, 1fr\) var\(--activity-rail-width\);[^}]*gap: var\(--activity-column-gap\);/s,
    )
    expect(activityViewSource).toMatch(
      /\.activity-heading\s*{[^}]*grid-column: 1;[^}]*text-align: center;/s,
    )
    expect(activityViewSource).toMatch(
      /\.activity-filter-toolbar\s*{[^}]*display: grid;[^}]*grid-template-columns: minmax\(0, 1fr\) var\(--activity-rail-width\);[^}]*gap: var\(--activity-column-gap\);/s,
    )
    expect(activityViewSource).toMatch(
      /\.activity-filter-scroller\s*{[^}]*grid-column: 1;[^}]*overflow-x: auto;[^}]*touch-action: pan-x;/s,
    )
    expect(activityViewSource).toMatch(
      /\.activity-filter-group\s*{[^}]*width: max-content;[^}]*min-width: 100%;[^}]*flex-wrap: nowrap;[^}]*justify-content: center;/s,
    )
    expect(activityViewSource).toMatch(
      /\.activity-content\s*{[^}]*grid-template-columns: minmax\(0, 1fr\) var\(--activity-rail-width\);[^}]*gap: var\(--activity-column-gap\);/s,
    )
  })

  test('主活動卡以 activity id 做紙張切換過場', () => {
    expect(activityViewSource).toMatch(
      /<Transition name="activity-focus" mode="out-in">[\s\S]*?<div v-else :key="featuredActivity\.id" class="activity-focus-frame">/,
    )
    expect(activityViewSource).toMatch(
      /\.activity-stage :deep\(\.activity-focus-enter-active\)\s*{[^}]*opacity 180ms ease,[^}]*transform 180ms/s,
    )
    expect(activityViewSource).toMatch(
      /\.activity-stage :deep\(\.activity-focus-leave-active\)\s*{[^}]*opacity 120ms ease,[^}]*transform 120ms/s,
    )
    expect(activityViewSource).toMatch(
      /\.activity-stage :deep\(\.activity-focus-enter-from\)\s*{[^}]*opacity: 0;[^}]*translateY\(8px\)/s,
    )
  })

  test('各裝置主活動卡使用同尺寸的雙層錯位紙張背框', () => {
    expect(activityViewSource).toMatch(
      /<div v-else :key="featuredActivity\.id" class="activity-focus-frame">\s*<div class="activity-paper-stack">\s*<span[\s\S]*?activity-stage-sheet--back[\s\S]*?activity-stage-sheet--middle[\s\S]*?<ActivityDetailModal/,
    )
    expect(activityViewSource).not.toMatch(/\.activity-stage::before\s*{/)
    expect(activityViewSource).toMatch(
      /\.activity-stage-sheet\s*{[^}]*position: absolute;[^}]*inset: 0;[^}]*pointer-events: none;/s,
    )
    expect(activityViewSource).toMatch(
      /\.activity-stage-sheet--back\s*{[^}]*z-index: 0;[^}]*repeating-linear-gradient\([^}]*transform: translate\(18px, -24px\) rotate\(2\.4deg\);/s,
    )
    expect(activityViewSource).toMatch(
      /\.activity-stage-sheet--middle\s*{[^}]*z-index: 1;[^}]*repeating-linear-gradient\([^}]*transform: translate\(-4px, 24px\) rotate\(-1\.5deg\);/s,
    )
    expect(activityViewSource).toMatch(
      /\.activity-stage :deep\(\.activity-detail-panel\)\s*{[^}]*position: relative;[^}]*z-index: 2;/s,
    )
    expect(activityViewSource).toMatch(
      /\.activity-stage-sheet\s*{[^}]*repeating-linear-gradient\([^}]*176deg,[^}]*rgb\(var\(--bujo-line-rgb\) \/ 0\.065\)/s,
    )
    expect(activityViewSource).toMatch(
      /\.activity-stage-sheet--back::before,[\s\S]*?\.activity-stage-sheet--middle::after\s*{[^}]*width: 11px;[^}]*height: 11px;[^}]*background: currentColor;[^}]*clip-path: polygon\([^}]*content: '';/,
    )
    expect(activityViewSource).toMatch(
      /\.activity-stage-sheet--back::after\s*{[^}]*top: 8px;[^}]*left: 56%;[^}]*rgb\(222 153 205 \/ 0\.68\);/s,
    )
    expect(activityViewSource).not.toMatch(/\.activity-stage-sheet--middle::before\s*{/)
    expect(activityViewSource).toMatch(
      /@media \(min-width: 901px\)[^{]*{[\s\S]*?\.activity-paper-stack\s*{[^}]*width: min\(420px, calc\(100% - 40px\)\);[^}]*height: min\(520px, calc\(100% - 40px\)\);[^}]*min-height: 0;[^}]*max-height: calc\(100% - 40px\);/,
    )
    expect(activityViewSource).not.toMatch(
      /@media \(max-width: 900px\)[^{]*{[\s\S]*?\.activity-stage-sheet\s*{[^}]*display: none;/,
    )
    expect(activityViewSource).toMatch(
      /@media \(max-width: 900px\)[^{]*{[\s\S]*?\.activity-paper-stack\s*{[^}]*width: min\(100%, calc\(100vw - 92px\)\);[^}]*height: min\(45dvh, 430px, 100%\);[^}]*min-height: min\(250px, 45dvh, 100%\);[\s\S]*?\.activity-stage-sheet--back\s*{[^}]*translate\(9px, -12px\) rotate\(1\.2deg\);[\s\S]*?\.activity-stage-sheet--middle\s*{[^}]*translate\(-3px, 12px\) rotate\(-0\.8deg\);/,
    )
    expect(activityViewSource).toMatch(
      /@media \(max-width: 768px\)[^{]*{[\s\S]*?\.activity-stage-sheet--back\s*{[^}]*translate\(5px, -7px\) rotate\(0\.7deg\);[\s\S]*?\.activity-stage-sheet--middle\s*{[^}]*translate\(-3px, 8px\) rotate\(-0\.5deg\);[\s\S]*?width: 7px;[^}]*height: 7px;/,
    )
    expect(activityViewSource).toMatch(
      /@media \(max-width: 768px\)[^{]*{[\s\S]*?\.activity-stage-sheet--back::before\s*{[^}]*right: -3px;[^}]*bottom: 26%;[\s\S]*?\.activity-stage-sheet--back::after\s*{[^}]*top: -3px;[\s\S]*?\.activity-stage-sheet--middle::after\s*{[^}]*right: 16%;[^}]*bottom: -3px;/,
    )
  })

  test('選中篩選使用浮起紙卡，精準滑鼠 hover 時再輕微上浮', () => {
    expect(activityViewSource).toMatch(
      /\.activity-filter--active\s*{[^}]*background: rgb\(var\(--bujo-white-rgb\) \/ 0\.78\);[^}]*border-color: rgb\(var\(--bujo-line-rgb\) \/ 0\.32\);[^}]*3px 4px 0 rgb\(var\(--bujo-line-rgb\) \/ 0\.18\),[^}]*0 3px 7px rgb\(var\(--bujo-ink-rgb\) \/ 0\.08\);[^}]*transform: translateY\(-2px\);/s,
    )
    expect(activityViewSource).toMatch(
      /\.activity-filter::after\s*{[^}]*transform: scaleX\(0\);[^}]*transform-origin: left center;/s,
    )
    expect(activityViewSource).toMatch(
      /\.activity-filter--active::after\s*{[^}]*right: 23%;[^}]*left: 23%;[^}]*opacity: 0\.42;[^}]*transform: scaleX\(1\);/s,
    )
    expect(activityViewSource).toMatch(
      /\.activity-mini-card::before\s*{[^}]*top: 15px;[^}]*left: 0;[^}]*width: 2px;[^}]*height: 22px;[^}]*transform: scaleY\(0\);/s,
    )
    expect(activityViewSource).toMatch(
      /\.activity-mini-card--active::before\s*{[^}]*transform: scaleY\(1\);/s,
    )
    expect(activityViewSource).toMatch(
      /@media \(hover: hover\) and \(pointer: fine\)[^{]*{[\s\S]*?\.activity-filter:not\(\.activity-filter--active\):hover[\s\S]*?\.activity-filter--active:hover\s*{[^}]*4px 5px 0[^}]*transform: translateY\(-3px\);[\s\S]*?\.activity-mini-card:hover\s*{[^}]*transform: translateX\(-4px\);/,
    )
  })

  test('偏好減少動態時停用過場與位移但保留選中樣式', () => {
    expect(activityViewSource).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[^{]*{[\s\S]*?\.activity-filter,[\s\S]*?\.activity-focus-leave-active\)[^{]*{[^}]*transition: none;[\s\S]*?\.activity-filter--active,[\s\S]*?\.activity-focus-leave-to\)[^{]*{[^}]*opacity: 1;[^}]*transform: none;/,
    )
  })

  test('平板與電腦使用右側垂直活動列，手機改為底部橫向活動列', () => {
    expect(activityViewSource).toMatch(
      /\.activity-content\s*{[^}]*grid-template-columns: minmax\(0, 1fr\) var\(--activity-rail-width\);/s,
    )
    expect(activityViewSource).toMatch(
      /\.activity-strip\s*{[^}]*overflow-y: auto;[^}]*scroll-snap-type: y proximity;[^}]*touch-action: pan-y;/s,
    )
    expect(activityViewSource).toMatch(
      /@media \(max-width: 767px\)[^{]*{[\s\S]*?\.activity-content\s*{[^}]*grid-template-columns: minmax\(0, 1fr\);[^}]*grid-template-rows: minmax\(0, 1fr\) auto;[\s\S]*?\.activity-strip\s*{[^}]*overflow-x: auto;[^}]*overflow-y: hidden;[^}]*scroll-snap-type: x proximity;/,
    )
  })

  test('空狀態沿用主內容兩欄，主提示放在紙張背框且桌機右欄顯示說明', async () => {
    stubFetch([])
    const wrapper = await mountActivityView()
    await flushPromises()

    const emptyContent = wrapper.find('.activity-content--empty')
    expect(emptyContent.exists()).toBe(true)
    expect(emptyContent.find('.activity-stage--empty .activity-paper-stack--empty').exists()).toBe(
      true,
    )
    expect(emptyContent.findAll('.activity-stage-sheet')).toHaveLength(2)
    expect(emptyContent.find('.activity-card-rail--empty').exists()).toBe(true)
    expect(emptyContent.text()).toContain('目前還沒有活動')
    expect(emptyContent.text()).toContain('活動會出現在這裡')

    expect(activityViewSource).toMatch(
      /\.activity-paper-stack--empty\s*{[^}]*width: min\(390px, calc\(100% - 64px\)\);[^}]*min-height: min\(300px, calc\(100% - 72px\)\);/s,
    )
    expect(activityViewSource).toMatch(
      /@media \(max-width: 768px\)[^{]*{[\s\S]*?\.activity-content--empty\s*{[^}]*grid-template-columns: minmax\(0, 1fr\);[\s\S]*?\.activity-card-rail--empty\s*{[^}]*display: none;/,
    )
  })

  test('有活動但目前篩選無結果時顯示分類提示，而不是全站空狀態', async () => {
    stubFetch([
      makeActivity({
        id: 'confirmed-1',
        status: 'confirmed',
        has_joined: true,
      }),
    ])
    const wrapper = await mountActivityView()
    await flushPromises()

    await clickFilter(wrapper, '揪團中')

    expect(wrapper.find('.activity-content--empty').exists()).toBe(true)
    expect(wrapper.text()).toContain('此分類目前沒有活動')
    expect(wrapper.text()).toContain('試試其他篩選條件。')
    expect(wrapper.text()).not.toContain('建立第一場聚會')
  })

  test('桌機主活動卡加寬加長，右側小卡沿用行事曆 UPCOMING 卡片尺寸', () => {
    expect(activityViewSource).toMatch(
      /@media \(min-width: 901px\)[^{]*{[\s\S]*?\.activity-paper-stack\s*{[^}]*width: min\(420px, calc\(100% - 40px\)\);[^}]*height: min\(520px, calc\(100% - 40px\)\);[\s\S]*?\.activity-stage :deep\(\.activity-detail-panel\)\s*{[^}]*width: 100%;[^}]*height: 100%;[^}]*min-height: 0;[^}]*max-height: 100%;/,
    )
    expect(activityViewSource).toMatch(
      /\.activity-strip\s*{[^}]*grid-auto-rows: 104px;[^}]*gap: 12px;/s,
    )
    expect(activityViewSource).toMatch(
      /\.activity-mini-card\s*{[^}]*min-height: 104px;[^}]*padding: 15px 16px 14px;/s,
    )
  })

  test('手機大標字級與好友、通知頁一致', () => {
    expect(activityViewSource).toMatch(
      /@media \(max-width: 900px\)[^{]*\{[\s\S]*?\.activity-heading h1\s*\{[^}]*font-size: clamp\(40px, 6vw, 64px\);/,
    )
  })

  test('900px 以下維持標題靠左與篩選列水平捲動', () => {
    expect(activityViewSource).toMatch(
      /@media \(max-width: 900px\)[^{]*{[\s\S]*?\.activity-gallery-header\s*{[^}]*grid-template-columns: minmax\(0, 1fr\) auto;[\s\S]*?\.activity-heading\s*{[^}]*text-align: left;[\s\S]*?\.activity-filter-toolbar\s*{[^}]*display: flex;[^}]*gap: 0;[\s\S]*?\.activity-filter-group\s*{[^}]*justify-content: flex-start;/,
    )
  })

  test('篩選項目在所有 RWD 寬度維持單列，空間不足時可水平捲動', () => {
    expect(activityViewSource).toMatch(
      /<div class="activity-filter-scroller">\s*<div class="activity-filter-group">[\s\S]*?v-for="item in filters"/,
    )
    expect(activityViewSource).toMatch(
      /\.activity-filter-group\s*{[^}]*width: max-content;[^}]*display: flex;[^}]*flex-wrap: nowrap;/s,
    )
    expect(activityViewSource).toMatch(
      /\.activity-filter\s*{[^}]*flex: 0 0 auto;[^}]*white-space: nowrap;/s,
    )
  })

  test('Mobile activity detail respects the stage height', () => {
    expect(activityViewSource).toMatch(
      /@media \(max-width: 900px\)[^{]*{[\s\S]*?\.activity-focus-frame\s*{[^}]*position: relative;[\s\S]*?\.activity-paper-stack\s*{[^}]*position: relative;[^}]*width: min\(100%, calc\(100vw - 92px\)\);[^}]*height: min\(45dvh, 430px, 100%\);[\s\S]*?\.activity-stage :deep\(\.activity-detail-panel\)\s*{[^}]*width: 100%;[^}]*height: 100%;[^}]*min-height: 0;[^}]*max-height: 100%;/,
    )
  })

  test('Short screens reduce decorative vertical spacing', () => {
    expect(activityViewSource).toMatch(
      /@media \(max-width: 767px\) and \(max-height: 700px\)[^{]*{[\s\S]*?\.activity-gallery-page\s*{[^}]*gap: 8px;[\s\S]*?\.activity-stage\s*{[^}]*padding: 16px 0 4px;[\s\S]*?\.activity-card-rail\s*{[^}]*margin-top: 12px;/,
    )
  })
})

describe('ActivityView - 篩選 tab 依使用者任務分流 recruiting/joined/confirmed/hosting', () => {
  test('RECRUITING 只計入可報名的揪團中活動，不含已報名或自己建立', async () => {
    const activities = [
      makeActivity({
        id: 'mine-recruiting',
        title: 'mine',
        is_creator: true,
        has_joined: true,
        status: 'recruiting',
      }),
      makeActivity({
        id: 'friend-recruiting',
        title: 'friend',
        is_creator: false,
        has_joined: false,
        status: 'recruiting',
      }),
      makeActivity({
        id: 'joined-recruiting',
        title: 'joined',
        is_creator: false,
        has_joined: true,
        status: 'recruiting',
      }),
      makeActivity({
        id: 'friend-confirmed',
        is_creator: false,
        has_joined: true,
        status: 'confirmed',
      }),
    ]
    stubFetch(activities)
    const wrapper = await mountActivityView()
    await flushPromises()

    await clickFilter(wrapper, '揪團中')
    expect(wrapper.findAll('.activity-mini-card')).toHaveLength(1)
    expect(wrapper.text()).toContain('friend')
    expect(wrapper.text()).not.toContain('mine')
    expect(wrapper.text()).not.toContain('joined')

    await clickFilter(wrapper, '我建立的')
    expect(wrapper.findAll('.activity-mini-card')).toHaveLength(1)
  })

  test('JOINED 只算已報名、非自己建立、且尚未成團/取消的活動', async () => {
    const activities = [
      makeActivity({
        id: 'joined-recruiting',
        is_creator: false,
        has_joined: true,
        status: 'recruiting',
      }),
      makeActivity({ id: 'joined-voting', is_creator: false, has_joined: true, status: 'voting' }),
      makeActivity({
        id: 'joined-confirmed',
        is_creator: false,
        has_joined: true,
        status: 'confirmed',
      }),
      makeActivity({
        id: 'mine-recruiting',
        is_creator: true,
        has_joined: true,
        status: 'recruiting',
      }),
    ]
    stubFetch(activities)
    const wrapper = await mountActivityView()
    await flushPromises()

    await clickFilter(wrapper, '已報名')
    const cards = wrapper.findAll('.activity-mini-card')
    expect(cards).toHaveLength(2)
  })

  test('CONFIRMED 計入所有 status===confirmed 的活動，不論是否為自己建立', async () => {
    const activities = [
      makeActivity({
        id: 'mine-confirmed',
        is_creator: true,
        has_joined: true,
        status: 'confirmed',
      }),
      makeActivity({
        id: 'friend-confirmed',
        is_creator: false,
        has_joined: true,
        status: 'confirmed',
      }),
      makeActivity({
        id: 'mine-recruiting',
        is_creator: true,
        has_joined: true,
        status: 'recruiting',
      }),
    ]
    stubFetch(activities)
    const wrapper = await mountActivityView()
    await flushPromises()

    await clickFilter(wrapper, '已成團')
    expect(wrapper.findAll('.activity-mini-card')).toHaveLength(2)
  })

  test('HOSTING 只依 is_creator，不分狀態', async () => {
    const activities = [
      makeActivity({
        id: 'mine-recruiting',
        is_creator: true,
        has_joined: true,
        status: 'recruiting',
      }),
      makeActivity({
        id: 'mine-confirmed',
        is_creator: true,
        has_joined: true,
        status: 'confirmed',
      }),
      makeActivity({
        id: 'friend-recruiting',
        is_creator: false,
        has_joined: false,
        status: 'recruiting',
      }),
    ]
    stubFetch(activities)
    const wrapper = await mountActivityView()
    await flushPromises()

    await clickFilter(wrapper, '我建立的')
    expect(wrapper.findAll('.activity-mini-card')).toHaveLength(2)
  })
})

describe('ActivityView - focus query 聚焦指定活動', () => {
  test('底部活動小卡保留完整 title 屬性供 hover 或輔助工具讀取', async () => {
    const longTitle = '嗨嗨嗨嗨嗨嗨嗨嗨嗨嗨嗨嗨嗨嗨嗨嗨'
    stubFetch([makeActivity({ title: longTitle })])
    const wrapper = await mountActivityView()
    await flushPromises()

    const title = wrapper.find('.activity-mini-card h2')
    expect(title.attributes('title')).toBe(longTitle)
    expect(title.text()).toBe('嗨嗨嗨嗨嗨嗨嗨嗨嗨嗨嗨嗨嗨...')
  })

  test('底部活動小卡顯示建立者頭像，沒有頭像時顯示名字首字', async () => {
    stubFetch([
      makeActivity({
        id: 'with-avatar',
        title: '有頭像',
        creator: { display_name: '小明', avatar_url: '/uploads/avatars/creator.png' },
      }),
      makeActivity({
        id: 'without-avatar',
        title: '無頭像',
        creator: { display_name: 'Alice', avatar_url: '' },
      }),
    ])
    const wrapper = await mountActivityView()
    await flushPromises()

    const cards = wrapper.findAll('.activity-mini-card')
    expect(cards[0].find('.activity-mini-avatar img').attributes('src')).toContain(
      '/uploads/avatars/creator.png',
    )
    expect(cards[1].find('.activity-mini-avatar').text()).toBe('A')
  })

  test('建立者頭像圖片載入失敗時改顯示名字首字', async () => {
    stubFetch([
      makeActivity({
        id: 'broken-avatar',
        title: '壞掉的頭像',
        creator: {
          display_name: '小明',
          avatar_url: 'https://res.cloudinary.com/demo/avatar-dead-link.png',
        },
      }),
    ])
    const wrapper = await mountActivityView()
    await flushPromises()

    const card = wrapper.get('.activity-mini-card')
    expect(card.find('.activity-mini-avatar img').exists()).toBe(true)

    await card.get('.activity-mini-avatar img').trigger('error')

    expect(card.find('.activity-mini-avatar img').exists()).toBe(false)
    expect(card.find('.activity-mini-avatar').text()).toBe('小')
  })

  test('掛載於 /activity?focus=<id> 時 featured 為該活動且 modal 收到正確 activity-id', async () => {
    const activities = [
      makeActivity({ id: 'act-1' }),
      makeActivity({ id: 'act-2' }),
      makeActivity({ id: 'act-3' }),
    ]
    stubFetch(activities)
    const wrapper = await mountActivityView('/activity?focus=act-2')
    await flushPromises()

    expect(wrapper.findComponent(ActivityDetailModal).props('activityId')).toBe('act-2')
  })

  // 通知 deep link 指向的活動可能已取消（列表 API 不回傳 cancelled 活動）——
  // fallback 顯示第一筆會讓使用者以為看到的是通知講的那個活動，必須顯示明確提示
  test('focus 不存在於列表時顯示提示訊息，不 fallback 顯示別的活動', async () => {
    const activities = [makeActivity({ id: 'act-1' }), makeActivity({ id: 'act-2' })]
    stubFetch(activities)
    const wrapper = await mountActivityView('/activity?focus=act-999')
    await flushPromises()

    expect(wrapper.findComponent(ActivityDetailModal).exists()).toBe(false)
    expect(wrapper.text()).toContain('此活動已結束或不存在')
    expect(wrapper.findAll('.activity-mini-card')).toHaveLength(2)
  })

  test('focus 不存在時點擊活動卡可恢復正常瀏覽', async () => {
    const activities = [makeActivity({ id: 'act-1' }), makeActivity({ id: 'act-2' })]
    stubFetch(activities)
    const wrapper = await mountActivityView('/activity?focus=act-999')
    await flushPromises()

    await wrapper.findAll('.activity-mini-card')[1].trigger('click')

    expect(wrapper.findComponent(ActivityDetailModal).props('activityId')).toBe('act-2')
    expect(wrapper.text()).not.toContain('此活動已結束或不存在')
  })
})
