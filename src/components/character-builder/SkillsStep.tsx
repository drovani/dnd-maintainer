import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ExpertiseChoicePicker } from '@/components/character-sheet/ExpertiseChoicePicker';
import { useCharacterContext } from '@/hooks/useCharacterContext';
import { getChoiceSourceName } from '@/lib/character-builder/choice-source-name';
import { pickMostRestrictiveChoiceWithRoom } from '@/lib/character-builder/route-choice';
import { SourceIcon, getSourceDisplayName } from '@/lib/class-icons';
import type { ChoiceKey } from '@/types/choices';
import type { SourceTag } from '@/types/sources';
import { ABILITY_ABBREVIATIONS, DND_SKILLS, type SkillId, type ToolProficiencyId } from '@/lib/dnd-helpers';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/** Stable identity for a grant source, so multiple grants from the same source dedupe to one icon. */
function sourceKey(source: SourceTag): string {
  return `${source.origin}:${'id' in source ? source.id : source.description}`;
}

interface SkillChoiceInfo {
  readonly choiceKey: ChoiceKey;
  readonly source: SourceTag;
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
            source: bundle.source,
            count: grant.count,
            from: (grant.from ?? DND_SKILLS.map((s) => s.id)) as readonly SkillId[],
          });
        }
      }
    }
    return choices;
  }, [bundles]);

  // Scan grant bundles for skills granted as FIXED proficiencies (not via a choice),
  // e.g. a background's Athletics/Intimidation. These are already proficient, so they
  // must not be selectable in any "choose N skills" pool — picking one would silently
  // waste the pick for zero benefit (#238). Map each such skill to its granting sources.
  const fixedSkillGrants = useMemo((): ReadonlyMap<SkillId, readonly SourceTag[]> => {
    const map = new Map<SkillId, SourceTag[]>();
    for (const bundle of bundles) {
      for (const grant of bundle.grants) {
        if (grant.type === 'proficiency' && grant.category === 'skill') {
          const existing = map.get(grant.id) ?? [];
          existing.push(bundle.source);
          map.set(grant.id, existing);
        }
      }
    }
    return map;
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
              {tc('characterBuilder.pendingChoices.skillChoice', { count: sc.count })}{' '}
              <span className="text-xs">
                {tc('characterBuilder.pendingChoices.fromSource', { source: getChoiceSourceName(sc.choiceKey, t) })}
              </span>
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

          // Skills already granted as a fixed proficiency (e.g. by the background) can't be
          // taken again — exclude them from every choice pool so a pick isn't silently wasted.
          const fixedSources = fixedSkillGrants.get(skill.id) ?? [];
          const isFixedGranted = fixedSources.length > 0;

          // Every choice this skill is eligible for (could be multiple sources, e.g. Elf + Barbarian).
          // A fixed-granted skill is removed from the selectable pools entirely.
          const eligibleChoices = isFixedGranted ? [] : skillChoices.filter((sc) => sc.from.includes(skill.id));
          const choiceHoldingSkill = eligibleChoices.find((sc) => getSelectedSkills(sc.choiceKey).includes(skill.id));
          // Route a new selection to the most restrictive eligible grant with room (smallest pool),
          // so e.g. Athletics consumes the narrow Barbarian list before the "any skill" Human grant.
          const choiceWithRoom = pickMostRestrictiveChoiceWithRoom(
            eligibleChoices,
            (sc) => getSelectedSkills(sc.choiceKey).length
          );

          let checkbox: React.ReactNode = null;
          if (eligibleChoices.length > 0) {
            const isSelected = choiceHoldingSkill !== undefined;
            // Disabled when nothing's checked and no eligible choice still has room
            const isDisabled = !isSelected && choiceWithRoom === undefined;

            const handleChange = (checked: boolean | 'indeterminate') => {
              if (checked === 'indeterminate') return;
              if (checked) {
                // Route a new check to the first eligible choice with room
                const target = choiceWithRoom;
                if (!target) return;
                const current = getSelectedSkills(target.choiceKey);
                context.makeChoice(target.choiceKey, { type: 'skill-choice', skills: [...current, skill.id] });
              } else {
                // Remove from whichever choice currently holds the skill
                const target = choiceHoldingSkill;
                if (!target) return;
                const current = getSelectedSkills(target.choiceKey);
                const next = current.filter((s) => s !== skill.id);
                if (next.length === 0) {
                  context.clearChoice(target.choiceKey);
                } else {
                  context.makeChoice(target.choiceKey, { type: 'skill-choice', skills: next });
                }
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
                htmlFor={eligibleChoices.length > 0 ? `skill-${skill.id}` : undefined}
                className={`flex-1 text-sm ${eligibleChoices.length > 0 ? 'cursor-pointer' : ''}`}
              >
                {t(`skills.${skill.id}`)}
                <span className="text-xs text-muted-foreground ml-1">({abbrev})</span>
                {isFixedGranted && (
                  <span className="text-xs text-muted-foreground ml-2 italic">
                    {tc('characterBuilder.skills.alreadyProficient')}
                  </span>
                )}
              </label>
              {/* Source icons — one per DISTINCT source, hover to see the source name.
                  For a fixed-granted skill, show the granting source(s) (e.g. the background)
                  so the player can see why it's already proficient. Otherwise show the eligible
                  choice sources. A single source can grant more than one skill-choice (e.g.
                  Barbarian's level-1 list plus the level-3 Primal Knowledge pick), so dedupe. */}
              {(() => {
                const iconSources = isFixedGranted ? fixedSources : eligibleChoices.map((sc) => sc.source);
                if (iconSources.length === 0) return null;
                return (
                  <div className="flex items-center gap-1 shrink-0">
                    {Array.from(new Map(iconSources.map((source) => [sourceKey(source), source])).values()).map(
                      (source) => {
                        const sourceName = getSourceDisplayName(source, t);
                        return (
                          <span
                            key={sourceKey(source)}
                            title={sourceName}
                            aria-label={sourceName}
                            className="inline-flex"
                          >
                            <SourceIcon source={source} className="size-3.5 text-muted-foreground" />
                          </span>
                        );
                      }
                    )}
                  </div>
                );
              })()}
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
