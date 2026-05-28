export default {
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
