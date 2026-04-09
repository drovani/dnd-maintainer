import { useOutletContext } from 'react-router-dom';

export interface CampaignContext {
  campaignSlug: string | undefined;
  campaignId: string | undefined;
}

/**
 * Returns the current campaign's slug and ID from Layout's outlet context.
 * Throws if called outside a Layout outlet (programming error).
 */
export function useCampaignContext(): CampaignContext {
  const ctx = useOutletContext<CampaignContext>();
  if (!ctx) throw new Error('useCampaignContext must be used within a Layout outlet');
  return ctx;
}
