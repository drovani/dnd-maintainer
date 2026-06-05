Feature: Autosave character builder draft
  As a player,
  I want my in-progress character draft to be saved automatically,
  So that I don't lose my work if I navigate away.

  # Render-app seam: a draft is persisted as a characters row (status='draft') plus
  # character_build_levels rows. Returning to the builder at the draft's URL loads
  # it — useCharacter(slug) + useCharacterBuildLevels rehydrate the builder, so step
  # 1 (name, species) is pre-filled. This exercises the resume/reload path (AC2 and
  # the reload half of AC1); it seeds the draft rows directly rather than driving
  # the autosave WRITE through the builder's inputs.

  Scenario: A saved draft is reloaded when returning to the builder
    Given a saved character draft named "Aldara"
    When the player opens the character builder for that draft
    Then the builder resumes with the name "Aldara"
    And the builder shows the species "Human"
