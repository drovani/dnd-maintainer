Feature: Finalize a character draft into a playable character
  As a player,
  I want to finalize my completed build into an active character,
  So that the character is ready to play in the campaign.

  # Scope: the draft -> active transition at the end of the builder, including the
  # required-fields gate and the resolution of derived stats. This is the one
  # story in the create-character cluster that touches persistence (the builder
  # draft and the resulting character), so it depends on the Tier-0 data harness
  # (esmock + supabase mock + hooks), not only the resolver.

  Rule: A build must be complete before it can be finalized

    Scenario: A complete build can be finalized
      Given a complete character build with a name, class, species, background, and ability scores
      When the player finalizes the build
      Then the character is created as an active character

    @future
    Scenario: An incomplete build cannot be finalized
      Given a character build that is missing a class
      When the player attempts to finalize the build
      Then the character is not finalized
      And the player is shown what is still required

  Rule: Finalizing resolves the character's derived stats

    Scenario: A finalized character has its derived stats computed
      Given a complete character build at level 1
      When the player finalizes the build
      Then the finalized character has a proficiency bonus
      And the finalized character has maximum hit points

  Rule: A finalized character belongs to the active campaign

    Scenario: A finalized character appears in the campaign
      Given a complete character build in the active campaign
      When the player finalizes the build
      Then the character appears among the campaign's characters
