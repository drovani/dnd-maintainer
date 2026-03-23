import { supabase } from "@/lib/supabase";
import type { DndGender, RaceId, ClassId, AlignmentId } from "@/lib/dnd-helpers";
import type { AbilityScores, EquipmentItem, Feature, Proficiencies } from "@/types/database";
import type { TablesInsert, TablesUpdate } from "@/types/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface BuilderPayload {
  campaign_id: string;
  name: string;
  character_type: "pc" | "npc";
  player_name: string | null;
  race: RaceId | null;
  class: ClassId | null;
  subclass: string | null;
  level: number;
  background: string | null;
  alignment: AlignmentId | null;
  gender: DndGender | null;
  hit_points_max: number;
  hit_points_current: number;
  armor_class: number;
  speed: number;
  abilities: AbilityScores;
  saving_throws: Record<string, { proficient: boolean }>;
  skills: Record<string, { proficient: boolean; expertise: boolean }>;
  proficiencies: Proficiencies | null;
  features: Feature[];
  equipment: EquipmentItem[];
  spells: {
    cantrips: string[];
    spellsByLevel: Record<number, string[]>;
    spellSlots: Record<number, number>;
  };
  personality_traits: string | null;
  ideals: string | null;
  bonds: string | null;
  flaws: string | null;
  appearance: string | null;
  backstory: string | null;
  notes: string | null;
}

/**
 * Specialized write hook for the character builder's draft persistence flow.
 *
 * Separate from `useCharacterMutations` because:
 * - Tracks a mutable character ID across create→update transitions
 * - Serializes concurrent saves (best-effort sequencing)
 * - Manages a 4-state save status (idle→saving→saved|error)
 * - Supports draft→ready status promotion via `finalize`
 *
 * `saveDraft` creates on first call, updates on subsequent calls.
 * `finalize` saves the draft then promotes status from 'draft' to 'ready'.
 * `clearStatus` transitions 'saved' back to 'idle' (preserves 'error').
 */
export function useBuilderAutosave() {
  const characterIdRef = useRef<string | null>(null);
  const savingRef = useRef<Promise<string> | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const queryClient = useQueryClient();

  const saveDraft = useCallback(
    async (payload: BuilderPayload): Promise<string> => {
      // If a previous save is in flight, wait for it to settle before starting a new one (best-effort sequencing)
      if (savingRef.current) {
        try {
          await savingRef.current;
        } catch (prevErr) {
          console.warn("Previous autosave failed (retrying with fresh data):", prevErr);
        }
      }

      setSaveStatus("saving");

      const promise = (async () => {
        try {
          if (characterIdRef.current) {
            const { error } = await supabase
              .from("characters")
              .update(payload as unknown as TablesUpdate<"characters">)
              .eq("id", characterIdRef.current);
            if (error) throw error;
          } else {
            const insertPayload = { ...payload, status: "draft" as const };
            const { data, error } = await supabase
              .from("characters")
              .insert(insertPayload as unknown as TablesInsert<"characters">)
              .select("id")
              .single();
            if (error) throw error;
            if (!data?.id) throw new Error("Insert succeeded but no character ID was returned");
            characterIdRef.current = (data as { id: string }).id;
            queryClient.invalidateQueries({ queryKey: ["characters", payload.campaign_id] });
          }
          setSaveStatus("saved");
          const id = characterIdRef.current;
          if (!id) throw new Error("Character ID missing after successful save");
          return id;
        } catch (err) {
          setSaveStatus("error");
          console.error("Draft save failed:", err);
          throw err;
        }
      })();

      // Assign ref synchronously so the next saveDraft call sees it before this promise settles
      savingRef.current = promise;
      // Clean up ref after promise settles
      promise.finally(() => {
        savingRef.current = null;
      });

      return promise;
    },
    [queryClient],
  );

  const finalize = useCallback(
    async (payload: BuilderPayload): Promise<string> => {
      const id = await saveDraft(payload);
      try {
        const { error } = await supabase
          .from("characters")
          .update({ status: "ready" } as unknown as TablesUpdate<"characters">)
          .eq("id", id);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["characters", payload.campaign_id] });
        return id;
      } catch (err) {
        setSaveStatus("error");
        console.error("Failed to finalize character (draft was saved):", err);
        throw err;
      }
    },
    [saveDraft, queryClient],
  );

  const clearStatus = useCallback(() => {
    setSaveStatus((prev) => (prev === "saved" ? "idle" : prev));
  }, []);

  return { saveStatus, saveDraft, finalize, clearStatus };
}
