Feature: Level down a character
  As a Dungeon Master,
  I want to remove a character's most recent level,
  So that I can correct a mistaken level-up or adjust for a campaign retcon.

  Scenario: Reverting a Fighter from level 4 to level 3 removes the ASI choice
    # Resolver seam: dropping the most recent BuildLevel and re-resolving mirrors
    # what useCharacterContext.levelDown() does (it soft-deletes the highest-sequence
    # level row, which the resolver then excludes).
    Given a Fighter at level 4 with no background chosen
    Then the character has a pending ability score increase
    When the most recent level is removed
    Then the character is level 3
    And the character has no pending ability score increase
    And their proficiency bonus is 2

  Scenario: A first-level character cannot be leveled down
    # The app expresses "no level to remove" by HIDING the Level Down control at
    # level 1 (LevelControls renders it only when level > 1), so the assertion
    # checks the action is unavailable rather than that a disabled button exists.
    Given a level 1 Fighter is shown on the character sheet
    Then the Level Down action is unavailable

  Scenario: A higher-level character offers the Level Down control
    Given a level 3 Fighter is shown on the character sheet
    Then the Level Down action is available
