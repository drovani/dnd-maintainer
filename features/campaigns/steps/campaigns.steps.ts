import { Before, Given, When, Then } from '@cucumber/cucumber';
import { createElement } from 'react';
import type { DndWorld } from '../../steps/support/world.js';
import type { Campaign } from '../../../src/types/database.js';
import type { Row } from '../../steps/support/stateful-supabase.js';

// ---------------------------------------------------------------------------
// Campaigns — render-app + stateful-mock seam.
//
// Every scenario seeds rows into the stateful Supabase store (this.db) and then
// renders the REAL page (CampaignList / CampaignDashboard / Layout) with the
// stateful supabase injected via this.esmockWithSupabase. Assertions read the
// rendered DOM (document.body.textContent / screen queries) and the router
// pathname (r.getPath()) — never a re-implemented filter/sort. There is no
// mockQueryResult / renderHook usage here anymore.
// ---------------------------------------------------------------------------

// The world's jsdom is constructed per-scenario; these browser globals only exist after
// construction, so install the missing shims in a Before hook (not at module load).
Before(function (): void {
  const g = globalThis as unknown as {
    requestAnimationFrame?: (cb: FrameRequestCallback) => number;
    cancelAnimationFrame?: (id: number) => void;
    HTMLElement?: { prototype: Record<string, unknown> };
  };
  // requestAnimationFrame: jsdom does not provide it; Dialog/animation code relies on it.
  if (typeof g.requestAnimationFrame !== 'function') {
    g.requestAnimationFrame = (cb: FrameRequestCallback): number =>
      setTimeout(() => cb(Date.now()), 0) as unknown as number;
    g.cancelAnimationFrame = (id: number): void => clearTimeout(id);
  }
  // Legacy IE attachEvent/detachEvent probed by @base-ui's focus manager on the active
  // element when a focus-trapping surface (Dialog) or an autoFocus input mounts.
  const proto = g.HTMLElement?.prototype;
  if (proto && typeof proto.attachEvent !== 'function') {
    proto.attachEvent = function (): void {};
    proto.detachEvent = function (): void {};
  }
});

const NOW = '2024-01-01T00:00:00Z';
let _idSeq = 0;

// Per-scenario scratch for the rename-collision flow (set in When, read in Then).
// Cucumber runs scenarios serially, so a module-local is safe here.
let renameState: { from: string; to: string } = { from: '', to: '' };

function makeCampaignRow(overrides: Partial<Campaign> & { name: string }): Campaign {
  _idSeq += 1;
  const slug = overrides.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return {
    id: `c${_idSeq}`,
    slug: slug || `campaign-${_idSeq}`,
    previous_slugs: [],
    description: null,
    setting: null,
    status: 'active',
    theme: null,
    created_at: NOW,
    updated_at: NOW,
    archived_at: null,
    allowed_source_books: ['phb-2024'],
    ...overrides,
  };
}

function seedRow(world: DndWorld, row: Campaign): void {
  world.db.seed('campaigns', [...world.db.rows('campaigns'), row as unknown as Row]);
}

function findRow(world: DndWorld, name: string): Campaign {
  const row = (world.db.rows('campaigns') as unknown as Campaign[]).find((c) => c.name === name);
  if (!row) {
    throw new Error(`Setup error: no campaign named "${name}" in the stateful store`);
  }
  return row;
}

// React 19 controlled inputs don't update from a manually-dispatched input event in this jsdom
// harness (React's value tracker is bypassed and onChange never fires). user-event drives the
// full focus+keydown+input sequence React expects, so the bound state actually updates. It is
// async and self-wraps in act(), so call it OUTSIDE r.rtl.act().
async function typeInto(el: HTMLInputElement | HTMLTextAreaElement, value: string): Promise<void> {
  const userEvent = (await import('@testing-library/user-event')).default;
  const user = userEvent.setup({ document });
  await user.clear(el);
  await user.type(el, value);
}

