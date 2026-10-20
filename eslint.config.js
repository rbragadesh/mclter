export default [
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        window: 'readonly', document: 'readonly', navigator: 'readonly', location: 'readonly', localStorage: 'readonly',
        setTimeout: 'readonly', clearTimeout: 'readonly', setInterval: 'readonly', clearInterval: 'readonly',
        requestAnimationFrame: 'readonly', getComputedStyle: 'readonly', matchMedia: 'readonly', innerWidth: 'readonly', innerHeight: 'readonly',
        SpeechSynthesisUtterance: 'readonly', TextEncoder: 'readonly', TextDecoder: 'readonly', btoa: 'readonly', atob: 'readonly',
        self: 'readonly', caches: 'readonly', fetch: 'readonly', Response: 'readonly', URL: 'readonly', console: 'readonly', process: 'readonly', globalThis: 'readonly',
      },
    },
    rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }], 'no-undef': 'error' },
  },
];
