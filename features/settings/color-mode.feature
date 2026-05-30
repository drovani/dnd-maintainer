Feature: Switch light and dark mode
  As a user,
  I want to toggle between light and dark mode,
  So that I can use the application comfortably in different lighting.

  # Render-app seam: SettingsTheme inside the real ThemeProvider. Selecting a color
  # mode persists to localStorage ('dnd-color-mode') and toggles the `.dark` class
  # on <html>. "System" resolves against the prefers-color-scheme media query.

  Scenario: Switching to Dark mode darkens the interface
    Given the Dungeon Master is on the theme settings page
    When the Dungeon Master selects the "Dark" color mode
    Then the interface is in dark mode

  Scenario: Switching back to Light mode lightens the interface
    Given the Dungeon Master is on the theme settings page
    When the Dungeon Master selects the "Dark" color mode
    And the Dungeon Master selects the "Light" color mode
    Then the interface is in light mode

  Scenario: System mode follows the operating system preference
    Given the operating system prefers dark mode
    And the Dungeon Master is on the theme settings page
    When the Dungeon Master selects the "Light" color mode
    Then the interface is in light mode
    When the Dungeon Master selects the "System" color mode
    Then the interface is in dark mode
