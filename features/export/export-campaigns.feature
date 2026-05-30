Feature: Export selected campaigns as a SQL seed file
  As a Dungeon Master,
  I want to export one or more campaigns as a SQL seed file,
  So that I can back up my data or migrate it to another environment.

  # Render-app seam: the real ExportData page fetches the selected campaigns'
  # rows through the stateful supabase, builds SQL via generateSeedSql(), and
  # hands it to downloadFile() (URL.createObjectURL is stubbed so the Blob can be
  # captured and inspected). Assertions read the generated SQL text.

  Scenario: Exporting a campaign produces SQL with its related data
    Given a campaign named "Dragon's Lair" exists with 2 characters and 2 sessions
    And the Dungeon Master is on the export page
    When the Dungeon Master selects "Dragon's Lair" for export
    And the Dungeon Master exports the selected campaigns
    Then the generated SQL contains INSERT statements for the campaigns table
    And the generated SQL contains INSERT statements for the characters table
    And the generated SQL contains INSERT statements for the sessions table

  Scenario: The export button is disabled when nothing is selected
    Given a campaign named "Dragon's Lair" exists
    And the Dungeon Master is on the export page
    Then the export button is disabled
