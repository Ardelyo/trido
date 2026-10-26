import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

// Intentionally lenient: surfaces debt as warnings so CI stays green while we pay it down.
export default tseslint.config(
  { ignores: ['dist/**', 'dist-electron/**', 'dist-release/**', 'public/**', 'node_modules/**', 'scripts/**', 'api/**/*.js'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
      'prefer-const': 'warn',
      'no-useless-escape': 'warn',
      'no-case-declarations': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-console': 'off',
    },
  },
);
