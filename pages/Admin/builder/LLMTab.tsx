
import React from 'react';
import { AgentLLM, AgentGuardrails } from '../../../types/standalone';
import { Brain, ShieldCheck, Gauge, Eye, Zap } from 'lucide-react';

interface LLMTabProps {
  llm: AgentLLM;
  guardrails: AgentGuardrails;
  onLLMChange: (llm: AgentLLM) => void;
  onGuardrailsChange: (gr: AgentGuardrails) => void;
}

const PROVIDERS = [
  { id: 'nvidia', name: 'NVIDIA', models: ['nvidia/nemotron-3-super-120b-a12b:free'] }
];

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
    <div className="space-y-12 animate-fadeIn">
      {/* Brain Configuration */}
      <section className="space-y-8">
        <div className="flex items-center gap-3 border-b border-gray-50 pb-5">
           <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#a26da8]">
              <Brain size={20} />
           </div>
           <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Large Language Model</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select the intelligence layer for your agent</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Provider & Engine</label>
              <div className="grid grid-cols-1 gap-3">
                {PROVIDERS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => updateLLM('provider', p.id)}
                    className={`flex items-center justify-between px-6 py-4 rounded-[20px] transition-all ${
                      llm.provider === p.id 
                      ? 'bg-purple-50 border-2 border-[#a26da8] text-[#a26da8]' 
                      : 'bg-white border-2 border-gray-50 text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    <span className="font-black text-sm uppercase tracking-tight">{p.name}</span>
                    {llm.provider === p.id && <Zap size={14} className="fill-current" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Specific Model</label>
              <select 
                value={llm.model}
                onChange={(e) => updateLLM('model', e.target.value)}
                disabled
                className="w-full px-6 py-4 bg-white border border-gray-100 rounded-[24px] text-sm font-black text-gray-900 shadow-sm focus:ring-2 focus:ring-purple-100 appearance-none transition-all cursor-not-allowed opacity-50"
              >
                {PROVIDERS.find(p => p.id === llm.provider)?.models.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-10 bg-gray-50/50 p-8 rounded-[40px] border border-gray-50">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Temperature</label>
                <span className="text-xs font-black text-[#a26da8] bg-purple-100 px-3 py-1 rounded-lg">{llm.temperature}</span>
              </div>
              <input 
                type="range" 
                min="0" max="2" step="0.1" 
                value={llm.temperature}
                onChange={(e) => updateLLM('temperature', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#a26da8]"
              />
              <div className="flex justify-between text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                <span>Precise</span>
                <span>Creative</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Max Response Tokens</label>
                <span className="text-xs font-black text-[#a26da8] bg-purple-100 px-3 py-1 rounded-lg">{llm.max_tokens}</span>
              </div>
              <input 
                type="range" 
                min="256" max="8192" step="256" 
                value={llm.max_tokens}
                onChange={(e) => updateLLM('max_tokens', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#a26da8]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Safety Guardrails */}
      <section className="space-y-8 bg-white border border-gray-100 rounded-[40px] p-10">
        <div className="flex items-center gap-3 border-b border-gray-50 pb-5">
           <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#4db6ac]">
              <ShieldCheck size={20} />
           </div>
           <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">AI Guardrails</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Configure safety boundaries and data protection</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
           <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                 <div className="flex flex-col">
                    <span className="text-xs font-black text-gray-900 uppercase tracking-tight">Hallucination Check</span>
                    <span className="text-[10px] font-medium text-gray-400">Verify responses against knowledge base</span>
                 </div>
                 <button 
                  onClick={() => updateGuard('hallucination_check', !guardrails.hallucination_check)}
                  className={`w-14 h-8 rounded-full transition-all relative ${guardrails.hallucination_check ? 'bg-[#a26da8]' : 'bg-gray-200'}`}
                 >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${guardrails.hallucination_check ? 'left-7' : 'left-1'}`} />
                 </button>
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">PII Detection & Masking</label>
                 <div className="grid grid-cols-3 gap-2">
                    {(['none', 'mask', 'flag'] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => updateGuard('pii_detection', m)}
                        className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          guardrails.pii_detection === m 
                          ? 'bg-gray-900 text-white' 
                          : 'bg-white border border-gray-100 text-gray-400'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Safety Filter Level</label>
                 <div className="grid grid-cols-3 gap-2">
                    {(['relaxed', 'standard', 'strict'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => updateGuard('safety_filter', s)}
                        className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          guardrails.safety_filter === s 
                          ? 'bg-[#4db6ac] text-white shadow-lg shadow-teal-100' 
                          : 'bg-white border border-gray-100 text-gray-400'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Forbidden Topics</label>
                 <input 
                  type="text" 
                  placeholder="Comma separated topics to avoid..."
                  value={guardrails.forbidden_topics.join(', ')}
                  onChange={(e) => updateGuard('forbidden_topics', e.target.value.split(',').map(t => t.trim()))}
                  className="w-full px-6 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-purple-100 transition-all"
                 />
              </div>
           </div>
        </div>
      </section>
    </div>
  );
};

export default LLMTab;
