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

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = path.resolve(__dirname, '../../');

register(
  pathToFileURL(repoRoot + '/features/support/alias-loader.mjs').href,
  import.meta.url,
);
