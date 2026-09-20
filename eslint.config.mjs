import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';
import react from 'eslint-plugin-react';

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    ...react.configs.flat.recommended,
    name: 'novellia/react-recommended',
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'],
  },
  {
    ...react.configs.flat['jsx-runtime'],
    name: 'novellia/react-jsx-runtime',
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'],
  },
  {
    name: 'novellia/react-typescript',
    files: ['**/*.{ts,tsx,mts,cts}'],
    // TypeScript checks props; runtime PropTypes are not required in TS files.
    rules: { 'react/prop-types': 'off' },
  },
  {
    name: 'novellia/airbnb-style',
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    // Compatible selections from Airbnb's style guide, not its legacy preset.
    // Additional style rules beyond the React preset. Next supplies Hooks,
    // accessibility, framework, and TypeScript checks.
    rules: {
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': ['error', { destructuring: 'all' }],
      'object-shorthand': ['error', 'always'],
      'prefer-template': 'error',
      'no-param-reassign': ['error', { props: false }],
      'react/jsx-boolean-value': ['error', 'never'],
      'react/jsx-pascal-case': ['error', { allowAllCaps: true }],
      'react/no-array-index-key': 'error',
      'react/no-danger': 'error',
      'react/no-unstable-nested-components': 'error',
      'react/self-closing-comp': 'error',
      'react/button-has-type': 'error',
    },
  },
  // Prettier owns whitespace, quotes, wrapping, and Tailwind class order.
  prettier,
  {
    name: 'novellia/required-braces',
    rules: {
      // Keep after formatting compatibility so braces are always enforced.
      curly: ['error', 'all'],
    },
  },
  globalIgnores(['src/generated/**', 'artifacts/**', 'test-results/**', 'playwright-report/**']),
]);
