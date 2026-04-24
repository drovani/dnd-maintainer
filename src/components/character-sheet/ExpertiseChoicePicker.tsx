import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { getChoiceSourceName } from '@/lib/character-builder/choice-source-name';
import { DND_SKILLS, type SkillId, type ToolProficiencyId } from '@/lib/dnd-helpers';
import type { PendingChoice, ResolvedCharacter } from '@/types/resolved';
import type { ChoiceDecision, ChoiceKey } from '@/types/choices';
import { useTranslation } from 'react-i18next';

export interface ExpertiseChoicePickerProps {
  readonly choice: Extract<PendingChoice, { type: 'expertise-choice' }>;
  readonly currentDecision: ChoiceDecision | undefined;
  /**
   * All decisions on the build — used for cross-choice dedupe so that when
   * multiple expertise grants are active simultaneously (e.g. rogue L1 + L6),
   * a skill/tool selected in one picker is disabled in the others.
   */
  readonly allDecisions: Readonly<Record<ChoiceKey, ChoiceDecision>>;
  /**
   * The keys of every expertise-choice grant on the character. The picker
   * uses this to know which sibling decisions to check for deduplication.
   */
  readonly allExpertiseChoiceKeys: readonly ChoiceKey[];
  /** Resolved skills used to derive the eligible pool when `choice.from` is null. */
  readonly resolvedSkills: ResolvedCharacter['skills'];
  readonly onDecide: (key: ChoiceKey, decision: ChoiceDecision) => void;
  readonly onClear: (key: ChoiceKey) => void;
}

export function ExpertiseChoicePicker({
  choice,
  currentDecision,
  allDecisions,
  allExpertiseChoiceKeys,
  resolvedSkills,
  onDecide,
  onClear,
}: ExpertiseChoicePickerProps) {
  const { t } = useTranslation('gamedata');
  const { t: tc } = useTranslation('common');

  const selected =
    currentDecision?.type === 'expertise-choice'
      ? { skills: currentDecision.skills, tools: currentDecision.tools }
      : { skills: [] as readonly SkillId[], tools: [] as readonly ToolProficiencyId[] };

  const totalSelected = selected.skills.length + selected.tools.length;
  const atMax = totalSelected >= choice.count;

  // Cross-choice dedupe: collect skills/tools claimed by sibling expertise decisions
  const skillsExpertInOtherChoice = (): ReadonlySet<SkillId> => {
    const taken = new Set<SkillId>();
    for (const key of allExpertiseChoiceKeys) {
      if (key === choice.choiceKey) continue;
      const decision = allDecisions[key];
      if (decision?.type === 'expertise-choice') {
        for (const s of decision.skills) taken.add(s);
      }
    }
    return taken;
  };

  const toolsExpertInOtherChoice = (): ReadonlySet<ToolProficiencyId> => {
    const taken = new Set<ToolProficiencyId>();
    for (const key of allExpertiseChoiceKeys) {
      if (key === choice.choiceKey) continue;
      const decision = allDecisions[key];
      if (decision?.type === 'expertise-choice') {
        for (const tool of decision.tools) taken.add(tool);
      }
    }
    return taken;
  };

  const skillsTakenElsewhere = skillsExpertInOtherChoice();
  const toolsTakenElsewhere = toolsExpertInOtherChoice();

  // Eligible skills: grant.from (if non-null) else any currently-proficient skill
  const eligibleSkills: readonly SkillId[] = choice.from
    ? choice.from
    : DND_SKILLS.filter((s) => resolvedSkills[s.id]?.proficient).map((s) => s.id);

  const commit = (nextSkills: readonly SkillId[], nextTools: readonly ToolProficiencyId[]): void => {
    if (nextSkills.length === 0 && nextTools.length === 0) {
      onClear(choice.choiceKey);
      return;
    }
    onDecide(choice.choiceKey, {
      type: 'expertise-choice',
      skills: nextSkills,
      tools: nextTools,
    });
  };

  const toggleSkill = (skillId: SkillId, checked: boolean): void => {
    const next = checked ? [...selected.skills, skillId] : selected.skills.filter((s) => s !== skillId);
    commit(next, selected.tools);
  };

  const toggleTool = (toolId: ToolProficiencyId, checked: boolean): void => {
    const next = checked ? [...selected.tools, toolId] : selected.tools.filter((tt) => tt !== toolId);
    commit(selected.skills, next);
  };

  return (
    <div className="space-y-2 border-t border-border pt-4">
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold">
          {tc('characterBuilder.pendingChoices.expertiseChoice', { count: choice.count })}{' '}
          <span className="text-xs font-normal text-muted-foreground">
            {tc('characterBuilder.pendingChoices.fromSource', {
              source: getChoiceSourceName(choice.choiceKey, t),
            })}
          </span>
        </p>
        <Badge variant={totalSelected === choice.count ? 'default' : 'outline'} className="text-xs">
          {totalSelected} / {choice.count}
        </Badge>
      </div>

      {eligibleSkills.length === 0 && choice.fromTools.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">{tc('characterBuilder.skills.expertiseEmptyPool')}</p>
      ) : (
        <div className="space-y-1">
          {eligibleSkills.map((skillId) => {
            const isSelected = selected.skills.includes(skillId);
            const takenElsewhere = skillsTakenElsewhere.has(skillId);
            const isDisabled = (atMax && !isSelected) || takenElsewhere;
            const id = `expertise-${choice.choiceKey}-skill-${skillId}`;
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
          {choice.fromTools.map((toolId) => {
            const isSelected = selected.tools.includes(toolId);
            const takenElsewhere = toolsTakenElsewhere.has(toolId);
            const isDisabled = (atMax && !isSelected) || takenElsewhere;
            const id = `expertise-${choice.choiceKey}-tool-${toolId}`;
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
}
