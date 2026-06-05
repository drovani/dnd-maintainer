import { getLogger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AbilityScoresPanel } from '@/components/character-sheet/AbilityScoresPanel';
import { AttacksPanel } from '@/components/character-sheet/AttacksPanel';
import { BackstoryPanel } from '@/components/character-sheet/BackstoryPanel';
import { CharacterSheetHeader } from '@/components/character-sheet/CharacterSheetHeader';
import { CombatPanel } from '@/components/character-sheet/CombatPanel';
import { ConditionsPanel } from '@/components/character-sheet/ConditionsPanel';
import { EquipmentPanel } from '@/components/character-sheet/EquipmentPanel';
import { FeaturesPanel } from '@/components/character-sheet/FeaturesPanel';
import { HitDicePanel } from '@/components/character-sheet/HitDicePanel';
import { PendingChoicesPanel } from '@/components/character-sheet/PendingChoicesPanel';
import { PersonalityPanel } from '@/components/character-sheet/PersonalityPanel';
import { ProficienciesPanel } from '@/components/character-sheet/ProficienciesPanel';
import { ResourcePoolsPanel } from '@/components/character-sheet/ResourcePoolsPanel';
import { SavingThrowsPanel } from '@/components/character-sheet/SavingThrowsPanel';
import { SkillsPanel } from '@/components/character-sheet/SkillsPanel';
import { SpellcastingPanel } from '@/components/character-sheet/SpellcastingPanel';
import { SpellSlotsPanel } from '@/components/character-sheet/SpellSlotsPanel';
import { ConfirmActionDialog, type ConfirmAction } from '@/components/character-sheet/edit-dialogs/ConfirmActionDialog';
import { EditHeaderDialog } from '@/components/character-sheet/edit-dialogs/EditHeaderDialog';
import { EditPersonalityDialog } from '@/components/character-sheet/edit-dialogs/EditPersonalityDialog';
import { EditTextDialog } from '@/components/character-sheet/edit-dialogs/EditTextDialog';
import { buildRestUpdate } from '@/lib/rest';
import { exportCharacterPdf, PdfTemplateError } from '@/lib/pdf-export';
import { collectFeatSources } from '@/lib/pdf-field-map';
import { useCharacter, useCharacterMutations } from '@/hooks/useCharacters';
import { useCharacterBuildLevels, useCharacterItems } from '@/hooks/useCharacterBuild';
import { usePageTitle } from '@/hooks/usePageTitle';
import { CharacterProvider, useCharacterContext } from '@/hooks/useCharacterContext';
import type { PersistedItem } from '@/lib/resolver/index';
import type { SourceTag } from '@/types/sources';
import { getProficiencyBonus } from '@/lib/dnd-helpers';
import type { Character } from '@/types/database';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useBuilderAutosave } from '@/hooks/useBuilderAutosave';
import type { AutosavePayload } from '@/hooks/useBuilderAutosave';

const logger = getLogger('character-sheet');

type EditSection = 'header' | 'personality' | 'backstory' | 'appearance' | null;

