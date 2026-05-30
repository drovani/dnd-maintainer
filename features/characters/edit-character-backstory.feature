Feature: Edit character backstory and personality
  As a player,
  I want to edit my character's backstory and personality from the character sheet,
  So that I can keep my character's narrative up to date.

  # Render-app seam: the CharacterSheet renders inline edit dialogs (the section
  # pencil opens a Textarea + Save). Saving calls useCharacterMutations().update,
  # which persists to the characters row. The backstory and personality sections
  # only render when already populated, so the sheet is seeded with existing text.

  Scenario: Editing the backstory saves the new text
    Given a Fighter character sheet with an existing backstory and personality
    When the Dungeon Master edits the backstory to "Born in the ashlands, sworn to the flame."
    Then the character's backstory reads "Born in the ashlands, sworn to the flame."

  Scenario: Editing the personality traits saves them
    Given a Fighter character sheet with an existing backstory and personality
    When the Dungeon Master edits the personality traits to "Quick to laugh, slow to trust."
    Then the character's personality traits read "Quick to laugh, slow to trust."
