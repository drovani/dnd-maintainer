import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BasicsStep } from '@/components/character-builder/BasicsStep';
import { CLASS_SOURCES } from '@/lib/sources/classes';
import { SPECIES_SOURCES } from '@/lib/sources/species';
import * as randomNpcModule from '@/lib/character-builder/random-npc';
import type { Character, AbilityScores } from '@/types/database';
import type { BuildLevelRow, CreationRow, LevelRow } from '@/lib/build-reconstruction';
import type { GrantBundle } from '@/types/sources';
import type { ChoiceKey, ChoiceDecision } from '@/types/choices';

// ---------------------------------------------------------------------------
// react-i18next mock — pattern from EquipmentStep.test.tsx
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: (ns?: string) => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const segments = key.split('.');
      const base = segments[segments.length - 1];
      // Interpolate {{class}} for quickNpcButton
      if (opts && 'class' in opts) return `${base}:${String(opts.class)}`;
      return base;
    },
    i18n: { language: 'en' },
    ns,
  }),
}));

// ---------------------------------------------------------------------------
// Mock usePlayerNames
// ---------------------------------------------------------------------------

vi.mock('@/hooks/useCharacters', () => ({
  usePlayerNames: () => ({ data: [], isError: false }),
}));

// ---------------------------------------------------------------------------
// Mock react-router-dom (useParams)
// ---------------------------------------------------------------------------

vi.mock('react-router-dom', () => ({
  useParams: () => ({ campaignSlug: 'test-campaign' }),
}));

// ---------------------------------------------------------------------------
// Mock useGameData — returns full lists (phb-2024 allowed) by default
// ---------------------------------------------------------------------------

import { SPECIES_SOURCES as _SS } from '@/lib/sources/species';
import { CLASS_SOURCES as _CS } from '@/lib/sources/classes';
import { BACKGROUND_SOURCES as _BS } from '@/lib/sources/backgrounds';
import { FEAT_SOURCES as _FS } from '@/lib/sources/feats';
import { SUBCLASS_SOURCES as _SCS } from '@/lib/sources/subclasses';
import type { GameData } from '@/hooks/useGameData';

const mockGameData: GameData = {
  species: _SS,
  classes: _CS,
  backgrounds: _BS,
  feats: _FS,
  subclasses: _SCS,
  allowedSourceBooks: ['phb-2024'],
};

vi.mock('@/hooks/useGameData', () => ({
  useGameData: () => mockGameData,
}));

// ---------------------------------------------------------------------------
// Mock sonner toast
// ---------------------------------------------------------------------------

const mockToastError = vi.fn();
vi.mock('sonner', () => ({
  toast: { error: (msg: string) => mockToastError(msg) },
}));

// ---------------------------------------------------------------------------
// Shared context state — mutated by mock handlers so the effect can react
// ---------------------------------------------------------------------------

let contextCharacter: Character;
let contextRows: readonly BuildLevelRow[];
let contextBundles: readonly GrantBundle[];
let contextBuild: { choices: Record<ChoiceKey, ChoiceDecision> } | null;

const mockUpdateCharacter = vi.fn((updates: Partial<Character>) => {
  contextCharacter = { ...contextCharacter, ...updates };
});
const mockUpdateCreation = vi.fn();
const mockLevelUp = vi.fn((classId: string) => {
  // Simulate adding a level-1 row
  const newRow: LevelRow = {
    sequence: 1,
    class_id: classId,
    class_level: 1,
    subclass_id: null,
    hp_roll: null,
    base_abilities: null,
    ability_method: null,
    choices: {},
    asi_allocation: null,
    feat_id: null,
    deleted_at: null,
  };
  contextRows = [contextRows[0], newRow];
});
const mockReplaceLevel = vi.fn();