function CharacterSheetInner({
  character,
  itemsData,
  characterId,
}: {
  character: Character;
  itemsData: Array<{ id: string; item_id: string; equipped?: boolean; quantity: number; source?: unknown }>;
  characterId: string;
}) {
  const { t: tc } = useTranslation('common');
  const { t: tg } = useTranslation('gamedata');
  const [editSection, setEditSection] = useState<EditSection>(null);

  const navigate = useNavigate();
  const { campaignSlug } = useParams<{ campaignSlug: string }>();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [cloneName, setCloneName] = useState('');

  usePageTitle(character.name);

  const { update: updateMutation, remove: removeMutation, clone: cloneMutation } = useCharacterMutations();
  const {
    character: ctxCharacter,
    rows,
    resolved,
    bundles,
    build,
    buildError,
    buildWarnings,
    isDirty,
    markSaved,
  } = useCharacterContext();
  const { saveDraft } = useBuilderAutosave(characterId);
  const [saveFailed, setSaveFailed] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Autosave when isDirty (level up/down, choices, etc.)
  const latestPayloadRef = useRef<AutosavePayload>({ character: ctxCharacter, rows, resolved });
  useEffect(() => {
    latestPayloadRef.current = { character: ctxCharacter, rows, resolved };
  });

  const doSave = useCallback(async () => {
    setSaveFailed(false);
    try {
      await saveDraft(latestPayloadRef.current);
      markSaved();
    } catch (err: unknown) {
      logger.error('Autosave failed:', err);
      setSaveFailed(true);
      toast.error(tc('characterBuilder.errors.failedToSaveDraft'));
    }
  }, [saveDraft, markSaved, tc]);

  const isDirtyRef = useRef(isDirty);
  const doSaveRef = useRef(doSave);
  useEffect(() => {
    isDirtyRef.current = isDirty;
    doSaveRef.current = doSave;
  });

  useEffect(() => {
    if (!isDirty) return;
    const timer = setTimeout(doSave, 500);
    return () => clearTimeout(timer);
  }, [isDirty, doSave]);

  // Flush a pending autosave on unmount so the last level-up isn't lost when the user navigates away within the debounce window.
  useEffect(() => {
    return () => {
      if (isDirtyRef.current) {
        void doSaveRef.current();
      }
    };
  }, []);

  const handleUpdate = (updates: Partial<Character>) => {
    updateMutation.mutate(
      { id: characterId, ...updates },
      {
        onSuccess: () => setEditSection(null),
        onError: () => toast.error(tc('characterSheet.errors.updateFailed')),
      }
    );
  };

  const handleShortRest = () => {
    if (!resolved) return;
    handleUpdate(buildRestUpdate('short', character, resolved));
  };

  const handleLongRest = () => {
    if (!resolved) return;
    handleUpdate(buildRestUpdate('long', character, resolved));
  };

  const handleArchive = () => {
    updateMutation.mutate(
      { id: characterId, is_active: false },
      {
        onSuccess: () => {
          setConfirmAction(null);
          toast.success(tc('characterSheet.actions.archiveSuccess', { name: character.name }));
          navigate(`/campaign/${campaignSlug}/characters`);
        },
        onError: () => toast.error(tc('characterSheet.errors.archiveFailed')),
      }
    );
  };

  const handleDelete = () => {
    removeMutation.mutate(
      { id: characterId, campaignId: character.campaign_id },
      {
        onSuccess: () => {
          setConfirmAction(null);
          toast.success(tc('characterSheet.actions.deleteSuccess', { name: character.name }));
          navigate(`/campaign/${campaignSlug}/characters`);
        },
        onError: () => toast.error(tc('characterSheet.errors.deleteFailed')),
      }
    );
  };

  const handleClone = () => {
    const name = cloneName.trim() || tc('characterSheet.actions.copyOfName', { name: character.name });
    cloneMutation.mutate(
      { sourceCharacterId: characterId, newName: name },
      {
        onSuccess: (cloned) => {
          setConfirmAction(null);
          toast.success(tc('characterSheet.actions.cloneSuccess', { name: cloned.name }));
          navigate(`/campaign/${campaignSlug}/character/${cloned.slug}`);
        },
        onError: () => toast.error(tc('characterSheet.errors.cloneFailed')),
      }
    );
  };

  const handleExportPdf = async () => {
    if (!resolved) {
      toast.error(tc('characterSheet.export.notReady'));
      return;
    }
    setExportingPdf(true);
    try {
      const featSources = collectFeatSources(bundles, build?.choices ?? {});
      const { missingFields } = await exportCharacterPdf(resolved, character, tg, featSources);
      if (missingFields.length > 0) {
        toast.warning(tc('characterSheet.export.successWithMissing', { count: missingFields.length }));
        logger.warn('PDF template missing mapped fields:', missingFields);
      } else {
        toast.success(tc('characterSheet.export.success'));
      }
    } catch (err: unknown) {
      if (err instanceof PdfTemplateError) {
        toast.error(tc('characterSheet.export.noTemplate'));
      } else {
        logger.error('PDF export failed:', err);
        toast.error(tc('characterSheet.export.failed'));
      }
    } finally {
      setExportingPdf(false);
    }
  };

  const profBonus = resolved?.proficiencyBonus ?? getProficiencyBonus(character.level);

  // Combat stats — prefer resolved pipeline values, fall back to pre-calculated DB columns.
  // When buildError is set and resolved is null, these are stale values from the database.
  const isStale = buildError !== null && resolved === null;
  const armorClass = resolved?.armorClass.effective ?? character.armor_class;
  const speedValue = resolved?.speed.walk?.value ?? character.speed;
  const maxHP = resolved?.hitPoints.max ?? character.hit_points_max;

  // Ability scores — use resolved if available, else undefined (skip section)
  const abilities = resolved?.abilities;
  const skills = resolved?.skills;
  const savingThrows = resolved?.savingThrows;

  const hasPersonality = character.personality_traits || character.ideals || character.bonds || character.flaws;
  const hasSpells =
    resolved?.spellcasting &&
    (resolved.spellcasting.cantrips.length > 0 || resolved.spellcasting.alwaysPreparedSpells.length > 0);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto p-8">
        {buildError && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive text-sm">
            {tc('characterSheet.errors.buildFailed', { message: buildError })}
          </div>
        )}
        {buildWarnings.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/40 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
            {tc('characterSheet.warnings.buildIncomplete', { message: buildWarnings.join('; ') })}
          </div>
        )}
        {saveFailed && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive text-sm flex items-center justify-between">
            <span>{tc('errors.saveFailed')}</span>
            <Button variant="outline" size="sm" onClick={doSave}>
              {tc('buttons.retrySave')}
            </Button>
          </div>
        )}

        <CharacterSheetHeader
          character={character}
          onEdit={() => setEditSection('header')}
          onClone={() => {
            setCloneName(tc('characterSheet.actions.copyOfName', { name: character.name }));
            setConfirmAction('clone');
          }}
          onArchive={() => setConfirmAction('archive')}
          onDelete={() => setConfirmAction('delete')}
          onExportPdf={handleExportPdf}
          exportingPdf={exportingPdf}
        />

        {/* Pending Choices Panel */}
        <div className="mb-6">
          <PendingChoicesPanel />
        </div>

        {/* WotC-inspired layout: stats (left) / combat (center) / roleplay & gear (right) */}
        <div className="sheet-grid mb-6">
          {/* Left Column: Abilities, Saving Throws, Skills */}
          <div className="sheet-area-left">
            <AbilityScoresPanel abilities={abilities} buildError={buildError} />
            <SavingThrowsPanel savingThrows={savingThrows} buildError={buildError} />
            {skills ? (
              <SkillsPanel skills={skills} />
            ) : (
              <div className="sheet-panel text-center text-muted-foreground">
                <h2 className="text-lg font-bold text-foreground mb-4">{tc('characterSheet.sections.skills')}</h2>
                <p>
                  {buildError
                    ? tc('characterSheet.buildError.skills', { message: buildError })
                    : tc('characterSheet.emptyState.skills')}
                </p>
              </div>
            )}
          </div>

          {/* Center Column: Combat & Features */}
          <div className="sheet-area-center">
            <CombatPanel
              resolved={resolved}
              abilities={abilities}
              armorClass={armorClass}
              speedValue={speedValue}
              maxHP={maxHP}
              profBonus={profBonus}
              isStale={isStale}
              buildError={buildError}
            />

            <ConditionsPanel character={character} onUpdate={handleUpdate} />

            {resolved && (
              <>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={handleShortRest}>
                    {tc('characterSheet.actions.shortRest')}
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={handleLongRest}>
                    {tc('characterSheet.actions.longRest')}
                  </Button>
                </div>
                <HitDicePanel resolved={resolved} character={character} onUpdate={handleUpdate} />
                <SpellSlotsPanel resolved={resolved} character={character} onUpdate={handleUpdate} />
              </>
            )}

            {resolved && <AttacksPanel attacks={resolved.attacks} weaponMasteries={resolved.weaponMasteries} />}
            {resolved && <ProficienciesPanel resolved={resolved} />}
            {resolved && <ResourcePoolsPanel resolved={resolved} />}
            {resolved?.features && resolved.features.length > 0 && <FeaturesPanel features={resolved.features} />}
          </div>

          {/* Right Column: Equipment, Spells & Personality */}
          <div className="sheet-area-right">
            {itemsData.length > 0 && <EquipmentPanel itemsData={itemsData} />}
            {hasSpells && <SpellcastingPanel spellcasting={resolved.spellcasting!} />}
            {hasPersonality && <PersonalityPanel character={character} onEdit={() => setEditSection('personality')} />}
          </div>
        </div>

        {/* Full Width Backstory & Appearance */}
        <BackstoryPanel
          character={character}
          onEditBackstory={() => setEditSection('backstory')}
          onEditAppearance={() => setEditSection('appearance')}
        />
      </div>

      {/* Edit Dialogs */}
      {editSection === 'header' && (
        <EditHeaderDialog
          character={character}
          onSave={handleUpdate}
          onClose={() => setEditSection(null)}
          saving={updateMutation.isPending}
        />
      )}
      {editSection === 'personality' && (
        <EditPersonalityDialog
          personality_traits={character.personality_traits ?? ''}
          ideals={character.ideals ?? ''}
          bonds={character.bonds ?? ''}
          flaws={character.flaws ?? ''}
          onSave={handleUpdate}
          onClose={() => setEditSection(null)}
          saving={updateMutation.isPending}
        />
      )}
      {editSection === 'backstory' && (
        <EditTextDialog
          title={tc('characterSheet.dialogs.editBackstory')}
          field="backstory"
          value={character.backstory ?? ''}
          onSave={handleUpdate}
          onClose={() => setEditSection(null)}
          saving={updateMutation.isPending}
        />
      )}
      {editSection === 'appearance' && (
        <EditTextDialog
          title={tc('characterSheet.dialogs.editAppearance')}
          field="appearance"
          value={character.appearance ?? ''}
          onSave={handleUpdate}
          onClose={() => setEditSection(null)}
          saving={updateMutation.isPending}
        />
      )}

      {/* Archive / Delete / Clone Confirmation */}
      {confirmAction && (
        <ConfirmActionDialog
          action={confirmAction}
          characterName={character.name}
          cloneName={cloneName}
          onCloneNameChange={setCloneName}
          onConfirm={
            confirmAction === 'archive' ? handleArchive : confirmAction === 'clone' ? handleClone : handleDelete
          }
          onClose={() => setConfirmAction(null)}
          pending={updateMutation.isPending || removeMutation.isPending || cloneMutation.isPending}
        />
      )}
    </div>
  );
}

