// Building blocks for showing a Playground run (process instance): status overlay canvas, user-task
// responses (P-15), incident retry (P-16), cancel (P-17) and the per-step execution trail.
import React, { useMemo, useState } from 'react';
import ReactFlow, { Background, Controls, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import toast from '../../components/studio/notify';
import { AlertTriangle, ChevronRight, RotateCcw, Square, UserCheck, Timer, Workflow } from 'lucide-react';
import { apiService } from '../../services/api';
import { studioNodeTypes, activityOf } from '../../components/studio/bpmn';
import {
  Button, Callout, ConfirmDialog, Field, JsonBlock, KeyValue, Modal, StatusPill, Tag, TextArea, cx, errMessage,
  fmtDateTime, fmtDuration, timeAgo, unwrapValue, durationBetween,
} from '../../components/studio/ui';
import { ACTIVE_RUN, decorateEdges, flowToCanvas, takenEdgesFromRun } from './studioModel';
import { ValueView, resolveRunTemplate } from '../../components/studio/valueView';

export const runGraph = (run: any) => run?.definition?.graph || run?.graph || run?.flow?.graph || null;

export const overlayRun = (nodes: any[], run: any) => {
  const byId = new Map((run?.nodes || []).map((n: any) => [n.node_id, n]));
  return nodes.map(n => ({ ...n, data: { ...n.data, status: (byId.get(n.id) as any)?.status } }));
};

// Read-only diagram of exactly what the instance ran (run.definition), with live step status.
// Older instances (started before the backend pinned the definition on each run) have no
// run.definition. Fall back to the process's current definition, and if the process is gone,
// rebuild a simple left-to-right diagram from the instance's own step list.
const useInstanceGraph = (run: any): { graph: any | null; source: 'pinned' | 'current' | 'reconstructed' | 'none'; loading: boolean } => {
  const pinned = runGraph(run);
  const [current, setCurrent] = useState<{ flowId: string; graph: any | null } | null>(null);
  const flowId = run?.flow_id ? String(run.flow_id) : '';
  React.useEffect(() => {
    if (pinned || !flowId || current?.flowId === flowId) return;
    let live = true;
    apiService.playground.flows.get(flowId)
      .then(r => { if (live) setCurrent({ flowId, graph: r?.data?.graph || null }); })
      .catch(() => { if (live) setCurrent({ flowId, graph: null }); });
    return () => { live = false; };
  }, [pinned, flowId, current?.flowId]);
  if (pinned) return { graph: pinned, source: 'pinned', loading: false };
  if (flowId && current?.flowId !== flowId) return { graph: null, source: 'none', loading: true };
  if (current?.graph?.nodes?.length) return { graph: current.graph, source: 'current', loading: false };
  const steps: any[] = run?.nodes || [];
  if (!steps.length) return { graph: null, source: 'none', loading: false };
  return {
    graph: {
      nodes: steps.map((n: any) => ({ node_id: n.node_id, type: n.type || 'transform', label: n.label || n.node_id, x: 0, y: 0 })),
      edges: steps.slice(1).map((n: any, i: number) => ({ edge_id: `r${i}`, from: steps[i].node_id, to: n.node_id })),
    },
    source: 'reconstructed', loading: false,
  };
};

export const InstanceCanvas: React.FC<{ run: any; lookups: any; onSelectNode?: (id: string | null) => void; selectedNode?: string | null; height?: number | string }> = ({ run, lookups, onSelectNode, selectedNode, height = '100%' }) => {
  const { graph, source, loading } = useInstanceGraph(run);
  const { nodes, edges } = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] };
    const base = flowToCanvas(graph, lookups, true);
    const ns = overlayRun(base.nodes, run).map(n => ({ ...n, selected: n.id === selectedNode }));
    return { nodes: ns, edges: decorateEdges(ns, base.edges, { taken: takenEdgesFromRun(run, base.edges) }) };
  }, [graph, run, lookups, selectedNode]);
  if (loading) return <div className="flex h-full items-center justify-center text-[13px] text-slate-400">Loading diagram…</div>;
  if (!graph) return <div className="flex h-full items-center justify-center text-[13px] text-slate-400">No diagram is available for this instance — see the Execution trail.</div>;
  return (
    <div style={{ height }} className="relative bg-[#f8f9fa]">
      {source !== 'pinned' && (
        <div className="absolute left-3 top-3 z-10 max-w-[520px] rounded-md border border-amber-200 bg-amber-50/95 px-3 py-1.5 text-[12.5px] text-amber-900 shadow-sm">
          {source === 'current'
            ? 'This older instance did not store the version it ran — showing the process as it is now. Step statuses come from the instance.'
            : 'The process no longer exists — diagram rebuilt from the steps this instance ran.'}
        </div>
      )}
      <ReactFlowProvider>
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={studioNodeTypes} fitView fitViewOptions={{ padding: 0.25, maxZoom: 1.1 }}
          nodesDraggable={false} nodesConnectable={false} elementsSelectable={!!onSelectNode} proOptions={{ hideAttribution: true }}
          onNodeClick={(_, n) => onSelectNode?.(n.id)} onPaneClick={() => onSelectNode?.(null)} minZoom={0.2}>
          <Background color="#d5dce0" gap={18} size={1.2} />
          <Controls showInteractive={false} position="bottom-right" />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};

