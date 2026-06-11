import type {
  AbilityKey,
  FightingStyleId,
  SkillId,
  ArmorProficiencyId,
  WeaponProficiencyId,
  ToolProficiencyId,
  LanguageId,
  ClassId,
  FeatId,
} from '@/lib/dnd-helpers';
import type {
  FeatureDef,
  DamageTypeId,
  HitDie,
  SpeedMode,
  SpeedCondition,
  ResourcePoolRegen,
  PsionicDieSize,
} from '@/types/grants';
import type { SourceTag, FeatCategory } from '@/types/sources';
import type { ChoiceKey } from '@/types/choices';
import type {
  DamageDice,
  ItemDef,
  PhysicalDamageType,
  WeaponMasteryId,
  WeaponProperty,
  WeaponRange,
  BundleCategory,
} from '@/types/items';
import type { SpeciesId } from '@/lib/dnd-helpers';

export interface Sourced<T> {
  readonly value: T;
  readonly sources: readonly SourceTag[];
}

/**
 * A resolved speed for one mode. Carries an optional descriptive `condition`
 * (e.g. Stormborn fly only when not enclosed) for display; the condition is
 * never evaluated — the value is always present.
 */
export type ResolvedSpeed = Sourced<number> & { readonly condition?: SpeedCondition };

export interface ResolvedAbility {
  readonly base: number;
  readonly bonuses: readonly { readonly value: number; readonly source: SourceTag }[];
  readonly total: number;
  readonly modifier: number;
}

export interface BonusComponent<TKind extends string> {
  readonly type: TKind;
  readonly value: number;
  readonly label: string;
}

export type SkillBonusComponent = BonusComponent<'ability' | 'proficiency' | 'expertise' | 'ability-check-bonus'>;
export type AttackBonusComponent = BonusComponent<'ability' | 'proficiency' | 'fighting-style' | 'magic'>;
export type DamageBonusComponent = BonusComponent<'ability' | 'fighting-style' | 'magic'>;
export type SavingThrowBonusComponent = BonusComponent<'ability' | 'proficiency'>;

export interface ResolvedSkill {
  readonly ability: AbilityKey;
  readonly proficient: boolean;
  readonly expertise: boolean;
  readonly bonus: number;
  readonly breakdown: readonly SkillBonusComponent[];
  readonly sources: readonly SourceTag[];
}

export interface ResolvedEquipmentItem {
  readonly itemId: string;
  readonly itemDef: ItemDef;
  readonly quantity: number;
  readonly source: SourceTag;
  readonly equipped: boolean;
}

export interface ResolvedAttack {
  readonly weaponId: string;
  readonly attackBonus: number;
  readonly attackBreakdown: readonly AttackBonusComponent[];
  readonly damageDice: DamageDice;
  readonly damageBonus: number;
  readonly damageBreakdown: readonly DamageBonusComponent[];
  readonly damageType: PhysicalDamageType;
  readonly properties: readonly WeaponProperty[];
  readonly range: WeaponRange;
  readonly normalRange?: number;
  readonly longRange?: number;
}

export interface ResolvedFeature {
  readonly feature: FeatureDef;
  readonly source: SourceTag;
  readonly saveDC?: number;
}

export interface ResolvedResourcePool {
  readonly poolId: string;
  readonly max: number;
  readonly regen: ResourcePoolRegen;
  readonly source: SourceTag;
  /** Present only when the pool declares `dieSizeSteps` — e.g. Psionic Energy (d6→d12). */
  readonly dieSize?: PsionicDieSize;
}

export interface ResolvedArmorClass {
  readonly calculations: readonly {
    readonly mode: 'armored' | 'unarmored' | 'natural';
    readonly baseValue: number;
    readonly source: SourceTag;
  }[];
  readonly bonuses: readonly { readonly value: number; readonly source: SourceTag }[];
  readonly effective: number;
}

export interface ResolvedPactMagic {
  readonly count: number;
  readonly slotLevel: number;
}

/**
 * Resolved spellcasting state. Invariant: warlocks have `pactMagic !== null` and `slots` is empty;
 * all other casters have `pactMagic === null` and use `slots`. `preparedCount` is `0` for known-spell
 * casters (bard, sorcerer, warlock) and non-class spellcasting sources.
 *
 * `cantripsKnown`: sum of all cantrip spell-choice grant counts (i.e. the number of cantrip slots
 * the character has). `0` for non-casters and prepared casters that don't model cantrip counts.
 *
 * `spellsKnown`: per-spell-level target count for known-spell casters (bard, sorcerer, warlock,
 * ranger). Empty for prepared casters — use `preparedCount` instead.
 *
 * `knownSpells`: each entry carries `spellLevel` so consumers can group by level.
 */
export interface ResolvedSpellcasting {
  readonly ability: AbilityKey | null;
  readonly spellSaveDC: number | null;
  readonly spellAttackBonus: number | null;
  readonly cantrips: readonly string[];
  readonly cantripsKnown: number;
  readonly knownSpells: readonly { readonly spellId: string; readonly spellLevel: number }[];
  readonly spellsKnown: readonly { readonly level: number; readonly count: number }[];
  readonly alwaysPreparedSpells: readonly string[];
  readonly slots: readonly number[];
  readonly preparedCount: number;
  readonly pactMagic: ResolvedPactMagic | null;
}

