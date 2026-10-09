// RFP Creation — presentation only, in the Orchestration studio style.
// Data loading, caching and navigation stay in AgentOrchestration.tsx / RfpDetail.tsx; these components only render.
import React, { useEffect, useMemo, useState } from 'react';
import { FileText, RefreshCw, Sparkles } from 'lucide-react';
import { Button, EmptyState, ErrorBanner, PageHeader, Pagination, SearchInput, Select, Spinner, StatCard, Tag, Td, Th, cx } from '../../../components/studio/ui';

const SOURCE_LABELS: Record<string, string> = {
  evaluation: 'Process evaluation',
  company: 'Company analysis',
  domain: 'Domain analysis',
  document: 'Document analysis',
};
export const sourceLabel = (t?: string | null) => (t ? SOURCE_LABELS[t] || t.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()) : '');

export const fmtDate = (d?: string | null) => {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

// RFP state of a use case. `generated` comes from the page's own check (isRfpAlreadyGenerated / generationSuccess).
export const RfpStatusTag: React.FC<{ generated: boolean; status?: string | null }> = ({ generated, status }) => {
  const s = String(status || '').toLowerCase();
  const [tone, label] = generated ? ['green', 'Generated'] as const
    : s === 'draft' ? ['amber', 'Draft'] as const
    : s === 'failed' || s === 'error' ? ['red', 'Failed'] as const
    : s === 'generating' || s === 'processing' || s === 'in_progress' ? ['blue', 'Generating'] as const
    : !s || s === 'not_created' || s === 'pending' ? ['gray', 'Not started'] as const
    : ['gray', s.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())] as const;
  const dot = { green: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-red-500', blue: 'bg-blue-500', gray: 'bg-slate-400' }[tone];
  return <Tag tone={tone}><span className={cx('h-1.5 w-1.5 rounded-full', dot)} />{label}</Tag>;
};

export const ScoreBar: React.FC<{ score: any }> = ({ score }) => {
  const n = Number(score);
  if (score === null || score === undefined || score === '' || !isFinite(n)) return <span className="text-slate-400">—</span>;
  const width = Math.max(0, Math.min(100, Math.round(n)));
  return (
    <span className="inline-flex items-center gap-2" title={`${Math.round(n)} / 100`}>
      <span className="w-7 text-right font-medium tabular-nums text-slate-900">{Math.round(n)}</span>
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-[var(--sx-primary)]" style={{ width: `${width}%` }} /></span>
    </span>
  );
};

// Time since mount, m:ss — shown while the RFP is being generated.
export const Elapsed: React.FC = () => {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    const t0 = Date.now();
    const timer = setInterval(() => setSec(Math.floor((Date.now() - t0) / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);
  return <>{Math.floor(sec / 60)}:{String(sec % 60).padStart(2, '0')}</>;
};

const BAR_CSS = '@keyframes sx-indeterminate{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}';
if (typeof document !== 'undefined' && !document.getElementById('sx-indeterminate-css')) {
  const el = document.createElement('style'); el.id = 'sx-indeterminate-css'; el.textContent = BAR_CSS; document.head.appendChild(el);
}
export const IndeterminateBar: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cx('h-1 overflow-hidden rounded-full bg-white', className)}>
    <div className="h-full w-1/3 rounded-full bg-[var(--sx-primary)]" style={{ animation: 'sx-indeterminate 1.4s ease-in-out infinite' }} />
  </div>
);

const idOf = (item: any) => item?.usecaseId || item?._id || item?.id;
const scoreOf = (item: any) => (item.totalWeightedScore !== undefined ? item.totalWeightedScore : item.weighted_score !== undefined ? item.weighted_score : item.score);
const PAGE = 20;

export const RfpCreationList: React.FC<{
  items: any[] | null;
  loading: boolean;
  error: string | null;
  isGenerated: (item: any) => boolean;
  verifying: Record<string, boolean>;
  onRefresh: () => void;
  onOpen: (usecaseId: string) => void;
}> = ({ items, loading, error, isGenerated, verifying, onRefresh, onOpen }) => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'generated' | 'pending'>('all');
  const [source, setSource] = useState('all');
  const [page, setPage] = useState(1);

  const rows = items || [];
  const generatedCount = rows.filter(isGenerated).length;
  const sources = useMemo(() => Array.from(new Set(rows.map(r => r.type || r.source).filter(Boolean))) as string[], [rows]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(item => {
      if (statusFilter === 'generated' && !isGenerated(item)) return false;
      if (statusFilter === 'pending' && isGenerated(item)) return false;
      if (source !== 'all' && (item.type || item.source) !== source) return false;
      if (!q) return true;
      return [item.title, item.description, item.company_name, item.company, item.industry, item.domain].some(v => String(v || '').toLowerCase().includes(q));
    });
  }, [rows, query, statusFilter, source, isGenerated]);
  useEffect(() => { setPage(1); }, [query, statusFilter, source]);
  const visible = filtered.slice((page - 1) * PAGE, page * PAGE);
  const filtersOn = !!query.trim() || statusFilter !== 'all' || source !== 'all';
  const clearFilters = () => { setQuery(''); setStatusFilter('all'); setSource('all'); };

  const refreshButton = (
    <Button variant="secondary" onClick={onRefresh} loading={loading} icon={<RefreshCw className="h-4 w-4" />}>
      {loading ? 'Refreshing…' : 'Refresh list'}
    </Button>
  );

  return (
    <div id="rfp-creation-view">
      <PageHeader
        title="RFP Creation"
        subtitle="Create RFP documents from the use cases you shortlisted in your evaluations."
        actions={refreshButton}
      />

      {items === null || (loading && rows.length === 0) ? (
        <div className="rounded-lg border border-slate-200 bg-white"><Spinner label="Loading shortlisted use cases…" className="py-16" /></div>
      ) : error ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <ErrorBanner message={/failed to fetch|networkerror/i.test(error) ? "We couldn't reach the RFP service. Check your connection and try again." : `We couldn't load the shortlisted use cases (${error}).`} onRetry={onRefresh} />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white">
          <EmptyState
            icon={<FileText className="h-5 w-5" />}
            title="No shortlisted use cases yet"
            description="Shortlist use cases in My Evaluations or AI Discovery. They appear here, ready for an RFP."
            action={refreshButton}
          />
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="Shortlisted use cases" value={rows.length} onClick={() => setStatusFilter('all')} active={statusFilter === 'all'} />
            <StatCard label="RFP generated" value={generatedCount} tone="green" onClick={() => setStatusFilter('generated')} active={statusFilter === 'generated'} />
            <StatCard label="Awaiting RFP" value={rows.length - generatedCount} tone="amber" onClick={() => setStatusFilter('pending')} active={statusFilter === 'pending'} />
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-2.5">
              <SearchInput value={query} onChange={setQuery} placeholder="Search use case, company or industry" className="w-full sm:w-80" />
              {sources.length > 1 && (
                <Select value={source} onChange={e => setSource(e.target.value)} className="!w-auto min-w-[170px]" aria-label="Source">
                  <option value="all">All sources</option>
                  {sources.map(s => <option key={s} value={s}>{sourceLabel(s)}</option>)}
                </Select>
              )}
              {filtersOn && <Button variant="ghost" size="sm" onClick={clearFilters}>Clear filters</Button>}
            </div>

            {filtered.length === 0 ? (
              <EmptyState compact title="No use cases match your filters" action={<Button size="sm" onClick={clearFilters}>Clear filters</Button>} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] border-collapse">
                  <thead>
                    <tr>
                      <Th>Use case</Th>
                      <Th>Company</Th>
                      <Th className="hidden xl:table-cell">Industry</Th>
                      <Th className="hidden lg:table-cell">Source</Th>
                      <Th>Score</Th>
                      <Th className="hidden lg:table-cell">Shortlisted</Th>
                      <Th>RFP</Th>
                      <Th className="text-right"><span className="sr-only">Action</span></Th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((item: any, idx: number) => {
                      const usecaseId = idOf(item);
                      const generated = isGenerated(item);
                      const checking = !!verifying[usecaseId];
                      const company = item.company_name || item.company || '';
                      const industry = item.industry || item.domain || '';
                      const open = () => { if (!checking && usecaseId) onOpen(usecaseId); };
                      return (
                        <tr key={usecaseId || idx} className="group cursor-pointer hover:bg-slate-50/70" onClick={open}>
                          <Td className="max-w-[420px]">
                            <div className="font-medium text-slate-900 group-hover:text-[var(--sx-primary)]">{item.title || 'Untitled use case'}</div>
                            {item.description
                              ? <div className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-slate-500" title={item.description}>{item.description}</div>
                              : <div className="mt-0.5 text-[12.5px] text-slate-400">No description</div>}
                          </Td>
                          <Td className="whitespace-nowrap">{company || <span className="text-slate-400">—</span>}</Td>
                          <Td className="hidden max-w-[200px] xl:table-cell" title={industry}><div className="truncate">{industry || <span className="text-slate-400">—</span>}</div></Td>
                          <Td className="hidden whitespace-nowrap lg:table-cell">{sourceLabel(item.type || item.source) || <span className="text-slate-400">—</span>}</Td>
                          <Td className="whitespace-nowrap"><ScoreBar score={scoreOf(item)} /></Td>
                          <Td className="hidden whitespace-nowrap text-slate-500 lg:table-cell">{fmtDate(item.createdAt)}</Td>
                          <Td className="whitespace-nowrap"><RfpStatusTag generated={generated} status={item.rfpStatus} /></Td>
                          <Td className="whitespace-nowrap text-right">
                            {loading ? (
                              <div className="ml-auto h-8 w-[120px] animate-pulse rounded-md bg-slate-200" aria-hidden="true" />
                            ) : (
                              <Button
                                size="sm"
                                variant={generated ? 'secondary' : 'subtle'}
                                id={`rfp-action-button-${usecaseId}`}
                                disabled={checking}
                                loading={checking}
                                icon={generated ? <FileText className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                                onClick={e => { e.stopPropagation(); open(); }}
                              >
                                {checking ? 'Checking…' : generated ? 'View RFP' : 'Generate RFP'}
                              </Button>
                            )}
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="border-t border-slate-100">
              <Pagination page={page} limit={PAGE} total={filtered.length} onPage={setPage} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
