import { render, screen } from '@testing-library/react';
import { ProficienciesPanel } from '@/components/character-sheet/ProficienciesPanel';
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
    pendingChoices: [],
    ...overrides,
  };
}

describe('ProficienciesPanel', () => {
  it('renders nothing when all proficiency lists are empty', () => {
    const { container } = render(<ProficienciesPanel resolved={buildMinimalResolved()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the Proficiencies heading when there are armor proficiencies', () => {
    const resolved = buildMinimalResolved({
      armorProficiencies: [{ value: 'light', sources: [{ origin: 'class', id: 'fighter', level: 1 }] }],
    });
    render(<ProficienciesPanel resolved={resolved} />);
    // The section heading uses the tc key which our mock returns last segment = 'proficiencies'
    expect(screen.getByText('proficiencies')).toBeInTheDocument();
  });

  it('renders armor proficiency badges', () => {
    const resolved = buildMinimalResolved({
      armorProficiencies: [
        { value: 'light', sources: [{ origin: 'class', id: 'fighter', level: 1 }] },
        { value: 'heavy', sources: [{ origin: 'class', id: 'fighter', level: 1 }] },
      ],
    });
    render(<ProficienciesPanel resolved={resolved} />);
    // gamedata t(`armor.light`) → 'light' (last segment)
    expect(screen.getByText('light')).toBeInTheDocument();
    expect(screen.getByText('heavy')).toBeInTheDocument();
  });

  it('renders weapon proficiency badges', () => {
    const resolved = buildMinimalResolved({
      weaponProficiencies: [
        { value: 'simple', sources: [{ origin: 'class', id: 'fighter', level: 1 }] },
        { value: 'martial', sources: [{ origin: 'class', id: 'fighter', level: 1 }] },
      ],
    });
    render(<ProficienciesPanel resolved={resolved} />);
    expect(screen.getByText('simple')).toBeInTheDocument();
    expect(screen.getByText('martial')).toBeInTheDocument();
  });

  it('renders tool proficiency badges', () => {
    const resolved = buildMinimalResolved({
      toolProficiencies: [{ value: 'thievestools', sources: [{ origin: 'background', id: 'soldier' }] }],
    });
    render(<ProficienciesPanel resolved={resolved} />);
    expect(screen.getByText('thievestools')).toBeInTheDocument();
  });

  it('renders language badges', () => {
    const resolved = buildMinimalResolved({
      languages: [
        { value: 'common', sources: [{ origin: 'race', id: 'human' }] },
        { value: 'elvish', sources: [{ origin: 'race', id: 'human' }] },
      ],
    });
    render(<ProficienciesPanel resolved={resolved} />);
    expect(screen.getByText('common')).toBeInTheDocument();
    expect(screen.getByText('elvish')).toBeInTheDocument();
  });

  it('omits armor section when armor proficiencies are empty', () => {
    const resolved = buildMinimalResolved({
      languages: [{ value: 'common', sources: [{ origin: 'race', id: 'human' }] }],
    });
    render(<ProficienciesPanel resolved={resolved} />);
    // 'armor' section label should not be present (mock returns last segment)
    expect(screen.queryByText('armor')).not.toBeInTheDocument();
  });
});
