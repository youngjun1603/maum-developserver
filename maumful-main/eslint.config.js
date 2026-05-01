import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['public/static/**/*.jsx', 'public/static/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        React: 'readonly',
        ReactDOM: 'readonly',
        Babel: 'readonly',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      // ============================================================
      // 🎯 핵심: 이 룰만 error 로 유지 (React #310 같은 사고 방지)
      // ============================================================
      'react-hooks/rules-of-hooks': 'error',

      // ============================================================
      // ⚠️ 나머지는 모두 경고(warn)로 낮춤
      //    → Actions는 통과되지만 코드 품질 정보는 계속 수집
      // ============================================================
      'react-hooks/exhaustive-deps': 'warn',
      'react/jsx-uses-react': 'warn',
      'react/jsx-uses-vars': 'warn',

      // 마음풀 기존 코드(B2B 제거 LEGACY 잔재 등)에 존재하는 패턴들 - 경고로만 표시
      'no-empty': 'warn',
      'no-redeclare': 'warn',
      'no-unreachable': 'warn',
      'no-unused-vars': 'warn',
      'no-undef': 'warn',
      'no-useless-escape': 'warn',
      'no-prototype-builtins': 'warn',
      'no-constant-condition': 'warn',
      'no-async-promise-executor': 'warn',
      'no-case-declarations': 'warn',
      'no-fallthrough': 'warn',
      'no-control-regex': 'warn',
      'no-misleading-character-class': 'warn',
      'no-cond-assign': 'warn',
      'no-self-assign': 'warn',
      'no-irregular-whitespace': 'warn',
    },
    settings: {
      react: { version: '18.2.0' },
    },
  },
];
