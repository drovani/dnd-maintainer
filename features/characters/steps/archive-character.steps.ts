import { Given, When, Then } from '@cucumber/cucumber';
import { createElement } from 'react';
import type { DndWorld } from '../../steps/support/world.js';
import type { Campaign } from '../../../src/types/database.js';
import type { Row } from '../../steps/support/stateful-supabase.js';

// ---------------------------------------------------------------------------
// Archive character — render-app seam against CharacterList.
//
// The character list is campaign-scoped via useCampaignContext (stubbed) and
// queries useCharacters(campaignId). We seed a character row directly (active or
// archived) and assert what the rendered list shows. The archived case is
// @future: useCharacters has no is_active filter, so an archived character is
// not actually hidden yet.
// ---------------------------------------------------------------------------

let _seq = 0;

function seedCampaignWithCharacter(world: DndWorld, name: string, isActive: boolean): Campaign {
  _seq += 1;
  const campaign: Campaign = {
    id: `arch-c${_seq}`,
    slug: `campaign-${_seq}`,
    previous_slugs: [],
    name: `Campaign ${_seq}`,
    description: null,
    setting: null,
    status: 'active',
    theme: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    archived_at: null,
  };
  world.db.seed('campaigns', [campaign as unknown as Row]);
  world.db.seed('characters', [
    {
      id: `arch-ch${_seq}`,
      campaign_id: campaign.id,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name,
      character_type: 'pc',
      is_active: isActive,
      level: 1,
      updated_at: '2024-01-01T00:00:00Z',
    } as Row,
  ]);
  world.createdCampaign = campaign;
  return campaign;
}

async function renderCharacterList(world: DndWorld, campaign: Campaign) {
  const useCharactersMod = await world.esmockWithSupabase('@/hooks/useCharacters');
  const mod = await world.esmockWithSupabase('@/pages/CharacterList', {
    '@/hooks/useCharacters': useCharactersMod,
    '@/hooks/useCampaignContext': {
      useCampaignContext: () => ({
        campaignSlug: campaign.slug,
        campaignId: campaign.id,
        setPageTitle: () => undefined,
      }),
    },
    '@/hooks/usePageTitle': { usePageTitle: () => undefined },
  });
  const CharacterList = (mod.default ?? (mod as { CharacterList: unknown }).CharacterList) as () => React.ReactElement;
  const router = (await import('react-router-dom')) as typeof import('react-router-dom');
  const tree = createElement(
    router.Routes,
    null,
    createElement(router.Route, { path: '/campaign/:campaignSlug', element: createElement(CharacterList) })
  );
  const r = await world.renderRoute(`/campaign/${campaign.slug}`, tree);
  await r.rtl.waitFor(() => {
    if ((document.body.textContent ?? '').includes('Loading')) throw new Error('character list still loading');
  });
  return r;
}

Given('a campaign with an active character named {string}', function (this: DndWorld, name: string) {
  seedCampaignWithCharacter(this, name, true);
});

Given('a campaign with an archived character named {string}', function (this: DndWorld, name: string) {
  seedCampaignWithCharacter(this, name, false);
});

When('the Dungeon Master views the character list', async function (this: DndWorld) {
  await renderCharacterList(this, this.createdCampaign!);
});

Then('{string} appears in the character list', function (this: DndWorld, name: string) {
  const txt = document.body.textContent ?? '';
  if (!txt.includes(name)) {
    throw new Error(`Expected "${name}" in the character list. Body: ${txt.slice(0, 300)}`);
  }
});

Then('{string} does not appear in the character list', function (this: DndWorld, name: string) {
  const txt = document.body.textContent ?? '';
  if (txt.includes(name)) {
    throw new Error(
      `Expected "${name}" to be hidden from the character list (archived), but it still appears — ` +
        `useCharacters() has no is_active filter`
    );
  }
});
