Feature: Create a new campaign
  As a Dungeon Master,
  I want to be able to create a new campaign
  So that I can manage characters, sessions, and notes for it.

  Scenario: A DM creates a campaign by providing a name
    Given the Dungeon Master has no campaigns
    When the Dungeon Master creates a campaign named "Curse of Strahd"
    Then "Curse of Strahd" appears in their campaign list

  @draft
  Scenario: A campaign name is required
    # NOTE: The "sees that a name is required" step verifies the DB-layer NOT-NULL error (23502).
    # However the production rule lives in CampaignList.handleCreateCampaign which guards
    # the mutate() call client-side before it ever hits the DB. A uniqueness constraint on
    # the name column (campaigns_name_key) would need to exist in the DB schema for the
    # 23502 path to be reachable at the hook layer. Current migrations do not enforce this —
    # needs either a DB constraint or hook-level validation before this can go green.
    When the Dungeon Master tries to create a campaign with no name
    Then the campaign is not created
    And the Dungeon Master sees that a name is required

  @draft
  Scenario: Two campaigns cannot share the same name
    # NOTE: The hook correctly surfaces a DB uniqueness error (23505) if the constraint exists.
    # However the campaigns table does not currently have a UNIQUE constraint on name —
    # check supabase/migrations/ for "campaigns_name_key". If that constraint is missing,
    # this scenario cannot go green without a migration adding it.
    Given a campaign named "Lost Mines" exists
    When the Dungeon Master tries to create another campaign named "Lost Mines"
    Then the campaign is not created
    And the Dungeon Master sees that the name is already in use

  @draft
  Scenario: A newly created campaign is ready to manage
    # NOTE: "is the active campaign" means the router navigated to /campaign/<slug>
    # (see CampaignList.handleCreateCampaign onSuccess → navigate(`/campaign/${data.slug}`)).
    # This is a routing/selection concern — not surfaced by the hook return value.
    # Needs a renderPage() harness with MemoryRouter + navigate spy to assert the redirect.
    Given the Dungeon Master has no campaigns
    When the Dungeon Master creates a campaign named "Tomb of Annihilation"
    Then "Tomb of Annihilation" is the active campaign
