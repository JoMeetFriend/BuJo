import { GoogleGenAI } from '@google/genai';

const MAX_DIFF_BYTES = 30 * 1024;
const GEMINI_MODEL = 'gemini-2.0-flash';

const { GOOGLE_API_KEY, GITHUB_TOKEN, REPO, PR_NUMBER, PR_TITLE, PR_BASE, PR_HEAD } = process.env;

function truncateDiff(diff) {
  const byteLen = Buffer.byteLength(diff, 'utf8');
  if (byteLen <= MAX_DIFF_BYTES) return { diff, truncated: false };
  const ratio = MAX_DIFF_BYTES / byteLen;
  return { diff: diff.slice(0, Math.floor(diff.length * ratio)), truncated: true };
}

async function githubRequest(path, options = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${path} → ${res.status}: ${text}`);
  }
  return res;
}

async function getPrDiff() {
  const res = await githubRequest(`/repos/${REPO}/pulls/${PR_NUMBER}`, {
    headers: { Accept: 'application/vnd.github.diff' },
  });
  return res.text();
}

async function postComment(body) {
  await githubRequest(`/repos/${REPO}/issues/${PR_NUMBER}/comments`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body }),
  });
}


function buildPrompt(diff) {
  return `你是一位資深 Vue 3 前端工程師，正在審查 BuJo 項目的 Pull Request。

**PR 資訊**
- 標題：${PR_TITLE ?? '（未知）'}
- 來源分支：\`${PR_HEAD ?? '?'}\` → \`${PR_BASE ?? '?'}\`

請針對以下 Git diff 進行代碼審查，重點關注這些面向（只回報真正有問題的項目，避免雞蛋裡挑骨頭）：

### 1. Vue 3 組件風格
- 是否使用 \`<script setup>\` 語法（避免 Options API）
- 模板結構順序是否為 \`<template> → <script> → <style>\`
- props/emits 是否有明確型別定義
- 組件命名是否符合 PascalCase

### 2. 組件通信
- 父子通信是否使用 props/emits 而非直接操作 DOM
- 是否有不必要的 \`ref\` 或 \`reactive\` 暴露給外部

### 3. Pinia Store
- action 是否有副作用需要清楚文件化
- 是否直接修改 state 而非透過 action
- store 命名是否為 \`useXxxStore\`

### 4. TypeScript
- 是否使用 \`any\` 型別（應改為 \`unknown\` 或具體型別）
- reactive/ref 是否有明確型別參數
- API response 型別是否定義

### 5. Vitest 測試
- 新增的函式或 composable 是否有對應測試
- 測試案例是否覆蓋邊界條件

### 6. 一般品質
- 是否有明顯重複邏輯可以提取
- 注入的依賴（inject/provide）是否有型別安全
- console.log 是否遺留在生產代碼中

---

請用**繁體中文**回覆，格式如下：

#### 總結
（1-2 句話概述這個 PR 的改動）

#### 問題
（如無問題請寫「✅ 無明顯問題」）
| # | 位置 | 嚴重度 | 問題描述 | 建議 |
|---|------|--------|---------|------|
| 1 | \`檔案名:行號\` | 🔴高/🟡中/🟢低 | ... | ... |

#### 優點
（如有值得稱讚的地方，請列出）

#### 建議優先處理
（列出最重要的 1-3 項，若無問題則省略）

---

Git diff：
\`\`\`diff
${diff}
\`\`\``;
}

async function reviewWithGemini(diff) {
  if (!GOOGLE_API_KEY) throw new Error('GOOGLE_API_KEY 環境變數未設置');
  const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
  const result = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: buildPrompt(diff),
  });
  return result.text;
}

async function main() {
  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN 未設置');
  if (!REPO || !PR_NUMBER) throw new Error('REPO / PR_NUMBER 未設置');

  console.log(`正在取得 PR #${PR_NUMBER} 的 diff...`);
  const rawDiff = await getPrDiff();

  const { diff, truncated } = truncateDiff(rawDiff);
  if (truncated) {
    console.warn(`⚠️ diff 超過 ${MAX_DIFF_BYTES / 1024}KB，已截斷至前 30KB`);
  }

  console.log('送出 Gemini 審查請求...');
  const review = await reviewWithGemini(diff);

  const truncatedNote = truncated
    ? '\n\n> ⚠️ **注意**：此 PR 的 diff 超過 30KB，Gemini 僅審查了前 30KB 的變更。\n'
    : '';

  const comment = [
    '## 🤖 Gemini 自動代碼審查',
    '',
    review,
    truncatedNote,
    '---',
    `*由 [Gemini ${GEMINI_MODEL}](https://ai.google.dev) 自動生成 · ${new Date().toISOString()}*`,
  ].join('\n');

  console.log('發佈審查留言...');
  await postComment(comment);

  console.log('✅ 代碼審查完成');
}

main().catch((err) => {
  console.error('❌ 審查失敗:', err.message);
  process.exit(1);
});
