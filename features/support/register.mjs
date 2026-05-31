// Combined registration: @/ alias resolution + Vite import.meta.env polyfill
// Loaded via tsx --import flag so it runs before any module resolution.

import { register } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

// Polyfill Vite's import.meta.env for Node.js (used in src/lib/logger.ts etc.)
// This must happen before any src/ module is imported.
if (typeof import.meta.env === 'undefined') {
  Object.defineProperty(import.meta, 'env', {
    value: { DEV: false, PROD: true, MODE: 'test', SSR: false },
    writable: true,
    configurable: true,
  });
}

// Cucumber emits a Node-version compatibility banner via console.warn before any
// test runs (it ANDs our Node 24 against its narrower enginesTested range). Filter
// only that exact notice so a passing run stays nothing but green dots; every other
// warning still passes through. The durable fix is aligning the Node/Cucumber
// supported versions — this just mutes a known, benign startup line.
const originalWarn = console.warn.bind(console);
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('has not been tested with this version of Cucumber')) {
    return;
  }
  originalWarn(...args);
};

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = path.resolve(__dirname, '../../');

register(
  pathToFileURL(repoRoot + '/features/support/alias-loader.mjs').href,
  import.meta.url,
);
