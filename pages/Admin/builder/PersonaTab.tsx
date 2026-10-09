
import React, { useLayoutEffect, useRef, useState } from 'react';
import { AgentPersona } from '../../../types/standalone';
import { User, Target, ListChecks, MessageSquare, Volume2, HelpCircle, Sparkles, Loader2, Check } from 'lucide-react';

interface PersonaTabProps {
  persona: AgentPersona;
  onChange: (persona: AgentPersona) => void;
  agentName: string;
  setAgentName: (name: string) => void;
  agentDescription: string;
  setAgentDescription: (desc: string) => void;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  onAutoGenerate: (desc: string) => void;
  isGenerating: boolean;
}

const TONES = ['Friendly', 'Professional', 'Concise', 'Humorous', 'Empathetic', 'Firm', 'Technical'];

const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#a26da8] focus:ring-2 focus:ring-purple-100';

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
  <div className="flex items-start gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-[#a26da8]">{icon}</div>
    <div>
      <h3 className="text-[17px] font-semibold text-slate-900 leading-tight">{title}</h3>
      <p className="mt-0.5 text-[13px] text-slate-500">{subtitle}</p>
    </div>
  </div>
);

const Label: React.FC<{ icon?: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-slate-700">
    {icon && <span className="text-[#a26da8]">{icon}</span>}
    {children}
  </label>
);

// Multi-line field that fits its text (also when loaded from the server) and can be resized by dragging.
// It only grows on its own, so a height the user set with the resize handle is kept.
const AutoTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className, value, ...rest }) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && el.scrollHeight > el.clientHeight) el.style.height = `${Math.min(el.scrollHeight + 4, 320)}px`; // + border and zoom rounding
  }, [value]);
  return <textarea ref={ref} rows={1} value={value} {...rest} className={`${inputCls} min-h-[42px] resize-y overflow-y-auto leading-5 ${className || ''}`} />;
};

const Hint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="mt-1.5 text-[12.5px] text-slate-500">{children}</p>
);

