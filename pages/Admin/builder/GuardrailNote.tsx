// What the agent's AI Guardrails did on a message (backend contract F.7).
// Shown under messages in the chat preview and the Conversations tab; renders nothing when no guardrail acted.
import React from 'react';
import { BookX, EyeOff, ShieldAlert, ShieldCheck } from 'lucide-react';

const REASONS: Record<string, string> = {
  forbidden_topic: 'forbidden topic',
  guardrail_check_failed: 'the safety check could not run, so the agent declined',
};
const reasonLabel = (r?: string | null) => {
  if (!r) return '';
  if (r.startsWith('safety:')) return `safety filter (${r.slice(7).replace(/_/g, ' ')})`;
  return REASONS[r] || r.replace(/_/g, ' ');
};

const PII_LABELS: Record<string, string> = {
  email: 'email', phone: 'phone', aadhaar: 'Aadhaar', pan: 'PAN', card: 'card number',
  ifsc: 'IFSC', bank_account: 'bank account', passport: 'passport',
};
const piiList = (types: string[]) => types.map(t => PII_LABELS[t] || t.replace(/_/g, ' ')).join(', ');

const TONES = {
  amber: 'border-amber-200 bg-amber-50 text-amber-800',
  slate: 'border-slate-200 bg-slate-50 text-slate-600',
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
} as const;

const Chip: React.FC<{ tone: keyof typeof TONES; icon: React.ReactNode; children: React.ReactNode }> = ({ tone, icon, children }) => (
  <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11.5px] font-medium ${TONES[tone]}`}>
    {icon}{children}
  </span>
);

// guardrails: the reply's guardrails object; piiTypes / piiAction: personal data found in the user's message.
export const GuardrailNote: React.FC<{ guardrails?: any; piiTypes?: string[]; piiAction?: string; align?: 'left' | 'right' }> = ({ guardrails, piiTypes, piiAction, align = 'left' }) => {
  const chips: React.ReactNode[] = [];
  // "Declined" is keyed off blocked only: a forbidden topic can also come back answered-but-limited (blocked false).
  if (guardrails?.blocked) {
    chips.push(<Chip key="blocked" tone="amber" icon={<ShieldAlert size={12} />}>Declined by guardrail · {reasonLabel(guardrails.reason)}</Chip>);
  } else {
    if (guardrails?.limited) {
      chips.push(<Chip key="limited" tone="slate" icon={<ShieldCheck size={12} />}>Answered within this agent's limits{guardrails.reason ? ` · ${reasonLabel(guardrails.reason)}` : ''}</Chip>);
    }
    if (guardrails?.grounded === false) {
      // Sources = the conversation, knowledge base, live web search results and tool results (backend grounding check).
      chips.push(<Chip key="grounded" tone="slate" icon={<BookX size={12} />}>No supporting source found · fallback reply</Chip>);
    } else if (guardrails?.grounded === 'partial') {
      chips.push(<Chip key="grounded" tone="slate" icon={<BookX size={12} />}>Only partly supported by the sources</Chip>);
    }
  }
  if (piiTypes && piiTypes.length) {
    const what = piiAction === 'mask' ? 'Personal data masked' : piiAction === 'flag' ? 'Personal data flagged' : 'Personal data detected';
    chips.push(<Chip key="pii" tone="blue" icon={<EyeOff size={12} />}>{what} · {piiList(piiTypes)}</Chip>);
  }
  if (!chips.length) return null;
  return <div className={`mt-1.5 flex flex-wrap gap-1 ${align === 'right' ? 'justify-end' : ''}`}>{chips}</div>;
};

const TAG_LABELS: Record<string, string> = {
  'guardrail:forbidden_topic': 'Forbidden topic',
  'guardrail:safety': 'Safety',
  'guardrail:pii': 'Personal data',
  'guardrail:restricted_reply': 'Restricted reply',
};
export const tagLabel = (t: string) => TAG_LABELS[t] || t;
