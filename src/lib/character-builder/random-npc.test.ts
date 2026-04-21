import { describe, it, expect } from 'vitest';
import {
  STANDARD_ARRAY,
  assignStandardArray,
  generateRandomNpcBasics,
  generateRandomNpcBasicsDetailed,
  getQuickNpcClassIds,
} from '@/lib/character-builder/random-npc';
import { CLASS_SOURCES } from '@/lib/sources/classes';
import { RACE_SOURCES } from '@/lib/sources/races';
import { DND_ALIGNMENTS } from '@/lib/dnd-helpers';
import type { ClassSource } from '@/types/sources';

describe('getQuickNpcClassIds', () => {
  it('returns the same ids as CLASS_SOURCES in order (catches drift)', () => {
    expect(getQuickNpcClassIds()).toEqual(CLASS_SOURCES.map((c) => c.id));
  });
});

describe('assignStandardArray', () => {
  it('assigns 15 to highest, 14 to secondary, and shuffled remainder with rng=0', () => {
    // rng=()=>0: Fisher-Yates with j=floor(0*(i+1))=0 each pass on [13,12,10,8]:
    //   i=3: swap[3]↔[0] → [8,12,10,13]
    //   i=2: swap[2]↔[0] → [10,12,8,13]
    //   i=1: swap[1]↔[0] → [12,10,8,13]
    // Remaining keys after filtering str,con: [dex,int,wis,cha] → [12,10,8,13]
    const result = assignStandardArray('str', 'con', () => 0);
    expect(result.str).toBe(15);
    expect(result.con).toBe(14);
    expect(result.dex).toBe(12);
    expect(result.int).toBe(10);
    expect(result.wis).toBe(8);
    expect(result.cha).toBe(13);
  });

  it('remaining four abilities are always a permutation of [13,12,10,8]', () => {
    for (const rng of [() => 0, () => 0.25, () => 0.5, () => 0.999]) {
      const result = assignStandardArray('str', 'con', rng);
      const remainder = [result.dex, result.int, result.wis, result.cha].sort((a, b) => b - a);
      expect(remainder).toEqual([13, 12, 10, 8]);
    }
  });

  it('throws when highest equals secondary (fail-fast invariant)', () => {
    expect(() => assignStandardArray('str', 'str', () => 0)).toThrow(/must differ/);
  });

  it('always returns all six keys populated with values from STANDARD_ARRAY', () => {
    const result = assignStandardArray('int', 'wis', () => 0.5);
    const values = Object.values(result).sort((a: number, b: number) => b - a);
    expect(values).toEqual([...STANDARD_ARRAY]);
  });

  it('always places 15 on the highest and 14 on the secondary regardless of rng', () => {
    for (const rng of [() => 0, () => 0.5, () => 0.999]) {
      const result = assignStandardArray('dex', 'wis', rng);
      expect(result.dex).toBe(15);
      expect(result.wis).toBe(14);
    }
  });
});

describe('generateRandomNpcBasics', () => {
  it('returns null for an unknown classId', () => {
    // Cast to bypass TypeScript so we can test the guard
    const result = generateRandomNpcBasics('unknown' as Parameters<typeof generateRandomNpcBasics>[0], () => 0);
    expect(result).toBeNull();
  });

  it('with rng=()=>0 returns fighter basics with targetStep=skills and str=15, con=14', () => {
    const result = generateRandomNpcBasics('fighter', () => 0);
    expect(result).not.toBeNull();
    if (!result || result.targetStep !== 'skills') return;
    // highestAbility is ['str','dex']; rng=0 picks index 0 → str
    expect(result.baseAbilities.str).toBe(15);
    expect(result.baseAbilities.con).toBe(14);
    expect(result.suggestedBackground).toBe('soldier');
    // gender: pick(['male','female'], rng=0) → index 0 → 'male'
    expect(result.gender).toBe('male');
    // race: pick(RACE_SOURCES, rng=0) → index 0
    expect(result.race).toBe(RACE_SOURCES[0].id);
    // alignment: pick(DND_ALIGNMENTS, rng=0) → index 0
    expect(result.alignment).toBe(DND_ALIGNMENTS[0].id);
  });

  it('with rng=()=>0.999 picks dex=15 (last element of ["str","dex"])', () => {
    const result = generateRandomNpcBasics('fighter', () => 0.999);
    expect(result).not.toBeNull();
    if (!result || result.targetStep !== 'skills') return;
    expect(result.baseAbilities.dex).toBe(15);
  });

  it('with default Math.random returns a valid result within expected pools', () => {
    const result = generateRandomNpcBasics('fighter');
    expect(result).not.toBeNull();
    if (!result) return;
    expect(['male', 'female']).toContain(result.gender);
    expect(RACE_SOURCES.map((r) => r.id)).toContain(result.race);
    expect(DND_ALIGNMENTS.map((a) => a.id)).toContain(result.alignment);
    expect(result.name).toContain(' ');
    // baseAbilities values should be a permutation of STANDARD_ARRAY
    if (result.targetStep !== 'skills') return;
    const values = Object.values(result.baseAbilities).sort((a, b) => b - a);
    expect(values).toEqual([...STANDARD_ARRAY]);
  });

  it('targetStep is skills and baseAbilities/suggestedBackground are present for fighter', () => {
    const fighterResult = generateRandomNpcBasics('fighter', () => 0);
    expect(fighterResult?.targetStep).toBe('skills');
    if (!fighterResult || fighterResult.targetStep !== 'skills') return;
    expect(fighterResult.baseAbilities).toBeDefined();
    expect(fighterResult.suggestedBackground).toBeDefined();
  });

  it('returns targetStep=abilities for a class without quickBuild data', () => {
    // Inject a stub class-source array instead of mutating the real one —
    // keeps production data pristine and makes the fixture obvious.
    const stubSources: readonly ClassSource[] = [{ id: 'barbarian', primaryAbility: 'str', levels: [{ grants: [] }] }];
    const result = generateRandomNpcBasics('barbarian', () => 0, stubSources);
    expect(result).not.toBeNull();
    expect(result?.targetStep).toBe('abilities');
    if (!result || result.targetStep !== 'abilities') return;
    expect(result.classId).toBe('barbarian');
    expect(result.name).toBeTruthy();
  });
});

describe('generateRandomNpcBasicsDetailed', () => {
  it('reports failure="unknown-class" for an unknown classId', () => {
    const result = generateRandomNpcBasicsDetailed(
      'unknown' as Parameters<typeof generateRandomNpcBasicsDetailed>[0],
      () => 0
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failure).toBe('unknown-class');
  });

  it('returns ok=true with targetStep=skills on fighter success', () => {
    const result = generateRandomNpcBasicsDetailed('fighter', () => 0);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.basics.targetStep).toBe('skills');
  });
});
