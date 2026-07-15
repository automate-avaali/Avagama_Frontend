import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Globe, 
  Settings, 
  GitBranch, 
  Zap, 
  Users, 
  Clock,
  ArrowRight,
  ChevronRight,
  Layers,
  X
} from 'lucide-react';
import { apiService } from '../../../services/api';
import { AdminSolution, AdminMeta } from '../../../types/admin-console';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

const SolutionsLab: React.FC<{ meta: AdminMeta | null }> = ({ meta }) => {
  const [solutions, setSolutions] = useState<AdminSolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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
    } catch (error) {
      console.error('Failed to fetch solutions:', error);
      toast.error('Failed to load solutions');
    } finally {
      setLoading(false);
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

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-[32px] font-black text-gray-900 tracking-tight flex items-center gap-3">
            Solutions Lab
            <span className="px-2 py-0.5 bg-teal-50 text-teal-600 text-[10px] font-black uppercase rounded-md tracking-widest border border-teal-100">New</span>
          </h1>
          <p className="text-gray-500 font-medium mt-1">Ready-to-run, end-to-end automation workflows.</p>
        </div>
        <button 
          onClick={() => setShowDrawer(true)}
          className="bg-gradient-to-br from-[#6d28d9] to-[#4c1d95] text-white px-7 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-purple-900/20 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
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
              className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeFilter === filter ? 'bg-[#4c1d95] text-white shadow-lg shadow-purple-900/10' : 'bg-white border border-gray-100 text-gray-500 hover:border-purple-200'}`}
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
              className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm hover:shadow-2xl transition-all group flex flex-col relative overflow-hidden"
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
                </div>
                
                <div className="relative group/menu">
                  <button className="p-2 text-gray-300 hover:text-gray-900 transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 hidden group-hover/menu:block z-20">
                    <button 
                      onClick={() => { setEditingId(solution._id); setShowDrawer(true); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-gray-600 hover:bg-gray-50 uppercase tracking-widest"
                    >
                      <Edit className="w-4 h-4" /> Edit Solution
                    </button>
                    <button 
                      onClick={() => handleTogglePublish(solution._id, solution.is_published)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-gray-600 hover:bg-gray-50 uppercase tracking-widest"
                    >
                      <Globe className="w-4 h-4" /> {solution.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    <div className="h-px bg-gray-100 my-1 mx-2" />
                    <button 
                      onClick={() => handleDelete(solution._id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-red-500 hover:bg-red-50 uppercase tracking-widest"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              </div>

              <div className="h-40 bg-gray-50 rounded-[24px] mb-6 flex flex-col items-center justify-center p-6 border border-gray-100 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Zap className="w-20 h-20 text-[#6d28d9]" />
                 </div>
                 {/* Visual workflow representation */}
                 <div className="flex items-center gap-2 relative z-10">
                    <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm">
                       <Users className="w-5 h-5 text-gray-400" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                    <div className="w-12 h-12 bg-white border-2 border-purple-100 rounded-xl flex items-center justify-center shadow-md">
                       <Layers className="w-6 h-6 text-[#6d28d9]" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                    <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm">
                       <Zap className="w-5 h-5 text-gray-400" />
                    </div>
                 </div>
                 <div className="mt-4 flex gap-4">
                    <div className="flex flex-col items-center">
                       <span className="text-[10px] font-black text-gray-900">{solution.step_count}</span>
                       <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Steps</span>
                    </div>
                    <div className="w-px h-6 bg-gray-200" />
                    <div className="flex flex-col items-center">
                       <span className="text-[10px] font-black text-gray-900">{solution.agents_used.length}</span>
                       <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Agents</span>
                    </div>
                 </div>
              </div>

              <h3 className="text-xl font-black text-gray-900 mb-2 truncate group-hover:text-[#4c1d95] transition-colors">{solution.name}</h3>
              <p className="text-sm text-gray-500 font-medium line-clamp-2 leading-relaxed mb-6">{solution.summary}</p>

              <div className="mt-auto space-y-4">
                 <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-gray-400">Est. Setup</span>
                    <span className="text-gray-900 flex items-center gap-1"><Clock className="w-3 h-3" /> {solution.estimated_setup}</span>
                 </div>
                 <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-gray-400">Primary Impact</span>
                    <span className="text-[#a26da8]">{solution.kpis[0]?.impact || 'N/A'}</span>
                 </div>
                 
                 <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex -space-x-2">
                       {[1, 2].map(i => (
                         <div key={i} className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-gray-500">
                           {i === 1 ? 'AI' : 'API'}
                         </div>
                       ))}
                    </div>
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
          <button 
            onClick={() => setShowDrawer(true)}
            className="text-[#4c1d95] font-black text-xs uppercase tracking-[0.2em] hover:opacity-80 transition-opacity inline-flex items-center gap-2"
          >
            Create First Solution <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Drawer Overlay */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDrawer(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 w-full max-w-4xl h-screen bg-white shadow-2xl z-[110] flex flex-col"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-20">
                <div>
                  <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{editingId ? 'Edit Solution' : 'Add Solution Template'}</h2>
                  <p className="text-xs font-black text-[#6d28d9] uppercase tracking-widest mt-1">Multi-Agent Workflow Configuration</p>
                </div>
                <button 
                  onClick={() => setShowDrawer(false)}
                  className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-gray-900 transition-all active:scale-95"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-8 bg-[#fbfbfe]">
                 <div className="grid grid-cols-12 gap-8 pb-10">
                    <div className="col-span-12 lg:col-span-4 space-y-6">
                       <div className="bg-white rounded-[28px] p-6 border border-gray-100 shadow-sm">
                          <h3 className="text-[10px] font-black text-[#6d28d9] uppercase tracking-[0.2em] mb-6">Metadata</h3>
                          <div className="space-y-4">
                             <div>
                                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Industry</label>
                                <select className="w-full bg-[#f6f7f9] border-none rounded-xl py-3 px-4 text-xs font-bold outline-none">
                                   {meta?.industries.map(i => <option key={i} value={i}>{i}</option>)}
                                </select>
                             </div>
                             <div>
                                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Category</label>
                                <select className="w-full bg-[#f6f7f9] border-none rounded-xl py-3 px-4 text-xs font-bold outline-none">
                                   {meta?.solution_categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                             </div>
                             <div>
                                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Difficulty</label>
                                <select className="w-full bg-[#f6f7f9] border-none rounded-xl py-3 px-4 text-xs font-bold outline-none">
                                   {meta?.difficulties.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="col-span-12 lg:col-span-8 space-y-6">
                       <div className="bg-white rounded-[28px] p-8 border border-gray-100 shadow-sm">
                          <h3 className="text-[10px] font-black text-[#6d28d9] uppercase tracking-[0.2em] mb-6">Workflow Details</h3>
                          <div className="space-y-6">
                             <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Solution Name *</label>
                                <input type="text" placeholder="e.g. Autonomous Procure-to-Pay" className="w-full bg-[#f6f7f9] border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-100 transition-all" />
                             </div>
                             <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Summary</label>
                                <textarea placeholder="Brief pitch for the solution..." className="w-full bg-[#f6f7f9] border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-100 transition-all min-h-[80px]"></textarea>
                             </div>
                             <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Full Description (Markdown Support)</label>
                                <textarea placeholder="Detailed breakdown of how the solution works, requirements, and benefits..." className="w-full bg-[#f6f7f9] border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-100 transition-all min-h-[200px]"></textarea>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="px-8 py-6 border-t border-gray-100 flex items-center justify-end gap-4 bg-white sticky bottom-0 z-20">
                <button 
                  onClick={() => setShowDrawer(false)}
                  className="px-8 py-4 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button className="px-10 py-4 bg-gradient-to-br from-[#6d28d9] to-[#4c1d95] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-purple-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Save Template
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
