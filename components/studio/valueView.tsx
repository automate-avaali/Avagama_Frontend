// Readable viewer for step inputs / outputs / variables with a Formatted ⇄ JSON switch.
// Formatted: objects as label/value lists, text with real line breaks, markdown rendered.
// JSON: pretty-printed raw value. Both: copy + full-screen.
import React, { useMemo, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Maximize2 } from 'lucide-react';
import { CopyButton, IconButton, Modal, cx, unwrapValue } from './ui';

type Mode = 'formatted' | 'json';

const MD_CSS = `.sx-md p{margin:0 0 .5em}.sx-md p:last-child{margin-bottom:0}.sx-md ul,.sx-md ol{margin:.25em 0 .6em;padding-left:1.3em}.sx-md ul{list-style:disc}.sx-md ol{list-style:decimal}.sx-md li{margin:.15em 0}.sx-md h1,.sx-md h2,.sx-md h3,.sx-md h4{font-weight:600;margin:.6em 0 .3em;font-size:13.5px}.sx-md strong{font-weight:600;color:#101828}.sx-md a{color:var(--sx-primary,#0067df);text-decoration:underline;word-break:break-all}.sx-md code{font-family:Consolas,Menlo,monospace;font-size:12px;background:#eef1f4;border-radius:3px;padding:0 3px}.sx-md pre{background:#f1f3f5;border-radius:4px;padding:6px 8px;overflow:auto}.sx-md table{border-collapse:collapse;margin:.4em 0;font-size:12.5px}.sx-md th,.sx-md td{border:1px solid #e3e8ec;padding:3px 6px;text-align:left}.sx-md th{background:#f6f8fa}.sx-md blockquote{border-left:3px solid #d0d7de;margin:.4em 0;padding-left:.6em;color:#526069}`;
if (typeof document !== 'undefined' && !document.getElementById('sx-md-css')) {
  const el = document.createElement('style'); el.id = 'sx-md-css'; el.textContent = MD_CSS; document.head.appendChild(el);
}

// Strings sometimes arrive double-escaped ("…\\n…") or as JSON text — normalise for display.
const normaliseString = (s: string) => s.replace(/\\n/g, '\n').replace(/\\t/g, '  ').replace(/\\"/g, '"');
// AI steps sometimes return their JSON wrapped in a ```json … ``` fence.
const FENCED = /^```(?:json)?\s*\n([\s\S]*?)\n?```$/i;
const deepParse = (v: any): any => {
  const u = unwrapValue(v);
  if (typeof u === 'string') {
    const raw = u.trim();
    const t = raw.match(FENCED)?.[1].trim() ?? raw;
    if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) { try { return deepParse(JSON.parse(t)); } catch { /* not JSON */ } }
    return u;
  }
  if (Array.isArray(u)) return u.map(deepParse);
  if (u && typeof u === 'object') return Object.fromEntries(Object.entries(u).map(([k, x]) => [k, deepParse(x)]));
  return u;
};

const looksLikeMarkdown = (s: string) => /(^|\n)\s*([-*] |\d+\. |#{1,4} )|\*\*[^*]+\*\*|\|.+\|/.test(s);
const prettyLabel = (k: string) => k.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^\w/, c => c.toUpperCase());

const Text: React.FC<{ value: string }> = ({ value }) => {
  const s = normaliseString(value);
  if (!s.trim()) return <span className="text-slate-400">(empty)</span>;
  if (looksLikeMarkdown(s) || s.length > 160) {
    return (
      <div className="sx-md text-[13px] leading-relaxed text-slate-800">
        <Markdown remarkPlugins={[remarkGfm]}>{s}</Markdown>
      </div>
    );
  }
  return <span className="whitespace-pre-wrap break-words text-[13px] text-slate-800">{s}</span>;
};

