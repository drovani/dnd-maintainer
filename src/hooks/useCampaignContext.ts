import { useOutletContext } from 'react-router-dom';

export type CampaignContext = (
  | { campaignSlug: string; campaignId: string }
  | { campaignSlug: undefined; campaignId: undefined }
) & {
  setPageTitle: (title: string) => void;
};

/**
 * Returns the current campaign's slug and ID (from Layout's outlet context)
 * plus a setter for the mobile page header title.
 * Throws if called outside a Layout outlet (programming error).
 */
export function useCampaignContext(): CampaignContext {
  const ctx = useOutletContext<CampaignContext>();
  if (!ctx) throw new Error('useCampaignContext must be used within a Layout outlet');
  return ctx;
}
