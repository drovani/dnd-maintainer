import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useCharacterContext } from '@/hooks/useCharacterContext';
import { computePurchaseTotal, getStartingGold } from '@/lib/gold-equipment';
import { getLogger } from '@/lib/logger';
import { collectGrantsByType } from '@/lib/resolver/helpers';
import {
  ARMOR_CATALOG,
  GEAR_CATALOG,
  getItemDef,
  getItemNameKey,
  PACK_CATALOG,
  WEAPON_CATALOG,
} from '@/lib/sources/items';
import { BUNDLE_CATEGORIES, type WeaponMasteryId } from '@/types/items';
import type { ClassId } from '@/lib/dnd-helpers';
import { useTranslation } from 'react-i18next';
import { ChoicePicker } from './ChoicePicker';
import type { ChoiceDecision } from '@/types/choices';
import type { PendingChoice } from '@/types/resolved';

const logger = getLogger('equipment-step');

export type EquipmentMode = 'starting-equipment' | 'buy-with-gold';

export interface PurchasedItem {
  readonly itemId: string;
  readonly quantity: number;
  readonly costGp: number;
}

export interface EquipmentStepEquipmentProps {
  readonly equipmentMode: EquipmentMode;
  readonly startingGoldTotal: number;
  readonly purchasedItems: readonly PurchasedItem[];
  readonly classId: ClassId | null;
  readonly onModeChange: (mode: EquipmentMode) => void;
  readonly onGoldChange: (n: number) => void;
  readonly onPurchase: (itemId: string, costGp: number) => void;
  readonly onRemovePurchase: (itemId: string) => void;
}

