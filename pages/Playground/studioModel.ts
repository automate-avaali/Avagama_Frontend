// Conversion between the Playground flow definition (contract P-04 / section E) and the canvas model,
// plus the routing rules that keep gateway / user-task outcomes in step with the connected paths.
import { Edge, Node } from 'reactflow';
import { activityOf, autoLayout, styleEdge } from '../../components/studio/bpmn';

export interface DataManager {
  arguments: { name: string; direction: 'in' | 'out' | 'inout'; type: string; required?: boolean; default?: any; description?: string }[];
  variables: { name: string; type: string; default?: any; description?: string }[];
}
export const emptyDataManager = (): DataManager => ({ arguments: [], variables: [] });

export const TERMINAL_RUN = ['completed', 'failed', 'cancelled'];
export const ACTIVE_RUN = ['queued', 'running', 'waiting_approval'];

export const newNodeId = (type: string, existing: string[]) => {
  const base = type.replace(/[^a-z_]/gi, '').slice(0, 10) || 'node';
  let i = 1;
  while (existing.includes(`${base}_${i}`)) i++;
  return `${base}_${i}`;
};

export const defaultConfigFor = (type: string): any => {
  switch (type) {
    case 'agent': return { agent_id: '', input_map: [{ k: 'message', v: '' }], output_var: '', timeout_ms: 300000 };
    case 'connector': return { connector: '', operation: '', input_map: [], output_var: '' };
    // New API tasks stop the instance on a 4xx / 5xx (contract E: fail_on_error); existing ones keep the old behaviour.
    case 'api_call': return { url: '', method: 'GET', headers: {}, input_map: [], output_var: '', fail_on_error: true };
    case 'transform': return { assign: [{ to: '', from: '' }] };
    case 'condition': return { outcomes: [], default_route: '' };
    case 'timer': return { mode: 'delay', duration: '30s' };
    case 'subflow': return { flow_id: '', input_map: [], output_var: '' };
    case 'human_task': return { title: '', assignees: '', approval_message: '', outcomes: [] };
    case 'human_approval': return { approval_message: '' };
    default: return undefined;
  }
};

// Short implementation line shown under a task's name on the canvas.
export const subLabelFor = (type: string, config: any, lookups: { agents: any[]; connectors: any[]; flows: any[] }): string => {
  const c = config || {};
  switch (type) {
    case 'agent': {
      const a = lookups.agents.find(x => (x._id || x.id) === c.agent_id);
      return a ? `Agent · ${a.name}` : c.agent_id ? 'Agent · (unpublished)' : 'No agent selected';
    }
    case 'connector': {
      const k = lookups.connectors.find(x => x.key === c.connector);
      return c.connector ? `${k?.name || c.connector}${c.operation ? ` · ${c.operation}` : ''}` : 'No connector selected';
    }
    case 'api_call': return c.url ? `${(c.method || 'GET').toUpperCase()} ${String(c.url).replace(/^https?:\/\//, '')}` : 'No URL set';
    case 'timer': return c.mode === 'until' ? `Until ${c.duration || c.until || '…'}` : `Wait ${c.duration || '…'}`;
    case 'subflow': {
      const f = lookups.flows.find(x => x._id === c.flow_id);
      return f ? `Process · ${f.name}` : 'No process selected';
    }
    case 'human_task': return c.assignees ? `Assigned to ${c.assignees}` : (c.title || 'User task');
    case 'transform': return `${(c.assign || []).filter((a: any) => a.to).length || Object.keys(c.set || c.add || {}).length} assignment(s)`;
    default: return '';
  }
};

export const flowToCanvas = (graph: any, lookups: { agents: any[]; connectors: any[]; flows: any[] }, readOnly = false): { nodes: Node[]; edges: Edge[] } => {
  const gNodes: any[] = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const gEdges: any[] = Array.isArray(graph?.edges) ? graph.edges : [];
  let nodes: Node[] = gNodes.map((n: any) => ({
    id: n.node_id,
    type: 'studio',
    position: { x: Number(n.x) || 0, y: Number(n.y) || 0 },
    data: { type: n.type, label: n.label, config: n.config, sub: subLabelFor(n.type, n.config, lookups), readOnly },
    draggable: !readOnly,
    connectable: !readOnly,
  }));
  const edges: Edge[] = gEdges.map((e: any, i: number) => ({
    id: e.edge_id || `e_${e.from}_${e.to}_${i}`,
    source: e.from,
    target: e.to,
    label: e.label,
    data: { kind: e.kind || 'sequence', outcome: e.outcome, condition: e.condition },
  } as Edge));
  // Solution templates and AI-built flows can arrive without coordinates — lay them out.
  const unplaced = nodes.length > 1 && nodes.every(n => n.position.x === 0 && n.position.y === 0);
  if (unplaced) nodes = autoLayout(nodes, edges.map(e => ({ source: e.source, target: e.target })));
  return { nodes, edges: decorateEdges(nodes, edges) };
};

