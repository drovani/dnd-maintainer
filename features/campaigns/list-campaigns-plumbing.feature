Feature: List campaigns hook plumbing
  Scenario: useCampaigns returns the seeded campaign list
    Given the Supabase mock returns one campaign named "Dragon's Lair"
    When I invoke the useCampaigns hook
    Then the hook result contains one campaign named "Dragon's Lair"
