import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Globe, 
  Database, 
  Cpu, 
  Trash2, 
  Edit, 
  ExternalLink,
  ChevronRight,
  PlusCircle,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { apiService } from '../../../services/api';
import { AdminBlueprint, AdminMeta } from '../../../types/admin-console';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

const BlueprintGallery: React.FC<{ meta: AdminMeta | null }> = ({ meta }) => {
  const [blueprints, setBlueprints] = useState<AdminBlueprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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
    } catch (error) {
      console.error('Failed to fetch blueprints:', error);
      toast.error('Failed to load blueprints');
    } finally {
      setLoading(false);
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

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-[32px] font-black text-gray-900 tracking-tight">Agent Blueprints</h1>
          <p className="text-gray-500 font-medium mt-1">Curated, expertly-tested pre-built agents for global deployment.</p>
        </div>
        <button 
          onClick={() => setShowDrawer(true)}
          className="bg-gradient-to-br from-[#6d28d9] to-[#4c1d95] text-white px-7 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-purple-900/20 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
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
              className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm hover:shadow-2xl transition-all group flex flex-col relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{blueprint.industry}</span>
                  {blueprint.is_published ? (
                    <span className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Published</span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Draft</span>
                  )}
                </div>
                
                <div className="relative group/menu">
                  <button className="p-2 text-gray-300 hover:text-gray-900 transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 hidden group-hover/menu:block z-20">
                    <button 
                      onClick={() => { setEditingId(blueprint._id); setShowDrawer(true); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-gray-600 hover:bg-gray-50 uppercase tracking-widest"
                    >
                      <Edit className="w-4 h-4" /> Edit Blueprint
                    </button>
                    <button 
                      onClick={() => handleTogglePublish(blueprint._id, blueprint.is_published)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-gray-600 hover:bg-gray-50 uppercase tracking-widest"
                    >
                      <Globe className="w-4 h-4" /> {blueprint.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    <div className="h-px bg-gray-100 my-1 mx-2" />
                    <button 
                      onClick={() => handleDelete(blueprint._id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-red-500 hover:bg-red-50 uppercase tracking-widest"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              </div>

              <div className="h-32 bg-gray-50 rounded-[24px] mb-6 flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500 via-transparent to-transparent" />
                {/* Visual Representation */}
                <div className="flex flex-col items-center gap-3 relative z-10">
                  <div className="px-4 py-1.5 bg-white border border-gray-200 rounded-xl text-[10px] font-black text-gray-900 shadow-sm uppercase tracking-widest">{blueprint.persona_template?.role || blueprint.name}</div>
                  <div className="flex gap-2">
                    {blueprint.tool_seeds.slice(0, 2).map((t, i) => (
                      <div key={i} className="px-3 py-1 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg text-[8px] font-black text-gray-500 uppercase tracking-widest">{t.name}</div>
                    ))}
                    {blueprint.tool_seeds.length > 2 && (
                      <div className="px-3 py-1 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg text-[8px] font-black text-gray-500">+{blueprint.tool_seeds.length - 2}</div>
                    )}
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-black text-gray-900 mb-2 truncate group-hover:text-[#4c1d95] transition-colors">{blueprint.name}</h3>
              <p className="text-sm text-gray-500 font-medium line-clamp-2 leading-relaxed flex-1">{blueprint.description}</p>

              <div className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-between">
                <div className="flex gap-2">
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-100/50 text-gray-500 rounded-lg text-[9px] font-black uppercase tracking-tighter">
                    <Cpu className="w-3 h-3" /> {blueprint.llm_template?.model?.split('/').pop() || 'AI'}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-100/50 text-gray-500 rounded-lg text-[9px] font-black uppercase tracking-tighter">
                    <Database className="w-3 h-3" /> {blueprint.kb_seed?.length || 0} KB
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-black text-gray-900 uppercase tracking-widest">{blueprint.clone_count} Clones</span>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <div key={s} className={`w-1 h-1 rounded-full ${s <= Math.round(blueprint.avg_rating || 0) ? 'bg-[#a26da8]' : 'bg-gray-200'}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 border-dashed rounded-[32px] p-20 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto mb-6">
            <PuzzlePieceIcon className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">No Blueprints Found</h3>
          <p className="text-gray-500 font-medium mb-8 max-w-xs mx-auto text-sm">Add your first expert-tuned agent blueprint to populate the global gallery.</p>
          <button 
            onClick={() => setShowDrawer(true)}
            className="text-[#4c1d95] font-black text-xs uppercase tracking-[0.2em] hover:opacity-80 transition-opacity inline-flex items-center gap-2"
          >
            Create First Blueprint <ChevronRight className="w-4 h-4" />
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
              className="fixed top-0 right-0 w-full max-w-2xl h-screen bg-white shadow-2xl z-[110] flex flex-col"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-20">
                <div>
                  <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{editingId ? 'Edit Blueprint' : 'Add Agent Blueprint'}</h2>
                  <p className="text-xs font-black text-[#6d28d9] uppercase tracking-widest mt-1">Professional Agent Template</p>
                </div>
                <button 
                  onClick={() => setShowDrawer(false)}
                  className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-gray-900 transition-all active:scale-95"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-8 bg-[#fbfbfe]">
                 {/* Form will go here */}
                 <div className="space-y-8 pb-10">
                    <div className="bg-white rounded-[28px] p-8 border border-gray-100 shadow-sm">
                       <h3 className="text-[10px] font-black text-[#6d28d9] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                         <span className="w-5 h-5 rounded-lg bg-purple-50 flex items-center justify-center">1</span>
                         Basics
                       </h3>
                       <div className="space-y-6">
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Blueprint Name *</label>
                            <input type="text" placeholder="e.g. Invoice Intake Specialist" className="w-full bg-[#f6f7f9] border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-100 transition-all" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Description</label>
                            <textarea placeholder="One-paragraph summary shown on the card..." className="w-full bg-[#f6f7f9] border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-100 transition-all min-h-[100px]"></textarea>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Industry *</label>
                                <select className="w-full bg-[#f6f7f9] border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-100 transition-all appearance-none cursor-pointer">
                                   {meta?.industries.map(i => <option key={i} value={i}>{i}</option>)}
                                </select>
                             </div>
                             <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Category</label>
                                <input type="text" placeholder="e.g. Accounts Payable" className="w-full bg-[#f6f7f9] border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-100 transition-all" />
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="bg-white rounded-[28px] p-8 border border-gray-100 shadow-sm">
                       <h3 className="text-[10px] font-black text-[#6d28d9] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                         <span className="w-5 h-5 rounded-lg bg-purple-50 flex items-center justify-center">2</span>
                         Persona Template
                       </h3>
                       <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Role Title</label>
                                <input type="text" placeholder="Accounts Payable Assistant" className="w-full bg-[#f6f7f9] border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-100 transition-all" />
                             </div>
                             <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Primary Goal</label>
                                <input type="text" placeholder="Process invoices accurately" className="w-full bg-[#f6f7f9] border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-100 transition-all" />
                             </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">System Instructions</label>
                            <textarea placeholder="Detailed behavioral logic..." className="w-full bg-[#f6f7f9] border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-100 transition-all min-h-[160px]"></textarea>
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
                  Save & Publish
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Simple Mock for now to fix icons
const PuzzlePieceIcon = (props: any) => <PuzzlePieceIconInternal {...props} />;
const PuzzlePieceIconInternal = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
  </svg>
);

export default BlueprintGallery;
