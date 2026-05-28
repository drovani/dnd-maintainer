Feature: View existing campaigns
  As a Dungeon Master,
  I want to see the campaigns I have created,
  So that I can pick one to manage.

  Scenario: A previously created campaign is visible to the DM
    Given a campaign named "Dragon's Lair" exists
    When the Dungeon Master views their campaigns
    Then "Dragon's Lair" appears in the list