// The step a run is paused on, with its User Task config (outcomes, title, message).
export const waitingTask = (run: any) => {
  if (run?.status !== 'waiting_approval') return null;
  const nodeId = run.paused_at_node || (run.nodes || []).find((n: any) => n.status === 'waiting_approval')?.node_id;
  const def = (runGraph(run)?.nodes || []).find((n: any) => n.node_id === nodeId);
  // P-14: the server stores the resolved title / message on the paused run node (absent on older runs).
  const approval = (run.nodes || []).find((n: any) => n.node_id === nodeId)?.approval || null;
  return { nodeId, def, config: def?.config || {}, approval };
};

export const HumanTaskCard: React.FC<{ run: any; onDone: () => void; compact?: boolean }> = ({ run, onDone, compact }) => {
  const [busy, setBusy] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const task = waitingTask(run);
  if (!task) return null;
  const outcomes: string[] = (task.config.outcomes?.length ? task.config.outcomes : task.approval?.outcomes || [])
    .map((o: any) => (typeof o === 'string' ? o : o?.label)).filter(Boolean);
  const title = task.approval?.title || resolveRunTemplate(task.config.title || task.def?.label || 'User task', run);
  const message = task.approval?.message || (task.config.approval_message ? resolveRunTemplate(task.config.approval_message, run) : '');
  const dueAt = run.sla_due_at || task.approval?.due_at;
  const respond = async (value: string, kind: 'outcome' | 'decision') => {
    setBusy(value);
    try {
      if (kind === 'outcome') await apiService.playground.runs.respondOutcome(run._id, value);
      else await apiService.playground.runs.approve(run._id, value as any);
      setAnswered(true);
      toast.success(`Recorded: ${value}`);
      onDone();
    } catch (e: any) {
      if (e?.status === 409) { setAnswered(true); toast.error('Already answered by someone else.'); onDone(); }
      else toast.error(errMessage(e, 'Failed to record the response'));
    } finally { setBusy(null); }
  };
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
      <div className="flex items-start gap-2">
        <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold text-amber-900">{title} needs a decision</div>
          {message && <div className="mt-0.5 whitespace-pre-wrap text-[13px] text-amber-900/90">{message}</div>}
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-amber-800">
            {task.config.assignees && <span>Assignees: {task.config.assignees}</span>}
            {dueAt && <span>SLA due {timeAgo(dueAt)} ({fmtDateTime(dueAt)})</span>}
            {run.sla_breached_at && <span className="font-semibold text-red-700">SLA breached {timeAgo(run.sla_breached_at)}</span>}
          </div>
        </div>
      </div>
      <div className={cx('mt-3 flex flex-wrap gap-2', compact && 'mt-2')}>
        {outcomes.length > 0
          ? outcomes.map(o => <Button key={o} size="sm" variant="primary" loading={busy === o} disabled={answered || (!!busy && busy !== o)} onClick={() => respond(o, 'outcome')}>{o}</Button>)
          : (<>
            <Button size="sm" variant="success" loading={busy === 'approved'} disabled={answered || !!busy} onClick={() => respond('approved', 'decision')}>Approve</Button>
            <Button size="sm" variant="danger" loading={busy === 'rejected'} disabled={answered || !!busy} onClick={() => respond('rejected', 'decision')}>Reject</Button>
          </>)}
      </div>
    </div>
  );
};

