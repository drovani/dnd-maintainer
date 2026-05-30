# BDD Backlog — MVP Areas

User stories for Campaigns, Characters, Settings, and Export areas.
Sessions and Notes are out of scope for this Tier 1 backlog.

**Scope note — class completeness is NOT BDD.** Asserting that every class's
level 1–20 choices are accounted for (the exhaustive 12×20 matrix) is a
unit-test job, not a Gherkin one — it has one right answer per (class × level)
and no documentation value as prose. That lives in `src/lib/sources/*.test.ts`
(see `docs/class-completeness-testing.md`, Layers 1 & 2). BDD here is reserved
for **marquee, documentation-worthy behaviors** (Layer 3): ASI raises a
modifier, fighting-style AC bonus, Extra Attack, subclass selection at L3.
Level-up stories below (US-010, US-014) are behavior examples — keep them
representative, do not expand them into a per-level matrix.

Each entry follows the template:

```
### US-NNN: <title>
**Area:** Campaigns | Characters | Settings | Export
**Priority:** P1 | P2 | P3
**Feature file:** features/<area>/<slug>.feature (Tier 2)

**User story:** As a <role>, I want to <action>, so that <benefit>.
**Acceptance criteria:** (2–5 declarative ACs, Given/When/Then style)
**Implementing code:** src/<paths>
**Notes:** edge cases, deps
```

---

## Campaigns

### US-003: Search campaigns by name

**Area:** Campaigns
**Priority:** P2
**Feature file:** features/campaigns/search-campaigns.feature (Tier 2)

**User story:** As a DM with many campaigns, I want to filter campaigns by name, so that I can quickly find the one I need.
**Acceptance criteria:**

- Given three campaigns exist with names "Dragon's Lair", "City of Shadows", and "Dragon's Peak", when I type "Dragon" in the search box, then only the two matching campaigns are shown
- Given I clear the search box, when it is empty, then all campaigns are shown again
  **Implementing code:** `src/pages/CampaignList.tsx` (`searchTerm` state, client-side filter)
  **Notes:** Filtering is done client-side on the already-loaded `campaigns` array, not via a separate query.

---

## Characters

### US-008: Autosave character builder draft

**Area:** Characters
**Priority:** P1
**Feature file:** features/characters/builder-autosave.feature (Tier 2)

**User story:** As a player, I want my in-progress character draft to be saved automatically, so that I don't lose my work if I accidentally navigate away.
**Acceptance criteria:**

- Given I have filled in step 1 (name, species), when I navigate to a different page and return, then my step 1 data is still present
- Given I have a draft saved, when I land on the builder URL, then the draft is loaded and the wizard starts from where I left off
  **Implementing code:** `src/hooks/useBuilderAutosave.ts`, `src/hooks/useCharacterBuild.ts`
  **Notes:** `useBuilderAutosave` writes to the `characters` table with `build_json` JSONB column. `finalize()` creates the resolved character.

---

### US-009: View character sheet

**Area:** Characters
**Priority:** P1
**Feature file:** features/characters/view-character-sheet.feature (Tier 2)

**User story:** As a player, I want to view my character sheet, so that I can reference my character's stats, features, and equipment during a session.
**Acceptance criteria:**

- Given a character exists at level 5, when I navigate to the character sheet, then the proficiency bonus, saving throws, and skills are all shown
- Given a character has pending choices (e.g., unresolved ASI), when I view the sheet, then a "Pending Choices" panel is visible prompting resolution
- Given the character has equipment, when I view the sheet, then the equipment list shows item names and quantities
  **Implementing code:** `src/pages/CharacterSheet.tsx`, `src/lib/resolver/`, `src/hooks/useCharacters.ts`
  **Notes:** Character sheet resolves the character via `resolveCharacter()` on the fly from stored `build_json`.

---

### US-010: Level up a character

**Area:** Characters
**Priority:** P1
**Feature file:** features/characters/level-up.feature (Tier 2)

**User story:** As a player, I want to increase my character's level after gaining enough experience, so that my character gains new class features and abilities.
**Acceptance criteria:**

