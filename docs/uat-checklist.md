# UAT Checklist

> Generated from the Gherkin specs under `features/` by `npm run uat:checklist`.
> Do not edit by hand — re-run the script to refresh.

**156 scenarios** — 80 ready · 10 future (not built yet) · 66 draft

Status legend: **Ready** = expected to work today, validate it · **Future** = spec-ahead, expect it to fail/skip · **Draft** = no steps yet.

## Ready (80)

### `features/campaigns/archive-campaign.feature`

#### Archive a campaign

- [ ] **A DM archives a finished campaign**
  - Given a campaign named "Lost Mines" exists
  - When the Dungeon Master archives "Lost Mines"
  - Then "Lost Mines" does not appear in the active campaigns list

### `features/campaigns/create-campaign.feature`

#### Create a new campaign

- [ ] **A DM creates a campaign by providing a name**
  - Given the Dungeon Master has no campaigns
  - When the Dungeon Master creates a campaign named "Curse of Strahd"
  - Then "Curse of Strahd" appears in their campaign list
- [ ] **A campaign name is required**
  - When the Dungeon Master tries to create a campaign with no name
  - Then the campaign is not created
  - And the Dungeon Master sees that a name is required
- [ ] **A newly created campaign is ready to manage**
  - Given the Dungeon Master has no campaigns
  - When the Dungeon Master creates a campaign named "Tomb of Annihilation"
  - Then "Tomb of Annihilation" is the active campaign

### `features/campaigns/edit-campaign-details.feature`

#### Edit campaign details

- [ ] **A DM updates the campaign description**
  - Given a campaign named "Curse of Strahd" exists with no description
  - When the Dungeon Master sets the description to "Gothic horror in Barovia"
  - Then the campaign description shows "Gothic horror in Barovia"
- [ ] **A DM changes the campaign setting**
  - Given a campaign named "Sandbox" exists in the "Forgotten Realms" setting
  - When the Dungeon Master changes the setting to "Eberron"
  - Then the campaign is in the "Eberron" setting
- [ ] **A DM renames a campaign**
  - Given a campaign named "Untitled" exists
  - When the Dungeon Master renames it to "Storm King's Thunder"
  - Then the campaign is named "Storm King's Thunder"

### `features/campaigns/per-campaign-theme.feature`

#### Per-campaign color theme

- [ ] **A DM sets a theme on a campaign**
  - Given a campaign named "Curse of Strahd" exists with no theme set
  - When the Dungeon Master sets the campaign theme to "Arcane"
  - Then "Curse of Strahd" uses the "Arcane" theme
- [ ] **A campaign without a theme falls back to the DM's global theme**
  - Given the Dungeon Master's global theme is "Sylvan"
  - And a campaign named "Sandbox" exists with no theme set
  - When the Dungeon Master opens "Sandbox"
  - Then the interface uses the "Sylvan" theme
- [ ] **A campaign theme overrides the global theme while that campaign is active**
  - Given the Dungeon Master's global theme is "Default"
  - And a campaign named "Curse of Strahd" exists with theme "Arcane"
  - When the Dungeon Master opens "Curse of Strahd"
  - Then the interface uses the "Arcane" theme
- [ ] **A DM clears a campaign theme to fall back to their global theme**
  - Given the Dungeon Master's global theme is "Default"
  - And a campaign named "Curse of Strahd" exists with theme "Arcane"
  - When the Dungeon Master clears the theme on "Curse of Strahd"
  - Then "Curse of Strahd" uses the "Default" theme

### `features/campaigns/search-campaigns.feature`

#### Search campaigns by name

- [ ] **Typing a query narrows the list to matching campaigns**
  - Given a campaign named "Dragon's Lair" exists
  - And a campaign named "City of Shadows" exists
  - And a campaign named "Dragon's Peak" exists
  - When the Dungeon Master searches campaigns for "Dragon"
  - Then "Dragon's Lair" appears in the list
  - And "Dragon's Peak" appears in the list
  - And "City of Shadows" does not appear in the list
- [ ] **Clearing the search restores the full list**
  - Given a campaign named "Dragon's Lair" exists
  - And a campaign named "City of Shadows" exists
  - When the Dungeon Master searches campaigns for "Dragon"
  - And the Dungeon Master clears the campaign search
  - Then "Dragon's Lair" appears in the list
  - And "City of Shadows" appears in the list

### `features/campaigns/view-campaigns.feature`

#### View existing campaigns

- [ ] **A previously created campaign is visible to the DM**
  - Given a campaign named "Dragon's Lair" exists
  - When the Dungeon Master views their campaigns
  - Then "Dragon's Lair" appears in the list
- [ ] **A first-time DM sees an empty campaign list**
  - Given the Dungeon Master has no campaigns
  - When the Dungeon Master views their campaigns
  - Then the list is empty
  - And the Dungeon Master is prompted to create their first campaign
- [ ] **Archived campaigns are hidden by default**
  - Given a campaign named "Lost Mines" exists
  - And a campaign named "Forgotten Realms" exists but has been archived
  - When the Dungeon Master views their campaigns
  - Then "Lost Mines" appears in the list
  - And "Forgotten Realms" does not appear in the list
- [ ] **Campaigns are ordered by most recent activity**
  - Given a campaign named "Older Game" exists and was last played 2 weeks ago
  - And a campaign named "Current Game" exists and was last played yesterday
  - When the Dungeon Master views their campaigns
  - Then "Current Game" appears before "Older Game" in the list

### `features/characters/ability-modifiers.feature`

#### Ability score modifiers

- [ ] **A score of 14 gives a +2 modifier**
  - Given an ability score of 14
  - Then the ability modifier is 2
- [ ] **A score of 8 gives a -1 modifier**
  - Given an ability score of 8
  - Then the ability modifier is -1

### `features/characters/archive-character.feature`

#### Archive a character

- [ ] **Active characters appear in the campaign's character list**
  - Given a campaign with an active character named "Valeros"
  - When the Dungeon Master views the character list
  - Then "Valeros" appears in the character list