export const RetryDialog: React.FC<{ run: any; open: boolean; onClose: () => void; onDone: (r: any) => void }> = ({ run, open, onClose, onDone }) => {
  const [text, setText] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  React.useEffect(() => { if (open) { setText(''); setErr(null); } }, [open]);
  const submit = async () => {
    let vars: any;
    if (text.trim()) { try { vars = JSON.parse(text); } catch (e: any) { setErr(`Not valid JSON: ${e.message}`); return; } }
    setBusy(true);
    try {
      const res = await apiService.playground.runs.retry(run._id, vars);
      toast.success(res?.message || 'Retrying from the failed step');
      onDone(res?.data); onClose();
    } catch (e: any) { setErr(errMessage(e, 'Retry failed')); }
    finally { setBusy(false); }
  };
  const inc = run?.incident;
  return (
    <Modal open={open} onClose={onClose} title="Retry instance" subtitle="Completed steps are kept; the failed step runs again." width={600}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" icon={<RotateCcw className="h-4 w-4" />} loading={busy} onClick={submit}>Retry from failed step</Button></>}>
      <div className="space-y-3">
        {inc && <Callout tone="danger" title={`Failed at “${inc.node_id}”`}>{inc.error}</Callout>}
        <Field label="Fix variables before retrying (optional JSON)" hint="Merged into the instance variables first — e.g. correct a URL or an ID that caused the failure." error={err}>
          <TextArea rows={6} className="font-mono text-[12.5px]" value={text} onChange={e => setText(e.target.value)} placeholder={JSON.stringify(run?.context?.vars && Object.keys(run.context.vars).length ? run.context.vars : { url: 'https://erp.example.com/api' }, null, 2)} />
        </Field>
      </div>
    </Modal>
  );
};

