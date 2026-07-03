import type {
  AbilityKey,
  ClassId,
  FeatId,
  FightingStyleId,
  SkillId,
  ArmorProficiencyId,
  WeaponProficiencyId,
  ToolProficiencyId,
  LanguageId,
  SpeciesId,
} from '@/lib/dnd-helpers';
import type { ChoiceKey } from '@/types/choices';
import type { BundleCategory } from '@/types/items';
import type { FeatCategory } from '@/types/sources';
import type { SpellDef } from '@/types/spells';

// Supporting types

export type UnarmoredFormula = 'barbarian' | 'monk' | 'dance';

export type AcCalculation =
  | { readonly mode: 'armored' }
  | { readonly mode: 'unarmored'; readonly formula: UnarmoredFormula }
  | { readonly mode: 'natural'; readonly baseAc: number };

export const DAMAGE_TYPES = [
  'acid',
  'bludgeoning',
  'cold',
  'fire',
  'force',
  'lightning',
  'necrotic',
  'piercing',
  'poison',
  'psychic',
  'radiant',
  'slashing',
  'thunder',
] as const;

export type DamageTypeId = (typeof DAMAGE_TYPES)[number];

export interface FeatureDef {
  readonly id: string;
  readonly name?: string;
  readonly description?: string;
  readonly usesPerRest?: 'short' | 'long';
  readonly usesCount?: number;
  /**
   * When present, the resolver computes a save DC as 8 + proficiencyBonus + abilities[dcAbility].modifier
   * and exposes it on `ResolvedFeature.saveDC`. Used for features that force targets to make saves.
   */
  readonly saveDC?: { readonly dcAbility: AbilityKey };
}

// Grant variants

export interface AbilityBonusGrant {
  readonly type: 'ability-bonus';
  readonly ability: AbilityKey;
  readonly bonus: number;
}

export interface AbilityChoiceGrant {
  readonly type: 'ability-choice';
  readonly key: ChoiceKey;
  readonly count: number;
  readonly bonus: number;
  readonly from: readonly AbilityKey[] | null;
}

export type ProficiencyGrant =
  | { readonly type: 'proficiency'; readonly category: 'armor'; readonly id: ArmorProficiencyId }
  | { readonly type: 'proficiency'; readonly category: 'weapon'; readonly id: WeaponProficiencyId }
  | { readonly type: 'proficiency'; readonly category: 'tool'; readonly id: ToolProficiencyId }
  | { readonly type: 'proficiency'; readonly category: 'skill'; readonly id: SkillId }
  | { readonly type: 'proficiency'; readonly category: 'saving-throw'; readonly id: AbilityKey }
  | { readonly type: 'proficiency'; readonly category: 'language'; readonly id: LanguageId };

export type ProficiencyChoiceGrant =
  | {
      readonly type: 'proficiency-choice';
      readonly category: 'armor';
      readonly key: ChoiceKey;
      readonly count: number;
      readonly from: readonly ArmorProficiencyId[] | null;
    }
  | {
      readonly type: 'proficiency-choice';
      readonly category: 'weapon';
      readonly key: ChoiceKey;
      readonly count: number;
      readonly from: readonly WeaponProficiencyId[] | null;
    }
  | {
      readonly type: 'proficiency-choice';
      readonly category: 'tool';
      readonly key: ChoiceKey;
      readonly count: number;
      readonly from: readonly ToolProficiencyId[] | null;
    }
  | {
      readonly type: 'proficiency-choice';
      readonly category: 'skill';
      readonly key: ChoiceKey;
      readonly count: number;
      readonly from: readonly SkillId[] | null;
    }
  | {
      readonly type: 'proficiency-choice';
      readonly category: 'language';
      readonly key: ChoiceKey;
      readonly count: number;
      readonly from: readonly LanguageId[] | null;
    }
  | {
      readonly type: 'proficiency-choice';
      readonly category: 'saving-throw';
      readonly key: ChoiceKey;
      readonly count: number;
      readonly from: readonly AbilityKey[] | null;
    };

export interface SkillExpertiseGrant {
  readonly type: 'skill-expertise';
  readonly skill: SkillId;
}

export interface ExpertiseChoiceGrant {
  readonly type: 'expertise-choice';
  readonly key: ChoiceKey;
  readonly count: number;
  readonly from: readonly SkillId[] | null;
  readonly fromTools: readonly ToolProficiencyId[];
}

export interface FeatureGrant {
  readonly type: 'feature';
  readonly feature: FeatureDef;
}

export type SpeedMode = 'walk' | 'fly' | 'swim' | 'climb' | 'burrow';

