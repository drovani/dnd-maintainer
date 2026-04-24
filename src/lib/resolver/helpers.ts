import type { Grant } from '@/types/grants';
import type { GrantBundle, SourceTag } from '@/types/sources';
import type { ChoiceDecision, ChoiceKey } from '@/types/choices';

export type TaggedGrant<G extends Grant> = {
  readonly grant: G;
  readonly source: SourceTag;
};

type GrantByType = { [G in Grant as G['type']]: G };
type DecisionByType = { [D in ChoiceDecision as D['type']]: D };

export function collectGrantsByType<T extends Grant['type']>(
  bundles: readonly GrantBundle[],
  type: T
): readonly { grant: GrantByType[T]; source: SourceTag }[] {
  const result: { grant: GrantByType[T]; source: SourceTag }[] = [];
  for (const bundle of bundles) {
    for (const grant of bundle.grants) {
      if (grant.type === type) {
        result.push({ grant: grant as GrantByType[T], source: bundle.source });
      }
    }
  }
  return result;
}

export function collectChoicesByType<K extends ChoiceDecision['type']>(
  choices: Readonly<Record<ChoiceKey, ChoiceDecision>>,
  type: K
): readonly (DecisionByType[K] & { readonly key: ChoiceKey })[] {
  const result: (DecisionByType[K] & { readonly key: ChoiceKey })[] = [];
  for (const [key, decision] of Object.entries(choices) as [ChoiceKey, ChoiceDecision][]) {
    if (decision.type === type) {
      result.push({ ...(decision as DecisionByType[K]), key });
    }
  }
  return result;
}
