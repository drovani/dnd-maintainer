import { Before, Given, When, Then } from '@cucumber/cucumber';
import { createElement } from 'react';
import type { DndWorld } from '../../steps/support/world.js';

// ---------------------------------------------------------------------------
// Export — render-app seam.
//
// Renders the real ExportData page. useCampaigns is backed by the stateful
// store; ExportData's direct supabase (the export fetch) is routed through a
// togglable wrapper so US-020 can simulate a fetch failure. downloadFile() needs
// URL.createObjectURL, which jsdom lacks — we stub it and capture the Blob so the
// generated SQL can be inspected.
// ---------------------------------------------------------------------------

let failFetch = false;
let capturedBlobs: Blob[] = [];

Before(function () {
  failFetch = false;
  capturedBlobs = [];
});

// A thenable chain that resolves to a fetch error for the export's select().in() calls.
function errorChain(): Record<string, unknown> {
  const chain: Record<string, unknown> = {};
  const self = (): Record<string, unknown> => chain;
  chain.select = self;
  chain.is = self;
  chain.order = self;
  chain.in = () => Promise.resolve({ data: null, error: { message: 'Simulated database failure' } });
  return chain;
}

// Wrap the stateful client so from() fails while failFetch is set, else delegates.
function failableSupabase(stateful: { from: (t: string) => unknown }) {
  return {
    from(table: string): unknown {
      return failFetch ? errorChain() : stateful.from(table);
    },
  };
}

function stubObjectUrl(): void {
  const url = globalThis.URL as unknown as {
    createObjectURL?: (b: Blob) => string;
    revokeObjectURL?: (u: string) => void;
  };
  url.createObjectURL = (blob: Blob): string => {
    capturedBlobs.push(blob);
    return 'blob:mock-url';
  };
  url.revokeObjectURL = (): void => undefined;
}

async function renderExport(world: DndWorld) {
  stubObjectUrl();
  const useCampaignsMod = await world.esmockWithSupabase('@/hooks/useCampaigns');
  const mod = await world.esmockWithSupabase('@/pages/ExportData', {
    // Override the default '@/lib/supabase' injection with the failable wrapper.
    '@/lib/supabase': { supabase: failableSupabase(world.statefulSupabase as { from: (t: string) => unknown }) },
    '@/hooks/useCampaigns': useCampaignsMod,
    '@/hooks/usePageTitle': { usePageTitle: () => undefined },
  });
  const ExportData = (mod.default ?? (mod as { ExportData: unknown }).ExportData) as () => React.ReactElement;
  const r = await world.renderRoute('/export', createElement(ExportData));
  await r.rtl.waitFor(() => {
    if ((document.body.textContent ?? '').includes('Loading')) throw new Error('still loading campaigns');
  });
  return r;
}

function campaignCard(name: string): HTMLButtonElement | null {
  return (
    (Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]).find(
      (b) => b.querySelector('p.font-medium')?.textContent === name
    ) ?? null
  );
}

function exportButton(): HTMLButtonElement | null {
  return (
    (Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]).find((b) =>
      /Export SQL Backup|Exporting/i.test((b.textContent ?? '').trim())
    ) ?? null
  );
}

function buttonByText(re: RegExp): HTMLButtonElement | null {
  return (
    (Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]).find((b) =>
      re.test((b.textContent ?? '').trim())
    ) ?? null
  );
}

// --- Givens -----------------------------------------------------------------

Given('the Dungeon Master is on the export page', async function (this: DndWorld) {
  await renderExport(this);
});

Given('the export data fetch will fail', function () {
  failFetch = true;
});

When('the export data fetch recovers', function () {
  failFetch = false;
});

// --- Selection --------------------------------------------------------------

When('the Dungeon Master selects {string} for export', async function (this: DndWorld, name: string) {
  const r = this.renderRouteResult!;
  await r.rtl.act(async () => {
    const card = campaignCard(name);
    if (!card) throw new Error(`Could not find the "${name}" campaign card on the export page`);
    r.rtl.fireEvent.click(card);
  });
});

When('the Dungeon Master clicks Select All', async function (this: DndWorld) {
  const r = this.renderRouteResult!;
  await r.rtl.act(async () => {
    const btn = buttonByText(/^Select All$/i);
    if (!btn) throw new Error('Could not find the Select All button');
    r.rtl.fireEvent.click(btn);
  });
});

When('the Dungeon Master clicks Deselect All', async function (this: DndWorld) {
  const r = this.renderRouteResult!;
  await r.rtl.act(async () => {
    const btn = buttonByText(/^Deselect All$/i);
    if (!btn) throw new Error('Could not find the Deselect All button');
    r.rtl.fireEvent.click(btn);
  });
});

// --- Export action ----------------------------------------------------------

When('the Dungeon Master exports the selected campaigns', async function (this: DndWorld) {
  const r = this.renderRouteResult!;
  const blobsBefore = capturedBlobs.length;
  await r.rtl.act(async () => {
    const btn = exportButton();
    if (!btn) throw new Error('Could not find the Export button');
    r.rtl.fireEvent.click(btn);
  });
  // Settle on a definite outcome: either a download Blob was produced or the error banner appeared.
  await r.rtl.waitFor(() => {
    const downloaded = capturedBlobs.length > blobsBefore;
    const errored = (document.body.textContent ?? '').includes('Export failed');
    if (!downloaded && !errored) throw new Error('export has not completed yet');
  });
});

// --- Assertions -------------------------------------------------------------

Then(
  'the generated SQL contains INSERT statements for the {word} table',
  async function (this: DndWorld, table: string) {
    if (capturedBlobs.length === 0) {
      throw new Error('No export Blob was captured — the download did not occur');
    }
    const sql = await capturedBlobs[capturedBlobs.length - 1].text();
    if (!sql.includes(`INSERT INTO ${table}`)) {
      throw new Error(`Expected SQL to contain "INSERT INTO ${table}", but it did not`);
    }
  }
);

Then('the export button is disabled', function (this: DndWorld) {
  const btn = exportButton();
  if (!btn) throw new Error('Could not find the Export button');
  if (!btn.disabled) throw new Error('Expected the Export button to be disabled with no campaigns selected');
});

Then('{int} of {int} campaigns are selected for export', function (this: DndWorld, selected: number, total: number) {
  const txt = document.body.textContent ?? '';
  if (!txt.includes(`${selected} of ${total}`)) {
    throw new Error(`Expected the selection counter to read "${selected} of ${total}". Body: ${txt.slice(0, 200)}`);
  }
});

Then('an export error is shown', function (this: DndWorld) {
  const txt = document.body.textContent ?? '';
  if (!txt.includes('Export failed')) {
    throw new Error(`Expected an "Export failed" error banner. Body: ${txt.slice(0, 200)}`);
  }
});

Then('no export error is shown', function (this: DndWorld) {
  const txt = document.body.textContent ?? '';
  if (txt.includes('Export failed')) {
    throw new Error('Expected no export error banner, but one is present');
  }
});
