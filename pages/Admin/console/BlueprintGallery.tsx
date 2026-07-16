import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  MoreVertical,
  Globe,
  Database,
  Cpu,
  Trash2,
  Edit,
  ChevronRight,
  X,
  Loader2,
  Puzzle
} from 'lucide-react';
import { apiService } from '../../../services/api';
import { AdminBlueprint, AdminMeta } from '../../../types/admin-console';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

const BUILTIN_TOOLS = ['Web Search', 'Gmail', 'Google Calendar', 'Outlook Mail', 'Outlook Calendar', 'Slack'];

const emptyForm = {
  name: '', description: '', industry: '', use_case_category: '', tags: '',
  role: '', goal: '', instructions: '', greeting: '', fallback_message: '', tone: '',
  provider: 'openrouter', model: '', temperature: 0.3, top_p: 0.9, max_tokens: 1500,
  tools: [] as string[], is_published: false,
};

const BlueprintGallery: React.FC<{ meta: AdminMeta | null }> = ({ meta }) => {
  const [blueprints, setBlueprints] = useState<AdminBlueprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);

  useEffect(() => {
    fetchBlueprints();
  }, [activeFilter, search]);

  const fetchBlueprints = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (activeFilter !== 'All') params.industry = activeFilter;
      if (search) params.search = search;

      const response = await apiService.adminConsole.blueprints.list(params);
      if (response.success) {
        setBlueprints(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch blueprints:', error);
      toast.error(error?.message ? `Blueprints: ${error.message}` : 'Failed to load blueprints');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, industry: meta?.industries?.[0] || 'Finance' });
    setShowDrawer(true);
  };

  const openEdit = (bp: AdminBlueprint) => {
    setEditingId(bp._id);
    setForm({
      name: bp.name || '',
      description: bp.description || '',
      industry: bp.industry || meta?.industries?.[0] || 'Finance',
      use_case_category: bp.use_case_category || '',
      tags: (bp.tags || []).join(', '),
      role: bp.persona_template?.role || '',
      goal: bp.persona_template?.goal || '',
      instructions: bp.persona_template?.instructions || '',
      greeting: bp.persona_template?.greeting || '',
      fallback_message: bp.persona_template?.fallback_message || '',
      tone: (bp.persona_template?.tone || []).join(', '),
      provider: bp.llm_template?.provider || 'openrouter',
      model: bp.llm_template?.model || '',
      temperature: bp.llm_template?.temperature ?? 0.3,
      top_p: bp.llm_template?.top_p ?? 0.9,
      max_tokens: bp.llm_template?.max_tokens ?? 1500,
      tools: (bp.tool_seeds || []).map(t => t.name),
      is_published: bp.is_published,
    });
    setShowDrawer(true);
  };

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const toggleTool = (t: string) => setForm((f: any) => ({ ...f, tools: f.tools.includes(t) ? f.tools.filter((x: string) => x !== t) : [...f.tools, t] }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Blueprint name is required'); return; }
    if (!form.industry) { toast.error('Industry is required'); return; }
    setSaving(true);
    const payload: any = {
      name: form.name.trim(),
      description: form.description,
      industry: form.industry,
      use_case_category: form.use_case_category,
      tags: form.tags.split(',').map((s: string) => s.trim()).filter(Boolean),
      persona_template: {
        role: form.role, goal: form.goal, instructions: form.instructions,
        tone: form.tone.split(',').map((s: string) => s.trim()).filter(Boolean),
        greeting: form.greeting, fallback_message: form.fallback_message,
      },
      llm_template: {
        provider: form.provider, model: form.model,
        temperature: Number(form.temperature), top_p: Number(form.top_p), max_tokens: Number(form.max_tokens),
      },
      tool_seeds: form.tools.map((name: string) => ({ type: 'builtin', name })),
    };
    try {
      const res = editingId
        ? await apiService.adminConsole.blueprints.update(editingId, payload)
        : await apiService.adminConsole.blueprints.create(payload);
      if (res.success) {
        const id = res.data?._id || editingId;
        // Sync publish state if it differs from what came back
        if (id && typeof res.data?.is_published === 'boolean' && res.data.is_published !== form.is_published) {
          await apiService.adminConsole.blueprints.publish(id, form.is_published);
        }
        toast.success(editingId ? 'Blueprint updated' : (form.is_published ? 'Blueprint created & published' : 'Blueprint saved as draft'));
        setShowDrawer(false);
        fetchBlueprints();
      } else {
        throw new Error(res.message || 'Save failed');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to save blueprint');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (id: string, current: boolean) => {
    try {
      const response = await apiService.adminConsole.blueprints.publish(id, !current);
      if (response.success) {
        toast.success(`Blueprint ${!current ? 'published' : 'unpublished'}`);
        fetchBlueprints();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this blueprint?')) return;
    try {
      const response = await apiService.adminConsole.blueprints.delete(id);
      if (response.success) {
        toast.success('Blueprint deleted');
        fetchBlueprints();
      }
    } catch (error) {
      toast.error('Failed to delete blueprint');
    }
  };

  const inputCls = 'w-full bg-[#f6f7f9] border-none rounded-2xl py-3.5 px-5 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-100 transition-all';
  const labelCls = 'block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1';

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-[32px] font-black text-gray-900 tracking-tight">Agent Blueprints</h1>
          <p className="text-gray-500 font-medium mt-1">Curated, expertly-tested pre-built agents. Published blueprints appear in the Agent Builder gallery for every org to clone.</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-gradient-to-br from-[#a26da8] to-[#8e5a94] text-white px-7 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-purple-900/20 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Agent Blueprint
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        <div className="flex-1 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['All', ...(meta?.industries || [])].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeFilter === filter ? 'bg-[#8e5a94] text-white shadow-lg shadow-purple-900/10' : 'bg-white border border-gray-100 text-gray-500 hover:border-purple-200'}`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search blueprints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold outline-none focus:border-purple-200 transition-all shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white border border-gray-100 rounded-[32px] p-8 h-80 animate-pulse" />
          ))}
        </div>
      ) : blueprints.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {blueprints.map(blueprint => (
            <div
              key={blueprint._id}
              onClick={() => openEdit(blueprint)}
              className="group relative bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm hover:shadow-2xl hover:shadow-purple-100/50 hover:border-purple-200 transition-all duration-500 flex flex-col h-full cursor-pointer"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-50 to-teal-50 flex items-center justify-center text-2xl font-black text-gray-700 group-hover:scale-110 transition-transform duration-500">
                  {(blueprint.name || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${blueprint.is_published ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                    {blueprint.is_published ? 'Published' : 'Draft'}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600">{blueprint.industry}</span>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-black text-gray-900 mb-2 group-hover:text-[#a26da8] transition-colors line-clamp-1">{blueprint.name}</h3>
                <p className="text-sm font-medium text-gray-500 line-clamp-2 leading-relaxed">{blueprint.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-gray-50/50 rounded-2xl flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-gray-400"><Database size={10} /><span className="text-[8px] font-black uppercase tracking-widest">Knowledge</span></div>
                  <p className="text-xs font-black text-gray-900">{blueprint.kb_seed?.length || 0} Sources</p>
                </div>
                <div className="p-3 bg-gray-50/50 rounded-2xl flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-gray-400"><Cpu size={10} /><span className="text-[8px] font-black uppercase tracking-widest">Model</span></div>
                  <p className="text-xs font-black text-gray-900 truncate">{blueprint.llm_template?.model?.split('/').pop() || 'AI'}</p>
                </div>
              </div>

              <div className="mt-auto pt-6 flex items-center justify-between border-t border-gray-50">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{blueprint.clone_count || 0} Clones</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(blueprint._id); }}
                    className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleTogglePublish(blueprint._id, blueprint.is_published); }}
                    className="p-3 text-gray-400 hover:text-[#a26da8] hover:bg-purple-50 rounded-2xl transition-all"
                    title={blueprint.is_published ? 'Unpublish' : 'Publish'}
                  >
                    <Globe size={16} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(blueprint); }}
                    className="flex items-center gap-2 px-5 py-3 bg-purple-50 text-[#a26da8] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#a26da8] hover:text-white transition-all"
                  >
                    Manage <Edit size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 border-dashed rounded-[32px] p-20 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto mb-6">
            <Puzzle className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">No Blueprints Found</h3>
          <p className="text-gray-500 font-medium mb-8 max-w-xs mx-auto text-sm">Add your first expert-tuned agent blueprint to populate the global gallery.</p>
          <button
            onClick={openCreate}
            className="text-[#8e5a94] font-black text-xs uppercase tracking-[0.2em] hover:opacity-80 transition-opacity inline-flex items-center gap-2"
          >
            Create First Blueprint <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Drawer */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDrawer(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-[110] flex flex-col rounded-l-[28px] overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-20">
                <div>
                  <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{editingId ? 'Edit Blueprint' : 'Add Agent Blueprint'}</h2>
                  <p className="text-xs font-black text-[#a26da8] uppercase tracking-widest mt-1">Professional Agent Template</p>
                </div>
                <button onClick={() => setShowDrawer(false)} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-gray-900 transition-all active:scale-95">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-8 bg-[#fbfbfe]">
                <div className="space-y-8 pb-10">
                  {/* 1. Basics */}
                  <div className="bg-white rounded-[28px] p-8 border border-gray-100 shadow-sm">
                    <h3 className="text-[10px] font-black text-[#a26da8] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-purple-50 flex items-center justify-center">1</span> Basics
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <label className={labelCls}>Blueprint Name *</label>
                        <input value={form.name} onChange={e => set('name', e.target.value)} type="text" placeholder="e.g. Invoice Intake Specialist" className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Description</label>
                        <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="One-paragraph summary shown on the card..." className={`${inputCls} min-h-[90px]`} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Industry *</label>
                          <select value={form.industry} onChange={e => set('industry', e.target.value)} className={`${inputCls} appearance-none cursor-pointer`}>
                            {(meta?.industries || ['Finance']).map(i => <option key={i} value={i}>{i}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Use-case Category</label>
                          <input value={form.use_case_category} onChange={e => set('use_case_category', e.target.value)} type="text" placeholder="e.g. Accounts Payable" className={inputCls} />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Tags (comma separated)</label>
                        <input value={form.tags} onChange={e => set('tags', e.target.value)} type="text" placeholder="invoice, AP, OCR" className={inputCls} />
                      </div>
                    </div>
                  </div>

                  {/* 2. Persona */}
                  <div className="bg-white rounded-[28px] p-8 border border-gray-100 shadow-sm">
                    <h3 className="text-[10px] font-black text-[#a26da8] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-purple-50 flex items-center justify-center">2</span> Persona Template
                    </h3>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Role Title</label>
                          <input value={form.role} onChange={e => set('role', e.target.value)} type="text" placeholder="Accounts Payable Assistant" className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Primary Goal</label>
                          <input value={form.goal} onChange={e => set('goal', e.target.value)} type="text" placeholder="Process invoices accurately" className={inputCls} />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>System Instructions</label>
                        <textarea value={form.instructions} onChange={e => set('instructions', e.target.value)} placeholder="Detailed behavioral logic the agent always follows..." className={`${inputCls} min-h-[140px]`} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Tone (comma separated)</label>
                          <input value={form.tone} onChange={e => set('tone', e.target.value)} type="text" placeholder="Professional, Concise" className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Greeting</label>
                          <input value={form.greeting} onChange={e => set('greeting', e.target.value)} type="text" placeholder="Hi! I can help with invoices." className={inputCls} />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Fallback Message</label>
                        <input value={form.fallback_message} onChange={e => set('fallback_message', e.target.value)} type="text" placeholder="I'm not sure — routing to a human." className={inputCls} />
                      </div>
                    </div>
                  </div>

                  {/* 3. Model */}
                  <div className="bg-white rounded-[28px] p-8 border border-gray-100 shadow-sm">
                    <h3 className="text-[10px] font-black text-[#a26da8] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-purple-50 flex items-center justify-center">3</span> Model (LLM Template)
                    </h3>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Provider</label>
                          <select value={form.provider} onChange={e => set('provider', e.target.value)} className={`${inputCls} appearance-none cursor-pointer`}>
                            {(meta?.llm_providers || ['openrouter', 'azure-openai', 'mistral']).map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Model</label>
                          <input value={form.model} onChange={e => set('model', e.target.value)} type="text" placeholder="gpt-4o-mini" className={inputCls} />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className={labelCls}>Temperature</label>
                          <input value={form.temperature} onChange={e => set('temperature', e.target.value)} type="number" step="0.1" className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Top P</label>
                          <input value={form.top_p} onChange={e => set('top_p', e.target.value)} type="number" step="0.1" className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Max Tokens</label>
                          <input value={form.max_tokens} onChange={e => set('max_tokens', e.target.value)} type="number" className={inputCls} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. Tools */}
                  <div className="bg-white rounded-[28px] p-8 border border-gray-100 shadow-sm">
                    <h3 className="text-[10px] font-black text-[#a26da8] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-purple-50 flex items-center justify-center">4</span> Tools
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {BUILTIN_TOOLS.map(t => (
                        <label key={t} className={`flex items-center gap-2 px-4 py-3 rounded-xl border cursor-pointer text-xs font-bold transition-all ${form.tools.includes(t) ? 'bg-purple-50 border-purple-200 text-[#8e5a94]' : 'bg-[#f6f7f9] border-transparent text-gray-500'}`}>
                          <input type="checkbox" checked={form.tools.includes(t)} onChange={() => toggleTool(t)} className="accent-[#a26da8]" />
                          {t}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 5. Publish */}
                  <div className="bg-white rounded-[28px] p-8 border border-gray-100 shadow-sm">
                    <h3 className="text-[10px] font-black text-[#a26da8] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-purple-50 flex items-center justify-center">5</span> Publish
                    </h3>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm font-bold text-gray-700">Publish now (visible in Agent Builder gallery for all orgs)</span>
                      <input type="checkbox" checked={form.is_published} onChange={e => set('is_published', e.target.checked)} className="w-5 h-5 accent-[#a26da8]" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 border-t border-gray-100 flex items-center justify-end gap-4 bg-white sticky bottom-0 z-20">
                <button onClick={() => setShowDrawer(false)} className="px-8 py-4 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all">
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={saving} className="px-10 py-4 bg-gradient-to-br from-[#a26da8] to-[#8e5a94] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-purple-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Save Changes' : (form.is_published ? 'Save & Publish' : 'Save Draft')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlueprintGallery;
