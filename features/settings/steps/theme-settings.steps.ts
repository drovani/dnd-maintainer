import { Given, When, Then } from '@cucumber/cucumber';
import { createElement } from 'react';
import type { DndWorld } from '../../steps/support/world.js';
import type { Campaign } from '../../../src/types/database.js';

// ---------------------------------------------------------------------------
// Theme settings — render-app seam.
//
// Renders the real SettingsTheme page inside the real ThemeProvider, with the
// stateful supabase injected (so useCampaigns and CampaignThemeRow's direct
// supabase.update both hit the in-memory store). Reuses the global theme Then
// steps from campaigns.steps.ts:
//   - "the interface uses the {string} theme"  (asserts <html> data-theme)
//   - "{string} uses the {string} theme"       (asserts the persisted campaign row)
// and the campaign-seeding Givens ("a campaign named ... exists with theme ...").
// ---------------------------------------------------------------------------

async function renderSettings(world: DndWorld) {
  const useCampaignsMod = await world.esmockWithSupabase('@/hooks/useCampaigns');
  const mod = await world.esmockWithSupabase('@/pages/SettingsTheme', {
    '@/hooks/useCampaigns': useCampaignsMod,
    '@/hooks/usePageTitle': { usePageTitle: () => undefined },
  });
  const SettingsTheme = (mod.default ?? (mod as { SettingsTheme: unknown }).SettingsTheme) as () => React.ReactElement;
  const themeMod = await import('@/components/ThemeProvider');
  const ThemeProvider = themeMod.ThemeProvider;
  const tree = createElement(ThemeProvider, null, createElement(SettingsTheme));
  const r = await world.renderRoute('/settings/theme', tree);
  await r.rtl.waitFor(() => {
    if (!document.body.textContent?.includes('Global Theme')) throw new Error('settings page not ready');
  });
  return r;
}

function buttonByExactText(re: RegExp): HTMLButtonElement | null {
  return (
    (Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]).find((b) =>
      re.test((b.textContent ?? '').trim())
    ) ?? null
  );
}

/** The CampaignThemeRow wrapper (rounded border card) for a given campaign name. */
function campaignThemeRow(name: string): HTMLElement {
  const row = (Array.from(document.querySelectorAll('div.rounded-lg.border')) as HTMLElement[]).find(
    (d) => d.querySelector('span.font-medium')?.textContent === name
  );
  if (!row) throw new Error(`Could not find the Settings theme row for campaign "${name}"`);
  return row;
}

function rowButtonByText(row: HTMLElement, re: RegExp): HTMLButtonElement | null {
  return (
    (Array.from(row.querySelectorAll('button')) as HTMLButtonElement[]).find((b) =>
      re.test((b.textContent ?? '').trim())
    ) ?? null
  );
}

function findCampaign(world: DndWorld, name: string): Campaign {
  const row = (world.db.rows('campaigns') as unknown as Campaign[]).find((c) => c.name === name);
  if (!row) throw new Error(`Setup error: no campaign named "${name}" in the store`);
  return row;
}

// --- Givens -----------------------------------------------------------------

Given('the Dungeon Master is on the theme settings page', async function (this: DndWorld) {
  await renderSettings(this);
});

Given('the operating system prefers dark mode', function (this: DndWorld) {
  // ThemeProvider resolves "system" via window.matchMedia('(prefers-color-scheme: dark)').
  const win = globalThis.window as unknown as { matchMedia: (q: string) => unknown };
  win.matchMedia = (query: string) => ({
    matches: /dark/.test(query),
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  });
});

// --- Global theme -----------------------------------------------------------

When('the Dungeon Master selects the {string} global theme', async function (this: DndWorld, themeName: string) {
  const r = this.renderRouteResult!;
  await r.rtl.act(async () => {
    const btn = buttonByExactText(new RegExp(`^${themeName}$`, 'i'));
    if (!btn) throw new Error(`Could not find the "${themeName}" global theme button`);
    r.rtl.fireEvent.click(btn);
  });
});

Then('the saved global theme is {string}', async function (this: DndWorld, themeName: string) {
  const themeId = themeName.toLowerCase();
  const r = this.renderRouteResult!;
  await r.rtl.waitFor(() => {
    const stored = globalThis.localStorage.getItem('dnd-theme');
    if (stored !== themeId) throw new Error(`Expected stored theme "${themeId}", got "${stored}"`);
  });
});

// --- Color mode -------------------------------------------------------------

When('the Dungeon Master selects the {string} color mode', async function (this: DndWorld, modeName: string) {
  const r = this.renderRouteResult!;
  await r.rtl.act(async () => {
    const btn = buttonByExactText(new RegExp(`^${modeName}$`, 'i'));
    if (!btn) throw new Error(`Could not find the "${modeName}" color mode button`);
    r.rtl.fireEvent.click(btn);
  });
});

Then('the interface is in dark mode', async function (this: DndWorld) {
  const r = this.renderRouteResult!;
  await r.rtl.waitFor(() => {
    if (!document.documentElement.classList.contains('dark')) {
      throw new Error('Expected <html> to have the "dark" class, but it did not');
    }
  });
});

Then('the interface is in light mode', async function (this: DndWorld) {
  const r = this.renderRouteResult!;
  await r.rtl.waitFor(() => {
    if (document.documentElement.classList.contains('dark')) {
      throw new Error('Expected <html> NOT to have the "dark" class, but it did');
    }
  });
});

// --- Per-campaign override from Settings ------------------------------------

When(
  'the Dungeon Master sets the {string} theme for {string} in Settings',
  async function (this: DndWorld, themeName: string, campaignName: string) {
    const themeId = themeName.toLowerCase();
    const r = this.renderRouteResult!;
    await r.rtl.act(async () => {
      const btn = rowButtonByText(campaignThemeRow(campaignName), new RegExp(`^${themeName}$`, 'i'));
      if (!btn) throw new Error(`Could not find the "${themeName}" theme button in "${campaignName}"'s row`);
      r.rtl.fireEvent.click(btn);
    });
    await r.rtl.waitFor(() => {
      if (findCampaign(this, campaignName).theme !== themeId) throw new Error('campaign theme not persisted yet');
    });
  }
);

When(
  'the Dungeon Master resets {string} to inherit in Settings',
  async function (this: DndWorld, campaignName: string) {
    const r = this.renderRouteResult!;
    await r.rtl.act(async () => {
      const btn = rowButtonByText(campaignThemeRow(campaignName), /Use global theme/i);
      if (!btn) throw new Error(`Could not find the "Use global theme" button in "${campaignName}"'s row`);
      r.rtl.fireEvent.click(btn);
    });
    await r.rtl.waitFor(() => {
      if (findCampaign(this, campaignName).theme != null) throw new Error('campaign theme not cleared yet');
    });
  }
);
