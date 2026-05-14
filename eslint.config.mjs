import tseslint from 'typescript-eslint'

const eslintConfig = [
  ...tseslint.configs.recommended,
  {
    ignores: ['node_modules/**', '.next/**', 'dist/**', 'coverage/**', 'next-env.d.ts'],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
]

export default eslintConfig