export const RunActions: React.FC<{ run: any; onChange: (r?: any) => void; size?: 'sm' | 'md' }> = ({ run, onChange, size = 'sm' }) => {
  const [retryOpen, setRetryOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  if (!run) return null;
  const active = ACTIVE_RUN.includes(run.status);
  return (
    <>
      {run.status === 'failed' && <Button size={size} variant="primary" icon={<RotateCcw className="h-4 w-4" />} onClick={() => setRetryOpen(true)}>Retry</Button>}
      {active && <Button size={size} variant="danger" icon={<Square className="h-3.5 w-3.5" />} onClick={() => setConfirmCancel(true)}>Cancel</Button>}
      <RetryDialog run={run} open={retryOpen} onClose={() => setRetryOpen(false)} onDone={() => onChange()} />
      <ConfirmDialog open={confirmCancel} title="Cancel this instance?" confirmLabel="Cancel instance"
        message="The instance stops now. A running child sub-flow is cancelled too. This cannot be undone."
        onCancel={() => setConfirmCancel(false)}
        onConfirm={async () => {
          try { await apiService.playground.runs.cancel(run._id); toast.success('Instance cancelled'); onChange(); }
          catch (e: any) { toast.error(e?.status === 409 ? 'It already finished — nothing to cancel.' : errMessage(e, 'Cancel failed')); onChange(); }
          setConfirmCancel(false);
        }} />
    </>
  );
};

export const WaitInfo: React.FC<{ run: any; onOpenRun?: (id: string) => void }> = ({ run, onOpenRun }) => {
  const w = run?.wait;
  if (!w || run.status !== 'running') return null;
  if (w.kind === 'timer') return <Callout tone="info" icon={<Timer className="h-4 w-4" />} title="Waiting on a timer">Step “{w.node_id}” resumes {w.until ? `${timeAgo(w.until)} (${fmtDateTime(w.until)})` : 'soon'}.</Callout>;
  if (w.kind === 'subflow') return (
    <Callout tone="info" icon={<Workflow className="h-4 w-4" />} title="Waiting on a sub-flow"
      actions={w.child_run_id && onOpenRun && <Button size="sm" onClick={() => onOpenRun(w.child_run_id)}>Open child instance</Button>}>
      Step “{w.node_id}” started a child process and continues when it finishes.
    </Callout>
  );
  return <Callout tone="info" title={`Waiting (${w.kind})`}>Step “{w.node_id}”.</Callout>;
};

export const InstanceOverview: React.FC<{ run: any; onChanged: () => void; onOpenRun?: (id: string) => void; onOpenProcess?: (id: string) => void }> = ({ run, onChanged, onOpenRun, onOpenProcess }) => {
  if (!run) return null;
  const parentId = run.parent?.run_id || run.parent?.parent_run_id || (typeof run.parent === 'string' ? run.parent : null);
  return (
    <div className="space-y-3">
      {run.status === 'failed' && run.incident && (
        <Callout tone="danger" icon={<AlertTriangle className="h-4 w-4" />} title={`Incident at “${run.incident.node_id}”`}>
          <div className="whitespace-pre-wrap">{run.incident.error}</div>
          <div className="mt-1 text-[12px] opacity-75">{fmtDateTime(run.incident.at)} · Fix the cause, then Retry — completed steps are kept.</div>
        </Callout>
      )}
      <HumanTaskCard run={run} onDone={onChanged} />
      <WaitInfo run={run} onOpenRun={onOpenRun} />
      <KeyValue items={[
        ['Status', <StatusPill status={run.status} />],
        ['Process', onOpenProcess && run.flow_id ? <button className="text-[var(--sx-primary)] hover:underline" onClick={() => onOpenProcess(run.flow_id)}>{run.flow_name || 'Open process'}</button> : run.flow_name],
        ['Instance ID', <span className="font-mono text-[12px]">{run._id}</span>],
        ['Triggered by', <span className="capitalize">{run.trigger || 'manual'}</span>],
        ['Started', fmtDateTime(run.createdAt)],
        ['Duration', fmtDuration(durationBetween(run.createdAt, ACTIVE_RUN.includes(run.status) ? null : run.updatedAt))],
        ['Retries', run.retry_count ?? 0],
        ...(run.sla_due_at ? [['SLA due', fmtDateTime(run.sla_due_at)] as [string, string]] : []),
        ...(parentId ? [['Parent instance', onOpenRun ? <button className="text-[var(--sx-primary)] hover:underline font-mono text-[12px]" onClick={() => onOpenRun(parentId)}>{parentId}</button> : parentId] as [string, any]] : []),
      ]} />
      {run.output != null && run.status === 'completed' && (
        <div><div className="mb-1 text-[12.5px] font-medium text-slate-700">Output (out-arguments)</div><ValueView value={run.output} title="Instance output" /></div>
      )}
    </div>
  );
};

// Name / value table — scalars inline, objects and long text as an expandable block.
const ValueTable: React.FC<{ title: string; data: any; empty: string; prefix: string }> = ({ title, data, empty, prefix }) => {
  const obj = unwrapValue(data);
  const entries = obj && typeof obj === 'object' && !Array.isArray(obj) ? Object.entries(obj) : [];
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[12.5px] font-semibold uppercase tracking-wide text-slate-500">{title}</span>
        <span className="text-[12px] text-slate-400">{entries.length} item{entries.length === 1 ? '' : 's'}</span>
      </div>
      {entries.length === 0 ? <div className="rounded-md border border-dashed border-slate-200 px-3 py-2 text-[12.5px] text-slate-400">{empty}</div> : (
        <div className="divide-y divide-slate-100 rounded-md border border-slate-200 bg-white">
          {entries.map(([k, v]) => {
            const val = unwrapValue(v);
            const isObj = val !== null && typeof val === 'object';
            const text = isObj ? JSON.stringify(val, null, 2) : val === '' ? '' : String(val);
            const long = isObj || text.length > 90;
            const type = val === null || val === undefined ? 'empty' : Array.isArray(val) ? `list · ${val.length}` : typeof val === 'object' ? 'object' : typeof val;
            return (
              <div key={k} className="px-3 py-2">
                <div className="flex items-baseline gap-2">
                  <code className="font-mono text-[13px] font-semibold text-slate-900">{prefix}{k}</code>
                  <span className="text-[11.5px] text-slate-400">{type}</span>
                  {!long && <span className="ml-auto max-w-[60%] break-words text-right text-[13px] text-slate-700">{text === '' ? <span className="text-slate-400">(empty)</span> : text}</span>}
                </div>
                {long && <ValueView value={isObj ? val : text} title={`${prefix}${k}`} maxHeight={260} className="mt-1.5" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const VariablesPanel: React.FC<{ run: any }> = ({ run }) => (
  <div className="space-y-4">
    <ValueTable title="Arguments" prefix="args." data={run?.context?.args || run?.input} empty="No arguments" />
    <ValueTable title="Variables" prefix="vars." data={run?.context?.vars} empty="No variables set yet" />
  </div>
);

export const StepTrail: React.FC<{ run: any; focusNode?: string | null; onFocus?: (id: string) => void }> = ({ run, focusNode, onFocus }) => {
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(focusNode ? [focusNode] : []));
  React.useEffect(() => { if (focusNode) setOpenIds(prev => (prev.has(focusNode) ? prev : new Set(prev).add(focusNode))); }, [focusNode]);
  const toggle = (id: string) => {
    const opening = !openIds.has(id);
    setOpenIds(prev => { const n = new Set(prev); if (opening) n.add(id); else n.delete(id); return n; });
    if (opening) onFocus?.(id);
  };
  const steps: any[] = (run?.nodes || []).filter((n: any) => n.status && n.status !== 'pending');
  if (!steps.length) return <div className="py-6 text-center text-[13px] text-slate-400">No steps have run yet.</div>;
  return (
    <div className="divide-y divide-slate-100 rounded-md border border-slate-200 bg-white">
      {steps.map((s: any, i: number) => {
        const isOpen = openIds.has(s.node_id);
        const def = activityOf(s.type);
        const Icon = def.icon;
        return (
          <div key={`${s.node_id}-${i}`}>
            <button onClick={() => toggle(s.node_id)} aria-expanded={isOpen}
              className={cx('flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50', isOpen && 'bg-slate-50')}>
              <ChevronRight className={cx('h-3.5 w-3.5 text-slate-400 transition-transform', isOpen && 'rotate-90')} />
              <span className="flex h-5 w-5 items-center justify-center rounded" style={{ background: `${def.color}14`, color: def.color }}><Icon className="h-3 w-3" /></span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-slate-800">{s.label || s.node_id}</span>
              {(s.decision || s.outcome || s.route) && <Tag tone="purple">{s.outcome || s.decision || `→ ${s.route}`}</Tag>}
              {s.latency_ms != null && <span className="text-[12px] tabular-nums text-slate-500">{fmtDuration(s.latency_ms)}</span>}
              <StatusPill status={s.status} />
            </button>
            {isOpen && (
              <div className="space-y-2 bg-slate-50/60 px-3 pb-3 pt-1">
                {s.error && <Callout tone="danger">{typeof s.error === 'string' ? s.error : JSON.stringify(s.error)}</Callout>}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slate-500">
                  <span>Step ID: <span className="font-mono">{s.node_id}</span></span>
                  {s.tokens != null && <span>Tokens: {typeof s.tokens === 'object' ? s.tokens.total_tokens ?? JSON.stringify(s.tokens) : s.tokens}</span>}
                  {Array.isArray(s.stored_as) && s.stored_as.length > 0 && <span>Stored as: {s.stored_as.join(', ')}</span>}
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div><div className="mb-1 text-[12px] font-medium text-slate-600">Input</div><ValueView value={s.input} title={`${s.label || s.node_id} · input`} maxHeight={280} emptyLabel="No input" /></div>
                  <div><div className="mb-1 text-[12px] font-medium text-slate-600">Output</div><ValueView value={s.output} title={`${s.label || s.node_id} · output`} maxHeight={280} emptyLabel="No output" /></div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const LogList: React.FC<{ run: any; tall?: boolean }> = ({ run, tall }) => {
  const logs: any[] = Array.isArray(run?.logs) ? run.logs : [];
  if (!logs.length) return <div className="py-6 text-center text-[13px] text-slate-400">No log entries.</div>;
  return (
    <div className={cx('rounded-md border border-slate-200 bg-slate-950 p-3 font-mono text-[12.5px] leading-relaxed text-slate-200 overflow-auto whitespace-pre-wrap break-words', tall ? 'max-h-[calc(100vh-260px)]' : 'max-h-[420px]')}>
      {logs.map((l, i) => {
        if (typeof l === 'string') return <div key={i}>{l}</div>;
        const lvl = (l.level || l.type || '').toLowerCase();
        const color = lvl.includes('error') || l.status === 'failed' ? 'text-red-400' : lvl.includes('warn') ? 'text-amber-300' : 'text-slate-200';
        const at = l.at || l.ts || l.timestamp || l.time;
        const msg = l.message || l.msg || l.event || (l.node_id ? `${l.node_id} ${l.status || ''}` : JSON.stringify(unwrapValue(l)));
        return <div key={i} className={color}>{at && <span className="text-slate-500">{new Date(at).toLocaleTimeString()} </span>}{l.node_id && !String(msg).includes(l.node_id) && <span className="text-sky-300">[{l.node_id}] </span>}{msg}</div>;
      })}
    </div>
  );
};
