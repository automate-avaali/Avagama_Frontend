// Right-hand Properties panel (one form per activity, matching contract section E) and the Data Manager.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Edge, Node } from 'reactflow';
import { Braces, Plus, Trash2, X, Info, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { apiService } from '../../services/api';
import { activityOf } from '../../components/studio/bpmn';
import { Button, Callout, CopyButton, Field, IconButton, Input, JsonBlock, Modal, Select, StatusPill, Tag, TextArea, Toggle, cx, fmtDuration } from '../../components/studio/ui';
import { DataManager, templateTokens } from './studioModel';
import { ValueView } from '../../components/studio/valueView';

const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

/* ───────────────────────── small building blocks ───────────────────────── */

const Section: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean; right?: React.ReactNode }> = ({ title, children, defaultOpen = true, right }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-200">
      <div className="flex w-full items-center gap-1.5 px-4 py-2.5">
        <button type="button" onClick={() => setOpen(o => !o)} className="flex flex-1 items-center gap-1.5 text-left text-[12.5px] font-semibold uppercase tracking-wide text-slate-600 hover:text-slate-900">
          <ChevronRight className={cx('h-3.5 w-3.5 transition-transform', open && 'rotate-90')} />{title}
        </button>
        {right}
      </div>
      {open && <div className="space-y-3 px-4 pb-4">{children}</div>}
    </div>
  );
};

