
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { apiService } from '../../services/api';
import { StandaloneBlueprint } from '../../types/standalone';
import { 
  Plus, 
  Search, 
  ArrowLeft,
  Filter,
  Sparkles,
  ShoppingBag,
  Zap,
  Bot,
  BrainCircuit,
  MessageSquare,
  ShieldCheck,
  Rocket
} from 'lucide-react';
import toast from 'react-hot-toast';

const StandaloneMarketplace: React.FC = () => {
  const navigate = useNavigate();
  const [blueprints, setBlueprints] = useState<StandaloneBlueprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [industries, setIndustries] = useState<string[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bpRes, indRes] = await Promise.all([
        apiService.standalone.blueprints.list(),
        apiService.standalone.blueprints.listIndustries()
      ]);
      if (bpRes.success) setBlueprints(Array.isArray(bpRes.data) ? bpRes.data : []);
      if (indRes.success) {
        const labels = Array.isArray(indRes.data) 
          ? indRes.data.map(item => (typeof item === 'string' ? item : item.industry)) 
          : [];
        setIndustries(['All', ...labels]);
      }
    } catch (error) {
      toast.error('Failed to load marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handleClone = async (blueprintId: string) => {
    const loadingToast = toast.loading('Cloning agent from blueprint...');
    try {
      const response = await apiService.standalone.agents.cloneFromBlueprint({
        blueprint_id: blueprintId
      });
      if (response.success) {
        toast.success('Agent created successfully!', { id: loadingToast });
        navigate(`/admin/standalone/builder/${response.data._id}`);
      }
    } catch (error) {
      toast.error('Cloning failed', { id: loadingToast });
    }
  };

  const filteredBlueprints = blueprints.filter(bp => 
    (selectedIndustry === 'All' || bp.industry === selectedIndustry) &&
    ((bp.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
     (bp.description || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#fafafa] pt-8 pb-20">
      <div className="max-w-[1600px] mx-auto px-10">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate('/admin/standalone')}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-900 font-bold text-xs uppercase tracking-widest mb-10 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to My Agents
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-[22px] bg-[#a26da8] text-white flex items-center justify-center shadow-lg shadow-purple-200">
                <ShoppingBag size={24} />
              </div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">Agent Blueprints</h1>
            </div>
            <p className="text-xl font-medium text-gray-500 leading-relaxed">
              Explore our library of task-optimized AI agent templates. Deploy production-ready personas for customer support, sales, and internal workflows in seconds.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase text-right">Marketplace Stats</p>
            <div className="flex items-center gap-6">
               <div className="flex flex-col items-end">
                  <span className="text-2xl font-black text-gray-900">{blueprints.length}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Blueprints</span>
               </div>
               <div className="w-px h-10 bg-gray-100" />
               <div className="flex flex-col items-end">
                  <span className="text-2xl font-black text-gray-900">12</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Industries</span>
               </div>
            </div>
          </div>
        </div>

        {/* Search & Industry Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
          <div className="flex flex-wrap items-center gap-2">
            {industries.map((industry) => (
              <button
                key={industry}
                onClick={() => setSelectedIndustry(industry)}
                className={`px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  selectedIndustry === industry 
                  ? 'bg-gray-900 text-white shadow-xl shadow-gray-200' 
                  : 'bg-white border border-gray-100 text-gray-400 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {industry}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-96 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#a26da8] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search blueprints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-[22px] text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-100 focus:border-[#a26da8] transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
             <div className="w-12 h-12 border-4 border-purple-100 border-t-[#a26da8] rounded-full animate-spin" />
             <p className="text-gray-400 text-xs font-black uppercase tracking-[0.2em] animate-pulse">Syncing Library...</p>
          </div>
        ) : filteredBlueprints.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
            {filteredBlueprints.map((blueprint) => (
              <BlueprintCard key={blueprint._id} blueprint={blueprint} onClone={handleClone} />
            ))}
          </div>
        ) : (
          <div className="py-40 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6">
              <Search size={32} />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">No blueprinted solutions found</h3>
            <p className="text-gray-500 font-medium tracking-tight">Try adjusting your filters or search query.</p>
          </div>
        )}

        {/* Start from scratch promo */}
        {!loading && (
          <div className="mt-24 p-12 bg-gradient-to-br from-gray-900 to-black rounded-[40px] text-white flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden relative">
            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-4 tracking-tight">None of these fit your needs?</h2>
              <p className="text-gray-400 font-medium text-lg max-w-xl">
                Build a completely bespoke agent from scratch. Configure unique personas, complex actions, and specialized local knowledge bases.
              </p>
            </div>
            <button 
              onClick={() => navigate('/admin/standalone/builder/new')}
              className="relative z-10 px-12 py-6 bg-white text-gray-900 rounded-[28px] font-black text-sm uppercase tracking-widest hover:bg-purple-100 hover:scale-105 transition-all shadow-2xl shrink-0"
            >
              Start Blank Page
            </button>
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#6fcbbd]/10 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2" />
          </div>
        )}
      </div>
    </div>
  );
};

const BlueprintCard: React.FC<{ 
  blueprint: StandaloneBlueprint; 
  onClone: (id: string) => void 
}> = ({ blueprint, onClone }) => {
  return (
    <div className="group bg-white rounded-[40px] border border-gray-100 p-10 hover:shadow-2xl hover:shadow-purple-100/50 hover:border-purple-200 transition-all duration-500 flex flex-col h-full relative overflow-hidden">
      {/* Visual Accent */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
         <Bot size={120} strokeWidth={1} />
      </div>

      <div className="flex justify-between items-start mb-10">
         <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-[#a26da8] uppercase tracking-[0.2em]">{blueprint.industry}</span>
            <h3 className="text-2xl font-black text-gray-900 leading-tight group-hover:text-[#a26da8] transition-colors">{blueprint.name}</h3>
         </div>
         <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full">
            <Sparkles size={12} className="text-yellow-500" />
            <span className="text-[10px] font-black text-gray-500">{blueprint.avg_rating || '5.0'}</span>
         </div>
      </div>

      <p className="text-gray-500 font-medium leading-relaxed mb-8 flex-grow">
        {blueprint.description}
      </p>

      <div className="space-y-4 mb-10">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-[#a26da8]">
               <MessageSquare size={14} />
            </div>
            <span className="text-xs font-bold text-gray-700 uppercase tracking-tight">Pre-optimized Persona</span>
         </div>
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-[#4db6ac]">
               <BrainCircuit size={14} />
            </div>
            <span className="text-xs font-bold text-gray-700 uppercase tracking-tight">{(blueprint.kb_seed || []).length} Seed Knowledge Docs</span>
         </div>
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
               <ShieldCheck size={14} />
            </div>
            <span className="text-xs font-bold text-gray-700 uppercase tracking-tight">Safety Tuned Guardrails</span>
         </div>
      </div>

      <div className="flex items-center justify-between pt-8 border-t border-gray-50 mt-auto">
         <div className="flex flex-col">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Global Usage</span>
            <span className="text-xs font-black text-gray-900">{blueprint.clone_count || 0}+ Deployments</span>
         </div>
         <button 
           onClick={() => onClone(blueprint._id)}
           className="flex items-center gap-2.5 px-8 py-4 bg-gray-900 text-white rounded-[20px] font-black text-[11px] uppercase tracking-widest hover:bg-[#a26da8] hover:scale-105 transition-all shadow-xl shadow-gray-100"
         >
           Deploy
           <Rocket size={14} />
         </button>
      </div>
    </div>
  );
};

export default StandaloneMarketplace;
