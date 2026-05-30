import { When } from '@cucumber/cucumber';
import { createElement } from 'react';
import type { DndWorld } from '../../steps/support/world.js';

// ---------------------------------------------------------------------------
// Campaign search — render-app seam.
//
// Reuses the global "a campaign named {string} exists" Given (campaigns.steps.ts)
// and the global "{string} appears in the list" / "does not appear in the list"
// Then steps. Only the search-specific When steps live here. The render helper
// mirrors campaigns.steps.ts's renderCampaignList (those helpers are module-local
// there, so a small local copy keeps this file self-contained).
// ---------------------------------------------------------------------------

async function renderCampaignList(world: DndWorld) {
  const hooks = await world.esmockWithSupabase('@/hooks/useCampaigns');
  const mod = await world.esmockWithSupabase('@/pages/CampaignList', {
    '@/hooks/useCampaigns': hooks,
    '@/hooks/usePageTitle': { usePageTitle: () => undefined },
  });
  const CampaignList = (mod.default ?? (mod as { CampaignList: unknown }).CampaignList) as () => React.ReactElement;
  const r = await world.renderRoute('/', createElement(CampaignList));
  await r.rtl.waitFor(() => {
    if ((document.body.textContent ?? '').includes('Loading')) throw new Error('still loading');
  });
  return r;
}

function searchInput(): HTMLInputElement {
  const input = (Array.from(document.querySelectorAll('input')) as HTMLInputElement[]).find((i) =>
    /search campaigns/i.test(i.placeholder)
  );
  if (!input) {
    throw new Error('Could not find the campaign search input (placeholder "Search campaigns by name or setting...")');
  }
  return input;
}

// React 19 controlled inputs need user-event to fire onChange (see campaigns.steps.ts).
async function typeInto(el: HTMLInputElement, value: string): Promise<void> {
  const userEvent = (await import('@testing-library/user-event')).default;
  const user = userEvent.setup({ document });
  await user.clear(el);
  if (value) await user.type(el, value);
}

When('the Dungeon Master searches campaigns for {string}', async function (this: DndWorld, query: string) {
  await renderCampaignList(this);
  await typeInto(searchInput(), query);
});

When('the Dungeon Master clears the campaign search', async function (this: DndWorld) {
  const el = searchInput();
  const userEvent = (await import('@testing-library/user-event')).default;
  const user = userEvent.setup({ document });
  // user.clear() sets the DOM value but does not reliably fire React's onChange in
  // this jsdom harness (React 19 value-tracker). Select-all + Delete emits real
  // keystroke input events, so the controlled searchTerm state actually resets.
  await user.click(el);
  await user.keyboard('{Control>}a{/Control}{Delete}');
});
