import { Given, Then } from '@cucumber/cucumber';
import { resolveCharacter } from '@/lib/resolver';

Given('the alias loader is registered', function () {
  // no-op: if this file was imported, the alias resolved
});

Then('importing resolveCharacter from @\\/lib\\/resolver returns a function', function () {
  if (typeof resolveCharacter !== 'function') {
    throw new Error(`Expected resolveCharacter to be a function, got ${typeof resolveCharacter}`);
  }
});
