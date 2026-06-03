import { describe, it, expect } from 'vitest';
import type { GrantBundle } from '@/types/sources';
import type { ResolvedAbility } from '@/types/resolved';
import type { AbilityKey } from '@/lib/dnd-helpers';
import { resolveFeatures } from '@/lib/resolver/features';

function abilityMap(modifiers: Partial<Record<AbilityKey, number>>): Readonly<Record<AbilityKey, ResolvedAbility>> {
  const make = (mod: number): ResolvedAbility => ({
    base: 10 + mod * 2,
    bonuses: [],
    total: 10 + mod * 2,
    modifier: mod,
  });
  return {
    str: make(modifiers.str ?? 0),
    dex: make(modifiers.dex ?? 0),
    con: make(modifiers.con ?? 0),
    int: make(modifiers.int ?? 0),
    wis: make(modifiers.wis ?? 0),
    cha: make(modifiers.cha ?? 0),
  };
}

describe('resolveFeatures saveDC', () => {
  const monkLevel5: GrantBundle[] = [
    {
      source: { origin: 'subclass', id: 'warriorofelements', classId: 'monk', level: 6 },
      grants: [
        {
          type: 'feature',
          feature: { id: 'warriorofelements-elemental-burst', saveDC: { dcAbility: 'wis' } },
        },
      ],
    },
  ];

  it('computes saveDC as 8 + PB + ability modifier when feature declares saveDC', () => {
    const features = resolveFeatures(monkLevel5, abilityMap({ wis: 4 }), 3);
    expect(features[0].saveDC).toBe(8 + 3 + 4);
  });

  it('uses the declared dcAbility (cha) — not a hard-coded wis lookup', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'subclass', id: 'warriorofmercy', classId: 'monk', level: 6 },
        grants: [
          {
            type: 'feature',
            feature: { id: 'some-cha-feature', saveDC: { dcAbility: 'cha' } },
          },
        ],
      },
    ];
    // CHA mod = +3, PB = 2 → DC = 8 + 2 + 3 = 13
    const features = resolveFeatures(bundles, abilityMap({ cha: 3 }), 2);
    expect(features[0].saveDC).toBe(13);
  });

  it('computes saveDC correctly with a negative ability modifier', () => {
    // WIS mod = -1, PB = 2 → DC = 8 + 2 + (-1) = 9
    const features = resolveFeatures(monkLevel5, abilityMap({ wis: -1 }), 2);
    expect(features[0].saveDC).toBe(9);
  });

  it('omits saveDC for features that do not declare one', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'monk', level: 1 },
        grants: [{ type: 'feature', feature: { id: 'monk-martial-arts' } }],
      },
    ];
    const features = resolveFeatures(bundles, abilityMap({ wis: 4 }), 3);
    expect(features[0].saveDC).toBeUndefined();
  });

  it('psiwarrior Telekinetic Adept: Fighter 7 with INT 18 resolves saveDC to 15 (8 + PB 3 + INT mod 4)', () => {
    // INT 18 → modifier +4; Fighter 7 → PB 3; DC = 8 + 3 + 4 = 15
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'subclass', id: 'psiwarrior', classId: 'fighter', level: 7 },
        grants: [
          {
            type: 'feature',
            feature: { id: 'psiwarrior-telekinetic-adept', saveDC: { dcAbility: 'int' } },
          },
        ],
      },
    ];
    const features = resolveFeatures(bundles, abilityMap({ int: 4 }), 3);
    expect(features[0].saveDC).toBe(15);
  });
});
