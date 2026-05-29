Feature: Create a new campaign
  As a Dungeon Master,
  I want to be able to create a new campaign
  So that I can manage characters, sessions, and notes for it.

  Scenario: A DM creates a campaign by providing a name
    Given the Dungeon Master has no campaigns
    When the Dungeon Master creates a campaign named "Curse of Strahd"
    Then "Curse of Strahd" appears in their campaign list

  Scenario: A campaign name is required
    # Driven through the rendered CampaignList: the empty-name guard in
    # CampaignList.handleCreateCampaign (name.trim()) surfaces a "Name is required" message.
    When the Dungeon Master tries to create a campaign with no name
    Then the campaign is not created
    And the Dungeon Master sees that a name is required

  @future
  Scenario: Two campaigns cannot share the same name
    # @future: the campaigns table has no UNIQUE constraint on name (no campaigns_name_key in
    # supabase/migrations/) and there is no client-side duplicate guard, so a second campaign
    # is created silently. Adding the constraint/guard is the work this scenario specifies.
    Given a campaign named "Lost Mines" exists
    When the Dungeon Master tries to create another campaign named "Lost Mines"
    Then the campaign is not created
    And the Dungeon Master sees that the name is already in use

  Scenario: A newly created campaign is ready to manage
    # Driven through the rendered CampaignList: on create success the router navigates to
    # /campaign/<slug> (CampaignList.handleCreateCampaign onSuccess), asserted via getPath().
    Given the Dungeon Master has no campaigns
    When the Dungeon Master creates a campaign named "Tomb of Annihilation"
    Then "Tomb of Annihilation" is the active campaign
