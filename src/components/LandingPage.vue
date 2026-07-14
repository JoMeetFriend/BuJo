<template>
  <div class="landing-page">
    <!-- 頂部導覽 -->
    <header class="landing-topbar">
      <div class="landing-topbar-inner">
        <img :src="bujoLogoUrl" alt="BuJo" class="landing-topbar-logo" />
        <nav class="landing-topbar-actions">
          <RouterLink to="/login" class="landing-link">登入</RouterLink>
          <RouterLink to="/register" class="landing-cta-pill">免費註冊</RouterLink>
        </nav>
      </div>
    </header>

    <main class="landing-shell">
      <!-- Hero -->
      <section class="landing-hero">
        <div class="landing-hero-copy">
          <p class="landing-eyebrow">WELCOME TO BUJO</p>
          <h1 class="landing-title">BuJo</h1>
          <p class="landing-tagline">
            接住那些微小的計畫，<br />
            把在乎的人留在身邊，<br />
            輕輕推一把，讓今天動起來。<span aria-hidden="true">▶</span>
          </p>
          <div class="landing-hero-actions">
            <RouterLink to="/register" class="landing-btn landing-btn--primary">
              開始使用 <span aria-hidden="true">→</span>
            </RouterLink>
            <RouterLink to="/login" class="landing-btn landing-btn--outline">
              探索行事曆
            </RouterLink>
          </div>
        </div>

        <div class="landing-hero-figure" aria-hidden="true">
          <div class="landing-avatar-frame">
            <svg viewBox="0 0 120 120" class="landing-avatar-svg">
              <circle cx="60" cy="58" r="34" fill="#f6d9c4" />
              <path
                d="M26 58c0-20 15-36 34-36s34 16 34 36c-6-4-10-12-10-12s-6 8-16 8-16-8-16-8-4 10-12 12c-8-2-14-2-14-2z"
                fill="#3a2c22"
              />
              <circle cx="60" cy="20" r="9" fill="#3a2c22" />
              <circle cx="46" cy="60" r="3" fill="#3a2c22" />
              <circle cx="74" cy="60" r="3" fill="#3a2c22" />
              <ellipse cx="42" cy="70" rx="6" ry="4" fill="#e8a4b0" opacity="0.7" />
              <ellipse cx="78" cy="70" rx="6" ry="4" fill="#e8a4b0" opacity="0.7" />
              <path
                d="M50 76c3 4 17 4 20 0"
                stroke="#3a2c22"
                stroke-width="2.5"
                fill="none"
                stroke-linecap="round"
              />
            </svg>
            <span class="landing-avatar-pin"></span>
          </div>
          <span class="landing-figure-star landing-figure-star--pink">★</span>
          <span class="landing-figure-star landing-figure-star--green">★</span>
          <span class="landing-figure-dot landing-figure-dot--a"></span>
        </div>
      </section>

      <!-- Bento grid -->
      <section class="landing-bento" aria-label="BuJo 功能一覽">
        <article class="landing-card landing-card--note landing-card--green">
          <span class="landing-tape landing-tape--top"></span>
          <p class="landing-card-title">BUJO IS FOR <span aria-hidden="true">♥</span></p>
          <ul class="landing-checklist">
            <li v-for="item in bujoIsFor" :key="item">
              <span aria-hidden="true">☐</span>{{ item }}
            </li>
          </ul>
        </article>

        <article class="landing-card landing-card--calendar">
          <span class="landing-pushpin"></span>
          <p class="landing-card-title">{{ monthLabel }}</p>
          <div class="landing-calendar-grid">
            <span v-for="wd in weekdayLabels" :key="wd" class="landing-calendar-weekday">{{
              wd
            }}</span>
            <template v-for="(week, wi) in calendarWeeks" :key="wi">
              <span
                v-for="(day, di) in week"
                :key="`${wi}-${di}`"
                class="landing-calendar-day"
                :class="{
                  'is-today': day === todayDate,
                  'is-marked': highlightDates.includes(day),
                  'is-empty': !day,
                }"
              >
                {{ day || '' }}
              </span>
            </template>
          </div>
        </article>

        <article class="landing-card landing-card--note landing-card--blue">
          <p class="landing-card-title">TODAY'S NUDGE</p>
          <p class="landing-nudge-text">你跟 Bob 約了晚上 7 點的計畫，別忘了邀請 Alice！</p>
          <span class="landing-nudge-icon" aria-hidden="true">✦</span>
        </article>

        <article class="landing-card landing-card--photo landing-card--photo-dusk">
          <span class="landing-photo-grain" aria-hidden="true"></span>
          <span class="landing-photo-caption">slow afternoon</span>
        </article>

        <article class="landing-card landing-card--note landing-card--tan">
          <span class="landing-tape landing-tape--top"></span>
          <p class="landing-card-title">CREATE IN SECONDS</p>
          <ul class="landing-checklist">
            <li v-for="item in createInSeconds" :key="item">
              <span aria-hidden="true">☐</span>{{ item }}
            </li>
          </ul>
        </article>

        <article class="landing-card landing-card--note landing-card--purple">
          <p class="landing-card-title">WHY BUJO?</p>
          <p class="landing-nudge-text">
            因為最好的時光，<br />
            是有人一起才更有意義。
          </p>
        </article>

        <article class="landing-card landing-card--photo landing-card--photo-coffee">
          <span class="landing-photo-grain" aria-hidden="true"></span>
          <span class="landing-photo-caption">coffee &amp; plans</span>
        </article>
      </section>

      <!-- Feature strip -->
      <section class="landing-features" aria-label="核心功能">
        <article v-for="feature in features" :key="feature.title" class="landing-feature">
          <span class="landing-feature-icon" :style="{ '--icon-color': feature.color }">
            <component :is="feature.icon" class="w-5 h-5" />
          </span>
          <p class="landing-feature-title">{{ feature.title }}</p>
          <span class="landing-feature-rule" :style="{ backgroundColor: feature.color }"></span>
          <p class="landing-feature-desc">{{ feature.desc }}</p>
        </article>
      </section>

      <!-- Quote banner -->
      <section class="landing-quote">
        <span class="landing-quote-mark" aria-hidden="true">&ldquo;</span>
        <p class="landing-quote-text">小小的計畫，正在被看見。<span aria-hidden="true">♥</span></p>
      </section>
    </main>

    <footer class="landing-footer">
      <img :src="bujoLogoUrl" alt="BuJo" class="landing-footer-logo" />
      <p class="landing-footer-copy">&copy; {{ currentYear }} BuJo. 不揪喔～說完，你就揪到了。</p>
      <div class="landing-footer-links">
        <RouterLink to="/login" class="landing-link">登入</RouterLink>
        <RouterLink to="/register" class="landing-link">註冊</RouterLink>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  CalendarDaysIcon,
  BellAlertIcon,
  UserGroupIcon,
  PencilSquareIcon,
} from '@heroicons/vue/24/outline'
import bujoLogoUrl from '@/assets/bujo-logo.svg'

const weekdayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const bujoIsFor = ['small plans', 'social calendar', 'reminders', 'close friends', 'easy creation']
const createInSeconds = ['選時間', '選地點', '邀朋友', '完成！']

const features = [
  {
    title: 'SOCIAL CALENDAR',
    desc: '一眼看清所有人的計畫，通通匯在同一個地方。',
    icon: CalendarDaysIcon,
    color: 'var(--bujo-card-pink)',
  },
  {
    title: 'SMART REMINDERS',
    desc: '溫柔的提醒，讓你不再錯過那些小小的計畫。',
    icon: BellAlertIcon,
    color: 'var(--bujo-accent)',
  },
  {
    title: 'CLOSE FRIENDS',
    desc: '跟在乎的人保持連結，一起把日子過得更好。',
    icon: UserGroupIcon,
    color: 'var(--landing-purple)',
  },
  {
    title: 'EASY CREATION',
    desc: '幾秒鐘建立計畫，一鍵邀請所有人加入。',
    icon: PencilSquareIcon,
    color: 'var(--bujo-card-blue)',
  },
]

const today = new Date()
const currentYear = today.getFullYear()
const monthIndex = today.getMonth()
const todayDate = today.getDate()
const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate()

const monthLabel = computed(
  () => today.toLocaleString('en-US', { month: 'long' }).toUpperCase() + ' ' + currentYear,
)

