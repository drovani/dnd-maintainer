@draft
Feature: Invite players to a campaign
  As the owner of a campaign,
  I want to invite other users to view my campaign,
  So that my players can follow along and be assigned characters.

  # assumption: the user who creates a campaign is its sole "owner" (the DM).
  # decision (invite target): only ALREADY-REGISTERED users can be invited, by
  # email. Inviting an address with no account is out of scope for this pass.
  # decision (view scope): for this first pass, a player's "view" of the campaign
  # covers CHARACTERS only — creating/editing characters assigned to them. Player
  # visibility of sessions, encounters, and notes is intentionally OUT OF SCOPE
  # here and will be specified later. A player still cannot edit campaign settings
  # or other players' characters.
  # decision (viewer): "viewer" is not a separate role — it is simply an invited
  # player who currently has no character assigned to them.
  # decision (invite delivery): a pending invite is surfaced both in-app and by
  # email, and does NOT expire (the owner can revoke it — see accept-invite.feature).
  # assumption: an invite is pending until the invitee accepts or declines
  # (see features/collaboration/accept-invite.feature). A pending invite does
  # not yet grant view access.

  Background:
    Given the user is signed in as "owner@example.com"
    And "owner@example.com" owns a campaign named "Sunless Citadel"

  Scenario: An owner invites a registered user as a player
    Given an account exists for "alice@example.com"
    When the owner invites "alice@example.com" to "Sunless Citadel"
    Then "alice@example.com" has a pending invite to "Sunless Citadel"

  Scenario: An unregistered email cannot be invited
    # Registered-users-only: inviting an address with no account is rejected for
    # this pass (invite-then-signup is out of scope). Note: surfacing this to the
    # owner does reveal whether that email has an account — an accepted trade-off
    # for an authenticated, authorized owner, distinct from the anonymous
    # account-enumeration guard on the sign-in/sign-up surface.
    Given no account exists for "nobody@example.com"
    When the owner tries to invite "nobody@example.com" to "Sunless Citadel"
    Then no invite is created
    And the owner sees that only registered users can be invited

  Scenario: A pending invite does not yet grant access
    Given the owner has invited "alice@example.com" to "Sunless Citadel"
    And the invite is still pending
    When "alice@example.com" tries to view "Sunless Citadel"
    Then "alice@example.com" cannot view the campaign

  Scenario: The same user cannot be invited twice while a pending invite exists
    Given the owner has invited "alice@example.com" to "Sunless Citadel"
    When the owner tries to invite "alice@example.com" to "Sunless Citadel" again
    Then no second invite is created
    And the owner sees that an invite is already pending

  Scenario: A current member cannot be re-invited
    Given "alice@example.com" is already a player in "Sunless Citadel"
    When the owner tries to invite "alice@example.com" to "Sunless Citadel"
    Then no invite is created
    And the owner sees that the user is already a member

  Scenario: A non-owner cannot invite players
    Given "alice@example.com" is already a player in "Sunless Citadel"
    And the user is signed in as "alice@example.com"
    When the player tries to invite "bob@example.com" to "Sunless Citadel"
    Then no invite is created
    And the player sees that they are not authorized

  Scenario: An owner removes a player from the campaign
    Given "alice@example.com" is already a player in "Sunless Citadel"
    When the owner removes "alice@example.com" from "Sunless Citadel"
    Then "alice@example.com" is no longer a member of "Sunless Citadel"
    And "alice@example.com" can no longer view the campaign
