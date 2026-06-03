
import React, { useState } from 'react';
import { AgentPersona } from '../../../types/standalone';
import { User, Target, ListChecks, MessageSquare, Volume2, HelpCircle, Sparkles, Loader2 } from 'lucide-react';

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
      <div className="bg-gradient-to-br from-[#a26da8]/5 to-purple-50 rounded-[40px] p-10 border border-white relative overflow-hidden group">
         <div className="relative z-10">
            <div className="flex items-center gap-4 mb-2">
               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#a26da8] shadow-sm border border-purple-50">
                  <Sparkles size={24} />
               </div>
               <div>
                  <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">Describe & Generate</h3>
                  <p className="text-[10px] font-black text-[#a26da8] uppercase tracking-widest">Let AI build your agent's personality & logic</p>
               </div>
            </div>
            
            <div className="mt-8 flex flex-col md:flex-row items-center gap-4">
               <div className="flex-1 w-full relative">
                  <input 
                    type="text"
                    value={autoDesc}
                    onChange={(e) => setAutoDesc(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && autoDesc && onAutoGenerate(autoDesc)}
                    placeholder="e.g. A dental clinic assistant that helps patients book cleaning appointments..."
                    className="w-full px-10 py-5 bg-white border border-[#a26da8]/10 rounded-[28px] text-sm font-bold text-gray-900 placeholder:text-gray-300 focus:ring-4 focus:ring-[#a26da8]/10 focus:border-[#a26da8] outline-none transition-all shadow-sm pr-40"
                  />
                  <button 
                    onClick={() => onAutoGenerate(autoDesc)}
                    disabled={isGenerating || !autoDesc}
                    className="absolute right-2.5 top-2.5 px-8 py-3 bg-gray-900 text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {isGenerating ? 'Designing...' : 'Generate'}
                  </button>
               </div>
            </div>
            <p className="mt-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-[#a26da8]" />
               AI will decide Name, Description, Role, Goal & System Instructions
            </p>
         </div>
         
         {/* Decorative Background Elements */}
         <div className="absolute -top-10 -right-10 p-8 text-[#a26da8]/5 group-hover:text-[#a26da8]/10 transition-colors pointer-events-none">
            <Sparkles size={200} strokeWidth={1} />
         </div>
         <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/40 blur-3xl rounded-full pointer-events-none" />
      </div>

      <div className="h-px bg-gray-50 mx-10" />

      {/* Basic Identity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
            <User size={14} className="text-[#a26da8]" />
            Agent Name
          </label>
          <input 
            type="text" 
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            placeholder="e.g. Dental Care Assistant"
            className="w-full px-6 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-black text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-purple-100 transition-all"
          />
        </div>
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
            <ListChecks size={14} className="text-[#a26da8]" />
            Description
          </label>
          <textarea 
            rows={1}
            value={agentDescription}
            onChange={(e) => setAgentDescription(e.target.value)}
            placeholder="Briefly describe what this agent does..."
            className="w-full px-6 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-purple-100 transition-all resize-none overflow-hidden"
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            }}
          />
        </div>
      </div>

      <div className="h-px bg-gray-50" />

      {/* Core Persona */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
            <Target size={14} className="text-[#a26da8]" />
            Agent Role
          </label>
          <input 
            type="text" 
            value={persona.role}
            onChange={(e) => handleChange('role', e.target.value)}
            placeholder="e.g. Customer Support Specialist"
            className="w-full px-6 py-4 bg-white border border-gray-100 rounded-[24px] text-sm font-bold text-gray-900 shadow-sm focus:ring-2 focus:ring-purple-100 transition-all"
          />
          <p className="px-2 text-[10px] font-medium text-gray-400">The specific occupation or title the agent assumes during interaction.</p>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
            <Sparkles size={14} className="text-[#a26da8]" />
            Goal
          </label>
          <input 
            type="text" 
            value={persona.goal}
            onChange={(e) => handleChange('goal', e.target.value)}
            placeholder="e.g. Resolve customer technical issues with empathy"
            className="w-full px-6 py-4 bg-white border border-gray-100 rounded-[24px] text-sm font-bold text-gray-900 shadow-sm focus:ring-2 focus:ring-purple-100 transition-all"
          />
          <p className="px-2 text-[10px] font-medium text-gray-400">The ultimate objective this agent is trying to achieve in every conversation.</p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
          <ListChecks size={14} className="text-[#a26da8]" />
          Detailed Instructions & Behavior
        </label>
        <textarea 
          rows={6}
          value={persona.instructions}
          onChange={(e) => handleChange('instructions', e.target.value)}
          placeholder="How should the agent behave? What are the edge cases? (Bullet points work best)"
          className="w-full px-8 py-6 bg-white border border-gray-100 rounded-[32px] text-sm font-medium text-gray-900 shadow-sm focus:ring-2 focus:ring-purple-100 transition-all leading-relaxed"
        />
      </div>

      <div className="space-y-4">
        <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
          <Sparkles size={14} className="text-[#a26da8]" />
          System Prompt
        </label>
        <textarea 
          rows={10}
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="Full system prompt with identity, mission, and response structure..."
          className="w-full px-8 py-6 bg-[#fafafa] border border-gray-50 rounded-[32px] text-[11px] font-mono text-gray-600 shadow-inner focus:ring-2 focus:ring-purple-100 transition-all leading-relaxed"
        />
        <p className="px-2 text-[10px] font-medium text-gray-400 uppercase tracking-tight">The underlying core prompt that defines the final interaction logic.</p>
      </div>

      <div className="h-px bg-gray-50" />

      {/* Communication Style */}
      <div className="space-y-8">
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
            <Volume2 size={14} className="text-[#a26da8]" />
            Tone of Voice
          </label>
          <div className="flex flex-wrap gap-2">
            {TONES.map(tone => (
              <button
                key={tone}
                onClick={() => toggleTone(tone)}
                className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  persona.tone.includes(tone)
                  ? 'bg-purple-100 text-[#a26da8] shadow-sm'
                  : 'bg-white border border-gray-100 text-gray-400 hover:border-[#a26da8] hover:text-[#a26da8]'
                }`}
              >
                {tone}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
              <MessageSquare size={14} className="text-[#a26da8]" />
              Initial Greeting
            </label>
            <input 
              type="text" 
              value={persona.greeting}
              onChange={(e) => handleChange('greeting', e.target.value)}
              placeholder="Hi! I'm Sarah, how can I help you today?"
              className="w-full px-6 py-4 bg-white border border-gray-100 rounded-[24px] text-sm font-bold text-gray-900 shadow-sm focus:ring-2 focus:ring-purple-100 transition-all"
            />
          </div>
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
              <HelpCircle size={14} className="text-[#a26da8]" />
              Fallback Response
            </label>
            <input 
              type="text" 
              value={persona.fallback_message}
              onChange={(e) => handleChange('fallback_message', e.target.value)}
              placeholder="I'm sorry, I don't have enough info on that. Let me connect a human."
              className="w-full px-6 py-4 bg-white border border-gray-100 rounded-[24px] text-sm font-bold text-gray-900 shadow-sm focus:ring-2 focus:ring-purple-100 transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonaTab;
