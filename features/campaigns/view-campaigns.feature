Feature: View existing campaigns
  As a Dungeon Master,
  I want to see the campaigns I have created,
  So that I can pick one to manage.

  Scenario: A previously created campaign is visible to the DM
    Given a campaign named "Dragon's Lair" exists
    When the Dungeon Master views their campaigns
    Then "Dragon's Lair" appears in the list

  @draft
  Scenario: A first-time DM sees an empty campaign list
    Given the Dungeon Master has no campaigns
    When the Dungeon Master views their campaigns
    Then the list is empty
    And the Dungeon Master is prompted to create their first campaign

  @draft
  Scenario: Archived campaigns are hidden by default
    Given a campaign named "Lost Mines" exists
    And a campaign named "Forgotten Realms" exists but has been archived
    When the Dungeon Master views their campaigns
    Then "Lost Mines" appears in the list
    And "Forgotten Realms" does not appear in the list

  @draft
  Scenario: Campaigns are ordered by most recent activity
    Given a campaign named "Older Game" exists and was last played 2 weeks ago
    And a campaign named "Current Game" exists and was last played yesterday
    When the Dungeon Master views their campaigns
    Then "Current Game" appears before "Older Game" in the list