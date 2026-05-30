@draft
Feature: Each user owns their own campaigns and characters
  As a user,
  I want my campaigns and characters to be private to me and the players I invite,
  So that other users cannot see or change my data.

  # assumption: "ownership" of a campaign belongs to its creator. A user's
  # campaign list shows campaigns they own PLUS campaigns they were invited to and
  # accepted. Players see a joined campaign but only in a view capacity (plus their
  # own characters); they do not own it.
  # decision (view scope): for this first pass a joined player's view covers their
  # own characters only; player visibility of sessions/encounters/notes is out of
  # scope (see invite-players.feature).
  # decision (denied = 403): denying access to a non-member returns a 403 Forbidden
  # (the resource exists but is not authorized) — NOT a 404. Campaign existence is
  # not treated as a secret from a signed-in user, unlike the anonymous
  # account-enumeration guard on the sign-in/sign-up surface.

  Scenario: Pre-auth data is assigned to the seeded admin when auth is introduced
    # decision (existing data): the app currently has NO owner columns — campaigns
    # and characters predate auth. When auth ships, the ownership migration backfills
    # every pre-existing campaign (and its characters) to the seeded admin account
    # (see features/auth/sign-up.feature), so no data is left ownerless.
    Given a campaign named "Legacy Game" existed before authentication was introduced
    And "admin@example.com" is the seeded admin account
    When the ownership migration runs
    Then "Legacy Game" is owned by "admin@example.com"
    And every character in "Legacy Game" belongs to "Legacy Game"

  Scenario: A new user starts with no campaigns
    Given the user is signed in as "newbie@example.com"
    And "newbie@example.com" owns no campaigns and has joined none
    When "newbie@example.com" views their campaign list
    Then the campaign list is empty

  Scenario: A user sees campaigns they own
    Given the user is signed in as "owner@example.com"
    And "owner@example.com" owns a campaign named "Sunless Citadel"
    When "owner@example.com" views their campaign list
    Then "Sunless Citadel" appears in their campaign list

  Scenario: A user does not see another user's campaigns
    Given an account exists for "stranger@example.com" who owns a campaign named "Private Game"
    And the user is signed in as "owner@example.com"
    When "owner@example.com" views their campaign list
    Then "Private Game" does not appear in their campaign list

  Scenario: A user cannot open another user's campaign by direct link
    Given an account exists for "stranger@example.com" who owns a campaign named "Private Game"
    And the user is signed in as "owner@example.com"
    And "owner@example.com" is not a member of "Private Game"
    When "owner@example.com" opens the "Private Game" campaign page directly
    Then access is denied with a 403 Forbidden

  Scenario: A joined player sees the campaign but not the owner's other campaigns
    Given the user is signed in as "alice@example.com"
    And "alice@example.com" is a player in "Sunless Citadel" owned by "owner@example.com"
    And "owner@example.com" also owns a campaign named "Secret Game" that "alice@example.com" has not joined
    When "alice@example.com" views their campaign list
    Then "Sunless Citadel" appears in their campaign list
    And "Secret Game" does not appear in their campaign list

  Scenario: A user cannot see characters in a campaign they have not joined
    Given an account exists for "stranger@example.com" who owns a campaign named "Private Game" with a character named "Hidden Hero"
    And the user is signed in as "owner@example.com"
    When "owner@example.com" tries to view the characters in "Private Game"
    Then access is denied with a 403 Forbidden
    And "Hidden Hero" is not shown
