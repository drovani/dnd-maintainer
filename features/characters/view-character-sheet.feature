Feature: View character sheet
  As a player,
  I want to view my character sheet,
  So that I can reference my character's stats, features, and equipment during a session.

  # Render-app seam: the real CharacterSheet page renders inside the real
  # CharacterProvider, which reconstructs the build from seeded
  # character_build_levels rows and resolves it via resolveCharacter(). Assertions
  # read the rendered sheet (proficiency bonus, sections, pending panel, equipment).

  Scenario: The sheet shows the resolved core statistics
    Given a level 5 Fighter character sheet
    Then the sheet shows a proficiency bonus of 3
    And the sheet shows the Saving Throws section
    And the sheet shows the Skills section

  Scenario: Unresolved choices surface a Pending Choices panel
    Given a level 5 Fighter character sheet
    Then the sheet prompts the player to resolve pending choices

  Scenario: The sheet lists the character's equipment
    Given a finalized Fighter character sheet holding a longsword
    Then the equipment list shows the longsword