export type PendingChoice =
  | {
      readonly type: 'ability-choice';
      readonly choiceKey: ChoiceKey;
      readonly source: SourceTag;
      readonly count: number;
      readonly bonus: number;
      readonly from: readonly AbilityKey[] | null;
    }
  | {
      readonly type: 'skill-choice';
      readonly choiceKey: ChoiceKey;
      readonly source: SourceTag;
      readonly category: 'skill';
      readonly count: number;
      readonly from: readonly SkillId[] | null;
    }
  | {
      readonly type: 'tool-choice';
      readonly choiceKey: ChoiceKey;
      readonly source: SourceTag;
      readonly category: 'tool';
      readonly count: number;
      readonly from: readonly ToolProficiencyId[] | null;
    }
  | {
      readonly type: 'language-choice';
      readonly choiceKey: ChoiceKey;
      readonly source: SourceTag;
      readonly count: number;
      readonly from: readonly LanguageId[] | null;
    }
  | {
      readonly type: 'saving-throw-choice';
      readonly choiceKey: ChoiceKey;
      readonly source: SourceTag;
      readonly category: 'saving-throw';
      readonly count: number;
      readonly from: readonly AbilityKey[] | null;
    }
  | {
      readonly type: 'expertise-choice';
      readonly choiceKey: ChoiceKey;
      readonly source: SourceTag;
      readonly count: number;
      readonly from: readonly SkillId[] | null;
      readonly fromTools: readonly ToolProficiencyId[];
    }
  | {
      readonly type: 'asi';
      readonly choiceKey: ChoiceKey;
      readonly source: SourceTag;
      readonly points: number;
      readonly from: readonly AbilityKey[] | null;
    }
  | { readonly type: 'subclass'; readonly choiceKey: ChoiceKey; readonly source: SourceTag; readonly classId: ClassId }
  | {
      readonly type: 'fighting-style-choice';
      readonly choiceKey: ChoiceKey;
      readonly source: SourceTag;
      readonly count: number;
      readonly from: readonly FightingStyleId[];
      readonly alreadyChosen: readonly FightingStyleId[];
    }
  | {
      readonly type: 'weapon-mastery-choice';
      readonly choiceKey: ChoiceKey;
      readonly source: SourceTag;
      readonly count: number;
      readonly from: readonly string[];
      readonly alreadyChosen: readonly string[];
    }
  | {
      readonly type: 'damage-choice';
      readonly choiceKey: ChoiceKey;
      readonly source: SourceTag;
      readonly count: number;
      readonly from: readonly DamageTypeId[];
      readonly featureIdPrefix: string;
    }
  | {
      readonly type: 'bundle-choice';
      readonly choiceKey: ChoiceKey;
      readonly source: SourceTag;
      readonly category: BundleCategory;
      readonly bundleIds: readonly string[];
    }
  | {
      readonly type: 'lineage-choice';
      readonly choiceKey: ChoiceKey;
      readonly source: SourceTag;
      readonly speciesId: SpeciesId;
      readonly from: readonly string[];
    }
  | {
      readonly type: 'feat-choice';
      readonly choiceKey: ChoiceKey;
      readonly source: SourceTag;
      readonly from: readonly FeatId[] | null;
      readonly category: FeatCategory;
    }
  | {
      readonly type: 'feature-choice';
      readonly choiceKey: ChoiceKey;
      readonly source: SourceTag;
      readonly options: readonly [
        { readonly optionId: string; readonly featureId: string },
        ...{ readonly optionId: string; readonly featureId: string }[],
      ];
    }
  | {
      readonly type: 'spell-choice';
      readonly choiceKey: ChoiceKey;
      readonly source: SourceTag;
      readonly count: number;
      readonly spellList: ClassId;
      readonly spellLevel: number;
    };

export interface ResolvedCharacter {
  readonly abilities: Readonly<Record<AbilityKey, ResolvedAbility>>;
  readonly hitDie: readonly { readonly die: HitDie; readonly count: number }[];
  readonly hitPoints: { readonly max: number };
  readonly speed: Readonly<Partial<Record<SpeedMode, ResolvedSpeed>>>;
  readonly initiative: number;
  readonly proficiencyBonus: number;
  readonly armorClass: ResolvedArmorClass;
  readonly savingThrows: Readonly<
    Record<
      AbilityKey,
      {
        readonly proficient: boolean;
        readonly bonus: number;
        readonly sources: readonly SourceTag[];
        readonly breakdown: readonly SavingThrowBonusComponent[];
      }
    >
  >;
  readonly skills: Readonly<Record<SkillId, ResolvedSkill>>;
  readonly armorProficiencies: readonly Sourced<ArmorProficiencyId>[];
  readonly weaponProficiencies: readonly Sourced<WeaponProficiencyId>[];
  readonly toolProficiencies: readonly Sourced<ToolProficiencyId>[];
  readonly languages: readonly Sourced<LanguageId>[];
  readonly features: readonly ResolvedFeature[];
  readonly resistances: readonly Sourced<DamageTypeId>[];
  readonly immunities: readonly Sourced<DamageTypeId>[];
  readonly spellcasting: ResolvedSpellcasting | null;
  readonly equipment: readonly ResolvedEquipmentItem[];
  readonly attacks: readonly ResolvedAttack[];
  readonly toolExpertise: readonly ToolProficiencyId[];
  readonly bardicInspiration: {
    readonly dieSize: 6 | 8 | 10 | 12;
    readonly uses: number;
  } | null;
  readonly pendingChoices: readonly PendingChoice[];
  readonly weaponMasteries: readonly { readonly weaponId: string; readonly masteryId: WeaponMasteryId }[];
  readonly resourcePools: readonly ResolvedResourcePool[];
}
