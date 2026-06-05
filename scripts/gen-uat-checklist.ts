/**
 * Generate a manual user-acceptance-testing (UAT) checklist from the Gherkin
 * BDD specs under `features/`.
 *
 * Cucumber.js has no built-in "checklist" or "spreadsheet" exporter — its
 * formatters all describe *automated* runs. This script parses every
 * `.feature` file with the Gherkin AST parser (already a Cucumber dependency)
 * and emits one row per scenario so a human tester can tick each one off by
 * hand.
 *
 * The key signal it surfaces is each scenario's **status**, derived from the
 * project's tag taxonomy (see `docs/bdd.md` / `cucumber.js`):
 *
 *   - `ready`  — untagged; the app is expected to support this today, so a UAT
 *                tester SHOULD be able to validate it now.
 *   - `future` — `@future`; spec-ahead work order, not built yet. Listed so the
 *                checklist is complete, but a tester should expect it to fail
 *                (or skip it).
 *   - `draft`  — `@draft`; legacy "no steps yet", being retired.
 *
 * Tags inherit downward: a `@future` on a Feature or Rule applies to every
 * scenario beneath it, exactly as Cucumber's tag filtering treats them.
 *
 * Usage:
 *   npm run uat:checklist            # CSV  -> docs/uat-checklist.csv
 *   npm run uat:checklist -- --format md     # Markdown -> docs/uat-checklist.md
 *   npm run uat:checklist -- --format both   # both files
 *
 * The CSV opens directly in Excel / Google Sheets (Result + Notes columns left
 * blank for the tester). The Markdown form prints cleanly with `[ ]` checkboxes.
 */
import { readFileSync, writeFileSync, globSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AstBuilder, GherkinClassicTokenMatcher, Parser } from '@cucumber/gherkin';
import { IdGenerator, type GherkinDocument, type Scenario, type Step } from '@cucumber/messages';

type Status = 'ready' | 'future' | 'draft';

interface ChecklistRow {
  readonly file: string;
  readonly feature: string;
  readonly rule: string;
  readonly scenario: string;
  readonly status: Status;
  readonly tags: readonly string[];
  readonly steps: readonly string[];
}

const REPO_ROOT: string = fileURLToPath(new URL('..', import.meta.url));
const FEATURES_DIR: string = join(REPO_ROOT, 'features');
const DOCS_DIR: string = join(REPO_ROOT, 'docs');

function statusFromTags(tags: readonly string[]): Status {
  if (tags.includes('@future')) return 'future';
  if (tags.includes('@draft')) return 'draft';
  return 'ready';
}

function parseFeature(source: string): GherkinDocument {
  const builder = new AstBuilder(IdGenerator.uuid());
  const matcher = new GherkinClassicTokenMatcher();
  const parser = new Parser(builder, matcher);
  return parser.parse(source);
}

function stepText(step: Step): string {
  return `${step.keyword}${step.text}`.trim();
}

/**
 * Expand a Scenario Outline into one row per Examples table row, substituting
 * `<placeholder>` tokens in the name and steps. A plain Scenario yields a single
 * row with its steps verbatim.
 *
 * `backgroundSteps` are the Feature- (and Rule-) level Background steps that
 * Cucumber runs before every scenario; they are prepended so each checklist row
 * is self-contained setup-wise for a manual tester.
 */
function expandScenario(
  scenario: Scenario,
  inheritedTags: readonly string[],
  backgroundSteps: readonly string[],
  context: { file: string; feature: string; rule: string }
): ChecklistRow[] {
  const ownTags: string[] = scenario.tags.map((t) => t.name);
  const tags: string[] = [...inheritedTags, ...ownTags];
  const baseSteps: string[] = [...backgroundSteps, ...scenario.steps.map(stepText)];

  if (scenario.examples.length === 0) {
    return [
      {
        ...context,
        scenario: scenario.name,
        status: statusFromTags(tags),
        tags,
        steps: baseSteps,
      },
    ];
  }

  const rows: ChecklistRow[] = [];
  for (const example of scenario.examples) {
    const headers: string[] = (example.tableHeader?.cells ?? []).map((c) => c.value);
    const exampleTags: string[] = [...tags, ...example.tags.map((t) => t.name)];
    for (const bodyRow of example.tableBody) {
      const values: string[] = bodyRow.cells.map((c) => c.value);
      const substitute = (text: string): string =>
        headers.reduce((acc, header, i) => acc.split(`<${header}>`).join(values[i] ?? ''), text);
      rows.push({
        ...context,
        scenario: substitute(scenario.name),
        status: statusFromTags(exampleTags),
        tags: exampleTags,
        steps: baseSteps.map(substitute),
      });
    }
  }
  return rows;
}

function collectRows(): ChecklistRow[] {
  const files: string[] = globSync('**/*.feature', { cwd: FEATURES_DIR }).sort();
  const rows: ChecklistRow[] = [];

  for (const rel of files) {
    const abs: string = join(FEATURES_DIR, rel);
    const fileLabel: string = relative(REPO_ROOT, abs);
    const doc: GherkinDocument = parseFeature(readFileSync(abs, 'utf8'));
    const feature = doc.feature;
    if (!feature) continue;

    const featureTags: string[] = feature.tags.map((t) => t.name);
    // A Feature-level Background runs before every scenario in the file, including
    // those nested under Rules.
    const featureBackground: string[] =
      feature.children.find((c) => c.background)?.background?.steps.map(stepText) ?? [];

    for (const child of feature.children) {
      if (child.scenario) {
        rows.push(
          ...expandScenario(child.scenario, featureTags, featureBackground, {
            file: fileLabel,
            feature: feature.name,
            rule: '',
          })
        );
      }
      if (child.rule) {
        const ruleTags: string[] = [...featureTags, ...child.rule.tags.map((t) => t.name)];
        // A Rule-level Background runs after the Feature Background, before each
        // scenario in that Rule.
        const ruleBackground: string[] = [
          ...featureBackground,
          ...(child.rule.children.find((c) => c.background)?.background?.steps.map(stepText) ?? []),
        ];
        for (const ruleChild of child.rule.children) {
          if (!ruleChild.scenario) continue;
          rows.push(
            ...expandScenario(ruleChild.scenario, ruleTags, ruleBackground, {
              file: fileLabel,
              feature: feature.name,
              rule: child.rule.name,
            })
          );
        }
      }
    }
  }
  return rows;
}

