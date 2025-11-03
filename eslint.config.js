import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      // Add any custom rules here
      'no-unused-vars': 'warn',
      'no-console': 'warn',
      // Disable the problematic rule for conditional imports
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
];