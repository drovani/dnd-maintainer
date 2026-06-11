import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpellSlotsPanel } from '@/components/character-sheet/SpellSlotsPanel';
import type { Character } from '@/types/database';
import type { ResolvedCharacter, ResolvedSpellcasting } from '@/types/resolved';

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

function makeSpellcasting(overrides: Partial<ResolvedSpellcasting> = {}): ResolvedSpellcasting {
  return {
    ability: 'wis',
    spellSaveDC: 14,
    spellAttackBonus: 6,
    cantrips: [],
    cantripsKnown: 0,
    knownSpells: [],
    spellsKnown: [],
    alwaysPreparedSpells: [],
    slots: [],
    preparedCount: 0,
    pactMagic: null,
    ...overrides,
  };
}

describe('SpellSlotsPanel', () => {
  it('returns null when spellcasting is null', () => {
    const { container } = render(
      <SpellSlotsPanel
        resolved={buildMinimalResolved({ spellcasting: null })}
        character={buildMinimalCharacter()}
        onUpdate={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('returns null when all slot counts are 0 and no pact magic', () => {
    const resolved = buildMinimalResolved({
      spellcasting: makeSpellcasting({ slots: [0, 0, 0, 0, 0, 0, 0, 0, 0], pactMagic: null }),
    });
    const { container } = render(
      <SpellSlotsPanel resolved={resolved} character={buildMinimalCharacter()} onUpdate={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders section heading when there are slots', () => {
    const resolved = buildMinimalResolved({
      spellcasting: makeSpellcasting({ slots: [2, 0, 0, 0, 0, 0, 0, 0, 0] }),
    });
    render(<SpellSlotsPanel resolved={resolved} character={buildMinimalCharacter()} onUpdate={vi.fn()} />);
    // tc('characterSheet.sections.spellSlots') → last segment = "spellSlots"
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('spellSlots');
  });

  it('renders correct number of slot toggles for level 1 with 4 slots', () => {
    const resolved = buildMinimalResolved({
      spellcasting: makeSpellcasting({ slots: [4, 0, 0, 0, 0, 0, 0, 0, 0] }),
    });
    render(<SpellSlotsPanel resolved={resolved} character={buildMinimalCharacter()} onUpdate={vi.fn()} />);
    // 4 slot buttons for level 1 — mock returns last segment of key: "useSlot" or "recoverSlot"
    const slotButtons = screen.getAllByRole('button', { name: /useSlot|recoverSlot/i });
    expect(slotButtons).toHaveLength(4);
  });

  it('all slots are unfilled (aria-pressed=false) when none used', () => {
    const resolved = buildMinimalResolved({
      spellcasting: makeSpellcasting({ slots: [2, 0, 0, 0, 0, 0, 0, 0, 0] }),
    });
    render(
      <SpellSlotsPanel
        resolved={resolved}
        character={buildMinimalCharacter({ spell_slots_used: {} })}
        onUpdate={vi.fn()}
      />
    );
    const buttons = screen.getAllByRole('button');
    for (const btn of buttons) {
      expect(btn).toHaveAttribute('aria-pressed', 'false');
    }
  });

  it('clicking an unfilled slot calls onUpdate with incremented used count', async () => {
    const onUpdate = vi.fn();
    const resolved = buildMinimalResolved({
      spellcasting: makeSpellcasting({ slots: [2, 0, 0, 0, 0, 0, 0, 0, 0] }),
    });
    render(
      <SpellSlotsPanel
        resolved={resolved}
        character={buildMinimalCharacter({ spell_slots_used: {} })}
        onUpdate={onUpdate}
      />
    );
    // mock returns last segment of key: "useSlot"
    await userEvent.click(screen.getAllByRole('button', { name: /useSlot/i })[0]);
    expect(onUpdate).toHaveBeenCalledWith({ spell_slots_used: { '1': 1 } });
  });

  it('clicking a filled slot calls onUpdate with decremented used count (recover)', async () => {
    const onUpdate = vi.fn();
    const resolved = buildMinimalResolved({
      spellcasting: makeSpellcasting({ slots: [2, 0, 0, 0, 0, 0, 0, 0, 0] }),
    });
    render(
      <SpellSlotsPanel
        resolved={resolved}
        character={buildMinimalCharacter({ spell_slots_used: { '1': 2 } })}
        onUpdate={onUpdate}
      />
    );
    // Both slots are filled — clicking pip i=0 (filled) sets used = 0
    await userEvent.click(screen.getAllByRole('button', { name: /recoverSlot/i })[0]);
    expect(onUpdate).toHaveBeenCalledWith({ spell_slots_used: { '1': 0 } });
  });

  it('clicking a partially-filled pip recovers slots above the clicked position', async () => {
    // max=4, used=3 → pips 0,1,2 are filled, pip 3 is empty
    // clicking pip i=1 (filled) sets used = 1 (recovers slots 2 and above)
    const onUpdate = vi.fn();
    const resolved = buildMinimalResolved({
      spellcasting: makeSpellcasting({ slots: [4, 0, 0, 0, 0, 0, 0, 0, 0] }),
    });
    render(
      <SpellSlotsPanel
        resolved={resolved}
        character={buildMinimalCharacter({ spell_slots_used: { '1': 3 } })}
        onUpdate={onUpdate}
      />
    );
    // All 4 pips rendered; pips 0,1,2 have aria-label "recoverSlot", pip 3 has "useSlot"
    const filledPips = screen.getAllByRole('button', { name: /recoverSlot/i });
    // filledPips[1] is pip i=1
    await userEvent.click(filledPips[1]);
    expect(onUpdate).toHaveBeenCalledWith({ spell_slots_used: { '1': 1 } });
  });

  it('renders pact magic row with correct number of toggles for warlock', () => {
    const resolved = buildMinimalResolved({
      spellcasting: makeSpellcasting({
        slots: [],
        pactMagic: { count: 2, slotLevel: 3 },
      }),
    });
    render(<SpellSlotsPanel resolved={resolved} character={buildMinimalCharacter()} onUpdate={vi.fn()} />);
    // mock returns last key segment: "usePact" or "recoverPact"
    const pactButtons = screen.getAllByRole('button', { name: /usePact|recoverPact/i });
    expect(pactButtons).toHaveLength(2);
  });

  it('renders panel for warlock with pact magic (no normal slots)', () => {
    const resolved = buildMinimalResolved({
      spellcasting: makeSpellcasting({
        slots: [],
        pactMagic: { count: 1, slotLevel: 5 },
      }),
    });
    const { container } = render(
      <SpellSlotsPanel resolved={resolved} character={buildMinimalCharacter()} onUpdate={vi.fn()} />
    );
    expect(container.firstChild).not.toBeNull();
  });

  it('clicking a pact slot calls onUpdate with pact key', async () => {
    const onUpdate = vi.fn();
    const resolved = buildMinimalResolved({
      spellcasting: makeSpellcasting({
        slots: [],
        pactMagic: { count: 2, slotLevel: 3 },
      }),
    });
    render(
      <SpellSlotsPanel
        resolved={resolved}
        character={buildMinimalCharacter({ spell_slots_used: {} })}
        onUpdate={onUpdate}
      />
    );
    // mock returns last key segment: "usePact"
    await userEvent.click(screen.getAllByRole('button', { name: /usePact/i })[0]);
    expect(onUpdate).toHaveBeenCalledWith({ spell_slots_used: { pact: 1 } });
  });

  it('treats spell_slots_used null as empty (all unfilled)', () => {
    const resolved = buildMinimalResolved({
      spellcasting: makeSpellcasting({ slots: [1, 0, 0, 0, 0, 0, 0, 0, 0] }),
    });
    render(
      <SpellSlotsPanel
        resolved={resolved}
        character={buildMinimalCharacter({ spell_slots_used: null })}
        onUpdate={vi.fn()}
      />
    );
    // mock returns last key segment: "useSlot"
    expect(screen.getByRole('button', { name: /useSlot/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('does not call onUpdate on initial render', () => {
    const onUpdate = vi.fn();
    const resolved = buildMinimalResolved({
      spellcasting: makeSpellcasting({ slots: [2, 0, 0, 0, 0, 0, 0, 0, 0] }),
    });
    render(<SpellSlotsPanel resolved={resolved} character={buildMinimalCharacter()} onUpdate={onUpdate} />);
    expect(onUpdate).not.toHaveBeenCalled();
  });
});
