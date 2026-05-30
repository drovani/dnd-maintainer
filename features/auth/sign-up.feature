@draft
Feature: Sign up for an account
  As a visitor,
  I want to create my own account,
  So that I can own campaigns and play characters in others'.

  # assumption: accounts are self-service — a visitor registers themselves with
  # email + password. Admins do NOT create accounts (their powers are reset/
  # disable/promote/demote — see features/admin/).
  # decision (registration): registration is open self-service.
  # decision (first admin): the initial admin is seeded by migration/env config,
  # NOT by "whoever registers first". Every self-service account is a plain "user";
  # there is no bootstrap-admin scenario.
  # decision (email verification): a new account must confirm its email before it
  # can sign in (Supabase email confirmation). Registering does NOT immediately
  # sign the visitor in.
  # decision (password policy): password strength is whatever the Supabase project
  # is configured for — these specs do not pin a specific length/complexity rule.
  # "too weak" below is illustrative, not a hardcoded threshold.
  # decision (account enumeration): the suite hides account existence everywhere
  # (see features/auth/password-reset.feature). Signing up with an already-registered
  # email therefore must NOT reveal that on screen — the visitor sees the same
  # generic "check your email" confirmation, and an email is sent to the existing
  # account instead of creating a duplicate.

  Scenario: A visitor registers with email and password
    Given no account exists for "dm@example.com"
    When the visitor signs up with email "dm@example.com" and a valid password
    Then an account for "dm@example.com" is created
    And the new account has the "user" role
    And the new account is pending email confirmation
    And the visitor is not yet signed in
    And the visitor sees a generic "check your email to confirm your account" message

  Scenario: A confirmed account can sign in
    Given an account for "dm@example.com" is pending email confirmation
    When the visitor confirms their email using the confirmation link
    Then the account for "dm@example.com" is confirmed
    And the user can sign in as "dm@example.com"

  Scenario: Signing up with an already-registered email does not reveal the account exists
    # Account-enumeration guard: the on-screen result is identical to a fresh signup.
    # No duplicate account is created; an email is sent to the existing address.
    Given an account exists for "dm@example.com"
    When a visitor tries to sign up with email "dm@example.com"
    Then no second account is created for "dm@example.com"
    And the visitor sees the same generic "check your email to confirm your account" message
    And an account-already-exists notice is emailed to "dm@example.com"

  Scenario: A weak password is rejected
    # The exact rule is the Supabase project's configured policy, not a fixed value.
    When the visitor tries to sign up with email "new@example.com" and a password that is too weak
    Then the account is not created
    And the visitor sees that the password does not meet the requirements

  Scenario: Email format is validated
    When the visitor tries to sign up with email "not-an-email"
    Then the account is not created
    And the visitor sees that the email is invalid
