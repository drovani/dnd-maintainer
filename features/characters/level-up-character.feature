Feature: Level up a character
  As a Dungeon Master,
  I want my characters to gain class advancements when they level up,
  So that combat and roleplay reflect their growing power.

  Scenario: A Fighter advancing to level 4 is offered an ability score increase
    Given a Fighter at level 3
    When the Fighter advances to level 4
    Then they must choose an ability score increase
    And their proficiency bonus is 2

  Scenario: Reaching level 3 prompts a subclass choice
    Given a new character with the fighter class at level 3
    Then the character must choose a subclass
