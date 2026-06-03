
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { apiService } from '../../services/api';
import { StandaloneAgent, AgentPersona, AgentLLM, AgentGuardrails } from '../../types/standalone';
import PersonaTab from './builder/PersonaTab';
import LLMTab from './builder/LLMTab';
import KnowledgeTab from './builder/KnowledgeTab';
import ActionsTab from './builder/ActionsTab';
import ToolsTab from './builder/ToolsTab';
import ChannelsTab from './builder/ChannelsTab';
import HistoryTab from './builder/HistoryTab';
import ChatPreview from './builder/ChatPreview';
import { 
  Save, 
  ArrowLeft, 
  Settings2, 
  Brain, 
  Database, 
  Zap, 
  Puzzle, 
  Globe, 
  History,
  Rocket,
  ShieldAlert,
  Loader2,
  Trash2,
  MoreVertical,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'persona', name: 'AI Persona', icon: <Settings2 size={16} /> },
  { id: 'llm', name: 'LLM Config', icon: <Brain size={16} /> },
  { id: 'knowledge', name: 'Knowledge Base', icon: <Database size={16} /> },
  { id: 'actions', name: 'Actions', icon: <Zap size={16} /> },
  { id: 'tools', name: 'Tools', icon: <Puzzle size={16} /> },
  { id: 'channels', name: 'Channels & Share', icon: <Globe size={16} /> },
  { id: 'history', name: 'Conversations', icon: <History size={16} /> },
];

const INITIAL_PERSONA: AgentPersona = {
  role: '',
  goal: '',
  instructions: '',
  tone: ['Professional'],
  greeting: 'Hi! How can I help you today?',
  fallback_message: "I'm sorry, I don't have enough information to answer that."
};

const INITIAL_LLM: AgentLLM = {
  provider: 'nvidia',
  model: 'nvidia/nemotron-3-super-120b-a12b:free',
  temperature: 0.3,
  top_p: 1.0,
  max_tokens: 1024
};

const INITIAL_GUARD: AgentGuardrails = {
  hallucination_check: true,
  pii_detection: 'none',
  safety_filter: 'standard',
  forbidden_topics: []
};