// Short labels for headers; STATUS_LABEL is the descriptive form for the CSV
// Status column (which has no legend alongside it).
const STATUS_HEADING: Readonly<Record<Status, string>> = {
  ready: 'Ready',
  future: 'Future',
  draft: 'Draft',
};

const STATUS_LABEL: Readonly<Record<Status, string>> = {
  ready: 'Ready',
  future: 'Future (not built yet)',
  draft: 'Draft',
};

// Tester-facing priority: validate what works today first, then spec-ahead, then stubs.
const STATUS_ORDER: readonly Status[] = ['ready', 'future', 'draft'];

/**
 * Order rows by status (Ready → Future → Draft). The sort is stable, so the
 * file/feature ordering from collectRows() is preserved within each status.
 */
function sortByStatus(rows: readonly ChecklistRow[]): ChecklistRow[] {
  return [...rows].sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));
}

function csvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function toCsv(rows: readonly ChecklistRow[]): string {
  const header: string[] = [
    'File',
    'Feature',
    'Rule',
    'Scenario',
    'Status',
    'Tags',
    'Steps',
    'Result (Pass/Fail/Blocked)',
    'Notes',
  ];
  const lines: string[] = [header.map(csvField).join(',')];
  for (const row of rows) {
    lines.push(
      [
        row.file,
        row.feature,
        row.rule,
        row.scenario,
        STATUS_LABEL[row.status],
        row.tags.join(' '),
        row.steps.join('\n'),
        '',
        '',
      ]
        .map(csvField)
        .join(',')
    );
  }
  return `${lines.join('\n')}\n`;
}

function toMarkdown(rows: readonly ChecklistRow[]): string {
  const total: number = rows.length;
  const ready: number = rows.filter((r) => r.status === 'ready').length;
  const future: number = rows.filter((r) => r.status === 'future').length;
  const draft: number = rows.filter((r) => r.status === 'draft').length;

  const COUNT: Readonly<Record<Status, number>> = { ready, future, draft };

  const out: string[] = [
    '# UAT Checklist',
    '',
    '> Generated from the Gherkin specs under `features/` by `npm run uat:checklist`.',
    '> Do not edit by hand — re-run the script to refresh.',
    '',
    `**${total} scenarios** — ${ready} ready · ${future} future (not built yet) · ${draft} draft`,
    '',
    'Status legend: **Ready** = expected to work today, validate it · ' +
      '**Future** = spec-ahead, expect it to fail/skip · **Draft** = no steps yet.',
  ];

  // Outermost grouping is status (Ready → Future → Draft); within each, group by
  // file, then feature, then rule. Rows are pre-sorted by status, so a single
  // pass keeps every status's scenarios contiguous.
  let currentStatus: Status | '' = '';
  let currentFile = '';
  let currentFeature = '';
  let currentRule = '';
  for (const row of rows) {
    if (row.status !== currentStatus) {
      currentStatus = row.status;
      currentFile = '';
      currentFeature = '';
      currentRule = '';
      out.push('', `## ${STATUS_HEADING[row.status]} (${COUNT[row.status]})`);
    }
    if (row.file !== currentFile) {
      currentFile = row.file;
      currentFeature = '';
      currentRule = '';
      out.push('', `### \`${row.file}\``, '');
    }
    if (row.feature !== currentFeature) {
      currentFeature = row.feature;
      currentRule = '';
      out.push(`#### ${row.feature}`, '');
    }
    if (row.rule && row.rule !== currentRule) {
      currentRule = row.rule;
      out.push(`##### Rule: ${row.rule}`, '');
    }
    out.push(`- [ ] **${row.scenario}**`);
    for (const step of row.steps) {
      out.push(`  - ${step}`);
    }
  }
  out.push('');
  return out.join('\n');
}

function main(): void {
  const args: string[] = process.argv.slice(2);
  const formatIndex: number = args.indexOf('--format');
  const format: string = formatIndex >= 0 ? (args[formatIndex + 1] ?? 'csv') : 'csv';
  if (!['csv', 'md', 'both'].includes(format)) {
    console.error(`Unknown --format "${format}". Use csv | md | both.`);
    process.exit(1);
  }

  const rows: ChecklistRow[] = sortByStatus(collectRows());
  const written: string[] = [];

  if (format === 'csv' || format === 'both') {
    const path: string = join(DOCS_DIR, 'uat-checklist.csv');
    writeFileSync(path, toCsv(rows));
    written.push(relative(REPO_ROOT, path));
  }
  if (format === 'md' || format === 'both') {
    const path: string = join(DOCS_DIR, 'uat-checklist.md');
    writeFileSync(path, toMarkdown(rows));
    written.push(relative(REPO_ROOT, path));
  }

  const ready: number = rows.filter((r) => r.status === 'ready').length;
  const future: number = rows.filter((r) => r.status === 'future').length;
  const draft: number = rows.filter((r) => r.status === 'draft').length;
  console.log(
    `Wrote ${written.join(', ')} — ${rows.length} scenarios ` + `(${ready} ready, ${future} future, ${draft} draft).`
  );
}

main();
