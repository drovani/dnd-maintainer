import { Given, When, Then } from '@cucumber/cucumber';
import { createElement } from 'react';
import type { DndWorld } from '../../steps/support/world.js';
import type { Campaign } from '../../../src/types/database.js';
import type { Row } from '../../steps/support/stateful-supabase.js';

// ---------------------------------------------------------------------------
// Builder autosave / draft resume — render-app seam.
//
// Seeds a draft (characters status='draft' + character_build_levels) and renders
// the real CharacterBuilder at the draft's resume URL. useCharacter +
// useCharacterBuildLevels rehydrate the wizard via the pure CharacterProvider,
// so BasicsStep shows the saved name and species. useCampaignContext is stubbed.
// ---------------------------------------------------------------------------

const BASE_ABILITIES = { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 };

function seedDraft(world: DndWorld, name: string): { campaign: Campaign; slug: string } {
  const campaign: Campaign = {
    id: 'draft-camp',
    slug: 'draft-camp',
    previous_slugs: [],
    name: 'Draft Campaign',
    description: null,
    setting: null,
    status: 'active',
    theme: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    archived_at: null,
    allowed_source_books: ['phb-2024'],
  };
  world.db.seed('campaigns', [campaign as unknown as Row]);

  const id = 'draft-char';
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  world.db.seed('characters', [
    {
      id,
      slug,
      previous_slugs: [],
      campaign_id: campaign.id,
      name,
      status: 'draft',
      character_type: 'pc',
      is_active: true,
      level: 1,
      species: 'human',
      class: 'fighter',
      background: 'soldier',
      alignment: 'neutral-good',
      gender: null,
      player_name: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    } as Row,
  ]);
  world.db.seed('character_build_levels', [
    {
      character_id: id,
      sequence: 0,
      base_abilities: BASE_ABILITIES,
      ability_method: 'standard-array',
      class_id: null,
      class_level: null,
      subclass_id: null,
      asi_allocation: null,
      feat_id: null,
      hp_roll: null,
      choices: null,
      deleted_at: null,
    } as Row,
    {
      character_id: id,
      sequence: 1,
      base_abilities: null,
      ability_method: null,
      class_id: 'fighter',
      class_level: 1,
      subclass_id: null,
      asi_allocation: null,
      feat_id: null,
      hp_roll: null,
      choices: null,
      deleted_at: null,
    } as Row,
  ]);
  world.db.seed('character_items', []);
  world.createdCampaign = campaign;
  return { campaign, slug };
}

let draftSlug = '';

Given('a saved character draft named {string}', function (this: DndWorld, name: string) {
  const { slug } = seedDraft(this, name);
  draftSlug = slug;
});

When('the player opens the character builder for that draft', async function (this: DndWorld) {
  const campaign = this.createdCampaign!;
  const useCharactersMod = await this.esmockWithSupabase('@/hooks/useCharacters');
  const useCharacterBuildMod = await this.esmockWithSupabase('@/hooks/useCharacterBuild');
  const useBuilderAutosaveMod = await this.esmockWithSupabase('@/hooks/useBuilderAutosave');
  const mod = await this.esmockWithSupabase('@/pages/CharacterBuilder', {
    '@/hooks/useCharacters': useCharactersMod,
    '@/hooks/useCharacterBuild': useCharacterBuildMod,
    '@/hooks/useBuilderAutosave': useBuilderAutosaveMod,
    '@/hooks/useCampaignContext': {
      useCampaignContext: () => ({
        campaignSlug: campaign.slug,
        campaignId: campaign.id,
        setPageTitle: () => undefined,
      }),
    },
    '@/hooks/usePageTitle': { usePageTitle: () => undefined },
  });
  const CharacterBuilder = (mod.default ??
    (mod as { CharacterBuilder: unknown }).CharacterBuilder) as () => React.ReactElement;
  const router = (await import('react-router-dom')) as typeof import('react-router-dom');
  const tree = createElement(
    router.Routes,
    null,
    createElement(router.Route, {
      path: '/campaign/:campaignSlug/character/:characterSlug',
      element: createElement(CharacterBuilder),
    })
  );
  const r = await this.renderRoute(`/campaign/${campaign.slug}/character/${draftSlug}`, tree);
  await r.rtl.waitFor(() => {
    const input = document.querySelector('#character-name') as HTMLInputElement | null;
    if (!input || !input.value) throw new Error('builder draft not loaded yet');
  });
});

Then('the builder resumes with the name {string}', function (this: DndWorld, name: string) {
  const input = document.querySelector('#character-name') as HTMLInputElement | null;
  if (!input) throw new Error('Could not find the character name input');
  if (input.value !== name) throw new Error(`Expected the name field to read "${name}", got "${input.value}"`);
});

Then('the builder shows the species {string}', function (this: DndWorld, speciesName: string) {
  if (!document.body.textContent?.includes(speciesName)) {
    throw new Error(`Expected the resumed builder to show the species "${speciesName}"`);
  }
});
