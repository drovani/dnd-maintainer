Feature: Search campaigns by name
  As a Dungeon Master with many campaigns,
  I want to filter campaigns by name,
  So that I can quickly find the one I need.

  # Render-app seam: CampaignList holds the search term in local state and filters
  # the already-loaded campaigns client-side (on name or setting). These scenarios
  # render the real page, type into the search box, and assert on the rendered list.

  Scenario: Typing a query narrows the list to matching campaigns
    Given a campaign named "Dragon's Lair" exists
    And a campaign named "City of Shadows" exists
    And a campaign named "Dragon's Peak" exists
    When the Dungeon Master searches campaigns for "Dragon"
    Then "Dragon's Lair" appears in the list
    And "Dragon's Peak" appears in the list
    And "City of Shadows" does not appear in the list

  Scenario: Clearing the search restores the full list
    Given a campaign named "Dragon's Lair" exists
    And a campaign named "City of Shadows" exists
    When the Dungeon Master searches campaigns for "Dragon"
    And the Dungeon Master clears the campaign search
    Then "Dragon's Lair" appears in the list
    And "City of Shadows" appears in the list
