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

export interface SpeedGrant {
  readonly type: 'speed';
  readonly mode: SpeedMode;
  readonly value: number;
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

export interface LineageChoiceGrant {
  readonly type: 'lineage-choice';
  readonly key: ChoiceKey;
  readonly speciesId: SpeciesId;
  readonly from: readonly string[];
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
  | FeatGrant;