function firstRow(world: DndWorld): Campaign {
  const rows = world.db.rows('campaigns') as unknown as Campaign[];
  if (rows.length === 0) throw new Error('Setup error: no campaigns seeded');
  return rows[0];
}

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

async function renderCampaignList(world: DndWorld) {
  const hooks = await world.esmockWithSupabase('@/hooks/useCampaigns');
  const mod = await world.esmockWithSupabase('@/pages/CampaignList', {
    '@/hooks/useCampaigns': hooks,
    '@/hooks/usePageTitle': { usePageTitle: () => undefined },
  });
  const CampaignList = (mod.default ?? (mod as { CampaignList: unknown }).CampaignList) as () => React.ReactElement;
  return world.renderRoute('/', createElement(CampaignList));
}

async function renderCampaignDashboard(world: DndWorld, campaign: Campaign) {
  const hooks = await world.esmockWithSupabase('@/hooks/useCampaigns');
  const mod = await world.esmockWithSupabase('@/pages/CampaignDashboard', {
    '@/hooks/useCampaigns': hooks,
    '@/hooks/usePageTitle': { usePageTitle: () => undefined },
    '@/hooks/useCampaignContext': {
      useCampaignContext: () => ({
        campaignSlug: campaign.slug,
        campaignId: campaign.id,
        setPageTitle: () => undefined,
      }),
    },
    '@/hooks/useCharacters': { useCharacters: () => ({ data: [], error: null, isLoading: false }) },
    '@/hooks/useSessions': { useSessions: () => ({ data: [], error: null, isLoading: false }) },
  });
  const Dashboard = (mod.default ??
    (mod as { CampaignDashboard: unknown }).CampaignDashboard) as () => React.ReactElement;
  // Wrap in a Route so CampaignDashboard's useParams() sees :campaignSlug.
  const router = (await import('react-router-dom')) as typeof import('react-router-dom');
  const tree = createElement(
    router.Routes,
    null,
    createElement(router.Route, { path: '/campaign/:campaignSlug', element: createElement(Dashboard) })
  );
  const r = await world.renderRoute(`/campaign/${campaign.slug}`, tree);
  await r.rtl.waitFor(() => {
    if (!document.body.textContent?.includes(campaign.name)) throw new Error('dashboard not ready');
  });
  return r;
}

function pencilButtons(): HTMLButtonElement[] {
  // The Edit2 icon renders as <svg class="lucide lucide-pen ...">.
  return Array.from(document.querySelectorAll('button')).filter(
    (b) => b.querySelector('svg.lucide-pen') != null
  ) as HTMLButtonElement[];
}

/** The name Edit pencil: a pen button not in the setting group and not in the Description section. */
function nameEditButton(): HTMLButtonElement | undefined {
  return pencilButtons().find(
    (b) => b.closest('[class*="group/setting"]') == null && !b.closest('.group')?.textContent?.includes('Description')
  );
}

/** The setting Edit pencil: a pen button inside the group/setting wrapper. */
function settingEditButton(): HTMLButtonElement | undefined {
  return pencilButtons().find((b) => b.closest('[class*="group/setting"]') != null);
}

/** The description Edit pencil: a pen button whose section heading is "Description". */
function descriptionEditButton(): HTMLButtonElement | undefined {
  return pencilButtons().find((b) => b.closest('.group')?.textContent?.includes('Description'));
}

// document-bound button finders (avoid testing-library screen global-document binding).
function buttonByText(re: RegExp): HTMLButtonElement | null {
  return (
    (Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]).find((b) =>
      re.test((b.textContent ?? '').trim())
    ) ?? null
  );
}

// ---------------------------------------------------------------------------
// Shared Given steps — seed the stateful store
// ---------------------------------------------------------------------------

Given('a campaign named {string} exists', function (this: DndWorld, name: string) {
  seedRow(this, makeCampaignRow({ name }));
});

Given('the Dungeon Master has no campaigns', function (this: DndWorld) {
  this.db.seed('campaigns', []);
});

