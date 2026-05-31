import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../');

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const resolved = specifier.replace('@/', repoRoot + '/src/');
    const resolvedUrl = pathToFileURL(resolved).href;
    return nextResolve(resolvedUrl, context);
  }
  return nextResolve(specifier, context);
}

// Patch Vite-specific import.meta.env references so src/ modules work under Node.
export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  // Only process files from our src/ directory
  if (!url.includes('/src/')) return result;

  let source = result.source;
  if (typeof source !== 'string') {
    if (source instanceof Uint8Array) {
      source = new TextDecoder().decode(source);
    } else {
      return result;
    }
  }

  if (!source.includes('import.meta.env')) return result;

  const patched = source
    .replace(/import\.meta\.env\.DEV/g, 'false')
    .replace(/import\.meta\.env\.PROD/g, 'true')
    .replace(/import\.meta\.env\.MODE/g, '"test"')
    .replace(/import\.meta\.env\.SSR/g, 'false')
    // Provide placeholder values for Vite env vars so modules load without throwing
    .replace(/import\.meta\.env\.VITE_SUPABASE_URL/g, '"http://localhost:54321"')
    .replace(/import\.meta\.env\.VITE_SUPABASE_ANON_KEY/g, '"test-anon-key"')
    // Mute loggers during BDD so a passing run is nothing but green dots.
    .replace(/import\.meta\.env\.VITE_LOG_LEVEL/g, '"silent"')
    .replace(/import\.meta\.env\.VITE_\w+/g, 'undefined')
    .replace(/import\.meta\.env/g, '({DEV:false,PROD:true,MODE:"test",SSR:false})');

  return { ...result, source: patched };
}