export default function CharacterSheet() {
  const { t: tc } = useTranslation('common');
  const { characterSlug } = useParams<{ campaignSlug: string; characterSlug: string }>();

  const { data: character, isLoading: characterLoading, error } = useCharacter(characterSlug);
  const { data: buildRows = [], isLoading: rowsLoading, error: rowsError } = useCharacterBuildLevels(character?.id);
  const { data: itemsData = [], isLoading: itemsLoading, error: itemsError } = useCharacterItems(character?.id);

  const equippedItems = useMemo(
    () => itemsData.filter((item) => item.equipped).map((item) => item.item_id),
    [itemsData]
  );

  const isFinalized = character?.status === 'ready';

  const persistedItems = useMemo<readonly PersistedItem[]>(() => {
    if (!isFinalized) return [];
    return itemsData.map((item) => ({
      itemId: item.item_id,
      quantity: item.quantity,
      equipped: item.equipped,
      source: (item.source as SourceTag | null) ?? { origin: 'item' as const, id: item.item_id },
    }));
  }, [isFinalized, itemsData]);

  const isLoading = characterLoading || rowsLoading || itemsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-40 w-full rounded-lg" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96 w-full rounded-lg" />
            <Skeleton className="h-96 w-full rounded-lg" />
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || rowsError || itemsError || !character || !characterSlug) {
    return (
      <div className="min-h-screen p-8">
        <div className="rounded-lg bg-destructive/10 border border-destructive/50 p-4 text-destructive">
          {tc('characterSheet.errors.loadingCharacter', { error: String(error ?? rowsError ?? itemsError) })}
        </div>
      </div>
    );
  }

  return (
    <CharacterProvider
      key={character.id}
      initialCharacter={character}
      initialRows={buildRows}
      initialEquippedItems={equippedItems}
      initialPersistedItems={isFinalized ? persistedItems : undefined}
      useDBInventory={isFinalized}
    >
      <CharacterSheetInner character={character} itemsData={itemsData} characterId={character.id} />
    </CharacterProvider>
  );
}
