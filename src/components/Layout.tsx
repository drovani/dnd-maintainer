import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useTheme } from '@/components/ThemeProvider';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { useCampaigns } from '@/hooks/useCampaigns';
import { isThemeId } from '@/lib/theme';

export function Layout() {
  const { campaignSlug } = useParams<{ campaignSlug: string }>();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { t } = useTranslation('common');
  const { data: campaigns = [], isLoading, isError, error, refetch } = useCampaigns();
  const { setCampaignThemeOverride } = useTheme();

  // Find the current campaign by slug
  const currentCampaign = campaigns?.find(c => c.slug === campaignSlug);

  // Find the current campaign's theme from the already-loaded campaigns list
  const currentCampaignTheme = currentCampaign?.theme;

  useEffect(() => {
    if (currentCampaignTheme && isThemeId(currentCampaignTheme)) {
      setCampaignThemeOverride(currentCampaignTheme);
    } else {
      setCampaignThemeOverride(null);
    }
    return () => setCampaignThemeOverride(null);
  }, [currentCampaignTheme, setCampaignThemeOverride]);

  const handleSelectCampaign = (slug: string) => {
    navigate(`/campaign/${slug}`);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar
        campaigns={campaigns}
        selectedCampaignSlug={campaignSlug}
        onSelectCampaign={handleSelectCampaign}
        isCollapsed={isCollapsed}
        onToggleCollapse={setIsCollapsed}
      />

      <main className="flex-1 overflow-auto">
        <div className="w-full h-full">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="space-y-3 w-64">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <p className="text-muted-foreground text-sm">{t('campaign.loading')}</p>
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center h-full">
              <div className="max-w-md mx-auto p-6 rounded-lg border bg-card text-center space-y-4">
                <AlertTriangle className="size-12 text-destructive mx-auto" />
                <h2 className="text-xl font-bold text-foreground">{t('errors.loadingCampaigns')}</h2>
                <p className="text-muted-foreground text-sm">
                  {t('errors.loadingCampaignsDescription')}
                </p>
                <ul className="text-left text-foreground text-sm space-y-2 list-disc list-inside">
                  <li>{t('errors.supabaseRunning')}</li>
                  <li>{t('errors.envVars')}</li>
                  <li>{t('errors.networkConnection')}</li>
                  <li>{t('errors.supabaseStatus')}</li>
                </ul>
                {error && (
                  <p className="text-xs text-muted-foreground break-all">
                    {t('errors.errorPrefix', { message: error.message })}
                  </p>
                )}
                <Button onClick={() => refetch()}>
                  <RefreshCw className="size-4" />
                  {t('buttons.tryAgain')}
                </Button>
              </div>
            </div>
          ) : (
            <Outlet context={{ campaignSlug, campaignId: currentCampaign?.id } satisfies { campaignSlug: string | undefined; campaignId: string | undefined }} />
          )}
        </div>
      </main>
    </div>
  );
}
