import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-useless-escape': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
    },
  },
  {
    files: [
      'src/features/policy-workspace/components/**/*PolicyCard.jsx',
      'src/features/policy-workspace/components/UploadSection.jsx',
    ],
    rules: {
      'no-irregular-whitespace': 'off',
      'no-unused-vars': 'off',
      'no-useless-assignment': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['src/features/policy-workspace/components/PolicyClassification.jsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
