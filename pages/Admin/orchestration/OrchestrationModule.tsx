// Orchestration (LangGraph pipelines) — Pipelines, Create, Executions (instances), Approval inbox and
// Triggers, rebuilt on the frozen v1 contract (W-01 … W-28 + WebSocket).
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, { Background, Controls, ReactFlowProvider, Edge, Node } from 'reactflow';
import 'reactflow/dist/style.css';
import toast from '../../../components/studio/notify';
import * as pdfjs from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import {
  Plus, RefreshCw, Play, MoreHorizontal, Trash2, Settings2, History, Zap, ArrowLeft, Workflow, CheckCircle2, XCircle, RotateCcw,
  Square, UploadCloud, Bot, Send, Sparkles, AlertTriangle, Clock, Loader2, Inbox, Save, ExternalLink, FileText,
} from 'lucide-react';
import { apiService, API_BASE_URL } from '../../../services/api';
import { autoLayout, studioNodeTypes, styleEdge } from '../../../components/studio/bpmn';
import { TriggerManager } from '../../../components/studio/triggers';
import { SampleFileLinks, useSampleManifest } from '../../../components/studio/samples';
import { ValueView } from '../../../components/studio/valueView';
import {
  Button, Callout, ConfirmDialog, EmptyState, ErrorBanner, Field, IconButton, Input, JsonBlock, KeyValue, Menu, Modal, PageHeader, Pagination,
  SearchInput, Select, Spinner, StatCard, StatusPill, Tabs, Tag, Td, TextArea, Th, Toggle, cx, durationBetween, errMessage, fmtDateTime,
  fmtDuration, shortId, timeAgo, unwrapValue,
} from '../../../components/studio/ui';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export type OrchestrationView = 'pipelines' | 'create' | 'executions' | 'approvals' | 'triggers';

const ACTIVE_EXEC = ['queued', 'running', 'waiting_human_approval'];
const TERMINAL_EXEC = ['completed', 'failed', 'cancelled', 'rejected'];

/* ───────────────────────── pipeline DAG → canvas ───────────────────────── */

const TYPE_MAP: Record<string, string> = {
  agent: 'agent', condition: 'condition', router: 'condition', transform: 'transform', human_approval: 'human_task', human: 'human_task',
  tool: 'connector', connector: 'connector', api: 'api_call', api_call: 'api_call', start: 'start', end: 'end', parallel: 'parallel', join: 'join',
};
const dagNodes = (pl: any): any[] => pl?.dag?.nodes || pl?.nodes || [];
const dagEdges = (pl: any): any[] => pl?.dag?.edges || pl?.edges || [];

const pipelineToCanvas = (pl: any, exec?: any): { nodes: Node[]; edges: Edge[] } => {
  const raw = dagNodes(pl);
  const statusById = new Map((exec?.nodes || []).map((n: any) => [n.node_id, n.status]));
  let nodes: Node[] = raw.map((n: any, i: number) => {
    const id = n.node_id || n.id || `node_${i}`;
    const t = TYPE_MAP[n.node_type || n.type] || 'agent';
    const sub = n.node_type === 'condition' ? 'Router' : n.role ? String(n.role) : undefined;
    return { id, type: 'studio', position: { x: 0, y: 0 }, data: { type: t, label: n.name || id, sub, status: statusById.get(id), readOnly: true, raw: n } } as Node;
  });
  const ids = new Set(nodes.map(n => n.id));
  const edges: Edge[] = [];
  const seen = new Set<string>();
  const add = (s: string, t: string, label?: string, kind?: string) => {
    if (!ids.has(s) || !ids.has(t) || s === t || seen.has(`${s}->${t}`)) return;
    seen.add(`${s}->${t}`);
    const taken = statusById.get(s) && ['completed'].includes(statusById.get(s) as string) && statusById.get(t) && statusById.get(t) !== 'pending' && statusById.get(t) !== 'skipped';
    edges.push(styleEdge({ id: `e_${s}_${t}`, source: s, target: t } as any, { kind: kind || 'sequence', label, taken: !!taken }));
  };
  dagEdges(pl).forEach((e: any) => add(e.from || e.source, e.to || e.target, e.label || e.condition));
  raw.forEach((n: any) => {
    const id = n.node_id || n.id;
    const c = n.config || {};
    (c.rules || []).forEach((r: any) => r?.route && add(id, r.route, r.when ? String(r.when).slice(0, 28) : undefined, 'conditional'));
    if (c.default_route) add(id, c.default_route, 'default', 'conditional');
    if (c.safe_route) add(id, c.safe_route, 'safe route', 'escalation');
  });
  if (!edges.length) for (let i = 0; i < nodes.length - 1; i++) add(nodes[i].id, nodes[i + 1].id);
  nodes = autoLayout(nodes, edges.map(e => ({ source: e.source, target: e.target })), 260, 130);
  return { nodes, edges };
};

const PipelineCanvas: React.FC<{ pipeline: any; exec?: any; selected?: string | null; onSelect?: (id: string | null) => void }> = ({ pipeline, exec, selected, onSelect }) => {
  const { nodes, edges } = useMemo(() => {
    const c = pipelineToCanvas(pipeline, exec);
    return { nodes: c.nodes.map(n => ({ ...n, selected: n.id === selected })), edges: c.edges };
  }, [pipeline, exec, selected]);
  if (!nodes.length) return <EmptyState icon={<Workflow className="h-5 w-5" />} title="No steps in this pipeline" compact />;
  return (
    <ReactFlowProvider>
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={studioNodeTypes} fitView fitViewOptions={{ padding: 0.25, maxZoom: 1.1 }} nodesDraggable={false} nodesConnectable={false}
        proOptions={{ hideAttribution: true }} minZoom={0.2} onNodeClick={(_, n) => onSelect?.(n.id)} onPaneClick={() => onSelect?.(null)}>
        <Background color="#d5dce0" gap={18} size={1.2} />
        <Controls showInteractive={false} position="bottom-right" />
      </ReactFlow>
    </ReactFlowProvider>
  );
};

/* ───────────────────────── module root ───────────────────────── */

interface ModuleProps {
  view: OrchestrationView;
  onNavigate: (v: OrchestrationView) => void;
  onCounts?: (c: { pipelines: number; approvals: number }) => void;
  createPrefill?: { title?: string; description?: string; industry?: string; complexity?: string } | null;
  onPrefillConsumed?: () => void;
}

export const OrchestrationModule: React.FC<ModuleProps> = ({ view, onNavigate, onCounts, createPrefill, onPrefillConsumed }) => {
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [plLoading, setPlLoading] = useState(true);
  const [plError, setPlError] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ kind: 'pipeline' | 'execution'; id: string; tab?: string } | null>(null);
  const [runTarget, setRunTarget] = useState<any | null>(null);

  const loadPipelines = useCallback(async () => {
    setPlLoading(true); setPlError(null);
    try { const r = await apiService.workflows.listPipelines('limit=100'); setPipelines(Array.isArray(r?.data) ? r.data : []); }
    catch (e: any) { setPlError(errMessage(e, 'Failed to load pipelines')); }
    finally { setPlLoading(false); }
  }, []);
  useEffect(() => { loadPipelines(); }, [loadPipelines]);

  const loadApprovalCount = useCallback(async () => {
    try { const r = await apiService.approvals.list('pending'); onCounts?.({ pipelines: pipelines.length, approvals: r?.count ?? (r?.data || []).length }); }
    catch { onCounts?.({ pipelines: pipelines.length, approvals: 0 }); }
  }, [pipelines.length, onCounts]);
  useEffect(() => { loadApprovalCount(); }, [loadApprovalCount, view]);

  // Choosing a sidebar item always lands on that list, not on a detail page left open earlier.
  useEffect(() => { setDetail(null); }, [view]);

  const openPipeline = (id: string, tab?: string) => setDetail({ kind: 'pipeline', id, tab });
  const openExecution = (id: string) => setDetail({ kind: 'execution', id });

  // Rendered on the list and on the pipeline page — both have a Run button.
  const runModal = <RunPipelineModal pipeline={runTarget} onClose={() => setRunTarget(null)} onStarted={id => { setRunTarget(null); openExecution(id); }} />;

  if (detail?.kind === 'pipeline') return (
    <>
      <PipelineDetail id={detail.id} initialTab={detail.tab} onBack={() => setDetail(null)} onRun={setRunTarget} onOpenExecution={openExecution}
        onChanged={loadPipelines} pipelines={pipelines} />
      {runModal}
    </>
  );
  if (detail?.kind === 'execution') return (
    <ExecutionDetail id={detail.id} onBack={() => setDetail(null)} onOpenPipeline={openPipeline} onChanged={loadApprovalCount} pipelines={pipelines} />
  );

  return (
    <>
      {view === 'pipelines' && <PipelinesList pipelines={pipelines} loading={plLoading} error={plError} reload={loadPipelines} onOpen={openPipeline} onRun={setRunTarget} onCreate={() => onNavigate('create')} onOpenExecutions={() => onNavigate('executions')} />}
      {view === 'create' && <CreatePipeline prefill={createPrefill} onPrefillConsumed={onPrefillConsumed} onCreated={id => { loadPipelines(); openPipeline(id); }} />}
      {view === 'executions' && <ExecutionsList pipelines={pipelines} onOpen={openExecution} />}
      {view === 'approvals' && <ApprovalInbox onOpenExecution={openExecution} onChanged={loadApprovalCount} />}
      {view === 'triggers' && <AllTriggers pipelines={pipelines} onOpenExecution={openExecution} />}
      {runModal}
    </>
  );
};

