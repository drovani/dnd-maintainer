@draft
Feature: Choose skills during character creation
  As a player,
  I want my skill proficiencies to combine my class and background without double-counting,
  So that my skill list is accurate.

  # Scope: how skill proficiencies are assembled across sources, the class skill
  # choice count, deduplication of overlapping grants, and expertise. Species,
  # ability method, and equipment are held constant.

  Rule: Skill proficiencies combine across sources

    Scenario: A character's skills come from both class and background
      Given a new character with the cleric class and the soldier background
      Then the character's skill proficiencies include the soldier background skills
      And the character may choose additional skills from the cleric

    Scenario: A class skill choice offers the correct count from its list
      Given a new character with the cleric class at level 1
      Then the character must choose 2 skills from the cleric skill list

  Rule: Overlapping skill grants are not double-counted

    Scenario: A skill granted by two sources is only counted once
      Given a new character whose class and background both grant the Athletics skill
      Then the character is proficient in the Athletics skill exactly once

  Rule: Expertise improves a chosen skill

    Scenario: Expertise doubles the proficiency bonus for a chosen skill
      Given a new character with the rogue class at level 1
      When the character chooses Expertise in the Stealth skill
      Then the Stealth skill applies double the proficiency bonus
