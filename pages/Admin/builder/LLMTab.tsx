
import React, { useState } from 'react';
import { AgentLLM, AgentGuardrails } from '../../../types/standalone';
import { Brain, ShieldCheck, Check, X } from 'lucide-react';

interface LLMTabProps {
  llm: AgentLLM;
  guardrails: AgentGuardrails;
  onLLMChange: (llm: AgentLLM) => void;
  onGuardrailsChange: (gr: AgentGuardrails) => void;
}

const PROVIDERS = [
  { id: 'nvidia', name: 'NVIDIA', models: ['nvidia/nemotron-3-super-120b-a12b:free'] }
];

const PII_OPTIONS = [
  { id: 'none', label: 'None', hint: 'Personal data is left as it is.' },
  { id: 'mask', label: 'Mask', hint: 'Personal data such as emails, phone and ID numbers is hidden in conversations.' },
  { id: 'flag', label: 'Flag', hint: 'Conversations that contain personal data are flagged for review.' },
];

const SAFETY_OPTIONS = [
  { id: 'relaxed', label: 'Relaxed', hint: 'Blocks only clearly harmful requests.' },
  { id: 'standard', label: 'Standard', hint: 'Blocks harmful, abusive and unsafe content. Recommended for most agents.' },
  { id: 'strict', label: 'Strict', hint: 'Also declines sensitive and borderline requests.' },
];

const temperatureHint = (t: number) =>
  t <= 0.4 ? 'Precise: consistent, factual answers.' : t <= 1 ? 'Balanced: factual with some variety in wording.' : 'Creative: more varied, less predictable answers.';

const SectionHeader: React.FC<{ icon: React.ReactNode; tone: string; title: string; subtitle: string }> = ({ icon, tone, title, subtitle }) => (
  <div className="flex items-start gap-3">
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>{icon}</div>
    <div>
      <h3 className="text-[17px] font-semibold text-slate-900 leading-tight">{title}</h3>
      <p className="mt-0.5 text-[13px] text-slate-500">{subtitle}</p>
    </div>
  </div>
);

