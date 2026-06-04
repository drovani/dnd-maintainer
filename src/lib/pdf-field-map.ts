/**
 * Character → PDF field mapping, split into two deliberately-separated layers:
 *
 *  1. {@link buildFieldValues} — the *semantic* layer. A pure function from the
 *     resolved character to a set of semantic keys (`strMod`, `ac`, `acrobatics`,
 *     `spellSaveDc`, …). This is the real, verifiable logic and is unit-tested
 *     hard against the resolver.
 *
 *  2. {@link TEXT_FIELD_NAMES} / {@link CHECK_FIELD_NAMES} — the *binding* layer.
 *     A thin map from those semantic keys to the form-field names of a specific
 *     fillable PDF. The names below target the widely-circulated **2014 WotC
 *     form-fillable character sheet** (the de-facto community standard; no stable
 *     2024 fillable form with documented field names is publicly distributed).
 *
 *     ⚠️ These strings are TEMPLATE-DEPENDENT. Different PDFs (official WotC, MPMB,
 *     community forms) use different field-name schemes. If your supplied template
 *     fills blank, run `form.getFields().map(f => f.getName())` on it and adjust
 *     these maps. The fill pipeline ({@link import('./pdf-export').fillCharacterPdf})
 *     reports any mapped name absent from the template rather than failing silently.
 */
import type { Character } from '@/types/database';
import type { AbilityKey } from '@/types/database';
import type { ResolvedCharacter } from '@/types/resolved';

export const PDF_ABILITIES: readonly AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;

/** Skill ids in the order they appear on the sheet, paired with their governing ability. */
export const PDF_SKILLS = [
  'acrobatics',
  'animalhandling',
  'arcana',
  'athletics',
  'deception',
  'history',
  'insight',
  'intimidation',
  'investigation',
  'medicine',
  'nature',
  'perception',
  'performance',
  'persuasion',
  'religion',
  'sleightofhand',
  'stealth',
  'survival',
] as const;

export type PdfSkillId = (typeof PDF_SKILLS)[number];

export interface PdfFieldValues {
  /** Text fields keyed by semantic name. */
  readonly text: Readonly<Record<string, string>>;
  /** Checkbox fields keyed by semantic name; true = checked. */
  readonly checks: Readonly<Record<string, boolean>>;
}

// --- semantic-key builders (shared by the value layer and the name-binding layer) ---

const scoreKey = (a: AbilityKey): string => `${a}Score`;
const modKey = (a: AbilityKey): string => `${a}Mod`;
const saveKey = (a: AbilityKey): string => `${a}Save`;
const saveProfKey = (a: AbilityKey): string => `${a}SaveProf`;
const skillKey = (s: PdfSkillId): string => s;
const skillProfKey = (s: PdfSkillId): string => `${s}Prof`;