### `features/characters/builder-autosave.feature`

#### Autosave character builder draft

- [ ] **A saved draft is reloaded when returning to the builder**
  - Given a saved character draft named "Aldara"
  - When the player opens the character builder for that draft
  - Then the builder resumes with the name "Aldara"
  - And the builder shows the species "Human"

### `features/characters/choose-ability-scores.feature`

#### Choose ability scores during character creation

##### Rule: Each method produces a valid base score set

- [ ] **The standard array assigns the fixed set of scores**
  - Given a new character using the standard-array ability method
  - Then the available base scores are 15, 14, 13, 12, 10, and 8
- [ ] **Point buy spends a fixed pool of points**
  - Given a new character using the point-buy ability method
  - Then the character has 27 points to spend on ability scores
- [ ] **Point buy rejects a base score above 15**
  - Given a new character using the point-buy ability method
  - When the character tries to set a base ability score of 16
  - Then the score is not allowed
##### Rule: Background increases apply on top of base scores

- [ ] **A background's ability increases are added to the base scores**
  - Given a new character with the soldier background
  - And base ability scores of 15, 14, 13, 12, 10, and 8
  - When the soldier ability increases are applied to Strength and Constitution
  - Then the final Strength score includes the background increase
  - And the final ability modifiers reflect the increased scores

### `features/characters/choose-background.feature`

#### Choose a background during character creation

##### Rule: A background grants fixed proficiencies

- [ ] **A background grants two skill proficiencies**
  - Given a new character with the soldier background
  - Then the character is proficient in the Athletics skill
  - And the character is proficient in the Intimidation skill
- [ ] **A background grants a tool proficiency or tool choice**
  - Given a new character with the soldier background
  - Then the character has a tool proficiency from the background
##### Rule: A background grants 2024-style ability increases

- [ ] **A background grants three points of ability score increases**
  - Given a new character with the soldier background
  - Then the background grants 3 points of ability score increases
##### Rule: A background grants an origin feat

- [ ] **A background grants its origin feat**
  - Given a new character with the soldier background
  - Then the character gains an origin feat

### `features/characters/choose-class.feature`

#### Choose a class during character creation

##### Rule: A class grants its core proficiencies at level 1

- [ ] **A class grants its saving throw proficiencies**
  - Given a new character with the fighter class at level 1
  - Then the character is proficient in Strength saving throws
  - And the character is proficient in Constitution saving throws
- [ ] **A class grants its saving throw proficiencies**
  - Given a new character with the wizard class at level 1
  - Then the character is proficient in Intelligence saving throws
  - And the character is proficient in Wisdom saving throws
- [ ] **A class grants its saving throw proficiencies**
  - Given a new character with the cleric class at level 1
  - Then the character is proficient in Wisdom saving throws
  - And the character is proficient in Charisma saving throws
- [ ] **A class offers skill proficiency choices from its own list**
  - Given a new character with the cleric class at level 1
  - Then the character must choose 2 skills from the cleric skill list
##### Rule: A class introduces its signature level-1 mechanics

- [ ] **A martial class grants a weapon mastery choice**
  - Given a new character with the fighter class at level 1
  - Then the character must choose weapon masteries
- [ ] **A spellcasting class gains spellcasting at level 1**
  - Given a new character with the wizard class at level 1
  - Then the character has spellcasting from its class
##### Rule: Every class selects a subclass at level 3

- [ ] **A class must choose a subclass when it reaches level 3**
  - Given a new character with the fighter class at level 3
  - Then the character must choose a subclass
- [ ] **A class must choose a subclass when it reaches level 3**
  - Given a new character with the cleric class at level 3
  - Then the character must choose a subclass
- [ ] **A class must choose a subclass when it reaches level 3**
  - Given a new character with the wizard class at level 3
  - Then the character must choose a subclass

### `features/characters/choose-equipment.feature`

#### Choose starting equipment during character creation

##### Rule: A class offers a starting equipment choice

- [ ] **A class presents its starting equipment options**
  - Given a new character with the fighter class at level 1
  - Then the character must choose a starting equipment option
##### Rule: Choosing an option populates the inventory

- [ ] **Choosing a starting equipment option adds its items**
  - Given a new character with the fighter class at level 1
  - When the character chooses the first starting equipment option
  - Then the chosen items appear in the character's inventory

### `features/characters/choose-skills.feature`

#### Choose skills during character creation

##### Rule: Skill proficiencies combine across sources

- [ ] **A character's skills come from both class and background**
  - Given a new character with the cleric class and the soldier background
  - Then the character's skill proficiencies include the soldier background skills
  - And the character may choose additional skills from the cleric
- [ ] **A class skill choice offers the correct count from its list**
  - Given a new character with the cleric class at level 1
  - Then the character must choose 2 skills from the cleric skill list
##### Rule: Overlapping skill grants are not double-counted

- [ ] **A skill granted by two sources is only counted once**
  - Given a new character whose class and background both grant the Athletics skill
  - Then the character is proficient in the Athletics skill exactly once
##### Rule: Expertise improves a chosen skill

- [ ] **Expertise doubles the proficiency bonus for a chosen skill**
  - Given a new character with the rogue class at level 1
  - When the character chooses Expertise in the Stealth skill
  - Then the Stealth skill applies double the proficiency bonus

### `features/characters/choose-species.feature`

#### Choose a species during character creation

##### Rule: A species grants its racial traits

- [ ] **A species grants its level-1 traits**
  - Given a new character with the dwarf species
  - Then the character has the Darkvision trait
  - And the character has the Dwarven Resilience trait
##### Rule: Species with a lineage require a lineage choice

- [ ] **A species with lineages must choose one**
  - Given a new character with the elf species
  - Then the character must choose a lineage
- [ ] **A species with lineages must choose one**
  - Given a new character with the gnome species
  - Then the character must choose a lineage
- [ ] **A species with lineages must choose one**
  - Given a new character with the dragonborn species
  - Then the character must choose a draconic ancestry