// Derive each edge's visible label/kind from its source node's routing config.
export const decorateEdges = (nodes: Node[], edges: Edge[], overlay?: { taken?: Set<string> }): Edge[] => {
  const byId = new Map(nodes.map(n => [n.id, n]));
  return edges.map(e => {
    const src = byId.get(e.source);
    const t = src?.data?.type;
    const cfg = src?.data?.config || {};
    const taken = overlay?.taken?.has(`${e.source}->${e.target}`);
    if (t === 'condition') {
      const oc = (cfg.outcomes || []).find((o: any) => o.route === e.target);
      return styleEdge(e as any, { kind: 'conditional', label: oc?.label || '', isDefault: cfg.default_route === e.target, taken });
    }
    if (t === 'human_task') {
      if (cfg.escalate_to && cfg.escalate_to === e.target) return styleEdge(e as any, { kind: 'escalation', label: 'Escalate', taken });
      const oc = (cfg.outcomes || []).find((o: any) => o.route === e.target);
      return styleEdge(e as any, { kind: 'sequence', label: oc?.label || '', taken });
    }
    if (t === 'parallel') return styleEdge(e as any, { kind: 'parallel', label: '', taken });
    return styleEdge(e as any, { kind: (e.data as any)?.kind === 'escalation' ? 'escalation' : 'sequence', label: (e.data as any)?.label ?? (e.label as string) ?? '', taken });
  });
};

// Drop routes that point at paths which no longer exist, so the saved config always matches the diagram.
export const syncRouting = (nodes: Node[], edges: Edge[]): Node[] => nodes.map(n => {
  const t = n.data?.type;
  if (t !== 'condition' && t !== 'human_task') return n;
  const targets = new Set(edges.filter(e => e.source === n.id).map(e => e.target));
  const cfg = { ...(n.data.config || {}) };
  cfg.outcomes = (cfg.outcomes || []).filter((o: any) => !o.route || targets.has(o.route));
  if (t === 'condition' && cfg.default_route && !targets.has(cfg.default_route)) cfg.default_route = '';
  // The default path needs no condition; a path without a condition (other than the default) is incomplete
  // and is left for validation to report. User-task outcomes need a button label.
  if (t === 'condition') cfg.outcomes = cfg.outcomes.filter((o: any) => !(o.route === cfg.default_route && !String(o.when || '').trim()));
  if (t === 'human_task') cfg.outcomes = cfg.outcomes.filter((o: any) => String(o.label || '').trim());
  if (t === 'human_task' && cfg.escalate_to && !targets.has(cfg.escalate_to)) cfg.escalate_to = '';
  return { ...n, data: { ...n.data, config: cfg } };
});

const cleanConfig = (type: string, config: any) => {
  if (config == null) return undefined;
  const c: any = { ...config };
  Object.keys(c).forEach(k => {
    const v = c[k];
    if (v === '' || v === undefined || v === null) delete c[k];
    else if (Array.isArray(v)) {
      const filtered = v.filter((r: any) => !(r && typeof r === 'object' && Object.values(r).every(x => x === '' || x == null)));
      if (filtered.length) c[k] = filtered; else delete c[k];
    }
  });
  if (type === 'human_task' && c.sla_breach === 'none') delete c.sla_breach;
  if (c.headers && typeof c.headers === 'object' && !Object.keys(c.headers).length) delete c.headers;
  return Object.keys(c).length ? c : undefined;
};