const FieldLabel: React.FC<{ children: React.ReactNode; value?: React.ReactNode }> = ({ children, value }) => (
  <div className="mb-2 flex items-center justify-between gap-2">
    <span className="text-[13px] font-medium text-slate-700">{children}</span>
    {value !== undefined && <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[12.5px] font-semibold tabular-nums text-[#8a5a90]">{value}</span>}
  </div>
);

// Segmented control. A saved value outside the options (e.g. set by the generator) is reported, not hidden.
const Segmented: React.FC<{ label: string; options: { id: string; label: string; hint: string }[]; value: string; onChange: (v: string) => void }> = ({ label, options, value, onChange }) => {
  const current = options.find(o => o.id === value);
  return (
    <div>
      <div role="radiogroup" aria-label={label} className="flex w-full rounded-lg bg-slate-100 p-1">
        {options.map(o => {
          const on = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o.id)}
              className={`flex-1 rounded-md px-3 py-1.5 text-[13px] font-medium transition-all ${on ? 'bg-white text-[#7d4f83] shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {current
        ? <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500">{current.hint}</p>
        : <p className="mt-2 text-[12.5px] leading-relaxed text-amber-700">Saved value “{value || 'empty'}” isn't one of these options. Choose one to replace it.</p>}
    </div>
  );
};

const Switch: React.FC<{ checked: boolean; onChange: () => void; label: string }> = ({ checked, onChange, label }) => (
  <div className="flex items-center gap-2.5">
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-200 ${checked ? 'bg-[#a26da8]' : 'bg-slate-300'}`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
    </button>
    <span className={`text-[13px] font-medium ${checked ? 'text-slate-900' : 'text-slate-500'}`}>{checked ? 'On' : 'Off'}</span>
  </div>
);

// Topics as chips: Enter or a comma adds one, × or Backspace removes one. Stored as string[] exactly as before.
const TopicsInput: React.FC<{ value: string[]; onChange: (v: string[]) => void }> = ({ value, onChange }) => {
  const [draft, setDraft] = useState('');
  const topics = (Array.isArray(value) ? value : []).filter(t => t && String(t).trim());
  const add = (raw: string) => {
    const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
    setDraft('');
    if (!parts.length) return;
    const next = [...topics];
    parts.forEach(p => { if (!next.some(t => t.toLowerCase() === p.toLowerCase())) next.push(p); });
    onChange(next);
  };
  const remove = (i: number) => onChange(topics.filter((_, j) => j !== i));
  return (
    <div>
      <div className="flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 py-1.5 transition focus-within:border-[#a26da8] focus-within:ring-2 focus-within:ring-purple-100">
        {topics.map((t, i) => (
          <span key={`${t}-${i}`} className="inline-flex items-center gap-1 rounded-md bg-slate-100 py-0.5 pl-2 pr-1 text-[13px] text-slate-700">
            {t}
            <button type="button" aria-label={`Remove ${t}`} onClick={() => remove(i)} className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700">
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => { const v = e.target.value; if (v.includes(',')) add(v); else setDraft(v); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); add(draft); }
            else if (e.key === 'Backspace' && !draft && topics.length) remove(topics.length - 1);
          }}
          onBlur={() => { if (draft.trim()) add(draft); }}
          placeholder={topics.length ? 'Add another topic' : 'e.g. medical advice, competitor pricing'}
          className="min-w-[180px] flex-1 border-0 bg-transparent px-1 py-1 text-[13.5px] text-slate-900 placeholder:text-slate-400 outline-none focus:ring-0"
        />
      </div>
      <p className="mt-2 text-[12.5px] text-slate-500">Press Enter or type a comma to add a topic. The agent politely declines questions on these topics.</p>
    </div>
  );
};

const SettingRow: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
  <div className="grid grid-cols-1 gap-3 border-b border-slate-100 py-5 last:border-0 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-10">
    <div>
      <div className="text-[14px] font-semibold text-slate-900">{title}</div>
      <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500">{description}</p>
    </div>
    <div className="min-w-0">{children}</div>
  </div>
);

const LLMTab: React.FC<LLMTabProps> = ({ llm, guardrails, onLLMChange, onGuardrailsChange }) => {
  const updateLLM = (field: keyof AgentLLM, value: any) => {
    let nextLLM = { ...llm, [field]: value };
    if (field === 'provider') {
      const provider = PROVIDERS.find(p => p.id === value);
      if (provider && provider.models.length > 0) {
        nextLLM.model = provider.models[0];
      }
    }
    onLLMChange(nextLLM);
  };

  const updateGuard = (field: keyof AgentGuardrails, value: any) => {
    onGuardrailsChange({ ...guardrails, [field]: value });
  };

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Language model */}
      <section className="space-y-6">
        <SectionHeader icon={<Brain size={20} />} tone="bg-purple-50 text-[#a26da8]" title="Large language model" subtitle="Choose the model your agent runs on and how it responds." />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <div>
              <FieldLabel>Provider</FieldLabel>
              <div className="grid grid-cols-1 gap-2">
                {PROVIDERS.map(p => {
                  const on = llm.provider === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => updateLLM('provider', p.id)}
                      className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${on ? 'border-[#a26da8] bg-purple-50/60' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    >
                      <span className={`text-[14px] font-semibold ${on ? 'text-[#7d4f83]' : 'text-slate-700'}`}>{p.name}</span>
                      {on && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#a26da8] text-white"><Check size={12} strokeWidth={3} /></span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <FieldLabel>Model</FieldLabel>
              <select
                value={llm.model}
                onChange={(e) => updateLLM('model', e.target.value)}
                disabled
                className="h-10 w-full cursor-not-allowed appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13.5px] font-medium text-slate-600"
              >
                {PROVIDERS.find(p => p.id === llm.provider)?.models.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <p className="mt-2 text-[12.5px] text-slate-500">The model is set by the selected provider.</p>
            </div>

            <div>
              <FieldLabel>Live web search</FieldLabel>
              <Switch
                checked={llm.allow_web_search !== false}
                onChange={() => updateLLM('allow_web_search', llm.allow_web_search === false)}
                label="Live web search"
              />
              <p className="mt-2 text-[12.5px] text-slate-500">Lets the agent look up current information on the web. Turn it off for agents that must answer only from your knowledge base.</p>
            </div>
          </div>

          <div className="space-y-7 rounded-xl border border-slate-200 bg-slate-50/60 p-5">
            <div>
              <FieldLabel value={llm.temperature}>Temperature</FieldLabel>
              <input
                type="range"
                min="0" max="2" step="0.1"
                value={llm.temperature}
                onChange={(e) => updateLLM('temperature', parseFloat(e.target.value))}
                aria-label="Temperature"
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-[#a26da8]"
              />
              <div className="mt-1.5 flex justify-between text-[12px] text-slate-500">
                <span>Precise</span>
                <span>Balanced</span>
                <span>Creative</span>
              </div>
              <p className="mt-2 text-[12.5px] text-slate-500">{temperatureHint(llm.temperature)}</p>
            </div>

            <div>
              <FieldLabel value={Number(llm.max_tokens).toLocaleString()}>Max response tokens</FieldLabel>
              <input
                type="range"
                min="256" max="8192" step="256"
                value={llm.max_tokens}
                onChange={(e) => updateLLM('max_tokens', parseInt(e.target.value))}
                aria-label="Max response tokens"
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-[#a26da8]"
              />
              <div className="mt-1.5 flex justify-between text-[12px] text-slate-500">
                <span>256</span>
                <span>8,192</span>
              </div>
              <p className="mt-2 text-[12.5px] text-slate-500">Upper limit for one reply. Higher limits allow fuller answers but take longer.</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI guardrails */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-6 py-5">
          <SectionHeader icon={<ShieldCheck size={20} />} tone="bg-teal-50 text-[#3d9a91]" title="AI Guardrails" subtitle="Safety boundaries and data protection for every conversation." />
        </div>

        <div className="px-6">
          <SettingRow title="Hallucination check" description="Verify answers against the knowledge base before replying.">
            <Switch
              checked={!!guardrails.hallucination_check}
              onChange={() => updateGuard('hallucination_check', !guardrails.hallucination_check)}
              label="Hallucination check"
            />
          </SettingRow>

          <SettingRow title="PII detection & masking" description="How personal data such as emails, phone numbers and ID numbers is handled.">
            <Segmented label="PII detection and masking" options={PII_OPTIONS} value={guardrails.pii_detection} onChange={(v) => updateGuard('pii_detection', v)} />
          </SettingRow>

          <SettingRow title="Safety filter level" description="How strictly harmful or inappropriate requests are declined.">
            <Segmented label="Safety filter level" options={SAFETY_OPTIONS} value={guardrails.safety_filter} onChange={(v) => updateGuard('safety_filter', v)} />
          </SettingRow>

          <SettingRow title="Forbidden topics" description="Topics the agent must never discuss.">
            <TopicsInput value={guardrails.forbidden_topics} onChange={(v) => updateGuard('forbidden_topics', v)} />
          </SettingRow>
        </div>
      </section>
    </div>
  );
};

export default LLMTab;
