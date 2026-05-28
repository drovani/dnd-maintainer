Feature: Level-up resolver plumbing
  Scenario: Fighter reaches level 4 and has a pending ASI choice
    Given a Fighter character build at level 3
    When the character levels up to level 4
    Then the resolved character has a pending ASI choice from the Fighter class
    And the resolved character has proficiency bonus 2
