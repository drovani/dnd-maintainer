import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChoicePicker } from '@/components/character-builder/ChoicePicker';
import type { PendingChoice } from '@/types/resolved';
import type { ChoiceKey, ChoiceDecision } from '@/types/choices';
import type { BundleCategory } from '@/types/items';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => {
      const segments = key.split('.');
      return opts?.defaultValue ?? segments[segments.length - 1];
    },
  }),
}));

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const FIGHTER_SOURCE = { origin: 'class' as const, id: 'fighter' as const, level: 1 };

// ---------------------------------------------------------------------------
// ChoicePicker — bundle-choice branch
// ---------------------------------------------------------------------------

const BUNDLE_CHOICE: PendingChoice & { type: 'bundle-choice' } = {
  type: 'bundle-choice',
  choiceKey: 'bundle-choice:class:fighter:0' as ChoiceKey,
  source: FIGHTER_SOURCE,
  category: 'loadout' as BundleCategory,
  bundleIds: ['fighter-chainmail', 'fighter-archer-kit'] as string[],
};

describe('ChoicePicker bundle-choice', () => {
  it('renders a radio group with one input per bundle option', () => {
    render(<ChoicePicker choice={BUNDLE_CHOICE} currentDecision={undefined} onDecide={vi.fn()} onClear={vi.fn()} />);
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
  });

  it('no radio is checked when currentDecision is undefined', () => {
    render(<ChoicePicker choice={BUNDLE_CHOICE} currentDecision={undefined} onDecide={vi.fn()} onClear={vi.fn()} />);
    const radios = screen.getAllByRole('radio') as HTMLInputElement[];
    expect(radios.every((r) => !r.checked)).toBe(true);
  });

  it('clicking option calls onDecide with the bundleId', () => {
    const onDecide = vi.fn();
    render(<ChoicePicker choice={BUNDLE_CHOICE} currentDecision={undefined} onDecide={onDecide} onClear={vi.fn()} />);
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[0]);
    expect(onDecide).toHaveBeenCalledWith(BUNDLE_CHOICE.choiceKey, {
      type: 'bundle-choice',
      bundleId: 'fighter-chainmail',
      slotPicks: {},
    });
  });

  it('selected radio reflects currentDecision.bundleId', () => {
    const currentDecision: ChoiceDecision = {
      type: 'bundle-choice',
      bundleId: 'fighter-archer-kit',
      slotPicks: {},
    };
    render(
      <ChoicePicker choice={BUNDLE_CHOICE} currentDecision={currentDecision} onDecide={vi.fn()} onClear={vi.fn()} />
    );
    const radios = screen.getAllByRole('radio') as HTMLInputElement[];
    expect(radios[0].checked).toBe(false);
    expect(radios[1].checked).toBe(true);
  });

  it('Clear button does NOT appear when no bundle is selected', () => {
    render(<ChoicePicker choice={BUNDLE_CHOICE} currentDecision={undefined} onDecide={vi.fn()} onClear={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /clear/i })).toBeNull();
  });

  it('Clear button appears when a bundleId is selected', () => {
    const currentDecision: ChoiceDecision = {
      type: 'bundle-choice',
      bundleId: 'fighter-chainmail',
      slotPicks: {},
    };
    render(
      <ChoicePicker choice={BUNDLE_CHOICE} currentDecision={currentDecision} onDecide={vi.fn()} onClear={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: /clear/i })).toBeTruthy();
  });

  it('clicking Clear calls onClear with the correct choiceKey', () => {
    const onClear = vi.fn();
    const currentDecision: ChoiceDecision = {
      type: 'bundle-choice',
      bundleId: 'fighter-chainmail',
      slotPicks: {},
    };
    render(
      <ChoicePicker choice={BUNDLE_CHOICE} currentDecision={currentDecision} onDecide={vi.fn()} onClear={onClear} />
    );
    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(onClear).toHaveBeenCalledWith(BUNDLE_CHOICE.choiceKey);
  });

  it('bundle option label uses + separator between items', () => {
    render(<ChoicePicker choice={BUNDLE_CHOICE} currentDecision={undefined} onDecide={vi.fn()} onClear={vi.fn()} />);
    // mock t returns last key segment → 'itemBundleSeparator' for the separator key
    const labels = screen.getAllByRole('radio').map((r) => {
      const label = r.closest('div')?.querySelector('label');
      return label?.textContent ?? '';
    });
    // fighter-archer-kit has multiple items, so + separator appears
    expect(labels.some((l) => l.includes('itemBundleSeparator'))).toBe(true);
  });

  it('pack-type bundleId renders correctly', () => {
    const packChoice: PendingChoice & { type: 'bundle-choice' } = {
      type: 'bundle-choice',
      choiceKey: 'bundle-choice:class:fighter:3' as ChoiceKey,
      source: FIGHTER_SOURCE,
      category: 'pack' as BundleCategory,
      bundleIds: ['dungeoneers-pack', 'explorers-pack'] as string[],
    };
    render(<ChoicePicker choice={packChoice} currentDecision={undefined} onDecide={vi.fn()} onClear={vi.fn()} />);
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
  });

  // -------------------------------------------------------------------------
  // Card rendering for pack category
  // -------------------------------------------------------------------------

  it('pack category renders each option as a card with contents listed', () => {
    const packChoice: PendingChoice & { type: 'bundle-choice' } = {
      type: 'bundle-choice',
      choiceKey: 'bundle-choice:class:fighter:3' as ChoiceKey,
      source: FIGHTER_SOURCE,
      category: 'pack' as BundleCategory,
      bundleIds: ['dungeoneers-pack', 'explorers-pack'] as string[],
    };
    render(<ChoicePicker choice={packChoice} currentDecision={undefined} onDecide={vi.fn()} onClear={vi.fn()} />);
    // Both packs render as cards via their test ids
    expect(screen.getByTestId('bundle-pack-card-dungeoneers-pack')).toBeTruthy();
    expect(screen.getByTestId('bundle-pack-card-explorers-pack')).toBeTruthy();

    // Pack contents render as <ul>/<li> inside the card, including e.g. backpack
    const dungeoneerCard = screen.getByTestId('bundle-pack-card-dungeoneers-pack');
    expect(dungeoneerCard.querySelector('ul')).toBeTruthy();
    // The mocked t() returns the last segment of the key, so 'items.gear.backpack.name' → 'name'.
    // Easier assertion: there are list items inside
    expect(dungeoneerCard.querySelectorAll('li').length).toBeGreaterThan(0);
  });

  it('clicking a pack card calls onDecide with that bundleId and empty slotPicks', () => {
    const packChoice: PendingChoice & { type: 'bundle-choice' } = {
      type: 'bundle-choice',
      choiceKey: 'bundle-choice:class:fighter:3' as ChoiceKey,
      source: FIGHTER_SOURCE,
      category: 'pack' as BundleCategory,
      bundleIds: ['dungeoneers-pack', 'explorers-pack'] as string[],
    };
    const onDecide = vi.fn();
    render(<ChoicePicker choice={packChoice} currentDecision={undefined} onDecide={onDecide} onClear={vi.fn()} />);
    fireEvent.click(screen.getByTestId('bundle-pack-card-explorers-pack'));
    expect(onDecide).toHaveBeenCalledWith(packChoice.choiceKey, {
      type: 'bundle-choice',
      bundleId: 'explorers-pack',
      slotPicks: {},
    });
  });

  // -------------------------------------------------------------------------
  // Slotted bundle rendering
  // -------------------------------------------------------------------------

  const SLOTTED_CHOICE: PendingChoice & { type: 'bundle-choice' } = {
    type: 'bundle-choice',
    choiceKey: 'bundle-choice:class:fighter:1' as ChoiceKey,
    source: FIGHTER_SOURCE,
    category: 'melee-weapon' as BundleCategory,
    bundleIds: ['martial-weapon-and-shield', 'two-martial-weapons'] as string[],
  };

  it('selecting a bundle calls onDecide with empty slotPicks', () => {
    const onDecide = vi.fn();
    render(<ChoicePicker choice={SLOTTED_CHOICE} currentDecision={undefined} onDecide={onDecide} onClear={vi.fn()} />);
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[0]);
    expect(onDecide).toHaveBeenCalledWith(SLOTTED_CHOICE.choiceKey, {
      type: 'bundle-choice',
      bundleId: 'martial-weapon-and-shield',
      slotPicks: {},
    });
  });

  it('does not render the fixed-contents panel for slotted bundles with no fixed contents', () => {
    // Both martial-weapon-and-shield and two-martial-weapons now have empty .contents,
    // so the "Also includes" panel should never render for either.
    const decision: ChoiceDecision = {
      type: 'bundle-choice',
      bundleId: 'martial-weapon-and-shield',
      slotPicks: {},
    };
    render(<ChoicePicker choice={SLOTTED_CHOICE} currentDecision={decision} onDecide={vi.fn()} onClear={vi.fn()} />);
    expect(screen.queryByTestId('bundle-fixed-contents-martial-weapon-and-shield')).toBeNull();
  });

  it('slot pickers only appear when the slotted bundle is selected', () => {
    const { container, rerender } = render(
      <ChoicePicker choice={SLOTTED_CHOICE} currentDecision={undefined} onDecide={vi.fn()} onClear={vi.fn()} />
    );
    // No bundle selected → no slot prompts visible
    expect(container.querySelectorAll('[data-slot="select-trigger"]').length).toBe(0);

    // Select "a martial weapon and a shield" — 2 slots (weapon + shield) should appear
    const decision: ChoiceDecision = {
      type: 'bundle-choice',
      bundleId: 'martial-weapon-and-shield',
      slotPicks: {},
    };
    rerender(<ChoicePicker choice={SLOTTED_CHOICE} currentDecision={decision} onDecide={vi.fn()} onClear={vi.fn()} />);
    expect(container.querySelectorAll('[data-slot="select-trigger"]').length).toBe(2);

    // Switch to the "two martial weapons" bundle — 2 slot pickers
    const twoWeaponDecision: ChoiceDecision = {
      type: 'bundle-choice',
      bundleId: 'two-martial-weapons',
      slotPicks: {},
    };
    rerender(
      <ChoicePicker choice={SLOTTED_CHOICE} currentDecision={twoWeaponDecision} onDecide={vi.fn()} onClear={vi.fn()} />
    );
    expect(container.querySelectorAll('[data-slot="select-trigger"]').length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// ChoicePicker — feat-choice branch
// ---------------------------------------------------------------------------

const HUMAN_SPECIES_SOURCE = { origin: 'species' as const, id: 'human' as const };

const FEAT_CHOICE: PendingChoice & { type: 'feat-choice' } = {
  type: 'feat-choice',
  choiceKey: 'feat-choice:species:human:0' as ChoiceKey,
  source: HUMAN_SPECIES_SOURCE,
  from: ['alert', 'lucky', 'skilled'] as unknown as readonly import('@/lib/dnd-helpers').FeatId[],
  category: 'origin',
};

describe('ChoicePicker feat-choice', () => {
  it('renders one radio per feat option', () => {
    render(<ChoicePicker choice={FEAT_CHOICE} currentDecision={undefined} onDecide={vi.fn()} onClear={vi.fn()} />);
    const radios = screen.getAllByRole('radio') as HTMLInputElement[];
    expect(radios).toHaveLength(3);
  });

  it('no radio is checked when currentDecision is undefined', () => {
    render(<ChoicePicker choice={FEAT_CHOICE} currentDecision={undefined} onDecide={vi.fn()} onClear={vi.fn()} />);
    const radios = screen.getAllByRole('radio') as HTMLInputElement[];
    expect(radios.every((r) => !r.checked)).toBe(true);
  });

  it('clicking a feat radio calls onDecide with {type: feat-choice, featId}', () => {
    const onDecide = vi.fn();
    render(<ChoicePicker choice={FEAT_CHOICE} currentDecision={undefined} onDecide={onDecide} onClear={vi.fn()} />);
    const radios = screen.getAllByRole('radio') as HTMLInputElement[];
    fireEvent.click(radios[0]);
    expect(onDecide).toHaveBeenCalledWith(FEAT_CHOICE.choiceKey, {
      type: 'feat-choice',
      featId: 'alert',
    });
  });

  it('selected radio reflects currentDecision.featId', () => {
    const currentDecision: ChoiceDecision = {
      type: 'feat-choice',
      featId: 'lucky' as import('@/lib/dnd-helpers').FeatId,
    };
    render(
      <ChoicePicker choice={FEAT_CHOICE} currentDecision={currentDecision} onDecide={vi.fn()} onClear={vi.fn()} />
    );
    const radios = screen.getAllByRole('radio') as HTMLInputElement[];
    expect(radios[0].checked).toBe(false); // alert
    expect(radios[1].checked).toBe(true); // lucky
    expect(radios[2].checked).toBe(false); // skilled
  });

  it('Clear button does NOT appear when no feat is selected', () => {
    render(<ChoicePicker choice={FEAT_CHOICE} currentDecision={undefined} onDecide={vi.fn()} onClear={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /clear/i })).toBeNull();
  });

  it('Clear button appears when a feat is selected', () => {
    const currentDecision: ChoiceDecision = {
      type: 'feat-choice',
      featId: 'alert' as import('@/lib/dnd-helpers').FeatId,
    };
    render(
      <ChoicePicker choice={FEAT_CHOICE} currentDecision={currentDecision} onDecide={vi.fn()} onClear={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: /clear/i })).toBeTruthy();
  });

  it('clicking Clear calls onClear with the correct choiceKey', () => {
    const onClear = vi.fn();
    const currentDecision: ChoiceDecision = {
      type: 'feat-choice',
      featId: 'alert' as import('@/lib/dnd-helpers').FeatId,
    };
    render(
      <ChoicePicker choice={FEAT_CHOICE} currentDecision={currentDecision} onDecide={vi.fn()} onClear={onClear} />
    );
    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(onClear).toHaveBeenCalledWith(FEAT_CHOICE.choiceKey);
  });

  it('disables a feat already granted elsewhere (unavailableFeats) and flags it', () => {
    const unavailable = new Set(['lucky'] as unknown as import('@/lib/dnd-helpers').FeatId[]);
    render(
      <ChoicePicker
        choice={FEAT_CHOICE}
        currentDecision={undefined}
        onDecide={vi.fn()}
        onClear={vi.fn()}
        unavailableFeats={unavailable}
      />
    );
    const radios = screen.getAllByRole('radio') as HTMLInputElement[];
    expect(radios[0].disabled).toBe(false); // alert
    expect(radios[1].disabled).toBe(true); // lucky — granted elsewhere
    expect(radios[2].disabled).toBe(false); // skilled
    expect(screen.getByText('alreadyGranted')).toBeInTheDocument();
  });

  it('does NOT disable the feat that is the current selection even if in unavailableFeats', () => {
    const unavailable = new Set(['lucky'] as unknown as import('@/lib/dnd-helpers').FeatId[]);
    const currentDecision: ChoiceDecision = {
      type: 'feat-choice',
      featId: 'lucky' as import('@/lib/dnd-helpers').FeatId,
    };
    render(
      <ChoicePicker
        choice={FEAT_CHOICE}
        currentDecision={currentDecision}
        onDecide={vi.fn()}
        onClear={vi.fn()}
        unavailableFeats={unavailable}
      />
    );
    const radios = screen.getAllByRole('radio') as HTMLInputElement[];
    expect(radios[1].checked).toBe(true);
    expect(radios[1].disabled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ChoicePicker — feature-choice branch
// ---------------------------------------------------------------------------

const CLERIC_SOURCE = { origin: 'class' as const, id: 'cleric' as const, level: 1 };

const FEATURE_CHOICE: PendingChoice & { type: 'feature-choice' } = {
  type: 'feature-choice',
  choiceKey: 'feature-choice:class:cleric:0' as ChoiceKey,
  source: CLERIC_SOURCE,
  options: [
    { optionId: 'protector', featureId: 'cleric-divine-order-protector' },
    { optionId: 'thaumaturge', featureId: 'cleric-divine-order-thaumaturge' },
  ],
};

describe('ChoicePicker feature-choice', () => {
  it('renders one radio per option', () => {
    render(<ChoicePicker choice={FEATURE_CHOICE} currentDecision={undefined} onDecide={vi.fn()} onClear={vi.fn()} />);
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
  });

  it('no radio is checked when currentDecision is undefined', () => {
    render(<ChoicePicker choice={FEATURE_CHOICE} currentDecision={undefined} onDecide={vi.fn()} onClear={vi.fn()} />);
    const radios = screen.getAllByRole('radio') as HTMLInputElement[];
    expect(radios.every((r) => !r.checked)).toBe(true);
  });

  it('clicking an option calls onDecide with the optionId', () => {
    const onDecide = vi.fn();
    render(<ChoicePicker choice={FEATURE_CHOICE} currentDecision={undefined} onDecide={onDecide} onClear={vi.fn()} />);
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[0]);
    expect(onDecide).toHaveBeenCalledWith(FEATURE_CHOICE.choiceKey, {
      type: 'feature-choice',
      optionId: 'protector',
    });
  });

  it('selected radio reflects currentDecision.optionId', () => {
    const currentDecision: ChoiceDecision = { type: 'feature-choice', optionId: 'thaumaturge' };
    render(
      <ChoicePicker choice={FEATURE_CHOICE} currentDecision={currentDecision} onDecide={vi.fn()} onClear={vi.fn()} />
    );
    const radios = screen.getAllByRole('radio') as HTMLInputElement[];
    expect(radios[0].checked).toBe(false);
    expect(radios[1].checked).toBe(true);
  });

  it('Clear button appears only when an option is selected', () => {
    const { rerender } = render(
      <ChoicePicker choice={FEATURE_CHOICE} currentDecision={undefined} onDecide={vi.fn()} onClear={vi.fn()} />
    );
    expect(screen.queryByRole('button', { name: /clear/i })).toBeNull();

    const currentDecision: ChoiceDecision = { type: 'feature-choice', optionId: 'protector' };
    rerender(
      <ChoicePicker choice={FEATURE_CHOICE} currentDecision={currentDecision} onDecide={vi.fn()} onClear={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: /clear/i })).toBeTruthy();
  });

  it('clicking Clear calls onClear with the correct choiceKey', () => {
    const onClear = vi.fn();
    const currentDecision: ChoiceDecision = { type: 'feature-choice', optionId: 'protector' };
    render(
      <ChoicePicker choice={FEATURE_CHOICE} currentDecision={currentDecision} onDecide={vi.fn()} onClear={onClear} />
    );
    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(onClear).toHaveBeenCalledWith(FEATURE_CHOICE.choiceKey);
  });
});

// ---------------------------------------------------------------------------
// ChoicePicker — spell-choice branch
// ---------------------------------------------------------------------------

const DRUID_SOURCE = { origin: 'class' as const, id: 'druid' as const, level: 1 };

const DRUID_CANTRIP_CHOICE: PendingChoice & { type: 'spell-choice' } = {
  type: 'spell-choice',
  choiceKey: 'spell-choice:class:druid:0' as ChoiceKey,
  source: DRUID_SOURCE,
  count: 2,
  spellList: 'druid',
  spellLevel: 0,
};

describe('ChoicePicker spell-choice', () => {
  it('renders one checkbox per druid cantrip (10 total)', () => {
    render(
      <ChoicePicker choice={DRUID_CANTRIP_CHOICE} currentDecision={undefined} onDecide={vi.fn()} onClear={vi.fn()} />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(10);
  });

  it('no checkbox is checked when currentDecision is undefined', () => {
    render(
      <ChoicePicker choice={DRUID_CANTRIP_CHOICE} currentDecision={undefined} onDecide={vi.fn()} onClear={vi.fn()} />
    );
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    expect(checkboxes.every((cb) => !cb.checked)).toBe(true);
  });

  it('checking a cantrip calls onDecide with { type: spell-choice, spellIds: [id] }', () => {
    const onDecide = vi.fn();
    render(
      <ChoicePicker choice={DRUID_CANTRIP_CHOICE} currentDecision={undefined} onDecide={onDecide} onClear={vi.fn()} />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    // Click the first checkbox (druidcraft)
    fireEvent.click(checkboxes[0]);
    expect(onDecide).toHaveBeenCalledWith(
      DRUID_CANTRIP_CHOICE.choiceKey,
      expect.objectContaining({ type: 'spell-choice', spellIds: expect.arrayContaining(['druidcraft']) })
    );
  });

  it('unchecking a selected cantrip calls onClear when the result would be empty', () => {
    const onClear = vi.fn();
    const currentDecision: ChoiceDecision = {
      type: 'spell-choice',
      spellIds: ['druidcraft'] as readonly import('@/types/spells').SpellId[],
    };
    render(
      <ChoicePicker
        choice={DRUID_CANTRIP_CHOICE}
        currentDecision={currentDecision}
        onDecide={vi.fn()}
        onClear={onClear}
      />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    // druidcraft is first in SPELL_CATALOG; uncheck it
    fireEvent.click(checkboxes[0]);
    expect(onClear).toHaveBeenCalledWith(DRUID_CANTRIP_CHOICE.choiceKey);
  });

  it('at-max (2 selected): unchecked checkboxes have aria-disabled=true', () => {
    const currentDecision: ChoiceDecision = {
      type: 'spell-choice',
      spellIds: ['druidcraft', 'thorn-whip'] as readonly import('@/types/spells').SpellId[],
    };
    render(
      <ChoicePicker
        choice={DRUID_CANTRIP_CHOICE}
        currentDecision={currentDecision}
        onDecide={vi.fn()}
        onClear={vi.fn()}
      />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    const unselectedDisabled = checkboxes.filter(
      (cb) => cb.getAttribute('aria-checked') !== 'true' && cb.getAttribute('aria-disabled') === 'true'
    );
    expect(unselectedDisabled.length).toBeGreaterThan(0);
  });

  it('selected checkboxes remain enabled even at max', () => {
    const currentDecision: ChoiceDecision = {
      type: 'spell-choice',
      spellIds: ['druidcraft', 'thorn-whip'] as readonly import('@/types/spells').SpellId[],
    };
    render(
      <ChoicePicker
        choice={DRUID_CANTRIP_CHOICE}
        currentDecision={currentDecision}
        onDecide={vi.fn()}
        onClear={vi.fn()}
      />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    const selectedEnabled = checkboxes.filter(
      (cb) => cb.getAttribute('aria-checked') === 'true' && cb.getAttribute('aria-disabled') !== 'true'
    );
    expect(selectedEnabled).toHaveLength(2);
  });

  it('Clear button does NOT appear when no cantrips are selected', () => {
    render(
      <ChoicePicker choice={DRUID_CANTRIP_CHOICE} currentDecision={undefined} onDecide={vi.fn()} onClear={vi.fn()} />
    );
    expect(screen.queryByRole('button', { name: /clear/i })).toBeNull();
  });

  it('Clear button appears when cantrips are selected', () => {
    const currentDecision: ChoiceDecision = {
      type: 'spell-choice',
      spellIds: ['guidance'] as readonly import('@/types/spells').SpellId[],
    };
    render(
      <ChoicePicker
        choice={DRUID_CANTRIP_CHOICE}
        currentDecision={currentDecision}
        onDecide={vi.fn()}
        onClear={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /clear/i })).toBeTruthy();
  });

  it('clicking Clear calls onClear with the correct choiceKey', () => {
    const onClear = vi.fn();
    const currentDecision: ChoiceDecision = {
      type: 'spell-choice',
      spellIds: ['guidance'] as readonly import('@/types/spells').SpellId[],
    };
    render(
      <ChoicePicker
        choice={DRUID_CANTRIP_CHOICE}
        currentDecision={currentDecision}
        onDecide={vi.fn()}
        onClear={onClear}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(onClear).toHaveBeenCalledWith(DRUID_CANTRIP_CHOICE.choiceKey);
  });

  it('appends a second cantrip to an existing selection', () => {
    const onDecide = vi.fn();
    const currentDecision: ChoiceDecision = {
      type: 'spell-choice',
      spellIds: ['guidance'] as readonly import('@/types/spells').SpellId[],
    };
    render(
      <ChoicePicker
        choice={DRUID_CANTRIP_CHOICE}
        currentDecision={currentDecision}
        onDecide={onDecide}
        onClear={vi.fn()}
      />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    // druidcraft is index 0 in SPELL_CATALOG; guidance is index 1 (already selected)
    // clicking druidcraft (index 0) should append — result: ['guidance', 'druidcraft']
    fireEvent.click(checkboxes[0]);
    expect(onDecide).toHaveBeenCalledWith(DRUID_CANTRIP_CHOICE.choiceKey, {
      type: 'spell-choice',
      spellIds: ['guidance', 'druidcraft'],
    });
  });

  it('shows count badge with selected / total', () => {
    const currentDecision: ChoiceDecision = {
      type: 'spell-choice',
      spellIds: ['druidcraft'] as readonly import('@/types/spells').SpellId[],
    };
    render(
      <ChoicePicker
        choice={DRUID_CANTRIP_CHOICE}
        currentDecision={currentDecision}
        onDecide={vi.fn()}
        onClear={vi.fn()}
      />
    );
    expect(screen.getByText('1 / 2')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// ChoicePicker — feat-choice with allowedFeats (disabled-book no-data-loss)
// ---------------------------------------------------------------------------

import { FEAT_SOURCES } from '@/lib/sources';
import type { FeatSource } from '@/lib/sources';

// Fixture: no `from` so allowedFeats controls the pool via category filtering.
const ORIGIN_FEAT_CHOICE: PendingChoice & { type: 'feat-choice' } = {
  type: 'feat-choice',
  choiceKey: 'feat-choice:species:human:1' as ChoiceKey,
  source: { origin: 'species' as const, id: 'human' as const },
  from: null,
  category: 'origin',
};

// allowedFeats includes 'lucky' and 'skilled' but NOT 'alert'
const ALLOWED_FEATS_WITHOUT_ALERT: readonly FeatSource[] = FEAT_SOURCES.filter(
  (f) => f.id === 'lucky' || f.id === 'skilled'
);

describe('ChoicePicker feat-choice — allowedFeats (disabled-book no-data-loss)', () => {
  it('renders only allowed feats when no current selection', () => {
    render(
      <ChoicePicker
        choice={ORIGIN_FEAT_CHOICE}
        currentDecision={undefined}
        onDecide={vi.fn()}
        onClear={vi.fn()}
        allowedFeats={ALLOWED_FEATS_WITHOUT_ALERT}
      />
    );
    const radios = screen.getAllByRole('radio') as HTMLInputElement[];
    // Only lucky and skilled are in allowedFeats; alert is absent
    expect(radios).toHaveLength(2);
  });

  it('unions in the current feat even when its book is disabled (feat absent from allowedFeats)', () => {
    // alert is NOT in ALLOWED_FEATS_WITHOUT_ALERT but is the current selection
    const currentDecision: ChoiceDecision = {
      type: 'feat-choice',
      featId: 'alert' as import('@/lib/dnd-helpers').FeatId,
    };
    render(
      <ChoicePicker
        choice={ORIGIN_FEAT_CHOICE}
        currentDecision={currentDecision}
        onDecide={vi.fn()}
        onClear={vi.fn()}
        allowedFeats={ALLOWED_FEATS_WITHOUT_ALERT}
      />
    );
    // All three radios: lucky, skilled, alert (unioned in)
    const radios = screen.getAllByRole('radio') as HTMLInputElement[];
    expect(radios).toHaveLength(3);
    // alert radio is checked
    const alertRadio = radios.find((r) => r.id.includes('alert'));
    expect(alertRadio?.checked).toBe(true);
  });

  it('shows disabled-book badge for the unioned-in feat', () => {
    const currentDecision: ChoiceDecision = {
      type: 'feat-choice',
      featId: 'alert' as import('@/lib/dnd-helpers').FeatId,
    };
    render(
      <ChoicePicker
        choice={ORIGIN_FEAT_CHOICE}
        currentDecision={currentDecision}
        onDecide={vi.fn()}
        onClear={vi.fn()}
        allowedFeats={ALLOWED_FEATS_WITHOUT_ALERT}
      />
    );
    // The mock returns the last key segment: 'disabledSourceBook'
    expect(screen.getByText('disabledSourceBook')).toBeTruthy();
  });

  it('does NOT show disabled-book badge when the current feat is in allowedFeats', () => {
    const currentDecision: ChoiceDecision = {
      type: 'feat-choice',
      featId: 'lucky' as import('@/lib/dnd-helpers').FeatId,
    };
    render(
      <ChoicePicker
        choice={ORIGIN_FEAT_CHOICE}
        currentDecision={currentDecision}
        onDecide={vi.fn()}
        onClear={vi.fn()}
        allowedFeats={ALLOWED_FEATS_WITHOUT_ALERT}
      />
    );
    expect(screen.queryByText('disabledSourceBook')).toBeNull();
  });
});
