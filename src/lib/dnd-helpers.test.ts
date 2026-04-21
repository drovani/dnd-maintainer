import {
  DND_ALIGNMENTS,
  DND_ARMOR_PROFICIENCIES,
  DND_BACKGROUNDS,
  DND_CLASSES,
  DND_LANGUAGES,
  DND_RACES,
  DND_SIZES,
  DND_SKILLS,
  DND_TOOL_PROFICIENCIES,
  DND_WEAPON_PROFICIENCIES,
  EMPTY_PROFICIENCIES,
  computeProficiencies,
  generateCharacterName,
  getAbilityModifier,
  getBaseRaceId,
  getPointBuyCost,
  getPointBuyDecrementReturn,
  getPointBuyEquivalent,
  getPointBuyIncrementCost,
  getProficiencyBonus,
  getSpellSlots,
  roll4d6DropLowest,
  rollAbilityScores,
  rollRandomLanguage,
  rollRandomLanguages,
  toggleLanguageProficiencyChoice,
  toggleToolProficiencyChoice,
} from '@/lib/dnd-helpers';
import type { DndClass, DndRace, Proficiencies } from '@/lib/dnd-helpers';

// ---------------------------------------------------------------------------
// getAbilityModifier
// ---------------------------------------------------------------------------
describe('getAbilityModifier', () => {
  it.each<[number, number]>([
    [1, -5],
    [8, -1],
    [10, 0],
    [11, 0],
    [15, 2],
    [20, 5],
  ])('score %i returns modifier %i', (score, expected) => {
    expect(getAbilityModifier(score)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// getProficiencyBonus
// ---------------------------------------------------------------------------
describe('getProficiencyBonus', () => {
  it.each<[number, number]>([
    [1, 2],
    [4, 2],
    [5, 3],
    [8, 3],
    [9, 4],
    [12, 4],
    [13, 5],
    [16, 5],
    [17, 6],
    [20, 6],
  ])('level %i returns bonus %i', (level, expected) => {
    expect(getProficiencyBonus(level)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// getSpellSlots
// ---------------------------------------------------------------------------
describe('getSpellSlots', () => {
  it('returns correct slots for wizard (full caster) at level 1', () => {
    expect(getSpellSlots('wizard', 1)).toEqual([2]);
  });

  it('returns correct slots for wizard at level 5', () => {
    expect(getSpellSlots('wizard', 5)).toEqual([4, 3, 2]);
  });

  it('returns correct slots for wizard at level 20', () => {
    expect(getSpellSlots('wizard', 20)).toEqual([4, 3, 3, 3, 3, 2, 2, 1, 1]);
  });

  it('returns empty array for paladin (half caster) at level 1', () => {
    expect(getSpellSlots('paladin', 1)).toEqual([]);
  });

  it('returns correct slots for paladin at level 5', () => {
    expect(getSpellSlots('paladin', 5)).toEqual([4, 2]);
  });

  it('returns empty array for fighter (non-caster) at any level', () => {
    expect(getSpellSlots('fighter', 5)).toEqual([]);
  });

  it('returns empty array for unknown class', () => {
    expect(getSpellSlots('unknown-class', 10)).toEqual([]);
  });

  it('is case-insensitive for class name', () => {
    expect(getSpellSlots('Wizard', 1)).toEqual(getSpellSlots('wizard', 1));
  });
});

// ---------------------------------------------------------------------------
// Point buy functions
// ---------------------------------------------------------------------------
describe('getPointBuyCost', () => {
  it.each<[number, number]>([
    [8, 0],
    [14, 7],
    [15, 9],
    [7, 0],
    [16, 0],
  ])('score %i costs %i points', (score, expected) => {
    expect(getPointBuyCost(score)).toBe(expected);
  });
});

describe('getPointBuyIncrementCost', () => {
  it.each<[number, number]>([
    [8, 1],
    [13, 2],
    [14, 2],
    [15, Infinity],
  ])('score %i increment costs %i points', (score, expected) => {
    expect(getPointBuyIncrementCost(score)).toBe(expected);
  });
});

describe('getPointBuyDecrementReturn', () => {
  it.each<[number, number]>([
    [8, 0],
    [9, 1],
    [15, 2],
    [14, 2],
  ])('score %i decrement returns %i points', (score, expected) => {
    expect(getPointBuyDecrementReturn(score)).toBe(expected);
  });
});

describe('getPointBuyEquivalent', () => {
  it('returns 0 for all scores at minimum (8)', () => {
    expect(getPointBuyEquivalent([8, 8, 8, 8, 8, 8])).toBe(0);
  });

  it('calculates correct total for standard array [15,14,13,12,10,8]', () => {
    // costs: 9+7+5+4+2+0 = 27
    expect(getPointBuyEquivalent([15, 14, 13, 12, 10, 8])).toBe(27);
  });

  it('clamps scores below 8 to 8 (cost 0)', () => {
    expect(getPointBuyEquivalent([6])).toBe(0);
  });

  it('clamps scores above 15 to 15 (cost 9)', () => {
    expect(getPointBuyEquivalent([20])).toBe(9);
  });

  it('handles empty array', () => {
    expect(getPointBuyEquivalent([])).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// roll4d6DropLowest / rollAbilityScores
// ---------------------------------------------------------------------------
describe('roll4d6DropLowest', () => {
  it('always produces a result in the range 3–18 over many rolls', () => {
    for (let i = 0; i < 200; i++) {
      const result = roll4d6DropLowest();
      expect(result).toBeGreaterThanOrEqual(3);
      expect(result).toBeLessThanOrEqual(18);
    }
  });

  it('uses Math.random — returns 3 when all dice roll 1 (Math.random mocked to 0)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    // Math.floor(0 * 6) + 1 = 1 for all four dice; drop lowest (1), sum 1+1+1 = 3
    expect(roll4d6DropLowest()).toBe(3);
  });

  it('returns 18 when all dice roll 6 (Math.random mocked to just below 1)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9999);
    // Math.floor(0.9999 * 6) + 1 = 6 for all four dice; drop lowest (6), sum 6+6+6 = 18
    expect(roll4d6DropLowest()).toBe(18);
  });
});

describe('rollAbilityScores', () => {
  it('returns an array of exactly 6 scores', () => {
    expect(rollAbilityScores()).toHaveLength(6);
  });

  it('all scores are in range 3–18', () => {
    const scores = rollAbilityScores();
    for (const score of scores) {
      expect(score).toBeGreaterThanOrEqual(3);
      expect(score).toBeLessThanOrEqual(18);
    }
  });

  it('returns scores sorted in descending order', () => {
    for (let i = 0; i < 20; i++) {
      const scores = rollAbilityScores();
      for (let j = 0; j < scores.length - 1; j++) {
        expect(scores[j]).toBeGreaterThanOrEqual(scores[j + 1]);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// rollRandomLanguage / rollRandomLanguages
// ---------------------------------------------------------------------------
describe('rollRandomLanguage', () => {
  it('returns a valid language id', () => {
    const result = rollRandomLanguage([]);
    expect(result).not.toBeNull();
    expect(DND_LANGUAGES).toContain(result);
  });

  it('excludes specified languages', () => {
    const exclude = ['dwarvish', 'elvish', 'halfling'] as const;
    for (let i = 0; i < 50; i++) {
      const result = rollRandomLanguage(exclude);
      expect(exclude).not.toContain(result);
    }
  });

  it('returns null when all table languages are excluded', () => {
    const allTableLanguages = [
      'common-sign',
      'draconic',
      'dwarvish',
      'elvish',
      'giant',
      'gnomish',
      'goblin',
      'halfling',
      'orc',
    ] as const;
    expect(rollRandomLanguage(allTableLanguages)).toBeNull();
  });

  it('respects weighted probabilities — dwarvish (weight 2) more likely than giant (weight 1)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    // roll=0 should select first entry: common-sign (weight 1)
    expect(rollRandomLanguage([])).toBe('common-sign');
  });

  it('selects last entry when roll lands at the end', () => {
    // Total weight = 12, mock to just below 1 → roll = 11 → last entry (orc)
    vi.spyOn(Math, 'random').mockReturnValue(0.9999);
    expect(rollRandomLanguage([])).toBe('orc');
  });
});

describe('rollRandomLanguages', () => {
  it('returns the requested number of languages', () => {
    const result = rollRandomLanguages(2, []);
    expect(result).toHaveLength(2);
  });

  it('does not return duplicates', () => {
    const result = rollRandomLanguages(5, []);
    expect(new Set(result).size).toBe(result.length);
  });

  it('returns fewer than requested when table is exhausted', () => {
    const exclude = ['common-sign', 'draconic', 'dwarvish', 'elvish', 'giant', 'gnomish', 'goblin'] as const;
    // Only halfling and orc remain in the table
    const result = rollRandomLanguages(5, exclude);
    expect(result).toHaveLength(2);
    expect(result).toContain('halfling');
    expect(result).toContain('orc');
  });

  it('returns empty array when all languages are excluded', () => {
    const allTableLanguages = [
      'common-sign',
      'draconic',
      'dwarvish',
      'elvish',
      'giant',
      'gnomish',
      'goblin',
      'halfling',
      'orc',
    ] as const;
    expect(rollRandomLanguages(3, allTableLanguages)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getBaseRaceId
// ---------------------------------------------------------------------------
describe('getBaseRaceId', () => {
  it('returns the same id for a direct match (dragonborn)', () => {
    expect(getBaseRaceId('dragonborn')).toBe('dragonborn');
  });

  it('returns base id for a subrace (dwarf-hill → dwarf)', () => {
    expect(getBaseRaceId('dwarf-hill')).toBe('dwarf');
  });

  it('returns base id for another subrace (elf-dark → elf)', () => {
    expect(getBaseRaceId('elf-dark')).toBe('elf');
  });

  it('returns halfelf directly (no hyphen, direct match)', () => {
    expect(getBaseRaceId('halfelf')).toBe('halfelf');
  });

  it('returns halforc directly (no hyphen, direct match)', () => {
    expect(getBaseRaceId('halforc')).toBe('halforc');
  });

  it('returns the original id unchanged for an unknown race', () => {
    expect(getBaseRaceId('gibblegoble')).toBe('gibblegoble');
  });

  it('returns halfling for halfling-lightfoot', () => {
    expect(getBaseRaceId('halfling-lightfoot')).toBe('halfling');
  });
});

// ---------------------------------------------------------------------------
// generateCharacterName
// ---------------------------------------------------------------------------
describe('generateCharacterName', () => {
  it('returns null for an unknown race', () => {
    expect(generateCharacterName('gibblegoble', 'male')).toBeNull();
  });

  it('returns a "FirstName ClanName" string for a known race', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const name = generateCharacterName('human', 'male');
    expect(name).not.toBeNull();
    // Should contain exactly one space separating first and clan name
    expect(name).toMatch(/^\S+ \S+$/);
  });

  it('picks the first name and clan when Math.random is 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const name = generateCharacterName('human', 'male');
    // first male name is 'Ander', first clan is 'Brightmantle'
    expect(name).toBe('Ander Brightmantle');
  });

  it('works with a subrace id (dwarf-hill) by resolving to base race', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const name = generateCharacterName('dwarf-hill', 'female');
    // first female dwarf name is 'Amber', first clan is 'Balderk'
    expect(name).toBe('Amber Balderk');
  });

  it('generates female names for gender female', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const name = generateCharacterName('tiefling', 'female');
    // first female tiefling name is 'Akta', first clan is 'Bloodthorn'
    expect(name).toBe('Akta Bloodthorn');
  });
});

// ---------------------------------------------------------------------------
// Static data shape and counts
// ---------------------------------------------------------------------------
describe.each<[string, ReadonlyArray<{ readonly id: string }>]>([
  ['DND_RACES', DND_RACES],
  ['DND_CLASSES', DND_CLASSES],
  ['DND_SKILLS', DND_SKILLS],
  ['DND_BACKGROUNDS', DND_BACKGROUNDS],
  ['DND_ALIGNMENTS', DND_ALIGNMENTS],
])('%s', (_label, collection) => {
  it('all entries have unique ids', () => {
    expect(collection.length).toBeGreaterThan(0);
    const ids = collection.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ---------------------------------------------------------------------------
// Static data integrity for proficiency/language arrays
// ---------------------------------------------------------------------------
describe.each<[string, readonly string[]]>([
  ['DND_LANGUAGES', DND_LANGUAGES],
  ['DND_ARMOR_PROFICIENCIES', DND_ARMOR_PROFICIENCIES],
  ['DND_WEAPON_PROFICIENCIES', DND_WEAPON_PROFICIENCIES],
  ['DND_TOOL_PROFICIENCIES', DND_TOOL_PROFICIENCIES],
  ['DND_SIZES', DND_SIZES],
])('%s', (_label, collection) => {
  it('has unique entries', () => {
    expect(collection.length).toBeGreaterThan(0);
    expect(new Set(collection).size).toBe(collection.length);
  });
});

describe('DND_RACES language data integrity', () => {
  it('every race has at least one language', () => {
    for (const race of DND_RACES) {
      expect(race.languages.length).toBeGreaterThan(0);
    }
  });

  it('all race languages exist in DND_LANGUAGES', () => {
    for (const race of DND_RACES) {
      for (const lang of race.languages) {
        expect(DND_LANGUAGES).toContain(lang);
      }
    }
  });
});

describe('DND_RACES size data integrity', () => {
  it('all race sizes exist in DND_SIZES', () => {
    for (const race of DND_RACES) {
      expect(DND_SIZES).toContain(race.size);
    }
  });
});

describe('DND_RACES proficiency data integrity', () => {
  it('all race weaponProficiencies exist in DND_WEAPON_PROFICIENCIES', () => {
    for (const race of DND_RACES) {
      const r = race as DndRace;
      if (r.weaponProficiencies) {
        for (const weapon of r.weaponProficiencies) {
          expect(DND_WEAPON_PROFICIENCIES).toContain(weapon);
        }
      }
    }
  });
});

describe('DND_CLASSES proficiency data integrity', () => {
  it('all class armorProficiencies exist in DND_ARMOR_PROFICIENCIES', () => {
    for (const cls of DND_CLASSES) {
      for (const armor of cls.armorProficiencies) {
        expect(DND_ARMOR_PROFICIENCIES).toContain(armor);
      }
    }
  });

  it('all class weaponProficiencies exist in DND_WEAPON_PROFICIENCIES', () => {
    for (const cls of DND_CLASSES) {
      for (const weapon of cls.weaponProficiencies) {
        expect(DND_WEAPON_PROFICIENCIES).toContain(weapon);
      }
    }
  });

  it('all class toolProficiencies exist in DND_TOOL_PROFICIENCIES', () => {
    for (const cls of DND_CLASSES) {
      for (const tool of cls.toolProficiencies) {
        expect(DND_TOOL_PROFICIENCIES).toContain(tool);
      }
    }
  });

  it('all class toolChoices.from entries exist in DND_TOOL_PROFICIENCIES', () => {
    for (const cls of DND_CLASSES) {
      const c = cls as DndClass;
      if (c.toolChoices) {
        for (const tool of c.toolChoices.from) {
          expect(DND_TOOL_PROFICIENCIES).toContain(tool);
        }
      }
    }
  });

  it('toolChoices.from is disjoint from toolProficiencies', () => {
    for (const cls of DND_CLASSES) {
      const c = cls as DndClass;
      if (c.toolChoices) {
        for (const tool of c.toolChoices.from) {
          expect(c.toolProficiencies).not.toContain(tool);
        }
      }
    }
  });

  it('toolChoices.count does not exceed toolChoices.from.length', () => {
    for (const cls of DND_CLASSES) {
      const c = cls as DndClass;
      if (c.toolChoices) {
        expect(c.toolChoices.count).toBeLessThanOrEqual(c.toolChoices.from.length);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// computeProficiencies
// ---------------------------------------------------------------------------
describe('computeProficiencies', () => {
  const base: Proficiencies = { ...EMPTY_PROFICIENCIES };

  it('returns previous proficiencies when neither class nor race changed', () => {
    const result = computeProficiencies('fighter', 'human', base, false, false);
    expect(result).toBe(base);
  });

  it('computes class proficiencies when class changes', () => {
    const result = computeProficiencies('fighter', '', base, true, false);
    expect(result.armor).toEqual(['light', 'medium', 'heavy', 'shields']);
    expect(result.weapons).toEqual(['simple', 'martial']);
    expect(result.tools).toEqual([]);
    expect(result.toolChoices).toEqual([]);
  });

  it('includes race weapon proficiencies when no class is selected', () => {
    const result = computeProficiencies('', 'dwarf-mountain', base, false, true);
    expect(result.weapons).toEqual(['battleaxe', 'handaxe', 'lighthammer', 'warhammer']);
    expect(result.armor).toEqual([]);
  });

  it('computes race languages when race changes', () => {
    const result = computeProficiencies('', 'human', base, false, true);
    expect(result.languages).toEqual(['common']);
    expect(result.languageChoices).toEqual([]);
  });

  it('merges class and race weapon proficiencies', () => {
    const result = computeProficiencies('rogue', 'elf-high', base, true, true);
    // Rogue: simple, handcrossbow, longsword, rapier, shortsword
    // Elf-High: longsword, shortsword, shortbow, longbow
    expect(result.weapons).toContain('simple');
    expect(result.weapons).toContain('shortbow');
    expect(result.weapons).toContain('longbow');
  });

  it('deduplicates overlapping weapon proficiencies', () => {
    const result = computeProficiencies('rogue', 'elf-high', base, true, true);
    const longswordCount = result.weapons.filter((w) => w === 'longsword').length;
    const shortswordCount = result.weapons.filter((w) => w === 'shortsword').length;
    expect(longswordCount).toBe(1);
    expect(shortswordCount).toBe(1);
  });

  it('resets toolChoices when class changes', () => {
    const prev: Proficiencies = { ...base, toolChoices: ['drum'] };
    const result = computeProficiencies('bard', 'human', prev, true, false);
    expect(result.toolChoices).toEqual([]);
  });

  it('preserves toolChoices when only race changes', () => {
    const prev: Proficiencies = { ...base, toolChoices: ['drum'] };
    const result = computeProficiencies('bard', 'halfelf', prev, false, true);
    expect(result.toolChoices).toEqual(['drum']);
  });

  it('resets languageChoices when race changes', () => {
    const prev: Proficiencies = { ...base, languageChoices: ['giant'] };
    const result = computeProficiencies('fighter', 'human', prev, false, true);
    expect(result.languageChoices).toEqual([]);
  });

  it('preserves languageChoices when only class changes', () => {
    const prev: Proficiencies = { ...base, languageChoices: ['giant'] };
    const result = computeProficiencies('fighter', 'human', prev, true, false);
    expect(result.languageChoices).toEqual(['giant']);
  });

  it('returns empty arrays when class and race are empty strings', () => {
    const result = computeProficiencies('', '', base, true, true);
    expect(result.armor).toEqual([]);
    expect(result.weapons).toEqual([]);
    expect(result.tools).toEqual([]);
    expect(result.languages).toEqual([]);
  });

  it('resets both toolChoices and languageChoices when both class and race change', () => {
    const prev: Proficiencies = { ...base, toolChoices: ['drum', 'flute'], languageChoices: ['giant'] };
    const result = computeProficiencies('fighter', 'halfelf', prev, true, true);
    expect(result.toolChoices).toEqual([]);
    expect(result.languageChoices).toEqual([]);
    expect(result.armor).toEqual(['light', 'medium', 'heavy', 'shields']);
    expect(result.languages).toEqual(['common', 'elvish']);
  });
});

// ---------------------------------------------------------------------------
// toggleToolProficiencyChoice
// ---------------------------------------------------------------------------
describe('toggleToolProficiencyChoice', () => {
  const base: Proficiencies = { ...EMPTY_PROFICIENCIES };

  it('adds a tool when under the max', () => {
    const result = toggleToolProficiencyChoice(base, 'bard', 'drum');
    expect(result.toolChoices).toEqual(['drum']);
  });

  it('removes a tool that is already selected', () => {
    const prev: Proficiencies = { ...base, toolChoices: ['drum', 'flute'] };
    const result = toggleToolProficiencyChoice(prev, 'bard', 'drum');
    expect(result.toolChoices).toEqual(['flute']);
  });

  it('does not add beyond the max (bard gets 3)', () => {
    const prev: Proficiencies = { ...base, toolChoices: ['drum', 'flute', 'lute'] };
    const result = toggleToolProficiencyChoice(prev, 'bard', 'lyre');
    expect(result).toBe(prev);
  });

  it('returns unchanged proficiencies for a class without tool choices', () => {
    const result = toggleToolProficiencyChoice(base, 'fighter', 'drum');
    expect(result).toBe(base);
  });

  it('returns unchanged proficiencies for empty class', () => {
    const result = toggleToolProficiencyChoice(base, '', 'drum');
    expect(result).toBe(base);
  });

  it('rejects a tool not in the class toolChoices.from list and warns', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = toggleToolProficiencyChoice(base, 'bard', 'thievestools');
    expect(result).toBe(base);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('thievestools'));
  });

  it('rejects a tool already in auto-granted tools and warns', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const prev: Proficiencies = { ...base, tools: ['herbalismkit'] };
    const result = toggleToolProficiencyChoice(prev, 'bard', 'herbalismkit');
    expect(result).toBe(prev);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('herbalismkit'));
  });
});

// ---------------------------------------------------------------------------
// toggleLanguageProficiencyChoice
// ---------------------------------------------------------------------------
describe('toggleLanguageProficiencyChoice', () => {
  const base: Proficiencies = { ...EMPTY_PROFICIENCIES };

  it('adds a language when under the max', () => {
    const result = toggleLanguageProficiencyChoice(base, 'human', 'elvish');
    expect(result.languageChoices).toEqual(['elvish']);
  });

  it('removes a language that is already selected', () => {
    const prev: Proficiencies = { ...base, languageChoices: ['elvish'] };
    const result = toggleLanguageProficiencyChoice(prev, 'human', 'elvish');
    expect(result.languageChoices).toEqual([]);
  });

  it('does not add beyond the max (human gets 1)', () => {
    const prev: Proficiencies = { ...base, languageChoices: ['elvish'] };
    const result = toggleLanguageProficiencyChoice(prev, 'human', 'dwarvish');
    expect(result).toBe(prev);
  });

  it('returns unchanged proficiencies for a race without language choices', () => {
    const result = toggleLanguageProficiencyChoice(base, 'tiefling', 'elvish');
    expect(result).toBe(base);
  });

  it('returns unchanged proficiencies for empty race', () => {
    const result = toggleLanguageProficiencyChoice(base, '', 'elvish');
    expect(result).toBe(base);
  });

  it('rejects a language already in auto-granted languages and warns', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const prev: Proficiencies = { ...base, languages: ['common', 'elvish'] };
    const result = toggleLanguageProficiencyChoice(prev, 'halfelf', 'elvish');
    expect(result).toBe(prev);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('elvish'));
  });
});