/**
 * Environment condition that gates a speed (descriptive, not runtime-evaluated).
 * The label is carried through to the resolved speed so the UI can show e.g.
 * "Fly 30 ft (while not in an enclosed space)" without modeling enclosed-space detection.
 * - `'not-enclosed'`: Circle of the Sea L10 Stormborn fly speed.
 */
export type SpeedCondition = 'not-enclosed';

export interface SpeedGrant {
  readonly type: 'speed';
  readonly mode: SpeedMode;
  // `'walk-equivalent'` resolves to the character's resolved walking speed
  // (e.g. Circle of the Sea L6 Aquatic Affinity). Only meaningful on non-walk modes.
  readonly value: number | 'walk-equivalent';
  // Optional descriptive gating condition (e.g. Stormborn fly only when not enclosed).
  // Carried through to the resolved speed for display; never evaluated at runtime.
  readonly condition?: SpeedCondition;
}

export type HitDie = 4 | 6 | 8 | 10 | 12;

export interface HitDieGrant {
  readonly type: 'hit-die';
  readonly die: HitDie;
}

export interface HpBonusGrant {
  readonly type: 'hp-bonus';
  readonly perLevel: number;
}

export interface ResistanceGrant {
  readonly type: 'resistance';
  readonly damageType: DamageTypeId;
}

export interface ArmorClassGrant {
  readonly type: 'armor-class';
  readonly calculation: AcCalculation;
}

export interface AcBonusGrant {
  readonly type: 'ac-bonus';
  readonly bonus: number;
}

export interface SpellcastingGrant {
  readonly type: 'spellcasting';
  readonly ability: AbilityKey;
  readonly source: 'class' | 'species' | 'feat';
}

export interface SpellGrant {
  readonly type: 'spell';
  readonly spellId: string;
  readonly alwaysPrepared: boolean;
  // Optional level gate: the grant is suppressed until the granting class reaches this level
  // (e.g. Circle of the Land progressively unlocks its circle spells at druid L3/5/7/9).
  // Gated generically in collectBundles against the granting class's level — see issue #189.
  readonly minClassLevel?: number;
}

export interface AsiGrant {
  readonly type: 'asi';
  readonly key: ChoiceKey;
  readonly points: number;
  readonly from: readonly AbilityKey[] | null;
}

export interface FeatGrant {
  readonly type: 'feat';
  readonly featId: FeatId;
}

export interface SubclassGrant {
  readonly type: 'subclass';
  readonly classId: ClassId;
  readonly key: ChoiceKey;
}

export interface EquipmentGrant {
  readonly type: 'equipment';
  readonly itemId: string;
  readonly quantity: number;
}

export interface AbilityCheckBonusGrant {
  readonly type: 'ability-check-bonus';
  readonly abilities: readonly AbilityKey[];
  readonly value: 'half-proficiency';
  readonly onlyWhenNotProficient: boolean;
  readonly featureId: string;
}

export interface FightingStyleChoiceGrant {
  readonly type: 'fighting-style-choice';
  readonly key: ChoiceKey;
  readonly count: number;
  readonly from: readonly FightingStyleId[];
}

export interface WeaponMasteryChoiceGrant {
  readonly type: 'weapon-mastery-choice';
  readonly key: ChoiceKey;
  readonly count: number;
}

export interface DamageTypeChoiceGrant {
  readonly type: 'damage-choice';
  readonly key: ChoiceKey;
  readonly count: number;
  readonly from: readonly DamageTypeId[];
  /**
   * When a decision is recorded, the chosen damage type expands into a feature grant
   * with id `${featureIdPrefix}-${chosenDamageType}`. One i18n entry must exist per
   * variant (e.g. `zealot-divine-fury-radiant`, `zealot-divine-fury-necrotic`).
   */
  readonly featureIdPrefix: string;
}

export interface BundleChoiceGrant {
  readonly type: 'bundle-choice';
  readonly key: ChoiceKey;
  readonly category: BundleCategory;
  readonly bundleIds: readonly string[];
}

/** `featureId` must have matching `features.${featureId}.name`/`.description` keys in gamedata.json. */
export interface FeatureChoiceOption {
  readonly optionId: string;
  readonly featureId: string;
  readonly grants: readonly Grant[];
}

export interface FeatureChoiceGrant {
  readonly type: 'feature-choice';
  readonly key: ChoiceKey;
  readonly options: readonly [FeatureChoiceOption, ...FeatureChoiceOption[]];
  // Optional total-character-level gate: the choice is suppressed until the character reaches this
  // level. Unlike `minClassLevel` (gated against a single class's level), this gates against total
  // character level — used for species traits that unlock at a character level, e.g. Aasimar
  // Celestial Revelation at character level 3 (#289). Gated generically in collectBundles.
  readonly minCharacterLevel?: number;
}

