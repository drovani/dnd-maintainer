Feature: Archive a character
  As a Dungeon Master,
  I want to archive a retired or deceased character,
  So that they no longer appear in the active character list but are preserved.

  Scenario: Active characters appear in the campaign's character list
    Given a campaign with an active character named "Valeros"
    When the Dungeon Master views the character list
    Then "Valeros" appears in the character list

  @future
  Scenario: An archived character is hidden from the character list
    # GAP: the Archive action sets characters.is_active = false, but useCharacters()
    # selects every row for the campaign (.eq('campaign_id', id).order('name')) with
    # no is_active filter, so an archived character still shows. Hiding archived
    # characters from the list is not implemented — this asserts the intended
    # behavior and fails (the character still appears) until it is built.
    Given a campaign with an archived character named "Old Hero"
    When the Dungeon Master views the character list
    Then "Old Hero" does not appear in the character list
