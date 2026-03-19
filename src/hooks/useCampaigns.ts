import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Campaign } from '@/types/database'

// --- Queries ---

export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .is('archived_at', null)
        .order('updated_at', { ascending: false })
      if (error) throw error
      return (data || []) as Campaign[]
    },
  })
}

export function useCampaign(id: string | undefined) {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Campaign
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
