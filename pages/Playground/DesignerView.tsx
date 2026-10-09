// Maestro-style process designer: toolbox · BPMN canvas · properties · bottom panel (Data Manager /
// Problems / Execution trail). Debug runs overlay live status on the canvas (P-11 + P-14 polling).
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background, Controls, MiniMap, ReactFlowProvider, useEdgesState, useNodesState, useReactFlow, Connection, Edge, Node, NodeChange, EdgeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import toast from '../../components/studio/notify';
import {
  ArrowLeft, Save, ShieldCheck, Play, MoreHorizontal, Copy, Trash2, History, Zap, LayoutGrid, PanelLeftClose, PanelLeftOpen,
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, X, Bug, Settings2, Database, ListTree, ScrollText, Maximize2, Minimize2,
} from 'lucide-react';
import { apiService } from '../../services/api';
import { ACTIVITIES, PALETTE_GROUPS, activityOf, autoLayout, studioNodeTypes } from '../../components/studio/bpmn';
import {
  Button, Callout, ConfirmDialog, ErrorBanner, Field, IconButton, Input, JsonBlock, Menu, Modal, SearchInput, Select, Spinner, StatusPill,
  Tabs, Tag, TextArea, cx, errMessage, fmtDateTime,
} from '../../components/studio/ui';
import {
  ACTIVE_RUN, DataManager, TERMINAL_RUN, canvasToGraph, coerceArg, decorateEdges, defaultConfigFor, emptyDataManager, flowToCanvas,
  newNodeId, nodesMentionedIn, parseJsonSafe, subLabelFor, takenEdgesFromRun,
} from './studioModel';
import { DataManagerEditor, Lookups, PropertiesPanel } from './PropertiesPanel';
import { InstanceOverview, LogList, RunActions, StepTrail, VariablesPanel } from './runParts';
import { findTemplateSamples, PlaygroundSample, SampleList, useSampleManifest } from '../../components/studio/samples';

interface Props {
  flowId: string;
  lookups: Lookups;
  onBack: () => void;
  onOpenFlow: (id: string) => void;
  onOpenInstance: (id: string) => void;
  onOpenInstancesFor: (flowId: string) => void;
  onOpenTriggersFor: (flowId: string) => void;
  onFlowsChanged: () => void;
  autoRun?: boolean;
}

export const DesignerView: React.FC<Props> = (p) => (
  <ReactFlowProvider><DesignerInner {...p} /></ReactFlowProvider>
);

