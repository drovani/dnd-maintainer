import { formatSigned } from '@/lib/format';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface BonusComponent {
  readonly type: string;
  readonly value: number;
  readonly label: string;
}

interface BonusBreakdownProps {
  readonly components: readonly BonusComponent[];
  readonly total: number;
  readonly title?: string;
}

function ComponentLabel({ type, label }: { type: string; label: string }) {
  const { t } = useTranslation('gamedata');
  const { t: tc } = useTranslation('common');

  if (type === 'ability') {
    return <>{t(`abilities.${label as 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'}`)}</>;
  }
  if (type === 'proficiency') {
    return <>{tc('characterSheet.breakdown.proficiency')}</>;
  }
  if (type === 'fighting-style') {
    return <>{tc('characterSheet.breakdown.fightingStyle')}</>;
  }
  if (label === 'base') {
    return <>{tc('characterSheet.breakdown.base')}</>;
  }
  if (label === 'armor') {
    return <>{tc('characterSheet.breakdown.armor')}</>;
  }
  if (label === 'shield') {
    return <>{tc('characterSheet.breakdown.shield')}</>;
  }
  return <>{label}</>;
}

export function BonusBreakdown({ components, total, title }: BonusBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (components.length === 0) {
    return (
      <span className="font-mono font-bold">
        {title ? `${title} ` : ''}
        {formatSigned(total)}
      </span>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="size-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-3 text-muted-foreground" />
        )}
        <span className="font-mono font-bold">{formatSigned(total)}</span>
      </button>
      {isExpanded && (
        <div className="ml-4 mt-0.5 space-y-0.5">
          {components.map((component, i) => (
            <div key={i} className="flex items-center justify-between text-muted-foreground text-[11px]">
              <span>
                <ComponentLabel type={component.type} label={component.label} />
              </span>
              <span className="font-mono ml-4">{formatSigned(component.value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
