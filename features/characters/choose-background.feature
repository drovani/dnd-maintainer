@draft
Feature: Choose a background during character creation
  As a player,
  I want my chosen background to grant skills, ability boosts, an origin feat, and tools,
  So that my character's origin is mechanically represented per the 2024 rules.

  # Scope: background contribution to the build. In the 2024 PHB the background —
  # not the species — grants the ability score increases. Class, species, and
  # the ability-score method are held constant.

  Rule: A background grants fixed proficiencies

    Scenario: A background grants two skill proficiencies
      Given a new character with the soldier background
      Then the character is proficient in the Athletics skill
      And the character is proficient in the Intimidation skill

    Scenario: A background grants a tool proficiency or tool choice
      Given a new character with the soldier background
      Then the character has a tool proficiency from the background

  Rule: A background grants 2024-style ability increases

    Scenario: A background grants three points of ability score increases
      Given a new character with the soldier background
      Then the background grants 3 points of ability score increases

  Rule: A background grants an origin feat

    Scenario Outline: A background grants its origin feat
      Given a new character with the <background> background
      Then the character gains an origin feat

      Examples:
        | background |
        | soldier    |
        | acolyte    |
        | sage       |
