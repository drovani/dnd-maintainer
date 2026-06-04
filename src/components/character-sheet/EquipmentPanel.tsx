import { getGrantIcon, getSourceDisplayName } from '@/lib/class-icons';
import { getItemDef, getItemNameKey } from '@/lib/sources/items';
import type { SourceTag } from '@/types/sources';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ItemRow = { id: string; item_id: string; equipped?: boolean; quantity: number; source?: unknown };

export function EquipmentPanel({ itemsData }: { itemsData: readonly ItemRow[] }) {
  const { t } = useTranslation('gamedata');
  const { t: tc } = useTranslation('common');

  return (
    <div className="sheet-panel">
      <h2 className="text-lg font-bold text-foreground mb-4">{tc('characterSheet.sections.equipment')}</h2>
      <div className="space-y-2 text-xs">
        {itemsData.map((item) => {
          const itemDef = getItemDef(item.item_id);
          const type = itemDef?.type ?? 'gear';
          const itemName = t(getItemNameKey(type, item.item_id), {
            defaultValue: item.item_id.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
          });
          const detail = (() => {
            if (itemDef?.type === 'weapon') {
              return ` — ${itemDef.damageDice} ${t(`damageTypes.${itemDef.damageType}`)}`;
            }
            if (itemDef?.type === 'armor') {
              return ` — AC ${itemDef.baseAc}`;
            }
            return '';
          })();
          const itemSource = item.source as SourceTag | null;
          const sourceTooltip = itemSource
            ? itemSource.origin === 'loot'
              ? tc('characterSheet.equipment.sourceLoot')
              : tc('characterSheet.equipment.sourceFrom', {
                  name: getSourceDisplayName(itemSource, t),
                })
            : null;
          const SourceIcon = itemSource
            ? getGrantIcon(itemSource, itemDef?.type === 'pack' ? 'pack' : undefined)
            : null;
          return (
            <div
              key={item.id}
              className={`flex justify-between items-center py-2 px-2 rounded ${item.equipped ? 'bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-900' : 'bg-muted/50'}`}
            >
              <div>
                <div className="font-semibold text-foreground">
                  {itemName}
                  {detail}
                </div>
                <div className="text-muted-foreground">
                  {tc('characterSheet.fields.qtyAndWeight', {
                    qty: item.quantity,
                    weight: itemDef?.type !== 'pack' ? (itemDef?.weight ?? 0) : 0,
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.equipped && <Check className="size-4 text-green-600" />}
                {SourceIcon && (
                  <span title={sourceTooltip ?? undefined} className="inline-flex">
                    <SourceIcon
                      aria-label={sourceTooltip ?? undefined}
                      className="size-5 text-muted-foreground shrink-0"
                    />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
