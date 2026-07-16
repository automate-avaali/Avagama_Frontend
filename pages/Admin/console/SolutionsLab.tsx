import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Globe,
  Zap,
  Clock,
  ArrowRight,
  ChevronRight,
  X,
  Loader2
} from 'lucide-react';
import { apiService } from '../../../services/api';
import { AdminSolution, AdminMeta } from '../../../types/admin-console';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

const STEP_TYPES = ['agent', 'connector', 'condition', 'transform', 'human_approval', 'api_call'];

const emptyForm = {
  name: '', summary: '', description: '', industry: '', category: '', difficulty: 'Intermediate',
  estimated_setup: '1-2 weeks', tags: '',
  kpis: [{ metric: '', impact: '' }] as Array<{ metric: string; impact: string }>,
  steps: [{ label: '', type: 'agent' }] as Array<{ label: string; type: string }>,
  is_published: false,
};

const SolutionsLab: React.FC<{ meta: AdminMeta | null }> = ({ meta }) => {
  const [solutions, setSolutions] = useState<AdminSolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);

  useEffect(() => {
    fetchSolutions();
  }, [activeFilter, search]);

  const fetchSolutions = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (activeFilter !== 'All') params.category = activeFilter;
      if (search) params.search = search;

      const response = await apiService.adminConsole.solutions.list(params);
      if (response.success) {
        setSolutions(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch solutions:', error);
      toast.error(error?.message ? `Solutions: ${error.message}` : 'Failed to load solutions');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      industry: meta?.industries?.[0] || 'Finance',
      category: meta?.solution_categories?.[0] || 'Procure-to-Pay',
      difficulty: meta?.difficulties?.[0] || 'Intermediate',
      kpis: [{ metric: '', impact: '' }],
      steps: [{ label: '', type: 'agent' }],
    });
    setShowDrawer(true);
  };

  const openEdit = async (sol: AdminSolution) => {
    setEditingId(sol._id);
    // The list is stripped of graph; fetch the full doc so we can pre-fill steps.
    let full: any = sol;
    try {
      const res = await apiService.adminConsole.solutions.get(sol._id);
      if (res.success) full = res.data;
    } catch { /* fall back to list row */ }
    const steps = (full.graph?.nodes || [])
      .filter((n: any) => n.type !== 'start' && n.type !== 'end')
      .map((n: any) => ({ label: n.label, type: n.type }));
    setForm({
      name: full.name || '',
      summary: full.summary || '',
      description: full.description || '',
      industry: full.industry || meta?.industries?.[0] || 'Finance',
      category: full.category || meta?.solution_categories?.[0] || 'Procure-to-Pay',
      difficulty: full.difficulty || 'Intermediate',
      estimated_setup: full.estimated_setup || '1-2 weeks',
      tags: (full.tags || []).join(', '),
      kpis: full.kpis?.length ? full.kpis : [{ metric: '', impact: '' }],
      steps: steps.length ? steps : [{ label: '', type: 'agent' }],
      is_published: full.is_published,
    });
    setShowDrawer(true);
  };

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const buildGraph = () => {
    const stepNodes = form.steps.filter((s: any) => s.label.trim());
    const nodes: any[] = [{ node_id: 'start', type: 'start', label: 'Start', x: 0, y: 0, config: {} }];
    const edges: any[] = [];
    let prev = 'start';
    let x = 0;
    stepNodes.forEach((s: any, i: number) => {
      x += 200;
      const id = `n${i + 1}`;
      const type = s.type === 'human_approval' ? 'human_approval' : s.type;
      nodes.push({ node_id: id, type, label: s.label.trim(), x, y: 0, config: type === 'human_approval' ? { approval_message: 'Approve to continue?' } : {} });
      edges.push({ edge_id: `e${i + 1}`, from: prev, to: id, kind: 'sequence' });
      prev = id;
    });
    x += 200;
    nodes.push({ node_id: 'end', type: 'end', label: 'Done', x, y: 0, config: {} });
    edges.push({ edge_id: 'e_end', from: prev, to: 'end', kind: 'sequence' });
    return { nodes, edges };
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Solution name is required'); return; }
    if (!form.steps.some((s: any) => s.label.trim())) { toast.error('Add at least one workflow step'); return; }
    setSaving(true);
    const payload: any = {
      name: form.name.trim(),
      summary: form.summary,
      description: form.description,
      industry: form.industry,
      category: form.category,
      difficulty: form.difficulty,
      estimated_setup: form.estimated_setup,
      tags: form.tags.split(',').map((s: string) => s.trim()).filter(Boolean),
      kpis: form.kpis.filter((k: any) => k.metric.trim() || k.impact.trim()),
      data_manager: { arguments: [], variables: [] },
      graph: buildGraph(),
    };
    try {
      const res = editingId
        ? await apiService.adminConsole.solutions.update(editingId, payload)
        : await apiService.adminConsole.solutions.create(payload);
      if (res.success) {
        const id = res.data?._id || editingId;
        if (id && typeof res.data?.is_published === 'boolean' && res.data.is_published !== form.is_published) {
          await apiService.adminConsole.solutions.publish(id, form.is_published);
        }
        toast.success(editingId ? 'Solution updated' : (form.is_published ? 'Solution created & published' : 'Solution saved as draft'));
        setShowDrawer(false);
        fetchSolutions();
      } else {
        throw new Error(res.message || 'Save failed');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to save solution');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (id: string, current: boolean) => {
    try {
      const response = await apiService.adminConsole.solutions.publish(id, !current);
      if (response.success) {
        toast.success(`Solution ${!current ? 'published' : 'unpublished'}`);
        fetchSolutions();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this solution?')) return;
    try {
      const response = await apiService.adminConsole.solutions.delete(id);
      if (response.success) {
        toast.success('Solution deleted');
        fetchSolutions();
      }
    } catch (error) {
      toast.error('Failed to delete solution');
    }
  };

  const inputCls = 'w-full bg-[#f6f7f9] border-none rounded-2xl py-3.5 px-5 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-100 transition-all';
  const labelCls = 'block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1';

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-[32px] font-black text-gray-900 tracking-tight flex items-center gap-3">
            Solutions Lab
            <span className="px-2 py-0.5 bg-teal-50 text-teal-600 text-[10px] font-black uppercase rounded-md tracking-widest border border-teal-100">New</span>
          </h1>
          <p className="text-gray-500 font-medium mt-1">Ready-to-run, end-to-end automations. Published solutions appear in the Agent Playground's Solutions gallery.</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-gradient-to-br from-[#a26da8] to-[#8e5a94] text-white px-7 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-purple-900/20 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Solution
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        <div className="flex-1 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['All', ...(meta?.solution_categories || [])].map(filter => (
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
            placeholder="Search solutions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold outline-none focus:border-purple-200 transition-all shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-gray-100 rounded-[32px] p-8 h-96 animate-pulse" />
          ))}
        </div>
      ) : solutions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {solutions.map(solution => (
            <div
              key={solution._id}
              onClick={() => openEdit(solution)}
              className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm hover:shadow-2xl hover:border-purple-200 transition-all group flex flex-col relative overflow-hidden cursor-pointer"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{solution.category}</span>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                    solution.difficulty === 'Starter' ? 'bg-green-50 text-green-600' :
                    solution.difficulty === 'Intermediate' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {solution.difficulty}
                  </span>
                  {solution.is_published
                    ? <span className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Published</span>
                    : <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Draft</span>}
                </div>

                <div className="relative group/menu" onClick={(e) => e.stopPropagation()}>
                  <button className="p-2 text-gray-300 hover:text-gray-900 transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 hidden group-hover/menu:block z-20">
                    <button onClick={() => openEdit(solution)} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-gray-600 hover:bg-gray-50 uppercase tracking-widest">
                      <Edit className="w-4 h-4" /> Edit Solution
                    </button>
                    <button onClick={() => handleTogglePublish(solution._id, solution.is_published)} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-gray-600 hover:bg-gray-50 uppercase tracking-widest">
                      <Globe className="w-4 h-4" /> {solution.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    <div className="h-px bg-gray-100 my-1 mx-2" />
                    <button onClick={() => handleDelete(solution._id)} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-red-500 hover:bg-red-50 uppercase tracking-widest">
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              </div>

              <div className="h-40 bg-gray-50 rounded-[24px] mb-6 flex flex-col items-center justify-center p-6 border border-gray-100 relative overflow-hidden">
                <div className="flex items-center gap-2 relative z-10 flex-wrap justify-center">
                  {(solution.steps && solution.steps.length ? solution.steps.slice(0, 5) : [{ label: 'Flow', type: 'agent' }]).map((st, i, arr) => {
                    const human = st.type === 'human_approval' || st.type === 'human_task';
                    return (
                      <React.Fragment key={i}>
                        <div className={`px-2.5 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${human ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-gray-200 text-gray-600'}`}>{st.label}</div>
                        {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-gray-300" />}
                      </React.Fragment>
                    );
                  })}
                </div>
                <div className="mt-4 flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-gray-900">{solution.step_count}</span>
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Steps</span>
                  </div>
                  <div className="w-px h-6 bg-gray-200" />
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-gray-900">{solution.agents_used?.length || 0}</span>
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Agents</span>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-black text-gray-900 mb-2 truncate group-hover:text-[#8e5a94] transition-colors">{solution.name}</h3>
              <p className="text-sm text-gray-500 font-medium line-clamp-2 leading-relaxed mb-6">{solution.summary}</p>

              <div className="mt-auto space-y-4">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-gray-400">Est. Setup</span>
                  <span className="text-gray-900 flex items-center gap-1"><Clock className="w-3 h-3" /> {solution.estimated_setup}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-gray-400">Primary Impact</span>
                  <span className="text-[#a26da8]">{solution.kpis?.[0]?.impact || 'N/A'}</span>
                </div>
                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                  {solution.has_human_approval
                    ? <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-md text-[8px] font-black uppercase tracking-widest">Human approval</span>
                    : <span />}
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{solution.clone_count} Installs</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 border-dashed rounded-[32px] p-20 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto mb-6">
            <Zap className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">No Solutions Found</h3>
          <p className="text-gray-500 font-medium mb-8 max-w-xs mx-auto text-sm">Create end-to-end automation templates to power the global solution catalog.</p>
          <button onClick={openCreate} className="text-[#8e5a94] font-black text-xs uppercase tracking-[0.2em] hover:opacity-80 transition-opacity inline-flex items-center gap-2">
            Create First Solution <ChevronRight className="w-4 h-4" />
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
              className="fixed inset-y-0 right-0 w-full max-w-3xl bg-white shadow-2xl z-[110] flex flex-col rounded-l-[28px] overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-20">
                <div>
                  <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{editingId ? 'Edit Solution' : 'Add Solution Template'}</h2>
                  <p className="text-xs font-black text-[#a26da8] uppercase tracking-widest mt-1">End-to-end automation workflow</p>
                </div>
                <button onClick={() => setShowDrawer(false)} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-gray-900 transition-all active:scale-95">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-8 bg-[#fbfbfe]">
                <div className="space-y-8 pb-10">
                  {/* Basics */}
                  <div className="bg-white rounded-[28px] p-8 border border-gray-100 shadow-sm">
                    <h3 className="text-[10px] font-black text-[#a26da8] uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><span className="w-5 h-5 rounded-lg bg-purple-50 flex items-center justify-center">1</span> Basics</h3>
                    <div className="space-y-6">
                      <div>
                        <label className={labelCls}>Solution Name *</label>
                        <input value={form.name} onChange={e => set('name', e.target.value)} type="text" placeholder="e.g. Invoice Processing" className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Summary (one line)</label>
                        <input value={form.summary} onChange={e => set('summary', e.target.value)} type="text" placeholder="Ingest → extract → 3-way match → approve → post to ERP." className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Full Description</label>
                        <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Detailed breakdown of the automation..." className={`${inputCls} min-h-[120px]`} />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className={labelCls}>Industry</label>
                          <select value={form.industry} onChange={e => set('industry', e.target.value)} className={`${inputCls} appearance-none cursor-pointer`}>
                            {(meta?.industries || ['Finance']).map(i => <option key={i} value={i}>{i}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Category</label>
                          <select value={form.category} onChange={e => set('category', e.target.value)} className={`${inputCls} appearance-none cursor-pointer`}>
                            {(meta?.solution_categories || ['Procure-to-Pay']).map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Difficulty</label>
                          <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)} className={`${inputCls} appearance-none cursor-pointer`}>
                            {(meta?.difficulties || ['Starter', 'Intermediate', 'Advanced']).map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Estimated Setup</label>
                          <input value={form.estimated_setup} onChange={e => set('estimated_setup', e.target.value)} type="text" placeholder="1-2 weeks" className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Tags (comma separated)</label>
                          <input value={form.tags} onChange={e => set('tags', e.target.value)} type="text" placeholder="invoice, AP, OCR" className={inputCls} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Workflow steps */}
                  <div className="bg-white rounded-[28px] p-8 border border-gray-100 shadow-sm">
                    <h3 className="text-[10px] font-black text-[#a26da8] uppercase tracking-[0.2em] mb-2 flex items-center gap-2"><span className="w-5 h-5 rounded-lg bg-purple-50 flex items-center justify-center">2</span> Workflow Steps</h3>
                    <p className="text-[11px] text-gray-400 font-medium mb-5">Ordered steps become the flow graph (a Start and End node are added automatically). Human Approval steps are the amber "needs approval" nodes.</p>
                    <div className="space-y-3">
                      {form.steps.map((s: any, i: number) => (
                        <div key={i} className="flex gap-3 items-center">
                          <span className="w-7 h-7 rounded-lg bg-purple-50 text-[#a26da8] flex items-center justify-center text-[10px] font-black shrink-0">{i + 1}</span>
                          <input
                            value={s.label}
                            onChange={e => { const next = [...form.steps]; next[i] = { ...next[i], label: e.target.value }; set('steps', next); }}
                            placeholder="Step label (e.g. Extract invoice)"
                            className="flex-1 bg-[#f6f7f9] border-none rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-100"
                          />
                          <select
                            value={s.type}
                            onChange={e => { const next = [...form.steps]; next[i] = { ...next[i], type: e.target.value }; set('steps', next); }}
                            className="w-40 bg-[#f6f7f9] border-none rounded-xl py-3 px-3 text-xs font-bold outline-none cursor-pointer"
                          >
                            {STEP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <button
                            onClick={() => set('steps', form.steps.filter((_: any, idx: number) => idx !== i))}
                            className="p-2 text-gray-300 hover:text-red-500 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => set('steps', [...form.steps, { label: '', type: 'agent' }])}
                        className="w-full py-3 border-2 border-dashed border-gray-100 rounded-xl text-[10px] font-black uppercase text-gray-400 hover:text-[#a26da8] hover:border-purple-200 transition-all"
                      >
                        + Add Step
                      </button>
                    </div>
                  </div>

                  {/* KPIs */}
                  <div className="bg-white rounded-[28px] p-8 border border-gray-100 shadow-sm">
                    <h3 className="text-[10px] font-black text-[#a26da8] uppercase tracking-[0.2em] mb-5 flex items-center gap-2"><span className="w-5 h-5 rounded-lg bg-purple-50 flex items-center justify-center">3</span> Business Outcomes (KPIs)</h3>
                    <div className="space-y-3">
                      {form.kpis.map((k: any, i: number) => (
                        <div key={i} className="flex gap-3 items-center">
                          <input
                            value={k.metric}
                            onChange={e => { const next = [...form.kpis]; next[i] = { ...next[i], metric: e.target.value }; set('kpis', next); }}
                            placeholder="Metric (e.g. Invoice cycle time)"
                            className="flex-1 bg-[#f6f7f9] border-none rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-100"
                          />
                          <input
                            value={k.impact}
                            onChange={e => { const next = [...form.kpis]; next[i] = { ...next[i], impact: e.target.value }; set('kpis', next); }}
                            placeholder="Impact (e.g. ↓ 80%)"
                            className="flex-1 bg-[#f6f7f9] border-none rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-100"
                          />
                          <button onClick={() => set('kpis', form.kpis.filter((_: any, idx: number) => idx !== i))} className="p-2 text-gray-300 hover:text-red-500 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button onClick={() => set('kpis', [...form.kpis, { metric: '', impact: '' }])} className="w-full py-3 border-2 border-dashed border-gray-100 rounded-xl text-[10px] font-black uppercase text-gray-400 hover:text-[#a26da8] hover:border-purple-200 transition-all">
                        + Add KPI
                      </button>
                    </div>
                  </div>

                  {/* Publish */}
                  <div className="bg-white rounded-[28px] p-8 border border-gray-100 shadow-sm">
                    <h3 className="text-[10px] font-black text-[#a26da8] uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><span className="w-5 h-5 rounded-lg bg-purple-50 flex items-center justify-center">4</span> Publish</h3>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm font-bold text-gray-700">Publish now (visible in the Agent Playground Solutions gallery)</span>
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

export default SolutionsLab;
