// Shared, enterprise-style UI kit for the Orchestration page and the Agent Playground (Maestro-style studio).
// Flat surfaces, 6–8px radii, 1px borders, compact type — modelled on UiPath's Apollo design language.
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Loader2, X, AlertTriangle, Inbox } from 'lucide-react';

const THEMES = {
  maestro: { '--sx-primary': '#0067df', '--sx-primary-hover': '#0056ba', '--sx-primary-soft': '#e9f1fc' },
  avagama: { '--sx-primary': '#8a5a90', '--sx-primary-hover': '#744a79', '--sx-primary-soft': '#f4ecf5' },
} as const;
const ThemeCtx = React.createContext<keyof typeof THEMES>('maestro');

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

// The app renders with `body { zoom: 0.75 }` (index.html), so `100vh` only covers 75% of the window
// and leaves an empty band under full-screen pages. This hook sizes a full-screen shell from the real
// window height in un-zoomed CSS pixels, minus the sticky top navigation.
export const useFillHeight = (min = 520) => {
  const [height, setHeight] = useState<number | null>(null);
  useLayoutEffect(() => {
    const compute = () => {
      const zoom = parseFloat((getComputedStyle(document.body) as any).zoom) || 1;
      const nav = document.querySelector('nav');
      const navH = nav ? (nav as HTMLElement).offsetHeight : 0;
      setHeight(Math.max(min, Math.floor(window.innerHeight / zoom - navH)));
    };
    compute();
    window.addEventListener('resize', compute);
    const nav = document.querySelector('nav');
    const ro = nav && 'ResizeObserver' in window ? new ResizeObserver(compute) : null;
    if (ro && nav) ro.observe(nav);
    return () => { window.removeEventListener('resize', compute); ro?.disconnect(); };
  }, [min]);
  return height;
};

/* ───────────────────────── Formatting helpers ───────────────────────── */

export const shortId = (id?: string | null) => (id ? `${String(id).slice(-6)}` : '—');

export const fmtDateTime = (d?: string | null) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const timeAgo = (d?: string | null) => {
  if (!d) return 'Never';
  const ms = Date.now() - new Date(d).getTime();
  if (isNaN(ms)) return '—';
  const future = ms < 0;
  const m = Math.floor(Math.abs(ms) / 60000);
  const label = m < 1 ? 'now' : m < 60 ? `${m}m` : m < 1440 ? `${Math.floor(m / 60)}h` : `${Math.floor(m / 1440)}d`;
  if (label === 'now') return future ? 'in <1m' : 'just now';
  return future ? `in ${label}` : `${label} ago`;
};