Given('a campaign named {string} exists but has been archived', function (this: DndWorld, name: string) {
  seedRow(this, makeCampaignRow({ name, archived_at: '2024-01-15T00:00:00Z' }));
});

Given('a campaign named {string} exists with no description', function (this: DndWorld, name: string) {
  seedRow(this, makeCampaignRow({ name, description: null }));
});

Given(
  'a campaign named {string} exists in the {string} setting',
  function (this: DndWorld, name: string, setting: string) {
    seedRow(this, makeCampaignRow({ name, setting }));
  }
);

Given('another campaign named {string} exists', function (this: DndWorld, name: string) {
  seedRow(this, makeCampaignRow({ name }));
});

Given(
  'a campaign named {string} exists and was last played {int} weeks ago',
  function (this: DndWorld, name: string, weeks: number) {
    const updatedAt = new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000).toISOString();
    seedRow(this, makeCampaignRow({ name, updated_at: updatedAt }));
  }
);

Given('a campaign named {string} exists and was last played yesterday', function (this: DndWorld, name: string) {
  const updatedAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
  seedRow(this, makeCampaignRow({ name, updated_at: updatedAt }));
});

Given('a campaign named {string} exists with no theme set', function (this: DndWorld, name: string) {
  seedRow(this, makeCampaignRow({ name, theme: null }));
});

Given(
  'a campaign named {string} exists with theme {string}',
  function (this: DndWorld, name: string, themeName: string) {
    const themeId = themeName.toLowerCase() as 'default' | 'sylvan' | 'arcane';
    seedRow(this, makeCampaignRow({ name, theme: themeId }));
  }
);

// ---------------------------------------------------------------------------
// View Campaigns
// ---------------------------------------------------------------------------

When('the Dungeon Master views their campaigns', async function (this: DndWorld) {
  const r = await renderCampaignList(this);
  await r.rtl.waitFor(() => {
    if ((document.body.textContent ?? '').includes('Loading')) throw new Error('still loading');
  });
});

Then('{string} appears in the list', function (this: DndWorld, name: string) {
  const txt = document.body.textContent ?? '';
  if (!txt.includes(name)) {
    throw new Error(`Expected "${name}" rendered in the campaign list. Body: ${txt.slice(0, 300)}`);
  }
});

Then('the list is empty', function (this: DndWorld) {
  const txt = document.body.textContent ?? '';
  if (!txt.includes('No Campaigns Yet')) {
    throw new Error(`Expected the empty-state heading. Body: ${txt.slice(0, 300)}`);
  }
});

Then('{string} does not appear in the list', function (this: DndWorld, name: string) {
  const txt = document.body.textContent ?? '';
  if (txt.includes(name)) {
    throw new Error(`Expected "${name}" NOT rendered, but it appeared`);
  }
});

Then('{string} appears before {string} in the list', function (this: DndWorld, first: string, second: string) {
  const txt = document.body.textContent ?? '';
  const firstIdx = txt.indexOf(first);
  const secondIdx = txt.indexOf(second);
  if (firstIdx === -1) throw new Error(`"${first}" not rendered`);
  if (secondIdx === -1) throw new Error(`"${second}" not rendered`);
  if (firstIdx >= secondIdx) {
    throw new Error(`Expected "${first}" (pos ${firstIdx}) before "${second}" (pos ${secondIdx})`);
  }
});

Then('the Dungeon Master is prompted to create their first campaign', function (this: DndWorld) {
  const button = buttonByText(/Create Your First Campaign/i);
  if (!button) {
    throw new Error(
      `Expected a "Create Your First Campaign" prompt. Body: ${(document.body.textContent ?? '').slice(0, 300)}`
    );
  }
});

// ---------------------------------------------------------------------------
// Create Campaign
// ---------------------------------------------------------------------------

