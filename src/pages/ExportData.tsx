import { useState } from 'react';
import { Download, CheckSquare, Square, AlertCircle, Loader2 } from 'lucide-react';
import { useCampaigns } from '@/hooks/useCampaigns';
import { supabase } from '@/lib/supabase';
import { generateSeedSql, downloadFile } from '@/lib/export-sql';
import type { ExportData as ExportDataType } from '@/lib/export-sql';

export default function ExportData() {
  const { data: campaigns = [], isLoading: isCampaignsLoading } = useCampaigns();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleCampaign = (id: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = (): void => {
    setSelectedIds(new Set(campaigns.map((c) => c.id)));
  };

  const deselectAll = (): void => {
    setSelectedIds(new Set());
  };

  const handleExport = async (): Promise<void> => {
    if (selectedIds.size === 0) {
      return;
    }

    setIsExporting(true);
    setErrorMessage(null);

    try {
      const ids = Array.from(selectedIds);

      const [campaignsRes, charactersRes, sessionsRes, encountersRes, notesRes] = await Promise.all([
        supabase.from('campaigns').select('*').in('id', ids),
        supabase.from('characters').select('*').in('campaign_id', ids),
        supabase.from('sessions').select('*').in('campaign_id', ids),
        supabase.from('encounters').select('*').in('campaign_id', ids),
        supabase.from('notes').select('*').in('campaign_id', ids),
      ]);

      for (const res of [campaignsRes, charactersRes, sessionsRes, encountersRes, notesRes]) {
        if (res.error) {
          throw res.error;
        }
      }

      const data: ExportDataType = {
        campaigns: campaignsRes.data ?? [],
        characters: charactersRes.data ?? [],
        sessions: sessionsRes.data ?? [],
        encounters: encountersRes.data ?? [],
        notes: notesRes.data ?? [],
      };

      const sql = generateSeedSql(data);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      downloadFile(sql, `seed-${timestamp}.sql`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred during export.';
      setErrorMessage(message);
    } finally {
      setIsExporting(false);
    }
  };

  if (isCampaignsLoading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="max-w-3xl mx-auto text-center py-12">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
          <p className="text-stone-300 mt-4">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-linear-to-r from-slate-900 to-slate-800 border-b border-amber-500/20">
        <div className="max-w-3xl mx-auto px-8 py-8">
          <h1 className="text-4xl font-bold text-stone-100 flex items-center gap-3">
            <Download className="w-10 h-10 text-amber-400" />
            Export Data
          </h1>
          <p className="text-stone-400 mt-2">
            Download campaign data as a SQL seed file for backup or migration.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-8 py-12">
        {/* Error banner */}
        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 bg-red-900/30 border border-red-500/30 rounded-lg p-4">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 font-semibold">Export failed</p>
              <p className="text-red-400 text-sm mt-1">{errorMessage}</p>
            </div>
          </div>
        )}

        {campaigns.length === 0 ? (
          <div className="text-center py-24 bg-slate-900/30 rounded-lg border border-slate-800 p-12">
            <Download className="w-16 h-16 text-amber-400/50 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-stone-300 mb-2">No Campaigns</h3>
            <p className="text-stone-400">Create a campaign first before exporting data.</p>
          </div>
        ) : (
          <>
            {/* Selection controls */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-stone-300 font-semibold">
                Select campaigns to export ({selectedIds.size} of {campaigns.length} selected)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-sm text-amber-400 hover:text-amber-300 transition-colors px-3 py-1 rounded border border-amber-900/30 hover:border-amber-600"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAll}
                  className="text-sm text-stone-400 hover:text-stone-300 transition-colors px-3 py-1 rounded border border-slate-700 hover:border-slate-600"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Campaign checklist */}
            <div className="space-y-2 mb-8">
              {campaigns.map((campaign) => {
                const isSelected = selectedIds.has(campaign.id);
                return (
                  <button
                    key={campaign.id}
                    onClick={() => toggleCampaign(campaign.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg
                      text-left transition-all
                      ${
                        isSelected
                          ? 'bg-amber-900/20 border border-amber-600/30 text-amber-400'
                          : 'bg-slate-900 border border-slate-800 text-stone-300 hover:border-slate-700'
                      }
                    `}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{campaign.name}</p>
                      {campaign.setting && (
                        <p className="text-xs text-stone-500 mt-0.5">{campaign.setting}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Export button */}
            <button
              onClick={handleExport}
              disabled={selectedIds.size === 0 || isExporting}
              className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-amber-600/50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Export as seed.sql
                </>
              )}
            </button>

            <p className="text-xs text-stone-500 mt-4 text-center">
              The exported file can be restored with:{' '}
              <code className="bg-slate-800 px-2 py-0.5 rounded text-stone-400">
                psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f seed.sql
              </code>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
