Feature: Choose ability scores during character creation
  As a player,
  I want to set my ability scores by a supported method and have background increases applied,
  So that my final scores and modifiers are correct.

  # Scope: the ability-score step. Supported methods are standard array, point
  # buy, and rolling. Class, species, and background are held constant; the
  # background's increases are applied on top of the base scores (2024 rules).

  Rule: Each method produces a valid base score set

    Scenario: The standard array assigns the fixed set of scores
      Given a new character using the standard-array ability method
      Then the available base scores are 15, 14, 13, 12, 10, and 8

    Scenario: Point buy spends a fixed pool of points
      Given a new character using the point-buy ability method
      Then the character has 27 points to spend on ability scores

    Scenario: Point buy rejects a base score above 15
      Given a new character using the point-buy ability method
      When the character tries to set a base ability score of 16
      Then the score is not allowed

  Rule: Background increases apply on top of base scores

    Scenario: A background's ability increases are added to the base scores
      Given a new character with the soldier background
      And base ability scores of 15, 14, 13, 12, 10, and 8
      When the soldier ability increases are applied to Strength and Constitution
      Then the final Strength score includes the background increase
      And the final ability modifiers reflect the increased scores
