import { render, screen } from '@testing-library/react';
import { ResourcePoolsPanel } from '@/components/character-sheet/ResourcePoolsPanel';
import type { ResolvedCharacter } from '@/types/resolved';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => {
      // Return last segment as a simple label for testing
      const segments = key.split('.');
      return opts?.defaultValue ?? segments[segments.length - 1];
    },
  }),
}));

vi.mock('@/lib/class-icons', () => ({
  getSourceDisplayName: vi.fn((_source: unknown, _t: unknown) => 'MockSource'),
}));

function buildMinimalResolved(overrides: Partial<ResolvedCharacter> = {}): ResolvedCharacter {
  return {
    abilities: {} as ResolvedCharacter['abilities'],
    hitDie: [],
    hitPoints: { max: 10 },
    speed: {},
    initiative: 0,
    proficiencyBonus: 2,
    armorClass: { calculations: [], bonuses: [], effective: 10 },
    savingThrows: {} as ResolvedCharacter['savingThrows'],
    skills: {} as ResolvedCharacter['skills'],
    armorProficiencies: [],
    weaponProficiencies: [],
    toolProficiencies: [],
    languages: [],
    features: [],
    resistances: [],
    immunities: [],
    spellcasting: null,
    equipment: [],
    attacks: [],
    toolExpertise: [],
    bardicInspiration: null,
    pendingChoices: [],
    weaponMasteries: [],
    resourcePools: [],
    ...overrides,
  };
}

describe('ResourcePoolsPanel', () => {
  it('renders nothing when resourcePools is empty', () => {
    const { container } = render(<ResourcePoolsPanel resolved={buildMinimalResolved()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the section heading when pools are non-empty', () => {
    const resolved = buildMinimalResolved({
      resourcePools: [
        {
          poolId: 'focus-points',
          max: 4,
          regen: 'short-rest',
          source: { origin: 'class', id: 'monk', level: 1 },
        },
      ],
    });
    render(<ResourcePoolsPanel resolved={resolved} />);
    // tc('characterSheet.sections.resourcePools') → last segment = 'resourcePools'
    expect(screen.getByText('resourcePools')).toBeInTheDocument();
  });

  it('renders the pool name via gamedata lookup with defaultValue fallback', () => {
    // t('resourcePools.focus-points.name', { defaultValue: 'focus-points' }) → opts.defaultValue = 'focus-points'
    const resolved = buildMinimalResolved({
      resourcePools: [
        {
          poolId: 'focus-points',
          max: 4,
          regen: 'short-rest',
          source: { origin: 'class', id: 'monk', level: 1 },
        },
      ],
    });
    render(<ResourcePoolsPanel resolved={resolved} />);
    // Mock returns opts.defaultValue when present, which is pool.poolId = 'focus-points'
    expect(screen.getByText('focus-points')).toBeInTheDocument();
  });

  it('renders the max value for a pool', () => {
    const resolved = buildMinimalResolved({
      resourcePools: [
        {
          poolId: 'focus-points',
          max: 5,
          regen: 'short-rest',
          source: { origin: 'class', id: 'monk', level: 1 },
        },
      ],
    });
    render(<ResourcePoolsPanel resolved={resolved} />);
    // tc('characterSheet.resourcePools.max', { max: 5 }) → mock returns last segment = 'max'
    // The max value number itself (5) is passed as an interpolation param, not rendered directly.
    // Verify the 'max' label is present (the mock key output).
    expect(screen.getByText(/max/)).toBeInTheDocument();
  });

  it('renders short-rest regen label', () => {
    const resolved = buildMinimalResolved({
      resourcePools: [
        {
          poolId: 'focus-points',
          max: 4,
          regen: 'short-rest',
          source: { origin: 'class', id: 'monk', level: 1 },
        },
      ],
    });
    render(<ResourcePoolsPanel resolved={resolved} />);
    // tc('characterSheet.resourcePools.regen.short-rest') → last segment = 'short-rest'
    expect(screen.getByText(/short-rest/)).toBeInTheDocument();
  });

  it('renders long-rest regen label', () => {
    const resolved = buildMinimalResolved({
      resourcePools: [
        {
          poolId: 'rage',
          max: 2,
          regen: 'long-rest',
          source: { origin: 'class', id: 'barbarian', level: 1 },
        },
      ],
    });
    render(<ResourcePoolsPanel resolved={resolved} />);
    // tc('characterSheet.resourcePools.regen.long-rest') → last segment = 'long-rest'
    expect(screen.getByText(/long-rest/)).toBeInTheDocument();
  });

  it('renders source attribution via getSourceDisplayName', async () => {
    const { getSourceDisplayName } = await import('@/lib/class-icons');
    const source = { origin: 'class' as const, id: 'monk' as const, level: 1 };
    const resolved = buildMinimalResolved({
      resourcePools: [
        {
          poolId: 'focus-points',
          max: 4,
          regen: 'short-rest',
          source,
        },
      ],
    });
    render(<ResourcePoolsPanel resolved={resolved} />);
    // getSourceDisplayName is called with the pool source and the gamedata t function
    expect(getSourceDisplayName).toHaveBeenCalledWith(source, expect.any(Function));
    // tc('characterSheet.resourcePools.source', { source: 'MockSource' }) → mock returns last segment = 'source'
    expect(screen.getByText('source')).toBeInTheDocument();
  });
});
