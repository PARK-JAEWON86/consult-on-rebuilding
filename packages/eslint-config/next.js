module.exports = {
  extends: [
    './base.js',
    'next/core-web-vitals',
  ],
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
  env: {
    browser: true,
    node: true,
  },
}
