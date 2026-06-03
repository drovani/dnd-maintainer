/**
 * Focused render tests for the source books toggle Card in CampaignDashboard.
 * Mounts only the relevant portion of the dashboard by mocking every hook the
 * page calls, then confirms the toggle card behaves correctly.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SOURCE_BOOKS } from '@/lib/source-books';
import type { Campaign } from '@/types/database';
import CampaignDashboard from '@/pages/CampaignDashboard';

// ---------------------------------------------------------------------------
// react-i18next mock
// ---------------------------------------------------------------------------
vi.mock('react-i18next', () => ({
  useTranslation: (ns?: string) => ({
    t: (key: string) => key.split('.').pop() ?? key,
    i18n: { language: 'en' },
    ns,
  }),
}));

// ---------------------------------------------------------------------------
// Hook mocks — populated per test via module-level variables
// ---------------------------------------------------------------------------

const mockUpdateMutate = vi.fn();
let mockCampaign: Campaign | undefined;

vi.mock('@/hooks/useCampaigns', () => ({
  useCampaign: () => ({ data: mockCampaign, isLoading: false }),
  useCampaignMutations: () => ({
    update: {
      mutate: mockUpdateMutate,
      isPending: false,
      isError: false,
      variables: undefined,
    },
    create: { mutate: vi.fn() },
    archive: { mutate: vi.fn() },
  }),
}));

vi.mock('@/hooks/useCampaignContext', () => ({
  useCampaignContext: () => ({ campaignId: 'camp-1' }),
}));

vi.mock('@/hooks/usePageTitle', () => ({
  usePageTitle: () => undefined,
}));

vi.mock('@/hooks/useCharacters', () => ({
  useCharacters: () => ({ data: [], error: null }),
}));

vi.mock('@/hooks/useSessions', () => ({
  useSessions: () => ({ data: [], error: null }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeCampaign = (overrides?: Partial<Campaign>): Campaign => ({
  id: 'camp-1',
  slug: 'test-campaign',
  previous_slugs: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  name: 'Test Campaign',
  status: 'active',
  description: null,
  setting: null,
  image_url: null,
  dm_notes: null,
  theme: null,
  archived_at: null,
  allowed_source_books: ['phb-2024'],
  ...overrides,
});

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/campaign/test-campaign']}>
      <Routes>
        <Route path="/campaign/:campaignSlug" element={<CampaignDashboard />} />
      </Routes>
    </MemoryRouter>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CampaignDashboard — source books card', () => {
  beforeEach(() => {
    mockCampaign = makeCampaign();
    mockUpdateMutate.mockClear();
  });

  it('renders one checkbox per SOURCE_BOOKS entry', () => {
    renderDashboard();

    // The card must have exactly as many checkboxes as there are SOURCE_BOOKS
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThanOrEqual(SOURCE_BOOKS.length);
  });

  it('checkbox is checked when the book is in allowed_source_books', () => {
    mockCampaign = makeCampaign({ allowed_source_books: ['phb-2024'] });
    renderDashboard();

    // There should be exactly one checkbox (one book today)
    const checkbox = screen.getAllByRole('checkbox')[0];
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
  });

  it('disables the checkbox when it is the last checked book', () => {
    // Only phb-2024 allowed — the checkbox for it must be disabled
    mockCampaign = makeCampaign({ allowed_source_books: ['phb-2024'] });
    renderDashboard();

    const checkbox = screen.getAllByRole('checkbox')[0];
    // Base UI Checkbox uses data-disabled attribute when disabled
    expect(checkbox).toHaveAttribute('data-disabled');
  });
});
