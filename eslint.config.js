import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

// `_` is the only conventional "intentionally unused" marker. The previous
// `^[A-Z_]` pattern also silenced every capitalised binding, which is exactly
// where a typo in a constant name hides.
const unusedVars = ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }]

export default defineConfig([
  globalIgnores(['dist']),

  // The React app, the standalone projects under public/projects, and the
  // ESM build scripts — all browser-or-ESM context.
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    // Without `jsx-uses-vars` every component imported for JSX use looks unused,
    // which is why the old config had to blanket-ignore capitalised identifiers.
    plugins: { react },
    rules: {
      'react/jsx-uses-vars': 'error',
      'no-unused-vars': unusedVars,
    },
  },

  // Headless regression harnesses are CommonJS and run under Node.
  {
    files: ['tools/**/*.cjs'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: globals.node,
    },
    rules: {
      'no-unused-vars': unusedVars,
    },
  },

  // Build tooling that runs in Node but is authored as ESM.
  {
    files: ['scripts/**/*.js', 'vite.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
