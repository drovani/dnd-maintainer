import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EquipmentStep } from '@/components/character-builder/EquipmentStep';
import type { EquipmentStepEquipmentProps } from '@/components/character-builder/EquipmentStep';
import type { ResolvedCharacter } from '@/types/resolved';
import type { ChoiceKey } from '@/types/choices';
import type { GrantBundle } from '@/types/sources';
import { requireItemDef, WEAPON_CATALOG } from '@/lib/sources/items';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => {
      const segments = key.split('.');
      return opts?.defaultValue ?? segments[segments.length - 1];
    },
  }),
}));

// ---------------------------------------------------------------------------
// Mock useCharacterContext
// ---------------------------------------------------------------------------

const mockMakeChoice = vi.fn();
const mockClearChoice = vi.fn();

let mockContextValue: {
  bundles: readonly GrantBundle[];
  resolved: Partial<ResolvedCharacter> | null;
  build: { choices: Record<string, unknown> } | null;
  makeChoice: typeof mockMakeChoice;
  clearChoice: typeof mockClearChoice;
};

vi.mock('@/hooks/useCharacterContext', () => ({
  useCharacterContext: () => mockContextValue,
}));

// ---------------------------------------------------------------------------
// Default equipment props factory
// ---------------------------------------------------------------------------

