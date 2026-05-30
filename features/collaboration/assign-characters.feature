@draft
Feature: Assign characters to players
  As the owner of a campaign,
  I want to assign characters in my campaign to players who have joined it,
  So that each player controls the right character.

  # Character-change-approval workflow is INTENTIONALLY out of scope: an assigned
  # player edits their own character directly with no owner approval step. Do not
  # add an approval gate to satisfy any future agent reading this file.
  #
  # Two hard invariants this feature pins down:
  #   1. A character belongs to EXACTLY ONE campaign (already enforced structurally
  #      by characters.campaign_id NOT NULL single FK — there is no move-between-
  #      campaigns operation; the scenario below documents that invariant).
  #   2. A character has EXACTLY ZERO OR ONE assigned player — assigning replaces
  #      any previous assignee rather than accumulating.
  #
  # assumption: only the campaign owner assigns/reassigns/unassigns characters.
  # A player creating their own character within a joined campaign is auto-assigned
  # to themselves (see features/collaboration/manage-own-characters.feature).

  Background:
    Given the user is signed in as "owner@example.com"
    And "owner@example.com" owns a campaign named "Sunless Citadel"
    And "alice@example.com" is a player in "Sunless Citadel"
    And a character named "Thorin" exists in "Sunless Citadel" with no assigned player

  Scenario: An owner assigns a character to a player in the campaign
    When the owner assigns "Thorin" to "alice@example.com"
    Then "Thorin" is assigned to "alice@example.com"

  Scenario: A character cannot be assigned to a non-member
    Given "bob@example.com" is not a member of "Sunless Citadel"
    When the owner tries to assign "Thorin" to "bob@example.com"
    Then "Thorin" has no assigned player
    And the owner sees that the player must be a member of the campaign

  Scenario: Assigning a character to a new player replaces the previous assignee
    Given "Thorin" is assigned to "alice@example.com"
    And "carol@example.com" is a player in "Sunless Citadel"
    When the owner assigns "Thorin" to "carol@example.com"
    Then "Thorin" is assigned to "carol@example.com"
    And "Thorin" is not assigned to "alice@example.com"

  Scenario: An owner unassigns a character
    Given "Thorin" is assigned to "alice@example.com"
    When the owner unassigns "Thorin"
    Then "Thorin" has no assigned player

  Scenario: A character belongs to exactly one campaign
    Given "owner@example.com" also owns a campaign named "Dragon Heist"
    When the owner views the character "Thorin"
    Then "Thorin" belongs only to "Sunless Citadel"
    And there is no way to also place "Thorin" in "Dragon Heist"

  Scenario: A non-owner cannot assign characters
    Given the user is signed in as "alice@example.com"
    When the player tries to assign "Thorin" to "alice@example.com"
    Then "Thorin" has no assigned player
    And the player sees that they are not authorized
