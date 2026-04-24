import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useCharacterContext } from '@/hooks/useCharacterContext';
import type { ChoiceKey } from '@/types/choices';
import { getChoiceSourceName } from '@/lib/character-builder/choice-source-name';
import { ABILITY_ABBREVIATIONS, DND_SKILLS, type SkillId, type ToolProficiencyId } from '@/lib/dnd-helpers';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface SkillChoiceInfo {
  readonly choiceKey: ChoiceKey;
  readonly count: number;
  readonly from: readonly SkillId[];
}

interface ExpertiseChoiceInfo {
  readonly choiceKey: ChoiceKey;
  readonly count: number;
  readonly from: readonly SkillId[] | null;
  readonly fromTools: readonly ToolProficiencyId[];
}

interface ExpertiseSelection {
  readonly skills: readonly SkillId[];
  readonly tools: readonly ToolProficiencyId[];
}

const EMPTY_EXPERTISE: ExpertiseSelection = { skills: [], tools: [] };

export function SkillsStep() {
  const { t } = useTranslation('gamedata');
  const { t: tc } = useTranslation('common');
  const context = useCharacterContext();
  const { resolved, build, bundles } = context;

  // Scan grant bundles for all skill-choice grants (regardless of pending status)
  const skillChoices = useMemo((): readonly SkillChoiceInfo[] => {
    if (bundles.length === 0) return [];
    const choices: SkillChoiceInfo[] = [];
    for (const bundle of bundles) {
      for (const grant of bundle.grants) {
        if (grant.type === 'proficiency-choice' && grant.category === 'skill') {
          choices.push({
            choiceKey: grant.key,
            count: grant.count,
            from: (grant.from ?? DND_SKILLS.map((s) => s.id)) as readonly SkillId[],
          });
        }
      }
    }
    return choices;
  }, [bundles]);

  // Scan grant bundles for all expertise-choice grants (regardless of pending status)
  const expertiseChoices = useMemo((): readonly ExpertiseChoiceInfo[] => {
    if (bundles.length === 0) return [];
    const choices: ExpertiseChoiceInfo[] = [];
    for (const bundle of bundles) {
      for (const grant of bundle.grants) {
        if (grant.type === 'expertise-choice') {
          choices.push({
            choiceKey: grant.key,
            count: grant.count,
            from: grant.from,
            fromTools: grant.fromTools,
          });
        }
      }
    }
    return choices;
  }, [bundles]);

  if (!resolved) {
    return <p className="text-muted-foreground text-sm">{tc('characterBuilder.skills.selectClassFirst')}</p>;
  }

  // Build set of skills eligible for any choice
  const eligibleSkillIds = new Set<SkillId>();
  for (const sc of skillChoices) {
    for (const s of sc.from) eligibleSkillIds.add(s);
  }

  // Get current selections for a choice
  const getSelectedSkills = (choiceKey: ChoiceKey): readonly SkillId[] => {
    const decision = build?.choices[choiceKey];
    if (decision?.type === 'skill-choice') return decision.skills;
    return [];
  };

  const getSelectedExpertise = (choiceKey: ChoiceKey): ExpertiseSelection => {
    const decision = build?.choices[choiceKey];
    if (decision?.type === 'expertise-choice') {
      return { skills: decision.skills, tools: decision.tools };
    }
    return EMPTY_EXPERTISE;
  };

  // Skills already expert'd by another expertise-choice (for cross-choice dedupe)
  const skillsExpertInOtherChoice = (excludeKey: ChoiceKey): ReadonlySet<SkillId> => {
    const taken = new Set<SkillId>();
    for (const ec of expertiseChoices) {
      if (ec.choiceKey === excludeKey) continue;
      for (const s of getSelectedExpertise(ec.choiceKey).skills) taken.add(s);
    }
    return taken;
  };

  const toolsExpertInOtherChoice = (excludeKey: ChoiceKey): ReadonlySet<ToolProficiencyId> => {
    const taken = new Set<ToolProficiencyId>();
    for (const ec of expertiseChoices) {
      if (ec.choiceKey === excludeKey) continue;
      for (const t of getSelectedExpertise(ec.choiceKey).tools) taken.add(t);
    }
    return taken;
  };

  return (
    <div className="space-y-4">
      {/* Choice summary headers */}
      {skillChoices.map((sc) => {
        const selected = getSelectedSkills(sc.choiceKey);
        const remaining = sc.count - selected.length;
        return (
          <div key={sc.choiceKey} className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {tc('characterBuilder.pendingChoices.skillChoice', { count: sc.count })}
            </p>
            <Badge variant={remaining === 0 ? 'default' : 'outline'} className="text-xs">
              {selected.length} / {sc.count}
            </Badge>
            {remaining > 0 && (
              <span className="text-xs text-muted-foreground">
                ({remaining} {tc('characterBuilder.pendingChoices.remaining')})
              </span>
            )}
          </div>
        );
      })}

      {/* Unified skill list */}
      <div className="space-y-0.5">
        {DND_SKILLS.map((skill) => {
          const resolvedSkill = resolved.skills[skill.id];
          if (!resolvedSkill) return null;
          const bonus = resolvedSkill.bonus;
          const proficient = resolvedSkill.proficient;
          const abilityKey = resolvedSkill.ability;
          const abbrev = t(`abilityAbbreviations.${abilityKey}`, { defaultValue: ABILITY_ABBREVIATIONS[abilityKey] });

          // Find if this skill is in any choice grant's pool
          const choiceForSkill = skillChoices.find((sc) => sc.from.includes(skill.id));

          // Show checkbox if eligible for a choice
          let checkbox: React.ReactNode = null;
          if (choiceForSkill) {
            const selected = getSelectedSkills(choiceForSkill.choiceKey);
            const isSelected = selected.includes(skill.id);
            const atMax = selected.length >= choiceForSkill.count;
            const isDisabled = atMax && !isSelected;

            const handleChange = (checked: boolean | 'indeterminate') => {
              if (checked === 'indeterminate') return;
              const next = checked ? [...selected, skill.id] : selected.filter((s) => s !== skill.id);
              if (next.length === 0) {
                context.clearChoice(choiceForSkill.choiceKey);
              } else {
                context.makeChoice(choiceForSkill.choiceKey, { type: 'skill-choice', skills: next });
              }
            };

            checkbox = (
              <Checkbox
                id={`skill-${skill.id}`}
                checked={isSelected}
                disabled={isDisabled}
                onCheckedChange={handleChange}
              />
            );
          }

          return (
            <div
              key={skill.id}
              className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors"
            >
              <div className="size-5 flex items-center justify-center">
                {checkbox ?? (proficient ? <div className="size-3 rounded-full bg-primary" /> : null)}
              </div>
              <span
                className={`w-8 text-right text-sm font-bold tabular-nums ${bonus >= 0 ? 'text-green-700' : 'text-red-600'}`}
              >
                {bonus >= 0 ? '+' : ''}
                {bonus}
              </span>
              <label
                htmlFor={choiceForSkill ? `skill-${skill.id}` : undefined}
                className={`flex-1 text-sm ${choiceForSkill ? 'cursor-pointer' : ''}`}
              >
                {t(`skills.${skill.id}`)}
                <span className="text-xs text-muted-foreground ml-1">({abbrev})</span>
              </label>
            </div>
          );
        })}
      </div>

      {/* Expertise choices — one section per grant */}
      {expertiseChoices.map((ec) => {
        const selected = getSelectedExpertise(ec.choiceKey);
        const totalSelected = selected.skills.length + selected.tools.length;
        const atMax = totalSelected >= ec.count;
        const skillsTakenElsewhere = skillsExpertInOtherChoice(ec.choiceKey);
        const toolsTakenElsewhere = toolsExpertInOtherChoice(ec.choiceKey);

        // Eligible skills: grant.from (if non-null) else any currently-proficient skill
        const eligibleSkills: readonly SkillId[] = ec.from
          ? ec.from
          : DND_SKILLS.filter((s) => resolved.skills[s.id]?.proficient).map((s) => s.id);

        const commit = (nextSkills: readonly SkillId[], nextTools: readonly ToolProficiencyId[]) => {
          if (nextSkills.length === 0 && nextTools.length === 0) {
            context.clearChoice(ec.choiceKey);
            return;
          }
          context.makeChoice(ec.choiceKey, {
            type: 'expertise-choice',
            skills: nextSkills,
            tools: nextTools,
          });
        };

        const toggleSkill = (skillId: SkillId, checked: boolean) => {
          const next = checked ? [...selected.skills, skillId] : selected.skills.filter((s) => s !== skillId);
          commit(next, selected.tools);
        };

        const toggleTool = (toolId: ToolProficiencyId, checked: boolean) => {
          const next = checked ? [...selected.tools, toolId] : selected.tools.filter((tt) => tt !== toolId);
          commit(selected.skills, next);
        };

        return (
          <div key={ec.choiceKey} className="space-y-2 border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">
                {tc('characterBuilder.pendingChoices.expertiseChoice', { count: ec.count })}{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  {tc('characterBuilder.pendingChoices.fromSource', {
                    source: getChoiceSourceName(ec.choiceKey, t),
                  })}
                </span>
              </p>
              <Badge variant={totalSelected === ec.count ? 'default' : 'outline'} className="text-xs">
                {totalSelected} / {ec.count}
              </Badge>
            </div>

            {eligibleSkills.length === 0 && ec.fromTools.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">{tc('characterBuilder.skills.expertiseEmptyPool')}</p>
            ) : (
              <div className="space-y-1">
                {eligibleSkills.map((skillId) => {
                  const isSelected = selected.skills.includes(skillId);
                  const takenElsewhere = skillsTakenElsewhere.has(skillId);
                  const isDisabled = (atMax && !isSelected) || takenElsewhere;
                  const id = `expertise-${ec.choiceKey}-skill-${skillId}`;
                  return (
                    <div
                      key={skillId}
                      className="flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors hover:bg-muted/50"
                    >
                      <Checkbox
                        id={id}
                        checked={isSelected}
                        disabled={isDisabled}
                        onCheckedChange={(checked) => toggleSkill(skillId, checked)}
                      />
                      <Label htmlFor={id} className="flex-1 cursor-pointer text-sm">
                        {t(`skills.${skillId}`)}
                        {takenElsewhere && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({tc('characterBuilder.skills.expertiseAlreadyChosen')})
                          </span>
                        )}
                      </Label>
                    </div>
                  );
                })}
                {ec.fromTools.map((toolId) => {
                  const isSelected = selected.tools.includes(toolId);
                  const takenElsewhere = toolsTakenElsewhere.has(toolId);
                  const isDisabled = (atMax && !isSelected) || takenElsewhere;
                  const id = `expertise-${ec.choiceKey}-tool-${toolId}`;
                  return (
                    <div
                      key={toolId}
                      className="flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors hover:bg-muted/50"
                    >
                      <Checkbox
                        id={id}
                        checked={isSelected}
                        disabled={isDisabled}
                        onCheckedChange={(checked) => toggleTool(toolId, checked)}
                      />
                      <Label htmlFor={id} className="flex-1 cursor-pointer text-sm">
                        {t(`tools.${toolId}`)}
                        {takenElsewhere && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({tc('characterBuilder.skills.expertiseAlreadyChosen')})
                          </span>
                        )}
                      </Label>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