export const fmtDuration = (ms?: number | null) => {
  if (ms == null || isNaN(ms) || ms < 0) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(s < 10 ? 1 : 0)} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${Math.round(s % 60)}s`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ${m % 60}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
};

export const durationBetween = (a?: string | null, b?: string | null) => {
  if (!a) return null;
  const end = b ? new Date(b).getTime() : Date.now();
  return end - new Date(a).getTime();
};

// Execution/run payloads often wrap values as { value: "<json string>" } — unwrap them for display.
export const unwrapValue = (v: any): any => {
  if (v == null) return v;
  let out = v;
  if (typeof out === 'object' && !Array.isArray(out) && Object.keys(out).length === 1 && 'value' in out) out = out.value;
  for (let i = 0; i < 2 && typeof out === 'string'; i++) {
    const t = out.trim();
    if (!(t.startsWith('{') || t.startsWith('[') || t.startsWith('"'))) break;
    try { out = JSON.parse(t); } catch { break; }
  }
  return out;
};

export const errMessage = (e: any, fallback = 'Something went wrong') => {
  const m = e?.message || fallback;
  if (/failed to fetch|networkerror/i.test(m)) return 'Cannot reach the server. Check that the backend is running.';
  // Run input validation (contract F.1): 400 "Invalid run input" + issue_details[{ arg, problem }]
  const det = e?.data?.issue_details;
  if (Array.isArray(det) && det.length) return `${m}: ${det.map((d: any) => `${d.arg} — ${d.problem}`).join('; ')}`;
  return m;
};

/* ───────────────────────── Status ───────────────────────── */

const STATUS_STYLES: Record<string, { bg: string; fg: string; dot: string; label?: string }> = {
  completed: { bg: 'bg-emerald-50', fg: 'text-emerald-700', dot: 'bg-emerald-500' },
  succeeded: { bg: 'bg-emerald-50', fg: 'text-emerald-700', dot: 'bg-emerald-500' },
  active: { bg: 'bg-emerald-50', fg: 'text-emerald-700', dot: 'bg-emerald-500' },
  published: { bg: 'bg-emerald-50', fg: 'text-emerald-700', dot: 'bg-emerald-500' },
  started: { bg: 'bg-emerald-50', fg: 'text-emerald-700', dot: 'bg-emerald-500' },
  approved: { bg: 'bg-emerald-50', fg: 'text-emerald-700', dot: 'bg-emerald-500' },
  running: { bg: 'bg-blue-50', fg: 'text-blue-700', dot: 'bg-blue-500' },
  queued: { bg: 'bg-slate-100', fg: 'text-slate-600', dot: 'bg-slate-400' },
  pending: { bg: 'bg-slate-100', fg: 'text-slate-600', dot: 'bg-slate-400' },
  waiting_approval: { bg: 'bg-amber-50', fg: 'text-amber-700', dot: 'bg-amber-500', label: 'Waiting for approval' },
  waiting_human_approval: { bg: 'bg-amber-50', fg: 'text-amber-700', dot: 'bg-amber-500', label: 'Waiting for approval' },
  waiting_human: { bg: 'bg-amber-50', fg: 'text-amber-700', dot: 'bg-amber-500', label: 'Waiting for approval' },
  paused: { bg: 'bg-amber-50', fg: 'text-amber-700', dot: 'bg-amber-400' },
  failed: { bg: 'bg-red-50', fg: 'text-red-700', dot: 'bg-red-500' },
  error: { bg: 'bg-red-50', fg: 'text-red-700', dot: 'bg-red-500' },
  rejected: { bg: 'bg-rose-50', fg: 'text-rose-700', dot: 'bg-rose-500' },
  cancelled: { bg: 'bg-slate-100', fg: 'text-slate-500', dot: 'bg-slate-400' },
  skipped: { bg: 'bg-slate-100', fg: 'text-slate-500', dot: 'bg-slate-300' },
  skipped_overlap: { bg: 'bg-slate-100', fg: 'text-slate-600', dot: 'bg-slate-400', label: 'Skipped (overlap)' },
  draft: { bg: 'bg-slate-100', fg: 'text-slate-600', dot: 'bg-slate-400' },
  archived: { bg: 'bg-slate-100', fg: 'text-slate-500', dot: 'bg-slate-300' },
  disabled: { bg: 'bg-slate-100', fg: 'text-slate-500', dot: 'bg-slate-300' },
  enabled: { bg: 'bg-emerald-50', fg: 'text-emerald-700', dot: 'bg-emerald-500' },
};

export const statusLabel = (s?: string | null) => {
  if (!s) return '—';
  return STATUS_STYLES[s]?.label || s.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
};

export const StatusPill: React.FC<{ status?: string | null; className?: string }> = ({ status, className }) => {
  // Unknown enum values are shown as plain text (contract: additive enums).
  const st = (status && STATUS_STYLES[status]) || { bg: 'bg-slate-100', fg: 'text-slate-600', dot: 'bg-slate-400' };
  const live = status === 'running' || status === 'queued';
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[12px] font-medium whitespace-nowrap', st.bg, st.fg, className)}>
      <span className={cx('h-1.5 w-1.5 rounded-full', st.dot, live && 'animate-pulse')} />
      {statusLabel(status)}
    </span>
  );
};

export const Tag: React.FC<{ children: React.ReactNode; tone?: 'gray' | 'blue' | 'purple' | 'amber' | 'green' | 'red'; className?: string; title?: string }> = ({ children, tone = 'gray', className, title }) => {
  const tones = {
    gray: 'bg-slate-100 text-slate-600 border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    purple: 'bg-violet-50 text-violet-700 border-violet-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    red: 'bg-red-50 text-red-700 border-red-100',
  };
  return <span title={title} className={cx('inline-flex items-center gap-1 rounded border px-1.5 py-px text-[11.5px] font-medium whitespace-nowrap', tones[tone], className)}>{children}</span>;
};

/* ───────────────────────── Buttons ───────────────────────── */

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'subtle';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant; size?: 'sm' | 'md'; icon?: React.ReactNode; loading?: boolean;
}> = ({ variant = 'secondary', size = 'md', icon, loading, children, className, disabled, ...rest }) => {
  const v: Record<BtnVariant, string> = {
    primary: 'bg-[var(--sx-primary)] text-white border-transparent hover:bg-[var(--sx-primary-hover)] shadow-sm',
    secondary: 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400',
    ghost: 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100',
    subtle: 'bg-[var(--sx-primary-soft)] text-[var(--sx-primary)] border-transparent hover:brightness-95',
    danger: 'bg-white text-red-600 border-red-200 hover:bg-red-50',
    success: 'bg-emerald-600 text-white border-transparent hover:bg-emerald-700 shadow-sm',
  };
  const s = size === 'sm' ? 'h-8 px-2.5 text-[13px] gap-1.5' : 'h-9 px-3.5 text-[13.5px] gap-2';
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cx('inline-flex items-center justify-center rounded-md border font-medium transition-colors select-none whitespace-nowrap',
        'disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sx-primary)]/40', s, v[variant], className)}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
};

export const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: 'default' | 'danger' }> = ({ label, tone = 'default', className, children, ...rest }) => (
  <button
    {...rest}
    title={label}
    aria-label={label}
    className={cx('inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
      tone === 'danger' ? 'text-slate-500 hover:bg-red-50 hover:text-red-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800', className)}
  >
    {children}
  </button>
);

export const CopyButton: React.FC<{ text: string; label?: string; className?: string }> = ({ text, label = 'Copy', className }) => {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); }).catch(() => {}); }}
      className={cx('inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[12px] text-slate-500 hover:bg-slate-100 hover:text-slate-800', className)}
      title={label}
    >
      {done ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      {done ? 'Copied' : label}
    </button>
  );
};

/* ───────────────────────── Layout ───────────────────────── */

export const PageHeader: React.FC<{ title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode; breadcrumb?: React.ReactNode }> = ({ title, subtitle, actions, breadcrumb }) => (
  <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
    <div className="min-w-0">
      {breadcrumb && <div className="mb-1 text-[12.5px] text-slate-500">{breadcrumb}</div>}
      <h1 className="text-[20px] font-semibold text-slate-900 leading-tight truncate">{title}</h1>
      {subtitle && <p className="mt-1 text-[13.5px] text-slate-500">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const Card: React.FC<{ className?: string; children: React.ReactNode; onClick?: () => void; padded?: boolean }> = ({ className, children, onClick, padded = true }) => (
  <div onClick={onClick} className={cx('rounded-lg border border-slate-200 bg-white', padded && 'p-4', onClick && 'cursor-pointer hover:border-slate-300 hover:shadow-sm transition', className)}>{children}</div>
);

export const SectionTitle: React.FC<{ children: React.ReactNode; actions?: React.ReactNode; className?: string }> = ({ children, actions, className }) => (
  <div className={cx('flex items-center justify-between gap-2 mb-2', className)}>
    <h3 className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">{children}</h3>
    {actions}
  </div>
);

export const StatCard: React.FC<{ label: string; value: React.ReactNode; tone?: 'default' | 'blue' | 'amber' | 'red' | 'green'; hint?: React.ReactNode; onClick?: () => void; active?: boolean }> = ({ label, value, tone = 'default', hint, onClick, active }) => {
  const bar = { default: 'bg-slate-300', blue: 'bg-blue-500', amber: 'bg-amber-500', red: 'bg-red-500', green: 'bg-emerald-500' }[tone];
  return (
    <button type="button" onClick={onClick} disabled={!onClick}
      className={cx('relative text-left rounded-lg border bg-white px-4 py-3 overflow-hidden transition', active ? 'border-[var(--sx-primary)] ring-1 ring-[var(--sx-primary)]' : 'border-slate-200', onClick ? 'hover:border-slate-300 cursor-pointer' : 'cursor-default')}>
      <span className={cx('absolute left-0 top-0 bottom-0 w-[3px]', bar)} />
      <div className="text-[12.5px] text-slate-500">{label}</div>
      <div className="mt-0.5 text-[22px] font-semibold text-slate-900 leading-tight">{value}</div>
      {hint && <div className="mt-0.5 text-[12px] text-slate-500">{hint}</div>}
    </button>
  );
};

export const Tabs: React.FC<{ tabs: { key: string; label: React.ReactNode; count?: number }[]; active: string; onChange: (k: string) => void; className?: string }> = ({ tabs, active, onChange, className }) => (
  <div className={cx('flex items-center gap-1 border-b border-slate-200', className)} role="tablist">
    {tabs.map(t => (
      <button key={t.key} role="tab" aria-selected={active === t.key} onClick={() => onChange(t.key)}
        className={cx('relative -mb-px inline-flex items-center gap-1.5 px-3 py-2 text-[13.5px] font-medium border-b-2 transition-colors',
          active === t.key ? 'border-[var(--sx-primary)] text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800')}>
        {t.label}
        {t.count != null && <span className="rounded bg-slate-100 px-1.5 text-[11.5px] text-slate-600">{t.count}</span>}
      </button>
    ))}
  </div>
);

export const EmptyState: React.FC<{ icon?: React.ReactNode; title: string; description?: React.ReactNode; action?: React.ReactNode; compact?: boolean }> = ({ icon, title, description, action, compact }) => (
  <div className={cx('flex flex-col items-center justify-center text-center', compact ? 'py-8' : 'py-16')}>
    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">{icon || <Inbox className="h-5 w-5" />}</div>
    <div className="text-[14.5px] font-semibold text-slate-800">{title}</div>
    {description && <div className="mt-1 max-w-md text-[13px] text-slate-500">{description}</div>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const Spinner: React.FC<{ label?: string; className?: string }> = ({ label, className }) => (
  <div className={cx('flex items-center justify-center gap-2 py-10 text-[13px] text-slate-500', className)}>
    <Loader2 className="h-4 w-4 animate-spin" /> {label || 'Loading…'}
  </div>
);

export const ErrorBanner: React.FC<{ message: string; onRetry?: () => void; className?: string }> = ({ message, onRetry, className }) => (
  <div className={cx('flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700', className)}>
    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
    <div className="flex-1">{message}</div>
    {onRetry && <button onClick={onRetry} className="font-medium underline hover:no-underline">Try again</button>}
  </div>
);

export const Callout: React.FC<{ tone?: 'info' | 'warning' | 'danger' | 'success'; title?: React.ReactNode; children?: React.ReactNode; icon?: React.ReactNode; className?: string; actions?: React.ReactNode }> = ({ tone = 'info', title, children, icon, className, actions }) => {
  const t = {
    info: 'border-blue-200 bg-blue-50 text-blue-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    danger: 'border-red-200 bg-red-50 text-red-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  }[tone];
  return (
    <div className={cx('rounded-md border px-3 py-2.5 text-[13px]', t, className)}>
      <div className="flex items-start gap-2">
        {icon && <div className="mt-0.5 shrink-0">{icon}</div>}
        <div className="min-w-0 flex-1">
          {title && <div className="font-semibold">{title}</div>}
          {children && <div className={cx(title && 'mt-0.5', 'opacity-90 break-words')}>{children}</div>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
};

/* ───────────────────────── Forms ───────────────────────── */

export const Field: React.FC<{ label: React.ReactNode; required?: boolean; hint?: React.ReactNode; error?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ label, required, hint, error, children, className }) => (
  <label className={cx('block', className)}>
    <span className="mb-1 block text-[12.5px] font-medium text-slate-700">{label}{required && <span className="text-red-500"> *</span>}</span>
    {children}
    {error ? <span className="mt-1 block text-[12px] text-red-600">{error}</span> : hint ? <span className="mt-1 block text-[12px] text-slate-500">{hint}</span> : null}
  </label>
);

const inputBase = 'w-full rounded-md border border-slate-300 bg-white px-2.5 text-[13.5px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[var(--sx-primary)] focus:ring-2 focus:ring-[var(--sx-primary)]/15 disabled:bg-slate-50 disabled:text-slate-500';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input ref={ref} {...p} className={cx(inputBase, 'h-9', className)} />
));
export const TextArea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...p }, ref) => (
  <textarea ref={ref} {...p} className={cx(inputBase, 'py-2 leading-relaxed resize-y', className)} />
));
export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className, children, ...p }) => (
  <select {...p} className={cx(inputBase, 'h-9 pr-7 cursor-pointer', className)}>{children}</select>
);

export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label?: React.ReactNode; disabled?: boolean }> = ({ checked, onChange, label, disabled }) => (
  <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
    className="inline-flex items-center gap-2 text-[13px] text-slate-700 disabled:opacity-50">
    <span className={cx('relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors', checked ? 'bg-[var(--sx-primary)]' : 'bg-slate-300')}>
      <span className={cx('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-4' : 'translate-x-0.5')} />
    </span>
    {label}
  </button>
);

export const SearchInput: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string; className?: string }> = ({ value, onChange, placeholder = 'Search', className }) => (
  <div className={cx('relative', className)}>
    <svg className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cx(inputBase, 'h-9 pl-8')} />
  </div>
);

/* ───────────────────────── Overlays ───────────────────────── */

export const Modal: React.FC<{ open: boolean; onClose: () => void; title: React.ReactNode; subtitle?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; width?: number; dismissable?: boolean }> = ({ open, onClose, title, subtitle, children, footer, width = 560, dismissable = true }) => {
  useEffect(() => {
    if (!open || !dismissable) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, dismissable]);
  const theme = React.useContext(ThemeCtx);
  if (!open) return null;
  return createPortal(
    <div className="studio-ui fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/40 p-4" style={THEMES[theme] as any} onMouseDown={e => { if (dismissable && e.target === e.currentTarget) onClose(); }}>
      <div className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-lg bg-white shadow-2xl" style={{ maxWidth: width }} role="dialog" aria-modal="true">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
          <div className="min-w-0">
            <div className="text-[16px] font-semibold text-slate-900">{title}</div>
            {subtitle && <div className="mt-0.5 text-[13px] text-slate-500">{subtitle}</div>}
          </div>
          {dismissable && <IconButton label="Close" onClick={onClose}><X className="h-4 w-4" /></IconButton>}
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

export const ConfirmDialog: React.FC<{ open: boolean; title: string; message: React.ReactNode; confirmLabel?: string; tone?: 'danger' | 'primary'; onConfirm: () => void | Promise<void>; onCancel: () => void; children?: React.ReactNode }> = ({ open, title, message, confirmLabel = 'Confirm', tone = 'danger', onConfirm, onCancel, children }) => {
  const [busy, setBusy] = useState(false);
  return (
    <Modal open={open} onClose={onCancel} title={title} width={440}
      footer={<>
        <Button onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button variant={tone === 'danger' ? 'primary' : 'primary'} className={tone === 'danger' ? '!bg-red-600 hover:!bg-red-700' : ''} loading={busy}
          onClick={async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); } }}>{confirmLabel}</Button>
      </>}>
      <div className="text-[13.5px] text-slate-600">{message}</div>
      {children}
    </Modal>
  );
};

// Lightweight anchored dropdown menu.
export const Menu: React.FC<{ trigger: (open: () => void) => React.ReactNode; items: ({ label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean } | 'divider')[]; align?: 'left' | 'right' }> = ({ trigger, items, align = 'right' }) => {
  // Rendered in a portal with fixed positioning so it is never clipped by scrolling tables/panels.
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left?: number; right?: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const theme = React.useContext(ThemeCtx);
  const close = () => setPos(null);
  const toggle = () => {
    if (pos) { close(); return; }
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // body has CSS zoom; convert client coords into the zoomed layout space used by position:fixed.
    const ratio = el.offsetWidth ? r.width / el.offsetWidth : 1;
    const vw = window.innerWidth / ratio, vh = window.innerHeight / ratio;
    const top = r.bottom / ratio, bottom = r.top / ratio;
    const up = top + 260 > vh && bottom > 260;
    setPos({ ...(up ? { bottom: vh - bottom + 4 } : { top: top + 4 }), ...(align === 'right' ? { right: vw - r.right / ratio } : { left: r.left / ratio }) });
  };
  useEffect(() => {
    if (!pos) return;
    const h = (e: MouseEvent) => {
      if (ref.current?.contains(e.target as any) || menuRef.current?.contains(e.target as any)) return;
      close();
    };
    document.addEventListener('mousedown', h);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => { document.removeEventListener('mousedown', h); window.removeEventListener('scroll', close, true); window.removeEventListener('resize', close); };
  }, [pos]);
  return (
    <div className="relative inline-block" ref={ref}>
      {trigger(toggle)}
      {pos && createPortal(
        <div ref={menuRef} className="studio-ui fixed z-[400] min-w-[190px] rounded-md border border-slate-200 bg-white py-1 shadow-lg"
          style={{ ...(THEMES[theme] as any), top: pos.top, bottom: pos.bottom, left: pos.left, right: pos.right }}>
          {items.map((it, i) => it === 'divider'
            ? <div key={i} className="my-1 border-t border-slate-100" />
            : (
              <button key={i} disabled={it.disabled} onClick={() => { close(); it.onClick(); }}
                className={cx('flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13.5px] disabled:opacity-40', it.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50')}>
                {it.icon}{it.label}
              </button>
            ))}
        </div>,
        document.body
      )}
    </div>
  );
};

/* ───────────────────────── Data display ───────────────────────── */

export const KeyValue: React.FC<{ items: [React.ReactNode, React.ReactNode][]; className?: string }> = ({ items, className }) => (
  <dl className={cx('grid grid-cols-[minmax(110px,auto)_1fr] gap-x-4 gap-y-1.5 text-[13px]', className)}>
    {items.map(([k, v], i) => (
      <React.Fragment key={i}>
        <dt className="text-slate-500">{k}</dt>
        <dd className="min-w-0 break-words text-slate-800">{v ?? '—'}</dd>
      </React.Fragment>
    ))}
  </dl>
);

export const JsonBlock: React.FC<{ value: any; maxHeight?: number; className?: string; emptyLabel?: string }> = ({ value, maxHeight = 320, className, emptyLabel = 'No data' }) => {
  const v = unwrapValue(value);
  if (v === undefined || v === null || (typeof v === 'object' && Object.keys(v).length === 0)) {
    return <div className={cx('rounded-md border border-dashed border-slate-200 px-3 py-2 text-[12.5px] text-slate-400', className)}>{emptyLabel}</div>;
  }
  const text = typeof v === 'string' ? v : JSON.stringify(v, null, 2);
  return (
    <div className={cx('relative group rounded-md border border-slate-200 bg-slate-50', className)}>
      <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition"><CopyButton text={text} /></div>
      <pre className="overflow-auto px-3 py-2 font-mono text-[12px] leading-relaxed text-slate-700 whitespace-pre-wrap break-words" style={{ maxHeight }}>{text}</pre>
    </div>
  );
};

export const Th: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className }) => (
  <th className={cx('sticky top-0 z-[1] border-b border-slate-200 bg-slate-50 px-3 py-2 text-left text-[12px] font-semibold text-slate-600 whitespace-nowrap', className)}>{children}</th>
);
export const Td: React.FC<{ children?: React.ReactNode; className?: string; title?: string; onClick?: (e: React.MouseEvent) => void }> = ({ children, className, title, onClick }) => (
  <td onClick={onClick} title={title} className={cx('border-b border-slate-100 px-3 py-2 text-[13px] text-slate-700 align-middle', className)}>{children}</td>
);

export const Pagination: React.FC<{ page: number; limit: number; total: number; onPage: (p: number) => void }> = ({ page, limit, total, onPage }) => {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (total <= limit) return <div className="px-3 py-2 text-[12.5px] text-slate-500">{total} item{total === 1 ? '' : 's'}</div>;
  return (
    <div className="flex items-center justify-between px-3 py-2 text-[12.5px] text-slate-500">
      <span>{(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
      <div className="flex items-center gap-1">
        <Button size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
        <span className="px-2">Page {page} / {pages}</span>
        <Button size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
};

// Root wrapper that sets the design tokens. `accent` lets Orchestration keep the Avagama purple
// while the Playground uses Maestro blue.
export const StudioTheme: React.FC<{ accent?: 'maestro' | 'avagama'; className?: string; style?: React.CSSProperties; children: React.ReactNode }> = ({ accent = 'maestro', className, style, children }) => {
  return (
    <ThemeCtx.Provider value={accent}>
      <div className={cx('studio-ui text-slate-800 antialiased', className)} style={{ ...(THEMES[accent] as any), ...style }}>{children}</div>
    </ThemeCtx.Provider>
  );
};
