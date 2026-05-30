@draft
Feature: Admin-initiated password reset
  As an admin,
  I want to start a password reset for any user,
  So that I can help someone locked out of their account without ever learning their password.

  # assumption: an admin-initiated reset uses the same token mechanism as the
  # self-service flow (see features/auth/password-reset.feature) — the admin
  # triggers the reset link to be sent to the user; the admin never sets or sees
  # the new password themselves.

  Background:
    Given the user is signed in as "boss@example.com" with the "admin" role

  Scenario: An admin sends a reset link to a user
    Given an account exists for "lockedout@example.com"
    When the admin initiates a password reset for "lockedout@example.com"
    Then a password reset link is sent to "lockedout@example.com"

  Scenario: The admin never sets the user's password directly
    Given an account exists for "lockedout@example.com"
    When the admin initiates a password reset for "lockedout@example.com"
    Then the admin is not shown a field to type a new password
    And the user must complete the reset using their own link

  Scenario: An admin can reset a disabled user's password
    # The reset can be queued, but the account stays disabled until re-enabled,
    # so the user still cannot sign in until an admin re-enables them.
    Given the account "lockedout@example.com" has been disabled
    When the admin initiates a password reset for "lockedout@example.com"
    Then a password reset link is sent to "lockedout@example.com"
    And "lockedout@example.com" still cannot sign in while disabled

  Scenario: A non-admin cannot initiate a reset for someone else
    Given the user is signed in as "player@example.com" with the "user" role
    And an account exists for "victim@example.com"
    When the user tries to initiate a password reset for "victim@example.com"
    Then no password reset link is sent
    And the user sees that they are not authorized
