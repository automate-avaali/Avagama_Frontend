
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { useCortex } from '../context/CortexContext';

const Results: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { openChat } = useCortex();

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const res = await apiService.evaluations.get(id);
        if (res.success) setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfdff] flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-[#9d7bb0]/10 border-t-[#9d7bb0] rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-[#9d7bb0] uppercase">AI</div>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900">Synthesizing Report</h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Cross-referencing 10 dimensions...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="bg-red-50 text-red-600 p-10 rounded-[40px] border border-red-100 text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold">Evaluation Missing</h2>
          <p className="text-sm opacity-80 mt-2">The requested diagnostic report could not be found or is no longer available in your workspace.</p>
          <button onClick={() => navigate('/evaluations')} className="mt-6 font-bold text-sm underline">Return to Roadmap</button>
        </div>
      </div>
    );
  }

  const analysis = data.aiAnalysis || {};
  const discovery = data.discovery || {};
  const operations = data.operations || {};
  const aiConfig = data.aiConfig || {};

  const getDimColor = (val: string) => {
    const v = val?.toLowerCase();
    if (v === 'high') return 'text-orange-600 bg-orange-50 border-orange-100';
    if (v === 'medium') return 'text-blue-600 bg-blue-50 border-blue-100';
    return 'text-emerald-600 bg-emerald-50 border-emerald-100';
  };

  return (
    <div className="bg-[#fcfdff] min-h-screen pb-24">
      {/* Header / Hero */}
      <div className="bg-white border-b border-gray-100 px-4 md:px-8 py-6 md:py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1 w-full md:w-auto">
            <button 
              onClick={() => navigate('/evaluations')}
              className="group flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-[#9d7bb0] transition-colors mb-2"
            >
              <svg className="w-3 h-3 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Back to Roadmap
            </button>
            <h1 className="text-xl md:text-4xl font-black text-gray-900 tracking-tight break-words leading-tight">
              {discovery.processName} <span className="text-gray-300 hidden md:inline">—</span> <span className="text-[#9d7bb0] block md:inline">Evaluation</span>
            </h1>
            <p className="text-gray-500 font-medium flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="truncate">Analysis generated on {new Date(data.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
             <button 
               onClick={() => openChat({
                 sourceType: 'evaluation',
                 documentId: id!,
                 usecaseId: 'global',
                 title: discovery.processName || 'Evaluation'
               })}
               className="flex-1 px-6 py-3 bg-[#9d7bb0] text-white rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-[#8b6aa1] transition-all shadow-lg shadow-purple-100 flex items-center justify-center gap-2"
             >
               <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
               </svg>
               Ask Avagama
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8 md:mt-12 space-y-8 md:space-y-12">
        {/* Executive Scoreboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
           <div className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[48px] border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="relative z-10 space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Automation Score</span>
                    <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-[#9d7bb0]">⚙️</div>
                 </div>
                 <div className="flex items-baseline gap-2">
                    <span className="text-4xl md:text-6xl font-black text-[#9d7bb0]">{analysis.automationScore || 0}</span>
                    <span className="text-base md:text-xl font-bold text-[#9d7bb0]/40">%</span>
                 </div>
                 <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                    <div className="h-full bg-[#9d7bb0] transition-all duration-1000" style={{width: `${analysis.automationScore || 0}%`}}></div>
                 </div>
                 <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Readiness for end-to-end scale</p>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#9d7bb0]/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-[#9d7bb0]/10 transition-colors"></div>
           </div>

           <div className="bg-[#4db6ac] p-6 md:p-10 rounded-[32px] md:rounded-[48px] shadow-2xl relative overflow-hidden group">
              <div className="relative z-10 space-y-4 text-white">
                 <div className="flex justify-between items-center">
                    <span className="text-[9px] md:text-[10px] font-black opacity-60 uppercase tracking-[0.2em]">Primary Fit</span>
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-xl">🎯</div>
                 </div>
                 <div className="space-y-1">
                    <h2 className="text-2xl md:text-4xl font-black leading-none">{analysis.fitmentType || 'In Review'}</h2>
                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-60">Architectural Fit Type</p>
                 </div>
                 <p className="text-[11px] md:text-sm font-medium leading-relaxed pt-2 border-t border-white/10 italic">
                   "{analysis.recommendations?.notes}"
                 </p>
              </div>
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full -br-24 -bb-24 blur-3xl"></div>
           </div>

           <div className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[48px] border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="relative z-10 space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Feasibility Score</span>
                    <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-[#4db6ac]">📈</div>
                 </div>
                 <div className="flex items-baseline gap-2">
                    <span className="text-4xl md:text-6xl font-black text-gray-900">{analysis.businessBenefitScore || 0}</span>
                    <span className="text-base md:text-xl font-bold text-gray-300">/ {analysis.weight || 10}</span>
                 </div>
                 <div className="flex gap-1 pt-2">
                    {[1,2,3,4,5,6,7,8,9,10].map(i => (
                      <div key={i} className={`flex-1 h-2.5 md:h-3 rounded-sm ${i <= (analysis.businessBenefitScore || 0)/(analysis.weight || 10) ? 'bg-[#4db6ac]' : 'bg-gray-100'}`}></div>
                    ))}
                 </div>
                 <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Expected Strategic Value</p>
              </div>
           </div>
        </div>

        {/* User Query vs AI Results - Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left: User Blueprint (The Query) */}
          <div className="lg:col-span-4 space-y-6 md:space-y-8">
            <div className="space-y-4">
              <h3 className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
                <span className="w-6 h-px bg-gray-200"></span>
                Input Blueprint
              </h3>
              <div className="bg-gray-50 p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-gray-100 space-y-6 md:space-y-8">
                <div className="space-y-2">
                   <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase">Contextual Objective</label>
                   <p className="text-xs md:text-sm font-medium text-gray-700 leading-relaxed italic">
                     "{discovery.strategicContext || 'No description provided.'}"
                   </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 md:gap-6 pt-4 border-t border-gray-200">
                   <div className="space-y-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase">Monthly Volume</span>
                      <p className="text-sm md:text-base font-bold text-gray-900">{operations.monthlyVolume?.toLocaleString() || '0'} tx</p>
                   </div>
                   <div className="space-y-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase">Cycle Frequency</span>
                      <p className="text-sm md:text-base font-bold text-gray-900">{operations.frequency || '-'}</p>
                   </div>
                   <div className="space-y-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase">Exception Rate</span>
                      <p className="text-sm md:text-base font-bold text-[#4db6ac]">{operations.exceptionRate || 0}%</p>
                   </div>
                   <div className="space-y-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase">Risk Appetite</span>
                      <p className="text-sm md:text-base font-bold text-gray-900">{operations.riskTolerance || '-'}</p>
                   </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase">Chosen LLM Engine</span>
                      <p className="text-[11px] md:text-xs font-bold text-[#9d7bb0]">Avagama Enterprise LLM</p>
                    </div>
                    <div className="p-2 bg-purple-50 text-[#9d7bb0] rounded-lg">
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 md:p-8 bg-gradient-to-br from-[#9d7bb0]/10 to-[#6fcbbd]/10 rounded-[32px] md:rounded-[40px] border border-white space-y-3">
              <p className="text-[10px] md:text-[11px] text-gray-500 leading-relaxed">This evaluation used credits from your balance. You can re-run with different parameters to explore alternative fitment scenarios.</p>
            </div>
          </div>

          {/* Right: Detailed Diagnostic Results */}
          <div className="lg:col-span-8 space-y-10">
            {/* Dimension Breakdown */}
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
                  <span className="w-6 h-px bg-gray-200"></span>
                  Dimensional Breakdown
                </h3>
                <span className="text-[10px] font-bold text-gray-400 italic">Analysis across 10 critical axes</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(analysis.dimensions || {}).map(([key, value]: [string, any]) => (
                  <div key={key} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-[#9d7bb0]/30 transition-all">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1')}</p>
                       <p className="text-sm font-bold text-gray-900 group-hover:text-[#9d7bb0] transition-colors">Intensity Profile</p>
                    </div>
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getDimColor(value)}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations & Roadmap */}
            <div className="space-y-6">
               <h3 className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
                  <span className="w-6 h-px bg-gray-200"></span>
                  Implementation Roadmap
               </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center text-xl">🧩</div>
                       <h4 className="font-bold text-gray-900 text-sm md:text-base">Point Solutions</h4>
                    </div>
                    <div className="space-y-3">
                       {(analysis.recommendations?.topPointSolutions || []).length > 0 ? (
                         (analysis.recommendations?.topPointSolutions || []).map((sol: string, i: number) => (
                           <div key={i} className="flex items-center gap-3 p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl group hover:bg-white border border-transparent hover:border-teal-100 transition-all">
                              <div className="w-2 h-2 rounded-full bg-[#4db6ac]"></div>
                              <span className="text-[11px] md:text-xs font-bold text-gray-700">{sol}</span>
                           </div>
                         ))
                       ) : (
                         <p className="text-[11px] md:text-xs text-gray-400 font-medium italic">No specific point solutions identified.</p>
                       )}
                    </div>
                  </div>

                  <div className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-xl">🧠</div>
                       <h4 className="font-bold text-gray-900 text-sm md:text-base">LLM Recommendation</h4>
                    </div>
                    <div className="space-y-3">
                       {(analysis.recommendations?.topModels || []).length > 0 ? (
                         (analysis.recommendations?.topModels || []).map((model: string, i: number) => (
                           <div key={i} className="flex items-center gap-3 p-3 md:p-4 bg-purple-50/50 rounded-xl md:rounded-2xl border border-purple-100">
                              <svg className="w-4 h-4 text-[#9d7bb0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              <span className="text-[11px] md:text-xs font-black text-[#9d7bb0] uppercase tracking-widest">{model}</span>
                           </div>
                         ))
                       ) : (
                         <p className="text-[11px] md:text-xs text-gray-400 font-medium italic">Refer to primary verdict for engine fitment.</p>
                       )}
                    </div>
                    <p className="text-[9px] md:text-[10px] text-gray-400 leading-relaxed pt-4 border-t border-gray-50">
                      Engines are selected based on knowledge intensity and exception handling requirements.
                    </p>
                  </div>
                </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Results;