- [ ] **A chosen lineage grants its sub-traits**
  - Given a new character with the elf species
  - When the character chooses the Wood Elf lineage
  - Then the character gains the traits of the Wood Elf lineage
##### Rule: Species without a lineage require no lineage choice

- [ ] **A species without lineages has no lineage choice**
  - Given a new character with the dwarf species
  - Then the character has no lineage choice to make

### `features/characters/edit-character-backstory.feature`

#### Edit character backstory and personality

- [ ] **Editing the backstory saves the new text**
  - Given a Fighter character sheet with an existing backstory and personality
  - When the Dungeon Master edits the backstory to "Born in the ashlands, sworn to the flame."
  - Then the character's backstory reads "Born in the ashlands, sworn to the flame."
- [ ] **Editing the personality traits saves them**
  - Given a Fighter character sheet with an existing backstory and personality
  - When the Dungeon Master edits the personality traits to "Quick to laugh, slow to trust."
  - Then the character's personality traits read "Quick to laugh, slow to trust."

### `features/characters/finalize-character.feature`

#### Finalize a character draft into a playable character

##### Rule: A build must be complete before it can be finalized

- [ ] **A complete build can be finalized**
  - Given a complete character build with a name, class, species, background, and ability scores
  - When the player finalizes the build
  - Then the character is created as an active character
##### Rule: Finalizing resolves the character's derived stats

- [ ] **A finalized character has its derived stats computed**
  - Given a complete character build at level 1
  - When the player finalizes the build
  - Then the finalized character has a proficiency bonus
  - And the finalized character has maximum hit points
##### Rule: A finalized character belongs to the active campaign

- [ ] **A finalized character appears in the campaign**
  - Given a complete character build in the active campaign
  - When the player finalizes the build
  - Then the character appears among the campaign's characters

### `features/characters/level-down.feature`

#### Level down a character

- [ ] **Reverting a Fighter from level 4 to level 3 removes the ASI choice**
  - Given a Fighter at level 4 with no background chosen
  - Then the character has a pending ability score increase
  - When the most recent level is removed
  - Then the character is level 3
  - And the character has no pending ability score increase
  - And their proficiency bonus is 2
- [ ] **A first-level character cannot be leveled down**
  - Given a level 1 Fighter is shown on the character sheet
  - Then the Level Down action is unavailable
- [ ] **A higher-level character offers the Level Down control**
  - Given a level 3 Fighter is shown on the character sheet
  - Then the Level Down action is available

### `features/characters/level-up-character.feature`

#### Level up a character

- [ ] **A Fighter advancing to level 4 is offered an ability score increase**
  - Given a Fighter at level 3
  - When the Fighter advances to level 4
  - Then they must choose an ability score increase
  - And their proficiency bonus is 2
- [ ] **Reaching level 3 prompts a subclass choice**
  - Given a new character with the fighter class at level 3
  - Then the character must choose a subclass

### `features/characters/resolve-asi.feature`

#### Resolve a pending ability score increase

- [ ] **A Fighter reaching level 4 is prompted for an ability score increase**
  - Given a Fighter at level 4 with no background chosen
  - Then the character has a pending ability score increase
- [ ] **Allocating the full increase resolves the choice and raises the ability**
  - Given a Fighter at level 4 with no background chosen
  - When the player allocates 2 points of ability score increase to Strength
  - Then the ability score increase is no longer pending
  - And the character's Strength score is increased by 2
- [ ] **Splitting the increase across two abilities also resolves it**
  - Given a Fighter at level 4 with no background chosen
  - When the player allocates 1 point of ability score increase to Strength and 1 to Constitution
  - Then the ability score increase is no longer pending
- [ ] **Over-allocating beyond the granted points leaves the choice unresolved**
  - Given a Fighter at level 4 with no background chosen
  - When the player allocates 3 points of ability score increase to Strength
  - Then the ability score increase is still pending

### `features/characters/view-character-sheet.feature`

#### View character sheet

- [ ] **The sheet shows the resolved core statistics**
  - Given a level 5 Fighter character sheet
  - Then the sheet shows a proficiency bonus of 3
  - And the sheet shows the Saving Throws section
  - And the sheet shows the Skills section
- [ ] **Unresolved choices surface a Pending Choices panel**
  - Given a level 5 Fighter character sheet
  - Then the sheet prompts the player to resolve pending choices
- [ ] **The sheet lists the character's equipment**
  - Given a finalized Fighter character sheet holding a longsword
  - Then the equipment list shows the longsword

### `features/export/export-campaigns.feature`

#### Export selected campaigns as a SQL seed file

- [ ] **Exporting a campaign produces SQL with its related data**
  - Given a campaign named "Dragon's Lair" exists with 2 characters and 2 sessions
  - And the Dungeon Master is on the export page
  - When the Dungeon Master selects "Dragon's Lair" for export
  - And the Dungeon Master exports the selected campaigns
  - Then the generated SQL contains INSERT statements for the campaigns table
  - And the generated SQL contains INSERT statements for the characters table
  - And the generated SQL contains INSERT statements for the sessions table
- [ ] **The export button is disabled when nothing is selected**
  - Given a campaign named "Dragon's Lair" exists
  - And the Dungeon Master is on the export page
  - Then the export button is disabled

### `features/export/export-error-handling.feature`

#### Show an export error when the data fetch fails

- [ ] **A failed fetch shows an error instead of a download**
  - Given a campaign named "Dragon's Lair" exists
  - And the export data fetch will fail
  - And the Dungeon Master is on the export page
  - When the Dungeon Master selects "Dragon's Lair" for export
  - And the Dungeon Master exports the selected campaigns
  - Then an export error is shown
- [ ] **A successful retry clears a previous export error**
  - Given a campaign named "Dragon's Lair" exists
  - And the export data fetch will fail
  - And the Dungeon Master is on the export page
  - When the Dungeon Master selects "Dragon's Lair" for export
  - And the Dungeon Master exports the selected campaigns
  - Then an export error is shown
  - When the export data fetch recovers
  - And the Dungeon Master exports the selected campaigns
  - Then no export error is shown

