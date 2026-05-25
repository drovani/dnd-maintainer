import { describe, it, expect } from 'vitest';
import {
  STANDARD_ARRAY,
  assignStandardArray,
  generateRandomNpcBasics,
  generateRandomNpcBasicsDetailed,
  getQuickNpcClassIds,
  pickRandomLineage,
  randomAsiAllocation,
} from '@/lib/character-builder/random-npc';
import { LINEAGE_GRANTS_REGISTRY } from '@/lib/sources/species';
import { BACKGROUND_SOURCES } from '@/lib/sources/backgrounds';
import { CLASS_SOURCES } from '@/lib/sources/classes';
import { SPECIES_SOURCES } from '@/lib/sources/species';
import { DND_ALIGNMENTS } from '@/lib/dnd-helpers';
import { createChoiceKey } from '@/types/choices';
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

describe('randomAsiAllocation', () => {
  it('distributes 3 points giving min(2,remaining) per ability in shuffled order with rng=0', () => {
    // shuffle(['str','dex','con'], rng=0):
    //   i=2: j=floor(0*3)=0 → ['con','dex','str']
    //   i=1: j=floor(0*2)=0 → ['dex','con','str']
    // Distribute 3: dex gets 2, con gets 1, str gets 0 → { dex: 2, con: 1 }
    const result = randomAsiAllocation(3, ['str', 'dex', 'con'], () => 0);
    expect(result).toEqual({ dex: 2, con: 1 });
  });

  it('allocation values sum to exactly points', () => {
    for (const rng of [() => 0, () => 0.5, () => 0.999]) {
      const result = randomAsiAllocation(3, ['str', 'dex', 'con'], rng);
      const sum = Object.values(result).reduce((a, b) => a + b, 0);
      expect(sum).toBe(3);
    }
  });

  it('all allocated ability keys are from the provided pool', () => {
    const from = ['int', 'wis', 'cha'] as const;
    const result = randomAsiAllocation(3, from, () => 0.5);
    for (const key of Object.keys(result)) {
      expect(from).toContain(key);
    }
  });

  it('each ability receives at most 2 points', () => {
    const result = randomAsiAllocation(3, ['str', 'dex', 'con'], () => 0);
    for (const val of Object.values(result)) {
      expect(val).toBeLessThanOrEqual(2);
    }
  });
});

