const base = {
  paths: ['features/**/*.feature'],
  import: [
    './features/steps/support/world.ts',
    './features/steps/support/fixtures.ts',
    './features/steps/common-steps.ts',
    './features/**/steps/**/*.ts',
    './features/steps/**/*.ts',
  ],
  format: ['progress', 'html:cucumber-report.html'],
  worldParameters: {},
};

// Tag taxonomy:
//   @draft  — steps not yet implemented (legacy; being retired during the overhaul)
//   @future — steps ARE implemented but assert behavior the app does not have yet
//             (spec-ahead work orders). Run them with the `future` profile to see the reds:
//               npm run test:bdd:future
// The default run excludes both so it stays green. Once @draft is fully retired
// this simplifies to 'not @future'.
//
// NOTE: cucumber ANDs a profile's `tags` with any CLI `--tags`, so you cannot view
// @future via `--tags @future` against the default profile — use the `future` profile.
export default {
  ...base,
  tags: 'not @future and not @draft',
};

// Profile for running the spec-ahead scenarios (expected to fail with meaningful assertions).
export const future = {
  ...base,
  tags: '@future',
};