### `features/export/export-select-all.feature`

#### Select all or deselect all campaigns for export

- [ ] **Select All checks every campaign**
  - Given a campaign named "Dragon's Lair" exists
  - And a campaign named "City of Shadows" exists
  - And a campaign named "Dragon's Peak" exists
  - And the Dungeon Master is on the export page
  - When the Dungeon Master clicks Select All
  - Then 3 of 3 campaigns are selected for export
- [ ] **Deselect All clears the selection**
  - Given a campaign named "Dragon's Lair" exists
  - And a campaign named "City of Shadows" exists
  - And a campaign named "Dragon's Peak" exists
  - And the Dungeon Master is on the export page
  - When the Dungeon Master clicks Select All
  - And the Dungeon Master clicks Deselect All
  - Then 0 of 3 campaigns are selected for export

### `features/settings/color-mode.feature`

#### Switch light and dark mode

- [ ] **Switching to Dark mode darkens the interface**
  - Given the Dungeon Master is on the theme settings page
  - When the Dungeon Master selects the "Dark" color mode
  - Then the interface is in dark mode
- [ ] **Switching back to Light mode lightens the interface**
  - Given the Dungeon Master is on the theme settings page
  - When the Dungeon Master selects the "Dark" color mode
  - And the Dungeon Master selects the "Light" color mode
  - Then the interface is in light mode
- [ ] **System mode follows the operating system preference**
  - Given the operating system prefers dark mode
  - And the Dungeon Master is on the theme settings page
  - When the Dungeon Master selects the "Light" color mode
  - Then the interface is in light mode
  - When the Dungeon Master selects the "System" color mode
  - Then the interface is in dark mode

### `features/settings/global-theme.feature`

#### Switch the global color theme

- [ ] **Selecting Sylvan applies it immediately**
  - Given the Dungeon Master is on the theme settings page
  - When the Dungeon Master selects the "Sylvan" global theme
  - Then the interface uses the "Sylvan" theme
- [ ] **The chosen global theme persists for the next visit**
  - Given the Dungeon Master is on the theme settings page
  - When the Dungeon Master selects the "Arcane" global theme
  - Then the saved global theme is "Arcane"

### `features/settings/per-campaign-theme-override.feature`

#### Override per-campaign theme from Settings

- [ ] **Setting an override for a campaign from Settings**
  - Given a campaign named "Curse of Strahd" exists with no theme set
  - And the Dungeon Master is on the theme settings page
  - When the Dungeon Master sets the "Arcane" theme for "Curse of Strahd" in Settings
  - Then "Curse of Strahd" uses the "Arcane" theme
- [ ] **Resetting a campaign override back to inherit the global theme**
  - Given a campaign named "Curse of Strahd" exists with theme "Sylvan"
  - And the Dungeon Master is on the theme settings page
  - When the Dungeon Master resets "Curse of Strahd" to inherit in Settings
  - Then "Curse of Strahd" uses the "Default" theme

## Future (10)

### `features/campaigns/archive-campaign.feature`

#### Archive a campaign

- [ ] **An archived campaign can be restored**
  - Given a campaign named "Forgotten Realms" exists but has been archived
  - When the Dungeon Master restores "Forgotten Realms"
  - Then "Forgotten Realms" appears in the active campaigns list
- [ ] **Archived campaigns are browsable separately**
  - Given a campaign named "Old Game" exists but has been archived
  - When the Dungeon Master views their archived campaigns
  - Then "Old Game" appears in the archived list
- [ ] **Archiving preserves the campaign's characters and sessions**
  - Given a campaign named "Lost Mines" exists with 3 characters and 5 sessions
  - When the Dungeon Master archives "Lost Mines"
  - And the Dungeon Master restores "Lost Mines"
  - Then the campaign still has 3 characters and 5 sessions

### `features/campaigns/create-campaign.feature`

#### Create a new campaign

- [ ] **Two campaigns cannot share the same name**
  - Given a campaign named "Lost Mines" exists
  - When the Dungeon Master tries to create another campaign named "Lost Mines"
  - Then the campaign is not created
  - And the Dungeon Master sees that the name is already in use

### `features/campaigns/edit-campaign-details.feature`

#### Edit campaign details

- [ ] **A rename cannot collide with an existing campaign name**
  - Given a campaign named "Lost Mines" exists
  - And another campaign named "Untitled" exists
  - When the Dungeon Master tries to rename "Untitled" to "Lost Mines"
  - Then the campaign is not renamed
  - And the Dungeon Master sees that the name is already in use

### `features/characters/archive-character.feature`

#### Archive a character

- [ ] **An archived character is hidden from the character list**
  - Given a campaign with an archived character named "Old Hero"
  - When the Dungeon Master views the character list
  - Then "Old Hero" does not appear in the character list

### `features/characters/choose-background.feature`

#### Choose a background during character creation

##### Rule: A background grants an origin feat

- [ ] **A background grants its origin feat**
  - Given a new character with the acolyte background
  - Then the character gains an origin feat
- [ ] **A background grants its origin feat**
  - Given a new character with the sage background
  - Then the character gains an origin feat

### `features/characters/choose-equipment.feature`

#### Choose starting equipment during character creation

##### Rule: Choosing an option populates the inventory

- [ ] **A character can take starting gold instead of an equipment package**
  - Given a new character with the fighter class at level 1
  - When the character chooses to start with gold instead of equipment
  - Then the character's inventory reflects the gold option

### `features/characters/finalize-character.feature`

#### Finalize a character draft into a playable character

##### Rule: A build must be complete before it can be finalized

- [ ] **An incomplete build cannot be finalized**
  - Given a character build that is missing a class
  - When the player attempts to finalize the build
  - Then the character is not finalized
  - And the player is shown what is still required

## Draft (66)

### `features/admin/initiate-password-reset.feature`

#### Admin-initiated password reset