describe('pickRandomLineage', () => {
  it('returns a valid lineage decision for every species with a lineage map', () => {
    for (const speciesId of Object.keys(LINEAGE_GRANTS_REGISTRY) as Array<keyof typeof LINEAGE_GRANTS_REGISTRY>) {
      const result = pickRandomLineage(speciesId, () => 0);
      expect(result).not.toBeNull();
      if (!result) continue;
      expect(result.key).toBe(`lineage-choice:species:${speciesId}:0`);
      expect(Object.keys(LINEAGE_GRANTS_REGISTRY[speciesId])).toContain(result.lineageId);
    }
  });

  it('returns null for a species without a lineage map', () => {
    expect(pickRandomLineage('human', () => 0)).toBeNull();
    expect(pickRandomLineage('dwarf', () => 0)).toBeNull();
    expect(pickRandomLineage('halfling', () => 0)).toBeNull();
    expect(pickRandomLineage('orc', () => 0)).toBeNull();
    expect(pickRandomLineage('aasimar', () => 0)).toBeNull();
  });

  it('picks different lineages for different rng values within the same species', () => {
    const first = pickRandomLineage('dragonborn', () => 0)?.lineageId;
    const last = pickRandomLineage('dragonborn', () => 0.999)?.lineageId;
    expect(first).toBeDefined();
    expect(last).toBeDefined();
    expect(first).not.toBe(last);
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
    // species: pick(eligibleSpecies, rng=0) → index 0 → human (first in SPECIES_SOURCES with name data)
    expect(result.species).toBe(SPECIES_SOURCES[0].id);
    // alignment: pick(DND_ALIGNMENTS, rng=0) → index 0
    expect(result.alignment).toBe(DND_ALIGNMENTS[0].id);
    // backgroundAsiDecision: soldier from=['str','dex','con'], shuffle with rng=0 → ['dex','con','str'] → { dex: 2, con: 1 }
    expect(result.backgroundAsiDecision).toBeDefined();
    expect(result.backgroundAsiDecision?.key).toBe(createChoiceKey('asi', 'background', 'soldier', 0));
    expect(result.backgroundAsiDecision?.allocation).toEqual({ dex: 2, con: 1 });
  });

  it('with rng=()=>0.65 picks dex=15 (last element of ["str","dex"]) via gnome', () => {
    // rng=()=>0.65: gender=female (idx 1), species=gnome (eligible idx 4 of 7, has names),
    // alignment=cn (idx 5), name picks from gnome data, highestAbility=dex (idx 1 of 2)
    const result = generateRandomNpcBasics('fighter', () => 0.65);
    expect(result).not.toBeNull();
    if (!result || result.targetStep !== 'skills') return;
    expect(result.baseAbilities.dex).toBe(15);
  });

  it('with rng=()=>0.3 returns a valid result within expected pools via dwarf', () => {
    // rng=()=>0.3: gender=male (idx 0), species=dwarf (eligible idx 2 of 7, has names),
    // alignment=cg (idx 2), highestAbility=str (idx 0 of 2)
    // Eligible species excludes aasimar/goliath/orc (no name data), leaving 7 choices.
    const result = generateRandomNpcBasics('fighter', () => 0.3);
    expect(result).not.toBeNull();
    if (!result) return;
    expect(['male', 'female']).toContain(result.gender);
    expect(SPECIES_SOURCES.map((r) => r.id)).toContain(result.species);
    expect(DND_ALIGNMENTS.map((a) => a.id)).toContain(result.alignment);
    expect(result.name).toContain(' ');
    // baseAbilities values should be a permutation of STANDARD_ARRAY
    if (result.targetStep !== 'skills') return;
    const values = Object.values(result.baseAbilities).sort((a, b) => b - a);
    expect(values).toEqual([...STANDARD_ARRAY]);
  });

  it('targetStep is skills and baseAbilities/suggestedBackground/backgroundAsiDecision are present for fighter', () => {
    const fighterResult = generateRandomNpcBasics('fighter', () => 0);
    expect(fighterResult?.targetStep).toBe('skills');
    if (!fighterResult || fighterResult.targetStep !== 'skills') return;
    expect(fighterResult.baseAbilities).toBeDefined();
    expect(fighterResult.suggestedBackground).toBeDefined();
    // Every BACKGROUND_SOURCES entry has a non-null from pool, so backgroundAsiDecision is always set
    expect(fighterResult.backgroundAsiDecision).toBeDefined();
    const bgSource = BACKGROUND_SOURCES.find((b) => b.id === fighterResult.suggestedBackground);
    const asiGrant = bgSource?.grants.find((g) => g.type === 'asi');
    expect(fighterResult.backgroundAsiDecision?.key).toBe(asiGrant?.key);
    // Allocation total must be ≤ 3 and all keys must be in the background's from pool
    const total = Object.values(fighterResult.backgroundAsiDecision?.allocation ?? {}).reduce((a, b) => a + b, 0);
    expect(total).toBeLessThanOrEqual(3);
    if (asiGrant && asiGrant.from) {
      for (const key of Object.keys(fighterResult.backgroundAsiDecision?.allocation ?? {})) {
        expect(asiGrant.from).toContain(key);
      }
    }
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

  it('returns ok=true for rng=()=>0.95 now that stub species are filtered out', () => {
    // With eligible-species filtering, aasimar/goliath/orc (no name data) are excluded.
    // rng=()=>0.95: eligible[floor(0.95*7)=6] → tiefling, which has name data → success.
    const result = generateRandomNpcBasicsDetailed('fighter', () => 0.95);
    expect(result.ok).toBe(true);
  });

  it('includes a lineageDecision when the picked species has a lineage map', () => {
    // rng=()=>0.95: gender=female, species=tiefling (has lineage), alignment=ce, ...
    // tiefling has lineage keys [abyssal, chthonic, infernal]; rng=0.95 picks index 2 → infernal
    const result = generateRandomNpcBasicsDetailed('fighter', () => 0.95);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.basics.species).toBe('tiefling');
    expect(result.basics.lineageDecision).toBeDefined();
    expect(result.basics.lineageDecision?.key).toBe('lineage-choice:species:tiefling:0');
    expect(Object.keys(LINEAGE_GRANTS_REGISTRY.tiefling)).toContain(result.basics.lineageDecision?.lineageId);
  });

  it('omits lineageDecision when the picked species has no lineage map', () => {
    // rng=()=>0: gender=male, species=human (no lineage), alignment=lg, ...
    const result = generateRandomNpcBasicsDetailed('fighter', () => 0);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.basics.species).toBe('human');
    expect(result.basics.lineageDecision).toBeUndefined();
  });
});
