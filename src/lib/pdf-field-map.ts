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
 *     fillable PDF. The names below target the **official 2024 WotC fillable
 *     character sheet** (© 2024 Wizards of the Coast). That sheet ships with
 *     auto-generated, semantically-opaque field names (`Text1`, `Check Box37`,
 *     `Text105.0`, …), so the binding values look meaningless on their own — the
 *     `// → label` comment on each line records what cell the field actually is.
 *
 *     ⚠️ These strings are TEMPLATE-DEPENDENT. A different PDF (2014 WotC, MPMB,
 *     other community forms) uses a different field-name scheme. If your supplied
 *     template fills blank, run `form.getFields().map(f => f.getName())` on it and
 *     adjust these maps. The fill pipeline ({@link import('./pdf-export').fillCharacterPdf})
 *     reports any mapped name absent from the template rather than failing silently.
 */
import type { TFunction } from 'i18next';
import type { Character } from '@/types/database';
import type { AbilityKey } from '@/types/database';
import type { ResolvedCharacter, ResolvedFeature } from '@/types/resolved';
import { parseChoiceKey, type ChoiceDecision } from '@/types/choices';
import type { GrantBundle, SourceTag } from '@/types/sources';
import { getItemNameKey } from '@/lib/sources/items';
import { getSourceDisplayName } from '@/lib/class-icons';

/** Gamedata i18n translator. All user-facing text in the export comes from i18n — ids are never user-facing. */
export type GamedataT = TFunction<'gamedata'>;

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

/** The 2024 sheet's "Weapons & Damage Cantrips" table has six rows. */
const PDF_ATTACK_ROWS = 6;

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

/**
 * Display name for the exported PDF's filename. A PC with a player reads as
 * "Character (Player)" so files are easy to tell apart; NPCs (and PCs without a
 * player) use just the character name. The in-sheet name field uses the bare
 * character name — the 2024 sheet has no player-name field.
 */
export function characterDisplayName(character: Character): string {
  return character.character_type === 'pc' && character.player_name
    ? `${character.name} (${character.player_name})`
    : character.name;
}

/** i18n display name for a granted feature (class feature or species trait). */
function featureLabel(f: ResolvedFeature, t: GamedataT): string {
  return t(`features.${f.feature.id}.name` as `features.${string}.name`, { defaultValue: f.feature.id });
}

/** "Name — description" line for a feature, with the i18n description appended when present. */
function featureLine(f: ResolvedFeature, t: GamedataT): string {
  const name = featureLabel(f, t);
  const desc = t(`features.${f.feature.id}.description` as `features.${string}.description`, { defaultValue: '' });
  return desc ? `${name} — ${desc}` : name;
}

/** What granted a feat, plus the feat's own in-feat choices (e.g. Skilled's chosen skills). */
export interface FeatGrantInfo {
  /** The source that granted the feat (background origin feat, species feat-choice, class/subclass ASI). */
  readonly source: SourceTag;
  /** Decisions made for the feat's own choices (keyed `…:feat:<featId>:…` in the build). */
  readonly decisions: readonly ChoiceDecision[];
}

/**
 * Map each feat the character has to {@link FeatGrantInfo}. The granter comes from the
 * grant bundles: a `feat` grant's granter is its bundle's source; a resolved `feat-choice`
 * decision's granter is the bundle that offered the choice. The feat's own choices (a
 * feat-origin choice key, e.g. Skilled's `skill-choice:feat:skilled:0`) are gathered from
 * `choices`. Drives the "Skilled (Human): Nature" rendering. First writer wins.
 */
export function collectFeatSources(
  bundles: readonly GrantBundle[],
  choices: Readonly<Record<string, ChoiceDecision>>
): ReadonlyMap<string, FeatGrantInfo> {
  const sources = new Map<string, SourceTag>();
  for (const bundle of bundles) {
    for (const grant of bundle.grants) {
      if (grant.type === 'feat') {
        if (!sources.has(grant.featId)) sources.set(grant.featId, bundle.source);
      } else if (grant.type === 'feat-choice') {
        const decision = choices[grant.key];
        if (decision?.type === 'feat-choice' && !sources.has(decision.featId)) {
          sources.set(decision.featId, bundle.source);
        }
      }
    }
  }

  // Gather each feat's own choice decisions (feat-origin choice keys) for granted feats.
  const decisions = new Map<string, ChoiceDecision[]>();
  for (const [key, decision] of Object.entries(choices)) {
    let parsed: ReturnType<typeof parseChoiceKey>;
    try {
      parsed = parseChoiceKey(key);
    } catch {
      continue;
    }
    if (parsed.origin !== 'feat' || !sources.has(parsed.id)) continue;
    const list = decisions.get(parsed.id) ?? [];
    list.push(decision);
    decisions.set(parsed.id, list);
  }

  const result = new Map<string, FeatGrantInfo>();
  for (const [featId, source] of sources) {
    result.set(featId, { source, decisions: decisions.get(featId) ?? [] });
  }
  return result;
}

