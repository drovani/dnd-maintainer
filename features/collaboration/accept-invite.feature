@draft
Feature: Respond to a campaign invite
  As a player,
  I want to accept or decline an invite to a campaign,
  So that I only join the games I actually want to be part of.

  Background:
    Given the user is signed in as "alice@example.com"
    And "alice@example.com" has a pending invite to "Sunless Citadel"

  Scenario: A player accepts an invite
    When "alice@example.com" accepts the invite to "Sunless Citadel"
    Then "alice@example.com" is a player in "Sunless Citadel"
    And "alice@example.com" can view "Sunless Citadel"
    And the invite is no longer pending

  Scenario: A player declines an invite
    When "alice@example.com" declines the invite to "Sunless Citadel"
    Then "alice@example.com" is not a member of "Sunless Citadel"
    And the invite is no longer pending
    And "alice@example.com" cannot view "Sunless Citadel"

  Scenario: A user can only respond to their own invite
    Given the user is signed in as "mallory@example.com"
    When "mallory@example.com" tries to accept the invite addressed to "alice@example.com"
    Then "mallory@example.com" is not a member of "Sunless Citadel"
    And "mallory@example.com" sees that they are not authorized

  Scenario: An invite revoked by the owner can no longer be accepted
    Given the owner has revoked the invite to "alice@example.com"
    When "alice@example.com" tries to accept the invite to "Sunless Citadel"
    Then "alice@example.com" is not a member of "Sunless Citadel"
    And "alice@example.com" sees that the invite is no longer available

  Scenario: A player can leave a campaign they joined
    Given "alice@example.com" accepted the invite and is a player in "Sunless Citadel"
    When "alice@example.com" leaves "Sunless Citadel"
    Then "alice@example.com" is not a member of "Sunless Citadel"
    And any characters assigned to "alice@example.com" in "Sunless Citadel" have no assigned player
