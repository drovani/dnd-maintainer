Feature: Ability score modifiers
  As a Dungeon Master,
  I want each ability score to translate into the correct modifier,
  So that rolls and checks reflect the character's stats accurately.

  Scenario: A score of 14 gives a +2 modifier
    Given an ability score of 14
    Then the ability modifier is 2

  Scenario: A score of 8 gives a -1 modifier
    Given an ability score of 8
    Then the ability modifier is -1
