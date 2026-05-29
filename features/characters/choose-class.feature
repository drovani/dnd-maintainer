Feature: Choose a class during character creation
  As a player,
  I want my chosen class to grant the right proficiencies, features, and choices,
  So that my character is mechanically correct from level 1.

  # Scope: this story covers what a class contributes to a level-1 build (and the
  # level-3 subclass gate). Subclass feature contents are a separate story.
  # The other forks (species, background, abilities) are held constant so each
  # scenario varies only the class dimension.

  Rule: A class grants its core proficiencies at level 1

    Scenario Outline: A class grants its saving throw proficiencies
      Given a new character with the <class> class at level 1
      Then the character is proficient in <save 1> saving throws
      And the character is proficient in <save 2> saving throws

      Examples:
        | class   | save 1       | save 2       |
        | fighter | Strength     | Constitution |
        | wizard  | Intelligence | Wisdom       |
        | cleric  | Wisdom       | Charisma     |

    Scenario: A class offers skill proficiency choices from its own list
      Given a new character with the cleric class at level 1
      Then the character must choose 2 skills from the cleric skill list

  Rule: A class introduces its signature level-1 mechanics

    Scenario: A martial class grants a weapon mastery choice
      Given a new character with the fighter class at level 1
      Then the character must choose weapon masteries

    Scenario: A spellcasting class gains spellcasting at level 1
      Given a new character with the wizard class at level 1
      Then the character has spellcasting from its class

  Rule: Every class selects a subclass at level 3

    Scenario Outline: A class must choose a subclass when it reaches level 3
      Given a new character with the <class> class at level 3
      Then the character must choose a subclass

      Examples:
        | class   |
        | fighter |
        | cleric  |
        | wizard  |
