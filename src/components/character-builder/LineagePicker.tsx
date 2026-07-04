import { collectGrantsByType } from '@/lib/resolver/helpers';
import { LINEAGE_GRANTS_REGISTRY } from '@/lib/sources/species';
import type { SpeciesId } from '@/lib/dnd-helpers';
import type { ChoiceDecision, ChoiceKey } from '@/types/choices';
import type { PendingChoice } from '@/types/resolved';
import type { GrantBundle } from '@/types/sources';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ChoicePicker } from './ChoicePicker';
import { DragonbornLineageTable } from './DragonbornLineageTable';

interface LineagePickerProps {
  readonly race: SpeciesId;
  readonly bundles: readonly GrantBundle[];
  readonly build: { choices: Record<ChoiceKey, ChoiceDecision> } | null;
  readonly makeChoice: (key: ChoiceKey, decision: ChoiceDecision) => void;
  readonly clearChoice: (key: ChoiceKey) => void;
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
      <div className="space-y-2">
        <DragonbornLineageTable
          choiceKey={lineageTag.grant.key}
          from={lineageTag.grant.from}
          currentLineageId={currentLineageId}
          onSelect={(lineageId) => makeChoice(lineageTag.grant.key, { type: 'lineage-choice', lineageId })}
        />
        {currentLineageId !== undefined && (
          <Button variant="ghost" size="sm" onClick={() => clearChoice(lineageTag.grant.key)}>
            {tc('characterBuilder.equipment.clearSelection')}
          </Button>
        )}
      </div>
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
