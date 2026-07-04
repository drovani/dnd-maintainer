import { collectGrantsByType } from '@/lib/resolver/helpers';
import { DRAGONBORN_LINEAGE_DAMAGE, LINEAGE_GRANTS_REGISTRY } from '@/lib/sources/species';
import type { SpeciesId } from '@/lib/dnd-helpers';
import type { ChoiceDecision, ChoiceKey } from '@/types/choices';
import type { PendingChoice } from '@/types/resolved';
import type { GrantBundle } from '@/types/sources';
import { useTranslation } from 'react-i18next';
import { ChoicePicker } from './ChoicePicker';

interface LineagePickerProps {
  readonly race: SpeciesId;
  readonly bundles: readonly GrantBundle[];
  readonly build: { choices: Record<ChoiceKey, ChoiceDecision> } | null;
  readonly makeChoice: (key: ChoiceKey, decision: ChoiceDecision) => void;
  readonly clearChoice: (key: ChoiceKey) => void;
}

/**
 * Renders the Dragonborn lineage choice as a table (dragon color, damage type, and
 * chromatic-vs-metallic kind) rather than a flat radio list (#292). Each row is selectable.
 */
function DragonbornLineageTable({
  choiceKey,
  from,
  currentLineageId,
  onSelect,
}: {
  readonly choiceKey: ChoiceKey;
  readonly from: readonly string[];
  readonly currentLineageId: string | undefined;
  readonly onSelect: (lineageId: string) => void;
}) {
  const { t: tc } = useTranslation('common');
  const { t: tg } = useTranslation('gamedata');

  return (
    <div className="mt-2 space-y-2">
      <p className="text-sm text-muted-foreground">{tc('characterBuilder.pendingChoices.lineageChoice')}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="w-8 py-1.5" scope="col">
                <span className="sr-only">{tc('characterBuilder.pendingChoices.lineageChoice')}</span>
              </th>
              <th className="py-1.5 pr-3 font-medium" scope="col">
                {tc('characterBuilder.pendingChoices.lineageTable.dragon')}
              </th>
              <th className="py-1.5 pr-3 font-medium" scope="col">
                {tc('characterBuilder.pendingChoices.lineageTable.damageType')}
              </th>
              <th className="py-1.5 pr-3 font-medium" scope="col">
                {tc('characterBuilder.pendingChoices.lineageTable.kind')}
              </th>
            </tr>
          </thead>
          <tbody>
            {from.map((lineageId) => {
              const radioId = `choice-lineage-${choiceKey}-${lineageId}`;
              const kind = lineageId.split('-')[0];
              const colorLabel = tg(`lineages.dragonborn.${lineageId}` as `lineages.dragonborn.${string}`, {
                defaultValue: lineageId,
              });
              const damageId = DRAGONBORN_LINEAGE_DAMAGE[lineageId];
              const damageLabel = damageId ? tg(`damageTypes.${damageId}` as `damageTypes.${typeof damageId}`) : '—';
              const kindLabel = tg(`dragonKinds.${kind}` as `dragonKinds.chromatic` | `dragonKinds.metallic`, {
                defaultValue: kind,
              });
              const selected = currentLineageId === lineageId;
              return (
                <tr
                  key={lineageId}
                  className={`border-b border-border/50 transition-colors hover:bg-muted/50 ${
                    selected ? 'bg-muted/50' : ''
                  }`}
                >
                  <td className="py-1.5">
                    <input
                      type="radio"
                      id={radioId}
                      name={`choice-lineage-${choiceKey}`}
                      checked={selected}
                      onChange={() => onSelect(lineageId)}
                      className="size-4 text-primary"
                    />
                  </td>
                  <td className="py-1.5 pr-3">
                    <label htmlFor={radioId} className="block cursor-pointer font-medium">
                      {colorLabel}
                    </label>
                  </td>
                  <td className="py-1.5 pr-3 text-muted-foreground">{damageLabel}</td>
                  <td className="py-1.5 pr-3 text-muted-foreground">{kindLabel}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function LineagePicker({ race, bundles, build, makeChoice, clearChoice }: LineagePickerProps) {
  const { t: tc } = useTranslation('common');

  if (!(race in LINEAGE_GRANTS_REGISTRY)) return null;

  const lineageGrantTags = collectGrantsByType(bundles, 'lineage-choice').filter(
    (tg) => tg.source.origin === 'species'
  );
  const lineageTag = lineageGrantTags[0];

  if (!lineageTag) {
    return <p className="text-sm text-muted-foreground">{tc('characterBuilder.hints.loadingLineage')}</p>;
  }

  const decision = build?.choices[lineageTag.grant.key];
  const currentLineageId = decision?.type === 'lineage-choice' ? decision.lineageId : undefined;

  // Dragonborn: render a table of dragon color / damage type / kind (#292).
  if (race === 'dragonborn') {
    return (
      <DragonbornLineageTable
        choiceKey={lineageTag.grant.key}
        from={lineageTag.grant.from}
        currentLineageId={currentLineageId}
        onSelect={(lineageId) => makeChoice(lineageTag.grant.key, { type: 'lineage-choice', lineageId })}
      />
    );
  }

  // Other species: flat radio list via the shared ChoicePicker.
  const lineageChoice: PendingChoice & { type: 'lineage-choice' } = {
    type: 'lineage-choice',
    choiceKey: lineageTag.grant.key,
    source: lineageTag.source,
    speciesId: race,
    from: lineageTag.grant.from,
  };

  return (
    <div className="mt-2">
      <ChoicePicker
        choice={lineageChoice}
        currentDecision={decision as ChoiceDecision | undefined}
        onDecide={(key, d) => makeChoice(key, d)}
        onClear={(key) => clearChoice(key)}
      />
    </div>
  );
}