function makeEquipmentProps(overrides: Partial<EquipmentStepEquipmentProps> = {}): EquipmentStepEquipmentProps {
  return {
    equipmentMode: 'starting-equipment',
    startingGoldTotal: 0,
    purchasedItems: [],
    classId: null,
    onModeChange: vi.fn(),
    onGoldChange: vi.fn(),
    onPurchase: vi.fn(),
    onRemovePurchase: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FIGHTER_SOURCE = { origin: 'class' as const, id: 'fighter' as const, level: 1 };

function makeLoadoutBundle(): GrantBundle {
  return {
    source: FIGHTER_SOURCE,
    grants: [
      {
        type: 'bundle-choice',
        key: 'bundle-choice:class:fighter:0' as ChoiceKey,
        category: 'loadout',
        bundleIds: ['fighter-chainmail', 'fighter-archer-kit'],
      },
    ],
  };
}

function makeMeleeBundle(): GrantBundle {
  return {
    source: FIGHTER_SOURCE,
    grants: [
      {
        type: 'bundle-choice',
        key: 'bundle-choice:class:fighter:1' as ChoiceKey,
        category: 'melee-weapon',
        bundleIds: ['martial-weapon-and-shield', 'two-martial-weapons'],
      },
    ],
  };
}

function makeResolved(
  equipment: ResolvedCharacter['equipment'] = [],
  weaponMasteries: ResolvedCharacter['weaponMasteries'] = []
): Partial<ResolvedCharacter> {
  return { pendingChoices: [], equipment, weaponMasteries };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EquipmentStep — two-column layout', () => {
  beforeEach(() => {
    mockContextValue = {
      bundles: [],
      resolved: makeResolved() as ResolvedCharacter,
      build: { choices: {} },
      makeChoice: mockMakeChoice,
      clearChoice: mockClearChoice,
    };
  });

  it('renders the Class Equipment Loadout section header', () => {
    render(<EquipmentStep {...makeEquipmentProps()} />);

    expect(screen.getByText('classLoadoutTitle')).toBeTruthy();
  });

  it('always renders the Equipment Summary panel in the right column', () => {
    render(<EquipmentStep {...makeEquipmentProps()} />);

    expect(screen.getByText('summary')).toBeTruthy();
    // Empty-state message when no equipment is materialized yet
    expect(screen.getByText('summaryEmpty')).toBeTruthy();
  });

  it('renders class bundle-choice grants as ChoicePicker options (from bundles, not pendingChoices)', () => {
    mockContextValue.bundles = [makeLoadoutBundle()];

    render(<EquipmentStep {...makeEquipmentProps()} />);

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
  });

  it('keeps the choice visible after a decision is made so the user can change their pick', () => {
    mockContextValue.bundles = [makeLoadoutBundle()];
    // Simulate a decision already being made
    mockContextValue.build = {
      choices: {
        'bundle-choice:class:fighter:0': {
          type: 'bundle-choice',
          bundleId: 'fighter-chainmail',
          slotPicks: {},
        },
      },
    };
    // Resolver has already materialized the equipment (no pending choice remains)
    mockContextValue.resolved = makeResolved([
      {
        itemId: 'chain-mail',
        itemDef: requireItemDef('chain-mail'),
        quantity: 1,
        source: { origin: 'bundle', id: 'fighter-chainmail' },
        equipped: false,
      },
    ]) as ResolvedCharacter;

    render(<EquipmentStep {...makeEquipmentProps()} />);

    // Both radios must still render so the user can switch their pick
    const radios = screen.getAllByRole('radio') as HTMLInputElement[];
    expect(radios).toHaveLength(2);
    // And the selected one should reflect the current decision
    const checkedIds = radios.filter((r) => r.checked).map((r) => r.id);
    expect(checkedIds.some((id) => id.endsWith('-fighter-chainmail'))).toBe(true);
  });

  it('renders class bundle-choices in canonical BUNDLE_CATEGORIES order even when bundles are out of order', () => {
    // Supply melee first, loadout second — the step should still render loadout first
    mockContextValue.bundles = [makeMeleeBundle(), makeLoadoutBundle()];

    const { container } = render(<EquipmentStep {...makeEquipmentProps()} />);

    const radios = Array.from(container.querySelectorAll('input[type="radio"]'));
    const firstName = radios[0]?.getAttribute('name') ?? '';
    expect(firstName).toContain('bundle-choice:class:fighter:0');
  });

  it('shows the loadout-unavailable hint when no class bundle-choice grants exist', () => {
    mockContextValue.bundles = [];

    render(<EquipmentStep {...makeEquipmentProps()} />);

    expect(screen.getByText('loadoutUnavailable')).toBeTruthy();
  });

  it('summary panel lists materialized equipment grouped by type', () => {
    mockContextValue.bundles = [makeLoadoutBundle()];
    mockContextValue.resolved = makeResolved([
      {
        itemId: 'chain-mail',
        itemDef: requireItemDef('chain-mail'),
        quantity: 1,
        source: { origin: 'bundle', id: 'fighter-chainmail' },
        equipped: false,
      },
      {
        itemId: 'longsword',
        itemDef: requireItemDef('longsword'),
        quantity: 1,
        source: { origin: 'bundle', id: 'martial-weapon-and-shield' },
        equipped: false,
      },
    ]) as ResolvedCharacter;

    render(<EquipmentStep {...makeEquipmentProps()} />);

    // Summary should show both the weapon header and the armor header
    expect(screen.getByText('summary')).toBeTruthy();
    // Empty-state must NOT render when there's materialized equipment
    expect(screen.queryByText('summaryEmpty')).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // IMPORTANT #7 — weapon mastery badge tests
  // ---------------------------------------------------------------------------

  it('shows weapon mastery badge when mastery comes from a build choices decision', () => {
    // longsword has mastery 'sap' in WEAPON_CATALOG
    mockContextValue.bundles = [];
    mockContextValue.resolved = makeResolved([
      {
        itemId: 'longsword',
        itemDef: requireItemDef('longsword'),
        quantity: 1,
        source: { origin: 'bundle', id: 'martial-weapon-and-shield' },
        equipped: false,
      },
    ]) as ResolvedCharacter;
    mockContextValue.build = {
      choices: {
        'weapon-mastery-choice:class:fighter:0': {
          type: 'weapon-mastery-choice',
          weaponIds: ['longsword'],
        },
      },
    };

    render(<EquipmentStep {...makeEquipmentProps()} />);

    // The mastery badge renders the last segment of t('weaponMasteries.sap.name') → 'name'
    expect(screen.getByText('name')).toBeTruthy();
  });

  it('shows weapon mastery badge when mastery comes from resolved.weaponMasteries', () => {
    mockContextValue.bundles = [];
    mockContextValue.resolved = makeResolved(
      [
        {
          itemId: 'longsword',
          itemDef: requireItemDef('longsword'),
          quantity: 1,
          source: { origin: 'bundle', id: 'martial-weapon-and-shield' },
          equipped: false,
        },
      ],
      [{ weaponId: 'longsword', masteryId: 'sap' }]
    ) as ResolvedCharacter;

    render(<EquipmentStep {...makeEquipmentProps()} />);

    expect(screen.getByText('name')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Buy-with-gold mode tests
// ---------------------------------------------------------------------------

describe('EquipmentStep — buy-with-gold mode', () => {
  beforeEach(() => {
    mockContextValue = {
      bundles: [],
      resolved: makeResolved() as ResolvedCharacter,
      build: { choices: {} },
      makeChoice: mockMakeChoice,
      clearChoice: mockClearChoice,
    };
  });

  it('shows the catalog sections when mode is buy-with-gold', () => {
    render(<EquipmentStep {...makeEquipmentProps({ equipmentMode: 'buy-with-gold' })} />);

    expect(screen.getByText('catalogWeapons')).toBeTruthy();
    expect(screen.getByText('catalogArmor')).toBeTruthy();
    expect(screen.getByText('catalogGear')).toBeTruthy();
    expect(screen.getByText('catalogPacks')).toBeTruthy();
  });

  it('shows starting gold section when mode is buy-with-gold', () => {
    render(<EquipmentStep {...makeEquipmentProps({ equipmentMode: 'buy-with-gold', classId: 'fighter' })} />);

    expect(screen.getByText('startingGoldTitle')).toBeTruthy();
    expect(screen.getByLabelText('goldOverrideLabel')).toBeTruthy();
  });

  it('hides the class loadout section when mode is buy-with-gold', () => {
    render(<EquipmentStep {...makeEquipmentProps({ equipmentMode: 'buy-with-gold' })} />);

    expect(screen.queryByText('classLoadoutTitle')).toBeNull();
  });

  it('surfaces the Weapon Mastery picker in buy-with-gold mode (#241)', () => {
    mockContextValue.bundles = [
      {
        source: FIGHTER_SOURCE,
        grants: [
          {
            type: 'weapon-mastery-choice',
            key: 'weapon-mastery-choice:class:fighter:0' as ChoiceKey,
            count: 1,
          },
        ],
      },
    ];

    render(<EquipmentStep {...makeEquipmentProps({ equipmentMode: 'buy-with-gold' })} />);

    // Weapon Mastery is a class feature, not gear — it must show even when buying with gold.
    expect(screen.getByText('weaponMasteryTitle')).toBeTruthy();
  });

  it('calls onPurchase with the first weapon catalog item id and costGp when Add button is clicked', () => {
    const onPurchase = vi.fn();
    render(
      <EquipmentStep
        {...makeEquipmentProps({
          equipmentMode: 'buy-with-gold',
          onPurchase,
        })}
      />
    );

    // Click the first "Add" button — catalog renders WEAPON_CATALOG first, in array order
    const addButtons = screen.getAllByText('addItem');
    fireEvent.click(addButtons[0]);

    expect(onPurchase).toHaveBeenCalledWith(WEAPON_CATALOG[0].id, WEAPON_CATALOG[0].costGp);
  });

  it('shows purchased items list when purchasedItems is non-empty', () => {
    render(
      <EquipmentStep
        {...makeEquipmentProps({
          equipmentMode: 'buy-with-gold',
          purchasedItems: [{ itemId: 'dagger', quantity: 2, costGp: 2 }],
        })}
      />
    );

    expect(screen.getByText('purchasedItemsTitle')).toBeTruthy();
    // quantity × rendered
    expect(screen.getByText('2×')).toBeTruthy();
  });

  it('calls onRemovePurchase when remove button is clicked', () => {
    const onRemovePurchase = vi.fn();
    render(
      <EquipmentStep
        {...makeEquipmentProps({
          equipmentMode: 'buy-with-gold',
          purchasedItems: [{ itemId: 'dagger', quantity: 1, costGp: 2 }],
          onRemovePurchase,
        })}
      />
    );

    const removeBtn = screen.getByText('remove');
    fireEvent.click(removeBtn);

    expect(onRemovePurchase).toHaveBeenCalledWith('dagger');
  });

  it('shows currency tracker with spent and starting amounts', () => {
    render(
      <EquipmentStep
        {...makeEquipmentProps({
          equipmentMode: 'buy-with-gold',
          startingGoldTotal: 175,
          purchasedItems: [{ itemId: 'longsword', quantity: 1, costGp: 15 }],
        })}
      />
    );

    // The currency tracker label renders via i18n
    expect(screen.getByText('currencyTracker')).toBeTruthy();
    // quantity× renders as a real number — confirms the purchased item row is present
    expect(screen.getByText('1×')).toBeTruthy();
    // spentGp (15) is less than startingGoldTotal (175) — overBudget warning must NOT appear
    expect(screen.queryByText('overBudgetWarning')).toBeNull();
  });

  it('calls onGoldChange with class gold amount when "Use class gold" button is clicked', () => {
    const onGoldChange = vi.fn();
    render(
      <EquipmentStep
        {...makeEquipmentProps({
          equipmentMode: 'buy-with-gold',
          classId: 'fighter',
          onGoldChange,
        })}
      />
    );

    const useClassGoldBtn = screen.getByText('useClassGold');
    fireEvent.click(useClassGoldBtn);

    expect(onGoldChange).toHaveBeenCalledWith(155); // fighter starting gold (2024 PHB)
  });
});
