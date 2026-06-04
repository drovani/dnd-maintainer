import { Button } from '@/components/ui/button';
import { PortraitUpload } from '@/components/character-sheet/PortraitUpload';
import { LevelControls } from '@/components/character-sheet/LevelControls';
import { useCharacterContext } from '@/hooks/useCharacterContext';
import { BACKGROUND_SOURCES } from '@/lib/sources/backgrounds';
import { deriveOriginFeatInfo } from '@/lib/character-builder/origin-feat-info';
import { DND_CLASSES, isBackgroundId, type ClassId } from '@/lib/dnd-helpers';
import type { Character } from '@/types/database';
import { Archive, Copy, Edit2, FileDown, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function CharacterSheetHeader({
  character,
  onEdit,
  onClone,
  onArchive,
  onDelete,
  onExportPdf,
  exportingPdf = false,
}: {
  character: Character;
  onEdit: () => void;
  onClone: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onExportPdf?: () => void;
  exportingPdf?: boolean;
}) {
  const { t } = useTranslation('gamedata');
  const { t: tc } = useTranslation('common');
  const { build, level: resolvedLevel } = useCharacterContext();

  const alignmentName = character.alignment
    ? t(`alignments.${character.alignment}`, { defaultValue: character.alignment })
    : '';

  // Lineage: find the lineage-choice decision made during character creation,
  // scoped to the current species so stale entries from a prior species are ignored.
  const lineageId: string | null = (() => {
    if (!build || !character.species) return null;
    const prefix = `lineage-choice:species:${character.species}:`;
    const entry = Object.entries(build.choices).find(([key]) => key.startsWith(prefix));
    if (!entry) return null;
    const decision = entry[1];
    return decision.type === 'lineage-choice' ? decision.lineageId : null;
  })();

  // Origin feat: derive badge info from the background source's grants.
  // deriveOriginFeatInfo handles both shapes (feat grant and direct feat-magic-initiate-* feature).
  const originFeatInfo = (() => {
    if (!character.background || !isBackgroundId(character.background)) return null;
    const bg = BACKGROUND_SOURCES.find((s) => s.id === character.background);
    if (!bg) return null;
    return deriveOriginFeatInfo(bg.grants);
  })();

  return (
    <div className="bg-card border rounded-lg p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <PortraitUpload
            characterId={character.id}
            portraitUrl={character.portrait_url}
            characterName={character.name}
          />
          <div>
            <div className="text-sm text-muted-foreground mb-1">{tc('characterSheet.title')}</div>
            <h1 className="hidden md:block text-3xl font-bold text-foreground">{character.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onEdit}
            title={tc('characterSheet.dialogs.editCharacterInfo')}
          >
            <Edit2 size={16} />
          </Button>
          {onExportPdf && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onExportPdf}
              pending={exportingPdf}
              title={tc('characterSheet.export.button')}
            >
              <FileDown size={16} />
            </Button>
          )}
          <Button variant="ghost" size="icon-sm" onClick={onClone} title={tc('buttons.clone')}>
            <Copy size={16} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onArchive} title={tc('buttons.archive')}>
            <Archive size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            title={tc('buttons.delete')}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">{tc('characterSheet.fields.class')}</span>
          <p className="text-foreground font-semibold">
            {character.class ? t(`classes.${character.class}`, { defaultValue: character.class }) : ''}
            {character.subclass
              ? ` (${t(`subclasses.${character.subclass}.name`, { defaultValue: character.subclass })})`
              : ''}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">{tc('characterSheet.fields.level')}</span>
          <p className="text-foreground font-semibold">{resolvedLevel}</p>
        </div>
        <div>
          <span className="text-muted-foreground">{tc('characterSheet.fields.species')}</span>
          <p className="text-foreground font-semibold">
            {character.species ? t(`species.${character.species}`, { defaultValue: character.species }) : ''}
          </p>
          {lineageId && character.species && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(`lineages.${character.species}.${lineageId}`, { defaultValue: lineageId })}
            </p>
          )}
        </div>
        <div>
          <span className="text-muted-foreground">{tc('characterSheet.fields.background')}</span>
          <p className="text-foreground font-semibold">
            {character.background
              ? isBackgroundId(character.background)
                ? t(`backgrounds.${character.background}`)
                : character.background
              : ''}
          </p>
          {originFeatInfo && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {originFeatInfo.namespace === 'features'
                ? t(`features.${originFeatInfo.id}.name` as `features.${string}.name`, {
                    defaultValue: originFeatInfo.id,
                  })
                : t(`feats.${originFeatInfo.id}.name` as `feats.${string}.name`, {
                    defaultValue: originFeatInfo.id,
                  })}
            </p>
          )}
        </div>
        <div>
          <span className="text-muted-foreground">{tc('characterSheet.fields.alignment')}</span>
          <p className="text-foreground font-semibold">{alignmentName}</p>
        </div>
        {character.player_name && (
          <div>
            <span className="text-muted-foreground">{tc('characterSheet.fields.player')}</span>
            <p className="text-foreground font-semibold">{character.player_name}</p>
          </div>
        )}
        <div>
          <span className="text-muted-foreground">{tc('characterSheet.fields.type')}</span>
          <p className="text-foreground font-semibold uppercase">{tc(`characterType.${character.character_type}`)}</p>
        </div>
        {character.gender && (
          <div>
            <span className="text-muted-foreground">{tc('characterSheet.fields.gender')}</span>
            <p className="text-foreground font-semibold">
              {t(`gender.${character.gender}`, { defaultValue: character.gender })}
            </p>
          </div>
        )}
      </div>

      {character.class && DND_CLASSES.some((c) => c.id === character.class) && (
        <div className="mt-4 pt-4 border-t">
          <LevelControls classId={character.class as ClassId} />
        </div>
      )}
    </div>
  );
}