- [ ] **An admin sends a reset link to a user**
  - Given the user is signed in as "boss@example.com" with the "admin" role
  - Given an account exists for "lockedout@example.com"
  - When the admin initiates a password reset for "lockedout@example.com"
  - Then a password reset link is sent to "lockedout@example.com"
- [ ] **The admin never sets the user's password directly**
  - Given the user is signed in as "boss@example.com" with the "admin" role
  - Given an account exists for "lockedout@example.com"
  - When the admin initiates a password reset for "lockedout@example.com"
  - Then the admin is not shown a field to type a new password
  - And the user must complete the reset using their own link
- [ ] **An admin can reset a disabled user's password**
  - Given the user is signed in as "boss@example.com" with the "admin" role
  - Given the account "lockedout@example.com" has been disabled
  - When the admin initiates a password reset for "lockedout@example.com"
  - Then a password reset link is sent to "lockedout@example.com"
  - And "lockedout@example.com" still cannot sign in while disabled
- [ ] **A non-admin cannot initiate a reset for someone else**
  - Given the user is signed in as "boss@example.com" with the "admin" role
  - Given the user is signed in as "player@example.com" with the "user" role
  - And an account exists for "victim@example.com"
  - When the user tries to initiate a password reset for "victim@example.com"
  - Then no password reset link is sent
  - And the user sees that they are not authorized

### `features/admin/manage-accounts.feature`

#### Disable and re-enable accounts

- [ ] **An admin disables an account**
  - Given the user is signed in as "boss@example.com" with the "admin" role
  - Given an account exists for "noisy@example.com" with the "user" role
  - When the admin disables "noisy@example.com"
  - Then "noisy@example.com" is marked as disabled
  - And "noisy@example.com" can no longer sign in
- [ ] **An admin re-enables a disabled account**
  - Given the user is signed in as "boss@example.com" with the "admin" role
  - Given the account "noisy@example.com" has been disabled
  - When the admin re-enables "noisy@example.com"
  - Then "noisy@example.com" is marked as active
  - And "noisy@example.com" can sign in again
- [ ] **Disabling an owner retains their campaigns**
  - Given the user is signed in as "boss@example.com" with the "admin" role
  - Given an account exists for "departing@example.com" with the "user" role
  - And "departing@example.com" owns a campaign named "Their Game"
  - When the admin disables "departing@example.com"
  - Then the campaign "Their Game" still exists
  - And "Their Game" is still owned by "departing@example.com"
- [ ] **Re-enabling an owner restores access to their retained campaigns**
  - Given the user is signed in as "boss@example.com" with the "admin" role
  - Given an account exists for "departing@example.com" with the "user" role
  - And "departing@example.com" owns a campaign named "Their Game"
  - And the account "departing@example.com" has been disabled
  - When the admin re-enables "departing@example.com"
  - Then "departing@example.com" can sign in again
  - And "departing@example.com" still owns the campaign "Their Game"
- [ ] **Disabling a player keeps their character assignments intact**
  - Given the user is signed in as "boss@example.com" with the "admin" role
  - Given an account exists for "departing@example.com" with the "user" role
  - And "departing@example.com" is the assigned player of the character "Borrowed Hero" in someone else's campaign
  - When the admin disables "departing@example.com"
  - Then the character "Borrowed Hero" still exists
  - And the character "Borrowed Hero" is still assigned to "departing@example.com"
- [ ] **The last active admin cannot be disabled**
  - Given the user is signed in as "boss@example.com" with the "admin" role
  - Given "boss@example.com" is the only active admin
  - When the admin tries to disable "boss@example.com"
  - Then the account is not disabled
  - And the admin sees that at least one active admin must remain
- [ ] **Disabling the second-to-last admin is allowed**
  - Given the user is signed in as "boss@example.com" with the "admin" role
  - Given an account exists for "cofounder@example.com" with the "admin" role
  - When the admin disables "cofounder@example.com"
  - Then "cofounder@example.com" is marked as disabled
- [ ] **A non-admin cannot disable accounts**
  - Given the user is signed in as "boss@example.com" with the "admin" role
  - Given the user is signed in as "player@example.com" with the "user" role
  - And an account exists for "victim@example.com" with the "user" role
  - When the user tries to disable "victim@example.com"
  - Then the account is not disabled
  - And the user sees that they are not authorized

### `features/admin/manage-roles.feature`

#### Promote and demote account roles

- [ ] **An admin promotes a user to admin**
  - Given the user is signed in as "boss@example.com" with the "admin" role
  - Given an account exists for "trusted@example.com" with the "user" role
  - When the admin promotes "trusted@example.com" to admin
  - Then "trusted@example.com" has the "admin" role
- [ ] **An admin demotes another admin to user**
  - Given the user is signed in as "boss@example.com" with the "admin" role
  - Given an account exists for "trusted@example.com" with the "admin" role
  - When the admin demotes "trusted@example.com" to user
  - Then "trusted@example.com" has the "user" role
- [ ] **The last active admin cannot be demoted**
  - Given the user is signed in as "boss@example.com" with the "admin" role
  - Given "boss@example.com" is the only active admin
  - When the admin tries to demote "boss@example.com" to user
  - Then the role is not changed
  - And the admin sees that at least one active admin must remain
  - And "boss@example.com" still has the "admin" role
- [ ] **The last active admin cannot be demoted even if a disabled admin exists**
  - Given the user is signed in as "boss@example.com" with the "admin" role
  - Given an account exists for "cofounder@example.com" with the "admin" role
  - And the account "cofounder@example.com" has been disabled
  - When the admin tries to demote "boss@example.com" to user
  - Then the role is not changed
  - And the admin sees that at least one active admin must remain
- [ ] **An admin can demote themselves while another active admin remains**
  - Given the user is signed in as "boss@example.com" with the "admin" role
  - Given an account exists for "cofounder@example.com" with the "admin" role
  - When the admin demotes "boss@example.com" to user
  - Then "boss@example.com" has the "user" role