const Scalar: React.FC<{ v: any }> = ({ v }) => {
  if (v === null || v === undefined) return <span className="text-slate-400">—</span>;
  if (typeof v === 'boolean') return <span className={cx('rounded px-1.5 py-px text-[12px] font-medium', v ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600')}>{v ? 'Yes' : 'No'}</span>;
  if (typeof v === 'number') return <span className="font-mono text-[13px] tabular-nums text-slate-900">{v.toLocaleString()}</span>;
  return <Text value={String(v)} />;
};

const Formatted: React.FC<{ v: any; depth?: number }> = ({ v, depth = 0 }) => {
  if (v === null || v === undefined || typeof v !== 'object') return <Scalar v={v} />;
  if (Array.isArray(v)) {
    if (!v.length) return <span className="text-slate-400">(empty list)</span>;
    // A list of flat objects with the same keys reads best as a table.
    const keys = v.every(x => x && typeof x === 'object' && !Array.isArray(x)) ? Array.from(new Set(v.flatMap(x => Object.keys(x)))) : [];
    const flat = keys.length > 0 && keys.length <= 7 && v.every(x => Object.values(x).every(y => y === null || typeof y !== 'object'));
    if (flat) {
      return (
        <div className="overflow-x-auto rounded border border-slate-200">
          <table className="w-full border-collapse text-[12.5px]">
            <thead><tr>{keys.map(k => <th key={k} className="border-b border-slate-200 bg-slate-50 px-2 py-1 text-left font-semibold text-slate-600 whitespace-nowrap">{prettyLabel(k)}</th>)}</tr></thead>
            <tbody>{v.map((row, i) => <tr key={i} className="border-t border-slate-100">{keys.map(k => <td key={k} className="px-2 py-1 align-top text-slate-800"><Scalar v={row[k]} /></td>)}</tr>)}</tbody>
          </table>
        </div>
      );
    }
    return <ol className="list-decimal space-y-1 pl-5">{v.map((x, i) => <li key={i}><Formatted v={x} depth={depth + 1} /></li>)}</ol>;
  }
  const entries = Object.entries(v);
  if (!entries.length) return <span className="text-slate-400">(empty)</span>;
  return (
    <dl className={cx('divide-y divide-slate-100', depth > 0 && 'rounded border border-slate-100 bg-white/60 px-2')}>
      {entries.map(([k, x]) => {
        const block = x !== null && typeof x === 'object' || (typeof x === 'string' && (x.length > 90 || x.includes('\n') || x.includes('\\n')));
        return (
          <div key={k} className={cx('py-1.5', block ? 'space-y-1' : 'flex items-baseline gap-3')}>
            <dt className={cx('shrink-0 text-[12px] font-semibold text-slate-500', !block && 'w-[38%] min-w-[110px]')} title={k}>{prettyLabel(k)}</dt>
            <dd className="min-w-0 flex-1">{depth > 3 ? <pre className="whitespace-pre-wrap font-mono text-[12px]">{JSON.stringify(x, null, 2)}</pre> : <Formatted v={x} depth={depth + 1} />}</dd>
          </div>
        );
      })}
    </dl>
  );
};

export const ValueView: React.FC<{ value: any; title?: string; maxHeight?: number; emptyLabel?: string; className?: string; defaultMode?: Mode }> = ({ value, title = 'Value', maxHeight = 320, emptyLabel = 'No data', className, defaultMode = 'formatted' }) => {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [full, setFull] = useState(false);
  const parsed = useMemo(() => deepParse(value), [value]);
  const empty = parsed === undefined || parsed === null || parsed === '' || (typeof parsed === 'object' && Object.keys(parsed).length === 0);
  const jsonText = useMemo(() => (typeof parsed === 'string' ? normaliseString(parsed) : JSON.stringify(parsed, null, 2)), [parsed]);
  if (empty) return <div className={cx('rounded-md border border-dashed border-slate-200 px-3 py-2 text-[12.5px] text-slate-400', className)}>{emptyLabel}</div>;

  const toolbar = (inModal = false) => (
    <div className="flex items-center gap-1">
      <div className="inline-flex rounded border border-slate-200 bg-white p-0.5">
        {(['formatted', 'json'] as Mode[]).map(m => (
          <button key={m} type="button" onClick={() => setMode(m)} className={cx('rounded px-2 py-0.5 text-[11.5px] font-medium', mode === m ? 'bg-[var(--sx-primary-soft)] text-[var(--sx-primary)]' : 'text-slate-500 hover:text-slate-800')}>{m === 'formatted' ? 'Formatted' : 'JSON'}</button>
        ))}
      </div>
      <CopyButton text={jsonText} />
      {!inModal && <IconButton label="Open full view" className="!h-6 !w-6" onClick={() => setFull(true)}><Maximize2 className="h-3.5 w-3.5" /></IconButton>}
    </div>
  );
  const body = (h?: number) => mode === 'json'
    ? <pre className="overflow-auto px-3 py-2 font-mono text-[12px] leading-relaxed text-slate-700 whitespace-pre-wrap break-words" style={h ? { maxHeight: h } : undefined}>{jsonText}</pre>
    : <div className="overflow-auto px-3 py-2" style={h ? { maxHeight: h } : undefined}><Formatted v={parsed} /></div>;

  return (
    <div className={cx('rounded-md border border-slate-200 bg-slate-50/60', className)}>
      <div className="flex items-center justify-end border-b border-slate-200 px-1.5 py-1">{toolbar()}</div>
      {body(maxHeight)}
      <Modal open={full} onClose={() => setFull(false)} title={title} width={1100}
        footer={<div className="mr-auto">{toolbar(true)}</div>}>
        <div className="rounded-md border border-slate-200 bg-slate-50/60">{body()}</div>
      </Modal>
    </div>
  );
};

// Resolve {{args.x}} / {{vars.x}} / {{nodes.id.output.x}} / {{runtime.*}} in display text from a run's context.
export const resolveRunTemplate = (text: string, run: any): string => {
  if (!text || typeof text !== 'string' || !text.includes('{{')) return text;
  const ctx: any = {
    args: run?.context?.args || run?.input || {},
    vars: run?.context?.vars || {},
    nodes: Object.fromEntries((run?.nodes || []).map((n: any) => [n.node_id, { output: deepParse(n.output) }])),
    runtime: { now: new Date().toISOString(), date: new Date().toISOString().slice(0, 10) },
  };
  return text.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (m, path) => {
    const v = String(path).split('.').reduce((o: any, k: string) => (o == null ? undefined : o[k]), ctx);
    if (v === undefined || v === null || v === '') return path.startsWith('args.') || path.startsWith('vars.') ? '(not provided)' : m;
    if (typeof v === 'number') return v.toLocaleString();
    return typeof v === 'object' ? JSON.stringify(v) : String(v);
  });
};