async function openNewCampaignForm(r: NonNullable<DndWorld['renderRouteResult']>) {
  await r.rtl.act(async () => {
    const newBtn = buttonByText(/New Campaign/i) ?? buttonByText(/Create Your First Campaign/i);
    if (!newBtn) throw new Error('Could not find a button to open the new-campaign form');
    r.rtl.fireEvent.click(newBtn);
  });
  await r.rtl.waitFor(() => {
    if (!document.querySelector('#campaign-name')) throw new Error('new-campaign form not open');
  });
}

When('the Dungeon Master creates a campaign named {string}', async function (this: DndWorld, name: string) {
  const r = await renderCampaignList(this);
  await r.rtl.waitFor(() => {
    if ((document.body.textContent ?? '').includes('Loading')) throw new Error('still loading');
  });
  await openNewCampaignForm(r);

  await typeInto(document.querySelector('#campaign-name') as HTMLInputElement, name);
  await r.rtl.act(async () => {
    const form = (document.querySelector('#campaign-name') as HTMLInputElement).closest('form') as HTMLFormElement;
    r.rtl.fireEvent.submit(form);
  });

  await r.rtl.waitFor(() => {
    if (!r.getPath().startsWith('/campaign/')) throw new Error(`not navigated yet (path=${r.getPath()})`);
  });
});

Then('{string} appears in their campaign list', function (this: DndWorld, name: string) {
  const rows = this.db.rows('campaigns') as unknown as Campaign[];
  if (!rows.some((c) => c.name === name)) {
    throw new Error(`Expected "${name}" persisted, got: ${JSON.stringify(rows.map((c) => c.name))}`);
  }
});

Then('{string} is the active campaign', function (this: DndWorld, name: string) {
  const rows = this.db.rows('campaigns') as unknown as Campaign[];
  const created = rows.find((c) => c.name === name);
  if (!created) throw new Error(`Campaign "${name}" was not created`);
  const path = this.renderRouteResult!.getPath();
  if (path !== `/campaign/${created.slug}`) {
    throw new Error(`Expected navigation to /campaign/${created.slug}, got "${path}"`);
  }
});

When('the Dungeon Master tries to create a campaign with no name', async function (this: DndWorld) {
  const r = await renderCampaignList(this);
  await r.rtl.waitFor(() => {
    if ((document.body.textContent ?? '').includes('Loading')) throw new Error('still loading');
  });
  await openNewCampaignForm(r);

  await r.rtl.act(async () => {
    const input = document.querySelector('#campaign-name') as HTMLInputElement;
    const form = input.closest('form') as HTMLFormElement;
    r.rtl.fireEvent.submit(form);
  });
});

Then('the campaign is not created', function (this: DndWorld) {
  const rows = this.db.rows('campaigns') as unknown as Campaign[];
  const path = this.renderRouteResult?.getPath() ?? '/';
  if (path.startsWith('/campaign/')) {
    throw new Error(`Expected to stay on the list, but navigated to "${path}"`);
  }
  const byName = new Map<string, number>();
  for (const c of rows) byName.set(c.name, (byName.get(c.name) ?? 0) + 1);
  for (const [n, count] of byName) {
    if (count > 1) throw new Error(`Campaign "${n}" was created ${count} times`);
  }
});

Then('the Dungeon Master sees that a name is required', function (this: DndWorld) {
  const txt = document.body.textContent ?? '';
  if (!txt.includes('Name is required')) {
    throw new Error(`Expected a "Name is required" validation message. Body: ${txt.slice(0, 300)}`);
  }
});

When(
  'the Dungeon Master tries to create another campaign named {string}',
  async function (this: DndWorld, name: string) {
    const r = await renderCampaignList(this);
    await r.rtl.waitFor(() => {
      if ((document.body.textContent ?? '').includes('Loading')) throw new Error('still loading');
    });
    await openNewCampaignForm(r);

    await typeInto(document.querySelector('#campaign-name') as HTMLInputElement, name);
    await r.rtl.act(async () => {
      const form = (document.querySelector('#campaign-name') as HTMLInputElement).closest('form') as HTMLFormElement;
      r.rtl.fireEvent.submit(form);
    });
    // The app has no duplicate guard, so the submit silently persists a second campaign.
    // Settle on that real outcome; the Then asserts the intended rejection (and fails → @future).
    await r.rtl.waitFor(() => {
      const dupes = (this.db.rows('campaigns') as unknown as Campaign[]).filter((c) => c.name === name);
      if (dupes.length < 2) throw new Error('second campaign not persisted yet');
    });
  }
);

