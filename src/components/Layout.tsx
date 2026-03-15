import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { useCampaigns } from '@/hooks/useCampaigns';

export function Layout() {
  const { id: campaignId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | undefined>(campaignId);

  const { data: campaigns = [], isLoading, isError, error, refetch } = useCampaigns();

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
          ) : isError ? (
            <div className="flex items-center justify-center h-full">
              <div className="max-w-md mx-auto p-6 glass-effect rounded-lg text-center space-y-4">
                <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
                <h2 className="text-xl font-bold text-slate-100">Unable to Load Campaigns</h2>
                <p className="text-slate-400 text-sm">
                  Failed to connect after multiple attempts. Please verify:
                </p>
                <ul className="text-left text-slate-300 text-sm space-y-2 list-disc list-inside">
                  <li>The Supabase project is running and accessible</li>
                  <li>Your <code className="text-amber-300">.env.local</code> contains valid <code className="text-amber-300">VITE_SUPABASE_URL</code> and <code className="text-amber-300">VITE_SUPABASE_ANON_KEY</code></li>
                  <li>Your network connection is working</li>
                  <li>If running locally, <code className="text-amber-300">npx supabase status</code> shows the DB is up</li>
                </ul>
                {error && (
                  <p className="text-xs text-slate-500 break-all">
                    Error: {error.message}
                  </p>
                )}
                <button
                  onClick={() => refetch()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-md transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <Outlet context={{ selectedCampaignId }} />
          )}
        </div>
      </main>
    </div>
  );
}