const calendarWeeks = computed(() => {
  const firstWeekday = (new Date(currentYear, monthIndex, 1).getDay() + 6) % 7
  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
})

const highlightDates = computed(() =>
  [todayDate + 2, todayDate + 4].filter((d) => d <= daysInMonth),
)
</script>

<style scoped>
.landing-page {
  --landing-bg: #f6f1e6;
  --landing-ink: #21201b;
  --landing-muted: #6b6560;
  --landing-border: #ddd6c8;
  --landing-surface: #fdfbf5;
  --landing-purple: #c9b8e8;

  min-height: 100%;
  background-color: var(--landing-bg);
  color: var(--landing-ink);
  font-family: var(--bujo-font-body);
}

.landing-page * {
  box-sizing: border-box;
}

/* 頂部導覽 */
.landing-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid rgb(var(--bujo-ink-rgb) / 0.06);
  background: rgb(246 241 230 / 0.86);
  backdrop-filter: blur(6px);
}

.landing-topbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1180px;
  margin: 0 auto;
  padding: 14px 20px;
}

.landing-topbar-logo {
  height: 28px;
  width: auto;
}

.landing-topbar-actions {
  display: flex;
  align-items: center;
  gap: 18px;
}

.landing-link {
  color: var(--landing-ink);
  font-family: var(--bujo-font-meta);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
}

.landing-link:hover {
  text-decoration: underline;
}

.landing-cta-pill {
  border: 1.5px solid var(--landing-ink);
  border-radius: 999px;
  padding: 7px 18px;
  color: var(--landing-ink);
  font-family: var(--bujo-font-meta);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  transition:
    background-color 160ms ease,
    color 160ms ease;
}

.landing-cta-pill:hover {
  background: var(--landing-ink);
  color: var(--landing-bg);
}

.landing-shell {
  max-width: 1180px;
  margin: 0 auto;
  padding: 56px 20px 80px;
}

/* Hero */
.landing-hero {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
  gap: 32px;
  margin-bottom: 56px;
}

.landing-eyebrow {
  margin: 0 0 10px;
  color: var(--landing-muted);
  font-family: var(--bujo-font-meta);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
}

.landing-title {
  margin: 0 0 18px;
  color: var(--landing-ink);
  font-family: var(--bujo-font-heading);
  font-size: clamp(3.5rem, 10vw, 6.5rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 0.95;
}

.landing-tagline {
  max-width: 30ch;
  margin: 0 0 28px;
  border-left: 3px solid var(--bujo-deco-pink);
  padding-left: 14px;
  color: var(--landing-ink);
  font-family: var(--bujo-font-body);
  font-size: 17px;
  font-weight: 600;
  line-height: 1.6;
}

.landing-hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.landing-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  padding: 12px 24px;
  font-family: var(--bujo-font-meta);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  transition:
    transform 160ms ease,
    background-color 160ms ease,
    color 160ms ease;
}

.landing-btn:active {
  transform: translateY(1px);
}

.landing-btn--primary {
  border: 1.5px solid var(--landing-ink);
  background: var(--landing-ink);
  color: var(--landing-bg);
}

.landing-btn--primary:hover {
  background: #34322b;
}

.landing-btn--outline {
  border: 1.5px solid var(--landing-ink);
  background: transparent;
  color: var(--landing-ink);
}

.landing-btn--outline:hover {
  background: rgb(var(--bujo-ink-rgb) / 0.06);
}

.landing-hero-figure {
  position: relative;
  justify-self: end;
  width: 148px;
}