- Given a Fighter at level 3, when I click "Level Up" and confirm, then the character advances to level 4 and the Fighter ASI choice appears in Pending Choices
- Given a character levels up to 3, when I view the sheet, then a subclass choice prompt is shown
- Given I confirm a level-up, when the save completes, then the new level is reflected in the header
  **Implementing code:** `src/components/character-sheet/LevelControls.tsx`, `src/components/character-sheet/LevelUpDialog.tsx`, `src/hooks/useCharacters.ts`
  **Notes:** `LevelUpDialog` handles HP roll or average HP choice. Level data is appended to `build_json.levels`.

---

### US-011: Level down a character

**Area:** Characters
**Priority:** P2
**Feature file:** features/characters/level-down.feature (Tier 2)

**User story:** As a DM, I want to remove a character's most recent level, so that I can correct a mistaken level-up or adjust for a campaign retcon.
**Acceptance criteria:**

- Given a Fighter at level 4, when I click "Level Down" and confirm, then the character returns to level 3 and the ASI choice is removed from Pending Choices
- Given a character is at level 1, when I view the Level Controls, then the "Level Down" button is disabled
  **Implementing code:** `src/components/character-sheet/LevelControls.tsx`, `src/hooks/useCharacters.ts`
  **Notes:** Level down removes the last entry from `build_json.levels`. If choices were made for that level they are also cleared.

---

### US-012: Edit character backstory and personality

**Area:** Characters
**Priority:** P2
**Feature file:** features/characters/edit-character-backstory.feature (Tier 2)

**User story:** As a player, I want to edit my character's backstory, personality traits, ideals, bonds, and flaws from the character sheet, so that I can keep my character's narrative up to date.
**Acceptance criteria:**

- Given I am on the character sheet, when I click the edit icon on the Backstory section and type new text, then after saving the new backstory is shown
- Given I edit personality traits and save, then a success toast appears and the updated traits are visible
  **Implementing code:** `src/pages/CharacterSheet.tsx` (`EditSection` state, inline editing)
  **Notes:** Each section (personality, backstory, appearance) has its own `isEditing` state and uses `useCharacterMutations().update`.

---

### US-013: Archive a character

**Area:** Characters
**Priority:** P3
**Feature file:** features/characters/archive-character.feature (Tier 2)

**User story:** As a DM, I want to archive a retired or deceased character, so that they no longer appear in the active character list but are preserved.
**Acceptance criteria:**

- Given an active PC character, when I click "Archive" on the character sheet and confirm, then the character no longer appears in the campaign's character list
- Given I archive a character, when I reload the character list, then the archived character is not shown
  **Implementing code:** `src/pages/CharacterSheet.tsx`, `src/hooks/useCharacters.ts` (`useCharacterMutations().remove`)
  **Notes:** Current `remove` mutation may be a hard delete or a soft archive — verify actual behavior in `useCharacters.ts`.

---

### US-014: Resolve pending ASI choice

**Area:** Characters
**Priority:** P1
**Feature file:** features/characters/resolve-asi.feature (Tier 2)

**User story:** As a player, I want to allocate my ASI points when prompted, so that my character's ability scores are kept current and fully resolved.
**Acceptance criteria:**

- Given a Fighter at level 4 with an unresolved ASI, when I open the Pending Choices panel and allocate +2 to Strength, then the ASI is resolved and disappears from Pending Choices
- Given I try to allocate more than 2 points total, then a validation error prevents saving
  **Implementing code:** `src/components/character-sheet/PendingChoicesPanel.tsx`, `src/lib/resolver/index.ts`, `src/hooks/useCharacters.ts`
  **Notes:** Choice key `asi:class:fighter:0` resolves when `allocation` sums to `grant.points` (2). The resolved character recalculates immediately.

---

## Settings

### US-015: Switch global color theme

**Area:** Settings
**Priority:** P2
**Feature file:** features/settings/global-theme.feature (Tier 2)

**User story:** As a user, I want to choose a global color theme (Default, Sylvan, Arcane) for the application, so that my preferred aesthetic is applied across all pages.
**Acceptance criteria:**

