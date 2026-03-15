import { Campaign } from '@/types/database';
import {
  BookOpen,
  ChevronDown,
  Download,
  Menu,
  ScrollText,
  Shield,
  Sword,
  Users,
  Wand2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useParams } from 'react-router-dom';
import { Button } from './ui/button';

export interface SidebarProps {
  campaigns: Campaign[];
  selectedCampaignId?: string;
  onSelectCampaign: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
}

const NAV_ITEMS = [
  { icon: Shield, label: 'Dashboard', path: '' },
  { icon: Users, label: 'Characters', path: '/characters' },
  { icon: BookOpen, label: 'Sessions', path: '/sessions' },
  { icon: ScrollText, label: 'Notes', path: '/notes' },
  { icon: Wand2, label: 'DM Toolkit', path: '/toolkit' },
];

export function Sidebar({
  campaigns,
  selectedCampaignId,
  onSelectCampaign,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const { id: campaignId } = useParams<{ id: string }>();
  const [showCampaignDropdown, setShowCampaignDropdown] = useState(false);

  const currentCampaign = campaigns.find((c) => c.id === (selectedCampaignId || campaignId));

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
          {isCollapsed ? <Menu className="w-6 h-6" /> : <X className="w-6 h-6" />}
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
          <Sword className="w-8 h-8 text-sidebar-primary shrink-0" />
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">D&D Keeper</h1>
              <p className="text-xs text-muted-foreground">Campaign Manager</p>
            </div>
          )}
        </Link>

        {/* Campaign Selector */}
        <div className="px-4 py-4 border-b border-sidebar-border">
          <div className="text-xs uppercase font-semibold text-muted-foreground mb-2">
            {!isCollapsed && 'Campaign'}
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
                    <Shield className="w-4 h-4" />
                  )
                ) : (
                  !isCollapsed ? (
                    'Select Campaign'
                  ) : (
                    <Shield className="w-4 h-4" />
                  )
                )}
              </span>
              {!isCollapsed && (
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${showCampaignDropdown ? 'rotate-180' : ''
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
                  <div className="px-3 py-2 text-xs text-muted-foreground">No campaigns</div>
                ) : (
                  campaigns.map((campaign) => (
                    <button
                      key={campaign.id}
                      onClick={() => {
                        onSelectCampaign(campaign.id);
                        setShowCampaignDropdown(false);
                      }}
                      className={`
                        w-full text-left px-3 py-2 text-sm
                        hover:bg-accent transition-colors
                        ${campaign.id === currentCampaign?.id ? 'bg-accent text-accent-foreground font-medium' : 'text-popover-foreground'}
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
              ? `/campaign/${currentCampaign.id}${item.path}`
              : '#';

            if (disabled) {
              return (
                <span
                  key={item.label}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground/50 cursor-not-allowed"
                  title={`${item.label} (select a campaign first)`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
                </span>
              );
            }

            return (
              <NavLink
                key={item.label}
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
                title={item.label}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-2 py-4 border-t border-sidebar-border">
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
            title="Export Data"
          >
            <Download className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="font-medium text-sm">Export Data</span>}
          </NavLink>
          {!isCollapsed && (
            <p className="text-xs text-muted-foreground px-3 mt-3">
              Campaign Manager v1.0<br />
              For D&D 5e
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