- [ ] **A non-admin cannot change roles**
  - Given the user is signed in as "boss@example.com" with the "admin" role
  - Given the user is signed in as "player@example.com" with the "user" role
  - And an account exists for "victim@example.com" with the "user" role
  - When the user tries to promote "victim@example.com" to admin
  - Then the role is not changed
  - And the user sees that they are not authorized

### `features/auth/authentication.feature`

#### Sign in and sign out

- [ ] **A user signs in with valid credentials**
  - Given a confirmed account exists for "player@example.com" with password "Correct-Horse-1"
  - When the user signs in with email "player@example.com" and password "Correct-Horse-1"
  - Then the user is signed in as "player@example.com"
- [ ] **Signing in with a wrong password is rejected**
  - Given a confirmed account exists for "player@example.com" with password "Correct-Horse-1"
  - When the user signs in with email "player@example.com" and password "wrong-password"
  - Then the user is not signed in
  - And the user sees that the credentials are invalid
- [ ] **Signing in with an unknown email is rejected**
  - Given no account exists for "ghost@example.com"
  - When the user signs in with email "ghost@example.com" and password "anything"
  - Then the user is not signed in
  - And the user sees that the credentials are invalid
- [ ] **A disabled account cannot sign in and is not distinguishable from a bad login**
  - Given a confirmed account exists for "banned@example.com" with password "Correct-Horse-1"
  - And the account "banned@example.com" has been disabled by an admin
  - When the user signs in with email "banned@example.com" and password "Correct-Horse-1"
  - Then the user is not signed in
  - And the user sees that the credentials are invalid
- [ ] **An unconfirmed account cannot sign in and is not distinguishable from a bad login**
  - Given an account for "pending@example.com" is pending email confirmation
  - When the user signs in with email "pending@example.com" and the correct password
  - Then the user is not signed in
  - And the user sees that the credentials are invalid
- [ ] **A signed-in user signs out**
  - Given the user is signed in as "player@example.com"
  - When the user signs out
  - Then the user is no longer signed in
  - And visiting a campaign page redirects to the sign-in screen
- [ ] **Protected pages require a signed-in user**
  - Given no user is signed in
  - When the visitor opens a campaign page directly
  - Then the visitor is redirected to the sign-in screen

### `features/auth/password-reset.feature`

#### Reset a forgotten password

- [ ] **A user requests a password reset**
  - Given an account exists for "forgetful@example.com"
  - When the user requests a password reset for "forgetful@example.com"
  - Then a password reset link is sent to "forgetful@example.com"
- [ ] **Requesting a reset for an unknown email reveals nothing**
  - Given no account exists for "stranger@example.com"
  - When the user requests a password reset for "stranger@example.com"
  - Then the user sees the same generic confirmation message
  - And no password reset link is sent
- [ ] **A user sets a new password with a valid reset token**
  - Given a valid password reset token was issued for "forgetful@example.com"
  - When the user sets a new password "Brand-New-Pw-2" using that token
  - Then the password for "forgetful@example.com" is updated
  - And the user can sign in with "Brand-New-Pw-2"
  - And the user cannot sign in with their old password
- [ ] **An expired reset token is rejected**
  - Given an expired password reset token was issued for "forgetful@example.com"
  - When the user tries to set a new password using that token
  - Then the password is not changed
  - And the user sees that the reset link has expired
- [ ] **A reset token can only be used once**
  - Given a valid password reset token was issued for "forgetful@example.com"
  - And the token has already been used to set a new password
  - When the user tries to set another password using the same token
  - Then the password is not changed
  - And the user sees that the reset link is no longer valid
- [ ] **The new password must meet the requirements**
  - Given a valid password reset token was issued for "forgetful@example.com"
  - When the user tries to set a new password that is too weak using that token
  - Then the password is not changed
  - And the user sees that the password does not meet the requirements

### `features/auth/sign-up.feature`

#### Sign up for an account

- [ ] **A visitor registers with email and password**
  - Given no account exists for "dm@example.com"
  - When the visitor signs up with email "dm@example.com" and a valid password
  - Then an account for "dm@example.com" is created
  - And the new account has the "user" role
  - And the new account is pending email confirmation
  - And the visitor is not yet signed in
  - And the visitor sees a generic "check your email to confirm your account" message
- [ ] **A confirmed account can sign in**
  - Given an account for "dm@example.com" is pending email confirmation
  - When the visitor confirms their email using the confirmation link
  - Then the account for "dm@example.com" is confirmed
  - And the user can sign in as "dm@example.com"
- [ ] **Signing up with an already-registered email does not reveal the account exists**
  - Given an account exists for "dm@example.com"
  - When a visitor tries to sign up with email "dm@example.com"
  - Then no second account is created for "dm@example.com"
  - And the visitor sees the same generic "check your email to confirm your account" message
  - And an account-already-exists notice is emailed to "dm@example.com"
- [ ] **A weak password is rejected**
  - When the visitor tries to sign up with email "new@example.com" and a password that is too weak
  - Then the account is not created
  - And the visitor sees that the password does not meet the requirements
- [ ] **Email format is validated**
  - When the visitor tries to sign up with email "not-an-email"
  - Then the account is not created
  - And the visitor sees that the email is invalid

### `features/collaboration/accept-invite.feature`

#### Respond to a campaign invite

- [ ] **A player accepts an invite**
  - Given the user is signed in as "alice@example.com"
  - And "alice@example.com" has a pending invite to "Sunless Citadel"
  - When "alice@example.com" accepts the invite to "Sunless Citadel"
  - Then "alice@example.com" is a player in "Sunless Citadel"
  - And "alice@example.com" can view "Sunless Citadel"
  - And the invite is no longer pending
- [ ] **A player declines an invite**
  - Given the user is signed in as "alice@example.com"
  - And "alice@example.com" has a pending invite to "Sunless Citadel"
  - When "alice@example.com" declines the invite to "Sunless Citadel"
  - Then "alice@example.com" is not a member of "Sunless Citadel"
  - And the invite is no longer pending
  - And "alice@example.com" cannot view "Sunless Citadel"