const PersonaTab: React.FC<PersonaTabProps> = ({
  persona,
  onChange,
  agentName,
  setAgentName,
  agentDescription,
  setAgentDescription,
  systemPrompt,
  setSystemPrompt,
  onAutoGenerate,
  isGenerating
}) => {
  const [autoDesc, setAutoDesc] = useState('');

  const handleChange = (field: keyof AgentPersona, value: any) => {
    onChange({ ...persona, [field]: value });
  };

  const toggleTone = (tone: string) => {
    const newTones = persona.tone.includes(tone)
      ? persona.tone.filter(t => t !== tone)
      : [...persona.tone, tone];
    handleChange('tone', newTones);
  };

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* AI Assistant Generator */}
      <div className="relative overflow-hidden rounded-xl border border-purple-100 bg-gradient-to-br from-[#a26da8]/5 to-purple-50 p-6">
         <div className="relative z-10">
            <div className="flex items-start gap-3">
               <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-purple-100 bg-white text-[#a26da8] shadow-sm">
                  <Sparkles size={20} />
               </div>
               <div>
                  <h3 className="text-[17px] font-semibold text-slate-900 leading-tight">
                    {agentName ? 'Describe to update' : 'Describe & generate'}
                  </h3>
                  <p className="mt-0.5 text-[13px] text-slate-600">Let AI build your agent's personality and logic from a short description.</p>
               </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
               <input
                 type="text"
                 value={autoDesc}
                 onChange={(e) => setAutoDesc(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && autoDesc && onAutoGenerate(autoDesc)}
                 placeholder="e.g. A dental clinic assistant that helps patients book cleaning appointments..."
                 className={`${inputCls} h-11 flex-1`}
               />
               <button
                 onClick={() => onAutoGenerate(autoDesc)}
                 disabled={isGenerating || !autoDesc}
                 className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-[13.5px] font-medium text-white shadow-sm transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
               >
                 {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                 {isGenerating ? 'Designing...' : 'Generate'}
               </button>
            </div>
            <p className="mt-2.5 flex items-center gap-2 text-[12.5px] text-slate-500">
               <span className="h-1.5 w-1.5 rounded-full bg-[#a26da8]" />
               AI will decide the name, description, role, goal and system instructions.
            </p>
         </div>

         {/* Decorative Background Elements */}
         <div className="pointer-events-none absolute -right-10 -top-10 p-8 text-[#a26da8]/5">
            <Sparkles size={180} strokeWidth={1} />
         </div>
      </div>

      {/* Identity */}
      <section className="space-y-5">
        <SectionHeader icon={<User size={20} />} title="Identity" subtitle="How the agent is named and described in Avagama." />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <Label>Agent name</Label>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="e.g. Dental Care Assistant"
              className={inputCls}
            />
          </div>
          <div>
            <Label>Description</Label>
            <AutoTextarea
              value={agentDescription}
              onChange={(e) => setAgentDescription(e.target.value)}
              placeholder="Briefly describe what this agent does..."
            />
          </div>
        </div>
      </section>

      <div className="h-px bg-slate-100" />

      {/* Role & behaviour */}
      <section className="space-y-5">
        <SectionHeader icon={<Target size={20} />} title="Role & behaviour" subtitle="What the agent is, what it aims for and the rules it follows." />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <Label>Agent role</Label>
            <input
              type="text"
              value={persona.role}
              onChange={(e) => handleChange('role', e.target.value)}
              placeholder="e.g. Customer Support Specialist"
              className={inputCls}
            />
            <Hint>The specific occupation or title the agent assumes during interaction.</Hint>
          </div>

          <div>
            <Label>Goal</Label>
            <AutoTextarea
              value={persona.goal}
              onChange={(e) => handleChange('goal', e.target.value)}
              placeholder="e.g. Resolve customer technical issues with empathy"
            />
            <Hint>The ultimate objective this agent is trying to achieve in every conversation.</Hint>
          </div>
        </div>

        <div>
          <Label icon={<ListChecks size={14} />}>Detailed instructions & behaviour</Label>
          <textarea
            rows={6}
            value={persona.instructions}
            onChange={(e) => handleChange('instructions', e.target.value)}
            placeholder="How should the agent behave? What are the edge cases? (Bullet points work best)"
            className={`${inputCls} leading-relaxed`}
          />
        </div>

        <div>
          <Label icon={<Sparkles size={14} />}>System prompt</Label>
          <textarea
            rows={10}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Full system prompt with identity, mission, and response structure..."
            className={`${inputCls} bg-slate-50 font-mono text-[12.5px] leading-relaxed text-slate-700`}
          />
          <Hint>The underlying core prompt that defines the final interaction logic.</Hint>
        </div>
      </section>

      <div className="h-px bg-slate-100" />

      {/* Conversation style */}
      <section className="space-y-5">
        <SectionHeader icon={<Volume2 size={20} />} title="Conversation style" subtitle="Tone of voice and the standard messages the agent uses." />

        <div>
          <Label>Tone of voice</Label>
          <div className="flex flex-wrap gap-2">
            {TONES.map(tone => {
              const on = persona.tone.includes(tone);
              return (
                <button
                  key={tone}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleTone(tone)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                    on
                    ? 'border-[#a26da8] bg-purple-50 text-[#7d4f83]'
                    : 'border-slate-300 bg-white text-slate-600 hover:border-[#a26da8] hover:text-[#7d4f83]'
                  }`}
                >
                  {on && <Check size={13} strokeWidth={3} />}
                  {tone}
                </button>
              );
            })}
          </div>
          <Hint>Select one or more.</Hint>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <Label icon={<MessageSquare size={14} />}>Initial greeting</Label>
            <AutoTextarea
              value={persona.greeting}
              onChange={(e) => handleChange('greeting', e.target.value)}
              placeholder="Hi! I'm Sarah, how can I help you today?"
            />
            <Hint>The first message users see.</Hint>
          </div>
          <div>
            <Label icon={<HelpCircle size={14} />}>Fallback response</Label>
            <AutoTextarea
              value={persona.fallback_message}
              onChange={(e) => handleChange('fallback_message', e.target.value)}
              placeholder="I'm sorry, I don't have enough info on that. Let me connect a human."
            />
            <Hint>Used when the agent cannot answer.</Hint>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PersonaTab;
