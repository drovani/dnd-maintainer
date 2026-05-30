@draft
Feature: Sign in and sign out
  As a registered user,
  I want to sign in with my credentials and sign out when finished,
  So that only I can access my campaigns and characters.

  # decision (account enumeration): the app hides account existence and account
  # state everywhere. Every failed sign-in — wrong password, unknown email,
  # disabled account, or unconfirmed email — returns the SAME generic
  # "invalid credentials" message, so a failed attempt never reveals whether an
  # email is registered, disabled, or merely unconfirmed.
  # decision (email verification): an account must have confirmed its email
  # (see features/auth/sign-up.feature) before it can sign in.

  Scenario: A user signs in with valid credentials
    Given a confirmed account exists for "player@example.com" with password "Correct-Horse-1"
    When the user signs in with email "player@example.com" and password "Correct-Horse-1"
    Then the user is signed in as "player@example.com"

  Scenario: Signing in with a wrong password is rejected
    Given a confirmed account exists for "player@example.com" with password "Correct-Horse-1"
    When the user signs in with email "player@example.com" and password "wrong-password"
    Then the user is not signed in
    And the user sees that the credentials are invalid

  Scenario: Signing in with an unknown email is rejected
    Given no account exists for "ghost@example.com"
    When the user signs in with email "ghost@example.com" and password "anything"
    Then the user is not signed in
    And the user sees that the credentials are invalid

  Scenario: A disabled account cannot sign in and is not distinguishable from a bad login
    # Enumeration guard: a disabled account returns the SAME generic message as a
    # wrong password — the attempt must not reveal that the account is disabled.
    Given a confirmed account exists for "banned@example.com" with password "Correct-Horse-1"
    And the account "banned@example.com" has been disabled by an admin
    When the user signs in with email "banned@example.com" and password "Correct-Horse-1"
    Then the user is not signed in
    And the user sees that the credentials are invalid

  Scenario: An unconfirmed account cannot sign in and is not distinguishable from a bad login
    # Enumeration guard: an unconfirmed account returns the SAME generic message.
    Given an account for "pending@example.com" is pending email confirmation
    When the user signs in with email "pending@example.com" and the correct password
    Then the user is not signed in
    And the user sees that the credentials are invalid

  Scenario: A signed-in user signs out
    Given the user is signed in as "player@example.com"
    When the user signs out
    Then the user is no longer signed in
    And visiting a campaign page redirects to the sign-in screen

  Scenario: Protected pages require a signed-in user
    Given no user is signed in
    When the visitor opens a campaign page directly
    Then the visitor is redirected to the sign-in screen
