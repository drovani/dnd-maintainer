import { render, screen } from '@testing-library/react';
import { CombatPanel } from '@/components/character-sheet/CombatPanel';
import type { ResolvedCharacter } from '@/types/resolved';

vi.mock('react-i18next', () => ({
  useTranslation: (_ns?: string) => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.defaultValue !== undefined) return opts.defaultValue as string;
      // Interpolate simple {{value}} placeholders for speedFt etc.
      const segments = key.split('.');
      const leaf = segments[segments.length - 1];
      if (opts?.value !== undefined) return `${opts.value} ft`;
      if (opts?.message !== undefined) return leaf;
      return leaf;
    },
  }),
}));

function buildMinimalResolved(overrides: Partial<ResolvedCharacter> = {}): ResolvedCharacter {
  return {
    abilities: {} as ResolvedCharacter['abilities'],
    hitDie: [],
    hitPoints: { max: 0 },
    speed: {},
    initiative: 0,
    proficiencyBonus: 2,
    armorClass: { calculations: [], bonuses: [], effective: 10 },
    savingThrows: {} as ResolvedCharacter['savingThrows'],
    skills: {
      perception: { ability: 'wis', proficient: false, expertise: false, bonus: 2, breakdown: [], sources: [] },
    } as unknown as ResolvedCharacter['skills'],
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

const BASE_PROPS = {
  resolved: null,
  abilities: undefined,
  armorClass: 15,
  speedValue: 30,
  maxHP: 40,
  profBonus: 3,
  isStale: false,
  buildError: null,
} as const;

describe('CombatPanel', () => {
  describe('Passive Perception', () => {
    it('does not render passive perception row when passivePerception is null', () => {
      render(<CombatPanel {...BASE_PROPS} passivePerception={null} />);
      expect(screen.queryByText('passivePerception')).toBeNull();
    });

    it('does not render passive perception row when passivePerception is undefined', () => {
      render(<CombatPanel {...BASE_PROPS} />);
      expect(screen.queryByText('passivePerception')).toBeNull();
    });

    it('renders passive perception row equal to 10 + perception bonus', () => {
      const resolved = buildMinimalResolved();
      // resolved.skills.perception.bonus = 2, so 10 + 2 = 12
      render(<CombatPanel {...BASE_PROPS} resolved={resolved} passivePerception={12} />);
      expect(screen.getByText('passivePerception')).toBeDefined();
      expect(screen.getByText('12')).toBeDefined();
    });

    it('renders passive perception of 10 when bonus is 0', () => {
      const resolved = buildMinimalResolved({
        skills: {
          perception: { ability: 'wis', proficient: false, expertise: false, bonus: 0, breakdown: [], sources: [] },
        } as unknown as ResolvedCharacter['skills'],
      });
      render(<CombatPanel {...BASE_PROPS} resolved={resolved} passivePerception={10} />);
      expect(screen.getByText('10')).toBeDefined();
    });
  });

  describe('Speed display', () => {
    it('falls back to speedValue ft when speed record is absent', () => {
      render(<CombatPanel {...BASE_PROPS} speedValue={30} />);
      expect(screen.getByText('30 ft')).toBeDefined();
    });

    it('renders walk speed alone when only walk is present', () => {
      const speed: ResolvedCharacter['speed'] = {
        walk: { value: 30, sources: [] },
      };
      render(<CombatPanel {...BASE_PROPS} speed={speed} />);
      expect(screen.getByText('30 ft')).toBeDefined();
    });

    it('renders walk + fly speed as composed string', () => {
      const speed: ResolvedCharacter['speed'] = {
        walk: { value: 30, sources: [] },
        fly: { value: 30, sources: [] },
      };
      render(<CombatPanel {...BASE_PROPS} speed={speed} />);
      // mock: "30 ft" for walk, "fly" label + "30 ft" for fly → "30 ft, fly 30 ft"
      expect(screen.getByText('30 ft, fly 30 ft')).toBeDefined();
    });

    it('appends translated condition when fly speed has a condition', () => {
      const speed: ResolvedCharacter['speed'] = {
        walk: { value: 30, sources: [] },
        fly: { value: 30, sources: [], condition: 'not-enclosed' },
      };
      render(<CombatPanel {...BASE_PROPS} speed={speed} />);
      // condition key: characterSheet.fields.speedConditions.not-enclosed
      // mock: defaultValue is undefined for this key so falls back to last segment → "not-enclosed"
      expect(screen.getByText('30 ft, fly 30 ft (not-enclosed)')).toBeDefined();
    });

    it('renders walk + swim speed', () => {
      const speed: ResolvedCharacter['speed'] = {
        walk: { value: 30, sources: [] },
        swim: { value: 15, sources: [] },
      };
      render(<CombatPanel {...BASE_PROPS} speed={speed} />);
      expect(screen.getByText('30 ft, swim 15 ft')).toBeDefined();
    });

    it('renders dash in speed row when speed record is empty and speedValue is null', () => {
      render(<CombatPanel {...BASE_PROPS} speed={{}} speedValue={null} />);
      const speedLabel = screen.getByText('speed');
      const speedValue = speedLabel.nextElementSibling;
      expect(speedValue?.textContent).toBe('—');
    });
  });
});
