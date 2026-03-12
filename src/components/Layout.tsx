import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { useCampaigns } from '@/hooks/useCampaigns';

export function Layout() {
  const { id: campaignId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | undefined>(campaignId);

  const { data: campaigns = [], isLoading } = useCampaigns();

  // Update selected campaign when route changes
  useEffect(() => {
    if (campaignId) {
      setSelectedCampaignId(campaignId);
    }
  }, [campaignId]);

  // Handle campaign selection
  const handleSelectCampaign = (id: string) => {
    setSelectedCampaignId(id);
    navigate(`/campaign/${id}`);
  };

  // Handle responsive sidebar collapse
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
    <div className="flex h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <Sidebar
        campaigns={campaigns}
        selectedCampaignId={selectedCampaignId}
        onSelectCampaign={handleSelectCampaign}
        isCollapsed={isCollapsed}
        onToggleCollapse={setIsCollapsed}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="w-full h-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner size="lg" text="Loading campaigns..." />
            </div>
          ) : (
            <Outlet context={{ selectedCampaignId }} />
          )}
        </div>
      </main>
    </div>
  );
}