.landing-avatar-frame {
  position: relative;
  transform: rotate(6deg);
  border: 1px solid var(--landing-border);
  border-radius: 6px;
  background: var(--landing-surface);
  padding: 10px 10px 22px;
  box-shadow:
    0 4px 6px rgb(0 0 0 / 0.06),
    0 12px 24px rgb(0 0 0 / 0.08);
}

.landing-avatar-svg {
  display: block;
  width: 100%;
  height: auto;
  background: #f0e6d6;
}

.landing-avatar-pin {
  position: absolute;
  top: -8px;
  left: 50%;
  width: 14px;
  height: 14px;
  transform: translateX(-50%);
  border-radius: 50%;
  background: var(--bujo-deco-pink);
  box-shadow: 0 2px 3px rgb(0 0 0 / 0.25);
}

.landing-figure-star {
  position: absolute;
  font-size: 18px;
  line-height: 1;
}

.landing-figure-star--pink {
  top: -6px;
  right: -14px;
  color: var(--bujo-deco-pink);
}

.landing-figure-star--green {
  bottom: 30px;
  left: -18px;
  font-size: 13px;
  color: var(--bujo-accent);
}

.landing-figure-dot {
  position: absolute;
  border-radius: 50%;
}

.landing-figure-dot--a {
  bottom: 8px;
  right: -10px;
  width: 8px;
  height: 8px;
  background: var(--bujo-deco-blue);
}

/* Bento grid */
.landing-bento {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-bottom: 64px;
}

.landing-card {
  position: relative;
  border-radius: 10px;
  padding: 18px;
  transition:
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.landing-card:hover {
  transform: rotate(0deg) translateY(-3px);
  box-shadow: 0 14px 28px rgb(0 0 0 / 0.1);
  z-index: 1;
}

.landing-card:nth-child(4n + 1) {
  transform: rotate(-1.4deg);
}
.landing-card:nth-child(4n + 2) {
  transform: rotate(0.6deg);
}
.landing-card:nth-child(4n + 3) {
  transform: rotate(-0.7deg);
}
.landing-card:nth-child(4n) {
  transform: rotate(1.2deg);
}

.landing-card--note {
  box-shadow:
    0 2px 4px rgb(0 0 0 / 0.05),
    0 8px 16px rgb(0 0 0 / 0.06);
}

.landing-card--green {
  background: #e3ecd9;
}
.landing-card--blue {
  background: #dcebef;
}
.landing-card--tan {
  background: #ece3cf;
}
.landing-card--purple {
  background: #ece5f5;
}

.landing-card-title {
  margin: 0 0 10px;
  font-family: var(--bujo-font-meta);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.landing-checklist {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-family: var(--bujo-font-meta);
  font-size: 13px;
}

.landing-checklist li {
  display: flex;
  align-items: center;
  gap: 8px;
}

.landing-nudge-text {
  margin: 0;
  font-family: var(--bujo-font-body);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.55;
}

.landing-nudge-icon {
  position: absolute;
  top: 14px;
  right: 16px;
  color: var(--bujo-deco-blue);
}

.landing-tape {
  position: absolute;
  width: 54px;
  height: 18px;
  background: rgb(255 255 255 / 0.55);
  border: 1px solid rgb(255 255 255 / 0.7);
}

.landing-tape--top {
  top: -9px;
  left: 50%;
  transform: translateX(-50%) rotate(-3deg);
}

.landing-pushpin {
  position: absolute;
  top: -7px;
  left: 50%;
  width: 12px;
  height: 12px;
  transform: translateX(-50%);
  border-radius: 50%;
  background: var(--bujo-deco-green);
  box-shadow: 0 2px 3px rgb(0 0 0 / 0.25);
}

/* Calendar card */
.landing-card--calendar {
  grid-column: span 2;
  background: var(--landing-surface);
  border: 1px solid var(--landing-border);
}

.landing-calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  font-family: var(--bujo-font-meta);
}

.landing-calendar-weekday {
  padding-bottom: 4px;
  color: var(--landing-muted);
  font-size: 11px;
  font-weight: 700;
  text-align: center;
}

.landing-calendar-day {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  border-radius: 50%;
  font-size: 12px;
}

.landing-calendar-day.is-today {
  background: var(--bujo-notification);
  color: #fff;
  font-weight: 700;
}

.landing-calendar-day.is-marked {
  background: var(--bujo-accent);
  color: var(--landing-ink);
  font-weight: 700;
}

.landing-calendar-day.is-empty {
  visibility: hidden;
}

/* Photo cards */
.landing-card--photo {
  overflow: hidden;
  padding: 10px 10px 34px;
  background: var(--landing-surface);
  border: 1px solid var(--landing-border);
}

.landing-card--photo::before {
  content: '';
  display: block;
  aspect-ratio: 4 / 3;
  margin-bottom: 8px;
}

.landing-card--photo-dusk::before {
  background: linear-gradient(160deg, #f3c9a8 0%, #e8a49a 35%, #7d8fae 75%, #40476b 100%);
}

.landing-card--photo-coffee::before {
  background: linear-gradient(160deg, #e9d9bd 0%, #cdb494 45%, #8a6a4d 80%, #52392a 100%);
}

.landing-photo-grain {
  position: absolute;
  inset: 10px 10px 34px;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E");
  pointer-events: none;
}

.landing-photo-caption {
  position: absolute;
  bottom: 10px;
  left: 14px;
  color: var(--landing-muted);
  font-family: var(--bujo-font-body);
  font-size: 13px;
  font-style: italic;
}

/* Feature strip */
.landing-features {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-bottom: 56px;
  border-top: 1px solid var(--landing-border);
  border-bottom: 1px solid var(--landing-border);
  padding: 28px 0;
}

.landing-feature {
  display: grid;
  gap: 8px;
}

.landing-feature-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--icon-color) 30%, white);
  color: var(--landing-ink);
}