const DesignerInner: React.FC<Props> = ({ flowId, lookups, onBack, onOpenFlow, onOpenInstance, onOpenInstancesFor, onOpenTriggersFor, onFlowsChanged, autoRun }) => {
  const rf = useReactFlow();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [meta, setMeta] = useState<any>({});
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('draft');
  const [dm, setDm] = useState<DataManager>(emptyDataManager());
  const [nodes, setNodes, onNodesChangeBase] = useNodesState([]);
  const [edges, setEdges, onEdgesChangeBase] = useEdgesState([]);
  const [dirty, setDirty] = useState(false);
  const [selNode, setSelNode] = useState<string | null>(null);
  const [toolboxOpen, setToolboxOpen] = useState(true);
  const [toolSearch, setToolSearch] = useState('');
  const [bottomOpen, setBottomOpen] = useState(false);
  const [bottomMax, setBottomMax] = useState(false);
  const [propsWide, setPropsWide] = useState(false);
  const [bottomTab, setBottomTab] = useState<'data' | 'problems' | 'trail' | 'logs'>('data');
  const [issues, setIssues] = useState<string[] | null>(null);
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [runDialog, setRunDialog] = useState(false);
  const [debugRun, setDebugRun] = useState<any | null>(null);
  const [confirm, setConfirm] = useState<null | 'leave' | 'delete'>(null);
  const [rightTab, setRightTab] = useState<'process' | 'instance'>('process');
  const autoRunDone = useRef(false);
  const sampleManifest = useSampleManifest();
  const [templateSlug, setTemplateSlug] = useState<string | null>(null);
  useEffect(() => {
    const sid = meta?.source?.solution_id;
    if (!sid) { setTemplateSlug(null); return; }
    apiService.playground.solutions.get(sid).then(r => setTemplateSlug(r?.data?.slug || null)).catch(() => setTemplateSlug(null));
  }, [meta?.source?.solution_id]);
  const templateSamples = findTemplateSamples(sampleManifest, { slug: templateSlug, name: name || meta?.name });

  const markDirty = () => setDirty(true);

  // Screen → canvas coordinates. The app runs with `body { zoom: 0.75 }`, so client coordinates are
  // converted into the canvas' own layout space before applying the React Flow viewport transform.
  const toFlow = (clientX: number, clientY: number) => {
    const el = wrapRef.current;
    if (!el) return { x: 200, y: 200 };
    const r = el.getBoundingClientRect();
    const ratio = el.offsetWidth ? r.width / el.offsetWidth : 1;
    const vp = rf.getViewport();
    return { x: ((clientX - r.left) / ratio - vp.x) / vp.zoom, y: ((clientY - r.top) / ratio - vp.y) / vp.zoom };
  };

  /* ── load ── */
  const load = useCallback(async () => {
    setLoading(true); setLoadError(null);
    try {
      const res = await apiService.playground.flows.get(flowId);
      const f = res?.data || {};
      setMeta(f);
      setName(f.name || 'Untitled process');
      setDescription(f.description || '');
      setStatus(f.status || 'draft');
      setDm({ arguments: f.data_manager?.arguments || [], variables: f.data_manager?.variables || [] });
      const c = flowToCanvas(f.graph, lookups);
      setNodes(c.nodes); setEdges(c.edges);
      setDirty(false); setSelNode(null); setIssues(null); setDebugRun(null);
      setTimeout(() => rf.fitView({ padding: 0.25, maxZoom: 1.1 }), 60);
    } catch (e: any) {
      setLoadError(e?.status === 404 ? 'This process no longer exists (or belongs to another organization).' : errMessage(e, 'Failed to load the process'));
    } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowId]);
  useEffect(() => { load(); }, [load]);

  // Agent / connector / process names arrive asynchronously — refresh the sub-labels when they do,
  // and again once the process has loaded (it may have been read with lookups that were still empty).
  useEffect(() => {
    setNodes(ns => ns.map(n => ({ ...n, data: { ...n.data, sub: subLabelFor(n.data.type, n.data.config, lookups) } })));
  }, [lookups.agents, lookups.connectors, lookups.flows, setNodes, loading]);

  /* ── unsaved-changes guards ── */
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  /* ── canvas changes ── */
  const onNodesChange = useCallback((ch: NodeChange[]) => {
    onNodesChangeBase(ch);
    if (ch.some(c => c.type === 'position' && (c as any).dragging === false || c.type === 'remove')) markDirty();
    const removed = ch.filter(c => c.type === 'remove').map(c => (c as any).id);
    if (removed.length) {
      setEdges(es => es.filter(e => !removed.includes(e.source) && !removed.includes(e.target)));
      if (selNode && removed.includes(selNode)) setSelNode(null);
    }
  }, [onNodesChangeBase, selNode, setEdges]);

  const onEdgesChange = useCallback((ch: EdgeChange[]) => {
    onEdgesChangeBase(ch);
    if (ch.some(c => c.type === 'remove')) markDirty();
  }, [onEdgesChangeBase]);

  const onConnect = useCallback((c: Connection) => {
    if (!c.source || !c.target || c.source === c.target) return;
    setEdges(es => {
      if (es.some(e => e.source === c.source && e.target === c.target)) { toast.error('These steps are already connected'); return es; }
      return [...es, { id: `e_${c.source}_${c.target}_${Date.now().toString(36)}`, source: c.source, target: c.target, data: { kind: 'sequence' } } as Edge];
    });
    markDirty();
  }, [setEdges]);

  const addNode = (type: string, position?: { x: number; y: number }) => {
    const def = activityOf(type);
    if (type === 'start' && nodes.some(n => n.data.type === 'start')) { toast.error('A process has exactly one Start event'); return; }
    let pos = position;
    if (!pos) {
      const r = wrapRef.current?.getBoundingClientRect();
      pos = r ? toFlow(r.left + r.width / 2, r.top + r.height / 2) : { x: 200, y: 200 };
      pos = { x: pos.x - 90 + (nodes.length % 4) * 16, y: pos.y - 30 + (nodes.length % 4) * 16 };
    }
    const id = newNodeId(type, nodes.map(n => n.id));
    const config = defaultConfigFor(type);
    const node: Node = { id, type: 'studio', position: pos, data: { type, label: def.name, config, sub: subLabelFor(type, config, lookups) } };
    setNodes(ns => [...ns.map(n => ({ ...n, selected: false })), { ...node, selected: true }]);
    setSelNode(id);
    markDirty();
  };

  const updateNode = (id: string, patch: { label?: string; config?: any }) => {
    setNodes(ns => ns.map(n => {
      if (n.id !== id) return n;
      const data = { ...n.data, ...(patch.label !== undefined ? { label: patch.label } : {}), ...(patch.config !== undefined ? { config: patch.config } : {}) };
      data.sub = subLabelFor(data.type, data.config, lookups);
      return { ...n, data };
    }));
    markDirty();
  };

  const deleteNode = (id: string) => {
    setNodes(ns => ns.filter(n => n.id !== id));
    setEdges(es => es.filter(e => e.source !== id && e.target !== id));
    setSelNode(null);
    markDirty();
  };

  const tidy = () => {
    setNodes(ns => autoLayout(ns, edges));
    markDirty();
    setTimeout(() => rf.fitView({ padding: 0.25, duration: 300 }), 50);
  };

  /* ── validate / save ── */
  const graphBody = () => canvasToGraph(nodes, edges);

  const validate = async (opts: { silent?: boolean; saved?: boolean } = {}) => {
    setValidating(true);
    try {
      const res = await apiService.playground.flows.validate(flowId, opts.saved ? undefined : { graph: graphBody() });
      const d = res?.data || {};
      const list: string[] = Array.isArray(d.issues) ? d.issues : [];
      setIssues(list);
      if (!opts.silent) {
        if (d.ok) toast.success('No problems found — the process is runnable');
        else { setBottomOpen(true); setBottomTab('problems'); }
      }
      return !!d.ok;
    } catch (e: any) {
      if (Array.isArray(e?.issues)) { setIssues(e.issues); if (!opts.silent) { setBottomOpen(true); setBottomTab('problems'); } }
      else if (!opts.silent) toast.error(errMessage(e, 'Validation failed'));
      return false;
    } finally { setValidating(false); }
  };

  // Live problems: re-check the unsaved canvas shortly after each edit.
  useEffect(() => {
    if (loading || !dirty) return;
    const t = setTimeout(() => { validate({ silent: true }); }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length, edges.length, dm, dirty, JSON.stringify(nodes.map(n => [n.data.label, n.data.config]))]);

  const save = async (silent = false) => {
    if (!name.trim()) { toast.error('Give the process a name'); return false; }
    setSaving(true);
    try {
      const res = await apiService.playground.flows.update(flowId, { name: name.trim(), description, status, data_manager: dm, graph: graphBody() });
      setMeta((m: any) => ({ ...m, ...(res?.data || {}) }));
      setDirty(false);
      if (!silent) toast.success('Process saved');
      onFlowsChanged();
      validate({ silent: true, saved: true });
      return true;
    } catch (e: any) {
      toast.error(errMessage(e, 'Save failed'));
      if (Array.isArray(e?.issues)) { setIssues(e.issues); setBottomOpen(true); setBottomTab('problems'); }
      return false;
    } finally { setSaving(false); }
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (!saving) save(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  /* ── debug run ── */
  const openRun = async () => {
    if (dirty) { const ok = await save(true); if (!ok) return; }
    setRunDialog(true);
  };
  useEffect(() => { if (autoRun && !loading && !loadError && !autoRunDone.current) { autoRunDone.current = true; setRunDialog(true); } }, [autoRun, loading, loadError]);

  const startRun = async (input: any) => {
    try {
      const res = await apiService.playground.flows.run(flowId, { input });
      setRunDialog(false);
      setDebugRun(res?.data);
      setRightTab('instance');
      setSelNode(null);
      setBottomOpen(true); setBottomTab('trail');
      toast.success('Debug run started');
      onFlowsChanged();
    } catch (e: any) {
      // Invalid input (F.1): keep the dialog open so the user can correct the named arguments.
      if (Array.isArray(e?.data?.issue_details) && e.data.issue_details.length) {
        toast.error(errMessage(e, 'Invalid run input'));
      } else if (Array.isArray(e?.issues) && e.issues.length) {
        setIssues(e.issues); setRunDialog(false); setBottomOpen(true); setBottomTab('problems');
        toast.error('The process is not runnable yet — see Problems');
      } else toast.error(errMessage(e, 'Failed to start the run'));
    }
  };

  const refreshRun = useCallback(async (id?: string) => {
    const runId = id || debugRun?._id;
    if (!runId) return;
    try { const r = await apiService.playground.runs.get(runId); if (r?.data) setDebugRun(r.data); } catch { /* keep last state */ }
  }, [debugRun?._id]);

  useEffect(() => {
    if (!debugRun?._id || TERMINAL_RUN.includes(debugRun.status)) return;
    const t = setInterval(() => refreshRun(), 2000);
    return () => clearInterval(t);
  }, [debugRun?._id, debugRun?.status, refreshRun]);

  const prevStatus = useRef<string | null>(null);
  useEffect(() => {
    const s = debugRun?.status;
    if (s && prevStatus.current && prevStatus.current !== s) {
      if (s === 'completed') toast.success('Debug run completed');
      else if (s === 'failed') toast.error('Debug run failed — see the incident');
      else if (s === 'waiting_approval') toast('Waiting for a user task decision', { icon: '⏸' });
    }
    prevStatus.current = s || null;
  }, [debugRun?.status]);

  /* ── derived canvas ── */
  const issueNodes = useMemo(() => nodesMentionedIn(issues || [], nodes), [issues, nodes]);
  const runNodeMap = useMemo(() => new Map((debugRun?.nodes || []).map((n: any) => [n.node_id, n])), [debugRun]);
  const displayNodes = useMemo(() => nodes.map(n => ({
    ...n,
    data: { ...n.data, status: (runNodeMap.get(n.id) as any)?.status, issue: issueNodes.has(n.id) },
  })), [nodes, runNodeMap, issueNodes]);
  const displayEdges = useMemo(() => decorateEdges(nodes, edges, { taken: debugRun ? takenEdgesFromRun(debugRun, edges) : undefined }), [nodes, edges, debugRun]);

  const selected = nodes.find(n => n.id === selNode) || null;
  const filteredActivities = Object.values(ACTIVITIES).filter(a => a.palette !== false && (!toolSearch || `${a.name} ${a.action}`.toLowerCase().includes(toolSearch.toLowerCase())));

  /* ── header actions ── */
  const duplicate = async () => {
    try { const r = await apiService.playground.flows.duplicate(flowId); toast.success('Process duplicated'); onFlowsChanged(); if (r?.data?._id) onOpenFlow(r.data._id); }
    catch (e: any) { toast.error(errMessage(e, 'Duplicate failed')); }
  };
  const remove = async () => {
    try { await apiService.playground.flows.delete(flowId); toast.success('Process deleted'); onFlowsChanged(); setDirty(false); onBack(); }
    catch (e: any) { toast.error(errMessage(e, 'Delete failed')); }
    setConfirm(null);
  };
  const back = () => (dirty ? setConfirm('leave') : onBack());

  if (loading) return <Spinner label="Opening process…" className="h-full" />;
  if (loadError) return (
    <div className="p-8"><ErrorBanner message={loadError} onRetry={load} /><Button className="mt-4" icon={<ArrowLeft className="h-4 w-4" />} onClick={onBack}>Back to processes</Button></div>
  );

  const problemCount = issues?.length || 0;

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3">
        <IconButton label="Back to processes" onClick={back}><ArrowLeft className="h-4 w-4" /></IconButton>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <input value={name} onChange={e => { setName(e.target.value); markDirty(); }} className="min-w-0 max-w-[420px] flex-1 rounded px-1.5 py-0.5 text-[15px] font-semibold text-slate-900 outline-none hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-[var(--sx-primary)]/20" aria-label="Process name" />
            <StatusPill status={status} />
            {dirty ? <span className="text-[12px] text-amber-700">● Unsaved changes</span> : <span className="text-[12px] text-slate-400">Saved · v{meta.version ?? 1}</span>}
            {issues && (problemCount ? (
              <button onClick={() => { setBottomOpen(true); setBottomTab('problems'); }} className="inline-flex items-center gap-1 rounded bg-red-50 px-1.5 py-0.5 text-[12px] font-medium text-red-700"><AlertTriangle className="h-3.5 w-3.5" />{problemCount} problem{problemCount > 1 ? 's' : ''}</button>
            ) : <span className="inline-flex items-center gap-1 text-[12px] text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />Runnable</span>)}
          </div>
        </div>
        <Button size="sm" variant="ghost" icon={<LayoutGrid className="h-4 w-4" />} onClick={tidy} title="Arrange the diagram left-to-right">Tidy up</Button>
        <Button size="sm" icon={<ShieldCheck className="h-4 w-4" />} loading={validating} onClick={() => validate()}>Validate</Button>
        <Button size="sm" icon={<Save className="h-4 w-4" />} loading={saving} onClick={() => save()} disabled={!dirty && !saving}>Save</Button>
        <Button size="sm" variant="primary" icon={<Bug className="h-4 w-4" />} onClick={openRun} disabled={!!debugRun && ACTIVE_RUN.includes(debugRun.status)}>Debug</Button>
        <Menu trigger={open => <IconButton label="More actions" onClick={open}><MoreHorizontal className="h-4 w-4" /></IconButton>} items={[
          { label: 'View instances', icon: <History className="h-4 w-4" />, onClick: () => onOpenInstancesFor(flowId) },
          { label: 'Triggers', icon: <Zap className="h-4 w-4" />, onClick: () => onOpenTriggersFor(flowId) },
          { label: 'Duplicate', icon: <Copy className="h-4 w-4" />, onClick: duplicate },
          'divider',
          { label: 'Delete process', icon: <Trash2 className="h-4 w-4" />, danger: true, onClick: () => setConfirm('delete') },
        ]} />
      </div>

      {debugRun && (
        <div className={cx('flex shrink-0 items-center gap-3 border-b px-4 py-1.5 text-[13px]',
          debugRun.status === 'failed' ? 'border-red-200 bg-red-50' : debugRun.status === 'completed' ? 'border-emerald-200 bg-emerald-50' : debugRun.status === 'waiting_approval' ? 'border-amber-200 bg-amber-50' : 'border-blue-200 bg-blue-50')}>
          <Bug className="h-4 w-4 text-slate-600" />
          <span className="font-medium text-slate-800">Debug instance</span>
          <span className="font-mono text-[12px] text-slate-500">{debugRun._id}</span>
          <StatusPill status={debugRun.status} />
          <div className="ml-auto flex items-center gap-2">
            <RunActions run={debugRun} onChange={() => refreshRun()} />
            <Button size="sm" variant="ghost" onClick={() => onOpenInstance(debugRun._id)}>Open in Instances</Button>
            <Button size="sm" variant="ghost" icon={<X className="h-4 w-4" />} onClick={() => { setDebugRun(null); setRightTab('process'); if (bottomTab === 'trail' || bottomTab === 'logs') setBottomTab('data'); }}>Exit debug</Button>
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* Toolbox */}
        <aside className={cx('flex shrink-0 flex-col border-r border-slate-200 bg-white transition-[width]', toolboxOpen ? 'w-[248px]' : 'w-[52px]')}>
          <div className="flex h-11 items-center justify-between border-b border-slate-200 px-2">
            {toolboxOpen && <span className="pl-1 text-[12.5px] font-semibold uppercase tracking-wide text-slate-500">Toolbox</span>}
            <IconButton label={toolboxOpen ? 'Collapse toolbox' : 'Expand toolbox'} onClick={() => setToolboxOpen(o => !o)}>
              {toolboxOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </IconButton>
          </div>
          {toolboxOpen && <div className="p-2"><SearchInput value={toolSearch} onChange={setToolSearch} placeholder="Search elements" /></div>}
          <div className="flex-1 overflow-y-auto px-2 pb-3">
            {PALETTE_GROUPS.map(g => {
              const items = filteredActivities.filter(a => a.group === g);
              if (!items.length) return null;
              return (
                <div key={g} className="mt-2">
                  {toolboxOpen ? <div className="px-1 pb-1 text-[11.5px] font-semibold uppercase tracking-wide text-slate-400">{g}</div> : <div className="mx-2 my-2 border-t border-slate-100" />}
                  {items.map(a => {
                    const I = a.icon;
                    return (
                      <button key={a.type} draggable onDragStart={e => { e.dataTransfer.setData('application/x-studio', a.type); e.dataTransfer.effectAllowed = 'move'; }}
                        onClick={() => addNode(a.type)} title={`${a.name} — ${a.action}. Click or drag onto the canvas.`}
                        className={cx('group flex w-full items-center gap-2.5 rounded-md text-left hover:bg-slate-100 cursor-grab active:cursor-grabbing', toolboxOpen ? 'px-2 py-1.5' : 'justify-center py-2')}>
                        <span className={cx('flex h-7 w-7 shrink-0 items-center justify-center border-[1.5px] bg-white',
                          a.shape === 'event' ? 'rounded-full' : a.shape === 'gateway' ? 'rotate-45 rounded-[3px] !h-5 !w-5 mx-1' : 'rounded')}
                          style={{ borderColor: a.color, color: a.color, borderWidth: a.type === 'end' ? 3 : undefined }}>
                          <I className={cx('h-3.5 w-3.5', a.shape === 'gateway' && '-rotate-45')} />
                        </span>
                        {toolboxOpen && (
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-medium text-slate-800">{a.name}</span>
                            <span className="block truncate text-[11.5px] text-slate-500">{a.action}</span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Canvas + bottom panel */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div ref={wrapRef} className="relative min-h-0 flex-1 bg-[#f8f9fa]"
            onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
            onDrop={e => {
              e.preventDefault();
              const type = e.dataTransfer.getData('application/x-studio');
              if (!type) return;
              const pos = toFlow(e.clientX, e.clientY);
              addNode(type, { x: pos.x - 90, y: pos.y - 30 });
            }}>
            <ReactFlow
              nodes={displayNodes} edges={displayEdges} nodeTypes={studioNodeTypes}
              onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
              onNodeClick={(_, n) => setSelNode(n.id)} onPaneClick={() => setSelNode(null)}
              onEdgeClick={(_, e) => setSelNode(e.source)}
              deleteKeyCode={['Delete', 'Backspace']} snapToGrid snapGrid={[10, 10]} minZoom={0.2} maxZoom={2}
              proOptions={{ hideAttribution: true }} fitView fitViewOptions={{ padding: 0.25, maxZoom: 1.1 }}
            >
              <Background color="#d5dce0" gap={18} size={1.2} />
              <Controls position="bottom-left" />
              <MiniMap pannable zoomable position="bottom-right" className="!h-[110px] !w-[170px] !rounded-md !border !border-slate-200"
                nodeColor={(n: any) => activityOf(n.data?.type).color} maskColor="rgba(244,245,247,0.7)" />
            </ReactFlow>
            {nodes.length <= 2 && !debugRun && (
              <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-md border border-slate-200 bg-white/95 px-3 py-2 text-[12.5px] text-slate-600 shadow-sm">
                Drag elements from the Toolbox, then connect them by dragging from a step's right handle to the next step.
              </div>
            )}
          </div>

          {/* Bottom panel */}
          <div className={cx('shrink-0 border-t border-slate-200 bg-white transition-[height] duration-200', bottomOpen ? (bottomMax ? 'h-[62%]' : 'h-[340px]') : 'h-10')}>
            <div className="flex h-10 items-center gap-1 border-b border-slate-200 px-2">
              {([
                ['data', 'Data Manager', <Database key="i" className="h-4 w-4" />],
                ['problems', `Problems${issues ? ` (${problemCount})` : ''}`, <AlertTriangle key="i" className={cx('h-4 w-4', problemCount ? 'text-red-600' : '')} />],
                ...(debugRun ? [['trail', 'Execution trail', <ListTree key="i" className="h-4 w-4" />], ['logs', 'Logs', <ScrollText key="i" className="h-4 w-4" />]] : []),
              ] as [string, string, React.ReactNode][]).map(([k, label, icon]) => (
                <button key={k} onClick={() => { setBottomTab(k as any); setBottomOpen(true); }}
                  className={cx('inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-[13px] font-medium', bottomOpen && bottomTab === k ? 'bg-[var(--sx-primary-soft)] text-[var(--sx-primary)]' : 'text-slate-600 hover:bg-slate-100')}>
                  {icon}{label}
                </button>
              ))}
              <div className="ml-auto flex items-center">
                {bottomOpen && <IconButton label={bottomMax ? 'Restore panel size' : 'Maximize panel'} onClick={() => setBottomMax(m => !m)}>{bottomMax ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</IconButton>}
                <IconButton label={bottomOpen ? 'Collapse panel' : 'Expand panel'} onClick={() => setBottomOpen(o => !o)}>{bottomOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}</IconButton>
              </div>
            </div>
            {bottomOpen && (
              <div className={cx('h-[calc(100%-40px)] p-3', bottomTab === 'data' ? 'overflow-hidden' : 'overflow-y-auto')}>
                {bottomTab === 'data' && <DataManagerEditor dm={dm} onChange={d => { setDm(d); markDirty(); }} />}
                {bottomTab === 'problems' && (
                  !issues ? <div className="text-[13px] text-slate-500">Click <b>Validate</b> to check the process. Problems also refresh automatically while you edit.</div>
                    : issues.length === 0 ? <Callout tone="success" icon={<CheckCircle2 className="h-4 w-4" />} title="No problems">The process has one entry, no dead ends or cycles, valid gateway routes and published agents.</Callout>
                      : (
                        <ul className="space-y-1.5">
                          {issues.map((msg, i) => {
                            const hit = nodes.find(n => msg.includes(`"${n.data.label}"`) || msg.includes(`"${n.id}"`));
                            return (
                              <li key={i}>
                                <button onClick={() => { if (hit) { setSelNode(hit.id); rf.fitView({ nodes: [{ id: hit.id }], padding: 1.5, duration: 300, maxZoom: 1.2 }); } }}
                                  className="flex w-full items-start gap-2 rounded-md border border-red-100 bg-red-50/60 px-3 py-2 text-left text-[13px] text-red-800 hover:bg-red-50">
                                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span className="flex-1">{msg}</span>{hit && <span className="shrink-0 text-[12px] text-red-600 underline">Go to step</span>}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )
                )}
                {bottomTab === 'trail' && debugRun && <StepTrail run={debugRun} focusNode={selNode} onFocus={id => setSelNode(id)} />}
                {bottomTab === 'logs' && debugRun && <LogList run={debugRun} />}
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <aside className={cx('flex shrink-0 flex-col border-l border-slate-200 bg-white transition-[width] duration-200', selected && propsWide ? 'w-[min(760px,58%)]' : 'w-[360px]')}>
          {selected ? (
            <PropertiesPanel
              key={selected.id}
              node={selected} nodes={nodes} edges={edges} dm={dm} lookups={lookups} flowId={flowId}
              runNode={runNodeMap.get(selected.id)}
              onChange={patch => updateNode(selected.id, patch)}
              onDelete={() => deleteNode(selected.id)}
              onClose={() => setSelNode(null)}
              onOpenDataManager={() => { setBottomOpen(true); setBottomTab('data'); }}
              wide={propsWide}
              onToggleWide={() => setPropsWide(w => !w)}
            />
          ) : (
            <div className="flex h-full flex-col">
              <div className="px-3 pt-2"><Tabs active={debugRun ? rightTab : 'process'} onChange={k => setRightTab(k as any)} tabs={[{ key: 'process', label: <span className="inline-flex items-center gap-1.5"><Settings2 className="h-4 w-4" />Process</span> }, ...(debugRun ? [{ key: 'instance', label: <span className="inline-flex items-center gap-1.5"><Bug className="h-4 w-4" />Debug instance</span> }] : [])]} /></div>
              <div className="flex-1 overflow-y-auto p-4">
                {debugRun && rightTab === 'instance' ? (
                  <div className="space-y-4">
                    <InstanceOverview run={debugRun} onChanged={() => refreshRun()} onOpenRun={onOpenInstance} />
                    <VariablesPanel run={debugRun} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Field label="Name" required><Input value={name} onChange={e => { setName(e.target.value); markDirty(); }} /></Field>
                    <Field label="Description"><TextArea rows={3} value={description} onChange={e => { setDescription(e.target.value); markDirty(); }} placeholder="What does this process do?" /></Field>
                    <Field label="Status" hint="Published processes are the ones you run in production.">
                      <Select value={status} onChange={e => { setStatus(e.target.value); markDirty(); }}>
                        <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
                      </Select>
                    </Field>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[['Steps', nodes.length], ['Paths', edges.length], ['Instances', meta.run_count ?? 0]].map(([l, v]) => (
                        <div key={l as string} className="rounded-md border border-slate-200 py-2"><div className="text-[17px] font-semibold text-slate-900">{v as any}</div><div className="text-[12px] text-slate-500">{l}</div></div>
                      ))}
                    </div>
                    {meta.source?.solution_id && <Callout tone="info" title="Created from a template">Solution version {meta.source.solution_version ?? '—'} · {fmtDateTime(meta.source.cloned_at)}</Callout>}
                    {Array.isArray(meta.test_cases) && meta.test_cases.length > 0 && (
                      <div>
                        <div className="mb-1 text-[12.5px] font-medium text-slate-700">Test cases</div>
                        <div className="space-y-1.5">{meta.test_cases.map((t: any, i: number) => (
                          <div key={i} className="rounded-md border border-slate-200 px-2.5 py-2"><div className="text-[13px] font-medium text-slate-800">{t.name}</div>{t.description && <div className="text-[12px] text-slate-500">{t.description}</div>}</div>
                        ))}</div>
                        <div className="mt-1 text-[12px] text-slate-500">Pick one in the Debug dialog to run with its sample input.</div>
                      </div>
                    )}
                    <div className="rounded-md bg-slate-50 p-3 text-[12.5px] text-slate-600 space-y-1">
                      <div className="font-medium text-slate-700">Tips</div>
                      <div>• Select a step to edit it; select empty canvas for process settings.</div>
                      <div>• <kbd className="rounded border bg-white px-1">Ctrl</kbd>+<kbd className="rounded border bg-white px-1">S</kbd> saves · <kbd className="rounded border bg-white px-1">Del</kbd> removes the selection.</div>
                      <div>• Debug runs the saved version and shows each step's status live.</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

      <RunDialog open={runDialog} onClose={() => setRunDialog(false)} dm={dm} testCases={meta.test_cases || []} samples={templateSamples?.samples || []} onRun={startRun} name={name} />

      <ConfirmDialog open={confirm === 'leave'} title="Leave without saving?" confirmLabel="Discard changes" message="You have unsaved changes to this process. They will be lost."
        onCancel={() => setConfirm(null)} onConfirm={() => { setDirty(false); setConfirm(null); onBack(); }}>
        <div className="mt-3"><Button variant="primary" onClick={async () => { const ok = await save(); if (ok) { setConfirm(null); onBack(); } }}>Save and leave</Button></div>
      </ConfirmDialog>
      <ConfirmDialog open={confirm === 'delete'} title="Delete this process?" confirmLabel="Delete process"
        message={<>“{name}” will be deleted. Its run history is kept for auditing but the process can no longer be run.</>}
        onCancel={() => setConfirm(null)} onConfirm={remove} />
    </div>
  );
};

/* ───────────────────────── Run (Debug) dialog ───────────────────────── */

const RunDialog: React.FC<{ open: boolean; onClose: () => void; dm: DataManager; testCases: any[]; samples: PlaygroundSample[]; onRun: (input: any) => Promise<void>; name: string }> = ({ open, onClose, dm, testCases, samples, onRun, name }) => {
  const inArgs = dm.arguments.filter(a => a.direction === 'in' || a.direction === 'inout');
  const [mode, setMode] = useState<'form' | 'json'>('form');
  const [fields, setFields] = useState<Record<string, any>>({});
  const [json, setJson] = useState('{}');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) return;
    const f: Record<string, any> = {};
    inArgs.forEach(a => { f[a.name] = a.default ?? ''; });
    setFields(f); setJson(JSON.stringify(f, null, 2)); setErr(null); setMode(inArgs.length ? 'form' : 'json');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const applyCase = (tc: any) => {
    const input = tc?.input?.input && typeof tc.input.input === 'object' ? tc.input.input : (tc?.input || {});
    setJson(JSON.stringify(input, null, 2));
    const f: Record<string, any> = { ...fields };
    Object.entries(input).forEach(([k, v]) => { f[k] = typeof v === 'object' ? JSON.stringify(v) : v; });
    setFields(f);
    toast.success(`Loaded “${tc.name}”`);
  };

  const submit = async () => {
    let input: any = {};
    if (mode === 'json') {
      const p = parseJsonSafe(json);
      if (p.ok === false) { setErr(`Not valid JSON: ${p.error}`); return; }
      input = p.value;
      // Instant feedback for missing required arguments; the backend validates too (400 + issue_details, contract F.1).
      const missing = inArgs.filter(a => a.required && (input?.[a.name] === undefined || input?.[a.name] === ''));
      if (missing.length) { setErr(`Missing required argument${missing.length > 1 ? 's' : ''}: ${missing.map(a => a.name).join(', ')}`); return; }
    } else {
      for (const a of inArgs) {
        const v = coerceArg(a.type, fields[a.name]);
        if (a.required && (v === undefined || v === '')) { setErr(`“${a.name}” is required.`); return; }
        if (v !== undefined) input[a.name] = v;
      }
    }
    setErr(null); setBusy(true);
    try { await onRun(input); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Debug run" subtitle={<>Runs the saved version of <b>{name}</b> and shows progress on the canvas.</>} width={640}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" icon={<Play className="h-4 w-4" />} loading={busy} onClick={submit}>Run</Button></>}>
      <div className="space-y-3">
        {samples.length > 0 && (
          <div>
            <div className="mb-1 text-[12.5px] font-medium text-slate-700">Sample inputs (demo files)</div>
            <SampleList samples={samples} onUse={id => { const s = samples.find(x => x.id === id); if (s) applyCase({ name: s.label, input: s.input }); }} />
          </div>
        )}
        {testCases.length > 0 && (
          <div>
            <div className="mb-1 text-[12.5px] font-medium text-slate-700">Run with a test case</div>
            <div className="flex flex-wrap gap-1.5">{testCases.map((t, i) => <Button key={i} size="sm" variant="subtle" onClick={() => applyCase(t)} title={t.description}>{t.name || `Case ${i + 1}`}</Button>)}</div>
          </div>
        )}
        <Tabs active={mode} onChange={k => setMode(k as any)} tabs={[{ key: 'form', label: 'In-arguments' }, { key: 'json', label: 'JSON' }]} />
        {err && <div className="text-[12.5px] text-red-600">{err}</div>}
        {mode === 'form' ? (
          inArgs.length === 0 ? <Callout tone="info">This process has no in-arguments. Add them in the Data Manager, or switch to JSON to send a custom input.</Callout> : (
            <div className="space-y-3">
              {inArgs.map(a => (
                <Field key={a.name} label={<span className="font-mono">{a.name}</span>} required={a.required} hint={`${a.type}${a.description ? ` — ${a.description}` : ''}`}>
                  {a.type === 'boolean' ? (
                    <Select value={String(fields[a.name] ?? '')} onChange={e => setFields({ ...fields, [a.name]: e.target.value })}><option value="">—</option><option value="true">true</option><option value="false">false</option></Select>
                  ) : a.type === 'object' || a.type === 'array' || String(fields[a.name] ?? '').length > 80 ? (
                    <TextArea rows={4} className="font-mono text-[12.5px]" value={fields[a.name] ?? ''} onChange={e => setFields({ ...fields, [a.name]: e.target.value })} />
                  ) : (
                    <Input type={a.type === 'number' ? 'number' : 'text'} value={fields[a.name] ?? ''} onChange={e => setFields({ ...fields, [a.name]: e.target.value })} />
                  )}
                </Field>
              ))}
            </div>
          )
        ) : (
          <TextArea rows={10} className="font-mono text-[12.5px]" value={json} onChange={e => setJson(e.target.value)} />
        )}
      </div>
    </Modal>
  );
};

