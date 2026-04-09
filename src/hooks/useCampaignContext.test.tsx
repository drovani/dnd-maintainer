import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCampaignContext } from '@/hooks/useCampaignContext'

// Mock react-router-dom's useOutletContext
vi.mock('react-router-dom', () => ({
  useOutletContext: vi.fn(),
}))

import { useOutletContext } from 'react-router-dom'

const mockUseOutletContext = vi.mocked(useOutletContext)

describe('useCampaignContext', () => {
  it('returns campaignSlug and campaignId from outlet context', () => {
    mockUseOutletContext.mockReturnValue({
      campaignSlug: 'my-campaign-abc1',
      campaignId: 'uuid-123',
    })

    const { result } = renderHook(() => useCampaignContext())

    expect(result.current.campaignSlug).toBe('my-campaign-abc1')
    expect(result.current.campaignId).toBe('uuid-123')
  })

  it('returns undefined values when campaign is not yet resolved', () => {
    mockUseOutletContext.mockReturnValue({
      campaignSlug: 'some-slug',
      campaignId: undefined,
    })

    const { result } = renderHook(() => useCampaignContext())

    expect(result.current.campaignSlug).toBe('some-slug')
    expect(result.current.campaignId).toBeUndefined()
  })

  it('throws when used outside a Layout outlet', () => {
    mockUseOutletContext.mockReturnValue(null)

    expect(() => {
      renderHook(() => useCampaignContext())
    }).toThrow('useCampaignContext must be used within a Layout outlet')
  })
})
