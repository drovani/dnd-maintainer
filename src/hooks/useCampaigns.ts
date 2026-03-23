import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Campaign, CampaignSummary } from '@/types/database'
import { CAMPAIGN_SUMMARY_COLS, CAMPAIGN_DETAIL_COLS } from '@/lib/query-columns'

// --- Queries ---

export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select(CAMPAIGN_SUMMARY_COLS)
        .is('archived_at', null)
        .order('updated_at', { ascending: false })
      if (error) throw error
      return (data || []) as unknown as CampaignSummary[]
    },
  })
}

export function useCampaign(id: string | undefined) {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select(CAMPAIGN_DETAIL_COLS)
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as unknown as Campaign
    },
    enabled: !!id,
  })
}

// --- Mutations ---

export function useCampaignMutations() {
  const queryClient = useQueryClient()

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['campaigns'] })

  const create = useMutation({
    mutationFn: async (campaign: { name: string; setting?: string; description?: string }) => {
      const { data, error } = await supabase
        .from('campaigns')
        .insert({ ...campaign, status: 'planning' })
        .select()
        .single()
      if (error) throw error
      return data as Campaign
    },
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Campaign> & { id: string }) => {
      const { data, error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Campaign
    },
    onSuccess: (data) => {
      invalidate()
      queryClient.setQueryData(['campaign', data.id], data)
    },
  })

  const archive = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('campaigns')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return { create, update, archive }
}