/** Format a choice decision's chosen values as localized display strings (for feat choice summaries). */
function formatDecisionValues(d: ChoiceDecision, t: GamedataT): readonly string[] {
  switch (d.type) {
    case 'skill-choice':
      return d.skills.map((s) => t(`skills.${s}` as `skills.${string}`, { defaultValue: s }));
    case 'tool-choice':
      return d.tools.map((x) => t(`tools.${x}` as `tools.${string}`, { defaultValue: x }));
    case 'language-choice':
      return d.languages.map((x) => t(`languages.${x}` as `languages.${string}`, { defaultValue: x }));
    case 'spell-choice':
      return d.spellIds.map((x) => t(`spells.${x}.name` as `spells.${string}.name`, { defaultValue: x }));
    case 'ability-choice':
      return d.abilities.map((a) => t(`abilities.${a}`, { defaultValue: a }));
    case 'damage-choice':
      return d.damageTypes.map((x) => t(`damageTypes.${x}` as `damageTypes.${string}`, { defaultValue: x }));
    case 'feature-choice':
      return [t(`features.${d.optionId}.name` as `features.${string}.name`, { defaultValue: d.optionId })];
    case 'feat-choice':
      return [t(`feats.${d.featId}.name` as `feats.${string}.name`, { defaultValue: d.featId })];
    default:
      return [];
  }
}

/**
 * Build the semantic field values for a (resolved) character. All user-facing text
 * comes from the gamedata i18n translator `t` — ids are never user-facing. `featSources`
 * (see {@link collectFeatSources}) attributes each feat to its granter. No DOM, no PDF.
 *
 * Shaped for the 2024 WotC sheet: Class / Subclass / Level are distinct fields,
 * features are split into Class Features / Species Traits / Feats, and personality
 * + backstory are merged into one block (the sheet has a single combined section).
 */
