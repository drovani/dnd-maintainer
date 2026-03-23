import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { ThemePicker } from '@/components/ThemePicker';
import { useCampaigns, useCampaignMutations } from '@/hooks/useCampaigns';
import type { ThemeId } from '@/lib/theme';
import { cn } from '@/lib/utils';

const COLOR_MODE_OPTIONS = [
  { mode: 'light' as const, icon: Sun, labelKey: 'settings.colorModes.light' as const },
  { mode: 'dark' as const, icon: Moon, labelKey: 'settings.colorModes.dark' as const },
  { mode: 'system' as const, icon: Monitor, labelKey: 'settings.colorModes.system' as const },
];

export default function SettingsTheme(): React.JSX.Element {
  const { t } = useTranslation('common');
  const { theme, setTheme, colorMode, setColorMode } = useTheme();
  const { data: campaigns = [] } = useCampaigns();
  const { update } = useCampaignMutations();

  const handleCampaignThemeChange = (campaignId: string, newTheme: ThemeId | null): void => {
    update.mutate({ id: campaignId, theme: newTheme });
  };

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
        {campaigns.length > 0 && (
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">{t('settings.campaignOverrides')}</h2>
              <p className="text-sm text-muted-foreground">{t('settings.campaignOverridesDescription')}</p>
            </div>
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <span className="font-medium">{campaign.name}</span>
                  <ThemePicker
                    value={campaign.theme ?? null}
                    onChange={(id) => handleCampaignThemeChange(campaign.id, id)}
                    allowNone
                    disabled={update.isPending}
                  />
                  {update.isError && update.variables?.id === campaign.id && (
                    <p className="text-sm text-destructive mt-1">{t('errors.saveFailed')}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
