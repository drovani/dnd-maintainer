import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { LineagePicker } from '@/components/character-builder/LineagePicker';
import type { GrantBundle } from '@/types/sources';
import { createChoiceKey } from '@/types/choices';
import type { ChoiceDecision } from '@/types/choices';

// Segment-returning i18n mock (matches the other character-builder component tests):
// t('a.b.c') -> 'c', unless a defaultValue is provided.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && typeof opts.defaultValue === 'string') return opts.defaultValue;
      const segs = key.split('.');
      return segs[segs.length - 1];
    },
    i18n: { language: 'en' },
  }),
}));

const DRAGONBORN_LINEAGE_KEY = createChoiceKey('lineage-choice', 'species', 'dragonborn', 0);

function dragonbornBundles(): GrantBundle[] {
  return [
    {
      source: { origin: 'species', id: 'dragonborn' },
      grants: [
        {
          type: 'lineage-choice',
          key: DRAGONBORN_LINEAGE_KEY,
          speciesId: 'dragonborn',
          from: [
            'chromatic-black',
            'chromatic-blue',
            'chromatic-green',
            'chromatic-red',
            'chromatic-white',
            'metallic-brass',
            'metallic-bronze',
            'metallic-copper',
            'metallic-gold',
            'metallic-silver',
          ],
        },
      ],
    },
  ];
}

describe('LineagePicker — Dragonborn table (#292)', () => {
  it('renders a table with Dragon / Damage Type / Kind columns', () => {
    render(
      <LineagePicker
        race="dragonborn"
        bundles={dragonbornBundles()}
        build={{ choices: {} }}
        makeChoice={vi.fn()}
        clearChoice={vi.fn()}
      />
    );
    const table = screen.getByRole('table');
    expect(table).toBeTruthy();
    // Column headers (segment-returning mock yields the last key segment).
    expect(within(table).getByText('dragon')).toBeTruthy();
    expect(within(table).getByText('damageType')).toBeTruthy();
    expect(within(table).getByText('kind')).toBeTruthy();
  });

  it('renders one selectable row per lineage (10) with damage type and kind cells', () => {
    render(
      <LineagePicker
        race="dragonborn"
        bundles={dragonbornBundles()}
        build={{ choices: {} }}
        makeChoice={vi.fn()}
        clearChoice={vi.fn()}
      />
    );
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(10);
    // Damage types present (mock returns the damageTypes.<id> segment, e.g. "acid", "poison").
    expect(screen.getAllByText('acid').length).toBeGreaterThan(0); // black + copper
    expect(screen.getByText('poison')).toBeTruthy(); // green
    // Kind labels present.
    expect(screen.getAllByText('chromatic').length).toBe(5);
    expect(screen.getAllByText('metallic').length).toBe(5);
  });

  it('calls makeChoice with the selected lineage when a row radio is clicked', () => {
    const makeChoice = vi.fn();
    render(
      <LineagePicker
        race="dragonborn"
        bundles={dragonbornBundles()}
        build={{ choices: {} }}
        makeChoice={makeChoice}
        clearChoice={vi.fn()}
      />
    );
    const redRadio = document.getElementById(`choice-lineage-${DRAGONBORN_LINEAGE_KEY}-chromatic-red`);
    expect(redRadio).toBeTruthy();
    fireEvent.click(redRadio!);
    expect(makeChoice).toHaveBeenCalledWith(DRAGONBORN_LINEAGE_KEY, {
      type: 'lineage-choice',
      lineageId: 'chromatic-red',
    });
  });

  it('reflects the current selection as checked', () => {
    render(
      <LineagePicker
        race="dragonborn"
        bundles={dragonbornBundles()}
        build={{
          choices: {
            [DRAGONBORN_LINEAGE_KEY]: { type: 'lineage-choice', lineageId: 'metallic-gold' } as ChoiceDecision,
          },
        }}
        makeChoice={vi.fn()}
        clearChoice={vi.fn()}
      />
    );
    const goldRadio = document.getElementById(
      `choice-lineage-${DRAGONBORN_LINEAGE_KEY}-metallic-gold`
    ) as HTMLInputElement | null;
    expect(goldRadio?.checked).toBe(true);
  });

  it('does not render a table for a non-dragonborn species (falls back to radio list)', () => {
    const elfBundles: GrantBundle[] = [
      {
        source: { origin: 'species', id: 'elf' },
        grants: [
          {
            type: 'lineage-choice',
            key: createChoiceKey('lineage-choice', 'species', 'elf', 0),
            speciesId: 'elf',
            from: ['drow', 'high-elf', 'wood-elf'],
          },
        ],
      },
    ];
    render(
      <LineagePicker
        race="elf"
        bundles={elfBundles}
        build={{ choices: {} }}
        makeChoice={vi.fn()}
        clearChoice={vi.fn()}
      />
    );
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });
});
