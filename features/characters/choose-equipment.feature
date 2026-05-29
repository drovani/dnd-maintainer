@draft
Feature: Choose starting equipment during character creation
  As a player,
  I want to pick my class's starting equipment option,
  So that my character begins play with the right gear.

  # Scope: the equipment step — the class-driven starting equipment choice and
  # the resulting inventory. Other forks are held constant.

  Rule: A class offers a starting equipment choice

    Scenario: A class presents its starting equipment options
      Given a new character with the fighter class at level 1
      Then the character must choose a starting equipment option

  Rule: Choosing an option populates the inventory

    Scenario: Choosing a starting equipment option adds its items
      Given a new character with the fighter class at level 1
      When the character chooses the first starting equipment option
      Then the chosen items appear in the character's inventory

    Scenario: A character can take starting gold instead of an equipment package
      Given a new character with the fighter class at level 1
      When the character chooses to start with gold instead of equipment
      Then the character's inventory reflects the gold option
