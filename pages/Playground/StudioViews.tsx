// Agent Playground (Maestro-style) list views: Processes, Instances (+ detail), Incidents, Tasks,
// Triggers and Templates (published solutions).
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, { Background, Controls, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import toast from '../../components/studio/notify';
import {
  Plus, MoreHorizontal, Play, Copy, Trash2, History, Zap, RefreshCw, Workflow, AlertTriangle, UserCheck, LayoutTemplate,
  ArrowLeft, ExternalLink, Bot, Plug, CheckCircle2, ShieldCheck, Maximize2, Minimize2,
} from 'lucide-react';
import { apiService } from '../../services/api';
import { studioNodeTypes } from '../../components/studio/bpmn';
import { TriggerManager } from '../../components/studio/triggers';
import {
  Button, Callout, ConfirmDialog, EmptyState, ErrorBanner, Field, IconButton, Input, Menu, Modal, PageHeader, Pagination,
  SearchInput, Select, Spinner, StatCard, StatusPill, Tabs, Tag, Td, TextArea, Th, cx, durationBetween, errMessage, fmtDateTime,
  fmtDuration, shortId, timeAgo,
} from '../../components/studio/ui';
import { ACTIVE_RUN, flowToCanvas, TERMINAL_RUN } from './studioModel';
import { HumanTaskCard, InstanceCanvas, InstanceOverview, LogList, RetryDialog, RunActions, StepTrail, VariablesPanel, waitingTask } from './runParts';
import { Lookups } from './PropertiesPanel';
import { findTemplateSamples, SampleList, useSampleManifest } from '../../components/studio/samples';

export interface Nav {
  openProcess: (id: string, opts?: { run?: boolean }) => void;
  openInstance: (id: string) => void;
  openInstances: (filter?: { flow_id?: string; status?: string }) => void;
  openTriggers: (flowId?: string) => void;
  refreshFlows: () => void;
}

const useStats = (flowId?: string) => {
  const [stats, setStats] = useState<any | null>(null);
  const load = useCallback(async () => {
    try { const r = await apiService.playground.runs.stats(flowId); setStats(r?.data || null); } catch { setStats(null); }
  }, [flowId]);
  useEffect(() => { load(); }, [load]);
  return { stats, reload: load };
};

const StatsRow: React.FC<{ stats: any; onPick?: (status?: string) => void; active?: string }> = ({ stats, onPick, active }) => {
  if (!stats) return null;
  const b = stats.by_status || {};
  const w = stats.waiting || {};
  return (
    <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <StatCard label="Total instances" value={stats.total ?? 0} onClick={onPick && (() => onPick(undefined))} active={onPick && !active} />
      <StatCard label="Running" tone="blue" value={(b.running || 0) + (b.queued || 0)} hint={w.timer || w.subflow ? `${w.timer || 0} on timer · ${w.subflow || 0} on sub-flow` : undefined} onClick={onPick && (() => onPick('running'))} active={active === 'running'} />
      <StatCard label="Waiting for a person" tone="amber" value={Math.max(b.waiting_approval || 0, w.approval || 0)} onClick={onPick && (() => onPick('waiting_approval'))} active={active === 'waiting_approval'} />
      <StatCard label="Completed" tone="green" value={b.completed || 0} onClick={onPick && (() => onPick('completed'))} active={active === 'completed'} />
      <StatCard label="Incidents (failed)" tone="red" value={stats.incidents ?? b.failed ?? 0} onClick={onPick && (() => onPick('failed'))} active={active === 'failed'} />
      <StatCard label="Cancelled" value={b.cancelled || 0} onClick={onPick && (() => onPick('cancelled'))} active={active === 'cancelled'} />
    </div>
  );
};

/* ═════════════════════════ Processes ═════════════════════════ */

export const ProcessesView: React.FC<{ nav: Nav }> = ({ nav }) => {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [del, setDel] = useState<any | null>(null);
  const { stats } = useStats();
  const limit = 30;

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await apiService.playground.flows.list({ page, limit, ...(status ? { status } : {}), ...(search.trim() ? { search: search.trim() } : {}) });
      setItems(r?.data || []); setTotal(r?.total ?? (r?.data || []).length);
    } catch (e: any) { setError(errMessage(e, 'Failed to load processes')); }
    finally { setLoading(false); }
  }, [page, status, search]);
  useEffect(() => { const t = setTimeout(load, search ? 300 : 0); return () => clearTimeout(t); }, [load, search]);

  const duplicate = async (f: any) => {
    try { const r = await apiService.playground.flows.duplicate(f._id); toast.success('Process duplicated'); nav.refreshFlows(); load(); if (r?.data?._id) nav.openProcess(r.data._id); }
    catch (e: any) { toast.error(errMessage(e, 'Duplicate failed')); }
  };
  const remove = async () => {
    try { await apiService.playground.flows.delete(del._id); toast.success('Process deleted'); nav.refreshFlows(); load(); }
    catch (e: any) { toast.error(errMessage(e, 'Delete failed')); }
    setDel(null);
  };

  return (
    <div className="p-6">
      <PageHeader title="Processes" subtitle="Model agentic processes as BPMN diagrams — agents, people, APIs and connectors in one flow."
        actions={<><IconButton label="Refresh" onClick={load}><RefreshCw className="h-4 w-4" /></IconButton><Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>New process</Button></>} />
      <StatsRow stats={stats} onPick={s => nav.openInstances(s ? { status: s } : {})} />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search processes" className="w-72" />
        <Select className="!w-44" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
        </Select>
      </div>
      {error && <ErrorBanner message={error} onRetry={load} className="mb-3" />}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {loading ? <Spinner label="Loading processes…" /> : items.length === 0 ? (
          <EmptyState icon={<Workflow className="h-5 w-5" />} title={search || status ? 'No matching processes' : 'No processes yet'}
            description={search || status ? 'Try a different search or status.' : 'Create a process from scratch, or start from a template.'}
            action={!search && !status && <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>New process</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse">
              <thead><tr><Th>Name</Th><Th>Status</Th><Th className="text-right">Steps</Th><Th className="text-right">Instances</Th><Th>Last updated</Th><Th className="w-[180px]" /></tr></thead>
              <tbody>
                {items.map(f => (
                  <tr key={f._id} className="group cursor-pointer hover:bg-slate-50" onClick={() => nav.openProcess(f._id)}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--sx-primary-soft)] text-[var(--sx-primary)]"><Workflow className="h-4 w-4" /></span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5"><span className="truncate font-medium text-slate-900">{f.name}</span>{f.source?.solution_id && <Tag tone="purple">Template</Tag>}</div>
                          {f.description && <div className="max-w-[460px] truncate text-[12.5px] text-slate-500">{f.description}</div>}
                        </div>
                      </div>
                    </Td>
                    <Td><StatusPill status={f.status} /></Td>
                    <Td className="text-right tabular-nums">{f.node_count ?? f.graph?.nodes?.length ?? '—'}</Td>
                    <Td className="text-right tabular-nums">{f.run_count ?? 0}</Td>
                    <Td title={fmtDateTime(f.updatedAt)}>{timeAgo(f.updatedAt)}</Td>
                    <Td className="text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" onClick={() => nav.openProcess(f._id)}>Open</Button>
                        <Button size="sm" variant="ghost" icon={<Play className="h-3.5 w-3.5" />} onClick={() => nav.openProcess(f._id, { run: true })}>Run</Button>
                        <Menu trigger={open => <IconButton label="More" onClick={open}><MoreHorizontal className="h-4 w-4" /></IconButton>} items={[
                          { label: 'Instances', icon: <History className="h-4 w-4" />, onClick: () => nav.openInstances({ flow_id: f._id }) },
                          { label: 'Triggers', icon: <Zap className="h-4 w-4" />, onClick: () => nav.openTriggers(f._id) },
                          { label: 'Duplicate', icon: <Copy className="h-4 w-4" />, onClick: () => duplicate(f) },
                          'divider',
                          { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, danger: true, onClick: () => setDel(f) },
                        ]} />
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && items.length > 0 && <Pagination page={page} limit={limit} total={total} onPage={setPage} />}
      </div>

      <CreateProcessModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={id => { nav.refreshFlows(); nav.openProcess(id); }} />
      <ConfirmDialog open={!!del} title="Delete process?" confirmLabel="Delete" message={<>“{del?.name}” will be deleted permanently.</>} onCancel={() => setDel(null)} onConfirm={remove} />
    </div>
  );
};

const CreateProcessModal: React.FC<{ open: boolean; onClose: () => void; onCreated: (id: string) => void }> = ({ open, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { if (open) { setName(''); setDescription(''); setErr(null); } }, [open]);
  const create = async () => {
    if (!name.trim()) { setErr('Name is required.'); return; }
    setBusy(true); setErr(null);
    try {
      const r = await apiService.playground.flows.create({
        name: name.trim(), description, status: 'draft',
        data_manager: { arguments: [], variables: [] },
        graph: {
          nodes: [{ node_id: 'start', type: 'start', label: 'Start', x: 0, y: 0 }, { node_id: 'end', type: 'end', label: 'End', x: 420, y: 0 }],
          edges: [{ edge_id: 'e_start_end', from: 'start', to: 'end', kind: 'sequence' }],
        },
      });
      onClose();
      if (r?.data?._id) onCreated(r.data._id);
    } catch (e: any) { setErr(errMessage(e, 'Failed to create process')); }
    finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="New process" width={520}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} onClick={create}>Create and open</Button></>}>
      <div className="space-y-3">
        {err && <ErrorBanner message={err} />}
        <Field label="Name" required><Input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Invoice approval" onKeyDown={e => e.key === 'Enter' && create()} /></Field>
        <Field label="Description"><TextArea rows={3} value={description} onChange={e => setDescription(e.target.value)} /></Field>
        <div className="text-[12.5px] text-slate-500">The process starts with a Start and an End event. Add steps from the Toolbox.</div>
      </div>
    </Modal>
  );
};

