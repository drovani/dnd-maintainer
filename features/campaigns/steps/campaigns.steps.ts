import { Given, When, Then } from '@cucumber/cucumber';
import { renderHook, waitFor } from '@testing-library/react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { DndWorld } from '../../steps/support/world.js';
import { buildCampaign } from '../../steps/support/fixtures.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const srcDir = path.resolve(__dirname, '../../../src');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let hookResult: ReturnType<typeof renderHook<any, any>>;

Given('the Supabase mock returns one campaign named {string}', function (this: DndWorld, name: string) {
  this.mockQueryResult.data = [buildCampaign({ name })];
});

When('I invoke the useCampaigns hook', async function (this: DndWorld) {
  const { default: esmock } = await import('esmock');
  const mod = await esmock(
    path.join(srcDir, 'hooks/useCampaigns.ts'),
    { [path.join(srcDir, 'lib/supabase.ts')]: { supabase: this.supabase } },
  ) as { useCampaigns: () => { isSuccess: boolean; isError: boolean; data?: unknown[] } };

  const useCampaigns = mod.useCampaigns;
  hookResult = renderHook(() => useCampaigns(), { wrapper: this.createWrapper() });

  await waitFor(() => {
    const r = hookResult.result.current as { isSuccess: boolean; isError: boolean };
    if (!r.isSuccess && !r.isError) throw new Error('still loading');
  });
});

Then('the hook result contains one campaign named {string}', function (this: DndWorld, name: string) {
  const r = hookResult.result.current as { data?: { name: string }[] };
  if (!r.data || r.data.length !== 1) {
    throw new Error(`Expected 1 campaign, got ${r.data?.length ?? 0}`);
  }
  if (r.data[0].name !== name) {
    throw new Error(`Expected campaign name "${name}", got "${r.data[0].name}"`);
  }
});
