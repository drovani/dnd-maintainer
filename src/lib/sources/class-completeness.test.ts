import { describe, it, expect } from 'vitest';
import { collectBundles, CLASS_SOURCES } from '@/lib/sources';
import { SUBCLASS_SOURCES } from '@/lib/sources/subclasses';
import { resolveCharacter } from '@/lib/resolver';
import type { BuildLevel } from '@/types/choices';

/**
 * Layer 1 — cross-class completeness invariants that exercise the RESOLVER
 * pipeline (not just the source data). Data-shape invariants that only inspect
 * CLASS_SOURCES live in classes.test.ts; the tests here assert that running a
 * full level-20 build through collectBundles + resolveCharacter actually emits
 * every choice the source declares. See docs/class-completeness-testing.md.
 */

const STANDARD_ABILITIES = {
  str: 15,
  dex: 14,
  con: 13,
  int: 12,
  wis: 10,
  cha: 8,
} as const;

/**
 * Choice grants the resolver does not yet emit as pending choices. Each entry is
 * a known GAP, not an accepted one: removing it should make the choice surface.
 * Populate from this test's own failure message — never add an entry to silence a
 * NEW regression; investigate the resolver instead. (Currently empty: the L20
 * round-trip is clean for all 12 classes.)
 */
const KNOWN_UNRESOLVED_CHOICES: ReadonlySet<string> = new Set<string>([]);

/**
 * Subclasses with empty `features: []`. Failing both directions makes this a
 * one-way ratchet: a newly-empty subclass is a regression, and an allowlisted
 * one becoming populated forces its removal here when implemented.
 *
 * Currently EMPTY: as of this branch all 48 subclasses have populated `features`,
 * so the ratchet purely guards against a future regression. (CLAUDE.md's note
 * about "42 stubs" predates the merged subclass work — verified via this test.)
 */
const KNOWN_STUB_SUBCLASSES: ReadonlySet<string> = new Set<string>([]);

function makeSingleClassBuild(classId: (typeof CLASS_SOURCES)[number]['id']) {
  const levels: BuildLevel[] = Array.from({ length: 20 }, (_, i) => ({
    classId,
    classLevel: i + 1,
    hpRoll: null,
  }));

  return {
    speciesId: 'human' as const,
    backgroundId: 'soldier' as const,
    baseAbilities: STANDARD_ABILITIES,
    abilityMethod: 'standard-array' as const,
    choices: {},
    levels,
    feats: [],
    activeItems: [],
  };
}

/** Choice-bearing grants carry `key: ChoiceKey`; static grants do not. */
function classOriginChoiceKeys(classId: string): Set<string> {
  const source = CLASS_SOURCES.find((c) => c.id === classId);
  const keys = new Set<string>();
  for (const level of source?.levels ?? []) {
    for (const grant of level.grants ?? []) {
      const key = (grant as { key?: unknown }).key;
      // Only class-origin keys (format `<category>:class:<classId>:<index>`).
      if (typeof key === 'string' && key.includes(`:class:${classId}:`)) {
        keys.add(key);
      }
    }
  }
  return keys;
}

describe('class completeness — resolver round-trip', () => {
  it.each(CLASS_SOURCES.map((c) => c.id))(
    '%s: every class-origin choice-bearing grant surfaces as a pending choice at L20',
    (classId) => {
      const build = makeSingleClassBuild(classId);
      const { bundles, expandedFeats } = collectBundles(build);
      const resolved = resolveCharacter({
        baseAbilities: build.baseAbilities,
        level: 20,
        bundles,
        choices: {},
        hpRolls: Array(20).fill(null) as (number | null)[],
        expandedFeats,
      });

      const grantKeys = [...classOriginChoiceKeys(classId)].filter((k) => !KNOWN_UNRESOLVED_CHOICES.has(k));
      const surfaced = new Set<string>(resolved.pendingChoices.map((c) => String(c.choiceKey)));

      // No swallowed choices: every choice the source declares must be emitted.
      const swallowed = grantKeys.filter((k) => !surfaced.has(k));
      expect(swallowed, `${classId} swallowed choices: ${swallowed.join(', ')}`).toEqual([]);
    }
  );
});

describe('class completeness — subclass coverage ratchet', () => {
  it('only allowlisted subclasses have empty features', () => {
    const emptyNow = Object.entries(SUBCLASS_SOURCES)
      .filter(([, s]) => (s.features?.length ?? 0) === 0)
      .map(([id]) => id);

    const unexpectedlyEmpty = emptyNow.filter((id) => !KNOWN_STUB_SUBCLASSES.has(id));
    expect(unexpectedlyEmpty, `newly-empty subclasses (regression): ${unexpectedlyEmpty.join(', ')}`).toEqual([]);

    const nowImplemented = [...KNOWN_STUB_SUBCLASSES].filter((id) => !emptyNow.includes(id));
    expect(nowImplemented, `implemented — remove from KNOWN_STUB_SUBCLASSES: ${nowImplemented.join(', ')}`).toEqual([]);
  });
});