export const TokenPicker: React.FC<{ tokens: { token: string; group: string }[]; onPick: (t: string) => void }> = ({ tokens, onPick }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as any)) setOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const groups = Array.from(new Set(tokens.map(t => t.group)));
  return (
    <div className="relative shrink-0" ref={ref}>
      <IconButton label="Insert variable" onClick={() => setOpen(o => !o)} type="button"><Braces className="h-4 w-4" /></IconButton>
      {open && (
        <div className="absolute right-0 z-50 mt-1 max-h-72 w-64 overflow-y-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {tokens.length === 0 && <div className="px-3 py-2 text-[12.5px] text-slate-500">Add arguments or variables in the Data Manager first.</div>}
          {groups.map(g => (
            <div key={g}>
              <div className="px-3 pb-0.5 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{g}</div>
              {tokens.filter(t => t.group === g).map(t => (
                <button key={t.token} type="button" onClick={() => { onPick(t.token); setOpen(false); }} className="block w-full truncate px-3 py-1 text-left font-mono text-[12px] text-slate-700 hover:bg-slate-50">{t.token}</button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Large editor for long templates / prompts / JSON — opened from any template field's expand button.
const BigEditor: React.FC<{ open: boolean; title: string; value: string; tokens: any[]; mono?: boolean; onClose: () => void; onApply: (v: string) => void }> = ({ open, title, value, tokens, mono, onClose, onApply }) => {
  const [draft, setDraft] = useState(value || '');
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (open) setDraft(value || ''); }, [open, value]);
  const insert = (t: string) => {
    const el = ref.current;
    if (!el) { setDraft(d => d + t); return; }
    const s = el.selectionStart ?? draft.length, e = el.selectionEnd ?? draft.length;
    const next = draft.slice(0, s) + t + draft.slice(e);
    setDraft(next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + t.length, s + t.length); });
  };
  const groups = Array.from(new Set(tokens.map((t: any) => t.group)));
  return (
    <Modal open={open} onClose={onClose} title={title} subtitle="Edit in a larger view. Click a variable to insert it at the cursor." width={980}
      footer={<><span className="mr-auto text-[12px] text-slate-500">{draft.length} characters</span><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={() => { onApply(draft); onClose(); }}>Apply</Button></>}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_240px]">
        <TextArea ref={ref} rows={18} value={draft} onChange={e => setDraft(e.target.value)} className={cx('min-h-[360px]', mono ? 'font-mono text-[13px]' : 'text-[14px]')} autoFocus />
        <div className="max-h-[440px] overflow-y-auto rounded-md border border-slate-200">
          <div className="sticky top-0 border-b border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-semibold uppercase tracking-wide text-slate-500">Insert variable</div>
          {tokens.length === 0 && <div className="px-3 py-2 text-[12.5px] text-slate-400">No arguments or variables yet.</div>}
          {groups.map(g => (
            <div key={g} className="py-1">
              <div className="px-3 pb-0.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{g}</div>
              {tokens.filter((t: any) => t.group === g).map((t: any) => (
                <button key={t.token} type="button" onClick={() => insert(t.token)} className="block w-full truncate px-3 py-1 text-left font-mono text-[12.5px] text-slate-700 hover:bg-[var(--sx-primary-soft)] hover:text-[var(--sx-primary)]" title={t.token}>{t.token}</button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

const TemplateInput: React.FC<{ value: string; onChange: (v: string) => void; tokens: any[]; placeholder?: string; multiline?: boolean; mono?: boolean; title?: string }> = ({ value, onChange, tokens, placeholder, multiline, mono, title = 'Edit value' }) => {
  const [big, setBig] = useState(false);
  return (
    <div className="flex items-start gap-0.5">
      {multiline
        ? <TextArea rows={3} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cx(mono && 'font-mono text-[12.5px]')} title={value || ''} />
        : <Input value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cx(mono && 'font-mono text-[12.5px]')} title={value || ''} />}
      <TokenPicker tokens={tokens} onPick={t => onChange(`${value || ''}${t}`)} />
      <IconButton label="Expand editor" type="button" onClick={() => setBig(true)}><Maximize2 className="h-4 w-4" /></IconButton>
      <BigEditor open={big} title={title} value={value || ''} tokens={tokens} mono={mono} onClose={() => setBig(false)} onApply={onChange} />
    </div>
  );
};

// input_map rows: [{ k, v:'{{vars.x}}' }] — stacked so long names and templates stay readable.
const InputMapEditor: React.FC<{ rows: any[]; onChange: (r: any[]) => void; tokens: any[]; keySuggestions?: string[]; keyPlaceholder?: string }> = ({ rows = [], onChange, tokens, keySuggestions = [], keyPlaceholder = 'parameter' }) => {
  const list = Array.isArray(rows) ? rows : [];
  const listId = useMemo(() => `km-${Math.random().toString(36).slice(2, 8)}`, []);
  return (
    <div className="space-y-2">
      {list.length === 0 && <div className="rounded-md border border-dashed border-slate-200 px-3 py-2 text-[12.5px] text-slate-400">No inputs mapped.</div>}
      {list.map((r, i) => (
        <div key={i} className="space-y-1.5 rounded-md border border-slate-200 bg-slate-50/60 p-2">
          <div className="flex items-center gap-1.5">
            <span className="w-[52px] shrink-0 text-[11.5px] font-semibold uppercase tracking-wide text-slate-500">Input</span>
            <Input className="font-mono text-[12.5px]" list={listId} value={r.k || ''} placeholder={keyPlaceholder} title={r.k || ''} onChange={e => { const n = [...list]; n[i] = { ...r, k: e.target.value }; onChange(n); }} />
            <IconButton label="Remove input" tone="danger" onClick={() => onChange(list.filter((_, j) => j !== i))}><X className="h-4 w-4" /></IconButton>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="mt-2 w-[52px] shrink-0 text-[11.5px] font-semibold uppercase tracking-wide text-slate-500">Value</span>
            <div className="min-w-0 flex-1"><TemplateInput value={r.v || ''} tokens={tokens} title={`Input · ${r.k || 'value'}`} placeholder="{{args.x}} or text" onChange={v => { const n = [...list]; n[i] = { ...r, v }; onChange(n); }} /></div>
          </div>
        </div>
      ))}
      <datalist id={listId}>{keySuggestions.map(k => <option key={k} value={k} />)}</datalist>
      <Button size="sm" variant="ghost" icon={<Plus className="h-4 w-4" />} onClick={() => onChange([...list, { k: '', v: '' }])}>Add input</Button>
    </div>
  );
};

// [{ to:'vars.x'|'args.x', from:'…' }] — stacked: target on one line, value below.
const AssignEditor: React.FC<{ rows: any[]; onChange: (r: any[]) => void; dm: DataManager; fromPlaceholder: string; tokens?: any[] }> = ({ rows = [], onChange, dm, fromPlaceholder, tokens }) => {
  const list = Array.isArray(rows) ? rows : [];
  const targets = [...dm.variables.filter(v => v.name).map(v => `vars.${v.name}`), ...dm.arguments.filter(a => a.name && a.direction !== 'in').map(a => `args.${a.name}`)];
  return (
    <div className="space-y-2">
      {list.length === 0 && <div className="rounded-md border border-dashed border-slate-200 px-3 py-2 text-[12.5px] text-slate-400">No assignments.</div>}
      {list.map((r, i) => (
        <div key={i} className="space-y-1.5 rounded-md border border-slate-200 bg-slate-50/60 p-2">
          <div className="flex items-center gap-1.5">
            <span className="w-[36px] shrink-0 text-[11.5px] font-semibold uppercase tracking-wide text-slate-500">Set</span>
            <Select className="font-mono text-[12.5px]" value={r.to || ''} title={r.to || ''} onChange={e => { const n = [...list]; n[i] = { ...r, to: e.target.value }; onChange(n); }}>
              <option value="">Choose a variable or out-argument…</option>
              {targets.map(t => <option key={t} value={t}>{t}</option>)}
              {r.to && !targets.includes(r.to) && <option value={r.to}>{r.to}</option>}
            </Select>
            <IconButton label="Remove assignment" tone="danger" onClick={() => onChange(list.filter((_, j) => j !== i))}><X className="h-4 w-4" /></IconButton>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="mt-2 w-[36px] shrink-0 text-[11.5px] font-semibold uppercase tracking-wide text-slate-500">To</span>
            <div className="min-w-0 flex-1">
              {tokens ? <TemplateInput value={r.from || ''} tokens={tokens} title={`Assignment · ${r.to || 'value'}`} placeholder={fromPlaceholder} mono onChange={v => { const n = [...list]; n[i] = { ...r, from: v }; onChange(n); }} />
                : <Input className="font-mono text-[12.5px]" value={r.from || ''} placeholder={fromPlaceholder} title={r.from || ''} onChange={e => { const n = [...list]; n[i] = { ...r, from: e.target.value }; onChange(n); }} />}
            </div>
          </div>
        </div>
      ))}
      {targets.length === 0 && <div className="text-[12px] text-amber-700">Add a variable or out-argument in the Data Manager to assign to.</div>}
      <Button size="sm" variant="ghost" icon={<Plus className="h-4 w-4" />} onClick={() => onChange([...list, { to: '', from: '' }])}>Add assignment</Button>
    </div>
  );
};

// http: API task — its result is the whole response { status, ok, body }, so fields live under body.
const OutputSection: React.FC<{ cfg: any; set: (p: any) => void; dm: DataManager; http?: boolean }> = ({ cfg, set, dm, http }) => {
  const ov = cfg.output_var || '';
  const bad = ov && !IDENT.test(ov);
  return (
    <Section title="Output">
      <Field label="Save result to variable" hint={bad ? undefined : ov ? <>Use it later as <code className="font-mono text-[var(--sx-primary)]">{http ? `{{vars.${ov}.body.…}}` : `{{vars.${ov}}}`}</code>{http && <> — the response is saved as <code className="font-mono">{'{ status, ok, body }'}</code></>}</> : http ? <>Name the result so later steps can use it. The response is saved as <code className="font-mono">{'{ status, ok, body }'}</code>.</> : 'Name the result so later steps can use it.'} error={bad ? 'Letters, digits and _ only; cannot start with a digit.' : undefined}>
        <Input value={ov} onChange={e => set({ output_var: e.target.value })} placeholder="e.g. extracted_invoice" className="font-mono text-[12.5px]" />
      </Field>
      <details className="group">
        <summary className="cursor-pointer select-none text-[12.5px] font-medium text-slate-600 hover:text-slate-900">Advanced: map fields of the result</summary>
        <div className="mt-2 space-y-1">
          <div className="text-[12px] text-slate-500">Copy individual fields with a JSON path, e.g. <code className="font-mono">{http ? '$.body.total' : '$.total'}</code>{http && <> (or <code className="font-mono">$.status</code> for the HTTP status code)</>}.</div>
          <AssignEditor rows={cfg.output_assign} onChange={r => set({ output_assign: r })} dm={dm} fromPlaceholder={http ? '$.body.field' : '$.field'} />
        </div>
      </details>
    </Section>
  );
};

// http: API task — also offers fail_on_error (a 4xx / 5xx response fails the step).
const ReliabilitySection: React.FC<{ cfg: any; set: (p: any) => void; http?: boolean }> = ({ cfg, set, http }) => (
  <Section title="Error handling" defaultOpen={false}>
    {http && (
      <div className="space-y-1">
        <Toggle checked={!!cfg.fail_on_error} onChange={v => set({ fail_on_error: v })} label="Fail the step on an HTTP error (4xx / 5xx)" />
        <div className="text-[12px] text-slate-500">
          {cfg.fail_on_error
            ? 'The instance stops with an incident; retries below apply.'
            : <>The step completes anyway — check <code className="font-mono">{`{{vars.${cfg.output_var || 'result'}.ok}}`}</code> in a gateway to handle errors.</>}
        </div>
      </div>
    )}
    <div className="grid grid-cols-2 gap-2">
      <Field label="Timeout per attempt (ms)" hint="Default 300000 (5 min)"><Input type="number" min={1000} value={cfg.timeout_ms ?? ''} placeholder="300000" onChange={e => set({ timeout_ms: e.target.value === '' ? undefined : Number(e.target.value) })} /></Field>
      <Field label="Retries (0–5)"><Input type="number" min={0} max={5} value={cfg.retry?.max ?? ''} placeholder="0" onChange={e => set({ retry: e.target.value === '' ? undefined : { ...(cfg.retry || {}), max: Math.min(5, Math.max(0, Number(e.target.value))) } })} /></Field>
    </div>
    {(cfg.retry?.max ?? 0) > 0 && <Field label="Wait between retries (ms)"><Input type="number" min={0} value={cfg.retry?.backoff_ms ?? ''} placeholder="1000" onChange={e => set({ retry: { ...(cfg.retry || {}), backoff_ms: e.target.value === '' ? undefined : Number(e.target.value) } })} /></Field>}
  </Section>
);

/* ───────────────────────── Properties panel ───────────────────────── */

export interface Lookups { agents: any[]; connectors: any[]; flows: any[]; nodeTypes: any[] }

interface Props {
  node: Node;
  nodes: Node[];
  edges: Edge[];
  dm: DataManager;
  lookups: Lookups;
  flowId?: string | null;
  runNode?: any;                       // this step's data from the active debug run
  onChange: (patch: { label?: string; config?: any }) => void;
  onDelete: () => void;
  onClose: () => void;
  onOpenDataManager: () => void;
  wide?: boolean;
  onToggleWide?: () => void;
}

export const PropertiesPanel: React.FC<Props> = ({ node, nodes, edges, dm, lookups, flowId, runNode, onChange, onDelete, onClose, onOpenDataManager, wide, onToggleWide }) => {
  const type = node.data?.type;
  const def = activityOf(type);
  const Icon = def.icon;
  const cfg = node.data?.config || {};
  const set = (patch: any) => onChange({ config: { ...cfg, ...patch } });
  const tokens = useMemo(() => templateTokens(dm, nodes, node.id), [dm, nodes, node.id]);
  const outgoing = edges.filter(e => e.source === node.id);
  const nodeLabel = (id: string) => nodes.find(n => n.id === id)?.data?.label || id;
  const catalogDesc = lookups.nodeTypes.find((t: any) => t.type === type)?.description;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start gap-2 border-b border-slate-200 px-4 py-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded" style={{ background: `${def.color}14`, color: def.color }}><Icon className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold text-slate-900">{def.name}</div>
          <div className="text-[12px] text-slate-500">{catalogDesc || def.action}</div>
        </div>
        {onToggleWide && <IconButton label={wide ? 'Narrow panel' : 'Expand panel'} onClick={onToggleWide}>{wide ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</IconButton>}
        <IconButton label="Close properties" onClick={onClose}><X className="h-4 w-4" /></IconButton>
      </div>

      <div className="flex-1 overflow-y-auto">
        {runNode && (
          <Section title="Execution (debug)">
            <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-slate-600">
              <StatusPill status={runNode.status} />
              {runNode.latency_ms != null && <span>{fmtDuration(runNode.latency_ms)}</span>}
              {(runNode.decision || runNode.outcome || runNode.route) && <Tag tone="purple">{runNode.outcome || runNode.decision || `→ ${runNode.route}`}</Tag>}
            </div>
            {runNode.error && <Callout tone="danger">{typeof runNode.error === 'string' ? runNode.error : JSON.stringify(runNode.error)}</Callout>}
            <div><div className="mb-1 text-[12px] font-medium text-slate-600">Input</div><ValueView value={runNode.input} title={`${node.data?.label || node.id} · input`} maxHeight={220} emptyLabel="No input" /></div>
            <div><div className="mb-1 text-[12px] font-medium text-slate-600">Output</div><ValueView value={runNode.output} title={`${node.data?.label || node.id} · output`} maxHeight={260} emptyLabel="No output" /></div>
          </Section>
        )}

        <Section title="General">
          <Field label="Name"><Input value={node.data?.label || ''} onChange={e => onChange({ label: e.target.value })} placeholder={def.name} /></Field>
          <div className="flex items-center justify-between rounded-md bg-slate-50 px-2.5 py-1.5 text-[12px] text-slate-500">
            <span>Element ID <span className="font-mono text-slate-700">{node.id}</span></span>
            <CopyButton text={node.id} />
          </div>
        </Section>

        {type === 'start' && (
          <Section title="In-arguments">
            <div className="text-[12.5px] text-slate-600">The instance input is validated against these arguments.</div>
            <div className="flex flex-wrap gap-1">{dm.arguments.filter(a => a.direction !== 'out').map(a => <Tag key={a.name} tone="blue">{a.name}{a.required ? ' *' : ''}: {a.type}</Tag>)}</div>
            {!dm.arguments.some(a => a.direction !== 'out') && <div className="text-[12.5px] text-slate-400">No in-arguments defined.</div>}
            <Button size="sm" onClick={onOpenDataManager}>Open Data Manager</Button>
          </Section>
        )}
        {type === 'end' && (
          <Section title="Out-arguments">
            <div className="text-[12.5px] text-slate-600">The instance output is the set of out-arguments.</div>
            <div className="flex flex-wrap gap-1">{dm.arguments.filter(a => a.direction !== 'in').map(a => <Tag key={a.name} tone="green">{a.name}: {a.type}</Tag>)}</div>
            {!dm.arguments.some(a => a.direction !== 'in') && <div className="text-[12.5px] text-slate-400">No out-arguments defined.</div>}
            <Button size="sm" onClick={onOpenDataManager}>Open Data Manager</Button>
          </Section>
        )}

        {type === 'agent' && (<>
          <Section title="Agent">
            {lookups.agents.length === 0 && <Callout tone="warning">No published agents found. Publish an agent in Agent Builder, then reopen this process.</Callout>}
            <Field label="Published agent" required>
              <Select value={cfg.agent_id || ''} onChange={e => set({ agent_id: e.target.value })}>
                <option value="">Select an agent…</option>
                {lookups.agents.map((a: any) => <option key={a._id || a.id} value={a._id || a.id}>{a.name}</option>)}
                {cfg.agent_id && !lookups.agents.some((a: any) => (a._id || a.id) === cfg.agent_id) && <option value={cfg.agent_id}>Unpublished agent ({String(cfg.agent_id).slice(-6)})</option>}
              </Select>
            </Field>
            {cfg.agent_spec && <Callout tone="info">Created from a template agent “{cfg.agent_spec.name}”.</Callout>}
            <Field label="Reply format" hint={cfg.output_mode === 'structured'
              ? 'Data for the next step: no chat formatting, citations or history, and no web search unless the agent allows it. A JSON object in the reply becomes the step output.'
              : 'Chat-style answer, the same as in the agent chat.'}>
              <Select value={cfg.output_mode || ''} onChange={e => set({ output_mode: e.target.value || undefined })}>
                <option value="">Chat reply</option>
                <option value="structured">Structured data for the next step</option>
              </Select>
            </Field>
          </Section>
          <Section title="Inputs"><InputMapEditor rows={cfg.input_map} onChange={r => set({ input_map: r })} tokens={tokens} keySuggestions={['message', 'input', 'document', 'context']} keyPlaceholder="message" /></Section>
          <OutputSection cfg={cfg} set={set} dm={dm} />
          <ReliabilitySection cfg={cfg} set={set} />
        </>)}

        {type === 'connector' && (() => {
          const conn = lookups.connectors.find((c: any) => c.key === cfg.connector);
          const op = conn?.operations?.find((o: any) => o.name === cfg.operation);
          const params = op?.parameters?.properties ? Object.keys(op.parameters.properties) : [];
          const required: string[] = op?.parameters?.required || [];
          const mapped = new Set((cfg.input_map || []).map((r: any) => r.k));
          return (<>
            <Section title="Connector">
              <Field label="Connector" required>
                <Select value={cfg.connector || ''} onChange={e => set({ connector: e.target.value, operation: '' })}>
                  <option value="">Select a connector…</option>
                  {lookups.connectors.map((c: any) => <option key={c.key} value={c.key}>{c.name}{c.configured === false ? ' (not configured)' : ''}</option>)}
                </Select>
              </Field>
              {conn && (
                <Field label="Activity (operation)" required>
                  <Select value={cfg.operation || ''} onChange={e => set({ operation: e.target.value })}>
                    <option value="">Select an activity…</option>
                    {(conn.operations || []).map((o: any) => <option key={o.name} value={o.name}>{o.name}</option>)}
                  </Select>
                </Field>
              )}
              {op?.description && <div className="text-[12px] text-slate-500 line-clamp-3">{op.description}</div>}
              {conn?.requires_connection && <Field label="Connection ID" hint="The connection to use for this connector."><Input value={cfg.connection_id || ''} onChange={e => set({ connection_id: e.target.value })} /></Field>}
              {conn?.configured === false && <Callout tone="warning">This connector is not configured on the server yet.</Callout>}
            </Section>
            <Section title="Inputs" right={required.some(r => !mapped.has(r)) ? <Button size="sm" variant="subtle" onClick={() => set({ input_map: [...(cfg.input_map || []), ...required.filter(r => !mapped.has(r)).map(k => ({ k, v: '' }))] })}>Add required</Button> : undefined}>
              {params.length > 0 && <div className="flex flex-wrap gap-1">{params.map(p => <Tag key={p} tone={required.includes(p) ? (mapped.has(p) ? 'green' : 'amber') : 'gray'}>{p}{required.includes(p) ? ' *' : ''}</Tag>)}</div>}
              <InputMapEditor rows={cfg.input_map} onChange={r => set({ input_map: r })} tokens={tokens} keySuggestions={params} />
            </Section>
            <OutputSection cfg={cfg} set={set} dm={dm} />
            <ReliabilitySection cfg={cfg} set={set} />
          </>);
        })()}

        {type === 'api_call' && (<>
          <Section title="Request">
            <div className="grid grid-cols-[96px_1fr] gap-2">
              <Field label="Method"><Select value={(cfg.method || 'GET').toUpperCase()} onChange={e => set({ method: e.target.value })}>{['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => <option key={m}>{m}</option>)}</Select></Field>
              <Field label="URL" required><TemplateInput value={cfg.url || ''} onChange={v => set({ url: v })} tokens={tokens} placeholder="https://api.example.com/items/{{vars.id}}" mono /></Field>
            </div>
            <Field label="Headers">
              <div className="space-y-2">
                {Object.entries(cfg.headers || {}).map(([k, v], i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <Input className="w-[40%] font-mono text-[12.5px]" value={k} onChange={e => { const h: any = {}; Object.entries(cfg.headers || {}).forEach(([kk, vv]) => { h[kk === k ? e.target.value : kk] = vv; }); set({ headers: h }); }} />
                    <div className="min-w-0 flex-1"><TemplateInput value={String(v)} tokens={tokens} mono onChange={nv => set({ headers: { ...(cfg.headers || {}), [k]: nv } })} /></div>
                    <IconButton label="Remove" tone="danger" onClick={() => { const h = { ...(cfg.headers || {}) }; delete h[k]; set({ headers: h }); }}><X className="h-4 w-4" /></IconButton>
                  </div>
                ))}
                <Button size="sm" variant="ghost" icon={<Plus className="h-4 w-4" />} onClick={() => { let n = 'Header'; let i = 1; while ((cfg.headers || {})[n]) n = `Header${++i}`; set({ headers: { ...(cfg.headers || {}), [n]: '' } }); }}>Add header</Button>
              </div>
            </Field>
            <Field label="Body" hint={(cfg.input_map || []).length ? 'Ignored — the request body is built from the inputs below.' : 'JSON or text. Templates allowed.'}>
              <TemplateInput value={typeof cfg.body === 'string' ? cfg.body : cfg.body ? JSON.stringify(cfg.body, null, 2) : ''} onChange={v => set({ body: v })} tokens={tokens} multiline mono placeholder='{ "id": "{{vars.id}}" }' />
            </Field>
            <div className="flex items-start gap-1.5 text-[12px] text-slate-500"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />Private / internal addresses are blocked and responses over 2 MB are rejected.</div>
          </Section>
          <Section title="Inputs (body fields)" defaultOpen={(cfg.input_map || []).length > 0}><InputMapEditor rows={cfg.input_map} onChange={r => set({ input_map: r })} tokens={tokens} /></Section>
          <OutputSection cfg={cfg} set={set} dm={dm} http />
          <ReliabilitySection cfg={cfg} set={set} http />
        </>)}

        {type === 'transform' && (
          <Section title="Assignments">
            <div className="text-[12.5px] text-slate-600">Set variables or out-arguments from templates, e.g. <code className="font-mono">{'{{vars.total}}'}</code>.</div>
            <AssignEditor rows={cfg.assign} onChange={r => set({ assign: r })} dm={dm} fromPlaceholder="{{vars.x}} or value" tokens={tokens} />
            {(cfg.set || cfg.add) && (
              <div className="space-y-1"><div className="text-[12px] font-medium text-slate-600">Static values (set / add)</div><JsonBlock value={cfg.set || cfg.add} maxHeight={140} /></div>
            )}
          </Section>
        )}

        {type === 'condition' && (
          <Section title="Paths">
            <div className="text-[12.5px] text-slate-600">Conditions are checked top to bottom; the first true path is taken. The default path is used when none match.</div>
            {outgoing.length === 0 && <Callout tone="warning">Connect this gateway to the next steps — each connection becomes a path.</Callout>}
            {outgoing.map(e => {
              const outs: any[] = cfg.outcomes || [];
              const oc = outs.find(o => o.route === e.target) || { label: '', when: '', route: e.target };
              const update = (p: any) => {
                const next = outs.some(o => o.route === e.target) ? outs.map(o => o.route === e.target ? { ...o, ...p } : o) : [...outs, { ...oc, ...p }];
                set({ outcomes: next });
              };
              const isDefault = cfg.default_route === e.target;
              return (
                <div key={e.id} className={cx('rounded-md border p-2.5 space-y-2', isDefault ? 'border-[var(--sx-primary)] bg-[var(--sx-primary-soft)]/40' : 'border-slate-200')}>
                  <div className="flex items-center justify-between gap-2 text-[12.5px]">
                    <span className="truncate text-slate-600">To <b className="text-slate-800">{nodeLabel(e.target)}</b></span>
                    <label className="flex items-center gap-1 text-slate-600"><input type="radio" checked={isDefault} onChange={() => set({ default_route: e.target })} /> Default</label>
                  </div>
                  <Input value={oc.label || ''} placeholder="Path name (e.g. High value)" onChange={ev => update({ label: ev.target.value })} />
                  {!isDefault && <TemplateInput value={oc.when || ''} onChange={v => update({ when: v })} tokens={tokens.filter(t => t.group !== 'Runtime')} placeholder="vars.score >= 70" mono />}
                </div>
              );
            })}
          </Section>
        )}

        {(type === 'parallel' || type === 'join') && (
          <Section title="Behaviour">
            <div className="text-[12.5px] text-slate-600">{type === 'parallel' ? 'All outgoing paths start at the same time. Close them with a Parallel join.' : 'Continues once every incoming path has finished.'}</div>
          </Section>
        )}

        {type === 'timer' && (
          <Section title="Timer">
            <Field label="Wait mode">
              <Select value={cfg.mode || 'delay'} onChange={e => set({ mode: e.target.value })}>
                <option value="delay">For a duration (delay)</option>
                <option value="until">Until a date / time (until)</option>
              </Select>
            </Field>
            {(cfg.mode || 'delay') === 'delay' ? (
              <Field label="Duration" required hint="30s · 15m · 2h · 3d · ISO 8601 like PT2H. Waits over 60 s survive restarts.">
                <Input value={cfg.duration || ''} onChange={e => set({ duration: e.target.value })} placeholder="15m" className="font-mono" />
              </Field>
            ) : (
              <Field label="Until" required hint="An ISO date, or a template such as {{vars.due_at}}.">
                <TemplateInput value={cfg.duration || cfg.until || ''} onChange={v => set({ duration: v })} tokens={tokens} placeholder="2026-12-31T09:00:00Z" mono />
              </Field>
            )}
          </Section>
        )}

        {type === 'subflow' && <SubflowSection cfg={cfg} set={set} lookups={lookups} flowId={flowId} tokens={tokens} dm={dm} />}

        {type === 'human_task' && (<>
          <Section title="Task">
            <Field label="Task title"><Input value={cfg.title || ''} onChange={e => set({ title: e.target.value })} placeholder="e.g. Approve high-value invoice" /></Field>
            <Field label="Assignees" hint="Who should act on this task (names, emails or a group)."><Input value={cfg.assignees || ''} onChange={e => set({ assignees: e.target.value })} placeholder="finance-approvers" /></Field>
            <Field label="Message to the reviewer"><TemplateInput value={cfg.approval_message || ''} onChange={v => set({ approval_message: v })} tokens={tokens} multiline placeholder="Invoice {{vars.invoice_no}} for {{vars.amount}} needs approval." /></Field>
          </Section>
          <Section title="Outcomes">
            <div className="text-[12.5px] text-slate-600">Each connection from this task is an outcome button. Without outcomes the reviewer gets Approve / Reject.</div>
            {outgoing.length === 0 && <Callout tone="warning">Connect this task to the next steps to define its outcomes.</Callout>}
            {outgoing.map(e => {
              const outs: any[] = cfg.outcomes || [];
              const oc = outs.find(o => o.route === e.target);
              const isEsc = cfg.escalate_to === e.target;
              return (
                <div key={e.id} className="rounded-md border border-slate-200 p-2.5 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-[12.5px]">
                    <span className="truncate text-slate-600">To <b className="text-slate-800">{nodeLabel(e.target)}</b></span>
                    <Select className="!h-7 !w-[128px] shrink-0 text-[12.5px]" value={isEsc ? 'escalation' : 'outcome'} onChange={ev => {
                      if (ev.target.value === 'escalation') set({ escalate_to: e.target, outcomes: outs.filter(o => o.route !== e.target) });
                      else set({ escalate_to: isEsc ? '' : cfg.escalate_to });
                    }}>
                      <option value="outcome">Outcome</option>
                      <option value="escalation">Escalation</option>
                    </Select>
                  </div>
                  {!isEsc && <Input value={oc?.label || ''} placeholder="Button label (e.g. Approve, Escalate to CFO)" onChange={ev => {
                    const next = oc ? outs.map(o => o.route === e.target ? { ...o, label: ev.target.value } : o) : [...outs, { label: ev.target.value, route: e.target }];
                    set({ outcomes: next });
                  }} />}
                </div>
              );
            })}
          </Section>
          <Section title="SLA">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Respond within" hint="e.g. 4h, 2d"><Input value={cfg.sla_duration || ''} onChange={e => set({ sla_duration: e.target.value })} placeholder="4h" className="font-mono" /></Field>
              <Field label="When the SLA is missed">
                <Select value={cfg.sla_breach || 'none'} onChange={e => set({ sla_breach: e.target.value === 'none' ? '' : e.target.value })}>
                  <option value="none">Do nothing</option>
                  <option value="notify">Notify</option>
                  <option value="auto_approve">Auto-approve</option>
                  <option value="auto_reject">Auto-reject</option>
                  <option value="escalate">Escalate</option>
                </Select>
              </Field>
            </div>
            {cfg.sla_breach === 'escalate' && !cfg.escalate_to && <Callout tone="warning">Mark one connection above as the “Escalation path”.</Callout>}
            {cfg.sla_breach === 'escalate' && cfg.escalate_to && <div className="text-[12.5px] text-slate-600">Escalates to <b>{nodeLabel(cfg.escalate_to)}</b>.</div>}
          </Section>
        </>)}

        {type === 'human_approval' && (
          <Section title="Approval">
            <Field label="Message to the reviewer"><TemplateInput value={cfg.approval_message || ''} onChange={v => set({ approval_message: v })} tokens={tokens} multiline /></Field>
            <Callout tone="info">Legacy approval step. Use a User task for named outcomes and SLAs.</Callout>
          </Section>
        )}

        {!['start', 'end', 'agent', 'connector', 'api_call', 'transform', 'condition', 'parallel', 'join', 'timer', 'subflow', 'human_task', 'human_approval'].includes(type) && (
          <Section title="Configuration"><JsonBlock value={cfg} /></Section>
        )}
      </div>

      <div className="border-t border-slate-200 p-3">
        <Button variant="danger" className="w-full" icon={<Trash2 className="h-4 w-4" />} onClick={onDelete} disabled={type === 'start' && nodes.filter(n => n.data?.type === 'start').length === 1}>Delete element</Button>
      </div>
    </div>
  );
};

const SubflowSection: React.FC<{ cfg: any; set: (p: any) => void; lookups: Lookups; flowId?: string | null; tokens: any[]; dm: DataManager }> = ({ cfg, set, lookups, flowId, tokens, dm }) => {
  const [childArgs, setChildArgs] = useState<string[]>([]);
  useEffect(() => {
    let live = true;
    setChildArgs([]);
    if (!cfg.flow_id) return;
    apiService.playground.flows.get(cfg.flow_id).then(r => {
      if (!live) return;
      const args = (r?.data?.data_manager?.arguments || []).filter((a: any) => a.direction !== 'out').map((a: any) => a.name);
      setChildArgs(args);
    }).catch(() => {});
    return () => { live = false; };
  }, [cfg.flow_id]);
  const options = lookups.flows.filter((f: any) => f._id !== flowId);
  return (<>
    <Section title="Process to call">
      <Field label="Process" required hint="The child's out-arguments become this step's output. Nesting up to 5 levels; a process cannot call itself.">
        <Select value={cfg.flow_id || ''} onChange={e => set({ flow_id: e.target.value })}>
          <option value="">Select a process…</option>
          {options.map((f: any) => <option key={f._id} value={f._id}>{f.name}</option>)}
        </Select>
      </Field>
    </Section>
    <Section title="In-arguments of the child">
      {childArgs.length > 0 && <div className="flex flex-wrap gap-1">{childArgs.map(a => <Tag key={a} tone="blue">{a}</Tag>)}</div>}
      <InputMapEditor rows={cfg.input_map} onChange={r => set({ input_map: r })} tokens={tokens} keySuggestions={childArgs} keyPlaceholder="child argument" />
    </Section>
    <OutputSection cfg={cfg} set={set} dm={dm} />
  </>);
};

/* ───────────────────────── Data Manager ───────────────────────── */

const TYPES = ['string', 'number', 'boolean', 'object', 'array'];
const DIRECTIONS: [string, string][] = [['in', 'Input'], ['out', 'Output'], ['inout', 'Input & Output']];

// Full-width, one table at a time (Arguments | Variables) so every column stays readable.
export const DataManagerEditor: React.FC<{ dm: DataManager; onChange: (dm: DataManager) => void }> = ({ dm, onChange }) => {
  const [tab, setTab] = useState<'arguments' | 'variables'>('arguments');
  const dupe = (names: string[]) => names.filter((n, i) => n && names.indexOf(n) !== i);
  const argDupes = dupe(dm.arguments.map(a => a.name));
  const varDupes = dupe(dm.variables.map(v => v.name));
  const typeOptions = (current?: string) => (current && !TYPES.includes(current) ? [current, ...TYPES] : TYPES);
  const cell = 'h-9 !text-[13px]';
  const th = 'sticky top-0 z-[1] bg-slate-50 px-2.5 py-2 text-left text-[12px] font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200';
  const ins = dm.arguments.filter(a => a.direction !== 'out').length;
  const outs = dm.arguments.filter(a => a.direction !== 'in').length;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
          {([['arguments', `Arguments (${dm.arguments.length})`], ['variables', `Variables (${dm.variables.length})`]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={cx('rounded px-3 py-1 text-[13px] font-medium', tab === k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')}>{l}</button>
          ))}
        </div>
        <span className="text-[12.5px] text-slate-500">
          {tab === 'arguments'
            ? <>Arguments are the process contract — <b>{ins}</b> input(s) a run receives, <b>{outs}</b> output(s) it returns. Use them as <code className="font-mono text-[var(--sx-primary)]">{'{{args.name}}'}</code>.</>
            : <>Variables hold state while the process runs. Use them as <code className="font-mono text-[var(--sx-primary)]">{'{{vars.name}}'}</code>; steps can save their result into one.</>}
        </span>
        <div className="ml-auto">
          {tab === 'arguments'
            ? <Button size="sm" variant="subtle" icon={<Plus className="h-4 w-4" />} onClick={() => onChange({ ...dm, arguments: [...dm.arguments, { name: `arg${dm.arguments.length + 1}`, direction: 'in', type: 'string', required: false, default: '', description: '' }] })}>Add argument</Button>
            : <Button size="sm" variant="subtle" icon={<Plus className="h-4 w-4" />} onClick={() => onChange({ ...dm, variables: [...dm.variables, { name: `var${dm.variables.length + 1}`, type: 'string', default: '', description: '' }] })}>Add variable</Button>}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-md border border-slate-200 bg-white">
        {tab === 'arguments' ? (
          <table className="w-full min-w-[900px] table-fixed border-collapse text-left">
            <colgroup><col style={{ width: 220 }} /><col style={{ width: 160 }} /><col style={{ width: 130 }} /><col style={{ width: 90 }} /><col style={{ width: 200 }} /><col /><col style={{ width: 48 }} /></colgroup>
            <thead><tr><th className={th}>Name</th><th className={th}>Direction</th><th className={th}>Type</th><th className={cx(th, 'text-center')}>Required</th><th className={th}>Default value</th><th className={th}>Description</th><th className={th} /></tr></thead>
            <tbody>
              {dm.arguments.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-[13px] text-slate-400">No arguments yet. Input arguments are what a run receives; output arguments are what it returns.</td></tr>}
              {dm.arguments.map((a, i) => {
                const upd = (p: any) => { const n = [...dm.arguments]; n[i] = { ...a, ...p }; onChange({ ...dm, arguments: n }); };
                const bad = !IDENT.test(a.name || '') || argDupes.includes(a.name);
                return (
                  <tr key={i} className="border-t border-slate-100 align-top hover:bg-slate-50/50">
                    <td className="px-2 py-1.5">
                      <Input className={cx(cell, 'font-mono', bad && '!border-red-400')} value={a.name} onChange={e => upd({ name: e.target.value })} title={a.name} />
                      {bad && <div className="mt-0.5 text-[11.5px] text-red-600">{argDupes.includes(a.name) ? 'Duplicate name' : 'Letters, digits, _ only'}</div>}
                    </td>
                    <td className="px-2 py-1.5"><Select className={cell} value={a.direction || 'in'} onChange={e => upd({ direction: e.target.value })}>{DIRECTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></td>
                    <td className="px-2 py-1.5"><Select className={cell} value={a.type || 'string'} onChange={e => upd({ type: e.target.value })}>{typeOptions(a.type).map(t => <option key={t} value={t}>{t}</option>)}</Select></td>
                    <td className="px-2 py-1.5 text-center"><input type="checkbox" className="mt-2.5 h-4 w-4" checked={!!a.required} onChange={e => upd({ required: e.target.checked })} aria-label="Required" /></td>
                    <td className="px-2 py-1.5"><Input className={cell} value={a.default ?? ''} onChange={e => upd({ default: e.target.value })} placeholder="—" title={String(a.default ?? '')} /></td>
                    <td className="px-2 py-1.5"><Input className={cell} value={a.description ?? ''} onChange={e => upd({ description: e.target.value })} placeholder="What is this argument for?" title={a.description || ''} /></td>
                    <td className="px-1 py-1.5"><IconButton label="Remove argument" tone="danger" onClick={() => onChange({ ...dm, arguments: dm.arguments.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></IconButton></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="w-full min-w-[760px] table-fixed border-collapse text-left">
            <colgroup><col style={{ width: 240 }} /><col style={{ width: 140 }} /><col style={{ width: 220 }} /><col /><col style={{ width: 48 }} /></colgroup>
            <thead><tr><th className={th}>Name</th><th className={th}>Type</th><th className={th}>Default value</th><th className={th}>Description</th><th className={th} /></tr></thead>
            <tbody>
              {dm.variables.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-[13px] text-slate-400">No variables yet. A step's “Save result to variable” creates vars.&lt;name&gt; at run time.</td></tr>}
              {dm.variables.map((v, i) => {
                const upd = (p: any) => { const n = [...dm.variables]; n[i] = { ...v, ...p }; onChange({ ...dm, variables: n }); };
                const bad = !IDENT.test(v.name || '') || varDupes.includes(v.name);
                return (
                  <tr key={i} className="border-t border-slate-100 align-top hover:bg-slate-50/50">
                    <td className="px-2 py-1.5">
                      <Input className={cx(cell, 'font-mono', bad && '!border-red-400')} value={v.name} onChange={e => upd({ name: e.target.value })} title={v.name} />
                      {bad && <div className="mt-0.5 text-[11.5px] text-red-600">{varDupes.includes(v.name) ? 'Duplicate name' : 'Letters, digits, _ only'}</div>}
                    </td>
                    <td className="px-2 py-1.5"><Select className={cell} value={v.type || 'string'} onChange={e => upd({ type: e.target.value })}>{typeOptions(v.type).map(t => <option key={t} value={t}>{t}</option>)}</Select></td>
                    <td className="px-2 py-1.5"><Input className={cell} value={v.default ?? ''} onChange={e => upd({ default: e.target.value })} placeholder="—" title={String(v.default ?? '')} /></td>
                    <td className="px-2 py-1.5"><Input className={cell} value={v.description ?? ''} onChange={e => upd({ description: e.target.value })} placeholder="What does this variable hold?" title={v.description || ''} /></td>
                    <td className="px-1 py-1.5"><IconButton label="Remove variable" tone="danger" onClick={() => onChange({ ...dm, variables: dm.variables.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></IconButton></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
