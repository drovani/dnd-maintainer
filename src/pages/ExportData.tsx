import { useCampaigns } from '@/hooks/useCampaigns';
import type { ExportData as ExportDataType } from '@/lib/export-sql';
import { downloadFile, generateSeedSql } from '@/lib/export-sql';
import { supabase } from '@/lib/supabase';
import { AlertCircle, CheckSquare, Download, Loader2, Square } from 'lucide-react';
import { useState } from 'react';

export default function ExportData() {
  const { data: campaigns = [], isLoading: isCampaignsLoading, isError: isCampaignsError, error: campaignsError } = useCampaigns();
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

      const namedResults = [
        { table: 'campaigns', ...campaignsRes },
        { table: 'characters', ...charactersRes },
        { table: 'sessions', ...sessionsRes },
        { table: 'encounters', ...encountersRes },
        { table: 'notes', ...notesRes },
      ] as const;

      const failures = namedResults
        .filter((r) => r.error)
        .map((r) => `${r.table}: ${r.error?.message ?? 'unknown error'}`);

      if (failures.length > 0) {
        throw new Error(`Failed to fetch data:\n${failures.join('\n')}`);
      }

      if (!campaignsRes.data || campaignsRes.data.length === 0) {
        throw new Error('No campaign data returned. This may be a permissions issue — check that RLS policies allow read access.');
      }

      const data: ExportDataType = {
        campaigns: campaignsRes.data,
        characters: charactersRes.data ?? [],
        sessions: sessionsRes.data ?? [],
        encounters: encountersRes.data ?? [],
        notes: notesRes.data ?? [],
      };

      const sql = generateSeedSql(data);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

      try {
        downloadFile(sql, `seed-${timestamp}.sql`);
      } catch (downloadErr: unknown) {
        const msg = downloadErr instanceof Error ? downloadErr.message : 'Unknown download error';
        throw new Error(`Data was generated successfully but the download failed: ${msg}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred during export.';
      setErrorMessage(message);
    } finally {
      setIsExporting(false);
    }
  };

  if (isCampaignsLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-3xl mx-auto text-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-foreground mt-4">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  if (isCampaignsError) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-3xl mx-auto text-center py-12">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
          <p className="text-destructive font-semibold mt-4">Failed to load campaigns</p>
          <p className="text-destructive text-sm mt-2">
            {campaignsError instanceof Error ? campaignsError.message : 'An unexpected error occurred.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-muted/50 border-b border-border">
        <div className="max-w-3xl mx-auto px-8 py-8">
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
            <Download className="w-10 h-10 text-primary" />
            Export Data
          </h1>
          <p className="text-muted-foreground mt-2">
            Download campaign data as a SQL seed file for backup or migration.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-8 py-12">
        {/* Error banner */}
        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 bg-destructive/10 border border-destructive/30 rounded-lg p-4">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-destructive font-semibold">Export failed</p>
              <p className="text-destructive text-sm mt-1 whitespace-pre-line">{errorMessage}</p>
            </div>
          </div>
        )}

        {campaigns.length === 0 ? (
          <div className="text-center py-24 bg-card/50 rounded-lg border border-border p-12">
            <Download className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-2">No Campaigns</h3>
            <p className="text-muted-foreground">Create a campaign first before exporting data.</p>
          </div>
        ) : (
          <>
            {/* Selection controls */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-foreground font-semibold">
                Select campaigns to export ({selectedIds.size} of {campaigns.length} selected)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-sm text-primary hover:text-foreground transition-colors px-3 py-1 rounded border border-border hover:border-amber-600"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAll}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1 rounded border border-border hover:border-input"
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
                      ${isSelected
                        ? 'bg-amber-900/20 border border-border text-primary'
                        : 'bg-card border border-border text-foreground hover:border-border'
                      }
                    `}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-primary shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{campaign.name}</p>
                      {campaign.setting && (
                        <p className="text-xs text-muted-foreground mt-0.5">{campaign.setting}</p>
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
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-bold py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-md"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Export SQL Backup
                </>
              )}
            </button>

            <p className="text-xs text-muted-foreground mt-4 text-center">
              The exported file can be restored with:{' '}
              <code className="bg-muted px-2 py-0.5 rounded text-muted-foreground">
                psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f seed.sql
              </code>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
