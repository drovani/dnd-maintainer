import { Given, When, Then } from '@cucumber/cucumber';
import { renderHook, waitFor } from '@testing-library/react';
import type { DndWorld } from '../../steps/support/world.js';
import { buildCampaign } from '../../steps/support/fixtures.js';

Given('a campaign named {string} exists', function (this: DndWorld, name: string) {
  this.mockQueryResult.data = [buildCampaign({ name })];
});

When('the Dungeon Master views their campaigns', async function (this: DndWorld) {
  const mod = (await this.importWithSupabase('@/hooks/useCampaigns')) as {
    useCampaigns: () => { isSuccess: boolean; isError: boolean; data?: unknown[] };
  };

  const useCampaigns = mod.useCampaigns;
  this.hookResult = renderHook(() => useCampaigns(), { wrapper: this.createWrapper() });

  await waitFor(() => {
    const r = this.hookResult!.result.current as { isSuccess: boolean; isError: boolean };
    if (!r.isSuccess && !r.isError) {
      throw new Error(
        `useCampaigns hook never settled: ${JSON.stringify({ isSuccess: r.isSuccess, isError: r.isError })}`
      );
    }
  });
});

Then('{string} appears in the list', function (this: DndWorld, name: string) {
  const r = this.hookResult!.result.current as { data?: { name: string }[] };
  if (!r.data || r.data.length !== 1) {
    throw new Error(`Expected 1 campaign, got ${r.data?.length ?? 0}`);
  }
  if (r.data[0].name !== name) {
    throw new Error(`Expected campaign name "${name}", got "${r.data[0].name}"`);
  }
});
