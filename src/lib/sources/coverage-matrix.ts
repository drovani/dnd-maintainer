/**
 * Implementation-coverage matrix for the 2024 PHB source data.
 *
 * This module answers the stakeholder question "are we rules-as-written complete?"
 * by enumerating EVERY canonical class, subclass, species, and background and
 * classifying each against book-derived *structural* expectations.
 *
 * What each status means — and, crucially, what it does NOT mean:
 *
 *   - `missing`   : the entry is a canonical 2024 option but has no source entry.
 *   - `stub`      : a source entry exists but grants nothing meaningful.
 *   - `partial`   : present and partly shaped, but missing expected structure
 *                   (e.g. a subclass lacking its level-14 feature).
 *   - `complete`  : present and structurally correct per the expectations below.
 *
 * `complete` means "present and correctly SHAPED" — it does NOT mean "matches the
 * Player's Handbook". Proving the latter requires expected values transcribed from
 * the book *independently of this implementation* (see GOLDEN_VERIFIED). A green
 * structural matrix with no golden entries proves nothing is empty; it does not
 * prove anything is correct. Keep that distinction honest when reporting upward.
 */
import { CLASS_SOURCES, SPECIES_SOURCES, BACKGROUND_SOURCES, SUBCLASS_SOURCES } from '@/lib/sources';
import { SUBCLASS_IDS_BY_CLASS } from '@/lib/sources/subclasses';
import { DND_CLASSES, DND_SPECIES, DND_BACKGROUNDS } from '@/lib/dnd-helpers';

export type EntryStatus = 'missing' | 'stub' | 'partial' | 'complete';

export interface CoverageEntry {
  readonly id: string;
  readonly status: EntryStatus;
  /** Human-readable reason for a non-complete status, or what was verified. */
  readonly detail: string;
  /** True only when expected values were transcribed from the PHB independently. */
  readonly goldenVerified: boolean;
}

export interface ForkCoverage {
  readonly fork: 'classes' | 'subclasses' | 'species' | 'backgrounds';
  readonly entries: readonly CoverageEntry[];
  readonly counts: Readonly<Record<EntryStatus, number>>;
  readonly total: number;
  readonly goldenVerifiedCount: number;
}

export interface CoverageMatrix {
  readonly classes: ForkCoverage;
  readonly subclasses: ForkCoverage;
  readonly species: ForkCoverage;
  readonly backgrounds: ForkCoverage;
}

/**
 * 2024 PHB subclass feature levels, per class.
 *
 * Subclass feature levels are NOT uniform in the 2024 PHB — they follow each
 * class's table (e.g. Fighter at 3/7/10/15/18, Rogue at 3/9/13/17, Cleric at
 * 3/6/17). These values are transcribed from the 2024 class tables independently
 * of the source data; they are corroborated by the fact that every milestone
 * currently present in `SUBCLASS_SOURCES` falls within its class's set here (zero
 * contradictions across all 48 subclasses). Verify against the PHB before relying
 * on a `complete` verdict for a class whose subclasses are not yet implemented.
 */
export const SUBCLASS_MILESTONES_BY_CLASS: Readonly<Record<string, readonly number[]>> = {
  barbarian: [3, 6, 10, 14],
  bard: [3, 6, 14],
  cleric: [3, 6, 17],
  druid: [3, 6, 10, 14],
  fighter: [3, 7, 10, 15, 18],
  monk: [3, 6, 11, 17],
  paladin: [3, 7, 15, 20],
  ranger: [3, 7, 11, 15],
  rogue: [3, 9, 13, 17],
  sorcerer: [3, 6, 14, 18],
  warlock: [3, 6, 10, 14],
  wizard: [3, 6, 10, 14],
} as const;