Then('the Dungeon Master sees that the name is already in use', function (this: DndWorld) {
  // INTENDED behavior: a duplicate-name create surfaces an "already in use" message.
  // There is NO unique constraint on campaigns.name (see supabase/migrations/), and we
  // may not add one, so the app silently creates a second campaign and navigates away.
  // This assertion documents the intended guard and is expected to fail → @future.
  const txt = document.body.textContent ?? '';
  if (!/already in use|already exists|duplicate/i.test(txt)) {
    throw new Error('Expected a duplicate-name message ("already in use"); the app does not surface one');
  }
});

// ---------------------------------------------------------------------------
// Edit Campaign Details (CampaignDashboard)
// ---------------------------------------------------------------------------

When('the Dungeon Master sets the description to {string}', async function (this: DndWorld, description: string) {
  const campaign = firstRow(this);
  const r = await renderCampaignDashboard(this, campaign);

  await r.rtl.act(async () => {
    const descBtn = descriptionEditButton();
    if (!descBtn) throw new Error('Could not find the description Edit button');
    r.rtl.fireEvent.click(descBtn);
  });

  await typeInto(document.querySelector('textarea') as HTMLTextAreaElement, description);
  await r.rtl.act(async () => {
    const saveBtn = buttonByText(/^Save$/i);
    if (!saveBtn) throw new Error('Could not find the Save button');
    r.rtl.fireEvent.click(saveBtn);
  });

  await r.rtl.waitFor(() => {
    if (findRow(this, campaign.name).description !== description) throw new Error('description not persisted yet');
  });
});

Then('the campaign description shows {string}', function (this: DndWorld, description: string) {
  const row = firstRow(this);
  if (row.description !== description) {
    throw new Error(`Expected description "${description}", got "${row.description}"`);
  }
});

When('the Dungeon Master changes the setting to {string}', async function (this: DndWorld, setting: string) {
  const campaign = firstRow(this);
  const r = await renderCampaignDashboard(this, campaign);

  await r.rtl.act(async () => {
    const settingBtn = settingEditButton();
    if (!settingBtn) throw new Error('Could not find the setting Edit button');
    r.rtl.fireEvent.click(settingBtn);
  });

  {
    const inputs = Array.from(document.querySelectorAll('input[type="text"]')) as HTMLInputElement[];
    await typeInto(inputs[inputs.length - 1], setting);
  }
  await r.rtl.act(async () => {
    const inputs = Array.from(document.querySelectorAll('input[type="text"]')) as HTMLInputElement[];
    r.rtl.fireEvent.keyDown(inputs[inputs.length - 1], { key: 'Enter' });
  });

  await r.rtl.waitFor(() => {
    if (findRow(this, campaign.name).setting !== setting) throw new Error('setting not persisted yet');
  });
});

Then('the campaign is in the {string} setting', function (this: DndWorld, setting: string) {
  const row = firstRow(this);
  if (row.setting !== setting) {
    throw new Error(`Expected setting "${setting}", got "${row.setting}"`);
  }
});

When('the Dungeon Master renames it to {string}', async function (this: DndWorld, newName: string) {
  const campaign = firstRow(this);
  const r = await renderCampaignDashboard(this, campaign);

  await r.rtl.act(async () => {
    const nameBtn = nameEditButton();
    if (!nameBtn) throw new Error('Could not find the name Edit button');
    r.rtl.fireEvent.click(nameBtn);
  });

  await typeInto(document.querySelector('input[type="text"]') as HTMLInputElement, newName);
  await r.rtl.act(async () => {
    const input = document.querySelector('input[type="text"]') as HTMLInputElement;
    r.rtl.fireEvent.keyDown(input, { key: 'Enter' });
  });

  await r.rtl.waitFor(() => {
    const rows = this.db.rows('campaigns') as unknown as Campaign[];
    if (!rows.some((c) => c.name === newName)) throw new Error('rename not persisted yet');
  });
});