export function buildFieldValues(
  resolved: ResolvedCharacter,
  character: Character,
  t: GamedataT,
  featSources: ReadonlyMap<string, FeatGrantInfo>
): PdfFieldValues {
  const text: Record<string, string> = {};
  const checks: Record<string, boolean> = {};

  // Identity — the 2024 sheet has separate Class, Subclass and Level fields and no
  // Player Name field, so the name field is just the character name.
  text.characterName = character.name;
  if (character.class)
    text.class = t(`classes.${character.class}` as `classes.${string}`, { defaultValue: character.class });
  if (character.subclass)
    text.subclass = t(`subclasses.${character.subclass}.name` as `subclasses.${string}.name`, {
      defaultValue: character.subclass,
    });
  text.level = String(character.level);
  text.species = character.species
    ? t(`species.${character.species}` as `species.${string}`, { defaultValue: character.species })
    : '';
  text.background = character.background
    ? t(`backgrounds.${character.background}` as `backgrounds.${string}`, { defaultValue: character.background })
    : '';
  text.alignment = character.alignment
    ? t(`alignments.${character.alignment}` as `alignments.${string}`, { defaultValue: character.alignment })
    : '';
  // The 2024 sheet's Size box wants a single-letter abbreviation (S / M / L / …), taken
  // from the first letter of the localized size name.
  if (character.size) {
    text.size = t(`sizes.${character.size}` as `sizes.${string}`, { defaultValue: character.size })
      .charAt(0)
      .toUpperCase();
  }

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
  // No current-HP concept in the build model; a freshly-built character starts at full.
  text.currentHp = String(resolved.hitPoints.max);
  // Hit Dice maximum is fixed by level (one die per class level): "5d10", or
  // "3d10 + 2d6" when multiclassed. Spent hit dice aren't tracked in the build model.
  if (resolved.hitDie.length > 0) {
    text.hitDiceMax = resolved.hitDie.map((hd) => `${hd.count}d${hd.die}`).join(' + ');
  }
  // Passive perception = 10 + Perception skill bonus.
  const perception = resolved.skills.perception;
  if (perception) text.passivePerception = String(10 + perception.bonus);

  // Attacks (the 2024 sheet has six weapon rows).
  resolved.attacks.slice(0, PDF_ATTACK_ROWS).forEach((atk, i) => {
    const n = i + 1;
    text[`atk${n}Name`] = t(getItemNameKey('weapon', atk.weaponId), { defaultValue: atk.weaponId });
    text[`atk${n}Bonus`] = signed(atk.attackBonus);
    const dmgBonus = atk.damageBonus !== 0 ? signed(atk.damageBonus) : '';
    const dmgType = t(`damageTypes.${atk.damageType}`, { defaultValue: atk.damageType });
    text[`atk${n}Damage`] = `${atk.damageDice}${dmgBonus} ${dmgType}`.trim();
  });

  // Features — the 2024 sheet has dedicated Class Features, Species Traits and
  // Feats sections, so we split by grant origin rather than lumping them together.
  // Each line carries the feature's i18n description (where one exists), so the sheet
  // shows what a feature does — including reset/usage wording when the text has it.
  // Species features go to Species Traits and feat-granted features are listed in the
  // Feats block (from featSources); everything else — class/subclass plus
  // background/item/loot-granted features (e.g. a background's Magic Initiate) — folds
  // into Class Features so no resolved feature is silently dropped from the sheet.
  const classFeatureLines: string[] = resolved.features
    .filter((f) => f.source.origin !== 'species' && f.source.origin !== 'feat')
    .map((f) => featureLine(f, t));
  // 2024 concepts with no dedicated field are folded into the class-features block.
  if (character.exhaustion_level > 0) classFeatureLines.push(`Exhaustion: level ${character.exhaustion_level}`);
  const masteries = resolved.weaponMasteries.length > 0 ? resolved.weaponMasteries : (character.weapon_masteries ?? []);
  if (masteries.length > 0) {
    const masteryList = masteries
      .map(
        (m) =>
          `${t(getItemNameKey('weapon', m.weaponId), { defaultValue: m.weaponId })} ` +
          `(${t(`weaponMasteries.${m.masteryId}.name`, { defaultValue: m.masteryId })})`
      )
      .join(', ');
    classFeatureLines.push(`Weapon Mastery: ${masteryList}`);
  }
  text.classFeatures = classFeatureLines.join('\n');
  text.speciesTraits = resolved.features
    .filter((f) => f.source.origin === 'species')
    .map((f) => featureLine(f, t))
    .join('\n');
  // Feats: listed from the granted-feat map (not resolved.features, since some feats
  // grant no feature). Format: "Name (Source): chosen options — description", e.g.
  // "Skilled (Human): Nature, Athletics — Gain proficiency in any combination of …".
  text.feats = Array.from(featSources.entries())
    .map(([featId, info]) => {
      const name = t(`feats.${featId}.name` as `feats.${string}.name`, { defaultValue: featId });
      const granterLabel = getSourceDisplayName(info.source, t);
      const head = granterLabel ? `${name} (${granterLabel})` : name;
      const choiceStr = info.decisions.flatMap((d) => formatDecisionValues(d, t)).join(', ');
      const desc = t(`feats.${featId}.description` as `feats.${string}.description`, { defaultValue: '' });
      return `${head}${choiceStr ? `: ${choiceStr}` : ''}${desc ? ` — ${desc}` : ''}`;
    })
    .join('\n');

  // Proficiency text blocks (the sheet has free-text Weapons / Tools lines + a
  // Languages box). Heroic Inspiration also maps to the sheet's checkbox.
  text.weaponProficienciesText = resolved.weaponProficiencies
    .map((p) => t(`weapons.${p.value}` as `weapons.${string}`, { defaultValue: p.value }))
    .join(', ');
  text.toolProficienciesText = resolved.toolProficiencies
    .map((p) => t(`tools.${p.value}` as `tools.${string}`, { defaultValue: p.value }))
    .join(', ');
  text.languages = resolved.languages
    .map((l) => t(`languages.${l.value}` as `languages.${string}`, { defaultValue: l.value }))
    .join(', ');

  // Armor Training checkboxes. The sheet distinguishes only Light/Medium/Heavy/Shields,
  // so the "-nonmetal" variants collapse onto their base category.
  const armorIds = new Set(resolved.armorProficiencies.map((p) => p.value));
  checks.armorLight = armorIds.has('light');
  checks.armorMedium = armorIds.has('medium') || armorIds.has('medium-nonmetal');
  checks.armorHeavy = armorIds.has('heavy');
  checks.armorShields = armorIds.has('shields') || armorIds.has('shields-nonmetal');

  // Equipment
  text.equipment = resolved.equipment
    .map((it) => {
      const name = t(getItemNameKey(it.itemDef.type, it.itemId), { defaultValue: it.itemId });
      return it.quantity > 1 ? `${name} ×${it.quantity}` : name;
    })
    .join('\n');

  // Appearance + the combined Backstory & Personality block.
  text.appearance = character.appearance ?? '';
  text.backstory = [
    character.backstory,
    character.personality_traits ? `Personality Traits: ${character.personality_traits}` : '',
    character.ideals ? `Ideals: ${character.ideals}` : '',
    character.bonds ? `Bonds: ${character.bonds}` : '',
    character.flaws ? `Flaws: ${character.flaws}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  // Spellcasting
  const sc = resolved.spellcasting;
  if (sc) {
    if (sc.ability) {
      text.spellcastingAbility = t(`abilities.${sc.ability}`, { defaultValue: sc.ability });
      text.spellcastingModifier = signed(resolved.abilities[sc.ability].modifier);
    }
    if (sc.spellSaveDC != null) text.spellSaveDc = String(sc.spellSaveDC);
    if (sc.spellAttackBonus != null) text.spellAttackBonus = signed(sc.spellAttackBonus);
  }

  // Heroic Inspiration → the 2024 sheet's inspiration checkbox.
  checks.inspiration = character.heroic_inspiration;

  return { text, checks };
}

// --- binding layer: semantic key → 2024 WotC field name (TEMPLATE-DEPENDENT) ---
//
// The official 2024 sheet uses opaque auto-generated names. Per-ability and per-skill
// fields don't follow a derivable pattern, so they're enumerated explicitly. Each
// `// → …` comment names the cell the field occupies on the sheet.

const ABILITY_MOD_FIELD: Readonly<Record<AbilityKey, string>> = {
  str: 'Text21',
  dex: 'Text22',
  con: 'Text24',
  int: 'Text20',
  wis: 'Text23',
  cha: 'Text25',
};
const ABILITY_SCORE_FIELD: Readonly<Record<AbilityKey, string>> = {
  str: 'Text64',
  dex: 'Text66',
  con: 'Text67',
  int: 'Text63',
  wis: 'Text65',
  cha: 'Text68',
};
const ABILITY_SAVE_FIELD: Readonly<Record<AbilityKey, string>> = {
  str: 'Text91',
  dex: 'Text87',
  con: 'Text86',
  int: 'Text69',
  wis: 'Text75',
  cha: 'Text81',
};
const ABILITY_SAVE_PROF_FIELD: Readonly<Record<AbilityKey, string>> = {
  str: 'Check Box37',
  dex: 'Check Box33',
  con: 'Check Box32',
  int: 'Check Box4',
  wis: 'Check Box21',
  cha: 'Check Box26',
};

const SKILL_FIELD: Readonly<Record<PdfSkillId, string>> = {
  acrobatics: 'Text88',
  animalhandling: 'Text76',
  arcana: 'Text70',
  athletics: 'Text92',
  deception: 'Text82',
  history: 'Text71',
  insight: 'Text77',
  intimidation: 'Text83',
  investigation: 'Text72',
  medicine: 'Text78',
  nature: 'Text73',
  perception: 'Text79',
  performance: 'Text84',
  persuasion: 'Text85',
  religion: 'Text74',
  sleightofhand: 'Text89',
  stealth: 'Text90',
  survival: 'Text80',
};
const SKILL_PROF_FIELD: Readonly<Record<PdfSkillId, string>> = {
  acrobatics: 'Check Box34',
  animalhandling: 'Check Box22',
  arcana: 'Check Box16',
  athletics: 'Check Box38',
  deception: 'Check Box27',
  history: 'Check Box17',
  insight: 'Check Box23',
  intimidation: 'Check Box28',
  investigation: 'Check Box19',
  medicine: 'Check Box25',
  nature: 'Check Box20',
  perception: 'Check Box31',
  performance: 'Check Box30',
  persuasion: 'Check Box29',
  religion: 'Check Box18',
  sleightofhand: 'Check Box35',
  stealth: 'Check Box36',
  survival: 'Check Box24',
};

// Weapons & Damage Cantrips table — six rows of [Name, Atk/DC, Damage&Type].
const ATTACK_NAME_FIELDS = ['Text30', 'Text34', 'Text38', 'Text42', 'Text46', 'Text50'] as const;
const ATTACK_BONUS_FIELDS = ['Text31', 'Text35', 'Text39', 'Text43', 'Text47', 'Text51'] as const;
const ATTACK_DAMAGE_FIELDS = ['Text32', 'Text36', 'Text40', 'Text44', 'Text48', 'Text52'] as const;

/**
 * Maps semantic text keys to 2024 WotC form field names. Adjust to your template
 * (see module header). Keys absent here are simply not written.
 */
export const TEXT_FIELD_NAMES: Readonly<Record<string, string>> = {
  characterName: 'Text1', // → Character Name
  background: 'Text6', // → Background
  class: 'Text7', // → Class
  species: 'Text8', // → Species
  subclass: 'Text9', // → Subclass
  level: 'Text11', // → Level
  alignment: 'Text100', // → Alignment (page 2)
  size: 'Text28', // → Size

  ...Object.fromEntries(
    PDF_ABILITIES.flatMap((a) => [
      [scoreKey(a), ABILITY_SCORE_FIELD[a]],
      [modKey(a), ABILITY_MOD_FIELD[a]],
      [saveKey(a), ABILITY_SAVE_FIELD[a]],
    ])
  ),
  ...Object.fromEntries(PDF_SKILLS.map((s) => [skillKey(s), SKILL_FIELD[s]])),

  profBonus: 'Text19', // → Proficiency Bonus
  armorClass: 'Text13', // → Armor Class
  initiative: 'Text26', // → Initiative
  speed: 'Text27', // → Speed
  maxHp: 'Text16', // → Hit Points Max
  currentHp: 'Text14', // → Hit Points Current
  hitDiceMax: 'Text17', // → Hit Dice Max
  passivePerception: 'Text29', // → Passive Perception

  ...Object.fromEntries(
    Array.from({ length: PDF_ATTACK_ROWS }, (_unused, i) => [
      [`atk${i + 1}Name`, ATTACK_NAME_FIELDS[i]],
      [`atk${i + 1}Bonus`, ATTACK_BONUS_FIELDS[i]],
      [`atk${i + 1}Damage`, ATTACK_DAMAGE_FIELDS[i]],
    ]).flat()
  ),

  classFeatures: 'Text54', // → Class Features
  speciesTraits: 'Text57', // → Species Traits
  feats: 'Text58', // → Feats
  weaponProficienciesText: 'Text59', // → Equipment Training & Proficiencies: Weapons
  toolProficienciesText: 'Text60', // → Equipment Training & Proficiencies: Tools
  languages: 'Text98', // → Languages (page 2)
  equipment: 'Text99', // → Equipment (page 2)
  appearance: 'Text96', // → Appearance (page 2)
  backstory: 'Text97', // → Backstory & Personality (page 2)

  spellcastingAbility: 'Text111', // → Spellcasting Ability (page 2)
  spellcastingModifier: 'Text93', // → Spellcasting Modifier (page 2)
  spellSaveDc: 'Text94', // → Spell Save DC (page 2)
  spellAttackBonus: 'Text95', // → Spell Attack Bonus (page 2)
};

/**
 * Maps semantic checkbox keys to 2024 WotC form checkbox field names. Adjust to
 * your template (see module header). Keys absent here are not written.
 */
export const CHECK_FIELD_NAMES: Readonly<Record<string, string>> = {
  ...Object.fromEntries(PDF_ABILITIES.map((a) => [saveProfKey(a), ABILITY_SAVE_PROF_FIELD[a]])),
  ...Object.fromEntries(PDF_SKILLS.map((s) => [skillProfKey(s), SKILL_PROF_FIELD[s]])),
  inspiration: 'Check Box11', // → Heroic Inspiration
  armorLight: 'Check Box13', // → Armor Training: Light
  armorMedium: 'Check Box14', // → Armor Training: Medium
  armorHeavy: 'Check Box15', // → Armor Training: Heavy
  armorShields: 'Check Box12', // → Armor Training: Shields
};