/** Format an ability modifier / bonus with an explicit sign: 3 → "+3", -1 → "−1". */
export function signed(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

/** Humanize a kebab/lower id into a display label: "magic-initiate" → "Magic Initiate". */
function titleCase(id: string): string {
  return id
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function abilityLabel(a: AbilityKey): string {
  return {
    str: 'Strength',
    dex: 'Dexterity',
    con: 'Constitution',
    int: 'Intelligence',
    wis: 'Wisdom',
    cha: 'Charisma',
  }[a];
}

/**
 * Alignment is stored as a short code (`lg`, `ne`, …) rather than an English word,
 * so `titleCase` can't recover the display name — map the closed 9-value set here.
 * (class/species/background/subclass ids ARE their English words, so titleCase suffices.)
 */
const ALIGNMENT_NAMES: Readonly<Record<string, string>> = {
  lg: 'Lawful Good',
  ng: 'Neutral Good',
  cg: 'Chaotic Good',
  ln: 'Lawful Neutral',
  n: 'Neutral',
  cn: 'Chaotic Neutral',
  le: 'Lawful Evil',
  ne: 'Neutral Evil',
  ce: 'Chaotic Evil',
};

/**
 * Build the semantic field values for a (resolved) character. Pure — no i18n, no
 * DOM, no PDF. Every value here is verifiable against the resolver in tests.
 */
export function buildFieldValues(resolved: ResolvedCharacter, character: Character): PdfFieldValues {
  const text: Record<string, string> = {};
  const checks: Record<string, boolean> = {};

  // Identity
  text.characterName = character.name;
  text.classLevel = [character.class ? titleCase(character.class) : '', character.level]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (character.subclass) text.classLevel += ` (${titleCase(character.subclass)})`;
  text.background = character.background ? titleCase(character.background) : '';
  text.species = character.species ? titleCase(character.species) : '';
  text.alignment = character.alignment ? (ALIGNMENT_NAMES[character.alignment] ?? titleCase(character.alignment)) : '';
  text.playerName = character.player_name ?? '';

  // Abilities + saving throws
  for (const a of PDF_ABILITIES) {
    const ab = resolved.abilities[a];
    text[scoreKey(a)] = String(ab.total);
    text[modKey(a)] = signed(ab.modifier);
    const save = resolved.savingThrows[a];
    text[saveKey(a)] = signed(save.bonus);
    checks[saveProfKey(a)] = save.proficient;
  }

  // Skills
  for (const s of PDF_SKILLS) {
    const skill = resolved.skills[s];
    if (!skill) continue;
    text[skillKey(s)] = signed(skill.bonus);
    checks[skillProfKey(s)] = skill.proficient;
  }

  // Combat
  text.profBonus = signed(resolved.proficiencyBonus);
  text.armorClass = String(resolved.armorClass.effective);
  text.initiative = signed(resolved.initiative);
  text.speed = resolved.speed.walk ? `${resolved.speed.walk.value} ft` : '';
  text.maxHp = String(resolved.hitPoints.max);
  // Passive perception = 10 + Perception skill bonus.
  const perception = resolved.skills.perception;
  if (perception) text.passivePerception = String(10 + perception.bonus);

  // Attacks (the 2014 form has three weapon rows).
  resolved.attacks.slice(0, 3).forEach((atk, i) => {
    const n = i + 1;
    text[`atk${n}Name`] = titleCase(atk.weaponId);
    text[`atk${n}Bonus`] = signed(atk.attackBonus);
    const dmgBonus = atk.damageBonus !== 0 ? signed(atk.damageBonus) : '';
    text[`atk${n}Damage`] = `${atk.damageDice}${dmgBonus} ${atk.damageType}`.trim();
  });

  // Features & Traits — the 2014 form has no dedicated fields for several 2024
  // concepts (Heroic Inspiration, Exhaustion, weapon mastery, Origin Feat), so we
  // fold them into the features text block.
  const featureLines: string[] = resolved.features.map((f) => f.feature.name ?? titleCase(f.feature.id));
  if (character.heroic_inspiration) featureLines.push('Heroic Inspiration: yes');
  if (character.exhaustion_level > 0) featureLines.push(`Exhaustion: level ${character.exhaustion_level}`);
  const masteries = resolved.weaponMasteries.length > 0 ? resolved.weaponMasteries : (character.weapon_masteries ?? []);
  if (masteries.length > 0) {
    featureLines.push(
      `Weapon Mastery: ${masteries.map((m) => `${titleCase(m.weaponId)} (${titleCase(m.masteryId)})`).join(', ')}`
    );
  }
  text.featuresTraits = featureLines.join('\n');

  // Equipment
  text.equipment = resolved.equipment
    .map((it) => (it.quantity > 1 ? `${titleCase(it.itemId)} ×${it.quantity}` : titleCase(it.itemId)))
    .join('\n');

  // Personality
  text.personalityTraits = character.personality_traits ?? '';
  text.ideals = character.ideals ?? '';
  text.bonds = character.bonds ?? '';
  text.flaws = character.flaws ?? '';
  text.backstory = character.backstory ?? '';
  text.appearance = character.appearance ?? '';

  // Spellcasting
  const sc = resolved.spellcasting;
  if (sc) {
    if (sc.ability) text.spellcastingAbility = abilityLabel(sc.ability);
    if (sc.spellSaveDC != null) text.spellSaveDc = String(sc.spellSaveDC);
    if (sc.spellAttackBonus != null) text.spellAttackBonus = signed(sc.spellAttackBonus);
    if (character.class) text.spellcastingClass = titleCase(character.class);
  }

  // Heroic Inspiration also maps to the 2024 sheet's inspiration checkbox.
  checks.inspiration = character.heroic_inspiration;

  return { text, checks };
}

// --- binding layer: semantic key → 2014 WotC fillable-form field name (TEMPLATE-DEPENDENT) ---

/**
 * Maps semantic text keys to 2014 WotC form field names. Adjust to your template
 * (see module header). Keys absent here are simply not written.
 */
export const TEXT_FIELD_NAMES: Readonly<Record<string, string>> = {
  characterName: 'CharacterName',
  classLevel: 'ClassLevel',
  background: 'Background',
  species: 'Race ',
  alignment: 'Alignment',
  playerName: 'PlayerName',

  ...Object.fromEntries(
    PDF_ABILITIES.flatMap((a) => [
      [scoreKey(a), a.toUpperCase()],
      [modKey(a), `${a.toUpperCase()}mod`],
    ])
  ),
  ...Object.fromEntries(PDF_ABILITIES.map((a) => [saveKey(a), `ST ${abilityLabel(a)}`])),

  acrobatics: 'Acrobatics',
  animalhandling: 'Animal',
  arcana: 'Arcana',
  athletics: 'Athletics',
  deception: 'Deception ',
  history: 'History ',
  insight: 'Insight',
  intimidation: 'Intimidation',
  investigation: 'Investigation ',
  medicine: 'Medicine',
  nature: 'Nature',
  perception: 'Perception ',
  performance: 'Performance',
  persuasion: 'Persuasion',
  religion: 'Religion',
  sleightofhand: 'SleightofHand',
  stealth: 'Stealth ',
  survival: 'Survival',

  profBonus: 'ProfBonus',
  armorClass: 'AC',
  initiative: 'Initiative',
  speed: 'Speed',
  maxHp: 'HPMax',
  passivePerception: 'Passive',

  atk1Name: 'Wpn Name',
  atk1Bonus: 'Wpn1 AtkBonus',
  atk1Damage: 'Wpn1 Damage',
  atk2Name: 'Wpn Name 2',
  atk2Bonus: 'Wpn2 AtkBonus ',
  atk2Damage: 'Wpn2 Damage ',
  atk3Name: 'Wpn Name 3',
  atk3Bonus: 'Wpn3 AtkBonus  ',
  atk3Damage: 'Wpn3 Damage ',

  featuresTraits: 'Features and Traits',
  equipment: 'Equipment',
  personalityTraits: 'PersonalityTraits ',
  ideals: 'Ideals',
  bonds: 'Bonds',
  flaws: 'Flaws',
  backstory: 'Backstory',
  appearance: 'CharacterAppearance',
  spellcastingAbility: 'Spellcasting Ability 2',
  spellSaveDc: 'SpellSaveDC  2',
  spellAttackBonus: 'SpellAtkBonus 2',
  spellcastingClass: 'Spellcasting Class 2',
};

/**
 * Maps semantic checkbox keys to 2014 WotC form checkbox field names. The classic
 * form names proficiency checkboxes as opaque "Check Box NN" — adjust to your
 * template. Keys absent here are not written.
 */
export const CHECK_FIELD_NAMES: Readonly<Record<string, string>> = {
  ...Object.fromEntries(PDF_ABILITIES.map((a, i) => [saveProfKey(a), `Check Box ${11 + i}`])),
  ...Object.fromEntries(PDF_SKILLS.map((s, i) => [skillProfKey(s), `Check Box ${23 + i}`])),
  inspiration: 'Inspiration',
};