/* ═════════════════════════ Instances ═════════════════════════ */

export const InstancesView: React.FC<{ nav: Nav; lookups: Lookups; initialFilter?: { flow_id?: string; status?: string }; mode?: 'all' | 'incidents' }> = ({ nav, lookups, initialFilter, mode = 'all' }) => {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [flowFilter, setFlowFilter] = useState(initialFilter?.flow_id || '');
  const [status, setStatus] = useState(mode === 'incidents' ? 'failed' : initialFilter?.status || '');
  const [trigger, setTrigger] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryRun, setRetryRun] = useState<any | null>(null);
  const { stats, reload: reloadStats } = useStats(flowFilter || undefined);
  const limit = 30;

  useEffect(() => { setFlowFilter(initialFilter?.flow_id || ''); if (mode !== 'incidents') setStatus(initialFilter?.status || ''); setPage(1); }, [initialFilter?.flow_id, initialFilter?.status, mode]);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const r = await apiService.playground.runs.list({ page, limit, ...(flowFilter ? { flow_id: flowFilter } : {}), ...(status ? { status } : {}), ...(trigger ? { trigger } : {}) });
      setItems(r?.data || []); setTotal(r?.total ?? (r?.data || []).length);
    } catch (e: any) { if (!quiet) setError(errMessage(e, 'Failed to load instances')); }
    finally { if (!quiet) setLoading(false); }
  }, [page, flowFilter, status, trigger]);
  useEffect(() => { load(); }, [load]);

  // Keep the list live while anything is in flight.
  const anyActive = items.some(r => ACTIVE_RUN.includes(r.status));
  useEffect(() => {
    if (!anyActive) return;
    const t = setInterval(() => { load(true); reloadStats(); }, 4000);
    return () => clearInterval(t);
  }, [anyActive, load, reloadStats]);

  const title = mode === 'incidents' ? 'Incidents' : 'Instances';
  return (
    <div className="p-6">
      <PageHeader title={title}
        subtitle={mode === 'incidents' ? 'Failed instances. Fix the cause, then Retry — completed steps are kept and the failed step runs again.' : 'Every run of every process — monitor, answer, retry or cancel.'}
        actions={<IconButton label="Refresh" onClick={() => { load(); reloadStats(); }}><RefreshCw className="h-4 w-4" /></IconButton>} />
      {mode === 'all' && <StatsRow stats={stats} active={status} onPick={s => { setStatus(s || ''); setPage(1); }} />}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Select className="!w-64" value={flowFilter} onChange={e => { setFlowFilter(e.target.value); setPage(1); }}>
          <option value="">All processes</option>
          {lookups.flows.map((f: any) => <option key={f._id} value={f._id}>{f.name}</option>)}
        </Select>
        {mode === 'all' && (
          <Select className="!w-48" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {['queued', 'running', 'waiting_approval', 'completed', 'failed', 'cancelled'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </Select>
        )}
        <Select className="!w-40" value={trigger} onChange={e => { setTrigger(e.target.value); setPage(1); }}>
          <option value="">Any trigger</option>
          {['manual', 'schedule', 'api', 'webhook', 'subflow'].map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
        {anyActive && <span className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-500"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />Live</span>}
      </div>
      {error && <ErrorBanner message={error} onRetry={() => load()} className="mb-3" />}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {loading ? <Spinner label="Loading instances…" /> : items.length === 0 ? (
          <EmptyState icon={mode === 'incidents' ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <History className="h-5 w-5" />}
            title={mode === 'incidents' ? 'No incidents' : 'No instances'}
            description={mode === 'incidents' ? 'Nothing has failed. Failed instances show up here with the step and the error.' : 'Run a process from the designer (Debug) or with a trigger.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse">
              <thead><tr>
                <Th>Instance</Th><Th>Process</Th><Th>Status</Th>{mode === 'incidents' ? <Th>Failed step · error</Th> : <Th>Current state</Th>}<Th>Trigger</Th><Th>Started</Th><Th>Duration</Th><Th className="w-[120px]" />
              </tr></thead>
              <tbody>
                {items.map(r => (
                  <tr key={r._id} className="cursor-pointer hover:bg-slate-50" onClick={() => nav.openInstance(r._id)}>
                    <Td><span className="font-mono text-[12.5px] text-slate-700">#{shortId(r._id)}</span>{r.retry_count > 0 && <Tag className="ml-1.5" tone="gray">retried {r.retry_count}×</Tag>}</Td>
                    <Td className="max-w-[240px] truncate font-medium text-slate-900">{r.flow_name || '—'}</Td>
                    <Td><StatusPill status={r.status} /></Td>
                    {mode === 'incidents' ? (
                      <Td className="max-w-[340px]"><div className="truncate text-[12.5px]"><b className="text-slate-800">{r.incident?.node_id || '—'}</b> <span className="text-red-700">{r.incident?.error}</span></div></Td>
                    ) : (
                      <Td className="max-w-[260px] truncate text-[12.5px] text-slate-600">
                        {r.status === 'failed' && r.incident ? <span className="text-red-700">Failed at {r.incident.node_id}</span>
                          : r.status === 'waiting_approval' ? <span className="text-amber-700">User task at {r.paused_at_node || '—'}{r.sla_breached_at ? ' · SLA breached' : ''}</span>
                            : r.wait?.kind === 'timer' ? <span>Timer · resumes {timeAgo(r.wait.until)}</span>
                              : r.wait?.kind === 'subflow' ? <span>Waiting on sub-flow</span>
                                : r.status === 'running' ? 'Working…' : '—'}
                      </Td>
                    )}
                    <Td className="capitalize">{r.trigger || 'manual'}</Td>
                    <Td title={fmtDateTime(r.started_at || r.createdAt)}>{timeAgo(r.started_at || r.createdAt)}</Td>
                    <Td className="tabular-nums">{fmtDuration(r.total_latency_ms ?? durationBetween(r.started_at || r.createdAt, TERMINAL_RUN.includes(r.status) ? r.updatedAt : null))}</Td>
                    <Td className="text-right" onClick={e => e.stopPropagation()}>
                      {r.status === 'failed' ? <Button size="sm" variant="primary" onClick={() => setRetryRun(r)}>Retry</Button>
                        : <Button size="sm" variant="ghost" onClick={() => nav.openInstance(r._id)}>View</Button>}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && items.length > 0 && <Pagination page={page} limit={limit} total={total} onPage={setPage} />}
      </div>
      {retryRun && <RetryDialog run={retryRun} open={!!retryRun} onClose={() => setRetryRun(null)} onDone={() => { load(); reloadStats(); }} />}
    </div>
  );
};

export const InstanceDetailView: React.FC<{ runId: string; nav: Nav; lookups: Lookups; onBack: () => void }> = ({ runId, nav, lookups, onBack }) => {
  const [run, setRun] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'overview' | 'variables' | 'steps' | 'logs'>('overview');
  const [focus, setFocus] = useState<string | null>(null);
  const [wide, setWide] = useState(false);

  const load = useCallback(async () => {
    try { const r = await apiService.playground.runs.get(runId); setRun(r?.data || null); setError(null); }
    catch (e: any) { setError(e?.status === 404 ? 'Instance not found (it may have been deleted).' : errMessage(e, 'Failed to load the instance')); }
  }, [runId]);
  useEffect(() => { setRun(null); load(); }, [load]);
  useEffect(() => {
    if (!run || TERMINAL_RUN.includes(run.status)) return;
    // Actively working → refresh fast; only waiting on a person → refresh slowly.
    const t = setInterval(load, run.status === 'waiting_approval' ? 10000 : 2500);
    return () => clearInterval(t);
  }, [run?.status, load]);

  if (error) return <div className="p-6"><ErrorBanner message={error} onRetry={load} /><Button className="mt-3" icon={<ArrowLeft className="h-4 w-4" />} onClick={onBack}>Back</Button></div>;
  if (!run) return <Spinner label="Loading instance…" className="h-full" />;

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-2.5">
        <IconButton label="Back" onClick={onBack}><ArrowLeft className="h-4 w-4" /></IconButton>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-[15px] font-semibold text-slate-900">{run.flow_name || 'Instance'}</span>
            <span className="font-mono text-[12.5px] text-slate-500">#{shortId(run._id)}</span>
            <StatusPill status={run.status} />
            {!TERMINAL_RUN.includes(run.status) && <span className="inline-flex items-center gap-1 text-[12px] text-slate-500"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />Live</span>}
          </div>
          <div className="text-[12.5px] text-slate-500">Started {fmtDateTime(run.createdAt)} · {run.trigger || 'manual'} · ran the definition pinned at start</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <RunActions run={run} onChange={load} size="md" />
          {run.flow_id && <Button icon={<ExternalLink className="h-4 w-4" />} onClick={() => nav.openProcess(run.flow_id)}>Open process</Button>}
          <IconButton label="Refresh" onClick={load}><RefreshCw className="h-4 w-4" /></IconButton>
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          <InstanceCanvas run={run} lookups={lookups} selectedNode={focus} onSelectNode={id => { setFocus(id); if (id) setTab('steps'); }} />
        </div>
        <aside className={cx('flex shrink-0 flex-col border-l border-slate-200 bg-white transition-[width] duration-200', wide ? 'w-[min(960px,65%)]' : 'w-[460px]')}>
          <div className="flex items-end gap-1 px-3 pt-2">
            <Tabs className="flex-1" active={tab} onChange={k => setTab(k as any)} tabs={[
              { key: 'overview', label: 'Overview' }, { key: 'variables', label: 'Variables' },
              { key: 'steps', label: 'Execution trail', count: (run.nodes || []).filter((n: any) => n.status && n.status !== 'pending').length }, { key: 'logs', label: 'Logs' },
            ]} />
            <IconButton className="mb-1" label={wide ? 'Narrow panel' : 'Widen panel'} onClick={() => setWide(w => !w)}>{wide ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</IconButton>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {tab === 'overview' && <InstanceOverview run={run} onChanged={load} onOpenRun={nav.openInstance} onOpenProcess={id => nav.openProcess(id)} />}
            {tab === 'variables' && <VariablesPanel run={run} />}
            {tab === 'steps' && <StepTrail run={run} focusNode={focus} onFocus={setFocus} />}
            {tab === 'logs' && <LogList run={run} tall />}
          </div>
        </aside>
      </div>
    </div>
  );
};

/* ═════════════════════════ Tasks (user tasks waiting) ═════════════════════════ */

export const TasksView: React.FC<{ nav: Nav }> = ({ nav }) => {
  const [runs, setRuns] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limit = 20;
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await apiService.playground.runs.list({ status: 'waiting_approval', limit, page });
      const rows: any[] = r?.data || [];
      setTotal(r?.total ?? rows.length);
      // List rows have no definition; fetch each run so the task's title / outcomes are known.
      const full = await Promise.all(rows.map(x => apiService.playground.runs.get(x._id).then(d => d?.data || x).catch(() => x)));
      setRuns(full.filter(x => x.status === 'waiting_approval'));
    } catch (e: any) { setError(errMessage(e, 'Failed to load tasks')); }
    finally { setLoading(false); }
  }, [page]);
  useEffect(() => { load(); }, [load]);
  return (
    <div className="p-6">
      <PageHeader title="Tasks" subtitle="User tasks waiting for a decision. The process continues on the path of the outcome you pick."
        actions={<IconButton label="Refresh" onClick={load}><RefreshCw className="h-4 w-4" /></IconButton>} />
      {error && <ErrorBanner message={error} onRetry={load} className="mb-3" />}
      {loading ? <Spinner label="Loading tasks…" /> : runs.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white"><EmptyState icon={<UserCheck className="h-5 w-5" />} title="No tasks waiting" description="When a process reaches a User task it appears here." /></div>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {runs.map(r => {
            const t = waitingTask(r);
            return (
              <div key={r._id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-semibold text-slate-900">{r.flow_name}</div>
                    <div className="text-[12.5px] text-slate-500">Instance #{shortId(r._id)} · waiting {timeAgo(r.updatedAt)} · step “{t?.def?.label || t?.nodeId}”</div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => nav.openInstance(r._id)}>Details</Button>
                </div>
                <HumanTaskCard run={r} onDone={load} compact />
              </div>
            );
          })}
        </div>
      )}
      {!loading && total > limit && <div className="mt-3 rounded-lg border border-slate-200 bg-white"><Pagination page={page} limit={limit} total={total} onPage={setPage} /></div>}
    </div>
  );
};

/* ═════════════════════════ Triggers ═════════════════════════ */

export const TriggersView: React.FC<{ nav: Nav; lookups: Lookups; flowId?: string }> = ({ nav, lookups, flowId }) => {
  const api = useMemo(() => ({
    list: (id?: string) => apiService.playground.schedules.list(id ? { flow_id: id } : undefined),
    create: (id: string, data: any) => apiService.playground.schedules.create(id, data),
    update: (id: string, data: any) => apiService.playground.schedules.update(id, data),
    remove: (id: string) => apiService.playground.schedules.delete(id),
    run: (id: string, input?: any) => apiService.playground.schedules.run(id, input),
    rotateToken: (id: string) => apiService.playground.schedules.rotateToken(id),
  }), []);
  const flowName = flowId ? lookups.flows.find((f: any) => f._id === flowId)?.name : null;
  return (
    <div className="p-6">
      <PageHeader title={flowName ? `Triggers · ${flowName}` : 'Triggers'} subtitle="Start process instances automatically. A due trigger fires exactly once, even with several servers."
        actions={flowId && <Button onClick={() => nav.openTriggers(undefined)}>Show all triggers</Button>} />
      <TriggerManager api={api} targets={lookups.flows.map((f: any) => ({ id: f._id, name: f.name }))} targetKey="flow_id" targetNoun="process"
        fixedTargetId={flowId} onOpenInstance={nav.openInstance} />
    </div>
  );
};

/* ═════════════════════════ Templates (published solutions) ═════════════════════════ */

export const TemplatesView: React.FC<{ nav: Nav; lookups: Lookups }> = ({ nav, lookups }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [preview, setPreview] = useState<any | null>(null);
  const [cloneOf, setCloneOf] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { const r = await apiService.playground.solutions.list(); setItems(r?.data || []); }
    catch (e: any) { setError(errMessage(e, 'Failed to load templates')); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const categories = Array.from(new Set(items.map(i => i.category).filter(Boolean)));
  const shown = items.filter(i => (!category || i.category === category) && (!search || `${i.name} ${i.summary} ${i.industry} ${(i.tags || []).join(' ')}`.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="p-6">
      <PageHeader title="Templates" subtitle="Published solutions you can copy into a runnable process. Their agents are provisioned for you."
        actions={<IconButton label="Refresh" onClick={load}><RefreshCw className="h-4 w-4" /></IconButton>} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search templates" className="w-72" />
        <div className="flex flex-wrap gap-1">
          <Button size="sm" variant={!category ? 'subtle' : 'ghost'} onClick={() => setCategory('')}>All</Button>
          {categories.map(c => <Button key={c} size="sm" variant={category === c ? 'subtle' : 'ghost'} onClick={() => setCategory(c)}>{c}</Button>)}
        </div>
      </div>
      {error && <ErrorBanner message={error} onRetry={load} className="mb-3" />}
      {loading ? <Spinner label="Loading templates…" /> : shown.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white"><EmptyState icon={<LayoutTemplate className="h-5 w-5" />} title="No templates" description="Templates are published by administrators in Solutions Lab." /></div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {shown.map(s => (
            <div key={s._id} className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300 hover:shadow-sm transition">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--sx-primary-soft)] text-[var(--sx-primary)]"><Workflow className="h-[18px] w-[18px]" /></span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-semibold text-slate-900">{s.name}</div>
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {s.category && <Tag tone="blue">{s.category}</Tag>}{s.industry && <Tag>{s.industry}</Tag>}{s.difficulty && <Tag>{s.difficulty}</Tag>}
                    {s.has_human_approval && <Tag tone="amber">User task</Tag>}
                  </div>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-[13px] text-slate-600">{s.summary || s.description || 'No description.'}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1 text-[12px] text-slate-500">
                {(s.steps || []).slice(0, 5).map((st: any, i: number) => <React.Fragment key={i}>{i > 0 && <span className="text-slate-300">→</span>}<span className="rounded bg-slate-100 px-1.5 py-px">{st.label}</span></React.Fragment>)}
                {(s.steps || []).length > 5 && <span>+{s.steps.length - 5}</span>}
              </div>
              <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                <span className="text-[12px] text-slate-500">{s.step_count ?? (s.steps || []).length} steps · used {s.clone_count ?? 0}×{s.estimated_setup ? ` · ${s.estimated_setup}` : ''}</span>
                <div className="flex gap-1.5">
                  <Button size="sm" onClick={() => setPreview(s)}>Preview</Button>
                  <Button size="sm" variant="primary" onClick={() => setCloneOf(s)}>Use template</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <TemplatePreview solution={preview} lookups={lookups} onClose={() => setPreview(null)} onUse={s => { setPreview(null); setCloneOf(s); }} />
      <CloneModal solution={cloneOf} onClose={() => setCloneOf(null)} onCloned={id => { nav.refreshFlows(); nav.openProcess(id); }} />
    </div>
  );
};

const TemplatePreview: React.FC<{ solution: any | null; lookups: Lookups; onClose: () => void; onUse: (s: any) => void }> = ({ solution, lookups, onClose, onUse }) => {
  const [full, setFull] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    setFull(null); setErr(null);
    if (!solution) return;
    apiService.playground.solutions.get(solution._id).then(r => setFull(r?.data)).catch(e => setErr(errMessage(e, 'Failed to load template')));
  }, [solution]);
  const canvas = useMemo(() => full?.graph ? flowToCanvas(full.graph, lookups, true) : null, [full, lookups]);
  const manifest = useSampleManifest();
  const samples = findTemplateSamples(manifest, { slug: solution?.slug, name: solution?.name });
  return (
    <Modal open={!!solution} onClose={onClose} title={solution?.name} subtitle={solution?.summary} width={980}
      footer={<><Button onClick={onClose}>Close</Button><Button variant="primary" onClick={() => onUse(solution)}>Use template</Button></>}>
      {err && <ErrorBanner message={err} />}
      {!full && !err && <Spinner label="Loading…" />}
      {full && (
        <div className="space-y-3">
          <div className="h-[340px] overflow-hidden rounded-md border border-slate-200">
            {canvas && (
              <ReactFlowProvider>
                <ReactFlow nodes={canvas.nodes} edges={canvas.edges} nodeTypes={studioNodeTypes} fitView fitViewOptions={{ padding: 0.2, maxZoom: 1.1 }} nodesDraggable={false} nodesConnectable={false} proOptions={{ hideAttribution: true }}>
                  <Background color="#d5dce0" gap={18} size={1.2} /><Controls showInteractive={false} />
                </ReactFlow>
              </ReactFlowProvider>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-md border border-slate-200 p-3"><div className="mb-1 flex items-center gap-1.5 text-[12.5px] font-medium text-slate-700"><Bot className="h-4 w-4" />Agents</div><div className="flex flex-wrap gap-1">{(full.agents_used || []).map((a: string) => <Tag key={a} tone="purple">{a}</Tag>)}{!(full.agents_used || []).length && <span className="text-[12.5px] text-slate-400">None</span>}</div></div>
            <div className="rounded-md border border-slate-200 p-3"><div className="mb-1 flex items-center gap-1.5 text-[12.5px] font-medium text-slate-700"><Plug className="h-4 w-4" />Connectors</div><div className="flex flex-wrap gap-1">{(full.connectors_used || []).map((a: string) => <Tag key={a} tone="blue">{a}</Tag>)}{!(full.connectors_used || []).length && <span className="text-[12.5px] text-slate-400">None</span>}</div></div>
            <div className="rounded-md border border-slate-200 p-3"><div className="mb-1 flex items-center gap-1.5 text-[12.5px] font-medium text-slate-700"><ShieldCheck className="h-4 w-4" />Version</div><div className="text-[12.5px] text-slate-600">v{full.published_version ?? full.version} · published {fmtDateTime(full.published_at)}</div></div>
          </div>
          {Array.isArray(full.kpis) && full.kpis.length > 0 && <div className="flex flex-wrap gap-2">{full.kpis.map((k: any, i: number) => <Tag key={i} tone="green">{k.metric}: {k.impact}</Tag>)}</div>}
          {full.description && <p className="text-[13px] text-slate-600 whitespace-pre-wrap">{full.description}</p>}
          {samples && samples.samples.length > 0 && (
            <div>
              <div className="mb-1 text-[12.5px] font-medium text-slate-700">Sample inputs for demos — open the documents, or use them from the Debug dialog after “Use template”</div>
              <SampleList samples={samples.samples} />
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

const CloneModal: React.FC<{ solution: any | null; onClose: () => void; onCloned: (id: string) => void }> = ({ solution, onClose, onCloned }) => {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { if (solution) { setName(solution.name); setErr(null); } }, [solution]);
  const go = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await apiService.playground.solutions.clone(solution._id, { name: name.trim() || solution.name });
      toast.success('Template copied to your processes');
      onClose();
      if (r?.data?._id) onCloned(r.data._id);
    } catch (e: any) { setErr(e?.status === 404 ? 'This template is no longer published.' : errMessage(e, 'Failed to use the template')); }
    finally { setBusy(false); }
  };
  return (
    <Modal open={!!solution} onClose={onClose} title="Use template" subtitle="Creates a runnable copy in your organization. Its agents are created automatically." width={480}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} onClick={go}>Create process</Button></>}>
      {err && <ErrorBanner message={err} className="mb-3" />}
      <Field label="Process name"><Input value={name} onChange={e => setName(e.target.value)} autoFocus /></Field>
      {busy && <Callout tone="info" className="mt-3">Provisioning agents — this can take a few seconds…</Callout>}
    </Modal>
  );
};