- [ ] **A user can only respond to their own invite**
  - Given the user is signed in as "alice@example.com"
  - And "alice@example.com" has a pending invite to "Sunless Citadel"
  - Given the user is signed in as "mallory@example.com"
  - When "mallory@example.com" tries to accept the invite addressed to "alice@example.com"
  - Then "mallory@example.com" is not a member of "Sunless Citadel"
  - And "mallory@example.com" sees that they are not authorized
- [ ] **An invite revoked by the owner can no longer be accepted**
  - Given the user is signed in as "alice@example.com"
  - And "alice@example.com" has a pending invite to "Sunless Citadel"
  - Given the owner has revoked the invite to "alice@example.com"
  - When "alice@example.com" tries to accept the invite to "Sunless Citadel"
  - Then "alice@example.com" is not a member of "Sunless Citadel"
  - And "alice@example.com" sees that the invite is no longer available
- [ ] **A player can leave a campaign they joined**
  - Given the user is signed in as "alice@example.com"
  - And "alice@example.com" has a pending invite to "Sunless Citadel"
  - Given "alice@example.com" accepted the invite and is a player in "Sunless Citadel"
  - When "alice@example.com" leaves "Sunless Citadel"
  - Then "alice@example.com" is not a member of "Sunless Citadel"
  - And any characters assigned to "alice@example.com" in "Sunless Citadel" have no assigned player

### `features/collaboration/assign-characters.feature`

#### Assign characters to players

- [ ] **An owner assigns a character to a player in the campaign**
  - Given the user is signed in as "owner@example.com"
  - And "owner@example.com" owns a campaign named "Sunless Citadel"
  - And "alice@example.com" is a player in "Sunless Citadel"
  - And a character named "Thorin" exists in "Sunless Citadel" with no assigned player
  - When the owner assigns "Thorin" to "alice@example.com"
  - Then "Thorin" is assigned to "alice@example.com"
- [ ] **A character cannot be assigned to a non-member**
  - Given the user is signed in as "owner@example.com"
  - And "owner@example.com" owns a campaign named "Sunless Citadel"
  - And "alice@example.com" is a player in "Sunless Citadel"
  - And a character named "Thorin" exists in "Sunless Citadel" with no assigned player
  - Given "bob@example.com" is not a member of "Sunless Citadel"
  - When the owner tries to assign "Thorin" to "bob@example.com"
  - Then "Thorin" has no assigned player
  - And the owner sees that the player must be a member of the campaign
- [ ] **Assigning a character to a new player replaces the previous assignee**
  - Given the user is signed in as "owner@example.com"
  - And "owner@example.com" owns a campaign named "Sunless Citadel"
  - And "alice@example.com" is a player in "Sunless Citadel"
  - And a character named "Thorin" exists in "Sunless Citadel" with no assigned player
  - Given "Thorin" is assigned to "alice@example.com"
  - And "carol@example.com" is a player in "Sunless Citadel"
  - When the owner assigns "Thorin" to "carol@example.com"
  - Then "Thorin" is assigned to "carol@example.com"
  - And "Thorin" is not assigned to "alice@example.com"
- [ ] **An owner unassigns a character**
  - Given the user is signed in as "owner@example.com"
  - And "owner@example.com" owns a campaign named "Sunless Citadel"
  - And "alice@example.com" is a player in "Sunless Citadel"
  - And a character named "Thorin" exists in "Sunless Citadel" with no assigned player
  - Given "Thorin" is assigned to "alice@example.com"
  - When the owner unassigns "Thorin"
  - Then "Thorin" has no assigned player
- [ ] **A character belongs to exactly one campaign**
  - Given the user is signed in as "owner@example.com"
  - And "owner@example.com" owns a campaign named "Sunless Citadel"
  - And "alice@example.com" is a player in "Sunless Citadel"
  - And a character named "Thorin" exists in "Sunless Citadel" with no assigned player
  - Given "owner@example.com" also owns a campaign named "Dragon Heist"
  - When the owner views the character "Thorin"
  - Then "Thorin" belongs only to "Sunless Citadel"
  - And there is no way to also place "Thorin" in "Dragon Heist"
- [ ] **A non-owner cannot assign characters**
  - Given the user is signed in as "owner@example.com"
  - And "owner@example.com" owns a campaign named "Sunless Citadel"
  - And "alice@example.com" is a player in "Sunless Citadel"
  - And a character named "Thorin" exists in "Sunless Citadel" with no assigned player
  - Given the user is signed in as "alice@example.com"
  - When the player tries to assign "Thorin" to "alice@example.com"
  - Then "Thorin" has no assigned player
  - And the player sees that they are not authorized

### `features/collaboration/data-ownership-isolation.feature`

#### Each user owns their own campaigns and characters

- [ ] **Pre-auth data is assigned to the seeded admin when auth is introduced**
  - Given a campaign named "Legacy Game" existed before authentication was introduced
  - And "admin@example.com" is the seeded admin account
  - When the ownership migration runs
  - Then "Legacy Game" is owned by "admin@example.com"
  - And every character in "Legacy Game" belongs to "Legacy Game"
- [ ] **A new user starts with no campaigns**
  - Given the user is signed in as "newbie@example.com"
  - And "newbie@example.com" owns no campaigns and has joined none
  - When "newbie@example.com" views their campaign list
  - Then the campaign list is empty
- [ ] **A user sees campaigns they own**
  - Given the user is signed in as "owner@example.com"
  - And "owner@example.com" owns a campaign named "Sunless Citadel"
  - When "owner@example.com" views their campaign list
  - Then "Sunless Citadel" appears in their campaign list
- [ ] **A user does not see another user's campaigns**
  - Given an account exists for "stranger@example.com" who owns a campaign named "Private Game"
  - And the user is signed in as "owner@example.com"
  - When "owner@example.com" views their campaign list
  - Then "Private Game" does not appear in their campaign list
- [ ] **A user cannot open another user's campaign by direct link**
  - Given an account exists for "stranger@example.com" who owns a campaign named "Private Game"
  - And the user is signed in as "owner@example.com"
  - And "owner@example.com" is not a member of "Private Game"
  - When "owner@example.com" opens the "Private Game" campaign page directly
  - Then access is denied with a 403 Forbidden
