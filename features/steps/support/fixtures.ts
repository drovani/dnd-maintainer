import type { Campaign } from '@/types/database';

let _id = 0;
const nextId = () => `fixture-${++_id}`;

export function buildCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: nextId(),
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
    ...overrides,
  };
}
