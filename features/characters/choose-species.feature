Feature: Choose a species during character creation
  As a player,
  I want my chosen species to grant its traits and any lineage choice,
  So that my character reflects its heritage.

  # Scope: species contribution to the build — traits, size/speed, and the
  # lineage sub-choice for species that have one. Class, background, and
  # abilities are held constant.

  Rule: A species grants its racial traits

    Scenario: A species grants its level-1 traits
      Given a new character with the dwarf species
      Then the character has the Darkvision trait
      And the character has the Dwarven Resilience trait

  Rule: Species with a lineage require a lineage choice

    Scenario Outline: A species with lineages must choose one
      Given a new character with the <species> species
      Then the character must choose a <lineage label>

      Examples:
        | species    | lineage label      |
        | elf        | lineage            |
        | gnome      | lineage            |
        | dragonborn | draconic ancestry  |

    Scenario: A chosen lineage grants its sub-traits
      Given a new character with the elf species
      When the character chooses the Wood Elf lineage
      Then the character gains the traits of the Wood Elf lineage

  Rule: Species without a lineage require no lineage choice

    Scenario: A species without lineages has no lineage choice
      Given a new character with the dwarf species
      Then the character has no lineage choice to make
