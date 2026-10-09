
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
import toast from '../../components/studio/notify';

const TABS = [
  { id: 'persona', name: 'AI Persona', hint: 'Role, goal and instructions', icon: <Settings2 size={16} /> },
  { id: 'llm', name: 'LLM Config', hint: 'Model and guardrails', icon: <Brain size={16} /> },
  { id: 'knowledge', name: 'Knowledge Base', hint: 'Files, websites, text and Q&A', icon: <Database size={16} /> },
  { id: 'actions', name: 'Actions', hint: 'Triggers and follow-up actions', icon: <Zap size={16} /> },
  { id: 'tools', name: 'Tools', hint: 'Integrations the agent can call', icon: <Puzzle size={16} /> },
  { id: 'channels', name: 'Channels & Share', hint: 'Deploy and share links', icon: <Globe size={16} /> },
  { id: 'history', name: 'Conversations', hint: 'Chat history', icon: <History size={16} /> },
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
  max_tokens: 5000
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
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

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
      llm: {
        ...llm,
        provider: llm.provider.toLowerCase(),
        max_tokens: Math.min(llm.max_tokens, 8192)
      },
      guardrails: {
        ...guardrails,
        pii_detection: guardrails.pii_detection.toLowerCase(),
        safety_filter: guardrails.safety_filter.toLowerCase(),
        forbidden_topics: Array.isArray(guardrails.forbidden_topics) 
          ? guardrails.forbidden_topics 
          : String(guardrails.forbidden_topics).split(',').map(s => s.trim()).filter(Boolean)
      },
      channels: agent?.channels
    };

    try {
      let response;
      if (id === 'new') {
        response = await apiService.standalone.agents.create(payload);
        if (response.success) {
          const newId = response.data._id;
          if (publish) {
            try {
              const pubResponse = await apiService.standalone.agents.publish(newId);
              if (pubResponse.success) {
                toast.success('Agent published successfully');
                navigate(`/admin/standalone/builder/${newId}`, { replace: true });
                return;
              }
            } catch (e) {
              console.error('Initial publish failed:', e);
            }
          }
          toast.success('Agent initialized successfully');
          navigate(`/admin/standalone/builder/${newId}`, { replace: true });
        }
      } else {
        response = await apiService.standalone.agents.update(id!, payload);
        if (response.success) {
          if (publish) {
            const pubResponse = await apiService.standalone.agents.publish(id!);
            if (pubResponse.success) {
              toast.success('Agent published successfully');
              fetchAgent();
            } else {
              toast.error(pubResponse.message || 'Publish failed');
            }
          } else {
            toast.success('Configuration saved');
            setAgent(response.data);
          }
        } else {
          toast.error(response.message || 'Failed to save configuration');
        }
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save configuration');
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
        // "fallback" = the AI models were unavailable and the backend returned placeholders:
        // keep what the user already has instead of overwriting it.
        if (response.data?.meta?.generated_by === 'fallback') {
          toast.warning('AI generation is unavailable right now, so nothing was changed. Please try Generate again in a minute.', { duration: 7000 });
          return;
        }
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
      <div className="min-h-screen flex items-center justify-center bg-[#f6f7f9]">
         <div className="flex items-center gap-3 text-[14px] text-slate-500">
            <Loader2 size={20} className="animate-spin text-[#a26da8]" />
            Loading agent builder…
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f9] pb-20">
      {/* Header Sticky */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 lg:px-10 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
             <button
              onClick={() => navigate('/admin/standalone')}
              title="Back to agents"
              aria-label="Back to agents"
              className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
             >
               <ArrowLeft size={18} />
             </button>
             <div className="min-w-0">
                <div className="flex items-center gap-2.5 min-w-0">
                   <h1 className="truncate text-[19px] font-semibold text-slate-900 leading-tight">{name || 'New Custom Agent'}</h1>
                   <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-[12px] font-medium capitalize ${
                     agent?.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                   }`}>
                     <span className={`h-1.5 w-1.5 rounded-full ${agent?.status === 'published' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                     {agent?.status || 'draft'}
                   </span>
                   {agent?.deployment?.is_deployed && (
                     <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-blue-50 px-2 py-0.5 text-[12px] font-medium text-blue-700">
                       <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                       Deployed
                     </span>
                   )}
                </div>
                <p className="mt-0.5 text-[13px] text-slate-500">Autonomous agent configuration builder</p>
             </div>
          </div>

          <div className="flex items-center gap-2.5">
             <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-[13.5px] font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
             >
               {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
               Save configuration
             </button>

             {agent?.status === 'draft' && (
               <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="flex h-10 items-center gap-2 rounded-lg bg-[#a26da8] px-4 text-[13.5px] font-medium text-white shadow-sm hover:bg-[#8e5a94] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
               >
                 <Rocket size={16} />
                 Publish agent
               </button>
             )}

             {agent?.status === 'published' && !agent?.deployment?.is_deployed && (
               <button
                onClick={() => handleDeploy()}
                disabled={saving}
                className="flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-[13.5px] font-medium text-white shadow-sm hover:bg-black disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
               >
                 <Rocket size={16} />
                 Deploy agent
               </button>
             )}
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 mt-8">
         <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Navigation */}
            <div className="w-full lg:w-72 shrink-0">
               <div className="sticky top-28 space-y-4">
                  <nav className="rounded-xl border border-slate-200 bg-white p-2 space-y-0.5" aria-label="Agent builder sections">
                    {TABS.map((tab) => {
                      const active = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          aria-current={active ? 'page' : undefined}
                          className={`relative w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                            active ? 'bg-[#a26da8]/10 text-[#7d4f83]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-[#8a5a90]" />}
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${active ? 'bg-white text-[#8a5a90] shadow-sm' : 'bg-slate-50 text-slate-500'}`}>
                            {tab.icon}
                          </span>
                          <span className="min-w-0">
                            <span className={`block truncate text-[13.5px] ${active ? 'font-semibold' : 'font-medium'}`}>{tab.name}</span>
                            <span className="block truncate text-[12px] text-slate-500">{tab.hint}</span>
                          </span>
                        </button>
                      );
                    })}
                  </nav>

                  <div className="rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-teal-50 p-4">
                     <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-[#a26da8]" />
                        <span className="text-[13px] font-semibold text-slate-900">Builder tip</span>
                     </div>
                     <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-600">
                        The chat preview uses your last saved configuration. Save after each change, then test it from the chat button.
                     </p>
                  </div>
               </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
               <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 lg:p-10 shadow-sm min-h-[800px]">
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
                        <KnowledgeTab agentId={id!} refreshKey={refreshKey} />
                      )}
                      {activeTab === 'actions' && (
                        <ActionsTab agentId={id!} refreshKey={refreshKey} />
                      )}
                      {activeTab === 'tools' && (
                        <ToolsTab agentId={id!} refreshKey={refreshKey} />
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
                         <HistoryTab agentId={id!} refreshKey={refreshKey} />
                      )}
                    </motion.div>
                  </AnimatePresence>
               </div>
            </div>
         </div>
      </div>
      <ChatPreview 
        agentId={id!} 
        agentName={name}
        status={agent?.status || 'draft'} 
        onTurnComplete={handleRefresh}
        isDirty={
          name !== (agent?.name || '') ||
          description !== (agent?.description || '') ||
          persona.role !== (agent?.persona?.role || '') ||
          persona.goal !== (agent?.persona?.goal || '') ||
          persona.instructions !== (agent?.persona?.instructions || '') ||
          systemPrompt !== (agent?.system_prompt || '') ||
          JSON.stringify(llm) !== JSON.stringify(agent?.llm || INITIAL_LLM) ||
          JSON.stringify(guardrails) !== JSON.stringify(agent?.guardrails || INITIAL_GUARD)
        }
      />
    </div>
  );
};

export default StandaloneAgentBuilder;
