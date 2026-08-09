/** Shared ESLint baseline — apps may extend with their own tooling. */
module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  env: {
    es2022: true,
    node: true,
  },
  ignorePatterns: ['dist', 'node_modules', '.turbo', '.next', '.expo'],
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
};
