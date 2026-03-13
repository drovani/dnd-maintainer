import { useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import {
  Menu,
  X,
  Sword,
  Users,
  BookOpen,
  ScrollText,
  Wand2,
  ChevronDown,
  Shield,
  Download,
} from 'lucide-react';
import { Campaign } from '@/types/database';
import { Button } from './ui/Button';

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
          bg-gradient-to-b from-slate-950 to-slate-900
          border-r border-amber-900/20
          transition-all duration-300
          md:relative md:translate-x-0
          ${isCollapsed ? '-translate-x-full' : 'translate-x-0'}
          ${isCollapsed && 'md:w-20' || 'md:w-64'}
          w-64
        `}
      >
        {/* Logo/Title */}
        <div className="px-4 py-6 border-b border-amber-900/20 flex items-center gap-3">
          <Sword className="w-8 h-8 text-amber-500 flex-shrink-0" />
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-bold text-amber-400">D&D Keeper</h1>
              <p className="text-xs text-slate-500">Campaign Manager</p>
            </div>
          )}
        </div>

        {/* Campaign Selector */}
        <div className="px-4 py-4 border-b border-amber-900/20">
          <div className="text-xs uppercase font-semibold text-slate-400 mb-2">
            {!isCollapsed && 'Campaign'}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowCampaignDropdown(!showCampaignDropdown)}
              className={`
                w-full px-3 py-2 rounded
                bg-slate-800 border border-amber-900/30
                text-slate-100 text-sm font-medium
                hover:border-amber-600 transition-colors
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
                  className={`w-4 h-4 transition-transform ${
                    showCampaignDropdown ? 'rotate-180' : ''
                  }`}
                />
              )}
            </button>

            {/* Dropdown Menu */}
            {showCampaignDropdown && !isCollapsed && (
              <div
                className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-amber-900/30 rounded z-50"
                onClick={() => setShowCampaignDropdown(false)}
              >
                {campaigns.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-slate-400">No campaigns</div>
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
                        hover:bg-amber-900/20 transition-colors
                        ${campaign.id === currentCampaign?.id ? 'bg-amber-900/30 text-amber-400' : 'text-slate-100'}
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
            const basePath = currentCampaign ? `/campaign/${currentCampaign.id}` : '/';
            const fullPath = basePath + item.path;

            return (
              <NavLink
                key={item.label}
                to={fullPath}
                onClick={() => {
                  // Auto-collapse on mobile when navigating
                  if (window.innerWidth < 768) {
                    onToggleCollapse(true);
                  }
                }}
                className={({ isActive }) =>
                  `
                    flex items-center gap-3 px-3 py-3 rounded-lg
                    transition-colors duration-200 group
                    ${
                      isActive
                        ? 'bg-amber-900/30 text-amber-400 border border-amber-600/30'
                        : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800/50'
                    }
                  `
                }
                title={item.label}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-2 py-4 border-t border-amber-900/20">
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
                ${
                  isActive
                    ? 'bg-amber-900/30 text-amber-400 border border-amber-600/30'
                    : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800/50'
                }
              `
            }
            title="Export Data"
          >
            <Download className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium text-sm">Export Data</span>}
          </NavLink>
          {!isCollapsed && (
            <p className="text-xs text-slate-500 px-3 mt-3">
              Campaign Manager v1.0<br />
              For D&D 5e
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