/* ═════════════════════════ Pipelines list ═════════════════════════ */

const ExecStats: React.FC<{ pipelineId?: string; onPick?: (s?: string) => void; active?: string }> = ({ pipelineId, onPick, active }) => {
  const [s, setS] = useState<any | null>(null);
  useEffect(() => { apiService.workflows.getExecutionStats(pipelineId).then(r => setS(r?.data || null)).catch(() => setS(null)); }, [pipelineId]);
  if (!s) return null;
  const b = s.by_status || {};
  return (
    <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <StatCard label="Total executions" value={s.total ?? 0} onClick={onPick && (() => onPick(undefined))} active={onPick && !active} />
      <StatCard label="Running" tone="blue" value={(b.running || 0) + (b.queued || 0)} onClick={onPick && (() => onPick('queued,running'))} active={active === 'queued,running'} />
      <StatCard label="Waiting for approval" tone="amber" value={b.waiting_human_approval || 0} hint={b.paused ? `+ ${b.paused} paused (legacy)` : undefined} onClick={onPick && (() => onPick('waiting_human_approval'))} active={active === 'waiting_human_approval'} />
      <StatCard label="Completed" tone="green" value={b.completed || 0} onClick={onPick && (() => onPick('completed'))} active={active === 'completed'} />
      <StatCard label="Incidents (failed)" tone="red" value={s.incidents ?? b.failed ?? 0} onClick={onPick && (() => onPick('failed'))} active={active === 'failed'} />
      <StatCard label="Cancelled / rejected" value={(b.cancelled || 0) + (b.rejected || 0)} onClick={onPick && (() => onPick('cancelled,rejected'))} active={active === 'cancelled,rejected'} />
    </div>
  );
};

