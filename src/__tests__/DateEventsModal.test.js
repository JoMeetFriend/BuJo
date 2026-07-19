import { mount, flushPromises } from '@vue/test-utils'
import { describe, expect, test, vi, afterEach } from 'vitest'
import DateEventsModal from '@/components/DateEventsModal.vue'
import { createTestI18n } from './testUtils'

// BaseModal 用 <Teleport to="body">，實際 DOM 掛在 document.body 底下
function queryBody(selector) {
  return document.body.querySelector(selector)
}

function stubFetch(activity) {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ activity }),
    }),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  delete global.fetch
})

const events = [
  {
    id: 'act-1',
    title: '揪團活動',
    status: 'confirmed',
    time: '10:00 - 12:00',
    location: '',
  },
]

const activityDetail = {
  id: 'act-1',
  title: '揪團活動',
  creator: { display_name: '小明', avatar_url: '' },
  is_creator: false,
  has_joined: true,
  status: 'confirmed',
  requires_voting: false,
  current_count: 1,
  participant_target: null,
  location: '',
  description: '',
  candidate_slots: [],
  decision_candidates: null,
  confirmed_slot: {
    id: 'slot-1',
    slot_start: '2026-07-10T10:00:00Z',
    slot_end: '2026-07-10T12:00:00Z',
    all_day: false,
  },
  participants: [],
}

function mountModal() {
  return mount(DateEventsModal, {
    props: { date: '2026-07-10', events },
    global: {
      plugins: [createTestI18n()],
    },
    attachTo: document.body,
  })
}

describe('DateEventsModal - 點進活動詳情後，背後的行程清單要消失', () => {
  test('預設顯示行程清單', () => {
    const wrapper = mountModal()

    expect(queryBody('header')?.textContent).toContain('7 月 10 日')
    expect(document.body.textContent).toContain('揪團活動')

    wrapper.unmount()
  })

  test('點某筆行程後，清單消失、改顯示活動詳情便利貼', async () => {
    stubFetch(activityDetail)
    const wrapper = mountModal()

    await queryBody('article').click()
    await flushPromises()

    // 行程清單特有的元素（新增行程按鈕、清單列）應該不見了（BaseModal isOpen 被關掉）
    expect(queryBody('[aria-label="新增行程"]')).toBeNull()
    expect(queryBody('article.cursor-pointer')).toBeNull()
    expect(queryBody('.activity-detail-panel')).not.toBeNull()

    wrapper.unmount()
  })

  test('關閉活動詳情後，行程清單會重新出現', async () => {
    stubFetch(activityDetail)
    const wrapper = mountModal()

    await queryBody('article').click()
    await flushPromises()

    queryBody('[aria-label="關閉活動詳情"]').click()
    await flushPromises()

    expect(queryBody('[aria-label="新增行程"]')).not.toBeNull()
    expect(queryBody('.activity-detail-panel')).toBeNull()

    wrapper.unmount()
  })
})
