import { z } from 'zod'

export const AbilityScoresSchema = z.object({
  str: z.number().int().min(1).max(30),
  dex: z.number().int().min(1).max(30),
  con: z.number().int().min(1).max(30),
  int: z.number().int().min(1).max(30),
  wis: z.number().int().min(1).max(30),
  cha: z.number().int().min(1).max(30),
})

export const BuildLevelSchema = z.object({
  classId: z.string().min(1),
  classLevel: z.number().int().min(1),
  hpRoll: z.number().int().min(1).nullable(),
})

/** @deprecated Use BuildLevelSchema instead */
export const AppliedLevelSchema = z.object({
  classId: z.string().min(1),
  classLevel: z.number().int().min(1),
})

export const ChoiceDecisionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ability-choice'), abilities: z.array(z.string()).readonly() }),
  z.object({ type: z.literal('skill-choice'), skills: z.array(z.string()).readonly() }),
  z.object({ type: z.literal('tool-choice'), tools: z.array(z.string()).readonly() }),
  z.object({ type: z.literal('language-choice'), languages: z.array(z.string()).readonly() }),
  z.object({ type: z.literal('expertise-choice'), skills: z.array(z.string()).readonly() }),
  z.object({ type: z.literal('asi'), allocation: z.record(z.string(), z.number()) }),
  z.object({ type: z.literal('subclass'), subclassId: z.string().min(1) }),
  z.object({ type: z.literal('equipment-choice'), optionIndex: z.number().int().min(0) }),
])

export const CharacterBuildSchema = z.object({
  raceId: z.string().min(1),
  backgroundId: z.string().min(1),
  baseAbilities: AbilityScoresSchema,
  abilityMethod: z.enum(['standard-array', 'point-buy', 'rolling']),
  levels: z.array(BuildLevelSchema).readonly(),
  appliedLevels: z.array(BuildLevelSchema).readonly(),
  choices: z.record(z.string(), ChoiceDecisionSchema),
  feats: z.array(z.string()).readonly(),
  activeItems: z.array(z.string()).readonly(),
  hpRolls: z.array(z.number().int().min(1).nullable()).readonly(),
})

export const CharacterBuildSchemaStrict = CharacterBuildSchema.superRefine((data, ctx) => {
  if (data.levels.length !== 0 && data.levels[0].hpRoll !== null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'levels[0].hpRoll must be null (level 1 uses max die)',
    })
  }

  // Group levels by classId and verify sequential starting from 1
  const classLevelMap = new Map<string, number[]>()
  for (const level of data.levels) {
    const existing = classLevelMap.get(level.classId) ?? []
    existing.push(level.classLevel)
    classLevelMap.set(level.classId, existing)
  }

  for (const [, levels] of classLevelMap) {
    for (let i = 0; i < levels.length; i++) {
      if (levels[i] !== i + 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'classLevels must be sequential per classId',
        })
        break
      }
    }
  }
})

export type ValidatedCharacterBuild = z.infer<typeof CharacterBuildSchema>
