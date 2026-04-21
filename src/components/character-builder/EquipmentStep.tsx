import { useCharacterContext } from '@/hooks/useCharacterContext';
import { collectGrantsByType } from '@/lib/resolver/helpers';
import { getItemDef, getItemNameKey } from '@/lib/sources/items';
import { BUNDLE_CATEGORIES } from '@/types/items';
import { useTranslation } from 'react-i18next';
import { ChoicePicker } from './ChoicePicker';
import type { ChoiceDecision } from '@/types/choices';
import type { PendingChoice } from '@/types/resolved';

export function EquipmentStep() {
  const { t } = useTranslation('gamedata');
  const { t: tc } = useTranslation('common');
  const context = useCharacterContext();
  const { bundles, resolved, build } = context;

  const allEquipment = resolved?.equipment ?? [];

  // Drive the class loadout UI from the class's bundle-choice grants (not pendingChoices),
  // so options remain visible after a decision is made and the user can change their pick.
  const classBundleChoiceGrants = collectGrantsByType(bundles, 'bundle-choice')
    .filter((tg) => tg.source.origin === 'class')
    .sort((a, b) => {
      const aIdx = BUNDLE_CATEGORIES.indexOf(a.grant.category);
      const bIdx = BUNDLE_CATEGORIES.indexOf(b.grant.category);
      return aIdx - bIdx;
    });

  // Synthesize the PendingChoice shape that ChoicePicker expects from each tagged grant.
  const classBundleChoices: readonly (PendingChoice & { type: 'bundle-choice' })[] = classBundleChoiceGrants.map(
    ({ grant, source }) => ({
      type: 'bundle-choice',
      choiceKey: grant.key,
      source,
      category: grant.category,
      bundleIds: grant.bundleIds,
    })
  );

  // Group resolved equipment by type for the running summary
  const weapons = allEquipment.filter((e) => e.itemDef.type === 'weapon');
  const armor = allEquipment.filter((e) => e.itemDef.type === 'armor');
  const gear = allEquipment.filter((e) => e.itemDef.type === 'gear');
  const packs = allEquipment.filter((e) => e.itemDef.type === 'pack');

  const hasAnyEquipment = allEquipment.length > 0;
  const hasClassBundleChoices = classBundleChoices.length > 0;

  function renderItemName(itemId: string): string {
    const itemDef = getItemDef(itemId);
    const type = itemDef?.type ?? 'gear';
    return t(getItemNameKey(type, itemId), { defaultValue: '' });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-8">
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">
              {tc('characterBuilder.equipment.classLoadoutTitle')}
            </h2>
            <p className="text-sm text-muted-foreground">{tc('characterBuilder.equipment.classLoadoutSubtitle')}</p>
          </div>

          {hasClassBundleChoices ? (
            <div className="space-y-4">
              {classBundleChoices.map((choice) => {
                const decision = build?.choices[choice.choiceKey];
                return (
                  <ChoicePicker
                    key={choice.choiceKey}
                    choice={choice}
                    currentDecision={decision as ChoiceDecision | undefined}
                    onDecide={(key, d) => context.makeChoice(key, d)}
                    onClear={(key) => context.clearChoice(key)}
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{tc('characterBuilder.equipment.comingSoon')}</p>
          )}
        </section>

        <section className="space-y-2 border-t pt-6">
          <h2 className="text-base font-semibold text-foreground">{tc('characterBuilder.equipment.purchaseTitle')}</h2>
          <p className="text-sm text-muted-foreground">{tc('characterBuilder.equipment.purchaseComingSoon')}</p>
        </section>
      </div>

      <aside className="lg:sticky lg:top-4 lg:self-start">
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">{tc('characterBuilder.equipment.summary')}</h3>
          {hasAnyEquipment ? (
            <div className="space-y-3 text-sm">
              {weapons.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-muted-foreground mb-1 uppercase">
                    {t('weaponCategories.simple')}/{t('weaponCategories.martial')}
                  </div>
                  <ul className="space-y-0.5">
                    {weapons.map((e) => (
                      <li key={e.itemId} className="flex gap-2 text-foreground">
                        <span className="text-muted-foreground">{e.quantity}×</span>
                        <span>{renderItemName(e.itemId)}</span>
                        {e.itemDef.type === 'weapon' && (
                          <span className="text-muted-foreground">
                            ({e.itemDef.damageDice} {t(`damageTypes.${e.itemDef.damageType}`)})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {armor.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-muted-foreground mb-1 uppercase">
                    {tc('characterSheet.proficiencies.armor')}
                  </div>
                  <ul className="space-y-0.5">
                    {armor.map((e) => (
                      <li key={e.itemId} className="flex gap-2 text-foreground">
                        <span className="text-muted-foreground">{e.quantity}×</span>
                        <span>{renderItemName(e.itemId)}</span>
                        {e.itemDef.type === 'armor' && (
                          <span className="text-muted-foreground">
                            {tc('characterSheet.attacks.acFormat', { ac: e.itemDef.baseAc })}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {gear.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-muted-foreground mb-1 uppercase">
                    {tc('characterSheet.sections.equipment')}
                  </div>
                  <ul className="space-y-0.5">
                    {gear.map((e) => (
                      <li key={e.itemId} className="flex gap-2 text-foreground">
                        <span className="text-muted-foreground">{e.quantity}×</span>
                        <span>{renderItemName(e.itemId)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {packs.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-muted-foreground mb-1 uppercase">
                    {t('bundleCategories.pack')}
                  </div>
                  <ul className="space-y-0.5">
                    {packs.map((e) => (
                      <li key={e.itemId} className="flex gap-2 text-foreground">
                        <span className="text-muted-foreground">{e.quantity}×</span>
                        <span>{renderItemName(e.itemId)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">{tc('characterBuilder.equipment.summaryEmpty')}</p>
          )}
        </div>
      </aside>
    </div>
  );
}
