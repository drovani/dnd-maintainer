import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HitDicePanel } from '@/components/character-sheet/HitDicePanel';
import type { Character } from '@/types/database';
import type { ResolvedCharacter } from '@/types/resolved';

vi.mock('react-i18next', () => ({
  useTranslation: (_ns?: string) => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.defaultValue !== undefined) return opts.defaultValue as string;
      const segments = key.split('.');
      return segments[segments.length - 1];
    },
  }),
}));

function buildMinimalCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: 'char-1',
    slug: 'test-char',
    previous_slugs: [],
    created_at: '',
    updated_at: '',
    campaign_id: 'camp-1',
    name: 'Test Character',
    player_name: null,
    character_type: 'pc',
    species: null,
    class: null,
    subclass: null,
    level: 1,
    background: null,
    alignment: null,
    gender: null,
    size: null,
    age: null,
    height: null,
    weight: null,
    eye_color: null,
    hair_color: null,
    skin_color: null,
    hit_points_max: null,
    armor_class: null,
    speed: null,
    proficiency_bonus: null,
    personality_traits: null,
    ideals: null,
    bonds: null,
    flaws: null,
    appearance: null,
    backstory: null,
    notes: null,
    portrait_url: null,
    is_active: true,
    status: 'ready',
    weapon_masteries: null,
    heroic_inspiration: false,
    exhaustion_level: 0,
    conditions: [],
    hit_dice_used: null,
    spell_slots_used: null,
    ...overrides,
  };
}

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

describe('HitDicePanel', () => {
  it('returns null when resolved.hitDie is empty', () => {
    const { container } = render(
      <HitDicePanel
        resolved={buildMinimalResolved({ hitDie: [] })}
        character={buildMinimalCharacter()}
        onUpdate={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders a section heading', () => {
    const resolved = buildMinimalResolved({ hitDie: [{ die: 8, count: 3 }] });
    render(<HitDicePanel resolved={resolved} character={buildMinimalCharacter()} onUpdate={vi.fn()} />);
    // tc('characterSheet.sections.hitDice') → last segment = "hitDice"
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('hitDice');
  });

  it('renders one row per distinct die type', () => {
    const resolved = buildMinimalResolved({
      hitDie: [
        { die: 10, count: 2 },
        { die: 6, count: 3 },
      ],
    });
    render(<HitDicePanel resolved={resolved} character={buildMinimalCharacter()} onUpdate={vi.fn()} />);
    // tc('characterSheet.hitDice.dieLabel', {die, count}) → mock returns last segment "dieLabel"
    // Two die rows → two "dieLabel" labels
    expect(screen.getAllByText('dieLabel')).toHaveLength(2);
  });

  it('shows available count label for each die row', () => {
    const resolved = buildMinimalResolved({ hitDie: [{ die: 8, count: 4 }] });
    render(
      <HitDicePanel resolved={resolved} character={buildMinimalCharacter({ hit_dice_used: {} })} onUpdate={vi.fn()} />
    );
    // tc('characterSheet.hitDice.available', {...}) → mock returns last segment "available"
    expect(screen.getByText('available')).toBeInTheDocument();
  });

  it('shows available count label when some dice are used', () => {
    const resolved = buildMinimalResolved({ hitDie: [{ die: 8, count: 4 }] });
    render(
      <HitDicePanel
        resolved={resolved}
        character={buildMinimalCharacter({ hit_dice_used: { '8': 2 } })}
        onUpdate={vi.fn()}
      />
    );
    // tc('characterSheet.hitDice.available', {...}) → mock returns last segment "available"
    expect(screen.getByText('available')).toBeInTheDocument();
  });

  it('clicking Spend calls onUpdate with incremented used count', async () => {
    const onUpdate = vi.fn();
    const resolved = buildMinimalResolved({ hitDie: [{ die: 8, count: 3 }] });
    render(
      <HitDicePanel resolved={resolved} character={buildMinimalCharacter({ hit_dice_used: {} })} onUpdate={onUpdate} />
    );
    // tc('characterSheet.hitDice.spend') → mock returns "spend"
    await userEvent.click(screen.getByRole('button', { name: 'spend' }));
    expect(onUpdate).toHaveBeenCalledWith({ hit_dice_used: { '8': 1 } });
  });

  it('Spend button is disabled when all dice of that type are used', () => {
    const resolved = buildMinimalResolved({ hitDie: [{ die: 8, count: 2 }] });
    render(
      <HitDicePanel
        resolved={resolved}
        character={buildMinimalCharacter({ hit_dice_used: { '8': 2 } })}
        onUpdate={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'spend' })).toBeDisabled();
  });

  it('does not call onUpdate on initial render', () => {
    const onUpdate = vi.fn();
    const resolved = buildMinimalResolved({ hitDie: [{ die: 8, count: 3 }] });
    render(<HitDicePanel resolved={resolved} character={buildMinimalCharacter()} onUpdate={onUpdate} />);
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('treats hit_dice_used null as empty (all available)', () => {
    const resolved = buildMinimalResolved({ hitDie: [{ die: 8, count: 2 }] });
    render(
      <HitDicePanel resolved={resolved} character={buildMinimalCharacter({ hit_dice_used: null })} onUpdate={vi.fn()} />
    );
    expect(screen.getByText('available')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'spend' })).not.toBeDisabled();
  });

  it('clamps available to 0 when used exceeds max (de-leveled stale data)', () => {
    // used=5 > max=3 — available must never go negative; Spend must be disabled
    const resolved = buildMinimalResolved({ hitDie: [{ die: 8, count: 3 }] });
    render(
      <HitDicePanel
        resolved={resolved}
        character={buildMinimalCharacter({ hit_dice_used: { '8': 5 } })}
        onUpdate={vi.fn()}
      />
    );
    // "available" text is still rendered (not negative label)
    expect(screen.getByText('available')).toBeInTheDocument();
    // Spend disabled because usedCount(5) >= max(3)
    expect(screen.getByRole('button', { name: 'spend' })).toBeDisabled();
  });
});
