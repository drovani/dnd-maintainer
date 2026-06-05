import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Campaign, CampaignSummary } from '@/types/database';
import { CAMPAIGN_SUMMARY_COLS, CAMPAIGN_DETAIL_COLS } from '@/lib/query-columns';
import { validateSlug } from '@/lib/slug-utils';

// --- Queries ---

export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      // Order by the `last_activity_at` computed field (most recent session date,
      // falling back to created_at) rather than `updated_at`, so non-activity edits
      // like theme changes don't reorder the list. The field is a PostgREST computed
      // column defined in migration 20260607000000; ordering by it needs no select.
      const { data, error } = await supabase
        .from('campaigns')
        .select(CAMPAIGN_SUMMARY_COLS)
        .is('archived_at', null)
        .order('last_activity_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as CampaignSummary[];
    },
  });
}

export function useCampaign(slug: string | undefined) {
  return useQuery({
    queryKey: ['campaign', slug],
    queryFn: async () => {
      const safe = validateSlug(slug!);
      const { data, error } = await supabase
        .from('campaigns')
        .select(CAMPAIGN_DETAIL_COLS)
        .or(`slug.eq.${safe},previous_slugs.cs.{"${safe}"}`)
        .single();
      if (error) throw error;
      return data as unknown as Campaign;
    },
    enabled: !!slug,
  });
}

// --- Mutations ---

/** Project a full campaign row down to the summary shape held in the list cache. */
function toCampaignSummary(c: Campaign): CampaignSummary {
  return {
    id: c.id,
    slug: c.slug,
    previous_slugs: c.previous_slugs,
    name: c.name,
    description: c.description,
    setting: c.setting,
    status: c.status,
    theme: c.theme,
    created_at: c.created_at,
    updated_at: c.updated_at,
    archived_at: c.archived_at,
  };
}

export function useCampaignMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['campaigns'] });

  const create = useMutation({
    mutationFn: async (campaign: { name: string; setting?: string; description?: string }) => {
      const { data, error } = await supabase
        .from('campaigns')
        .insert({ ...campaign, status: 'planning' })
        .select()
        .single();
      if (error) throw error;
      return data as Campaign;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Campaign> & { id: string }) => {
      const { data, error } = await supabase.from('campaigns').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data as Campaign;
    },
    // Capture the campaign's slug before the write so onSuccess can tell whether a
    // rename changed it (a rename moves the slug; the page may still be keyed on the
    // old one, reachable via previous_slugs).
    onMutate: ({ id }) => {
      const entry = queryClient
        .getQueriesData<Campaign>({ queryKey: ['campaign'] })
        .find(([, cached]) => cached?.id === id);
      return { previousSlug: entry?.[1]?.slug };
    },
    onSuccess: (data, _variables, context) => {
      // The PATCH returns the full updated row, so refresh the caches in place rather
      // than refetching. List order is keyed on the `last_activity_at` computed field,
      // not `updated_at`, so a metadata edit never reorders the list — only its fields.
      queryClient.setQueryData(['campaign', data.slug], data);
      queryClient.setQueryData<CampaignSummary[]>(['campaigns'], (old) =>
        old?.map((c) => (c.id === data.id ? toCampaignSummary(data) : c))
      );
      // On rename, also refresh the old-slug detail entry so a page still mounted on it
      // shows the new data without a round-trip (the old slug now resolves to this row).
      const { previousSlug } = context ?? {};
      if (previousSlug && previousSlug !== data.slug) {
        queryClient.setQueryData(['campaign', previousSlug], data);
      }
    },
  });

  const archive = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('campaigns').update({ archived_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { create, update, archive };
}
