import { render, screen } from '@testing-library/react';
import { ResourcePoolsPanel } from '@/components/character-sheet/ResourcePoolsPanel';
import type { ResolvedCharacter } from '@/types/resolved';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      // Resolve base string: prefer defaultValue, otherwise use last key segment
      const segments = key.split('.');
      let result: string = (opts?.defaultValue as string | undefined) ?? segments[segments.length - 1];
      // Substitute any {{param}} placeholders so interpolation values appear in the output
      if (opts) {
        for (const [param, value] of Object.entries(opts)) {
          if (param === 'defaultValue') continue;
          result = result.replace(new RegExp(`\\{\\{${param}\\}\\}`, 'g'), String(value));
        }
        // If no placeholders were substituted but there are extra params, append them
        // so numeric values like `max` are always visible in the rendered text.
        const extraValues = Object.entries(opts)
          .filter(([k]) => k !== 'defaultValue')
          .map(([, v]) => String(v));
        if (
          extraValues.length > 0 &&
          result === ((opts.defaultValue as string | undefined) ?? segments[segments.length - 1])
        ) {
          result = `${result} ${extraValues.join(' ')}`;
        }
      }
      return result;
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    // tc('characterSheet.resourcePools.max', { max: 5 }) → mock appends interpolation value
    // → "max 5", so the actual number must appear in the DOM.
    expect(screen.getByText(/\b5\b/)).toBeInTheDocument();
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

  it('renders compound regen label without crashing on the object regen', () => {
    const resolved = buildMinimalResolved({
      resourcePools: [
        {
          poolId: 'psionic-energy',
          max: 6,
          regen: { mode: 'compound', shortRestAmount: 1 },
          source: { origin: 'subclass', id: 'psiwarrior', classId: 'fighter', level: 3 },
        },
      ],
    });
    render(<ResourcePoolsPanel resolved={resolved} />);
    // tc('characterSheet.resourcePools.regen.compound', { shortRestAmount: 1 })
    // → last segment 'compound', mock appends the interpolation value → "compound 1"
    expect(screen.getByText(/compound/)).toBeInTheDocument();
    expect(screen.getByText(/\b1\b/)).toBeInTheDocument();
  });

  it('renders the die size when the pool declares one', () => {
    const resolved = buildMinimalResolved({
      resourcePools: [
        {
          poolId: 'psionic-energy',
          max: 6,
          regen: { mode: 'compound', shortRestAmount: 1 },
          dieSize: 8,
          source: { origin: 'subclass', id: 'psiwarrior', classId: 'fighter', level: 3 },
        },
      ],
    });
    render(<ResourcePoolsPanel resolved={resolved} />);
    // tc('characterSheet.resourcePools.dieSize', { dieSize: 8 }) → "dieSize 8"
    expect(screen.getByText(/\b8\b/)).toBeInTheDocument();
  });

  it('omits the die size segment when no dieSize is present', () => {
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
    // dieSize label uses the 'dieSize' key segment; with no dieSize it must not render
    expect(screen.queryByText(/dieSize/)).not.toBeInTheDocument();
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
    // tc('characterSheet.resourcePools.source', { source: 'MockSource' }) → mock appends interpolation value
    // → "source MockSource"
    expect(screen.getByText(/MockSource/)).toBeInTheDocument();
  });

  it('renders all pools when multiple are present', async () => {
    const { getSourceDisplayName } = await import('@/lib/class-icons');
    const resolved = buildMinimalResolved({
      resourcePools: [
        {
          poolId: 'focus-points',
          max: 4,
          regen: 'short-rest',
          source: { origin: 'class', id: 'monk', level: 1 },
        },
        {
          poolId: 'rage',
          max: 2,
          regen: 'long-rest',
          source: { origin: 'class', id: 'barbarian', level: 1 },
        },
      ],
    });
    render(<ResourcePoolsPanel resolved={resolved} />);
    // Both pool names appear via defaultValue fallback
    expect(screen.getByText('focus-points')).toBeInTheDocument();
    expect(screen.getByText('rage')).toBeInTheDocument();
    // getSourceDisplayName called once per pool
    expect(getSourceDisplayName).toHaveBeenCalledTimes(2);
  });
});
