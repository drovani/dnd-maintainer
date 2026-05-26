import { useEffect } from 'react';
import { useCampaignContext } from './useCampaignContext';

/**
 * Set the mobile page header title for the current route.
 * Pass an empty string to clear.
 */
export function usePageTitle(title: string): void {
  const { setPageTitle } = useCampaignContext();
  useEffect(() => {
    setPageTitle(title);
    return () => setPageTitle('');
  }, [setPageTitle, title]);
}