export function EquipmentStep({
  equipmentMode,
  startingGoldTotal,
  purchasedItems,
  classId,
  onModeChange,
  onGoldChange,
  onPurchase,
  onRemovePurchase,
}: EquipmentStepEquipmentProps) {
  const { t } = useTranslation('gamedata');
  const { t: tc } = useTranslation('common');
  const context = useCharacterContext();
  const { bundles, resolved, build } = context;

  const allEquipment = resolved?.equipment ?? [];

  // Weapon mastery choices — show all grants so pickers stay visible after a decision is made
  const weaponMasteryGrantTags = collectGrantsByType(bundles, 'weapon-mastery-choice');
  // Compute eligible weapons from proficiencies (mirrors resolver logic)
  const weaponProfValues = new Set(resolved?.weaponProficiencies?.map((p) => p.value) ?? []);
  const eligibleWeaponIds = WEAPON_CATALOG.filter(
    (w) => w.mastery !== undefined && (weaponProfValues.has(w.category) || weaponProfValues.has(w.weaponProficiencyId))
  ).map((w) => w.id);

  const weaponMasteryChoices: readonly (PendingChoice & { type: 'weapon-mastery-choice' })[] =
    weaponMasteryGrantTags.map(({ grant, source }) => {
      const alreadyChosen: string[] = [];
      for (const other of weaponMasteryGrantTags) {
        if (other.grant.key === grant.key) continue;
        const decision = build?.choices[other.grant.key];
        if (decision?.type === 'weapon-mastery-choice') {
          alreadyChosen.push(...decision.weaponIds);
        }
      }
      return {
        type: 'weapon-mastery-choice',
        choiceKey: grant.key,
        source,
        count: grant.count,
        from: eligibleWeaponIds,
        alreadyChosen,
      };
    });
  const hasWeaponMasteryChoices = weaponMasteryChoices.length > 0;

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

  // Look up the committed weapon mastery for a given weapon ID.
  // Checks build.choices for weapon-mastery-choice decisions, then resolved.weaponMasteries.
  function getWeaponMasteryId(weaponId: string): WeaponMasteryId | null {
    // Check build choices
    for (const [, decision] of Object.entries(build?.choices ?? {})) {
      if (decision?.type === 'weapon-mastery-choice' && (decision.weaponIds as string[]).includes(weaponId)) {
        const weaponDef = WEAPON_CATALOG.find((w) => w.id === weaponId);
        if (!weaponDef) {
          logger.warn(`[EquipmentStep] weapon mastery committed for unknown weapon: ${weaponId}`);
          return null;
        }
        return weaponDef.mastery ?? null;
      }
    }
    // Check resolved weapon masteries
    const fromResolved = resolved?.weaponMasteries.find((wm) => wm.weaponId === weaponId);
    return fromResolved?.masteryId ?? null;
  }

  const spentGp = computePurchaseTotal(purchasedItems);
  const isOverBudget = startingGoldTotal > 0 && spentGp > startingGoldTotal;
  const classStartingGold = getStartingGold(classId);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-8">
        {/* Mode toggle */}
        <section className="space-y-3">
          <ToggleGroup
            aria-label={tc('characterBuilder.equipment.modeToggleLabel')}
            variant="outline"
            value={[equipmentMode]}
            onValueChange={(values) => {
              const selected = values[0];
              if (selected === 'starting-equipment' || selected === 'buy-with-gold') {
                onModeChange(selected);
              }
            }}
          >
            <ToggleGroupItem value="starting-equipment">
              {tc('characterBuilder.equipment.modeStartingEquipment')}
            </ToggleGroupItem>
            <ToggleGroupItem value="buy-with-gold">{tc('characterBuilder.equipment.modeBuyWithGold')}</ToggleGroupItem>
          </ToggleGroup>
        </section>

        {equipmentMode === 'starting-equipment' && (
          <>
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

            {hasWeaponMasteryChoices && (
              <section className="space-y-4 border-t pt-6">
                <div className="space-y-1">
                  <h2 className="text-base font-semibold text-foreground">
                    {tc('characterBuilder.equipment.weaponMasteryTitle')}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {tc('characterBuilder.equipment.weaponMasterySubtitle')}
                  </p>
                </div>
                <div className="space-y-4">
                  {weaponMasteryChoices.map((choice) => {
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
              </section>
            )}

            <section className="space-y-2 border-t pt-6">
              <h2 className="text-base font-semibold text-foreground">
                {tc('characterBuilder.equipment.purchaseTitle')}
              </h2>
              <p className="text-sm text-muted-foreground">{tc('characterBuilder.equipment.purchaseComingSoon')}</p>
            </section>
          </>
        )}

        {equipmentMode === 'buy-with-gold' && (
          <>
            {/* Starting gold section */}
            <section className="space-y-3 border-t pt-6">
              <h2 className="text-base font-semibold text-foreground">
                {tc('characterBuilder.equipment.startingGoldTitle')}
              </h2>
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onGoldChange(classStartingGold)}
                  disabled={classStartingGold === 0}
                >
                  {tc('characterBuilder.equipment.useClassGold', { gp: classStartingGold })}
                </Button>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    className="w-28"
                    value={startingGoldTotal}
                    aria-label={tc('characterBuilder.equipment.goldOverrideLabel')}
                    onChange={(e) => onGoldChange(Math.max(0, Number(e.target.value)))}
                  />
                  <span className="text-sm text-muted-foreground">{tc('characterBuilder.equipment.gpUnit')}</span>
                </div>
              </div>
            </section>

            {/* Currency tracker */}
            <section className="rounded-md border px-4 py-3 text-sm space-y-1">
              <p className={isOverBudget ? 'text-destructive font-semibold' : 'text-foreground'} aria-live="polite">
                {tc('characterBuilder.equipment.currencyTracker', {
                  spent: spentGp.toFixed(2),
                  starting: startingGoldTotal.toFixed(2),
                })}
              </p>
              {isOverBudget && (
                <p className="text-destructive text-xs">{tc('characterBuilder.equipment.overBudgetWarning')}</p>
              )}
            </section>

            {/* Purchased items summary */}
            {purchasedItems.length > 0 && (
              <section className="space-y-2 border-t pt-4">
                <h3 className="text-sm font-semibold text-foreground">
                  {tc('characterBuilder.equipment.purchasedItemsTitle')}
                </h3>
                <ul className="space-y-1 text-sm">
                  {purchasedItems.map((item) => (
                    <li key={item.itemId} className="flex items-center gap-2">
                      <span className="text-muted-foreground">{item.quantity}×</span>
                      <span className="flex-1">{renderItemName(item.itemId)}</span>
                      <span className="text-muted-foreground text-xs">
                        {tc('characterBuilder.equipment.itemCost', { gp: (item.costGp * item.quantity).toFixed(2) })}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onRemovePurchase(item.itemId)}
                        aria-label={tc('characterBuilder.equipment.removeItem', {
                          name: renderItemName(item.itemId),
                        })}
                      >
                        {tc('buttons.remove')}
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Catalog sections */}
            <section className="space-y-6 border-t pt-6">
              {/* Weapons */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {tc('characterBuilder.equipment.catalogWeapons')}
                </h3>
                <div className="grid gap-1">
                  {WEAPON_CATALOG.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <span className="flex-1">{t(getItemNameKey('weapon', item.id), { defaultValue: item.id })}</span>
                      <span className="text-muted-foreground w-16 text-right">
                        {tc('characterBuilder.equipment.itemCost', { gp: item.costGp })}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => onPurchase(item.id, item.costGp)}>
                        {tc('characterBuilder.equipment.addItem')}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Armor */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {tc('characterBuilder.equipment.catalogArmor')}
                </h3>
                <div className="grid gap-1">
                  {ARMOR_CATALOG.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <span className="flex-1">{t(getItemNameKey('armor', item.id), { defaultValue: item.id })}</span>
                      <span className="text-muted-foreground w-16 text-right">
                        {tc('characterBuilder.equipment.itemCost', { gp: item.costGp })}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => onPurchase(item.id, item.costGp)}>
                        {tc('characterBuilder.equipment.addItem')}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gear */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {tc('characterBuilder.equipment.catalogGear')}
                </h3>
                <div className="grid gap-1">
                  {GEAR_CATALOG.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <span className="flex-1">{t(getItemNameKey('gear', item.id), { defaultValue: item.id })}</span>
                      <span className="text-muted-foreground w-16 text-right">
                        {tc('characterBuilder.equipment.itemCost', { gp: item.costGp })}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => onPurchase(item.id, item.costGp)}>
                        {tc('characterBuilder.equipment.addItem')}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Packs */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {tc('characterBuilder.equipment.catalogPacks')}
                </h3>
                <div className="grid gap-1">
                  {PACK_CATALOG.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <span className="flex-1">{t(getItemNameKey('pack', item.id), { defaultValue: item.id })}</span>
                      <span className="text-muted-foreground w-16 text-right">
                        {tc('characterBuilder.equipment.itemCost', { gp: item.costGp })}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => onPurchase(item.id, item.costGp)}>
                        {tc('characterBuilder.equipment.addItem')}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
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
                    {weapons.map((e) => {
                      const masteryId = e.itemDef.type === 'weapon' ? getWeaponMasteryId(e.itemId) : null;
                      return (
                        <li key={e.itemId} className="flex gap-2 text-foreground items-center">
                          <span className="text-muted-foreground">{e.quantity}×</span>
                          <span>{renderItemName(e.itemId)}</span>
                          {masteryId && (
                            <Badge variant="secondary" className="text-xs">
                              {t(`weaponMasteries.${masteryId}.name`)}
                            </Badge>
                          )}
                          {e.itemDef.type === 'weapon' && (
                            <span className="text-muted-foreground">
                              ({e.itemDef.damageDice} {t(`damageTypes.${e.itemDef.damageType}`)})
                            </span>
                          )}
                        </li>
                      );
                    })}
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