Then('the campaign is named {string}', function (this: DndWorld, name: string) {
  const rows = this.db.rows('campaigns') as unknown as Campaign[];
  if (!rows.some((c) => c.name === name)) {
    throw new Error(`Expected a campaign named "${name}", got: ${JSON.stringify(rows.map((c) => c.name))}`);
  }
});

When(
  'the Dungeon Master tries to rename {string} to {string}',
  async function (this: DndWorld, from: string, to: string) {
    const campaign = findRow(this, from);
    const r = await renderCampaignDashboard(this, campaign);

    await r.rtl.act(async () => {
      const nameBtn = nameEditButton();
      if (!nameBtn) throw new Error('Could not find the name Edit button');
      r.rtl.fireEvent.click(nameBtn);
    });

    await typeInto(document.querySelector('input[type="text"]') as HTMLInputElement, to);
    await r.rtl.act(async () => {
      const input = document.querySelector('input[type="text"]') as HTMLInputElement;
      r.rtl.fireEvent.keyDown(input, { key: 'Enter' });
    });

    // The app has no unique-name guard, so the rename actually persists. Settle on that
    // real outcome; the Then asserts the intended rejection (and fails → @future).
    await r.rtl.waitFor(() => {
      if (!(this.db.rows('campaigns') as unknown as Campaign[]).some((c) => c.name === to)) {
        throw new Error('rename not persisted yet');
      }
    });
    renameState = { from, to };
  }
);

Then('the campaign is not renamed', function (this: DndWorld) {
  // INTENDED behavior: renaming to a name already in use is rejected, so the original
  // campaign keeps its old name. There is NO unique constraint on campaigns.name and we
  // may not add one, so the rename actually succeeds → this assertion fails → @future.
  const rows = this.db.rows('campaigns') as unknown as Campaign[];
  if (!rows.some((c) => c.name === renameState.from)) {
    throw new Error(
      `Expected "${renameState.from}" to keep its name (rename rejected), but it was renamed to "${renameState.to}"`
    );
  }
});

// ---------------------------------------------------------------------------
// Archive Campaign (CampaignList)
// ---------------------------------------------------------------------------

When('the Dungeon Master archives {string}', async function (this: DndWorld, name: string) {
  const r = await renderCampaignList(this);
  await r.rtl.waitFor(() => {
    if (!(document.body.textContent ?? '').includes(name)) throw new Error('list not ready');
  });

  await r.rtl.act(async () => {
    const card = Array.from(document.querySelectorAll('div.group')).find((d) => d.textContent?.includes(name));
    const archiveBtn = card?.querySelector('button[title]') as HTMLButtonElement | null;
    if (!archiveBtn) throw new Error(`Could not find the Archive button for "${name}"`);
    r.rtl.fireEvent.click(archiveBtn);
  });

  await r.rtl.waitFor(() => {
    // The confirm dialog adds a second "Archive" button (the destructive confirm).
    const archiveButtons = (Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]).filter((b) =>
      /^Archive$/i.test((b.textContent ?? '').trim())
    );
    if (archiveButtons.length === 0) throw new Error('archive dialog not open');
  });
  await r.rtl.act(async () => {
    const archiveButtons = (Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]).filter((b) =>
      /^Archive$/i.test((b.textContent ?? '').trim())
    );
    r.rtl.fireEvent.click(archiveButtons[archiveButtons.length - 1]);
  });

  await r.rtl.waitFor(() => {
    if (findRow(this, name).archived_at == null) throw new Error('not archived yet');
  });
});