- [ ] **A joined player sees the campaign but not the owner's other campaigns**
  - Given the user is signed in as "alice@example.com"
  - And "alice@example.com" is a player in "Sunless Citadel" owned by "owner@example.com"
  - And "owner@example.com" also owns a campaign named "Secret Game" that "alice@example.com" has not joined
  - When "alice@example.com" views their campaign list
  - Then "Sunless Citadel" appears in their campaign list
  - And "Secret Game" does not appear in their campaign list
- [ ] **A user cannot see characters in a campaign they have not joined**
  - Given an account exists for "stranger@example.com" who owns a campaign named "Private Game" with a character named "Hidden Hero"
  - And the user is signed in as "owner@example.com"
  - When "owner@example.com" tries to view the characters in "Private Game"
  - Then access is denied with a 403 Forbidden
  - And "Hidden Hero" is not shown

### `features/collaboration/invite-players.feature`

#### Invite players to a campaign

- [ ] **An owner invites a registered user as a player**
  - Given the user is signed in as "owner@example.com"
  - And "owner@example.com" owns a campaign named "Sunless Citadel"
  - Given an account exists for "alice@example.com"
  - When the owner invites "alice@example.com" to "Sunless Citadel"
  - Then "alice@example.com" has a pending invite to "Sunless Citadel"
- [ ] **An unregistered email cannot be invited**
  - Given the user is signed in as "owner@example.com"
  - And "owner@example.com" owns a campaign named "Sunless Citadel"
  - Given no account exists for "nobody@example.com"
  - When the owner tries to invite "nobody@example.com" to "Sunless Citadel"
  - Then no invite is created
  - And the owner sees that only registered users can be invited
- [ ] **A pending invite does not yet grant access**
  - Given the user is signed in as "owner@example.com"
  - And "owner@example.com" owns a campaign named "Sunless Citadel"
  - Given the owner has invited "alice@example.com" to "Sunless Citadel"
  - And the invite is still pending
  - When "alice@example.com" tries to view "Sunless Citadel"
  - Then "alice@example.com" cannot view the campaign
- [ ] **The same user cannot be invited twice while a pending invite exists**
  - Given the user is signed in as "owner@example.com"
  - And "owner@example.com" owns a campaign named "Sunless Citadel"
  - Given the owner has invited "alice@example.com" to "Sunless Citadel"
  - When the owner tries to invite "alice@example.com" to "Sunless Citadel" again
  - Then no second invite is created
  - And the owner sees that an invite is already pending
- [ ] **A current member cannot be re-invited**
  - Given the user is signed in as "owner@example.com"
  - And "owner@example.com" owns a campaign named "Sunless Citadel"
  - Given "alice@example.com" is already a player in "Sunless Citadel"
  - When the owner tries to invite "alice@example.com" to "Sunless Citadel"
  - Then no invite is created
  - And the owner sees that the user is already a member
- [ ] **A non-owner cannot invite players**
  - Given the user is signed in as "owner@example.com"
  - And "owner@example.com" owns a campaign named "Sunless Citadel"
  - Given "alice@example.com" is already a player in "Sunless Citadel"
  - And the user is signed in as "alice@example.com"
  - When the player tries to invite "bob@example.com" to "Sunless Citadel"
  - Then no invite is created
  - And the player sees that they are not authorized
- [ ] **An owner removes a player from the campaign**
  - Given the user is signed in as "owner@example.com"
  - And "owner@example.com" owns a campaign named "Sunless Citadel"
  - Given "alice@example.com" is already a player in "Sunless Citadel"
  - When the owner removes "alice@example.com" from "Sunless Citadel"
  - Then "alice@example.com" is no longer a member of "Sunless Citadel"
  - And "alice@example.com" can no longer view the campaign

### `features/collaboration/manage-own-characters.feature`

#### Players manage their own characters

- [ ] **A player creates a character in a campaign they joined and is auto-assigned**
  - Given the user is signed in as "alice@example.com"
  - And "alice@example.com" is a player in "Sunless Citadel"
  - When "alice@example.com" creates a character named "Lyra" in "Sunless Citadel"
  - Then "Lyra" exists in "Sunless Citadel"
  - And "Lyra" is assigned to "alice@example.com"
- [ ] **A player edits a character assigned to them**
  - Given the user is signed in as "alice@example.com"
  - And "alice@example.com" is a player in "Sunless Citadel"
  - Given a character named "Lyra" in "Sunless Citadel" is assigned to "alice@example.com"
  - When "alice@example.com" levels up "Lyra"
  - Then the change is saved without any approval step
- [ ] **A player cannot edit another player's character**
  - Given the user is signed in as "alice@example.com"
  - And "alice@example.com" is a player in "Sunless Citadel"
  - Given "bob@example.com" is a player in "Sunless Citadel"
  - And a character named "Grog" in "Sunless Citadel" is assigned to "bob@example.com"
  - When "alice@example.com" tries to edit "Grog"
  - Then the change is not saved
  - And "alice@example.com" sees that they are not authorized
- [ ] **A player cannot create a character in a campaign they have not joined**
  - Given the user is signed in as "alice@example.com"
  - And "alice@example.com" is a player in "Sunless Citadel"
  - Given "alice@example.com" is not a member of "Waterdeep"
  - When "alice@example.com" tries to create a character in "Waterdeep"
  - Then no character is created
  - And "alice@example.com" sees that they are not a member of the campaign
- [ ] **The campaign owner can edit any character in their campaign**
  - Given the user is signed in as "alice@example.com"
  - And "alice@example.com" is a player in "Sunless Citadel"
  - Given the user is signed in as "owner@example.com"
  - And "owner@example.com" owns "Sunless Citadel"
  - And a character named "Lyra" in "Sunless Citadel" is assigned to "alice@example.com"
  - When the owner edits "Lyra"
  - Then the change is saved
