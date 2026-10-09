// BPMN-style activity catalog and React Flow node renderers (UiPath Maestro look):
// events are circles, gateways are diamonds, tasks are rounded rectangles with a type marker.
import React from 'react';
import { Handle, Position, MarkerType, Edge, Node } from 'reactflow';
import {
  Play, Square, Timer, Bot, Plug, Globe, FileCode2, UserCheck, Workflow, X as XIcon, Plus, Merge,
  Check, Loader2, AlertTriangle, Clock, Minus, Hand,
} from 'lucide-react';
import { cx } from './ui';

export type ActivityShape = 'event' | 'task' | 'gateway';
export interface ActivityDef {
  type: string;
  name: string;           // Maestro element name shown in the toolbox and properties
  action: string;         // what the element does (Maestro "action" line)
  group: 'Events' | 'Tasks' | 'Gateways';
  shape: ActivityShape;
  icon: React.ComponentType<any>;
  color: string;
  palette?: boolean;      // false → render-only (legacy types)
}

export const ACTIVITIES: Record<string, ActivityDef> = {
  start: { type: 'start', name: 'Start event', action: 'Starts the process with its in-arguments', group: 'Events', shape: 'event', icon: Play, color: '#038108' },
  end: { type: 'end', name: 'End event', action: 'Completes the process and returns out-arguments', group: 'Events', shape: 'event', icon: Square, color: '#cc3d45' },
  timer: { type: 'timer', name: 'Timer event', action: 'Waits for a duration or until a date', group: 'Events', shape: 'event', icon: Timer, color: '#8a6100' },
  agent: { type: 'agent', name: 'Agent task', action: 'Start and wait for a published agent', group: 'Tasks', shape: 'task', icon: Bot, color: '#6b42c2' },
  connector: { type: 'connector', name: 'Service task', action: 'Execute a connector activity', group: 'Tasks', shape: 'task', icon: Plug, color: '#0067df' },
  api_call: { type: 'api_call', name: 'API task', action: 'Call an HTTP API', group: 'Tasks', shape: 'task', icon: Globe, color: '#00847a' },
  transform: { type: 'transform', name: 'Script task', action: 'Set or reshape variables', group: 'Tasks', shape: 'task', icon: FileCode2, color: '#526069' },
  human_task: { type: 'human_task', name: 'User task', action: 'Create a task for a person and wait', group: 'Tasks', shape: 'task', icon: UserCheck, color: '#b35c00' },
  human_approval: { type: 'human_approval', name: 'User task (approval)', action: 'Approve / reject step (legacy)', group: 'Tasks', shape: 'task', icon: Hand, color: '#b35c00', palette: false },
  subflow: { type: 'subflow', name: 'Call activity', action: 'Start and wait for another process', group: 'Tasks', shape: 'task', icon: Workflow, color: '#1f6f8b' },
  condition: { type: 'condition', name: 'Exclusive gateway', action: 'Take exactly one path based on conditions', group: 'Gateways', shape: 'gateway', icon: XIcon, color: '#5c4a00' },
  parallel: { type: 'parallel', name: 'Parallel gateway', action: 'Split into paths that run at the same time', group: 'Gateways', shape: 'gateway', icon: Plus, color: '#5c4a00' },
  join: { type: 'join', name: 'Parallel join', action: 'Wait for all parallel paths to finish', group: 'Gateways', shape: 'gateway', icon: Merge, color: '#5c4a00' },
};

export const activityOf = (type?: string): ActivityDef =>
  (type && ACTIVITIES[type]) || { type: type || 'task', name: type ? type.replace(/_/g, ' ') : 'Task', action: '', group: 'Tasks', shape: 'task', icon: Workflow, color: '#526069' };

// Unknown backend node types (contract: additive) still render as a generic task.
export const PALETTE_GROUPS: ('Events' | 'Tasks' | 'Gateways')[] = ['Events', 'Tasks', 'Gateways'];

/* ───────────────────────── Status overlay ───────────────────────── */

const statusTone = (s?: string) => {
  switch (s) {
    case 'completed': return { ring: '#038108', bg: 'bg-emerald-600', icon: <Check className="h-3 w-3" /> };
    case 'running': return { ring: '#0067df', bg: 'bg-blue-600', icon: <Loader2 className="h-3 w-3 animate-spin" /> };
    case 'failed': return { ring: '#cc3d45', bg: 'bg-red-600', icon: <AlertTriangle className="h-3 w-3" /> };
    case 'waiting_approval':
    case 'waiting_human': return { ring: '#b35c00', bg: 'bg-amber-500', icon: <Clock className="h-3 w-3" /> };
    case 'skipped': return { ring: '#a4b1b8', bg: 'bg-slate-400', icon: <Minus className="h-3 w-3" /> };
    case 'pending': return { ring: '', bg: 'bg-slate-300', icon: null };
    default: return null;
  }
};

