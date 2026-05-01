import { describe, it, expect } from 'vitest';
import { resolveAbilities } from '@/lib/resolver/abilities';
import type { GrantBundle } from '@/types/sources';
import type { ChoiceKey, ChoiceDecision } from '@/types/choices';
import type { AbilityScores } from '@/types/database';

const BASE: AbilityScores = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
const NO_BUNDLES: readonly GrantBundle[] = [];
const NO_CHOICES: Readonly<Record<ChoiceKey, ChoiceDecision>> = {};

describe('resolveAbilities', () => {
  it('returns base values unchanged when no bundles', () => {
    const result = resolveAbilities(BASE, NO_BUNDLES, NO_CHOICES);
    expect(result.str.total).toBe(10);
    expect(result.str.modifier).toBe(0);
    expect(result.str.base).toBe(10);
    expect(result.str.bonuses).toHaveLength(0);
  });

  it.each([
    [8, -1],
    [10, 0],
    [12, 1],
    [13, 1],
    [14, 2],
    [15, 2],
    [20, 5],
  ])('modifier for score %i → %i', (score, expectedMod) => {
    const result = resolveAbilities({ ...BASE, str: score }, NO_BUNDLES, NO_CHOICES);
    expect(result.str.modifier).toBe(expectedMod);
  });

  it('applies ability-bonus grants', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'species', id: 'human' },
        grants: [
          { type: 'ability-bonus', ability: 'str', bonus: 1 },
          { type: 'ability-bonus', ability: 'dex', bonus: 2 },
        ],
      },
    ];
    const result = resolveAbilities(BASE, bundles, NO_CHOICES);
    expect(result.str.total).toBe(11);
    expect(result.dex.total).toBe(12);
    expect(result.con.total).toBe(10);
  });

  it('tracks bonus sources', () => {
    const source = { origin: 'species' as const, id: 'human' as const };
    const bundles: GrantBundle[] = [
      {
        source,
        grants: [{ type: 'ability-bonus', ability: 'str', bonus: 1 }],
      },
    ];
    const result = resolveAbilities(BASE, bundles, NO_CHOICES);
    expect(result.str.bonuses).toHaveLength(1);
    expect(result.str.bonuses[0].value).toBe(1);
    expect(result.str.bonuses[0].source).toEqual(source);
  });

  it('caps ability total at 20', () => {
    const highBase = { ...BASE, str: 19 };
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'species', id: 'human' },
        grants: [{ type: 'ability-bonus', ability: 'str', bonus: 3 }],
      },
    ];
    const result = resolveAbilities(highBase, bundles, NO_CHOICES);
    expect(result.str.total).toBe(20);
    expect(result.str.modifier).toBe(5);
  });

  it('applies ability-choice grants when decision exists', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'species', id: 'human' },
        grants: [
          {
            type: 'ability-choice',
            key: 'ability-choice:species:human:0',
            count: 2,
            bonus: 1,
            from: ['str', 'dex'],
          },
        ],
      },
    ];
    const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = {
      'ability-choice:species:human:0': { type: 'ability-choice', abilities: ['str', 'con'] },
    };
    const result = resolveAbilities(BASE, bundles, choices);
    expect(result.str.total).toBe(11);
    expect(result.con.total).toBe(11);
    expect(result.dex.total).toBe(10);
  });

  it('does not apply ability-choice grants when no decision', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'species', id: 'human' },
        grants: [
          {
            type: 'ability-choice',
            key: 'ability-choice:species:human:0',
            count: 2,
            bonus: 1,
            from: null,
          },
        ],
      },
    ];
    const result = resolveAbilities(BASE, bundles, NO_CHOICES);
    for (const key of ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const) {
      expect(result[key].total).toBe(10);
    }
  });

  it('applies ASI allocation when decision exists', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 4 },
        grants: [
          {
            type: 'asi',
            key: 'asi:class:fighter:0',
            points: 2,
            from: null,
          },
        ],
      },
    ];
    const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = {
      'asi:class:fighter:0': { type: 'asi', allocation: { str: 2 } },
    };
    const result = resolveAbilities(BASE, bundles, choices);
    expect(result.str.total).toBe(12); // 10 + 2
    expect(result.dex.total).toBe(10); // unchanged
  });

  it('caps ability total at 20 for ASI allocation', () => {
    const highBase = { ...BASE, str: 19 };
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 4 },
        grants: [
          {
            type: 'asi',
            key: 'asi:class:fighter:0',
            points: 2,
            from: null,
          },
        ],
      },
    ];
    const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = {
      'asi:class:fighter:0': { type: 'asi', allocation: { str: 2 } },
    };
    const result = resolveAbilities(highBase, bundles, choices);
    expect(result.str.total).toBe(20); // capped at 20
    expect(result.str.modifier).toBe(5);
  });

  it('applies partial ASI allocation when fewer points are spent than granted', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 4 },
        grants: [
          {
            type: 'asi',
            key: 'asi:class:fighter:0',
            points: 3,
            from: null,
          },
        ],
      },
    ];
    const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = {
      'asi:class:fighter:0': { type: 'asi', allocation: { str: 1 } },
    };
    const result = resolveAbilities(BASE, bundles, choices);
    // Under-allocated (1 of 3 points) — allocated point still applies
    expect(result.str.total).toBe(11);
    expect(result.dex.total).toBe(10);
    expect(result.con.total).toBe(10);
    expect(result.int.total).toBe(10);
    expect(result.wis.total).toBe(10);
    expect(result.cha.total).toBe(10);
  });

  it('skips ASI allocation when total exceeds grant points', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 4 },
        grants: [
          {
            type: 'asi',
            key: 'asi:class:fighter:0',
            points: 2,
            from: null,
          },
        ],
      },
    ];
    const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = {
      'asi:class:fighter:0': { type: 'asi', allocation: { str: 2, dex: 1 } },
    };
    const result = resolveAbilities(BASE, bundles, choices);
    // Over-allocated (3 > 2 points) — entire allocation is skipped
    for (const key of ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const) {
      expect(result[key].total).toBe(10);
    }
  });

  it('does not apply ASI when no decision exists', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 4 },
        grants: [
          {
            type: 'asi',
            key: 'asi:class:fighter:0',
            points: 2,
            from: null,
          },
        ],
      },
    ];
    const result = resolveAbilities(BASE, bundles, NO_CHOICES);
    for (const key of ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const) {
      expect(result[key].total).toBe(10);
    }
  });

  it('applies ASI allocation split across two abilities', () => {
    const bundles: GrantBundle[] = [
      {
        source: { origin: 'class', id: 'fighter', level: 4 },
        grants: [
          {
            type: 'asi',
            key: 'asi:class:fighter:0',
            points: 2,
            from: null,
          },
        ],
      },
    ];
    const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = {
      'asi:class:fighter:0': { type: 'asi', allocation: { str: 1, dex: 1 } },
    };
    const result = resolveAbilities(BASE, bundles, choices);
    expect(result.str.total).toBe(11);
    expect(result.dex.total).toBe(11);
    expect(result.con.total).toBe(10);
  });

  describe('ASI from background with from constraint', () => {
    it('+2/+1 split within from pool applies both bonuses', () => {
      const bundles: GrantBundle[] = [
        {
          source: { origin: 'background', id: 'acolyte' },
          grants: [
            {
              type: 'asi',
              key: 'asi:background:acolyte:0',
              points: 3,
              from: ['int', 'wis', 'cha'],
            },
          ],
        },
      ];
      const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = {
        'asi:background:acolyte:0': { type: 'asi', allocation: { int: 2, wis: 1 } },
      };
      const result = resolveAbilities(BASE, bundles, choices);
      expect(result.int.total).toBe(12);
      expect(result.wis.total).toBe(11);
      expect(result.cha.total).toBe(10);
    });

    it('+1/+1/+1 split across all three from abilities applies all bonuses', () => {
      const bundles: GrantBundle[] = [
        {
          source: { origin: 'background', id: 'acolyte' },
          grants: [
            {
              type: 'asi',
              key: 'asi:background:acolyte:0',
              points: 3,
              from: ['int', 'wis', 'cha'],
            },
          ],
        },
      ];
      const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = {
        'asi:background:acolyte:0': { type: 'asi', allocation: { int: 1, wis: 1, cha: 1 } },
      };
      const result = resolveAbilities(BASE, bundles, choices);
      expect(result.int.total).toBe(11);
      expect(result.wis.total).toBe(11);
      expect(result.cha.total).toBe(11);
    });

    it('allocation outside from pool skips entire grant', () => {
      const bundles: GrantBundle[] = [
        {
          source: { origin: 'background', id: 'acolyte' },
          grants: [
            {
              type: 'asi',
              key: 'asi:background:acolyte:0',
              points: 3,
              from: ['int', 'wis', 'cha'],
            },
          ],
        },
      ];
      const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = {
        'asi:background:acolyte:0': { type: 'asi', allocation: { str: 2, wis: 1 } },
      };
      const result = resolveAbilities(BASE, bundles, choices);
      for (const key of ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const) {
        expect(result[key].total).toBe(10);
      }
    });

    it('source attribution reflects background origin', () => {
      const backgroundSource = { origin: 'background' as const, id: 'acolyte' as const };
      const bundles: GrantBundle[] = [
        {
          source: backgroundSource,
          grants: [
            {
              type: 'asi',
              key: 'asi:background:acolyte:0',
              points: 3,
              from: ['int', 'wis', 'cha'],
            },
          ],
        },
      ];
      const choices: Readonly<Record<ChoiceKey, ChoiceDecision>> = {
        'asi:background:acolyte:0': { type: 'asi', allocation: { wis: 2, cha: 1 } },
      };
      const result = resolveAbilities(BASE, bundles, choices);
      expect(result.wis.bonuses).toHaveLength(1);
      expect(result.wis.bonuses[0].source).toEqual(backgroundSource);
      expect(result.wis.bonuses[0].source.origin).toBe('background');
    });
  });
});