const PipelinesList: React.FC<{ pipelines: any[]; loading: boolean; error: string | null; reload: () => void; onOpen: (id: string, tab?: string) => void; onRun: (p: any) => void; onCreate: () => void; onOpenExecutions: () => void }> = ({ pipelines, loading, error, reload, onOpen, onRun, onCreate, onOpenExecutions }) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [del, setDel] = useState<any | null>(null);
  const [withAgents, setWithAgents] = useState(false);
  const shown = pipelines.filter(p => (!status || (p.status || 'draft') === status) && (!search || `${p.name} ${p.description || ''}`.toLowerCase().includes(search.toLowerCase())));
  const remove = async () => {
    try {
      const r = await apiService.workflows.delete(del._id, withAgents);
      const c = r?.cascade;
      toast.success(c ? `Pipeline deleted · ${c.executions} execution(s)${withAgents ? ` · ${c.deleted_agents} agent(s)` : ''} removed` : 'Pipeline deleted');
      reload();
    } catch (e: any) { toast.error(errMessage(e, 'Delete failed')); }
    setDel(null);
  };
  return (
    <div>
      <PageHeader title="Pipelines" subtitle="Multi-agent LangGraph pipelines designed by AI from your use cases."
        actions={<><IconButton label="Refresh" onClick={reload}><RefreshCw className="h-4 w-4" /></IconButton><Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={onCreate}>Create pipeline</Button></>} />
      <ExecStats onPick={() => onOpenExecutions()} />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search pipelines" className="w-72" />
        <Select className="!w-44" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All statuses</option><option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option>
        </Select>
        <span className="ml-auto text-[12.5px] text-slate-500">{shown.length} of {pipelines.length}</span>
      </div>
      {error && <ErrorBanner message={error} onRetry={reload} className="mb-3" />}
      {loading ? <Spinner label="Loading pipelines…" /> : shown.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white">
          <EmptyState icon={<Workflow className="h-5 w-5" />} title={pipelines.length ? 'No matching pipelines' : 'No pipelines yet'}
            description={pipelines.length ? 'Try a different search or status.' : 'Describe a use case and the AI designs the agents and the flow for you.'}
            action={!pipelines.length && <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={onCreate}>Create pipeline</Button>} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {shown.map(p => {
            const steps = dagNodes(p);
            const agents = steps.filter((n: any) => (n.node_type || n.type) === 'agent').length;
            return (
              <div key={p._id} className="group flex flex-col rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--sx-primary-soft)] text-[var(--sx-primary)]"><Workflow className="h-[18px] w-[18px]" /></span>
                  <div className="min-w-0 flex-1">
                    <button onClick={() => onOpen(p._id)} className="block w-full truncate text-left text-[14.5px] font-semibold text-slate-900 hover:text-[var(--sx-primary)]" title={p.name}>{p.name}</button>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <StatusPill status={p.status || 'draft'} />
                      {p.workflow_type && <Tag>{p.workflow_type}</Tag>}
                    </div>
                  </div>
                  <Menu trigger={open => <IconButton label="More" onClick={open}><MoreHorizontal className="h-4 w-4" /></IconButton>} items={[
                    { label: 'Open', icon: <Settings2 className="h-4 w-4" />, onClick: () => onOpen(p._id) },
                    { label: 'Executions', icon: <History className="h-4 w-4" />, onClick: () => onOpen(p._id, 'executions') },
                    { label: 'Triggers', icon: <Zap className="h-4 w-4" />, onClick: () => onOpen(p._id, 'triggers') },
                    'divider',
                    { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, danger: true, onClick: () => { setWithAgents(false); setDel(p); } },
                  ]} />
                </div>
                <p className="mt-2 line-clamp-2 min-h-[38px] text-[13px] text-slate-600">{p.description || 'No description.'}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1 text-[12px] text-slate-500">
                  {steps.slice(0, 4).map((n: any, i: number) => <React.Fragment key={i}>{i > 0 && <span className="text-slate-300">→</span>}<span className="max-w-[120px] truncate rounded bg-slate-100 px-1.5 py-px">{n.name || n.node_id}</span></React.Fragment>)}
                  {steps.length > 4 && <span>+{steps.length - 4}</span>}
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3 mt-3">
                  <span className="text-[12px] text-slate-500">{steps.length} steps · {agents} agents · updated {timeAgo(p.updatedAt || p.createdAt)}</span>
                  <div className="flex gap-1.5">
                    <Button size="sm" onClick={() => onOpen(p._id)}>Open</Button>
                    <Button size="sm" variant="primary" icon={<Play className="h-3.5 w-3.5" />} onClick={() => onRun(p)}>Run</Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <ConfirmDialog open={!!del} title="Delete pipeline?" confirmLabel="Delete pipeline" onCancel={() => setDel(null)} onConfirm={remove}
        message={<>“{del?.name}” and <b>all of its executions</b> (events, snapshots, checkpoints) will be permanently deleted.</>}>
        <label className="mt-3 flex items-start gap-2 text-[13px] text-slate-700">
          <input type="checkbox" className="mt-0.5" checked={withAgents} onChange={e => setWithAgents(e.target.checked)} />
          <span>Also delete this pipeline's agents<span className="block text-[12px] text-slate-500">By default agents are kept so they can be reused.</span></span>
        </label>
      </ConfirmDialog>
    </div>
  );
};

/* ═════════════════════════ Run modal ═════════════════════════ */

const extractFileText = async (file: File) => {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    let out = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const tc = await page.getTextContent();
      out += tc.items.map((it: any) => it.str).join(' ') + '\n';
    }
    return out.trim();
  }
  return await file.text();
};

const RunPipelineModal: React.FC<{ pipeline: any | null; onClose: () => void; onStarted: (execId: string) => void }> = ({ pipeline, onClose, onStarted }) => {
  const [mode, setMode] = useState<'text' | 'json'>('text');
  const [key, setKey] = useState('document');
  const [text, setText] = useState('');
  const [json, setJson] = useState('{\n  "document": ""\n}');
  const [busy, setBusy] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const manifest = useSampleManifest();
  const [sampleKey, setSampleKey] = useState('');
  useEffect(() => { if (pipeline) { setErr(null); setBusy(false); setSampleKey(''); } }, [pipeline]);
  const allSamples = (manifest?.orchestration || []).flatMap(b => b.samples.map(s => ({ ...s, key: `${b.slug}/${s.id}`, blueprint: b.blueprint, field: b.field })));
  const chosen = allSamples.find(s => s.key === sampleKey);
  const applySample = (key: string) => {
    setSampleKey(key);
    const s = allSamples.find(x => x.key === key);
    if (!s) return;
    setMode('text'); setKey(s.field || 'document'); setText(s.text); setErr(null);
  };

  const onFile = async (f?: File) => {
    if (!f) return;
    setParsing(true); setErr(null);
    try {
      const t = await extractFileText(f);
      if (!t) throw new Error('No text could be read from this file.');
      setMode('text'); setText(t);
      toast.success(`Read ${f.name}`);
    } catch (e: any) { setErr(e?.message || 'Could not read the file'); }
    finally { setParsing(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const start = async () => {
    let input: any;
    if (mode === 'json') {
      try { input = json.trim() ? JSON.parse(json) : {}; } catch (e: any) { setErr(`Not valid JSON: ${e.message}`); return; }
    } else {
      if (!text.trim()) { setErr('Enter the input text or upload a file.'); return; }
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) { setErr('Field name must be letters, digits or _.'); return; }
      input = { [key]: text };
    }
    setBusy(true); setErr(null);
    try {
      const r = await apiService.workflows.executePipeline(pipeline._id, { input, trigger_type: 'manual' });
      const id = r?.data?._id || r?.data?.execution_id;
      toast.success('Execution started');
      if (id) onStarted(id); else onClose();
    } catch (e: any) { setErr(errMessage(e, 'Failed to start the execution')); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={!!pipeline} onClose={onClose} title="Run pipeline" subtitle={pipeline?.name} width={640}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" icon={<Play className="h-4 w-4" />} loading={busy} onClick={start}>Start execution</Button></>}>
      <div className="space-y-3">
        {err && <ErrorBanner message={err} />}
        <div className="flex items-center justify-between">
          <Tabs active={mode} onChange={k => setMode(k as any)} tabs={[{ key: 'text', label: 'Text / document' }, { key: 'json', label: 'JSON input' }]} />
          <input ref={fileRef} type="file" className="hidden" accept=".pdf,.txt,.csv,.json,.md,.log" onChange={e => onFile(e.target.files?.[0])} />
          <Button size="sm" icon={parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />} disabled={parsing} onClick={() => fileRef.current?.click()}>Upload file</Button>
        </div>
        {allSamples.length > 0 && (
          <Field label="Sample input (demo)" hint={chosen ? <>Expected: {chosen.expect}</> : 'Pick a sample document to fill the input.'}>
            <Select value={sampleKey} onChange={e => applySample(e.target.value)}>
              <option value="">Choose a sample…</option>
              {(manifest?.orchestration || []).map(b => (
                <optgroup key={b.slug} label={b.blueprint}>
                  {b.samples.map(s => <option key={s.id} value={`${b.slug}/${s.id}`}>{s.label}</option>)}
                </optgroup>
              ))}
            </Select>
            {chosen && <SampleFileLinks files={chosen.files} className="mt-1.5" />}
          </Field>
        )}
        {mode === 'text' ? (<>
          <Field label="Sent as field" hint={<>The first step receives <code className="font-mono">{`{ "${key}": "…" }`}</code>.</>}><Input className="w-56 font-mono" value={key} onChange={e => setKey(e.target.value)} /></Field>
          <TextArea rows={10} value={text} onChange={e => setText(e.target.value)} placeholder="Paste the invoice / email / document text here, or upload a PDF or text file." />
        </>) : (
          <TextArea rows={12} className="font-mono text-[12.5px]" value={json} onChange={e => setJson(e.target.value)} />
        )}
        <div className="text-[12px] text-slate-500">The execution starts immediately and runs in the background — you'll follow it live on the next screen.</div>
      </div>
    </Modal>
  );
};

/* ═════════════════════════ Pipeline detail ═════════════════════════ */

const PipelineDetail: React.FC<{ id: string; initialTab?: string; pipelines: any[]; onBack: () => void; onRun: (p: any) => void; onOpenExecution: (id: string) => void; onChanged: () => void }> = ({ id, initialTab, pipelines, onBack, onRun, onOpenExecution, onChanged }) => {
  const [pl, setPl] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState(initialTab || 'diagram');
  const [sel, setSel] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; description: string; status: string; visibility: string }>({ name: '', description: '', status: 'draft', visibility: 'private' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await apiService.workflows.getPipeline(id);
      setPl(r?.data);
      setForm({ name: r?.data?.name || '', description: r?.data?.description || '', status: r?.data?.status || 'draft', visibility: r?.data?.visibility || 'private' });
    } catch (e: any) { setError(e?.status === 404 ? 'Pipeline not found (it may have been deleted).' : errMessage(e, 'Failed to load the pipeline')); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const dirty = !!pl && (form.name !== (pl.name || '') || form.description !== (pl.description || '') || form.status !== (pl.status || 'draft') || form.visibility !== (pl.visibility || 'private'));
  const save = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try { await apiService.workflows.updatePipeline(id, { ...form, name: form.name.trim() }); toast.success('Pipeline updated'); await load(); onChanged(); }
    catch (e: any) { toast.error(errMessage(e, 'Update failed')); }
    finally { setSaving(false); }
  };

  if (error) return <div><ErrorBanner message={error} onRetry={load} /><Button className="mt-3" icon={<ArrowLeft className="h-4 w-4" />} onClick={onBack}>Back to pipelines</Button></div>;
  if (!pl) return <Spinner label="Loading pipeline…" />;
  const selNode = dagNodes(pl).find((n: any) => (n.node_id || n.id) === sel);

  return (
    <div className="flex h-full flex-col">
      <PageHeader breadcrumb={<button onClick={onBack} className="inline-flex items-center gap-1 hover:text-slate-800"><ArrowLeft className="h-3.5 w-3.5" />Pipelines</button>}
        title={<span className="flex items-center gap-2">{pl.name}<StatusPill status={pl.status || 'draft'} /></span>}
        subtitle={pl.description}
        actions={<><IconButton label="Refresh" onClick={load}><RefreshCw className="h-4 w-4" /></IconButton><Button variant="primary" icon={<Play className="h-4 w-4" />} onClick={() => onRun(pl)}>Run</Button></>} />
      <Tabs active={tab} onChange={setTab} className="mb-4" tabs={[
        { key: 'diagram', label: 'Diagram', count: dagNodes(pl).length }, { key: 'executions', label: 'Executions' }, { key: 'triggers', label: 'Triggers' }, { key: 'settings', label: 'Settings' },
      ]} />
      {tab === 'diagram' && (
        <div className="flex min-h-[520px] flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="min-w-0 flex-1 bg-[#f8f9fa]"><PipelineCanvas pipeline={pl} selected={sel} onSelect={setSel} /></div>
          <aside className="w-[380px] shrink-0 overflow-y-auto border-l border-slate-200">
            {selNode ? <NodeInspector node={selNode} onClose={() => setSel(null)} /> : (
              <div className="space-y-3 p-4 text-[13px] text-slate-600">
                <div className="font-semibold text-slate-800">About this diagram</div>
                <p>The AI designed this pipeline's steps and routing. Select a step to see its role and configuration; select an agent to edit its prompt or test it.</p>
                <Callout tone="info">The flow itself isn't editable here — rename, change the status or visibility in <b>Settings</b>.</Callout>
                <KeyValue items={[['Type', pl.workflow_type || '—'], ['Steps', dagNodes(pl).length], ['Created', fmtDateTime(pl.createdAt)], ['Updated', fmtDateTime(pl.updatedAt)], ['Pipeline ID', <span className="font-mono text-[12px]">{pl._id}</span>]]} />
              </div>
            )}
          </aside>
        </div>
      )}
      {tab === 'executions' && <ExecutionsList pipelines={pipelines} pipelineId={id} onOpen={onOpenExecution} embedded />}
      {tab === 'triggers' && <PipelineTriggers pipelineId={id} pipelines={pipelines} onOpenExecution={onOpenExecution} />}
      {tab === 'settings' && (
        <div className="max-w-2xl space-y-4 rounded-lg border border-slate-200 bg-white p-5">
          <Field label="Name" required><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Description"><TextArea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status"><Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option></Select></Field>
            <Field label="Visibility"><Select value={form.visibility} onChange={e => setForm({ ...form, visibility: e.target.value })}><option value="private">Private</option><option value="team">Team</option><option value="org">Organization</option><option value="public">Public</option></Select></Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <Button disabled={!dirty || saving} onClick={() => setForm({ name: pl.name || '', description: pl.description || '', status: pl.status || 'draft', visibility: pl.visibility || 'private' })}>Reset</Button>
            <Button variant="primary" icon={<Save className="h-4 w-4" />} loading={saving} disabled={!dirty} onClick={save}>Save changes</Button>
          </div>
        </div>
      )}
    </div>
  );
};

const extractReply = (res: any): string => {
  const pick = (v: any): string | null => {
    if (v == null) return null;
    if (typeof v === 'string') return v;
    if (typeof v === 'object') return v.response ?? v.text ?? v.reply ?? v.message ?? null;
    return String(v);
  };
  return pick(res?.response) || pick(res?.data) || pick(res?.reply) || pick(res?.text) || (typeof res === 'string' ? res : JSON.stringify(res));
};

const NodeInspector: React.FC<{ node: any; onClose: () => void }> = ({ node, onClose }) => {
  const isAgent = (node.node_type || node.type) === 'agent' && node.agent_id;
  const [agent, setAgent] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('config');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [evolving, setEvolving] = useState(false);
  const [chat, setChat] = useState<{ from: 'you' | 'agent'; text: string }[]>([]);
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    setAgent(null); setChat([]); setTab('config');
    if (!isAgent) return;
    setLoading(true);
    apiService.agents.getV2(node.agent_id).then(r => setAgent(r?.data || r)).catch(() => setAgent(null)).finally(() => setLoading(false));
  }, [node.agent_id, isAgent]);

  const prompt = agent?.systemPrompt ?? agent?.system_prompt ?? '';
  const saveAgent = async () => {
    setSaving(true);
    try { await apiService.agents.updateV2(node.agent_id, { name: agent.name, role: agent.role, model: agent.model, systemPrompt: prompt, system_prompt: prompt }); toast.success('Agent saved'); }
    catch (e: any) { toast.error(errMessage(e, 'Save failed')); }
    finally { setSaving(false); }
  };
  const evolve = async () => {
    setEvolving(true);
    try {
      const r = await apiService.agents.regenerateV2(node.agent_id, feedback);
      const np = r?.data?.systemPrompt || r?.data?.system_prompt || r?.systemPrompt || r?.system_prompt;
      if (np) { setAgent((a: any) => ({ ...a, systemPrompt: np, system_prompt: np })); toast.success('Prompt updated from your feedback'); setFeedback(''); }
      else toast.error('The server did not return a new prompt');
    } catch (e: any) { toast.error(errMessage(e, 'Prompt update failed')); }
    finally { setEvolving(false); }
  };
  const send = async () => {
    if (!msg.trim()) return;
    const m = msg; setMsg(''); setChat(c => [...c, { from: 'you', text: m }]); setSending(true);
    try { const r = await apiService.agents.chatV2(node.agent_id, m); setChat(c => [...c, { from: 'agent', text: extractReply(r) }]); }
    catch (e: any) { setChat(c => [...c, { from: 'agent', text: `⚠ ${errMessage(e, 'No reply')}` }]); }
    finally { setSending(false); }
  };

  return (
    <div>
      <div className="flex items-start gap-2 border-b border-slate-200 px-4 py-3">
        <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded bg-violet-50 text-violet-700">{isAgent ? <Bot className="h-4 w-4" /> : <Workflow className="h-4 w-4" />}</span>
        <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-semibold text-slate-900">{node.name || node.node_id}</div><div className="text-[12px] text-slate-500">{node.node_type || node.type} · <span className="font-mono">{node.node_id}</span></div></div>
        <IconButton label="Close" onClick={onClose}><XCircle className="h-4 w-4" /></IconButton>
      </div>
      <div className="space-y-3 p-4">
        {node.role && <div className="text-[13px] text-slate-600">{node.role}</div>}
        {!isAgent && (<>
          {node.config && <div><div className="mb-1 text-[12.5px] font-medium text-slate-700">Configuration</div><JsonBlock value={node.config} /></div>}
          {Array.isArray(node.output_trim) && node.output_trim.length > 0 && <div className="text-[12.5px] text-slate-500">Trimmed from output: {node.output_trim.join(', ')}</div>}
        </>)}
        {isAgent && (loading ? <Spinner label="Loading agent…" /> : !agent ? <Callout tone="warning">The agent record could not be loaded.</Callout> : (<>
          <Tabs active={tab} onChange={setTab} tabs={[{ key: 'config', label: 'Configuration' }, { key: 'prompt', label: 'Improve prompt' }, { key: 'chat', label: 'Test' }]} />
          {tab === 'config' && (
            <div className="space-y-3">
              <Field label="Name"><Input value={agent.name || ''} onChange={e => setAgent({ ...agent, name: e.target.value })} /></Field>
              <Field label="Role"><Input value={agent.role || ''} onChange={e => setAgent({ ...agent, role: e.target.value })} /></Field>
              <Field label="Model"><Input value={agent.model || agent.llm?.model || ''} onChange={e => setAgent({ ...agent, model: e.target.value })} className="font-mono text-[12.5px]" /></Field>
              <Field label="System prompt"><TextArea rows={8} value={prompt} onChange={e => setAgent({ ...agent, systemPrompt: e.target.value, system_prompt: e.target.value })} /></Field>
              <div className="flex justify-between gap-2">
                <Button variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => setConfirmDel(true)}>Delete agent</Button>
                <Button variant="primary" loading={saving} onClick={saveAgent}>Save agent</Button>
              </div>
            </div>
          )}
          {tab === 'prompt' && (
            <div className="space-y-3">
              <div className="text-[13px] text-slate-600">Describe what to change; the AI rewrites the system prompt.</div>
              <TextArea rows={4} value={feedback} onChange={e => setFeedback(e.target.value)} placeholder='e.g. "Also extract the invoice number and return amounts as numbers"' />
              <Button variant="primary" icon={<Sparkles className="h-4 w-4" />} loading={evolving} disabled={!feedback.trim()} onClick={evolve}>Update prompt</Button>
              <div><div className="mb-1 text-[12.5px] font-medium text-slate-700">Current prompt</div><JsonBlock value={prompt || 'No prompt'} maxHeight={240} /></div>
            </div>
          )}
          {tab === 'chat' && (
            <div className="space-y-2">
              <div className="h-[300px] space-y-2 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3">
                {chat.length === 0 && <div className="py-10 text-center text-[12.5px] text-slate-400">Send a message to test this agent on its own.</div>}
                {chat.map((c, i) => (
                  <div key={i} className={cx('flex', c.from === 'you' ? 'justify-end' : 'justify-start')}>
                    <div className={cx('max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-[13px]', c.from === 'you' ? 'bg-[var(--sx-primary)] text-white' : 'border border-slate-200 bg-white text-slate-800')}>{c.text}</div>
                  </div>
                ))}
                {sending && <div className="flex items-center gap-1.5 text-[12px] text-slate-500"><Loader2 className="h-3.5 w-3.5 animate-spin" />Thinking…</div>}
              </div>
              <div className="flex gap-2"><Input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Message the agent" /><Button variant="primary" icon={<Send className="h-4 w-4" />} disabled={sending || !msg.trim()} onClick={send} /></div>
            </div>
          )}
        </>))}
      </div>
      <ConfirmDialog open={confirmDel} title="Delete this agent?" confirmLabel="Delete agent" onCancel={() => setConfirmDel(false)}
        message="The agent record is deleted. Pipelines that use it will fail at this step until it is replaced."
        onConfirm={async () => { try { await apiService.agents.deleteV2(node.agent_id); toast.success('Agent deleted'); setAgent(null); } catch (e: any) { toast.error(errMessage(e, 'Delete failed')); } setConfirmDel(false); }} />
    </div>
  );
};

/* ═════════════════════════ Executions ═════════════════════════ */

const ExecutionsList: React.FC<{ pipelines: any[]; pipelineId?: string; onOpen: (id: string) => void; embedded?: boolean }> = ({ pipelines, pipelineId, onOpen, embedded }) => {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [plFilter, setPlFilter] = useState(pipelineId || '');
  const [trigger, setTrigger] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [del, setDel] = useState<any | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const limit = 20;
  const plName = (id: string) => pipelines.find(p => p._id === id)?.name;

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const r = await apiService.workflows.listExecutions({ page, limit, status: status || undefined, pipeline_id: plFilter || undefined, trigger_type: trigger || undefined });
      setItems(r?.data || []); setTotal(r?.total ?? (r?.data || []).length);
    } catch (e: any) { if (!quiet) setError(errMessage(e, 'Failed to load executions')); }
    finally { if (!quiet) setLoading(false); }
  }, [page, status, plFilter, trigger]);
  useEffect(() => { load(); }, [load]);
  const anyActive = items.some(x => ACTIVE_EXEC.includes(x.status));
  useEffect(() => { if (!anyActive) return; const t = setInterval(() => load(true), 4000); return () => clearInterval(t); }, [anyActive, load]);

  const retry = async (x: any) => {
    setBusy(x._id);
    try { const r = await apiService.workflows.retryExecution(x._id); toast.success(r?.message || 'Retrying'); load(true); }
    catch (e: any) { toast.error(e?.status === 409 ? 'Only failed executions can be retried.' : errMessage(e, 'Retry failed')); }
    finally { setBusy(null); }
  };
  const cancel = async (x: any) => {
    setBusy(x._id);
    try { await apiService.workflows.cancelExecution(x._id); toast.success('Execution cancelled'); load(true); }
    catch (e: any) { toast.error(e?.status === 409 ? 'Already finished — nothing to cancel.' : errMessage(e, 'Cancel failed')); load(true); }
    finally { setBusy(null); }
  };
  const remove = async () => {
    try { await apiService.workflows.deleteExecution(del._id); toast.success('Execution deleted'); load(true); }
    catch (e: any) { toast.error(errMessage(e, 'Delete failed')); }
    setDel(null);
  };

  return (
    <div>
      {!embedded && <PageHeader title="Executions" subtitle="Every pipeline instance across your organization — follow, approve, retry or cancel."
        actions={<IconButton label="Refresh" onClick={() => load()}><RefreshCw className="h-4 w-4" /></IconButton>} />}
      {!embedded && <ExecStats active={status} onPick={s => { setStatus(s || ''); setPage(1); }} />}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {!pipelineId && (
          <Select className="!w-64" value={plFilter} onChange={e => { setPlFilter(e.target.value); setPage(1); }}>
            <option value="">All pipelines</option>{pipelines.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </Select>
        )}
        <Select className="!w-56" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="queued,running">Running / queued</option>
          <option value="waiting_human_approval">Waiting for approval</option>
          <option value="paused">Paused (legacy)</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled,rejected">Cancelled / rejected</option>
        </Select>
        <Select className="!w-40" value={trigger} onChange={e => { setTrigger(e.target.value); setPage(1); }}>
          <option value="">Any trigger</option>{['manual', 'scheduled', 'event', 'api'].map(t => <option key={t} value={t}>{t}</option>)}
        </Select>
        {embedded && <IconButton label="Refresh" onClick={() => load()}><RefreshCw className="h-4 w-4" /></IconButton>}
        {anyActive && <span className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-500"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />Live</span>}
      </div>
      {error && <ErrorBanner message={error} onRetry={() => load()} className="mb-3" />}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {loading ? <Spinner label="Loading executions…" /> : items.length === 0 ? (
          <EmptyState icon={<History className="h-5 w-5" />} title="No executions" description="Run a pipeline to see its executions here." compact={embedded} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse">
              <thead><tr><Th>Execution</Th>{!pipelineId && <Th>Pipeline</Th>}<Th>Status</Th><Th>Trigger</Th><Th>Started</Th><Th>Duration</Th><Th className="text-right">Tokens</Th><Th className="w-[170px]" /></tr></thead>
              <tbody>
                {items.map(x => (
                  <tr key={x._id} className="cursor-pointer hover:bg-slate-50" onClick={() => onOpen(x._id)}>
                    <Td><span className="font-mono text-[12.5px]">#{shortId(x._id)}</span>{x.retry_count > 0 && <Tag className="ml-1.5">retried {x.retry_count}×</Tag>}</Td>
                    {!pipelineId && <Td className="max-w-[240px] truncate font-medium text-slate-900">{x.pipeline_name || plName(x.pipeline_id) || '—'}</Td>}
                    <Td>
                      <div className="flex items-center gap-1.5"><StatusPill status={x.status} />
                        {x.status === 'failed' && x.failed_node_id && <span className="max-w-[160px] truncate text-[12px] text-red-700" title={x.last_error || ''}>at {x.failed_node_id}</span>}
                      </div>
                    </Td>
                    <Td className="capitalize">{x.trigger_type || 'manual'}</Td>
                    <Td title={fmtDateTime(x.started_at || x.createdAt)}>{timeAgo(x.started_at || x.createdAt)}</Td>
                    <Td className="tabular-nums">{fmtDuration(x.total_latency_ms ?? durationBetween(x.started_at || x.createdAt, x.completed_at))}</Td>
                    <Td className="text-right tabular-nums">{x.total_tokens ?? 0}</Td>
                    <Td className="text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {x.status === 'failed' && <Button size="sm" variant="primary" icon={<RotateCcw className="h-3.5 w-3.5" />} loading={busy === x._id} onClick={() => retry(x)}>Retry</Button>}
                        {ACTIVE_EXEC.includes(x.status) && <Button size="sm" variant="danger" loading={busy === x._id} onClick={() => cancel(x)}>Cancel</Button>}
                        <IconButton label="Delete execution" tone="danger" onClick={() => setDel(x)}><Trash2 className="h-4 w-4" /></IconButton>
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
      <ConfirmDialog open={!!del} title="Delete execution?" confirmLabel="Delete" onCancel={() => setDel(null)} onConfirm={remove}
        message={<>Execution #{shortId(del?._id)} and its events, snapshots and checkpoints are permanently deleted.</>} />
    </div>
  );
};

// Live updates: subscribe to the execution over the WebSocket; polling is the fallback.
const useExecutionSocket = (execId: string | null, enabled: boolean, onEvent: (m: any) => void) => {
  const cb = useRef(onEvent);
  cb.current = onEvent;
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    if (!execId || !enabled) return;
    let ws: WebSocket | null = null;
    try {
      const base = API_BASE_URL.replace(/\/api\/?$/, '');
      const url = (base.startsWith('http') ? base.replace(/^http/, 'ws') : `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}${base}`) + '/ws';
      ws = new WebSocket(url);
      ws.onopen = () => ws?.send(JSON.stringify({ type: 'subscribe', executionId: execId }));
      ws.onmessage = ev => {
        try { const m = JSON.parse(ev.data); if (m.type === 'subscribed') setConnected(true); else if (!m.executionId || m.executionId === execId) cb.current(m); } catch { /* ignore */ }
      };
      ws.onclose = () => setConnected(false);
      ws.onerror = () => setConnected(false);
    } catch { setConnected(false); }
    return () => { try { ws?.close(); } catch { /* ignore */ } setConnected(false); };
  }, [execId, enabled]);
  return connected;
};

const ExecutionDetail: React.FC<{ id: string; pipelines: any[]; onBack: () => void; onOpenPipeline: (id: string, tab?: string) => void; onChanged: () => void }> = ({ id, pipelines, onBack, onOpenPipeline, onChanged }) => {
  const [ex, setEx] = useState<any | null>(null);
  const [pl, setPl] = useState<any | null>(null);
  const [logs, setLogs] = useState<any | null>(null);
  const [events, setEvents] = useState<any[] | null>(null);
  const [replay, setReplay] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState('overview');
  const [sel, setSel] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [decided, setDecided] = useState(false);
  const [confirm, setConfirm] = useState<null | 'cancel' | 'delete'>(null);

  const plLoaded = useRef<string | null>(null);
  const load = useCallback(async () => {
    try {
      const r = await apiService.workflows.getExecution(id);
      setEx(r?.data); setError(null);
      const pid = r?.data?.pipeline_id;
      if (pid && plLoaded.current !== pid) { plLoaded.current = pid; apiService.workflows.getPipeline(pid).then(p => setPl(p?.data)).catch(() => { plLoaded.current = null; }); }
    } catch (e: any) { setError(e?.status === 404 ? 'Execution not found (it may have been deleted).' : errMessage(e, 'Failed to load the execution')); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  const loadLogs = useCallback(async () => { try { const r = await apiService.workflows.getExecutionLogs(id); setLogs(r?.data); } catch { /* optional */ } }, [id]);
  const loadEvents = useCallback(async () => { try { const r = await apiService.workflows.getExecutionEvents(id); setEvents(Array.isArray(r?.data) ? r.data : []); } catch { setEvents([]); } }, [id]);
  useEffect(() => { load(); loadLogs(); }, [load, loadLogs]);
  useEffect(() => { if (tab === 'events') loadEvents(); }, [tab, loadEvents]);

  const active = !!ex && ACTIVE_EXEC.includes(ex.status);
  const live = useExecutionSocket(id, active, m => {
    if (m.type === 'node_update' && m.node) {
      setEx((cur: any) => cur ? { ...cur, nodes: (cur.nodes || []).map((n: any) => n.node_id === m.node ? { ...n, status: m.status, ...(m.output !== undefined ? { output: m.output } : {}), ...(m.decision ? { decision_result: m.decision } : {}), ...(m.error ? { last_error: m.error } : {}) } : n) } : cur);
    } else if (m.type === 'execution_paused' || m.type === 'execution_resumed' || m.type === 'execution_complete') {
      load(); loadLogs(); onChanged();
      if (m.type === 'execution_complete') toast(m.status === 'completed' ? 'Execution completed' : `Execution ${m.status}`, { icon: m.status === 'completed' ? '✅' : '⚠️' });
    }
  });
  // Polling fallback (and keeps logs fresh even when the socket is connected).
  useEffect(() => { if (!active) return; const t = setInterval(() => { load(); loadLogs(); }, live ? 8000 : 3000); return () => clearInterval(t); }, [active, live, load, loadLogs]);

  const waitingNode = (ex?.nodes || []).find((n: any) => n.status === 'waiting_human');
  useEffect(() => { setDecided(false); }, [waitingNode?.node_id]);

  const decide = async (decision: 'approved' | 'rejected') => {
    if (!waitingNode) return;
    setBusy(decision); setDecided(true);
    try { await apiService.workflows.approveNode(id, waitingNode.node_id, decision); toast.success(decision === 'approved' ? 'Approved — the pipeline continues' : 'Rejected'); load(); onChanged(); }
    catch (e: any) { toast.error(e?.status === 409 ? 'Already answered (another approver or a double click).' : errMessage(e, 'Failed to record the decision')); load(); }
    finally { setBusy(null); }
  };
  const retry = async () => {
    setBusy('retry');
    try { const r = await apiService.workflows.retryExecution(id); toast.success(`${r?.message || 'Retrying'}${r?.data?.resume_from?.length ? ` (${r.data.resume_from.join(', ')})` : ''}`); load(); loadLogs(); }
    catch (e: any) { toast.error(errMessage(e, 'Retry failed')); }
    finally { setBusy(null); }
  };
  const doReplay = async () => {
    setBusy('replay');
    try { const r = await apiService.workflows.getExecutionReplay(id); setReplay(r?.data?.state || r?.data); setTab('replay'); }
    catch (e: any) { toast.error(errMessage(e, 'Replay failed')); }
    finally { setBusy(null); }
  };

  if (error) return <div><ErrorBanner message={error} onRetry={load} /><Button className="mt-3" icon={<ArrowLeft className="h-4 w-4" />} onClick={onBack}>Back</Button></div>;
  if (!ex) return <Spinner label="Loading execution…" />;

  const plName = ex.pipeline_name || pl?.name || pipelines.find(p => p._id === ex.pipeline_id)?.name || 'Pipeline';
  const selNode = (ex.nodes || []).find((n: any) => n.node_id === sel);
  const logRows: any[] = logs?.logs || [];

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        breadcrumb={<button onClick={onBack} className="inline-flex items-center gap-1 hover:text-slate-800"><ArrowLeft className="h-3.5 w-3.5" />Back</button>}
        title={<span className="flex items-center gap-2">{plName}<span className="font-mono text-[14px] font-normal text-slate-500">#{shortId(ex._id)}</span><StatusPill status={ex.status} />{active && <span className="inline-flex items-center gap-1 text-[12px] font-normal text-slate-500"><span className={cx('h-1.5 w-1.5 rounded-full', live ? 'bg-emerald-500' : 'animate-pulse bg-blue-500')} />{live ? 'Live' : 'Updating'}</span>}</span>}
        subtitle={`Started ${fmtDateTime(ex.started_at || ex.createdAt)} · ${ex.trigger_type || 'manual'}`}
        actions={<>
          {ex.status === 'failed' && <Button variant="primary" icon={<RotateCcw className="h-4 w-4" />} loading={busy === 'retry'} onClick={retry}>Retry from failed step</Button>}
          {active && <Button variant="danger" icon={<Square className="h-3.5 w-3.5" />} onClick={() => setConfirm('cancel')}>Cancel</Button>}
          <Button icon={<History className="h-4 w-4" />} loading={busy === 'replay'} onClick={doReplay}>Replay</Button>
          <Button icon={<ExternalLink className="h-4 w-4" />} onClick={() => onOpenPipeline(ex.pipeline_id)}>Pipeline</Button>
          <Menu trigger={open => <IconButton label="More" onClick={open}><MoreHorizontal className="h-4 w-4" /></IconButton>} items={[
            { label: 'Refresh', icon: <RefreshCw className="h-4 w-4" />, onClick: () => { load(); loadLogs(); } },
            { label: 'Delete execution', icon: <Trash2 className="h-4 w-4" />, danger: true, onClick: () => setConfirm('delete') },
          ]} />
        </>} />

      {waitingNode && ex.status === 'waiting_human_approval' && (
        <Callout tone="warning" className="mb-3" icon={<Clock className="h-4 w-4" />} title={`Approval needed at “${waitingNode.node_id}”`}
          actions={<>
            <Button size="sm" variant="success" icon={<CheckCircle2 className="h-4 w-4" />} loading={busy === 'approved'} disabled={decided} onClick={() => decide('approved')}>Approve</Button>
            <Button size="sm" variant="danger" icon={<XCircle className="h-4 w-4" />} loading={busy === 'rejected'} disabled={decided} onClick={() => decide('rejected')}>Reject</Button>
          </>}>
          {waitingNode.approval_request?.message || 'The pipeline is paused until someone approves or rejects this step.'}
        </Callout>
      )}
      {ex.status === 'failed' && (
        <Callout tone="danger" className="mb-3" icon={<AlertTriangle className="h-4 w-4" />} title={`Failed${ex.failed_node_id ? ` at “${ex.failed_node_id}”` : ''}`}>
          <div className="whitespace-pre-wrap">{ex.last_error || 'No error message was recorded.'}</div>
          <div className="mt-1 text-[12px] opacity-75">Fix the cause, then Retry — completed steps are kept and the failed step runs again.</div>
        </Callout>
      )}

      <div className="flex min-h-[540px] flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="min-w-0 flex-1 bg-[#f8f9fa]">{pl ? <PipelineCanvas pipeline={pl} exec={ex} selected={sel} onSelect={id => { setSel(id); if (id) setTab('steps'); }} /> : <Spinner label="Loading diagram…" />}</div>
        <aside className="flex w-[460px] shrink-0 flex-col border-l border-slate-200">
          <div className="px-3 pt-2"><Tabs active={tab} onChange={setTab} tabs={[
            { key: 'overview', label: 'Overview' }, { key: 'steps', label: 'Steps', count: logRows.length || undefined }, { key: 'events', label: 'Events' }, ...(replay ? [{ key: 'replay', label: 'Replay' }] : []),
          ]} /></div>
          <div className="flex-1 overflow-y-auto p-4">
            {tab === 'overview' && (
              <div className="space-y-4">
                <KeyValue items={[
                  ['Status', <StatusPill status={ex.status} />], ['Trigger', <span className="capitalize">{ex.trigger_type || 'manual'}</span>],
                  ['Started', fmtDateTime(ex.started_at || ex.createdAt)], ['Completed', fmtDateTime(ex.completed_at)],
                  ['Duration', fmtDuration(ex.total_latency_ms ?? durationBetween(ex.started_at, ex.completed_at))], ['Tokens', ex.total_tokens ?? 0],
                  ['Est. cost', ex.estimated_cost_usd != null ? `$${Number(ex.estimated_cost_usd).toFixed(4)}` : '—'], ['Retries', ex.retry_count ?? 0],
                  ['Execution ID', <span className="font-mono text-[12px]">{ex._id}</span>],
                ]} />
                <div><div className="mb-1 text-[12.5px] font-medium text-slate-700">Input</div><ValueView value={ex.input} /></div>
                <div><div className="mb-1 text-[12.5px] font-medium text-slate-700">Output</div><ValueView value={ex.output} emptyLabel={active ? 'Not finished yet' : 'No output'} /></div>
              </div>
            )}
            {tab === 'steps' && (
              <div className="space-y-2">
                {selNode && (
                  <div className="space-y-2 rounded-md border border-[var(--sx-primary)]/40 bg-[var(--sx-primary-soft)]/30 p-3">
                    <div className="flex items-center justify-between"><span className="text-[13px] font-semibold text-slate-800">{selNode.node_id}</span><StatusPill status={selNode.status} /></div>
                    <div className="flex flex-wrap gap-x-3 text-[12px] text-slate-500">
                      {selNode.model_used && <span>Model: {selNode.model_used}</span>}{selNode.latency_ms != null && <span>{fmtDuration(selNode.latency_ms)}</span>}
                      {selNode.llm_usage?.total_tokens != null && <span>{selNode.llm_usage.total_tokens} tokens</span>}{selNode.decision_result && <span>Decision: {String(typeof selNode.decision_result === 'object' ? JSON.stringify(selNode.decision_result) : selNode.decision_result)}</span>}
                    </div>
                    {selNode.last_error && <Callout tone="danger">{selNode.last_error}</Callout>}
                    <div className="text-[12px] font-medium text-slate-600">Input</div><ValueView value={selNode.input} maxHeight={180} emptyLabel="No input" />
                    <div className="text-[12px] font-medium text-slate-600">Output</div><ValueView value={selNode.output} maxHeight={220} emptyLabel="No output" />
                  </div>
                )}
                {logRows.length === 0 ? <div className="py-6 text-center text-[13px] text-slate-400">No steps have run yet.</div> : (
                  <div className="divide-y divide-slate-100 rounded-md border border-slate-200">
                    {logRows.map((l: any) => (
                      <button key={`${l.step}-${l.node_id}`} onClick={() => setSel(l.node_id)} className={cx('block w-full px-3 py-2 text-left hover:bg-slate-50', sel === l.node_id && 'bg-slate-50')}>
                        <div className="flex items-center gap-2">
                          <span className="w-5 text-right text-[12px] tabular-nums text-slate-400">{l.step}</span>
                          <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-slate-800">{l.node_id}</span>
                          {l.decision && <Tag tone="purple">→ {l.decision}</Tag>}
                          <span className="text-[12px] tabular-nums text-slate-500">{fmtDuration(l.latency_ms)}</span>
                          <StatusPill status={l.status} />
                        </div>
                        {(l.error || l.output_preview) && <div className={cx('ml-7 mt-0.5 truncate text-[12px]', l.error ? 'text-red-700' : 'text-slate-500')}>{l.error || l.output_preview}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {tab === 'events' && (events === null ? <Spinner label="Loading events…" /> : events.length === 0 ? <div className="py-6 text-center text-[13px] text-slate-400">No events.</div> : (
              <ol className="relative space-y-3 border-l border-slate-200 pl-4">
                {events.map(ev => (
                  <li key={ev._id || ev.sequence} className="relative">
                    <span className="absolute -left-[21px] top-1 flex h-2.5 w-2.5 rounded-full border-2 border-white bg-slate-400" />
                    <div className="flex flex-wrap items-center gap-1.5 text-[12.5px]"><span className="font-mono text-slate-400">#{ev.sequence}</span><span className="font-medium text-slate-800">{ev.event_type}</span>{ev.node_id && <Tag>{ev.node_id}</Tag>}<span className="text-slate-400">{new Date(ev.timestamp).toLocaleTimeString()}</span></div>
                    {ev.payload && Object.keys(ev.payload).length > 0 && <details className="mt-1"><summary className="cursor-pointer text-[12px] text-slate-500">Payload</summary><ValueView value={ev.payload} maxHeight={180} className="mt-1" /></details>}
                  </li>
                ))}
              </ol>
            ))}
            {tab === 'replay' && replay && (
              <div className="space-y-2">
                <Callout tone="info">State rebuilt from the immutable event log — use it to audit what each step saw and produced.</Callout>
                {(replay.nodes || []).map((n: any) => (
                  <details key={n.node_id} className="rounded-md border border-slate-200">
                    <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-[13px]"><span className="font-medium">{n.node_id}</span><StatusPill status={n.status} /></summary>
                    <div className="space-y-1.5 px-3 pb-3"><div className="text-[12px] text-slate-600">Input</div><ValueView value={n.input} maxHeight={160} /><div className="text-[12px] text-slate-600">Output</div><ValueView value={n.output} maxHeight={200} /></div>
                  </details>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
      <ConfirmDialog open={confirm === 'cancel'} title="Cancel execution?" confirmLabel="Cancel execution" message="The execution stops now. This cannot be undone." onCancel={() => setConfirm(null)}
        onConfirm={async () => { try { await apiService.workflows.cancelExecution(id); toast.success('Execution cancelled'); } catch (e: any) { toast.error(e?.status === 409 ? 'Already finished — nothing to cancel.' : errMessage(e, 'Cancel failed')); } setConfirm(null); load(); onChanged(); }} />
      <ConfirmDialog open={confirm === 'delete'} title="Delete execution?" confirmLabel="Delete" message="The execution and its events, snapshots and checkpoints are permanently deleted." onCancel={() => setConfirm(null)}
        onConfirm={async () => { try { await apiService.workflows.deleteExecution(id); toast.success('Execution deleted'); setConfirm(null); onBack(); } catch (e: any) { toast.error(errMessage(e, 'Delete failed')); setConfirm(null); } }} />
    </div>
  );
};

/* ═════════════════════════ Approval inbox ═════════════════════════ */

const ApprovalInbox: React.FC<{ onOpenExecution: (id: string) => void; onChanged: () => void }> = ({ onOpenExecution, onChanged }) => {
  const [status, setStatus] = useState('pending');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { const r = await apiService.approvals.list(status); setItems(r?.data || []); setDone({}); }
    catch (e: any) { setError(errMessage(e, 'Failed to load approvals')); }
    finally { setLoading(false); }
  }, [status]);
  useEffect(() => { load(); }, [load]);
  const decide = async (a: any, decision: 'approved' | 'rejected') => {
    setBusy(a._id); setDone(d => ({ ...d, [a._id]: decision }));
    try { await apiService.workflows.approveNode(a.execution_id, a.node_id, decision); toast.success(decision === 'approved' ? 'Approved — the pipeline continues' : 'Rejected'); onChanged(); }
    catch (e: any) {
      if (e?.status === 409) toast.error('Already answered by another approver.');
      else { toast.error(errMessage(e, 'Failed to record the decision')); setDone(d => { const n = { ...d }; delete n[a._id]; return n; }); }
    } finally { setBusy(null); }
  };
  return (
    <div>
      <PageHeader title="Approval inbox" subtitle="Pipeline steps paused for a human decision. Approving resumes the pipeline immediately."
        actions={<IconButton label="Refresh" onClick={load}><RefreshCw className="h-4 w-4" /></IconButton>} />
      <Tabs active={status} onChange={setStatus} className="mb-4" tabs={[{ key: 'pending', label: 'Pending' }, { key: 'approved', label: 'Approved' }, { key: 'rejected', label: 'Rejected' }, { key: 'cancelled', label: 'Cancelled' }, { key: 'all', label: 'All' }]} />
      {error && <ErrorBanner message={error} onRetry={load} className="mb-3" />}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {loading ? <Spinner label="Loading approvals…" /> : items.length === 0 ? (
          <EmptyState icon={<Inbox className="h-5 w-5" />} title={status === 'pending' ? 'Nothing waiting for approval' : 'No approvals'} description={status === 'pending' ? 'When a pipeline reaches a human approval step it appears here.' : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse">
              <thead><tr><Th>Pipeline</Th><Th>Step</Th><Th>Message</Th><Th>Requested</Th><Th>Status</Th><Th className="w-[220px]" /></tr></thead>
              <tbody>
                {items.map(a => {
                  const decided = done[a._id];
                  const pending = a.status === 'pending' && !decided;
                  return (
                    <tr key={a._id} className="hover:bg-slate-50">
                      <Td className="font-medium text-slate-900">{a.pipeline_id?.name || '—'}</Td>
                      <Td className="font-mono text-[12.5px]">{a.node_id}</Td>
                      <Td className="max-w-[320px]"><div className="line-clamp-2 text-[13px]">{a.message || '—'}</div></Td>
                      <Td title={fmtDateTime(a.requested_at)}>{timeAgo(a.requested_at)}</Td>
                      <Td><StatusPill status={decided || a.status} />{a.decided_at && <div className="text-[11.5px] text-slate-500">{timeAgo(a.decided_at)}</div>}</Td>
                      <Td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {pending && <>
                            <Button size="sm" variant="success" loading={busy === a._id && done[a._id] === 'approved'} disabled={busy === a._id} onClick={() => decide(a, 'approved')}>Approve</Button>
                            <Button size="sm" variant="danger" loading={busy === a._id && done[a._id] === 'rejected'} disabled={busy === a._id} onClick={() => decide(a, 'rejected')}>Reject</Button>
                          </>}
                          <Button size="sm" variant="ghost" onClick={() => onOpenExecution(a.execution_id)}>View</Button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═════════════════════════ Triggers ═════════════════════════ */

const triggerApi = {
  list: (id?: string) => apiService.workflows.triggers.list(id),
  create: (id: string, data: any) => apiService.workflows.triggers.create(id, data),
  update: (id: string, data: any) => apiService.workflows.triggers.update(id, data),
  remove: (id: string) => apiService.workflows.triggers.delete(id),
  run: (id: string, input?: any) => apiService.workflows.triggers.run(id, input),
  rotateToken: (id: string) => apiService.workflows.triggers.rotateToken(id),
};

const PipelineTriggers: React.FC<{ pipelineId: string; pipelines: any[]; onOpenExecution: (id: string) => void }> = ({ pipelineId, pipelines, onOpenExecution }) => (
  <TriggerManager api={triggerApi} targets={pipelines.map(p => ({ id: p._id, name: p.name }))} targetKey="pipeline_id" targetNoun="pipeline" fixedTargetId={pipelineId} onOpenInstance={onOpenExecution} compact />
);

const AllTriggers: React.FC<{ pipelines: any[]; onOpenExecution: (id: string) => void }> = ({ pipelines, onOpenExecution }) => (
  <div>
    <PageHeader title="Triggers" subtitle="Start pipeline executions automatically. A due trigger fires exactly once, even with several servers." />
    <TriggerManager api={triggerApi} targets={pipelines.map(p => ({ id: p._id, name: p.name }))} targetKey="pipeline_id" targetNoun="pipeline" onOpenInstance={onOpenExecution} />
  </div>
);

/* ═════════════════════════ Create pipeline (W-01) ═════════════════════════ */

const BLUEPRINTS = [
  { title: 'Standard AP invoice reconciliation', description: 'Extract invoice data, check stated vs calculated tax and totals against the PO, and route exceptions for review.', industry: 'Finance', complexity: 'medium' },
  { title: 'Employee onboarding with manager sign-off', description: 'Collect joiner details, verify KYC documents and pause until the manager approves before provisioning accounts.', industry: 'HR', complexity: 'low' },
  { title: 'Compliance PDF audit', description: 'Read policy and contract PDFs, compare clauses to compliance guidelines and summarise deviations with severity.', industry: 'Compliance', complexity: 'high' },
];

const CreatePipeline: React.FC<{ prefill?: ModuleProps['createPrefill']; onPrefillConsumed?: () => void; onCreated: (id: string) => void }> = ({ prefill, onPrefillConsumed, onCreated }) => {
  const blank = { title: '', description: '', objective: '', steps: '', expected_output: '', industry: '', complexity: 'medium', integrations: '', business_benefit: '', provider: '', model: '' };
  const [f, setF] = useState(blank);
  const [advanced, setAdvanced] = useState(false);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [cases, setCases] = useState<any[] | null>(null);
  const [caseTab, setCaseTab] = useState('shortlisted');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (prefill && (prefill.title || prefill.description)) {
      setF(x => ({ ...x, title: prefill.title || x.title, description: prefill.description || x.description, industry: prefill.industry || x.industry, complexity: normComplexity(prefill.complexity) || x.complexity }));
      onPrefillConsumed?.();
      toast.success('Use case loaded into the form');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  useEffect(() => {
    Promise.all([
      apiService.useCases.listShortlistedDomain().catch(() => ({ data: [] })),
      apiService.useCases.listShortlistedCompany().catch(() => ({ data: [] })),
    ]).then(([d, c]: any[]) => setCases([...(d?.data || []).map((u: any) => ({ ...u, source: 'domain' })), ...(c?.data || []).map((u: any) => ({ ...u, source: 'company' }))]));
  }, []);

  useEffect(() => {
    if (!busy) return;
    setElapsed(0);
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [busy]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const load = (u: any) => {
    setF(x => ({
      ...x, title: u.title || '', description: u.description || '', industry: u.industry || u.domain || x.industry,
      complexity: normComplexity(u.complexity) || x.complexity,
      steps: Array.isArray(u.functional_steps) ? u.functional_steps.join('\n') : x.steps,
      objective: u.objective || x.objective, business_benefit: u.business_benefit || x.business_benefit,
    }));
    setErr(null);
    toast.success('Loaded into the form');
  };

  const submit = async () => {
    if (!f.title.trim() || !f.description.trim()) { setErr('Title and description are required.'); return; }
    const usecase: any = { title: f.title.trim(), description: f.description.trim(), complexity: f.complexity };
    const steps = f.steps.split(/\n|,/).map(s => s.trim()).filter(Boolean);
    if (steps.length) usecase.steps = steps;
    if (f.objective.trim()) usecase.objective = f.objective.trim();
    if (f.expected_output.trim()) usecase.expected_output = f.expected_output.trim();
    if (f.industry.trim()) usecase.industry = f.industry.trim();
    const integrations = f.integrations.split(',').map(s => s.trim()).filter(Boolean);
    if (integrations.length) usecase.integrations = integrations;
    if (f.business_benefit.trim()) usecase.business_benefit = f.business_benefit.trim();
    const options = advanced && (f.provider.trim() || f.model.trim()) ? { ...(f.provider.trim() ? { provider: f.provider.trim() } : {}), ...(f.model.trim() ? { model: f.model.trim() } : {}) } : undefined;

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const timeout = setTimeout(() => ctrl.abort(), 5 * 60 * 1000); // contract: client timeout ≥ 5 min
    setBusy(true); setErr(null);
    try {
      const r = await apiService.workflows.createPipeline(usecase, options, ctrl.signal);
      const id = r?.data?.pipeline?._id || r?.data?._id;
      toast.success('Pipeline created');
      setF(blank);
      if (id) onCreated(id);
    } catch (e: any) {
      if (e?.name === 'AbortError') setErr('Stopped waiting. The server may still finish creating the pipeline — check the Pipelines list in a minute.');
      else setErr(errMessage(e, 'The AI could not design the pipeline.'));
    } finally { clearTimeout(timeout); setBusy(false); abortRef.current = null; }
  };

  const stage = elapsed < 10 ? 'Understanding the use case' : elapsed < 30 ? 'Designing agents and their roles' : elapsed < 60 ? 'Wiring the routing and approvals' : 'Finalising — larger use cases can take up to ~3 minutes';

  return (
    <div>
      <PageHeader title="Create pipeline" subtitle="Describe the use case — the AI designs the agents, routing and approvals as a LangGraph pipeline." />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 xl:col-span-3">
          {err && <ErrorBanner message={err} onRetry={busy ? undefined : submit} />}
          <Field label="Title" required><Input value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="e.g. Automated invoice data extraction and validation" /></Field>
          <Field label="Description" required hint="What comes in, what should happen, and what the result is."><TextArea rows={4} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></Field>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Industry"><Input value={f.industry} onChange={e => setF({ ...f, industry: e.target.value })} placeholder="Finance" list="orc-industries" /><datalist id="orc-industries">{['Finance', 'Procurement', 'Supply Chain', 'Manufacturing', 'Retail', 'HR', 'IT', 'Healthcare', 'Insurance', 'Legal', 'Compliance'].map(i => <option key={i} value={i} />)}</datalist></Field>
            <Field label="Complexity"><Select value={f.complexity} onChange={e => setF({ ...f, complexity: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="enterprise">Enterprise</option></Select></Field>
          </div>
          <Field label="Objective"><Input value={f.objective} onChange={e => setF({ ...f, objective: e.target.value })} placeholder="Primary goal" /></Field>
          <Field label="Steps" hint="One per line (optional)."><TextArea rows={3} value={f.steps} onChange={e => setF({ ...f, steps: e.target.value })} placeholder={'Read invoice\nMatch with PO\nRoute exceptions'} /></Field>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Expected output"><Input value={f.expected_output} onChange={e => setF({ ...f, expected_output: e.target.value })} placeholder="Validated invoice JSON + decision" /></Field>
            <Field label="Integrations" hint="Comma separated"><Input value={f.integrations} onChange={e => setF({ ...f, integrations: e.target.value })} placeholder="SAP, Outlook" /></Field>
          </div>
          <Field label="Business benefit"><Input value={f.business_benefit} onChange={e => setF({ ...f, business_benefit: e.target.value })} placeholder="e.g. 70% faster invoice processing" /></Field>
          <div className="rounded-md border border-slate-200">
            <button type="button" onClick={() => setAdvanced(a => !a)} className="flex w-full items-center justify-between px-3 py-2 text-[13px] font-medium text-slate-700">AI model (optional)<span className="text-slate-400">{advanced ? '−' : '+'}</span></button>
            {advanced && (
              <div className="grid grid-cols-1 gap-3 border-t border-slate-200 p-3 md:grid-cols-2">
                <Field label="Provider" hint="Leave empty for the server default"><Input value={f.provider} onChange={e => setF({ ...f, provider: e.target.value })} placeholder="openrouter" list="orc-providers" /><datalist id="orc-providers">{['openrouter', 'azure-openai', 'openai', 'anthropic', 'google'].map(i => <option key={i} value={i} />)}</datalist></Field>
                <Field label="Model"><Input value={f.model} onChange={e => setF({ ...f, model: e.target.value })} placeholder="google/gemini-2.5-flash" className="font-mono text-[12.5px]" /></Field>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <span className="text-[12.5px] text-slate-500">Usually takes 40–60 seconds.</span>
            <Button variant="primary" icon={<Sparkles className="h-4 w-4" />} loading={busy} onClick={submit}>Create pipeline</Button>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 xl:col-span-2">
          <Tabs active={caseTab} onChange={setCaseTab} className="mb-3" tabs={[{ key: 'shortlisted', label: 'Shortlisted use cases', count: cases?.length }, { key: 'blueprints', label: 'Blueprints' }]} />
          <div className="max-h-[640px] space-y-2 overflow-y-auto pr-1">
            {caseTab === 'shortlisted' && (cases === null ? <Spinner label="Loading use cases…" /> : cases.length === 0 ? (
              <EmptyState icon={<FileText className="h-5 w-5" />} title="No shortlisted use cases" description="Shortlist use cases in Evaluations / Process Intelligence and they appear here." compact />
            ) : cases.map((u, i) => (
              <div key={u._id || i} className="rounded-md border border-slate-200 p-3 hover:border-slate-300">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="mb-0.5 flex flex-wrap gap-1"><Tag tone={u.source === 'domain' ? 'blue' : 'purple'}>{u.source === 'domain' ? 'Domain' : 'Company'}</Tag>{u.complexity && <Tag>{u.complexity}</Tag>}</div>
                    <div className="text-[13.5px] font-medium text-slate-900">{u.title}</div>
                    <div className="line-clamp-2 text-[12.5px] text-slate-500">{u.description}</div>
                  </div>
                  <Button size="sm" onClick={() => load(u)}>Use</Button>
                </div>
              </div>
            )))}
            {caseTab === 'blueprints' && BLUEPRINTS.map(b => (
              <div key={b.title} className="rounded-md border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><div className="mb-0.5 flex gap-1"><Tag>{b.industry}</Tag><Tag>{b.complexity}</Tag></div><div className="text-[13.5px] font-medium text-slate-900">{b.title}</div><div className="text-[12.5px] text-slate-500">{b.description}</div></div>
                  <Button size="sm" onClick={() => load(b)}>Use</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={busy} onClose={() => {}} dismissable={false} title="Designing your pipeline" width={480}
        footer={<Button onClick={() => abortRef.current?.abort()}>Stop waiting</Button>}>
        <div className="space-y-4 py-2 text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-[var(--sx-primary)]" />
          <div className="text-[14px] font-medium text-slate-800">{stage}…</div>
          <div className="mx-auto h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[var(--sx-primary)] transition-all" style={{ width: `${Math.min(95, (elapsed / 75) * 100)}%` }} /></div>
          <div className="text-[12.5px] text-slate-500">{elapsed}s elapsed · typically 40–60 s, up to ~3 min. You can keep this tab open.</div>
        </div>
      </Modal>
    </div>
  );
};

const normComplexity = (c?: string) => {
  if (!c) return '';
  const v = String(c).toLowerCase();
  if (v.startsWith('mod') || v === 'medium') return 'medium';
  if (['low', 'high', 'enterprise'].includes(v)) return v;
  return '';
};

export default OrchestrationModule;
