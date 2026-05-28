@draft
Feature: Per-campaign color theme
  As a Dungeon Master,
  I want to specify a color theme for a campaign,
  So that I can add visual flavor and distinction between my campaigns.

  Scenario: A DM sets a theme on a campaign
    Given a campaign named "Curse of Strahd" exists with no theme set
    When the Dungeon Master sets the campaign theme to "Arcane"
    Then "Curse of Strahd" uses the "Arcane" theme

  Scenario: A campaign without a theme falls back to the DM's global theme
    Given the Dungeon Master's global theme is "Sylvan"
    And a campaign named "Sandbox" exists with no theme set
    When the Dungeon Master opens "Sandbox"
    Then the interface uses the "Sylvan" theme

  Scenario: A campaign theme overrides the global theme while that campaign is active
    Given the Dungeon Master's global theme is "Default"
    And a campaign named "Curse of Strahd" exists with theme "Arcane"
    When the Dungeon Master opens "Curse of Strahd"
    Then the interface uses the "Arcane" theme

  Scenario: A DM clears a campaign theme to fall back to their global theme
    Given the Dungeon Master's global theme is "Default"
    And a campaign named "Curse of Strahd" exists with theme "Arcane"
    When the Dungeon Master clears the theme on "Curse of Strahd"
    Then "Curse of Strahd" uses the "Default" theme
