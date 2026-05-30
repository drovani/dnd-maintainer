Feature: Resolve a pending ability score increase
  As a player,
  I want to allocate my ability score increase when prompted,
  So that my character's ability scores stay current and fully resolved.

  # Resolver seam: a build is resolved via the real collectBundles() +
  # resolveCharacter() pipeline. An ASI grant stays in pendingChoices until its
  # allocation sums to exactly the granted points (2); over- or under-allocation
  # leaves it pending. This mirrors the AsiAllocator UI, which disables Confirm
  # until exactly the granted points are spent.

  Scenario: A Fighter reaching level 4 is prompted for an ability score increase
    Given a Fighter at level 4 with no background chosen
    Then the character has a pending ability score increase

  Scenario: Allocating the full increase resolves the choice and raises the ability
    Given a Fighter at level 4 with no background chosen
    When the player allocates 2 points of ability score increase to Strength
    Then the ability score increase is no longer pending
    And the character's Strength score is increased by 2

  Scenario: Splitting the increase across two abilities also resolves it
    Given a Fighter at level 4 with no background chosen
    When the player allocates 1 point of ability score increase to Strength and 1 to Constitution
    Then the ability score increase is no longer pending

  Scenario: Over-allocating beyond the granted points leaves the choice unresolved
    Given a Fighter at level 4 with no background chosen
    When the player allocates 3 points of ability score increase to Strength
    Then the ability score increase is still pending