.landing-feature-title {
  margin: 0;
  font-family: var(--bujo-font-meta);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.landing-feature-rule {
  width: 26px;
  height: 3px;
}

.landing-feature-desc {
  margin: 0;
  max-width: 26ch;
  color: var(--landing-muted);
  font-size: 13px;
  line-height: 1.6;
}

/* Quote */
.landing-quote {
  position: relative;
  border: 1px solid var(--landing-border);
  border-radius: 10px;
  background: var(--landing-surface);
  padding: 40px 32px;
  text-align: center;
}

.landing-quote-mark {
  display: block;
  margin-bottom: 4px;
  color: var(--bujo-accent);
  font-family: Georgia, serif;
  font-size: 42px;
  font-weight: 700;
  line-height: 1;
}

.landing-quote-text {
  margin: 0;
  font-family: var(--bujo-font-body);
  font-size: clamp(1.1rem, 3vw, 1.5rem);
  font-style: italic;
  font-weight: 700;
}

/* Footer */
.landing-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  max-width: 1180px;
  margin: 0 auto;
  border-top: 1px solid var(--landing-border);
  padding: 20px;
  color: var(--landing-muted);
}

.landing-footer-logo {
  height: 22px;
  width: auto;
}

.landing-footer-copy {
  margin: 0;
  font-size: 12px;
}

.landing-footer-links {
  display: flex;
  gap: 16px;
}

/* RWD */
@media (max-width: 1023px) {
  .landing-bento {
    grid-template-columns: repeat(2, 1fr);
  }
  .landing-card--calendar {
    grid-column: span 2;
  }
  .landing-features {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 767px) {
  .landing-hero {
    grid-template-columns: 1fr;
  }
  .landing-hero-figure {
    justify-self: start;
  }
  .landing-tagline {
    font-size: 15px;
  }
  .landing-bento {
    grid-template-columns: 1fr;
  }
  .landing-card--calendar {
    grid-column: span 1;
  }
  .landing-card:nth-child(n) {
    transform: none;
  }
  .landing-card:hover {
    transform: translateY(-2px);
  }
  .landing-features {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