Then('{string} does not appear in the active campaigns list', function (this: DndWorld, name: string) {
  const row = findRow(this, name);
  if (row.archived_at == null) {
    throw new Error(`Expected "${name}" to be archived (archived_at set), but it is still active`);
  }
});

When('the Dungeon Master restores {string}', async function (this: DndWorld, _name: string) {
  // INTENDED behavior: the DM restores an archived campaign back into the active list.
  // There is NO restore/unarchive UI anywhere in the app (CampaignList, CampaignDashboard,
  // Sidebar) — so this action cannot be driven through the rendered UI. Render the list
  // (archived campaigns are hidden), record the target; the Then step asserts the intended
  // outcome and fails → @future.
  const r = await renderCampaignList(this);
  // No restore UI exists, so nothing is clicked — just let the list finish loading.
  await r.rtl.waitFor(() => {
    if ((document.body.textContent ?? '').includes('Loading')) throw new Error('still loading');
  });
});

Then('{string} appears in the active campaigns list', function (this: DndWorld, name: string) {
  const row = findRow(this, name);
  if (row.archived_at != null) {
    throw new Error(`Expected "${name}" to be restored (archived_at cleared), but no restore UI exists to do so`);
  }
});

// @future: no archived-campaigns view exists (useCampaigns hardcodes archived_at IS null;
// there is no useArchivedCampaigns hook/UI), so an archived campaign cannot be browsed.
When('the Dungeon Master views their archived campaigns', async function (this: DndWorld) {
  const r = await renderCampaignList(this);
  await r.rtl.waitFor(() => {
    if ((document.body.textContent ?? '').includes('Loading')) throw new Error('still loading');
  });
});

Then('{string} appears in the archived list', function (this: DndWorld, name: string) {
  if (!(document.body.textContent ?? '').includes(name)) {
    throw new Error(
      `Expected "${name}" in an archived-campaigns view, but no such view exists — useCampaigns() filters ` +
        `archived_at IS null and there is no archived-browsing hook/UI to surface it`
    );
  }
});

// @future: cascade/integrity across an archive→restore round-trip. There is no restore UI, so
// the campaign cannot be brought back to verify its related rows survived — an integration-DB concern.
Given(
  'a campaign named {string} exists with {int} characters and {int} sessions',
  function (this: DndWorld, name: string, characters: number, sessions: number) {
    const row = makeCampaignRow({ name });
    seedRow(this, row);
    this.db.seed(
      'characters',
      Array.from({ length: characters }, (_, i) => ({ id: `ch-${i}`, campaign_id: row.id, name: `Character ${i + 1}` }))
    );
    this.db.seed(
      'sessions',
      Array.from({ length: sessions }, (_, i) => ({ id: `s-${i}`, campaign_id: row.id, session_number: i + 1 }))
    );
  }
);

Then(
  'the campaign still has {int} characters and {int} sessions',
  function (this: DndWorld, characters: number, sessions: number) {
    const campaign = firstRow(this);
    if (campaign.archived_at != null) {
      throw new Error(
        'Cannot verify cascade integrity: no restore UI exists, so the archived campaign was never restored ' +
          '(archived_at still set). Archive→restore round-trip integrity belongs in an integration-DB test.'
      );
    }
    const charCount = (this.db.rows('characters') as { campaign_id: string }[]).filter(
      (c) => c.campaign_id === campaign.id
    ).length;
    const sessionCount = (this.db.rows('sessions') as { campaign_id: string }[]).filter(
      (s) => s.campaign_id === campaign.id
    ).length;
    if (charCount !== characters || sessionCount !== sessions) {
      throw new Error(
        `Expected ${characters} characters and ${sessions} sessions, got ${charCount} and ${sessionCount}`
      );
    }
  }
);

// ---------------------------------------------------------------------------
// Per-Campaign Theme — set/clear via CampaignDashboard ThemePicker
// ---------------------------------------------------------------------------

