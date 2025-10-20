module.exports = {
  extends: [
    'next/core-web-vitals'
  ],
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'no-console': 'off',
    'no-debugger': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
