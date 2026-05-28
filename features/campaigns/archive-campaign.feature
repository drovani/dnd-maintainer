Feature: Archive a campaign
  As a Dungeon Master,
  I want to archive a campaign I am no longer playing,
  So that my active list stays focused without losing the history.

  Scenario: A DM archives a finished campaign
    Given a campaign named "Lost Mines" exists
    When the Dungeon Master archives "Lost Mines"
    Then "Lost Mines" does not appear in the active campaigns list

  Scenario: An archived campaign can be restored
    Given a campaign named "Forgotten Realms" exists but has been archived
    When the Dungeon Master restores "Forgotten Realms"
    Then "Forgotten Realms" appears in the active campaigns list

  @draft
  Scenario: Archived campaigns are browsable separately
    # NOTE: useCampaigns() hardcodes .is('archived_at', null) — there is no
    # useArchivedCampaigns hook or useCampaigns({ archived: true }) variant.
    # A new hook/query must be added to the production codebase before this step
    # can be implemented. See src/hooks/useCampaigns.ts.
    Given a campaign named "Old Game" exists but has been archived
    When the Dungeon Master views their archived campaigns
    Then "Old Game" appears in the archived list

  @draft
  Scenario: Archiving preserves the campaign's characters and sessions
    # NOTE: This is a DB cascade/integrity test — not a hook concern.
    # It requires a real Supabase instance (or full integration test) with actual
    # character and session rows. The hook layer has no surface to assert this.
    # Belongs in an integration test suite, not a hook-level BDD step.
    Given a campaign named "Lost Mines" exists with 3 characters and 5 sessions
    When the Dungeon Master archives "Lost Mines"
    And the Dungeon Master restores "Lost Mines"
    Then the campaign still has 3 characters and 5 sessions