export const canvasToGraph = (nodes: Node[], edges: Edge[]) => {
  const synced = syncRouting(nodes, edges);
  const byId = new Map(synced.map(n => [n.id, n]));
  return {
    nodes: synced.map(n => {
      const config = cleanConfig(n.data.type, n.data.config);
      return {
        node_id: n.id,
        type: n.data.type,
        label: n.data.label || activityOf(n.data.type).name,
        x: Math.round(n.position.x),
        y: Math.round(n.position.y),
        ...(config ? { config } : {}),
      };
    }),
    edges: edges.map(e => {
      const src = byId.get(e.source);
      const t = src?.data?.type;
      const cfg = src?.data?.config || {};
      let kind = 'sequence';
      let label: string | undefined;
      let outcome: string | undefined;
      let condition: string | undefined;
      if (t === 'condition') {
        kind = 'conditional';
        const oc = (cfg.outcomes || []).find((o: any) => o.route === e.target);
        label = oc?.label || (cfg.default_route === e.target ? 'default' : undefined);
        outcome = oc?.label;
        condition = oc?.when;
      } else if (t === 'parallel') {
        kind = 'parallel';
      } else if (t === 'human_task') {
        if (cfg.escalate_to === e.target) { kind = 'escalation'; label = 'Escalate'; }
        else { const oc = (cfg.outcomes || []).find((o: any) => o.route === e.target); label = oc?.label; outcome = oc?.label; }
      } else {
        label = (e.data as any)?.label || undefined;
      }
      return {
        edge_id: e.id,
        from: e.source,
        to: e.target,
        kind,
        ...(label ? { label } : {}),
        ...(outcome ? { outcome } : {}),
        ...(condition ? { condition } : {}),
      };
    }),
  };
};

// Template tokens a user can insert into input mappings / templates (contract section E).
export const templateTokens = (dm: DataManager, nodes: Node[], currentId?: string) => {
  const tokens: { token: string; group: string }[] = [];
  dm.arguments.filter(a => a.name && a.direction !== 'out').forEach(a => tokens.push({ token: `{{args.${a.name}}}`, group: 'Arguments' }));
  dm.variables.filter(v => v.name).forEach(v => tokens.push({ token: `{{vars.${v.name}}}`, group: 'Variables' }));
  nodes.filter(n => n.id !== currentId && ['agent', 'connector', 'api_call', 'subflow'].includes(n.data?.type)).forEach(n => {
    const ov = n.data?.config?.output_var;
    if (ov) tokens.push({ token: `{{vars.${ov}}}`, group: 'Step outputs' });
    tokens.push({ token: `{{nodes.${n.id}.output}}`, group: 'Step outputs' });
  });
  tokens.push({ token: '{{runtime.now}}', group: 'Runtime' }, { token: '{{runtime.date}}', group: 'Runtime' });
  return tokens;
};

// Which issue text refers to which step (issue texts include the step label — contract P-10).
export const nodesMentionedIn = (issues: string[], nodes: Node[]) => {
  const hit = new Set<string>();
  issues.forEach(msg => nodes.forEach(n => {
    const label = n.data?.label;
    if ((label && msg.includes(`"${label}"`)) || msg.includes(`"${n.id}"`)) hit.add(n.id);
  }));
  return hit;
};

// Edges that were actually traversed in a run (both ends executed) — drawn green on the canvas.
export const takenEdgesFromRun = (run: any, edges: Edge[]) => {
  const done = new Set((run?.nodes || []).filter((n: any) => ['completed', 'running', 'waiting_approval', 'failed'].includes(n.status)).map((n: any) => n.node_id));
  const routes: Record<string, string> = {};
  (run?.nodes || []).forEach((n: any) => { if (n.route) routes[n.node_id] = n.route; });
  const taken = new Set<string>();
  edges.forEach(e => {
    if (!done.has(e.source) || !done.has(e.target)) return;
    if (routes[e.source] && routes[e.source] !== e.target) return;
    taken.add(`${e.source}->${e.target}`);
  });
  return taken;
};

export const parseJsonSafe = (text: string): { ok: true; value: any } | { ok: false; error: string } => {
  if (!text.trim()) return { ok: true, value: {} };
  try { return { ok: true, value: JSON.parse(text) }; } catch (e: any) { return { ok: false, error: e.message }; }
};

export const coerceArg = (type: string, raw: any) => {
  if (raw === '' || raw === undefined) return undefined;
  if (type === 'number') { const n = Number(raw); return isNaN(n) ? raw : n; }
  if (type === 'boolean') return raw === true || raw === 'true';
  if (type === 'object' || type === 'array') { try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return raw; } }
  return raw;
};
