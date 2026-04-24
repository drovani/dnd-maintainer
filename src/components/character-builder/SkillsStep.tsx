import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ExpertiseChoicePicker } from '@/components/character-sheet/ExpertiseChoicePicker';
import { useCharacterContext } from '@/hooks/useCharacterContext';
import type { ChoiceKey } from '@/types/choices';
import type { SourceTag } from '@/types/sources';
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
  readonly source: SourceTag;
  readonly count: number;
  readonly from: readonly SkillId[] | null;
  readonly fromTools: readonly ToolProficiencyId[];
}

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
            source: bundle.source,
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

  // Get current selections for a skill-choice
  const getSelectedSkills = (choiceKey: ChoiceKey): readonly SkillId[] => {
    const decision = build?.choices[choiceKey];
    if (decision?.type === 'skill-choice') return decision.skills;
    return [];
  };

  const allExpertiseChoiceKeys = expertiseChoices.map((ec) => ec.choiceKey);

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

      {/* Expertise choices — one section per grant, rendered via shared picker */}
      {expertiseChoices.map((ec) => (
        <ExpertiseChoicePicker
          key={ec.choiceKey}
          choice={{
            type: 'expertise-choice',
            choiceKey: ec.choiceKey,
            source: ec.source,
            count: ec.count,
            from: ec.from,
            fromTools: ec.fromTools,
          }}
          currentDecision={build?.choices[ec.choiceKey]}
          allDecisions={build?.choices ?? {}}
          allExpertiseChoiceKeys={allExpertiseChoiceKeys}
          resolvedSkills={resolved.skills}
          onDecide={context.makeChoice}
          onClear={context.clearChoice}
        />
      ))}
    </div>
  );
}
