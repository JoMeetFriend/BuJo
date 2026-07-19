import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from 'eslint-config-prettier/flat'
import pluginVueI18n from '@intlify/eslint-plugin-vue-i18n'

export default defineConfig([
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,js,mjs,jsx}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '**/.vite/**']),

  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  {
    files: ['**/__tests__/**', '**/*.{test,spec}.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],

  {
    name: 'app/i18n-checks',
    files: ['src/**/*.{vue,js}'],
    plugins: {
      '@intlify/vue-i18n': pluginVueI18n,
    },
    settings: {
      'vue-i18n': {
        localeDir: './src/locales/*.{json,yaml,yml}',
        messageSyntaxVersion: '^9.0.0',
      },
    },
    rules: {
      '@intlify/vue-i18n/no-missing-keys': 'error',
    },
  },

  {
    rules: {
      'vue/block-order': ['error', { order: ['template', 'script', 'style'] }],
    },
  },

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  skipFormatting,
])
