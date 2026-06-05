import js from '@eslint/js';
import i18next from 'eslint-plugin-i18next';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default defineConfig(
  {
    ignores: ['dist/', 'node_modules/', '.claude/'],
  },
  {
    files: ['features/**/*.{js,mjs,ts,tsx}'],
    languageOptions: {
      globals: {
        URL: 'readonly',
        TextDecoder: 'readonly',
        console: 'readonly',
      },
    },
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ...i18next.configs['flat/recommended'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/*.test.{ts,tsx}', 'src/test/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSAsExpression > TSNeverKeyword',
          message: "Do not use 'as never'. Narrow the type instead — see CLAUDE.md i18n guidance.",
        },
        {
          selector: 'JSXAttribute[name.name="dangerouslySetInnerHTML"]',
          message:
            'Do not use dangerouslySetInnerHTML — it is an XSS sink. Render text via JSX (auto-escaped). See docs/security-review-2026-06-01.md (M2).',
        },
        {
          selector: 'AssignmentExpression[left.property.name="innerHTML"]',
          message:
            'Do not assign to innerHTML — it is an XSS sink. Use textContent or JSX. See docs/security-review-2026-06-01.md (M2).',
        },
      ],
      'no-eval': 'error',
      'no-implied-eval': 'error',
    },
  },
  {
    rules: {
      'no-console': 'error',
    },
  },
  {
    files: ['src/lib/logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    // BDD entrypoint must filter Cucumber's startup banner on the real console.
    files: ['features/support/register.mjs'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    // Standalone CLI tooling (run via tsx, not bundled into the app).
    files: ['scripts/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  prettierConfig
);
