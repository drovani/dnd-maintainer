import type {
  RaceId,
  ClassId,
  BackgroundId,
  SizeId,
  AbilityKey,
} from '@/lib/dnd-helpers'
import type { Grant } from '@/types/grants'

export const SUBCLASS_IDS = ['champion', 'battlemaster', 'eldritchknight'] as const
export type SubclassId = (typeof SUBCLASS_IDS)[number]

export function isSubclassId(s: string): s is SubclassId {
  return (SUBCLASS_IDS as readonly string[]).includes(s)
}

export type SourceTag =
  | { readonly origin: 'race'; readonly id: RaceId }
  | { readonly origin: 'class'; readonly id: ClassId; readonly level: number }
  | { readonly origin: 'subclass'; readonly id: SubclassId; readonly classId: ClassId; readonly level: number }
  | { readonly origin: 'background'; readonly id: BackgroundId }
  | { readonly origin: 'feat'; readonly id: string }
  | { readonly origin: 'item'; readonly id: string }
  | { readonly origin: 'bundle'; readonly id: string }
  | { readonly origin: 'pack'; readonly id: string }
  | { readonly origin: 'loot'; readonly description: string }

export interface GrantBundle {
  readonly source: SourceTag
  readonly grants: readonly Grant[]
}

export interface RaceSource {
  readonly id: RaceId
  readonly defaultSize: SizeId
  readonly defaultSpeed: number
  readonly grants: readonly Grant[]
}

export interface LevelUp {
  readonly grants: readonly Grant[]
}

export interface ClassQuickBuild {
  /** Ability receiving 15 from the Standard Array. Array form ("STR or DEX") picks one at random per roll. */
  readonly highestAbility: AbilityKey | readonly AbilityKey[]
  /** Ability receiving 14 from the Standard Array. */
  readonly secondaryAbility: AbilityKey
  /** Background id written to character.background on Quick NPC. */
  readonly suggestedBackground: BackgroundId
}

export interface ClassSource {
  readonly id: ClassId
  readonly primaryAbility: AbilityKey
  readonly levels: readonly LevelUp[]
  readonly quickBuild?: ClassQuickBuild
}

export interface SubclassFeature {
  readonly classLevel: number
  readonly grants: readonly Grant[]
}

export interface SubclassSource {
  readonly id: SubclassId
  readonly classId: ClassId
  readonly features: readonly SubclassFeature[]
}

export interface BackgroundSource {
  readonly id: BackgroundId
  readonly grants: readonly Grant[]
}

export type FeatPrerequisite =
  | { readonly type: 'ability-minimum'; readonly ability: AbilityKey; readonly minimum: number }
  | { readonly type: 'proficiency'; readonly category: 'armor' | 'weapon'; readonly id: string }
  | { readonly type: 'spellcasting' }
  | { readonly type: 'class-feature'; readonly featureId: string }
  | { readonly type: 'level-minimum'; readonly level: number }

export interface FeatSource {
  readonly id: string
  readonly prerequisites: readonly FeatPrerequisite[]
  readonly grants: readonly Grant[]
}

export interface ItemSource {
  readonly id: string
  readonly grants: readonly Grant[]
  readonly requiresAttunement: boolean
}
