import { useTranslation } from 'react-i18next';
import { AlertTriangle, Sun, Moon, Monitor, RefreshCw } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/components/ThemeProvider';
import { ThemePicker } from '@/components/ThemePicker';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCampaigns } from '@/hooks/useCampaigns';
import { supabase } from '@/lib/supabase';
import type { ThemeId } from '@/lib/theme';
import type { CampaignSummary } from '@/types/database';
import { cn } from '@/lib/utils';

const COLOR_MODE_OPTIONS = [
  { mode: 'light' as const, icon: Sun, labelKey: 'settings.colorModes.light' as const },
  { mode: 'dark' as const, icon: Moon, labelKey: 'settings.colorModes.dark' as const },
  { mode: 'system' as const, icon: Monitor, labelKey: 'settings.colorModes.system' as const },
];

function CampaignThemeRow({ campaign }: { campaign: CampaignSummary }): React.JSX.Element {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();

  const updateTheme = useMutation({
    mutationFn: async (newTheme: ThemeId | null) => {
      const { error } = await supabase
        .from('campaigns')
        .update({ theme: newTheme })
        .eq('id', campaign.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', campaign.id] });
    },
  });

  return (
    <div className="rounded-lg border border-border p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium">{campaign.name}</span>
        <ThemePicker
          value={campaign.theme ?? null}
          onChange={(id) => updateTheme.mutate(id)}
          allowNone
          disabled={updateTheme.isPending}
        />
      </div>
      {updateTheme.isError && (
        <p className="text-sm text-destructive">{t('errors.saveFailed')}</p>
      )}
    </div>
  );
}

export default function SettingsTheme(): React.JSX.Element {
  const { t } = useTranslation('common');
  const { theme, setTheme, colorMode, setColorMode } = useTheme();
  const { data: campaigns = [], isLoading, isError, error, refetch } = useCampaigns();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{t('settings.themeSettings')}</h1>
      </div>

      <div className="space-y-8">
        {/* Color Mode */}
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">{t('settings.colorMode')}</h2>
            <p className="text-sm text-muted-foreground">{t('settings.colorModeDescription')}</p>
          </div>
          <div className="flex gap-2">
            {COLOR_MODE_OPTIONS.map(({ mode, icon: Icon, labelKey }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setColorMode(mode)}
                className={cn(
                  'flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors',
                  colorMode === mode
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:bg-accent'
                )}
              >
                <Icon className="size-4" />
                {t(labelKey)}
              </button>
            ))}
          </div>
        </section>

        {/* Global Theme */}
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">{t('settings.globalTheme')}</h2>
            <p className="text-sm text-muted-foreground">{t('settings.globalThemeDescription')}</p>
          </div>
          <ThemePicker value={theme} onChange={(id) => setTheme(id)} />
        </section>

        {/* Per-Campaign Overrides */}
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">{t('settings.campaignOverrides')}</h2>
            <p className="text-sm text-muted-foreground">{t('settings.campaignOverridesDescription')}</p>
          </div>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : isError ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 space-y-2">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="size-4" />
                <span className="text-sm font-medium">{t('errors.loadingCampaigns')}</span>
              </div>
              {error && (
                <p className="text-xs text-muted-foreground">{t('errors.errorPrefix', { message: error.message })}</p>
              )}
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="size-4" />
                {t('buttons.tryAgain')}
              </Button>
            </div>
          ) : campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('nav.noCampaigns')}</p>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <CampaignThemeRow key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
