@draft
Feature: Disable and re-enable accounts
  As an admin,
  I want to disable and re-enable accounts,
  So that I can revoke or restore access while never dropping below one active admin.

  # decision (no hard delete): account removal is a SOFT delete — there is no
  # permanent account deletion. "Deleting" an account simply disables it; the
  # account row, the campaigns it owns, and all characters in them are RETAINED.
  # A disabled account is locked out (cannot sign in) but loses no data, and can
  # be re-enabled later. This replaces the earlier "delete is permanent + cascade
  # the owned campaigns" assumption.
  # consequence: because nothing is destroyed, there is no "campaigns are deleted"
  # or "assignments are cleared" behaviour on disable — an owner's campaigns and a
  # player's character assignments survive a disable untouched and return intact on
  # re-enable.
  # decision (admin floor): at least one ACTIVE admin must always remain — the only
  # admin cannot be disabled.

  Background:
    Given the user is signed in as "boss@example.com" with the "admin" role

  Scenario: An admin disables an account
    Given an account exists for "noisy@example.com" with the "user" role
    When the admin disables "noisy@example.com"
    Then "noisy@example.com" is marked as disabled
    And "noisy@example.com" can no longer sign in

  Scenario: An admin re-enables a disabled account
    Given the account "noisy@example.com" has been disabled
    When the admin re-enables "noisy@example.com"
    Then "noisy@example.com" is marked as active
    And "noisy@example.com" can sign in again

  Scenario: Disabling an owner retains their campaigns
    Given an account exists for "departing@example.com" with the "user" role
    And "departing@example.com" owns a campaign named "Their Game"
    When the admin disables "departing@example.com"
    Then the campaign "Their Game" still exists
    And "Their Game" is still owned by "departing@example.com"

  Scenario: Re-enabling an owner restores access to their retained campaigns
    Given an account exists for "departing@example.com" with the "user" role
    And "departing@example.com" owns a campaign named "Their Game"
    And the account "departing@example.com" has been disabled
    When the admin re-enables "departing@example.com"
    Then "departing@example.com" can sign in again
    And "departing@example.com" still owns the campaign "Their Game"

  Scenario: Disabling a player keeps their character assignments intact
    Given an account exists for "departing@example.com" with the "user" role
    And "departing@example.com" is the assigned player of the character "Borrowed Hero" in someone else's campaign
    When the admin disables "departing@example.com"
    Then the character "Borrowed Hero" still exists
    And the character "Borrowed Hero" is still assigned to "departing@example.com"

  Scenario: The last active admin cannot be disabled
    Given "boss@example.com" is the only active admin
    When the admin tries to disable "boss@example.com"
    Then the account is not disabled
    And the admin sees that at least one active admin must remain

  Scenario: Disabling the second-to-last admin is allowed
    Given an account exists for "cofounder@example.com" with the "admin" role
    When the admin disables "cofounder@example.com"
    Then "cofounder@example.com" is marked as disabled

  Scenario: A non-admin cannot disable accounts
    Given the user is signed in as "player@example.com" with the "user" role
    And an account exists for "victim@example.com" with the "user" role
    When the user tries to disable "victim@example.com"
    Then the account is not disabled
    And the user sees that they are not authorized
