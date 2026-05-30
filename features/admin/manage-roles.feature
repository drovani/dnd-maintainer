@draft
Feature: Promote and demote account roles
  As an admin,
  I want to grant and revoke admin rights,
  So that the right people can manage the system while always keeping at least one admin.

  # assumption: there are exactly two global roles — "admin" and "user".
  # "Promote" grants admin; "demote" revokes it. Per-campaign standing (owner vs
  # invited player) is separate and lives under features/campaigns/ and
  # features/collaboration/. Note "viewer" is not a distinct role — it is simply an
  # invited player who has no character assigned (see collaboration/).

  Background:
    Given the user is signed in as "boss@example.com" with the "admin" role

  Scenario: An admin promotes a user to admin
    Given an account exists for "trusted@example.com" with the "user" role
    When the admin promotes "trusted@example.com" to admin
    Then "trusted@example.com" has the "admin" role

  Scenario: An admin demotes another admin to user
    Given an account exists for "trusted@example.com" with the "admin" role
    When the admin demotes "trusted@example.com" to user
    Then "trusted@example.com" has the "user" role

  Scenario: The last active admin cannot be demoted
    # The floor counts ACTIVE admins, matching disable/re-enable in
    # features/admin/manage-accounts.feature — a disabled admin does not satisfy it.
    Given "boss@example.com" is the only active admin
    When the admin tries to demote "boss@example.com" to user
    Then the role is not changed
    And the admin sees that at least one active admin must remain
    And "boss@example.com" still has the "admin" role

  Scenario: The last active admin cannot be demoted even if a disabled admin exists
    # Lockout guard: a disabled admin cannot re-enable anyone, so demoting the only
    # active admin while the other admin is disabled would leave zero usable admins.
    Given an account exists for "cofounder@example.com" with the "admin" role
    And the account "cofounder@example.com" has been disabled
    When the admin tries to demote "boss@example.com" to user
    Then the role is not changed
    And the admin sees that at least one active admin must remain

  Scenario: An admin can demote themselves while another active admin remains
    Given an account exists for "cofounder@example.com" with the "admin" role
    When the admin demotes "boss@example.com" to user
    Then "boss@example.com" has the "user" role

  Scenario: A non-admin cannot change roles
    Given the user is signed in as "player@example.com" with the "user" role
    And an account exists for "victim@example.com" with the "user" role
    When the user tries to promote "victim@example.com" to admin
    Then the role is not changed
    And the user sees that they are not authorized