/**
 * 2024 PHB Ability Score Improvement levels common to every class. Level 19 is
 * NOT here: in the 2024 rules every class gains an Epic Boon at level 19 instead
 * of a regular ASI ({@link EPIC_BOON_LEVEL}), so that slot is checked separately
 * and requires a `feat-choice` grant with `category: 'epicBoon'` — there is no
 * ASI alternative.
 */
export const EXPECTED_ASI_LEVELS: readonly number[] = [4, 8, 12, 16] as const;

/** 2024 PHB level at which every class gains an Epic Boon feat-choice in place of an ASI. */
export const EPIC_BOON_LEVEL = 19 as const;

/**
 * Golden-verified registry — the ONLY source of "matches the PHB" confidence.
 *
 * Add an id here only after its expected grants have been transcribed from the
 * 2024 Player's Handbook *independently of this implementation* and asserted in a
 * test. This is intentionally empty: structural completeness above is not RAW
 * verification, and seeding it from the current source data would prove only that
 * the data equals itself. Populate it per-entry as RAW authoring happens — that
 * is the real path to stakeholder acceptance.
 */
export const GOLDEN_VERIFIED: ReadonlySet<string> = new Set<string>();

function countStatuses(entries: readonly CoverageEntry[]): Readonly<Record<EntryStatus, number>> {
  const counts: Record<EntryStatus, number> = { missing: 0, stub: 0, partial: 0, complete: 0 };
  for (const e of entries) counts[e.status] += 1;
  return counts;
}

function toForkCoverage(fork: ForkCoverage['fork'], entries: readonly CoverageEntry[]): ForkCoverage {
  return {
    fork,
    entries,
    counts: countStatuses(entries),
    total: entries.length,
    goldenVerifiedCount: entries.filter((e) => e.goldenVerified).length,
  };
}

function missingLevels(have: readonly number[], expected: readonly number[]): number[] {
  const set = new Set(have);
  return expected.filter((lv) => !set.has(lv));
}

export function computeClassCoverage(): ForkCoverage {
  const sourceById = new Map(CLASS_SOURCES.map((c) => [c.id, c]));
  const entries: CoverageEntry[] = DND_CLASSES.map((c) => {
    const src = sourceById.get(c.id);
    if (!src) {
      return { id: c.id, status: 'missing', detail: 'no ClassSource entry', goldenVerified: false };
    }
    const problems: string[] = [];
    if (src.levels.length !== 20) problems.push(`has ${src.levels.length}/20 levels`);
    if (src.levels[0]?.grants.length === 0) problems.push('level 1 grants nothing');
    const hasSubclassAt3 = src.levels[2]?.grants.some((g) => g.type === 'subclass');
    if (!hasSubclassAt3) problems.push('no subclass choice at level 3');
    const asiLevels = src.levels
      .map((lv, i) => (lv.grants.some((g) => g.type === 'asi') ? i + 1 : null))
      .filter((n): n is number => n !== null);
    const missingAsi = missingLevels(asiLevels, EXPECTED_ASI_LEVELS);
    if (missingAsi.length > 0) problems.push(`missing ASI at level(s) ${missingAsi.join(', ')}`);

    // Level 19 is the Epic Boon slot in 2024: every class must carry a solo
    // feat-choice grant with category 'epicBoon' there — there is no ASI alternative.
    const hasL19EpicBoon = (src.levels[EPIC_BOON_LEVEL - 1]?.grants ?? []).some(
      (g) => g.type === 'feat-choice' && g.category === 'epicBoon'
    );
    if (!hasL19EpicBoon) problems.push(`missing Epic Boon feat-choice at level ${EPIC_BOON_LEVEL}`);

    const status: EntryStatus = problems.length === 0 ? 'complete' : 'partial';
    return {
      id: c.id,
      status,
      detail: problems.length === 0 ? '20 levels, subclass@3, ASI@4/8/12/16, Epic Boon@19' : problems.join('; '),
      goldenVerified: GOLDEN_VERIFIED.has(c.id),
    };
  });
  return toForkCoverage('classes', entries);
}

