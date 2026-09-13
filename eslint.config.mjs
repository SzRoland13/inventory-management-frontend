import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      '.next/**',
      '.env',
      'node_modules',
      'public/**',
      'next.config.js',
      'postcss.config.js',
      'next-env.d.ts',
    ],
  },
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    plugins: { js },
    extends: ['js/recommended'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: { globals: globals.browser },
  },
  {
    rules: {
      'no-unused-vars': ['warn'],
      'no-undef': ['warn'],
      quotes: ['warn', 'single', { avoidEscape: true }],
      semi: ['warn', 'always'],
      indent: ['warn', 2],
      'class-methods-use-this': 'warn',
      'eol-last': ['warn', 'always'],
      'no-unused-expressions': ['warn'],
      'no-multiple-empty-lines': ['error', { max: 1 }],
      'no-trailing-spaces': ['warn'],
      'no-useless-constructor': 0,
      'no-loop-func': 0,
    },
  },

  js.configs.recommended,
  tseslint.configs.recommended,
]);
