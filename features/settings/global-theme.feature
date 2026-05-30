Feature: Switch the global color theme
  As a user,
  I want to choose a global color theme (Default, Sylvan, Arcane),
  So that my preferred aesthetic is applied across all pages.

  # Render-app seam: the real SettingsTheme page renders inside the real
  # ThemeProvider. Selecting a theme calls setTheme, which persists to
  # localStorage ('dnd-theme') and applies data-theme to <html> (the attribute is
  # removed for the Default theme). Persistence across a reload is shown by the
  # stored value, which a fresh ThemeProvider reads on mount.

  Scenario: Selecting Sylvan applies it immediately
    Given the Dungeon Master is on the theme settings page
    When the Dungeon Master selects the "Sylvan" global theme
    Then the interface uses the "Sylvan" theme

  Scenario: The chosen global theme persists for the next visit
    Given the Dungeon Master is on the theme settings page
    When the Dungeon Master selects the "Arcane" global theme
    Then the saved global theme is "Arcane"