export function computeSubclassCoverage(): ForkCoverage {
  const registry = SUBCLASS_SOURCES as Record<string, { features: readonly { classLevel: number }[] }>;
  const entries: CoverageEntry[] = [];
  for (const [classId, subclassIds] of Object.entries(SUBCLASS_IDS_BY_CLASS)) {
    const expected = SUBCLASS_MILESTONES_BY_CLASS[classId] ?? [];
    for (const id of subclassIds) {
      const src = registry[id];
      if (!src) {
        entries.push({ id, status: 'missing', detail: 'no SubclassSource entry', goldenVerified: false });
        continue;
      }
      if (src.features.length === 0) {
        entries.push({ id, status: 'stub', detail: 'features: []', goldenVerified: false });
        continue;
      }
      const have = [...new Set(src.features.map((f) => f.classLevel))].sort((a, b) => a - b);
      const missing = missingLevels(have, expected);
      const status: EntryStatus = missing.length === 0 ? 'complete' : 'partial';
      entries.push({
        id,
        status,
        detail:
          missing.length === 0
            ? `features at levels ${expected.join('/')}`
            : `has ${have.join('/')}; missing ${missing.join('/')} (${classId} expects ${expected.join('/')})`,
        goldenVerified: GOLDEN_VERIFIED.has(id),
      });
    }
  }
  return toForkCoverage('subclasses', entries);
}

export function computeSpeciesCoverage(): ForkCoverage {
  const sourceById = new Map(SPECIES_SOURCES.map((s) => [s.id, s]));
  const entries: CoverageEntry[] = DND_SPECIES.map((s) => {
    const src = sourceById.get(s.id);
    if (!src) return { id: s.id, status: 'missing', detail: 'no SpeciesSource entry', goldenVerified: false };
    const grants = src.grants;
    if (grants.length === 0) return { id: s.id, status: 'stub', detail: 'grants: []', goldenVerified: false };

    const problems: string[] = [];
    if (!grants.some((g) => g.type === 'speed')) problems.push('no speed grant');
    // Traits live either directly on the species or behind its lineage choice
    // (e.g. Dragonborn's traits come with its draconic ancestry).
    const hasTraits = grants.some((g) => g.type === 'feature');
    const hasLineage = grants.some((g) => g.type === 'lineage-choice');
    if (!hasTraits && !hasLineage) problems.push('no racial traits or lineage choice');
    const status: EntryStatus = problems.length === 0 ? 'complete' : 'partial';
    return {
      id: s.id,
      status,
      detail:
        problems.length === 0 ? (hasLineage ? 'speed + lineage choice' : 'speed + racial traits') : problems.join('; '),
      goldenVerified: GOLDEN_VERIFIED.has(s.id),
    };
  });
  return toForkCoverage('species', entries);
}

export function computeBackgroundCoverage(): ForkCoverage {
  const sourceById = new Map(BACKGROUND_SOURCES.map((b) => [b.id, b]));
  const entries: CoverageEntry[] = DND_BACKGROUNDS.map((b) => {
    const src = sourceById.get(b.id);
    if (!src) return { id: b.id, status: 'missing', detail: 'no BackgroundSource entry', goldenVerified: false };
    const grants = src.grants;
    if (grants.length === 0) return { id: b.id, status: 'stub', detail: 'grants: []', goldenVerified: false };

    // 2024 background formula: 2 skill proficiencies, +3 ability points, an origin
    // feat, and a tool proficiency (fixed or a choice).
    // Some backgrounds (acolyte, guide, sage) grant Magic Initiate directly as a feature
    // rather than as a feat grant — both forms satisfy the origin-feat requirement.
    const skillCount = grants.filter((g) => g.type === 'proficiency' && g.category === 'skill').length;
    const asiPoints = grants.reduce((n, g) => (g.type === 'asi' ? n + g.points : n), 0);
    const hasFeat =
      grants.some((g) => g.type === 'feat') ||
      grants.some((g) => g.type === 'feature' && g.feature.id.startsWith('feat-magic-initiate-'));
    const hasTool = grants.some(
      (g) => (g.type === 'proficiency' || g.type === 'proficiency-choice') && g.category === 'tool'
    );
    const problems: string[] = [];
    if (skillCount < 2) problems.push(`${skillCount}/2 skill proficiencies`);
    if (asiPoints !== 3) problems.push(`${asiPoints}/3 ability points`);
    if (!hasFeat) problems.push('no origin feat');
    if (!hasTool) problems.push('no tool proficiency');

    const status: EntryStatus = problems.length === 0 ? 'complete' : 'partial';
    return {
      id: b.id,
      status,
      detail: problems.length === 0 ? '2 skills + 3 ability points + feat + tool' : problems.join('; '),
      goldenVerified: GOLDEN_VERIFIED.has(b.id),
    };
  });
  return toForkCoverage('backgrounds', entries);
}

