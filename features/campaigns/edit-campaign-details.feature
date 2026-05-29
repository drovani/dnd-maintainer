Feature: Edit campaign details
  As a Dungeon Master,
  I want to revise the details of an existing campaign,
  So that they reflect how the game has evolved.

  Scenario: A DM updates the campaign description
    Given a campaign named "Curse of Strahd" exists with no description
    When the Dungeon Master sets the description to "Gothic horror in Barovia"
    Then the campaign description shows "Gothic horror in Barovia"

  Scenario: A DM changes the campaign setting
    Given a campaign named "Sandbox" exists in the "Forgotten Realms" setting
    When the Dungeon Master changes the setting to "Eberron"
    Then the campaign is in the "Eberron" setting

  Scenario: A DM renames a campaign
    Given a campaign named "Untitled" exists
    When the Dungeon Master renames it to "Storm King's Thunder"
    Then the campaign is named "Storm King's Thunder"

  @future
  Scenario: A rename cannot collide with an existing campaign name
    # @future: no UNIQUE constraint on campaigns.name (no campaigns_name_key) and no client-side
    # collision guard, so the rename succeeds silently. Same production gap as create-campaign's
    # "Two campaigns cannot share the same name". Adding the constraint/guard is the work specified.
    Given a campaign named "Lost Mines" exists
    And another campaign named "Untitled" exists
    When the Dungeon Master tries to rename "Untitled" to "Lost Mines"
    Then the campaign is not renamed
    And the Dungeon Master sees that the name is already in use