const StatusBadge: React.FC<{ status?: string; className?: string }> = ({ status, className }) => {
  const t = statusTone(status);
  if (!t || !t.icon) return null;
  return <span title={status} className={cx('absolute z-10 flex h-5 w-5 items-center justify-center rounded-full text-white ring-2 ring-white shadow', t.bg, className)}>{t.icon}</span>;
};

const handleCls = '!h-2.5 !w-2.5 !border-2 !border-white !bg-slate-400 hover:!bg-[#0067df]';

/* ───────────────────────── Node renderers ───────────────────────── */

export interface StudioNodeData {
  type: string;
  label?: string;
  sub?: string;          // implementation detail line (agent name, connector op, …)
  status?: string;       // run overlay
  issue?: boolean;       // validation highlight
  readOnly?: boolean;
  config?: any;
}

const TaskNode: React.FC<{ data: StudioNodeData; selected: boolean }> = ({ data, selected }) => {
  const def = activityOf(data.type);
  const Icon = def.icon;
  const tone = statusTone(data.status);
  const isCall = data.type === 'subflow';
  return (
    <div className={cx('relative w-[200px] rounded-md bg-white px-3 py-2.5 transition-shadow',
      isCall ? 'border-[3px]' : 'border-[1.5px]',
      selected ? 'shadow-[0_0_0_3px_rgba(0,103,223,0.18)]' : 'shadow-sm hover:shadow')}
      style={{ borderColor: data.issue ? '#cc3d45' : selected ? '#0067df' : tone?.ring || '#a4b1b8' }}>
      <Handle type="target" position={Position.Left} className={cx(handleCls, data.readOnly && '!opacity-0')} />
      <StatusBadge status={data.status} className="-right-2 -top-2" />
      <div className="flex items-start gap-2">
        <span className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded" style={{ background: `${def.color}14`, color: def.color }}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 break-words text-[13px] font-semibold leading-tight text-slate-900" title={data.label}>{data.label || def.name}</div>
          <div className="mt-0.5 truncate text-[11.5px] leading-tight text-slate-500" title={data.sub || def.name}>{data.sub || def.name}</div>
        </div>
      </div>
      {isCall && <span className="absolute -bottom-[9px] left-1/2 flex h-3.5 w-3.5 -translate-x-1/2 items-center justify-center border border-slate-500 bg-white text-slate-600"><Plus className="h-2.5 w-2.5" /></span>}
      <Handle type="source" position={Position.Right} className={cx(handleCls, data.readOnly && '!opacity-0')} />
    </div>
  );
};

const EventNode: React.FC<{ data: StudioNodeData; selected: boolean }> = ({ data, selected }) => {
  const def = activityOf(data.type);
  const tone = statusTone(data.status);
  const border = data.type === 'end' ? 'border-[4px]' : 'border-[2px]';
  const color = data.issue ? '#cc3d45' : selected ? '#0067df' : tone?.ring || (data.type === 'start' ? '#038108' : data.type === 'end' ? '#cc3d45' : '#526069');
  return (
    <div className="relative flex w-[110px] flex-col items-center">
      <div className={cx('relative flex h-11 w-11 items-center justify-center rounded-full bg-white', border, selected && 'shadow-[0_0_0_4px_rgba(0,103,223,0.18)]')} style={{ borderColor: color }}>
        {data.type !== 'start' && <Handle type="target" position={Position.Left} className={cx(handleCls, data.readOnly && '!opacity-0')} />}
        {data.type === 'timer' && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-[1.5px]" style={{ borderColor: color }}>
            <Timer className="h-4 w-4" style={{ color }} />
          </div>
        )}
        <StatusBadge status={data.status} className="-right-2 -top-2" />
        {data.type !== 'end' && <Handle type="source" position={Position.Right} className={cx(handleCls, data.readOnly && '!opacity-0')} />}
      </div>
      <div className="mt-1.5 max-w-[130px] text-center text-[12px] font-medium leading-tight text-slate-700" title={data.label}>{data.label || def.name}</div>
      {data.sub && <div className="max-w-[130px] truncate text-center text-[11px] text-slate-500">{data.sub}</div>}
    </div>
  );
};