const StandaloneAgentBuilder: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('persona');
  const [loading, setLoading] = useState(id !== 'new');
  const [saving, setSaving] = useState(false);
  const [agent, setAgent] = useState<Partial<StandaloneAgent> | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [persona, setPersona] = useState<AgentPersona>(INITIAL_PERSONA);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [llm, setLLM] = useState<AgentLLM>(INITIAL_LLM);
  const [guardrails, setGuardrails] = useState<AgentGuardrails>(INITIAL_GUARD);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (id && id !== 'new') {
      fetchAgent();
    } else {
      setAgent({ 
        status: 'draft',
        channels: [
          { type: 'web', enabled: true, status: 'active' },
          { type: 'whatsapp', enabled: false, status: 'pending' },
          { type: 'slack', enabled: false, status: 'pending' },
          { type: 'instagram', enabled: false, status: 'pending' }
        ]
      });
    }
  }, [id]);

  const fetchAgent = async () => {
    try {
      const response = await apiService.standalone.agents.get(id!);
      if (response.success) {
        const data = response.data;
        setAgent(data);
        setName(data.name);
        setDescription(data.description);
        setPersona(data.persona || INITIAL_PERSONA);
        setSystemPrompt(data.system_prompt || '');
        setLLM(data.llm || INITIAL_LLM);
        setGuardrails(data.guardrails || INITIAL_GUARD);

        // Fetch deployment info if agent exists
        try {
          const deployResponse = await apiService.standalone.agents.getDeployment(id!);
          if (deployResponse.success) {
            setAgent(prev => prev ? ({ ...prev, deployment: deployResponse.data }) : null);
          }
        } catch (e) {
          console.log('No deployment info found');
        }
      }
    } catch (error) {
      toast.error('Failed to load agent configuration');
      navigate('/admin/standalone');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (publish = false) => {
    if (!name) return toast.error('Agent Name is required');
    
    setSaving(true);
    const payload = {
      name,
      description,
      persona,
      system_prompt: systemPrompt,
      llm,
      guardrails,
      channels: agent?.channels
    };

    try {
      let response;
      if (id === 'new') {
        response = await apiService.standalone.agents.create(payload);
        if (response.success) {
          toast.success('Agent initialized successfully');
          navigate(`/admin/standalone/builder/${response.data._id}`);
        }
      } else {
        response = await apiService.standalone.agents.update(id!, payload);
        if (response.success) {
          if (publish) {
            await apiService.standalone.agents.publish(id!);
            toast.success('Agent published successfully');
            setAgent(prev => prev ? ({ ...prev, status: 'published' }) : null);
          } else {
            toast.success('Configuration saved');
          }
        }
      }
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleAutoGenerate = async (desc: string) => {
    if (!desc) return;
    setIsGenerating(true);
    try {
      const response = await apiService.standalone.agents.generate({ 
        description: desc
      });
      
      if (response.success && response.data?.spec) {
        const spec = response.data.spec;
        
        // Populate basic info
        setName((spec.name || '').replace(/^[:\s-]+/, '').trim());
        setDescription((spec.description || '').trim());
        setSystemPrompt((spec.system_prompt || '').trim());
        
        // Populate Persona
        if (spec.persona) {
          setPersona({
            role: spec.persona.role || '',
            goal: spec.persona.goal || '',
            instructions: spec.persona.instructions || '',
            tone: Array.isArray(spec.persona.tone) ? spec.persona.tone : ['Professional'],
            greeting: spec.persona.greeting || 'Hi! How can I help you today?',
            fallback_message: spec.persona.fallback_message || "I'm sorry, I don't have enough info on that."
          });
        }
        
        // Populate LLM
        if (spec.llm) {
          setLLM(prev => ({
            ...prev,
            provider: spec.llm.provider || prev.provider,
            model: spec.llm.model || prev.model,
            temperature: typeof spec.llm.temperature === 'number' ? spec.llm.temperature : prev.temperature,
            max_tokens: typeof spec.llm.max_tokens === 'number' ? spec.llm.max_tokens : prev.max_tokens
          }));
        }
        
        // Populate Guardrails
        if (spec.guardrails) {
          setGuardrails(prev => ({
            ...prev,
            hallucination_check: spec.guardrails.hallucination_check ?? prev.hallucination_check,
            pii_detection: spec.guardrails.pii_detection || prev.pii_detection,
            safety_filter: spec.guardrails.safety_filter || prev.safety_filter,
            forbidden_topics: Array.isArray(spec.guardrails.forbidden_topics) ? spec.guardrails.forbidden_topics : prev.forbidden_topics
          }));
        }
        
        toast.success('Agent logic generated! Review and save when ready.');
      }
    } catch (error) {
      toast.error('AI generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleChannel = (type: string) => {
    if (!agent?.channels) return;
    const newChannels = agent.channels.map(c => 
      c.type === type ? { ...c, enabled: !c.enabled } : c
    );
    setAgent({ ...agent, channels: newChannels });
  };

  const handleDeploy = async (customSlug?: string) => {
    try {
      const response = await apiService.standalone.agents.deploy(id!, customSlug ? { slug: customSlug } : undefined);
      if (response.success) {
        toast.success('Agent deployed successfully');
        // Refresh deployment info
        const deployResponse = await apiService.standalone.agents.getDeployment(id!);
        if (deployResponse.success) {
          setAgent(prev => prev ? ({ ...prev, deployment: deployResponse.data }) : null);
        }
      }
    } catch (error) {
      toast.error('Deployment failed');
    }
  };

  const handleUndeploy = async () => {
    try {
      console.log(`[Undeploy] Initiating for agentId: ${id}`);
      const response = await apiService.standalone.agents.undeploy(id!);
      console.log(`[Undeploy] Response received:`, response);
      if (response.success) {
        toast.success('Agent undeployed successfully');
        // Refresh deployment info
        const deployResponse = await apiService.standalone.agents.getDeployment(id!);
        if (deployResponse.success) {
          setAgent(prev => prev ? ({ ...prev, deployment: deployResponse.data }) : null);
        }
      }
    } catch (error: any) {
      console.error('[Undeploy] error:', error);
      toast.error(error?.message || 'Undeploy failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
         <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-4 border-purple-100 border-t-[#a26da8] rounded-full animate-spin" />
            <p className="text-gray-400 font-black text-xs uppercase tracking-[0.4em] animate-pulse">Mounting Builder Workspace...</p>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20">
      {/* Header Sticky */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-10 py-6">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
             <button 
              onClick={() => navigate('/admin/standalone')}
              className="p-3 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-2xl transition-all"
             >
               <ArrowLeft size={20} />
             </button>
             <div className="w-px h-10 bg-gray-100" />
             <div>
                <div className="flex items-center gap-3">
                   <h1 className="text-xl font-black text-gray-900 tracking-tight">{name || 'New Custom Agent'}</h1>
                   <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                     agent?.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                   }`}>
                     {agent?.status || 'draft'}
                   </span>
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Autonomous Agent Configuration Builder</p>
             </div>
          </div>

          <div className="flex items-center gap-3">
             <button 
              onClick={() => handleSave(false)}
              disabled={saving}
              className="flex items-center gap-2.5 px-6 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-purple-200 hover:text-[#a26da8] transition-all shadow-sm"
             >
               {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
               Save Configuration
             </button>

             {agent?.status === 'draft' && (
               <button 
                onClick={() => handleSave(true)}
                disabled={saving}
                className="flex items-center gap-2.5 px-8 py-3.5 bg-[#a26da8] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#8e5a94] transition-all shadow-xl shadow-purple-100"
               >
                 Publish Agent
                 <Rocket size={16} />
               </button>
             )}

             {agent?.status === 'published' && !agent?.deployment?.is_deployed && (
               <button 
                onClick={() => handleDeploy()}
                disabled={saving}
                className="flex items-center gap-2.5 px-8 py-3.5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200"
               >
                 Deploy Agent
                 <Rocket size={16} />
               </button>
             )}
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-10 mt-10">
         <div className="flex flex-col lg:flex-row gap-10">
            {/* Sidebar Navigation */}
            <div className="w-full lg:w-72 shrink-0">
               <div className="sticky top-32 space-y-1.5">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center justify-between px-6 py-4 rounded-[20px] transition-all relative overflow-hidden group ${
                        activeTab === tab.id 
                        ? 'bg-white shadow-xl shadow-purple-100/50 text-[#a26da8] border border-purple-100' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 relative z-10">
                         <div className={`p-2 rounded-xl transition-all ${activeTab === tab.id ? 'bg-purple-100 text-[#a26da8]' : 'bg-gray-50 text-gray-400 group-hover:text-gray-600'}`}>
                           {tab.icon}
                         </div>
                         <span className="text-[11px] font-black uppercase tracking-tight">{tab.name}</span>
                      </div>
                      {activeTab === tab.id && <ChevronRight size={14} className="relative z-10" />}
                    </button>
                  ))}

                  <div className="mt-10 p-6 bg-gradient-to-br from-purple-50 to-teal-50 rounded-[32px] border border-white">
                     <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={14} className="text-[#a26da8]" />
                        <span className="text-[9px] font-black text-gray-900 uppercase tracking-widest">Builder Tip</span>
                     </div>
                     <p className="text-[11px] font-bold text-gray-500 leading-relaxed uppercase tracking-tight">
                        Configure specialized guardrails to prevent AI hallucinations when using custom knowledge bases.
                     </p>
                  </div>
               </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
               <div className="bg-white rounded-[40px] border border-gray-100 p-10 lg:p-16 shadow-sm min-h-[800px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {activeTab === 'persona' && (
                        <PersonaTab 
                          persona={persona} 
                          onChange={setPersona} 
                          agentName={name}
                          setAgentName={setName}
                          agentDescription={description}
                          setAgentDescription={setDescription}
                          systemPrompt={systemPrompt}
                          setSystemPrompt={setSystemPrompt}
                          onAutoGenerate={handleAutoGenerate}
                          isGenerating={isGenerating}
                        />
                      )}
                      {activeTab === 'llm' && (
                        <LLMTab 
                          llm={llm} 
                          guardrails={guardrails} 
                          onLLMChange={setLLM} 
                          onGuardrailsChange={setGuardrails} 
                        />
                      )}
                      {activeTab === 'knowledge' && (
                        <KnowledgeTab agentId={id!} />
                      )}
                      {activeTab === 'actions' && (
                        <ActionsTab agentId={id!} />
                      )}
                      {activeTab === 'tools' && (
                        <ToolsTab agentId={id!} />
                      )}
                      {activeTab === 'channels' && (
                        <ChannelsTab 
                          channels={agent?.channels || []} 
                          agentId={id!} 
                          slug={agent?.slug || ''}
                          shareToken={agent?.share_token}
                          deployment={agent?.deployment}
                          onToggle={handleToggleChannel}
                          onDeploy={handleDeploy}
                          onUndeploy={handleUndeploy}
                        />
                      )}
                      {activeTab === 'history' && (
                         <HistoryTab agentId={id!} />
                      )}
                    </motion.div>
                  </AnimatePresence>
               </div>
            </div>
         </div>
      </div>
      <ChatPreview agentId={id!} />
    </div>
  );
};

export default StandaloneAgentBuilder;
