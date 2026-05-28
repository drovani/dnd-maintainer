Feature: Alias resolution smoke test
  Scenario: @/ alias resolves to src directory
    Given the alias loader is registered
    Then importing resolveCharacter from @/lib/resolver returns a function
