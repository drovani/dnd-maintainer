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
});