When('the Dungeon Master sets the campaign theme to {string}', async function (this: DndWorld, themeName: string) {
  const themeId = themeName.toLowerCase();
  const campaign = firstRow(this);
  const r = await renderCampaignDashboard(this, campaign);

  await r.rtl.act(async () => {
    const btn = buttonByText(new RegExp(`^${themeName}$`, 'i'));
    if (!btn) throw new Error(`Could not find the "${themeName}" theme button`);
    r.rtl.fireEvent.click(btn);
  });

  await r.rtl.waitFor(() => {
    if (findRow(this, campaign.name).theme !== themeId) throw new Error('theme not persisted yet');
  });
});

When('the Dungeon Master clears the theme on {string}', async function (this: DndWorld, campaignName: string) {
  const campaign = findRow(this, campaignName);
  const r = await renderCampaignDashboard(this, campaign);

  await r.rtl.act(async () => {
    const btn = buttonByText(/Use global theme/i);
    if (!btn) throw new Error('Could not find the "Use global theme" button');
    r.rtl.fireEvent.click(btn);
  });

  await r.rtl.waitFor(() => {
    if (findRow(this, campaign.name).theme != null) throw new Error('theme not cleared yet');
  });
});

Then('{string} uses the {string} theme', function (this: DndWorld, campaignName: string, themeName: string) {
  const themeId = themeName.toLowerCase();
  const row = findRow(this, campaignName);
  const effective = row.theme ?? 'default';
  if (effective !== themeId) {
    throw new Error(`Expected "${campaignName}" theme "${themeId}", got "${effective}" (raw: ${row.theme})`);
  }
});

// ---------------------------------------------------------------------------
// Theme resolution (ThemeProvider + Layout) — fallback / override on open
//
// Renders the real Layout under the real ThemeProvider at a campaign route, with
// the stateful supabase injected into useCampaigns. Layout's useEffect reads
// campaign.theme and calls setCampaignThemeOverride; ThemeProvider applies
// effectiveTheme to the DOM via applyThemeToDOM (data-theme on <html>, removed
// for "default"). We assert on document.documentElement's data-theme.
// ---------------------------------------------------------------------------

Given("the Dungeon Master's global theme is {string}", function (this: DndWorld, themeName: string) {
  const themeId = themeName.toLowerCase();
  this.globalThemeId = themeId;
  globalThis.localStorage.setItem('dnd-theme', themeId);
});

When('the Dungeon Master opens {string}', async function (this: DndWorld, campaignName: string) {
  const campaign = findRow(this, campaignName);
  this.openedCampaignName = campaignName;

  const useCampaignsMod = await this.esmockWithSupabase('@/hooks/useCampaigns');
  const layoutMod = await this.esmockWithSupabase('@/components/Layout', {
    '@/hooks/useCampaigns': useCampaignsMod,
  });
  const themeMod = await import('@/components/ThemeProvider');
  const router = await import('react-router-dom');
  const Layout = (layoutMod as { Layout: () => React.ReactElement }).Layout;
  const ThemeProvider = themeMod.ThemeProvider;

  const tree = createElement(
    ThemeProvider,
    null,
    createElement(
      router.Routes,
      null,
      createElement(router.Route, {
        path: '/campaign/:campaignSlug',
        element: createElement(Layout),
      })
    )
  );

  const r = await this.renderRoute(`/campaign/${campaign.slug}`, tree);
  await r.rtl.waitFor(() => {
    if ((document.body.textContent ?? '').includes('Loading')) throw new Error('still loading');
  });
});

Then('the interface uses the {string} theme', async function (this: DndWorld, themeName: string) {
  const themeId = themeName.toLowerCase();
  // Layout's campaign list resolves async, then its useEffect sets the override and
  // ThemeProvider's effect applies data-theme — wait for that chain to settle.
  const r = this.renderRouteResult!;
  await r.rtl.waitFor(() => {
    const effective = document.documentElement.getAttribute('data-theme') ?? 'default';
    if (effective !== themeId) {
      throw new Error(`Expected the interface to use the "${themeId}" theme, got "${effective}"`);
    }
  });
});