- Given I navigate to Settings → Theme, when I select "Sylvan", then the page immediately updates to the Sylvan color scheme
- Given I switch to "Arcane", when I reload the page, then the Arcane theme is still active
  **Implementing code:** `src/pages/SettingsTheme.tsx`, `src/components/ThemeProvider.tsx`, `src/components/ThemePicker.tsx`
  **Notes:** Theme is persisted to `localStorage` via `ThemeProvider`. The `data-theme` attribute on `<html>` drives CSS variables.

---

### US-016: Switch light/dark mode

**Area:** Settings
**Priority:** P2
**Feature file:** features/settings/color-mode.feature (Tier 2)

**User story:** As a user, I want to toggle between light and dark mode, so that I can use the application comfortably in different lighting conditions.
**Acceptance criteria:**

- Given I am in light mode, when I click "Dark", then the `.dark` class is applied to `<html>` and the page uses dark colors
- Given I select "System", when my OS is in dark mode, then the application uses dark mode automatically
  **Implementing code:** `src/pages/SettingsTheme.tsx`, `src/components/ThemeProvider.tsx`
  **Notes:** Three options: Light, Dark, System. `ThemeProvider` reads from `localStorage` and a `prefers-color-scheme` media query.

---

### US-017: Override per-campaign theme from Settings

**Area:** Settings
**Priority:** P3
**Feature file:** features/settings/per-campaign-theme-override.feature (Tier 2)

**User story:** As a DM, I want to set or clear the theme override for each campaign from the Settings page, so that I can manage all campaign themes in one place.
**Acceptance criteria:**

- Given a campaign has no theme override, when I select "Arcane" for it in Settings, then that campaign's theme is saved
- Given a campaign already has "Sylvan", when I reset it to "Inherit", then the campaign reverts to the global theme
  **Implementing code:** `src/pages/SettingsTheme.tsx`, `src/hooks/useCampaigns.ts`
  **Notes:** Settings page shows a row per campaign with a ThemePicker. "Inherit" corresponds to `null` in the DB.

---

## Export

### US-018: Export selected campaigns as SQL seed file

**Area:** Export
**Priority:** P2
**Feature file:** features/export/export-campaigns.feature (Tier 2)

**User story:** As a DM, I want to export one or more campaigns as a SQL seed file, so that I can back up my data or migrate it to another environment.
**Acceptance criteria:**

- Given two campaigns exist, when I select one and click Export, then a `.sql` file is downloaded containing INSERT statements for that campaign's data
- Given I select no campaigns, when I click Export, then the export button is disabled or does nothing
- Given a campaign has characters and sessions, when I export it, then the SQL file contains data for campaigns, characters, and sessions tables
  **Implementing code:** `src/pages/ExportData.tsx`, `src/lib/export-sql.ts`
  **Notes:** `generateSeedSql()` builds the SQL; `downloadFile()` triggers the browser download. The export fetches all rows for selected campaign IDs.

---

### US-019: Select all / deselect all campaigns for export

**Area:** Export
**Priority:** P3
**Feature file:** features/export/export-select-all.feature (Tier 2)

**User story:** As a DM, I want to quickly select or deselect all campaigns for export, so that I can efficiently choose what to include without clicking each individually.
**Acceptance criteria:**

- Given three campaigns are listed, when I click "Select All", then all three are checked
- Given all are selected, when I click "Deselect All", then all are unchecked
  **Implementing code:** `src/pages/ExportData.tsx` (`selectAll()`, `deselectAll()`)
  **Notes:** Pure UI state — `selectedIds` is a `Set<string>`. No API calls for these actions.

---

### US-020: Show export error when data fetch fails

**Area:** Export
**Priority:** P3
**Feature file:** features/export/export-error-handling.feature (Tier 2)

**User story:** As a DM, I want to see a clear error message if the export fails, so that I know something went wrong and can try again.
**Acceptance criteria:**

- Given the database query fails during export, when I click Export, then an error message is shown on the page instead of a file download
- Given an error is shown, when I click Export again and it succeeds, then the error is cleared and the file is downloaded
  **Implementing code:** `src/pages/ExportData.tsx` (`errorMessage` state, `setErrorMessage`)
  **Notes:** The `handleExport` function catches errors and sets `errorMessage`. The UI renders an `AlertCircle` with the error text.
