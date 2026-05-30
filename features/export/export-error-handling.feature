Feature: Show an export error when the data fetch fails
  As a Dungeon Master,
  I want to see a clear error message if the export fails,
  So that I know something went wrong and can try again.

  # Render-app seam: ExportData's data fetch is routed through a supabase wrapper
  # that can be toggled to fail. handleExport() catches the failure and sets
  # errorMessage (rendered in an AlertCircle banner); a later successful export
  # clears it (setErrorMessage(null) at the start of each attempt).

  Scenario: A failed fetch shows an error instead of a download
    Given a campaign named "Dragon's Lair" exists
    And the export data fetch will fail
    And the Dungeon Master is on the export page
    When the Dungeon Master selects "Dragon's Lair" for export
    And the Dungeon Master exports the selected campaigns
    Then an export error is shown

  Scenario: A successful retry clears a previous export error
    Given a campaign named "Dragon's Lair" exists
    And the export data fetch will fail
    And the Dungeon Master is on the export page
    When the Dungeon Master selects "Dragon's Lair" for export
    And the Dungeon Master exports the selected campaigns
    Then an export error is shown
    When the export data fetch recovers
    And the Dungeon Master exports the selected campaigns
    Then no export error is shown