vi.mock('@/hooks/useCharacterContext', () => ({
  useCharacterContext: () => ({
    character: contextCharacter,
    rows: contextRows,
    build: contextBuild,
    bundles: contextBundles,
    resolved: null,
    buildError: null,
    buildWarnings: [],
    isDirty: false,
    level: 1,
    hasDeletedRows: false,
    nextRestoreLevel: null,
    updateCharacter: mockUpdateCharacter,
    updateCreation: mockUpdateCreation,
    levelUp: mockLevelUp,
    levelDown: vi.fn(),
    undoLevelDown: vi.fn(),
    replaceLevel: mockReplaceLevel,
    makeChoice: vi.fn(),
    clearChoice: vi.fn(),
    markSaved: vi.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSeedCharacter(overrides?: Partial<Character>): Character {
  return {
    id: '',
    slug: '',
    previous_slugs: [],
    campaign_id: 'c1',
    name: '',
    player_name: null,
    character_type: 'pc',
    species: null,
    class: null,
    subclass: null,
    level: 0,
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
    status: 'draft',
    created_at: '',
    updated_at: '',
    weapon_masteries: null,
    heroic_inspiration: false,
    exhaustion_level: 0 as const,
    conditions: [],
    hit_dice_used: null,
    spell_slots_used: null,
    ...overrides,
  };
}

function buildCreationRow(base_abilities?: AbilityScores): CreationRow {
  return {
    sequence: 0,
    base_abilities: base_abilities ?? null,
    ability_method: null,
    choices: {},
    deleted_at: null,
  };
}

function buildLevelRow(classId: string, sequence: number = 1): LevelRow {
  return {
    sequence,
    class_id: classId,
    class_level: 1,
    subclass_id: null,
    hp_roll: null,
    base_abilities: null,
    ability_method: null,
    choices: {},
    asi_allocation: null,
    feat_id: null,
    deleted_at: null,
  };
}

function resetContext() {
  contextCharacter = buildSeedCharacter();
  contextRows = [buildCreationRow()];
  contextBundles = [];
  contextBuild = null;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BasicsStep', () => {
  beforeEach(() => {
    resetContext();
    vi.clearAllMocks();
  });

  it('renders one Quick NPC button per CLASS_SOURCES entry', () => {
    render(<BasicsStep />);

    const npcButtons = CLASS_SOURCES.map((c) => screen.getByRole('button', { name: new RegExp(c.id, 'i') }));
    expect(npcButtons).toHaveLength(CLASS_SOURCES.length);
    // Fighter button must be present
    expect(screen.getByRole('button', { name: /fighter/i })).toBeTruthy();
  });

  it('clicking the Fighter button advances to Skills exactly once', async () => {
    const onRequestAdvance = vi.fn();
    const { rerender } = render(<BasicsStep onRequestAdvance={onRequestAdvance} />);

    fireEvent.click(screen.getByRole('button', { name: /fighter/i }));

    // Simulate all state updates landing: character fields + base_abilities on creation row
    contextCharacter = {
      ...contextCharacter,
      character_type: 'npc',
      name: 'Test Name',
      species: SPECIES_SOURCES[0].id,
      alignment: 'lg',
      class: 'fighter',
      level: 1,
      background: 'soldier',
      gender: 'male',
    };
    contextRows = [buildCreationRow({ str: 15, dex: 13, con: 14, int: 12, wis: 10, cha: 8 }), buildLevelRow('fighter')];

    rerender(<BasicsStep onRequestAdvance={onRequestAdvance} />);

    await waitFor(() => expect(onRequestAdvance).toHaveBeenCalledWith('class'));
    expect(onRequestAdvance).toHaveBeenCalledTimes(1);
  });

  it('clicking the Fighter button populates NPC fields, background=soldier, and base abilities', () => {
    render(<BasicsStep />);

    fireEvent.click(screen.getByRole('button', { name: /fighter/i }));

    // updateCharacter called with required NPC fields
    expect(mockUpdateCharacter).toHaveBeenCalledWith(
      expect.objectContaining({
        character_type: 'npc',
        player_name: '',
        class: 'fighter',
        level: 1,
        background: 'soldier',
      })
    );
    const updateCall = mockUpdateCharacter.mock.calls[0][0] as Partial<Character>;
    expect(['male', 'female']).toContain(updateCall.gender);
    expect(SPECIES_SOURCES.map((r) => r.id)).toContain(updateCall.species);
    expect(updateCall.name).toBeTruthy();

    // updateCreation called with base_abilities
    expect(mockUpdateCreation).toHaveBeenCalledWith(
      expect.objectContaining({ base_abilities: expect.objectContaining({}) })
    );
    const creationCall = mockUpdateCreation.mock.calls[0][0] as { base_abilities: AbilityScores };
    const abilities = creationCall.base_abilities;
    // Fighter quickBuild highestAbility is ['str','dex'] — one of them must be 15
    const highest = Math.max(abilities.str, abilities.dex);
    expect(highest).toBe(15);
    expect(abilities.con).toBe(14);

    // levelUp called since no prior level row existed
    expect(mockLevelUp).toHaveBeenCalledWith('fighter', null);
  });

  it('writes a lineage-choice decision to updateCreation when the rolled species has a lineage', () => {
    vi.spyOn(randomNpcModule, 'generateRandomNpcBasicsDetailed').mockReturnValue({
      ok: true,
      basics: {
        gender: 'female',
        species: 'tiefling',
        alignment: 'ne',
        name: 'Test Tiefling',
        classId: 'fighter',
        baseAbilities: { str: 15, dex: 13, con: 14, int: 12, wis: 10, cha: 8 },
        suggestedBackground: 'soldier',
        targetStep: 'class',
        lineageDecision: { key: 'lineage-choice:species:tiefling:0', lineageId: 'infernal' },
      },
    });

    render(<BasicsStep />);
    fireEvent.click(screen.getByRole('button', { name: /fighter/i }));

    const creationCall = mockUpdateCreation.mock.calls[0][0] as { choices?: Record<string, unknown> };
    expect(creationCall.choices).toBeDefined();
    expect(creationCall.choices?.['lineage-choice:species:tiefling:0']).toEqual({
      type: 'lineage-choice',
      lineageId: 'infernal',
    });
  });

  it('omits choices from updateCreation when neither ASI nor lineage decisions are present', () => {
    vi.spyOn(randomNpcModule, 'generateRandomNpcBasicsDetailed').mockReturnValue({
      ok: true,
      basics: {
        gender: 'male',
        species: 'human',
        alignment: 'lg',
        name: 'Test Human',
        classId: 'fighter',
        baseAbilities: { str: 15, dex: 13, con: 14, int: 12, wis: 10, cha: 8 },
        suggestedBackground: 'soldier',
        targetStep: 'class',
        // No backgroundAsiDecision, no lineageDecision
      },
    });

    render(<BasicsStep />);
    fireEvent.click(screen.getByRole('button', { name: /fighter/i }));

    const creationCall = mockUpdateCreation.mock.calls[0][0] as { choices?: unknown };
    expect(creationCall.choices).toBeUndefined();
  });

  it('omitting onRequestAdvance does not crash', () => {
    render(<BasicsStep />);
    expect(() => fireEvent.click(screen.getByRole('button', { name: /fighter/i }))).not.toThrow();
  });

  it('uses replaceLevel instead of levelUp when a level row already exists (re-click case)', async () => {
    // Pre-populate a level-1 fighter row to simulate a re-click
    contextRows = [buildCreationRow(), buildLevelRow('fighter', 1)];

    render(<BasicsStep />);

    fireEvent.click(screen.getByRole('button', { name: /fighter/i }));
    // Existing level row counts as user data → confirm overwrite in the dialog
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /fighter/i }));

    expect(mockReplaceLevel).toHaveBeenCalledWith(1, 'fighter', null);
    expect(mockLevelUp).not.toHaveBeenCalled();
  });

  it('shows toast error and does not advance when NPC generation returns null', () => {
    const onRequestAdvance = vi.fn();
    vi.spyOn(randomNpcModule, 'generateRandomNpcBasicsDetailed').mockReturnValue({
      ok: false,
      failure: 'name-generation',
    });

    render(<BasicsStep onRequestAdvance={onRequestAdvance} />);

    fireEvent.click(screen.getByRole('button', { name: /fighter/i }));

    expect(mockToastError).toHaveBeenCalledWith('quickNpcFailed');
    expect(onRequestAdvance).not.toHaveBeenCalled();
    expect(mockUpdateCharacter).not.toHaveBeenCalled();
    expect(mockUpdateCreation).not.toHaveBeenCalled();
    expect(mockLevelUp).not.toHaveBeenCalled();
  });

  it('rolls back cleanly if levelUp throws: no updateCharacter, no updateCreation, no advance', () => {
    const onRequestAdvance = vi.fn();
    mockLevelUp.mockImplementationOnce(() => {
      throw new Error('simulated grants resolution failure');
    });

    render(<BasicsStep onRequestAdvance={onRequestAdvance} />);
    fireEvent.click(screen.getByRole('button', { name: /fighter/i }));

    expect(mockToastError).toHaveBeenCalledWith('quickNpcCommitFailed');
    expect(mockUpdateCharacter).not.toHaveBeenCalled();
    expect(mockUpdateCreation).not.toHaveBeenCalled();
    expect(onRequestAdvance).not.toHaveBeenCalled();
  });

  it('rolls back cleanly if replaceLevel throws on a re-click (pre-existing level row)', async () => {
    const onRequestAdvance = vi.fn();
    contextRows = [buildCreationRow(), buildLevelRow('fighter', 1)];
    mockReplaceLevel.mockImplementationOnce(() => {
      throw new Error('simulated replaceLevel failure');
    });

    render(<BasicsStep onRequestAdvance={onRequestAdvance} />);
    fireEvent.click(screen.getByRole('button', { name: /fighter/i }));
    // Existing row counts as user-entered data → confirmation dialog opens. Confirm to reach commit path.
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /fighter/i }));

    expect(mockToastError).toHaveBeenCalledWith('quickNpcCommitFailed');
    expect(mockReplaceLevel).toHaveBeenCalled();
    expect(mockUpdateCharacter).not.toHaveBeenCalled();
    expect(mockUpdateCreation).not.toHaveBeenCalled();
    expect(onRequestAdvance).not.toHaveBeenCalled();
  });

  it('cross-class re-click: second click does not race — only final targetStep fires', async () => {
    const onRequestAdvance = vi.fn();
    const { rerender } = render(<BasicsStep onRequestAdvance={onRequestAdvance} />);

    // First click → Fighter (quickBuild → targetStep='class')
    fireEvent.click(screen.getByRole('button', { name: /fighter/i }));

    // Before any state lands, second click with a no-quickBuild class (targetStep='abilities')
    vi.spyOn(randomNpcModule, 'generateRandomNpcBasicsDetailed').mockReturnValueOnce({
      ok: true,
      basics: {
        gender: 'female',
        species: SPECIES_SOURCES[0].id,
        alignment: 'n',
        name: 'Second Name',
        classId: 'fighter',
        targetStep: 'abilities',
      },
    });
    // Second click: existing level row (from first click's levelUp) triggers overwrite dialog.
    contextRows = [buildCreationRow(), buildLevelRow('fighter', 1)];
    rerender(<BasicsStep onRequestAdvance={onRequestAdvance} />);
    fireEvent.click(screen.getByRole('button', { name: /fighter/i }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /fighter/i }));

    // Commit the second-click state: abilities NOT required since targetStep='abilities'
    contextCharacter = {
      ...contextCharacter,
      name: 'Second Name',
      species: SPECIES_SOURCES[0].id,
      alignment: 'n',
      class: 'fighter',
      level: 1,
    };
    rerender(<BasicsStep onRequestAdvance={onRequestAdvance} />);

    await waitFor(() => expect(onRequestAdvance).toHaveBeenCalledWith('abilities'));
    expect(onRequestAdvance).toHaveBeenCalledTimes(1);
    expect(onRequestAdvance).not.toHaveBeenCalledWith('class');
  });

  it('surfaces a distinct toast for unknown-class failures', () => {
    vi.spyOn(randomNpcModule, 'generateRandomNpcBasicsDetailed').mockReturnValue({
      ok: false,
      failure: 'unknown-class',
    });

    render(<BasicsStep />);
    fireEvent.click(screen.getByRole('button', { name: /fighter/i }));

    expect(mockToastError).toHaveBeenCalledWith('quickNpcUnknownClass');
  });

  it('advances to abilities (not skills) for a quick NPC whose class lacks quickBuild data', async () => {
    const onRequestAdvance = vi.fn();
    vi.spyOn(randomNpcModule, 'generateRandomNpcBasicsDetailed').mockReturnValue({
      ok: true,
      basics: {
        gender: 'male',
        species: SPECIES_SOURCES[0].id,
        alignment: 'n',
        name: 'Test Name',
        classId: 'fighter',
        targetStep: 'abilities',
      },
    });

    const { rerender } = render(<BasicsStep onRequestAdvance={onRequestAdvance} />);
    fireEvent.click(screen.getByRole('button', { name: /fighter/i }));

    // No background update and no updateCreation call on the abilities branch
    const updateCall = mockUpdateCharacter.mock.calls[0][0] as Partial<Character>;
    expect(updateCall.background).toBeUndefined();
    expect(mockUpdateCreation).not.toHaveBeenCalled();

    // Simulate basics landing in state (abilities NOT required to advance on this branch)
    contextCharacter = {
      ...contextCharacter,
      name: 'Test Name',
      species: SPECIES_SOURCES[0].id,
      alignment: 'n',
      class: 'fighter',
      level: 1,
    };
    contextRows = [buildCreationRow(), buildLevelRow('fighter')];

    rerender(<BasicsStep onRequestAdvance={onRequestAdvance} />);

    await waitFor(() => expect(onRequestAdvance).toHaveBeenCalledWith('abilities'));
    expect(onRequestAdvance).toHaveBeenCalledTimes(1);
  });

  it('does NOT advance to skills until base_abilities have committed', async () => {
    const onRequestAdvance = vi.fn();
    const { rerender } = render(<BasicsStep onRequestAdvance={onRequestAdvance} />);

    fireEvent.click(screen.getByRole('button', { name: /fighter/i }));

    // Commit basics without base_abilities — advance must NOT fire yet
    contextCharacter = {
      ...contextCharacter,
      name: 'Test Name',
      species: SPECIES_SOURCES[0].id,
      alignment: 'lg',
      class: 'fighter',
      level: 1,
      background: 'soldier',
      gender: 'male',
    };
    contextRows = [buildCreationRow(/* no base_abilities */), buildLevelRow('fighter')];
    rerender(<BasicsStep onRequestAdvance={onRequestAdvance} />);
    await new Promise((r) => setTimeout(r, 0));
    expect(onRequestAdvance).not.toHaveBeenCalled();

    // Now commit base_abilities — advance fires exactly once
    contextRows = [buildCreationRow({ str: 15, dex: 13, con: 14, int: 12, wis: 10, cha: 8 }), buildLevelRow('fighter')];
    rerender(<BasicsStep onRequestAdvance={onRequestAdvance} />);

    await waitFor(() => expect(onRequestAdvance).toHaveBeenCalledWith('class'));
    expect(onRequestAdvance).toHaveBeenCalledTimes(1);
  });

  it('manual field edit after Quick NPC cancels the pending step advance', async () => {
    const onRequestAdvance = vi.fn();
    const { rerender } = render(<BasicsStep onRequestAdvance={onRequestAdvance} />);

    fireEvent.click(screen.getByRole('button', { name: /fighter/i }));

    // User immediately edits the character name — this must clear the pending ref
    const nameInput = screen.getByPlaceholderText('enterCharacterName') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Manual Edit' } });

    // Now simulate all fields + abilities landing
    contextCharacter = {
      ...contextCharacter,
      name: 'Manual Edit',
      species: SPECIES_SOURCES[0].id,
      alignment: 'lg',
      class: 'fighter',
      level: 1,
      background: 'soldier',
      gender: 'male',
    };
    contextRows = [buildCreationRow({ str: 15, dex: 13, con: 14, int: 12, wis: 10, cha: 8 }), buildLevelRow('fighter')];
    rerender(<BasicsStep onRequestAdvance={onRequestAdvance} />);
    await new Promise((r) => setTimeout(r, 0));

    expect(onRequestAdvance).not.toHaveBeenCalled();

    // Verify ref-clearing didn't permanently disable the Quick NPC flow — a
    // subsequent click must still arm a new advance. Fields are now populated
    // from the first click, so the overwrite dialog intercepts this second click.
    fireEvent.click(screen.getByRole('button', { name: /fighter/i }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /fighter/i }));
    contextRows = [buildCreationRow({ str: 15, dex: 13, con: 14, int: 12, wis: 10, cha: 8 }), buildLevelRow('fighter')];
    rerender(<BasicsStep onRequestAdvance={onRequestAdvance} />);
    await waitFor(() => expect(onRequestAdvance).toHaveBeenCalledWith('class'));
  });

  // ---------------------------------------------------------------------------
  // IMPORTANT #7 — legacy-species badge, background removal, lineage non-rendering
  // (lineage picker moved to OriginStep — see OriginStep.test.tsx)
  // ---------------------------------------------------------------------------

  it('does not render a lineage picker in BasicsStep (moved to OriginStep)', () => {
    contextCharacter = buildSeedCharacter({ species: 'elf' });
    contextBundles = [
      {
        source: { origin: 'species', id: 'elf' },
        grants: [
          {
            type: 'lineage-choice',
            key: 'lineage-choice:species:elf:0' as ChoiceKey,
            speciesId: 'elf',
            from: ['drow', 'high-elf', 'wood-elf'],
          },
        ],
      },
    ] as readonly GrantBundle[];

    render(<BasicsStep />);

    // No lineage radios, no loading hint
    expect(screen.queryByText('loadingLineage')).toBeNull();
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
  });

  it('shows legacy-species warning badge when character.species is not in SPECIES_SOURCES', () => {
    // 'dwarf-hill' is a legacy ID from the old data model (not in SpeciesId union — cast required)
    contextCharacter = buildSeedCharacter({ species: 'dwarf-hill' as 'human' });

    render(<BasicsStep />);

    expect(screen.getByText(/legacySpecies/)).toBeTruthy();
  });

  it('does not show legacy-species badge for a current 2024 species', () => {
    contextCharacter = buildSeedCharacter({ species: 'elf' });

    render(<BasicsStep />);

    expect(screen.queryByText('legacySpecies')).toBeNull();
  });

  it('renders a Background <Select> in BasicsStep (top-level ID pick — sub-choices live in OriginStep)', () => {
    render(<BasicsStep />);

    expect(screen.getByText('chooseBackground')).toBeTruthy();
  });
});