export interface LineageChoiceGrant {
  readonly type: 'lineage-choice';
  readonly key: ChoiceKey;
  readonly speciesId: SpeciesId;
  readonly from: readonly string[];
}

export interface FeatChoiceGrant {
  readonly type: 'feat-choice';
  readonly key: ChoiceKey;
  readonly from: readonly FeatId[] | null;
  readonly category: FeatCategory;
}

export type ResourcePoolMax =
  | { readonly mode: 'class-level'; readonly classId: ClassId }
  | { readonly mode: 'fixed'; readonly value: number }
  /**
   * A stepped table keyed on class level — e.g. the Barbarian's Rages column
   * (2 at L1, 3 at L3, 4 at L6, 5 at L12, 6 at L17). The max is the `value` of
   * the step with the highest `minLevel` that is ≤ the character's class level.
   */
  | {
      readonly mode: 'level-steps';
      readonly classId: ClassId;
      readonly steps: readonly { readonly minLevel: number; readonly value: number }[];
    }
  /**
   * The max equals the character's Proficiency Bonus — e.g. the 2024 Paladin's
   * Channel Divinity uses (PB per rest). PB is derived from the character's level
   * in the named class (`getProficiencyBonus`). Like `class-level`/`level-steps`,
   * this keys on a single class's level, so it is correct for single-class
   * characters; multiclass PB (which scales with total character level) is a
   * pre-existing limitation shared by all level-keyed modes.
   */
  | { readonly mode: 'proficiency-bonus'; readonly classId: ClassId }
  /**
   * The max equals the character's level in the named class plus a fixed `offset`
   * — e.g. the Celestial Patron's Healing Light (1 + Warlock level). Keys on a
   * single class's level (same single-class assumption as the other level-keyed
   * modes). The resolver clamps the result at 0.
   */
  | { readonly mode: 'class-level-plus'; readonly classId: ClassId; readonly offset: number };

/**
 * Die sizes that scale with character level — currently only the Psi Warrior /
 * Soulknife Psionic Energy dice (d6→d8→d10→d12). Declared on a `ResourcePoolGrant`
 * via `dieSizeSteps`; resolved onto `ResolvedResourcePool.dieSize`.
 */
export type PsionicDieSize = 6 | 8 | 10 | 12;

/**
 * How a resource pool's uses are recovered.
 * - `'short-rest'` / `'long-rest'`: all uses recovered on the named rest (short-rest also implies long).
 * - `compound`: all uses recovered on a Long Rest, plus `shortRestAmount` uses recovered on a Short Rest
 *   — e.g. Psionic Energy regains 1 die on a Short Rest and all dice on a Long Rest.
 */
export type ResourcePoolRegen =
  | 'short-rest'
  | 'long-rest'
  | { readonly mode: 'compound'; readonly shortRestAmount: number };

export interface ResourcePoolGrant {
  readonly type: 'resource-pool';
  readonly poolId: string;
  readonly max: ResourcePoolMax;
  readonly regen: ResourcePoolRegen;
  /**
   * Optional die-size scaling table — e.g. Psionic Energy dice scale d6→d8→d10→d12
   * by class level. Resolved like `level-steps` (highest satisfied `minLevel` wins),
   * keyed on the same class as `max`. Only meaningful when `max` keys on a class
   * level; ignored for `fixed`-max pools (no class to key the steps on).
   */
  readonly dieSizeSteps?: readonly { readonly minLevel: number; readonly dieSize: PsionicDieSize }[];
}

export interface SpellChoiceGrant {
  readonly type: 'spell-choice';
  readonly key: ChoiceKey;
  readonly count: number;
  readonly spellList: ClassId;
  readonly spellLevel: SpellDef['level'];
}

export type Grant =
  | AbilityBonusGrant
  | AbilityChoiceGrant
  | ProficiencyGrant
  | ProficiencyChoiceGrant
  | SkillExpertiseGrant
  | ExpertiseChoiceGrant
  | FeatureGrant
  | SpeedGrant
  | HitDieGrant
  | HpBonusGrant
  | ResistanceGrant
  | ArmorClassGrant
  | AcBonusGrant
  | SpellcastingGrant
  | SpellGrant
  | AsiGrant
  | SubclassGrant
  | AbilityCheckBonusGrant
  | FightingStyleChoiceGrant
  | WeaponMasteryChoiceGrant
  | DamageTypeChoiceGrant
  | EquipmentGrant
  | BundleChoiceGrant
  | LineageChoiceGrant
  | FeatChoiceGrant
  | FeatureChoiceGrant
  | FeatGrant
  | ResourcePoolGrant
  | SpellChoiceGrant;
