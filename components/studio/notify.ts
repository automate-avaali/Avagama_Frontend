// Studio-scoped toasts for the Orchestration and Agent Playground screens. Same API as react-hot-toast
// (toast(), .success, .error, .loading, .dismiss) but with the studio look: sentence case, compact card,
// one status accent, shown bottom-right so it never covers the toolbar. Other pages keep the global style.
import type React from 'react';
import baseToast, { ToastOptions } from 'react-hot-toast';

const ACCENT = { success: '#16a34a', error: '#dc2626', loading: '#0067df', info: '#0067df', warning: '#d97706' } as const;
type Kind = keyof typeof ACCENT;

const style = (kind: Kind): React.CSSProperties => ({
  background: '#ffffff',
  color: '#1f2a33',
  fontSize: '14px',
  fontWeight: 500,
  lineHeight: 1.45,
  letterSpacing: 0,
  textTransform: 'none',
  padding: '10px 14px 10px 12px',
  borderRadius: '8px',
  border: '1px solid #e3e8ec',
  borderLeft: `4px solid ${ACCENT[kind]}`,
  boxShadow: '0 8px 24px rgba(16, 24, 40, 0.12)',
  maxWidth: '440px',
});

const opts = (kind: Kind, o?: ToastOptions): ToastOptions => ({
  position: 'bottom-right',
  duration: kind === 'error' ? 6000 : kind === 'loading' ? Infinity : 3500,
  ...o,
  style: { ...style(kind), ...(o?.style || {}) },
  ...(kind === 'success' || kind === 'error' || kind === 'loading' ? { iconTheme: { primary: ACCENT[kind], secondary: '#fff' } } : {}),
});

type Msg = Parameters<typeof baseToast>[0];

const toast = Object.assign(
  (message: Msg, o?: ToastOptions & { kind?: Kind }) => baseToast(message, opts(o?.kind || 'info', o)),
  {
    success: (message: Msg, o?: ToastOptions) => baseToast.success(message, opts('success', o)),
    error: (message: Msg, o?: ToastOptions) => baseToast.error(message, opts('error', o)),
    loading: (message: Msg, o?: ToastOptions) => baseToast.loading(message, opts('loading', o)),
    warning: (message: Msg, o?: ToastOptions) => baseToast(message, opts('warning', { icon: '⚠️', ...o })),
    dismiss: baseToast.dismiss,
  },
);

export default toast;