export function computeCoverageMatrix(): CoverageMatrix {
  return {
    classes: computeClassCoverage(),
    subclasses: computeSubclassCoverage(),
    species: computeSpeciesCoverage(),
    backgrounds: computeBackgroundCoverage(),
  };
}

function renderForkTable(fork: ForkCoverage): string {
  const { counts, total, goldenVerifiedCount } = fork;
  const pct = total === 0 ? 0 : Math.round((counts.complete / total) * 100);
  const lines: string[] = [];
  lines.push(`### ${fork.fork} — ${counts.complete}/${total} structurally complete (${pct}%)`);
  lines.push('');
  lines.push(
    `missing: ${counts.missing} · stub: ${counts.stub} · partial: ${counts.partial} · complete: ${counts.complete} · golden-verified: ${goldenVerifiedCount}/${total}`
  );
  lines.push('');
  lines.push('| id | status | detail | golden |');
  lines.push('| --- | --- | --- | --- |');
  for (const e of fork.entries) {
    lines.push(`| ${e.id} | ${e.status} | ${e.detail} | ${e.goldenVerified ? '✅' : '—'} |`);
  }
  lines.push('');
  return lines.join('\n');
}

export function renderCoverageMarkdown(matrix: CoverageMatrix): string {
  const forks = [matrix.classes, matrix.subclasses, matrix.species, matrix.backgrounds];
  const grandTotal = forks.reduce((n, f) => n + f.total, 0);
  const grandComplete = forks.reduce((n, f) => n + f.counts.complete, 0);
  const grandGolden = forks.reduce((n, f) => n + f.goldenVerifiedCount, 0);

  const header: string[] = [];
  header.push('# 2024 PHB Implementation Coverage Matrix');
  header.push('');
  header.push('<!-- Generated by `npm run coverage:matrix`. Do not edit by hand. -->');
  header.push('');
  header.push(
    `**Structurally complete: ${grandComplete}/${grandTotal}. Golden-verified (matches the PHB): ${grandGolden}/${grandTotal}.**`
  );
  header.push('');
  header.push(
    '> `complete` means *present and correctly shaped*, not *matches the book*. Only `golden`-marked' +
      ' entries have been checked against the 2024 PHB independently of the implementation. See' +
      ' `coverage-matrix.ts` for what each status verifies.'
  );
  header.push('');
  header.push('| fork | complete | partial | stub | missing | golden |');
  header.push('| --- | --- | --- | --- | --- | --- |');
  for (const f of forks) {
    header.push(
      `| ${f.fork} | ${f.counts.complete}/${f.total} | ${f.counts.partial} | ${f.counts.stub} | ${f.counts.missing} | ${f.goldenVerifiedCount} |`
    );
  }
  header.push('');

  return [header.join('\n'), ...forks.map(renderForkTable)].join('\n') + '\n';
}
