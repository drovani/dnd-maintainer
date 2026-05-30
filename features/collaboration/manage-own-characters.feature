@draft
Feature: Players manage their own characters
  As a player in a campaign,
  I want to create and edit the characters assigned to me,
  So that I control my own character without waiting on the DM.

  # No change-approval workflow: edits by an assigned player take effect
  # immediately. The campaign owner can also edit any character in their campaign.

  Background:
    Given the user is signed in as "alice@example.com"
    And "alice@example.com" is a player in "Sunless Citadel"

  Scenario: A player creates a character in a campaign they joined and is auto-assigned
    When "alice@example.com" creates a character named "Lyra" in "Sunless Citadel"
    Then "Lyra" exists in "Sunless Citadel"
    And "Lyra" is assigned to "alice@example.com"

  Scenario: A player edits a character assigned to them
    Given a character named "Lyra" in "Sunless Citadel" is assigned to "alice@example.com"
    When "alice@example.com" levels up "Lyra"
    Then the change is saved without any approval step

  Scenario: A player cannot edit another player's character
    Given "bob@example.com" is a player in "Sunless Citadel"
    And a character named "Grog" in "Sunless Citadel" is assigned to "bob@example.com"
    When "alice@example.com" tries to edit "Grog"
    Then the change is not saved
    And "alice@example.com" sees that they are not authorized

  Scenario: A player cannot create a character in a campaign they have not joined
    Given "alice@example.com" is not a member of "Waterdeep"
    When "alice@example.com" tries to create a character in "Waterdeep"
    Then no character is created
    And "alice@example.com" sees that they are not a member of the campaign

  Scenario: The campaign owner can edit any character in their campaign
    Given the user is signed in as "owner@example.com"
    And "owner@example.com" owns "Sunless Citadel"
    And a character named "Lyra" in "Sunless Citadel" is assigned to "alice@example.com"
    When the owner edits "Lyra"
    Then the change is saved