const GatewayNode: React.FC<{ data: StudioNodeData; selected: boolean }> = ({ data, selected }) => {
  const def = activityOf(data.type);
  const Icon = def.icon;
  const tone = statusTone(data.status);
  const color = data.issue ? '#cc3d45' : selected ? '#0067df' : tone?.ring || '#8a6100';
  return (
    <div className="relative flex w-[110px] flex-col items-center">
      <div className="relative h-12 w-12">
        <div className={cx('absolute inset-[6px] rotate-45 rounded-[3px] border-[2px] bg-white', selected && 'shadow-[0_0_0_4px_rgba(0,103,223,0.18)]')} style={{ borderColor: color }} />
        <Icon className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2" style={{ color }} strokeWidth={2.75} />
        <Handle type="target" position={Position.Left} className={cx(handleCls, '!left-0', data.readOnly && '!opacity-0')} />
        <Handle type="source" position={Position.Right} className={cx(handleCls, '!right-0', data.readOnly && '!opacity-0')} />
        <StatusBadge status={data.status} className="-right-2 -top-1" />
      </div>
      <div className="mt-1 max-w-[130px] text-center text-[12px] font-medium leading-tight text-slate-700" title={data.label}>{data.label || def.name}</div>
    </div>
  );
};

const ShapeNode: React.FC<{ data: StudioNodeData; selected: boolean }> = (p) => {
  const shape = activityOf(p.data.type).shape;
  if (shape === 'event') return <EventNode {...p} />;
  if (shape === 'gateway') return <GatewayNode {...p} />;
  return <TaskNode {...p} />;
};

// Stable object (React Flow warns when nodeTypes changes identity).
export const studioNodeTypes = { studio: ShapeNode };

/* ───────────────────────── Edges ───────────────────────── */

export const EDGE_COLORS: Record<string, string> = {
  sequence: '#7a8a99', conditional: '#7a8a99', parallel: '#7a8a99', outcome: '#7a8a99', escalation: '#b35c00', default: '#7a8a99',
};

export const styleEdge = (e: Partial<Edge> & { id: string; source: string; target: string }, opts: { kind?: string; label?: string; active?: boolean; taken?: boolean; isDefault?: boolean } = {}): Edge => {
  const kind = opts.kind || (e.data as any)?.kind || 'sequence';
  const color = opts.taken ? '#038108' : opts.active ? '#0067df' : EDGE_COLORS[kind] || '#7a8a99';
  const label = opts.label ?? (e.label as string | undefined);
  return {
    ...e,
    type: 'smoothstep',
    label: label ? (opts.isDefault ? `${label} (default)` : label) : opts.isDefault ? 'default' : undefined,
    labelStyle: { fontSize: 11.5, fill: '#273139', fontWeight: 500 },
    labelBgStyle: { fill: '#ffffff', stroke: '#cfd8dd', strokeWidth: 1 },
    labelBgPadding: [6, 3] as [number, number],
    labelBgBorderRadius: 4,
    markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
    style: { stroke: color, strokeWidth: opts.taken || opts.active ? 2 : 1.5, strokeDasharray: kind === 'escalation' ? '6 4' : undefined },
    data: { ...(e.data as any), kind },
  } as Edge;
};

/* ───────────────────────── Auto layout ───────────────────────── */

// Simple layered left-to-right layout ("Tidy up"): longest-path layering from the entry node,
// nodes in the same layer stacked vertically. Good enough for process diagrams of this size.
export const autoLayout = (nodes: Node[], edges: { source: string; target: string }[], gapX = 250, gapY = 120): Node[] => {
  if (!nodes.length) return nodes;
  const ids = nodes.map(n => n.id);
  const incoming: Record<string, number> = {};
  const out: Record<string, string[]> = {};
  ids.forEach(id => { incoming[id] = 0; out[id] = []; });
  edges.forEach(e => { if (out[e.source] && incoming[e.target] !== undefined) { out[e.source].push(e.target); incoming[e.target]++; } });
  const layer: Record<string, number> = {};
  const roots = ids.filter(id => incoming[id] === 0);
  const queue = roots.length ? [...roots] : [ids[0]];
  queue.forEach(id => (layer[id] = 0));
  const visits: Record<string, number> = {};
  while (queue.length) {
    const id = queue.shift()!;
    visits[id] = (visits[id] || 0) + 1;
    if (visits[id] > ids.length) continue; // cycle guard
    for (const t of out[id] || []) {
      if ((layer[t] ?? -1) < layer[id] + 1) { layer[t] = layer[id] + 1; queue.push(t); }
    }
  }
  ids.forEach(id => { if (layer[id] === undefined) layer[id] = 0; });
  const byLayer: Record<number, string[]> = {};
  ids.forEach(id => { (byLayer[layer[id]] ||= []).push(id); });
  const pos: Record<string, { x: number; y: number }> = {};
  Object.entries(byLayer).forEach(([l, list]) => {
    const n = list.length;
    list.forEach((id, i) => { pos[id] = { x: Number(l) * gapX, y: (i - (n - 1) / 2) * gapY }; });
  });
  return nodes.map(n => ({ ...n, position: pos[n.id] || n.position }));
};
