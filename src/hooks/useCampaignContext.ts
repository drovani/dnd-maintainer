import { useOutletContext } from 'react-router-dom';

export interface CampaignContext {
  campaignSlug: string | undefined;
  campaignId: string | undefined;
}

export function useCampaignContext(): CampaignContext {
  return useOutletContext<CampaignContext>();
}
