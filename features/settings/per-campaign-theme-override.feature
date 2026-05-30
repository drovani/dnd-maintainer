Feature: Override per-campaign theme from Settings
  As a Dungeon Master,
  I want to set or clear the theme override for each campaign from the Settings page,
  So that I can manage all campaign themes in one place.

  # Render-app seam: SettingsTheme renders one CampaignThemeRow per campaign, each
  # with its own ThemePicker (allowNone). Setting writes campaigns.theme; "Use
  # global theme" writes null (inherit). Assertions read the persisted row, where
  # the effective theme is `theme ?? default`.

  Scenario: Setting an override for a campaign from Settings
    Given a campaign named "Curse of Strahd" exists with no theme set
    And the Dungeon Master is on the theme settings page
    When the Dungeon Master sets the "Arcane" theme for "Curse of Strahd" in Settings
    Then "Curse of Strahd" uses the "Arcane" theme

  Scenario: Resetting a campaign override back to inherit the global theme
    Given a campaign named "Curse of Strahd" exists with theme "Sylvan"
    And the Dungeon Master is on the theme settings page
    When the Dungeon Master resets "Curse of Strahd" to inherit in Settings
    Then "Curse of Strahd" uses the "Default" theme
