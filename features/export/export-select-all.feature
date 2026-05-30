Feature: Select all or deselect all campaigns for export
  As a Dungeon Master,
  I want to quickly select or deselect all campaigns for export,
  So that I can efficiently choose what to include without clicking each one.

  # Pure UI state on the ExportData page — selectAll()/deselectAll() update the
  # selectedIds Set, reflected in the "{selected} of {total} selected" counter.

  Scenario: Select All checks every campaign
    Given a campaign named "Dragon's Lair" exists
    And a campaign named "City of Shadows" exists
    And a campaign named "Dragon's Peak" exists
    And the Dungeon Master is on the export page
    When the Dungeon Master clicks Select All
    Then 3 of 3 campaigns are selected for export

  Scenario: Deselect All clears the selection
    Given a campaign named "Dragon's Lair" exists
    And a campaign named "City of Shadows" exists
    And a campaign named "Dragon's Peak" exists
    And the Dungeon Master is on the export page
    When the Dungeon Master clicks Select All
    And the Dungeon Master clicks Deselect All
    Then 0 of 3 campaigns are selected for export
