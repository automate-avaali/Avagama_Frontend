
import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';
import { StandaloneAction } from '../../../types/standalone';
import { 
  Zap, 
  Plus, 
  Trash2, 
  MoreVertical, 
  ArrowRight,
  Settings2,
  Bell,
  Mail,
  Webhook,
  Activity,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Search,
  CheckCircle,
  MessageSquare,
  Tag
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ActionsTabProps {
  agentId: string;
  refreshKey?: number;
}

const TRIGGER_KINDS = [
  { id: 'keyword', name: 'Keywords', icon: <Zap size={14} />, help: 'comma-separated keywords, e.g. "refund, return, cancel"' },
  { id: 'sentiment', name: 'Sentiment', icon: <Activity size={14} />, help: 'leave blank for negative spectrum, or type "positive" / "negative" / "frustrated"' },
  { id: 'topic', name: 'Topic', icon: <Settings2 size={14} />, help: 'topic to detect, e.g. "billing", "shipping", "returns"' },
  { id: 'urgency', name: 'Urgency', icon: <Bell size={14} />, help: 'default "high", or type "medium" / "low"' },
  { id: 'regex', name: 'Regex', icon: <Search size={14} />, help: 'regex pattern, e.g. ".*price.*"' },
  { id: 'always', name: 'Always', icon: <CheckCircle size={14} />, help: 'Fires for every message in the conversation' }
];

const EFFECT_KINDS = [
  { id: 'send_email', name: 'Email Alert', icon: <Mail size={14} /> },
  { id: 'webhook', name: 'Webhook', icon: <Webhook size={14} /> },
  { id: 'slack_notification', name: 'Slack Notif', icon: <ArrowRight size={14} /> },
  { id: 'send_message', name: 'In-chat Message', icon: <MessageSquare size={14} /> },
  { id: 'tag_conversation', name: 'Tag Conv.', icon: <Tag size={14} /> },
  { id: 'handoff', name: 'Human Handoff', icon: <ToggleRight size={14} /> }
];

const ActionsTab: React.FC<ActionsTabProps> = ({ agentId, refreshKey }) => {
  const [actions, setActions] = useState<StandaloneAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAction, setNewAction] = useState({
    name: '',
    enabled: true,
    trigger: { kind: 'keyword', value: '' },
    effect: { kind: 'webhook', config: {} as any },
    priority: 1
  });

  const [editingAction, setEditingAction] = useState<StandaloneAction | null>(null);

  useEffect(() => {
    if (agentId !== 'new') fetchActions();
  }, [agentId, refreshKey]);

  const fetchActions = async () => {
    try {
      const response = await apiService.standalone.agents.actions.list(agentId);
      if (response.success) setActions(response.data);
    } catch (error) {
      toast.error('Failed to load actions');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await apiService.standalone.agents.actions.toggle(agentId, id);
      fetchActions();
    } catch (error) {
      toast.error('Failed to toggle action');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.standalone.agents.actions.delete(agentId, id);
      toast.success('Action deleted');
      fetchActions();
    } catch (error) {
      toast.error('Failed to delete action');
    }
  };

  const handleUpdate = async () => {
    if (!editingAction) return;
    try {
      await apiService.standalone.agents.actions.update(agentId, editingAction._id, editingAction);
      toast.success('Action updated');
      setEditingAction(null);
      fetchActions();
    } catch (error) {
      toast.error('Failed to update action');
    }
  };

  const handleCreate = async () => {
    if (!newAction.name) return toast.error('Name is required');
    if (newAction.trigger.kind !== 'always' && !newAction.trigger.value && newAction.trigger.kind !== 'sentiment' && newAction.trigger.kind !== 'urgency') {
       // Sentiment and Urgency can be blank as per guide
       if (['keyword', 'regex', 'topic'].includes(newAction.trigger.kind)) {
         return toast.error('Trigger value is required');
       }
    }

    try {
      await apiService.standalone.agents.actions.create(agentId, newAction);
      toast.success('Action configured');
      setShowAddForm(false);
      setNewAction({
        name: '',
        enabled: true,
        trigger: { kind: 'keyword', value: '' },
        effect: { kind: 'webhook', config: {} },
        priority: 1
      });
      fetchActions();
    } catch (error) {
      toast.error('Failed to create action');
    }
  };

  const getActionSummary = (action: StandaloneAction) => {
    const trigger = TRIGGER_KINDS.find(k => k.id === action.trigger.kind)?.name || action.trigger.kind;
    const effect = EFFECT_KINDS.find(k => k.id === action.effect.kind)?.name || action.effect.kind;
    
    let triggerDesc = `detected ${trigger.toLowerCase()}`;
    if (action.trigger.value) {
      if (action.trigger.kind === 'keyword') triggerDesc = `keywords like "${action.trigger.value}" are found`;
      else if (action.trigger.kind === 'sentiment') triggerDesc = `${action.trigger.value} sentiment is detected`;
      else triggerDesc = `${trigger.toLowerCase()} matches "${action.trigger.value}"`;
    } else if (action.trigger.kind === 'always') {
      triggerDesc = 'any message is received';
    }

    return `When ${triggerDesc}, then automatically ${effect.toLowerCase()}.`;
  };

  if (agentId === 'new') {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-6">
          <Zap size={32} />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">Save Agent First</h3>
        <p className="text-gray-500 font-medium max-w-sm">Define your agent's identity before configuring event-based actions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fadeIn pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
           <h3 className="text-lg font-black text-gray-900">Agentic Actions</h3>
           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Configure event-driven logic and external alerts</p>
        </div>

        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200"
        >
          <Plus size={18} />
          Create New Action
        </button>
      </div>

      {/* Add/Edit Form Overlay */}
      {(showAddForm || editingAction) && (
        <div className="bg-white border-2 border-[#a26da8] rounded-[40px] p-10 space-y-10 shadow-2xl shadow-purple-100 animate-slideDown">
          <div className="flex justify-between items-center">
             <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">
               {editingAction ? 'Update Action Configuration' : 'New Autonomous Event Action'}
             </h4>
             <button 
               onClick={() => {
                 setShowAddForm(false);
                 setEditingAction(null);
               }} 
               className="text-[10px] font-black text-gray-400 hover:text-red-500 uppercase"
             >
               Dismiss
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Internal Ref Name</label>
               <input 
                type="text" 
                placeholder="e.g. Compliance High Priority Alert"
                value={editingAction ? editingAction.name : newAction.name}
                onChange={(e) => editingAction 
                  ? setEditingAction({...editingAction, name: e.target.value})
                  : setNewAction({...newAction, name: e.target.value})
                }
                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-purple-100"
               />
            </div>
          </div>

          <div className="h-px bg-gray-50" />

          {/* Trigger Config */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
             <div className="space-y-6">
                 <label className="text-[10px] font-black text-[#a26da8] uppercase tracking-widest ml-2">1. The Trigger Condition</label>
                 <div className="grid grid-cols-2 gap-3">
                    {TRIGGER_KINDS.map(tk => (
                      <button
                        key={tk.id}
                        onClick={() => editingAction
                          ? setEditingAction({...editingAction, trigger: {...editingAction.trigger, kind: tk.id}})
                          : setNewAction({...newAction, trigger: {...newAction.trigger, kind: tk.id}})
                        }
                        className={`flex items-center gap-3 px-5 py-4 rounded-2xl border-2 transition-all ${
                          (editingAction ? editingAction.trigger.kind : newAction.trigger.kind) === tk.id 
                          ? 'bg-purple-50 border-[#a26da8] text-[#a26da8]' 
                          : 'bg-white border-gray-50 text-gray-400 hover:border-gray-200'
                        }`}
                      >
                        {tk.icon}
                        <span className="text-[10px] font-black uppercase">{tk.name}</span>
                      </button>
                    ))}
                 </div>
                 {(editingAction ? editingAction.trigger.kind : newAction.trigger.kind) !== 'always' && (
                   <div className="space-y-2">
                     <input 
                      type="text" 
                      placeholder={TRIGGER_KINDS.find(k => k.id === (editingAction ? editingAction.trigger.kind : newAction.trigger.kind))?.help || "Detection value..."}
                      value={editingAction ? editingAction.trigger.value : newAction.trigger.value}
                      onChange={(e) => editingAction
                        ? setEditingAction({...editingAction, trigger: {...editingAction.trigger, value: e.target.value}})
                        : setNewAction({...newAction, trigger: {...newAction.trigger, value: e.target.value}})
                      }
                      className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-purple-100"
                     />
                     <p className="text-[9px] text-gray-400 font-medium px-2 italic uppercase tracking-wider">
                       {TRIGGER_KINDS.find(k => k.id === (editingAction ? editingAction.trigger.kind : newAction.trigger.kind))?.help}
                     </p>
                   </div>
                 )}
             </div>

             <div className="space-y-6">
                 <label className="text-[10px] font-black text-[#4db6ac] uppercase tracking-widest ml-2">2. The Execution Effect</label>
                 <div className="grid grid-cols-2 gap-3">
                    {EFFECT_KINDS.map(ek => (
                      <button
                        key={ek.id}
                        onClick={() => editingAction
                          ? setEditingAction({...editingAction, effect: { kind: ek.id, config: {} }})
                          : setNewAction({...newAction, effect: { kind: ek.id, config: {} }})
                        }
                        className={`flex items-center gap-3 px-5 py-4 rounded-2xl border-2 transition-all ${
                          (editingAction ? editingAction.effect.kind : newAction.effect.kind) === ek.id 
                          ? 'bg-teal-50 border-[#4db6ac] text-[#4db6ac]' 
                          : 'bg-white border-gray-50 text-gray-400 hover:border-gray-200'
                        }`}
                      >
                        {ek.icon}
                        <span className="text-[10px] font-black uppercase">{ek.name}</span>
                      </button>
                    ))}
                 </div>
                 
                 <div className="p-6 bg-gray-50 rounded-[28px] space-y-4 border border-gray-100 shadow-inner">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Effect Parameters</p>
                    
                    {(editingAction ? editingAction.effect.kind : newAction.effect.kind) === 'webhook' && (
                      <input 
                        type="url" 
                        placeholder="Webhook Target URL"
                        value={(editingAction ? editingAction.effect?.config?.url : newAction.effect?.config?.url) || ''}
                        onChange={(e) => editingAction
                          ? setEditingAction({...editingAction, effect: {...editingAction.effect, config: {...(editingAction.effect?.config || {}), url: e.target.value}}})
                          : setNewAction({...newAction, effect: {...newAction.effect, config: {...(newAction.effect?.config || {}), url: e.target.value}}})}
                        className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-teal-100"
                      />
                    )}

                    {(editingAction ? editingAction.effect.kind : newAction.effect.kind) === 'slack_notification' && (
                      <div className="space-y-3">
                        <input 
                          type="url" 
                          placeholder="Slack Incoming Webhook URL"
                          value={(editingAction ? editingAction.effect?.config?.webhook_url : newAction.effect?.config?.webhook_url) || ''}
                          onChange={(e) => editingAction
                            ? setEditingAction({...editingAction, effect: {...editingAction.effect, config: {...(editingAction.effect?.config || {}), webhook_url: e.target.value}}})
                            : setNewAction({...newAction, effect: {...newAction.effect, config: {...(newAction.effect?.config || {}), webhook_url: e.target.value}}})}
                          className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-teal-100"
                        />
                        <textarea 
                          placeholder="Notification Template (use {{message}} for chat text, {{user}} for sender)"
                          value={(editingAction ? editingAction.effect?.config?.message_template : newAction.effect?.config?.message_template) || ''}
                          onChange={(e) => editingAction
                            ? setEditingAction({...editingAction, effect: {...editingAction.effect, config: {...(editingAction.effect?.config || {}), message_template: e.target.value}}})
                            : setNewAction({...newAction, effect: {...newAction.effect, config: {...(newAction.effect?.config || {}), message_template: e.target.value}}})}
                          className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-teal-100 min-h-[80px]"
                        />
                        <p className="text-[9px] text-gray-400 font-medium px-2">
                          Need help? <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer" className="text-[#a26da8] hover:underline font-bold">Create a Slack Webhook</a>
                        </p>
                      </div>
                    )}

                    {(editingAction ? editingAction.effect.kind : newAction.effect.kind) === 'send_email' && (
                      <div className="space-y-3">
                        <input 
                          type="email" 
                          placeholder="Recipient Email"
                          value={(editingAction ? editingAction.effect?.config?.to : newAction.effect?.config?.to) || ''}
                          onChange={(e) => editingAction
                            ? setEditingAction({...editingAction, effect: {...editingAction.effect, config: {...(editingAction.effect?.config || {}), to: e.target.value}}})
                            : setNewAction({...newAction, effect: {...newAction.effect, config: {...(newAction.effect?.config || {}), to: e.target.value}}})}
                          className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-teal-100"
                        />
                        <input 
                          type="text" 
                          placeholder="Email Subject (Optional)"
                          value={(editingAction ? editingAction.effect?.config?.subject : newAction.effect?.config?.subject) || ''}
                          onChange={(e) => editingAction
                            ? setEditingAction({...editingAction, effect: {...editingAction.effect, config: {...(editingAction.effect?.config || {}), subject: e.target.value}}})
                            : setNewAction({...newAction, effect: {...newAction.effect, config: {...(newAction.effect?.config || {}), subject: e.target.value}}})}
                          className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-teal-100"
                        />
                        <textarea 
                          placeholder="Email Body Content..."
                          value={(editingAction ? editingAction.effect?.config?.body : newAction.effect?.config?.body) || ''}
                          onChange={(e) => editingAction
                            ? setEditingAction({...editingAction, effect: {...editingAction.effect, config: {...(editingAction.effect?.config || {}), body: e.target.value}}})
                            : setNewAction({...newAction, effect: {...newAction.effect, config: {...(newAction.effect?.config || {}), body: e.target.value}}})}
                          className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-teal-100 min-h-[80px]"
                        />
                      </div>
                    )}

                    {(editingAction ? editingAction.effect.kind : newAction.effect.kind) === 'send_message' && (
                      <textarea 
                        placeholder="Message to append to agent reply..."
                        value={(editingAction ? editingAction.effect?.config?.message : newAction.effect?.config?.message) || ''}
                        onChange={(e) => editingAction
                          ? setEditingAction({...editingAction, effect: {...editingAction.effect, config: {...(editingAction.effect?.config || {}), message: e.target.value}}})
                          : setNewAction({...newAction, effect: {...newAction.effect, config: {...(newAction.effect?.config || {}), message: e.target.value}}})}
                        className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-teal-100 min-h-[80px]"
                      />
                    )}

                    {(editingAction ? editingAction.effect.kind : newAction.effect.kind) === 'tag_conversation' && (
                      <input 
                        type="text" 
                        placeholder="Tag to apply (e.g. priority-low)"
                        value={(editingAction ? editingAction.effect?.config?.tag : newAction.effect?.config?.tag) || ''}
                        onChange={(e) => editingAction
                          ? setEditingAction({...editingAction, effect: {...editingAction.effect, config: {...(editingAction.effect?.config || {}), tag: e.target.value}}})
                          : setNewAction({...newAction, effect: {...newAction.effect, config: {...(newAction.effect?.config || {}), tag: e.target.value}}})}
                        className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-teal-100"
                      />
                    )}

                    {(editingAction ? editingAction.effect.kind : newAction.effect.kind) === 'handoff' && (
                      <p className="text-[10px] font-medium text-gray-500 italic">No additional config required for human handoff.</p>
                    )}
                 </div>
             </div>
          </div>

          <button 
           onClick={editingAction ? handleUpdate : handleCreate}
           className="w-full py-5 bg-[#a26da8] text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] hover:bg-purple-700 transition-all shadow-xl shadow-purple-100"
          >
            {editingAction ? 'Save Changes' : 'Finalize Action Configuration'}
          </button>
        </div>
      )}

      {/* Actions List */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-20">
             <Loader2 className="w-8 h-8 text-gray-200 animate-spin" />
          </div>
        ) : actions.length > 0 ? (
          actions.map((action) => (
            <div key={action._id} className="group p-5 sm:p-7 bg-white border border-gray-100 rounded-[32px] hover:border-[#a26da8] hover:shadow-[0_20px_50px_-20px_rgba(162,109,168,0.15)] transition-all duration-300 relative">
               {/* Invocations Badge - Positioned absolutely on mobile for space, relative on desk */}
               <div className="absolute top-5 right-5 sm:relative sm:top-0 sm:right-0 sm:float-right px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100 group-hover:bg-white group-hover:border-[#a26da8]/20 transition-all z-10">
                  <p className="text-[7px] sm:text-[8px] font-black text-gray-400 uppercase tracking-widest text-center">Fired</p>
                  <p className="text-xs sm:text-sm font-black text-gray-900 text-center">{(action.fire_count ?? action.fired_count ?? 0)}x</p>
               </div>

               <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Icon and Title Section */}
                  <div className="flex items-start gap-4 sm:gap-6 min-w-0 lg:max-w-[30%]">
                     <div className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl flex items-center justify-center transition-all duration-300 ${action.enabled ? 'bg-purple-100 text-[#a26da8] shadow-lg shadow-purple-50' : 'bg-gray-100 text-gray-400'}`}>
                        <Zap size={20} className={action.enabled ? 'fill-[#a26da8]' : ''} />
                     </div>
                     <div className="min-w-0 pr-12 sm:pr-0">
                        <h5 className="text-sm font-black text-gray-900 group-hover:text-[#a26da8] transition-colors truncate">{action.name}</h5>
                        <p className="text-[10px] font-medium text-gray-400 mt-0.5 line-clamp-1 group-hover:text-gray-500 transition-colors">{getActionSummary(action)}</p>
                        <div className="flex items-center gap-2 mt-2">
                           <span className="px-1.5 py-0.5 bg-gray-50 border border-gray-100 rounded text-[8px] font-black uppercase tracking-tighter text-gray-400">Priority {action.priority}</span>
                           {!action.enabled && <span className="text-[8px] font-black text-red-400 uppercase tracking-widest">Disabled</span>}
                        </div>
                     </div>
                  </div>

                  {/* Flow Section (Trigger -> Action) */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-8 flex-1 py-4 lg:py-0 border-y lg:border-y-0 border-gray-50">
                     {/* Trigger */}
                     <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2.5 rounded-xl shrink-0 ${action.enabled ? 'bg-purple-50 text-[#a26da8]' : 'bg-gray-50 text-gray-300'}`}>
                           {TRIGGER_KINDS.find(k => k.id === action.trigger.kind)?.icon || <Activity size={16} />}
                        </div>
                        <div className="min-w-0">
                           <p className="text-[7px] font-black text-purple-400 uppercase tracking-widest mb-0.5">Condition</p>
                           <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-black text-gray-900 capitalize whitespace-nowrap">{action.trigger.kind}</span>
                              {action.trigger.value && (
                                 <span className="px-2 py-0.5 bg-gray-900 text-white rounded-md text-[9px] font-black truncate max-w-[120px] uppercase tracking-tighter">{action.trigger.value}</span>
                              )}
                           </div>
                        </div>
                     </div>

                     <div className="hidden sm:block text-gray-200">
                        <ArrowRight size={16} />
                     </div>

                     {/* Action */}
                     <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2.5 rounded-xl shrink-0 ${action.enabled ? 'bg-teal-50 text-[#4db6ac]' : 'bg-gray-50 text-gray-300'}`}>
                           {EFFECT_KINDS.find(k => k.id === action.effect.kind)?.icon || <ArrowRight size={16} />}
                        </div>
                        <div className="min-w-0">
                           <p className="text-[7px] font-black text-teal-500 uppercase tracking-widest mb-0.5">Effect</p>
                           <span className="text-[11px] font-black text-gray-900 capitalize block whitespace-nowrap">{action.effect.kind.replace('_', ' ')}</span>
                        </div>
                     </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-end gap-1 sm:gap-2">
                     <button 
                        onClick={() => setEditingAction(action)}
                        className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-gray-300 hover:text-[#a26da8] hover:bg-purple-50 rounded-xl transition-all"
                     >
                        <Settings2 size={18} />
                     </button>
                     <button 
                        onClick={() => handleToggle(action._id)}
                        className={`w-9 h-9 sm:w-11 sm:h-10 flex items-center justify-center rounded-xl transition-all ${action.enabled ? 'text-[#a26da8] hover:bg-purple-50' : 'text-gray-300 hover:text-gray-600'}`}
                     >
                        {action.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                     </button>
                     <button 
                        onClick={() => handleDelete(action._id)}
                        className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                     >
                        <Trash2 size={18} />
                     </button>
                  </div>
               </div>
            </div>
          ))
        ) : (
          <div className="py-24 border-2 border-dashed border-gray-100 rounded-[40px] flex flex-col items-center justify-center text-center">
             <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-200 mb-6">
                <Zap size={32} />
             </div>
             <p className="font-black text-gray-400 text-xs uppercase tracking-[0.2em]">Deploy event listeners for your agents.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionsTab;
