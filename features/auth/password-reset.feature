@draft
Feature: Reset a forgotten password
  As a user who has forgotten their password,
  I want to request a reset link and choose a new password,
  So that I can regain access to my account.

  # assumption: reset is token-based — requesting a reset emails a single-use,
  # time-limited link; following it lets the user set a new password. The token
  # is consumed on use and old passwords stop working immediately.
  # decision (account enumeration): this generic-confirmation behaviour is the
  # account-enumeration policy applied across the whole suite (sign-up and sign-in
  # hide existence too).
  # decision (password policy): the strength rule is the Supabase project's
  # configured policy — these specs do not pin a length/complexity value.
  # "too weak" below is illustrative, not a hardcoded threshold.

  Scenario: A user requests a password reset
    Given an account exists for "forgetful@example.com"
    When the user requests a password reset for "forgetful@example.com"
    Then a password reset link is sent to "forgetful@example.com"

  Scenario: Requesting a reset for an unknown email reveals nothing
    # Security: the confirmation message is identical whether or not the email
    # is registered, so attackers cannot enumerate accounts.
    Given no account exists for "stranger@example.com"
    When the user requests a password reset for "stranger@example.com"
    Then the user sees the same generic confirmation message
    And no password reset link is sent

  Scenario: A user sets a new password with a valid reset token
    Given a valid password reset token was issued for "forgetful@example.com"
    When the user sets a new password "Brand-New-Pw-2" using that token
    Then the password for "forgetful@example.com" is updated
    And the user can sign in with "Brand-New-Pw-2"
    And the user cannot sign in with their old password

  Scenario: An expired reset token is rejected
    Given an expired password reset token was issued for "forgetful@example.com"
    When the user tries to set a new password using that token
    Then the password is not changed
    And the user sees that the reset link has expired

  Scenario: A reset token can only be used once
    Given a valid password reset token was issued for "forgetful@example.com"
    And the token has already been used to set a new password
    When the user tries to set another password using the same token
    Then the password is not changed
    And the user sees that the reset link is no longer valid

  Scenario: The new password must meet the requirements
    # The exact rule is the Supabase project's configured policy, not a fixed value.
    Given a valid password reset token was issued for "forgetful@example.com"
    When the user tries to set a new password that is too weak using that token
    Then the password is not changed
    And the user sees that the password does not meet the requirements
