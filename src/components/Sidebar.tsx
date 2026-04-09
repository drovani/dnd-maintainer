import { CampaignSummary } from '@/types/database';
import {
  BookOpen,
  ChevronDown,
  Download,
  ExternalLink,
  Menu,
  ScrollText,
  Settings,
  Shield,
  Sword,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, useParams } from 'react-router-dom';
import { Button } from './ui/button';

export interface SidebarProps {
  campaigns: CampaignSummary[];
  selectedCampaignSlug?: string;
  onSelectCampaign: (slug: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
}

const NAV_ITEMS = [
  { icon: Shield, labelKey: 'nav.dashboard' as const, path: '' },
  { icon: Users, labelKey: 'nav.characters' as const, path: '/characters' },
  { icon: BookOpen, labelKey: 'nav.sessions' as const, path: '/sessions' },
  { icon: ScrollText, labelKey: 'nav.notes' as const, path: '/notes' },
];

export function Sidebar({
  campaigns,
  selectedCampaignSlug,
  onSelectCampaign,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const { t } = useTranslation('common');
  const { campaignSlug } = useParams<{ campaignSlug: string }>();
  const [showCampaignDropdown, setShowCampaignDropdown] = useState(false);

  const currentCampaign = campaigns.find((c) => c.slug === (selectedCampaignSlug || campaignSlug));

  return (
    <>
      {/* Mobile menu toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleCollapse(!isCollapsed)}
          className="p-2"
        >
          {isCollapsed ? <Menu className="size-6" /> : <X className="size-6" />}
        </Button>
      </div>

      {/* Overlay on mobile when sidebar is open */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => onToggleCollapse(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen z-40
          bg-sidebar border-r border-sidebar-border
          transition-all duration-300
          md:relative md:translate-x-0
          ${isCollapsed ? '-translate-x-full' : 'translate-x-0'}
          ${isCollapsed && 'md:w-20' || 'md:w-64'}
          w-64
        `}
      >
        {/* Logo/Title */}
        <Link to="/" className="px-4 py-6 border-b border-sidebar-border flex items-center gap-3 hover:bg-sidebar-accent transition-colors">
          <Sword className="size-8 text-sidebar-primary shrink-0" />
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">{t('app.title')}</h1>
              <p className="text-xs text-muted-foreground">{t('app.subtitle')}</p>
            </div>
          )}
        </Link>

        {/* Campaign Selector */}
        <div className="px-4 py-4 border-b border-sidebar-border">
          <div className="text-xs uppercase font-semibold text-muted-foreground mb-2">
            {!isCollapsed && t('nav.campaign')}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowCampaignDropdown(!showCampaignDropdown)}
              className={`
                w-full px-3 py-2 rounded-lg
                bg-sidebar-accent border border-sidebar-border
                text-sidebar-foreground text-sm font-medium
                hover:border-ring transition-colors
                flex items-center justify-between gap-2
              `}
              title={currentCampaign?.name}
            >
              <span className={!isCollapsed ? 'truncate' : ''}>
                {currentCampaign ? (
                  !isCollapsed ? (
                    currentCampaign.name
                  ) : (
                    <Shield className="size-4" />
                  )
                ) : (
                  !isCollapsed ? (
                    t('nav.selectCampaign')
                  ) : (
                    <Shield className="size-4" />
                  )
                )}
              </span>
              {!isCollapsed && (
                <ChevronDown
                  className={`size-4 transition-transform ${showCampaignDropdown ? 'rotate-180' : ''
                    }`}
                />
              )}
            </button>

            {/* Dropdown Menu */}
            {showCampaignDropdown && !isCollapsed && (
              <div
                className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg z-50 shadow-md"
                onClick={() => setShowCampaignDropdown(false)}
              >
                {campaigns.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">{t('nav.noCampaigns')}</div>
                ) : (
                  campaigns.map((campaign) => (
                    <button
                      key={campaign.id}
                      onClick={() => {
                        onSelectCampaign(campaign.slug);
                        setShowCampaignDropdown(false);
                      }}
                      className={`
                        w-full text-left px-3 py-2 text-sm
                        hover:bg-accent transition-colors
                        ${campaign.slug === currentCampaign?.slug ? 'bg-accent text-accent-foreground font-medium' : 'text-popover-foreground'}
                      `}
                    >
                      {campaign.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-2 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const disabled = !currentCampaign;
            const fullPath = currentCampaign
              ? `/campaign/${currentCampaign.slug}${item.path}`
              : '#';

            if (disabled) {
              return (
                <span
                  key={item.labelKey}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground/50 cursor-not-allowed"
                  title={t('common.selectCampaignFirst', { label: t(item.labelKey) })}
                >
                  <Icon className="size-5 shrink-0" />
                  {!isCollapsed && <span className="font-medium text-sm">{t(item.labelKey)}</span>}
                </span>
              );
            }

            return (
              <NavLink
                key={item.labelKey}
                to={fullPath}
                onClick={() => {
                  if (window.innerWidth < 768) {
                    onToggleCollapse(true);
                  }
                }}
                className={({ isActive }) =>
                  `
                    flex items-center gap-3 px-3 py-3 rounded-lg
                    transition-colors duration-200 group
                    ${isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium border border-sidebar-border'
                    : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent'
                  }
                  `
                }
                title={t(item.labelKey)}
              >
                <Icon className="size-5 shrink-0" />
                {!isCollapsed && <span className="font-medium text-sm">{t(item.labelKey)}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-2 py-4 border-t border-sidebar-border">
          <NavLink
            to="/settings/theme"
            onClick={() => {
              if (window.innerWidth < 768) {
                onToggleCollapse(true);
              }
            }}
            className={({ isActive }) =>
              `
                flex items-center gap-3 px-3 py-3 rounded-lg
                transition-colors duration-200 group
                ${isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium border border-sidebar-border'
                : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent'
              }
              `
            }
            title={t('nav.settings')}
          >
            <Settings className="size-5 shrink-0" />
            {!isCollapsed && <span className="font-medium text-sm">{t('nav.settings')}</span>}
          </NavLink>
          <NavLink
            to="/export"
            onClick={() => {
              if (window.innerWidth < 768) {
                onToggleCollapse(true);
              }
            }}
            className={({ isActive }) =>
              `
                flex items-center gap-3 px-3 py-3 rounded-lg
                transition-colors duration-200 group
                ${isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium border border-sidebar-border'
                : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent'
              }
              `
            }
            title={t('nav.exportData')}
          >
            <Download className="size-5 shrink-0" />
            {!isCollapsed && <span className="font-medium text-sm">{t('nav.exportData')}</span>}
          </NavLink>
          {!isCollapsed && (
            <div className="flex items-center gap-2 px-3 mt-3">
              <p className="text-xs text-muted-foreground flex-1">
                {t('app.version')}<br />
                {t('app.for5e')}
              </p>
              <a
                href="https://github.com/drovani/dnd-maintainer"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-sidebar-foreground transition-colors"
                title={t('app.viewOnGitHub')}
              >
                <span className="relative inline-block size-5">
                  <svg className="size-5" role="img" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                  <ExternalLink className="size-2 absolute -bottom-1 -right-1.5 stroke-3" />
                </span>
              </a>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
