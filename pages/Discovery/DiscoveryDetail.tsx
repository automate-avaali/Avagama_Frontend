
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import { apiService } from '../../services/api';
import { useCortex } from '../../context/CortexContext';

const DiscoveryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  console.log("[DiscoveryDetail] Rendering with ID:", id);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, any>>({});
  const [hoveredFeasibility, setHoveredFeasibility] = useState<{idx: number, rect: DOMRect, scoring: any[]} | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { openChat } = useCortex();

  // Determine back path from query params
  const searchParams = new URLSearchParams(location.search);
  const discoveryType = searchParams.get('type') || 'company';
  const backPath = discoveryType === 'domain' ? '/discovery/domain' : '/discovery/company';

  const initializedRef = useRef<string | null>(null);

  useEffect(() => {
    const currentKey = `${id}-${discoveryType}`;
    if (initializedRef.current === currentKey) return;
    if (!id) return;
    
    initializedRef.current = currentKey;
    setAgentStatuses({}); // Reset stale data
    
    const fetchAll = async () => {
      const token = sessionStorage.getItem('token');
      if (!token) {
        console.error("[DiscoveryDetail] No token found, skipping fetch");
        return;
      }

      setLoading(true);
      try {
        // Fetch Status
        const statusPromise = apiService.agents.getStatusBulk(discoveryType, id!).then(statusRes => {
          console.log("[DiscoveryDetail] Status response:", statusRes);
          const statusData = statusRes?.status || statusRes?.data || (statusRes?.success === undefined ? statusRes : null);
          if (statusData) {
            console.log("[DiscoveryDetail] Extracted status data:", statusData);
            setAgentStatuses(statusData);
          }
        }).catch(err => {
          console.error("[DiscoveryDetail] Status fetch error:", err);
          if (err.status === 401) {
            // Token might be expired
            sessionStorage.removeItem('token');
            window.location.href = '#/login';
          }
        });

        // Fetch Detail
        const detailPromise = (discoveryType === 'domain' ? apiService.useCases.getDomain(id!) : apiService.useCases.getCompany(id!)).then(res => {
          const detail = res.data || res;
          if (detail) {
            setData(detail);
          }
        }).catch(err => {
          console.error("[DiscoveryDetail] Detail fetch error:", err);
          if (err.status === 401) {
            sessionStorage.removeItem('token');
            window.location.href = '#/login';
          }
        });

        await Promise.all([statusPromise, detailPromise]);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [id, discoveryType]);

  useEffect(() => {
    if (data?.use_cases && Object.keys(agentStatuses).length > 0) {
      console.log("[DiscoveryDetail] UseCase IDs:", data.use_cases.map((uc: any) => (uc._id || uc.id)?.toString()));
      console.log("[DiscoveryDetail] Status Keys:", Object.keys(agentStatuses));
    }
  }, [data, agentStatuses]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 border-4 border-purple-50 border-t-[#9d7bb0] rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Compiling Agentic Roadmap...</p>
      </div>
    );
  }

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcfdff]">
      <div className="text-center space-y-6 max-w-sm">
        <div className="text-5xl">🔭</div>
        <h2 className="text-xl font-black text-gray-900">Analysis not found</h2>
        <p className="text-sm text-gray-500">The requested report could not be retrieved. It may have been archived.</p>
        <button onClick={() => navigate(backPath)} className="bg-[#9d7bb0] text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-purple-100">Return to Workspace</button>
      </div>
    </div>
  );

  const getInterpretationColor = (val: string) => {
    const v = val?.toLowerCase() || '';
    if (v.includes('strong')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (v.includes('moderate')) return 'bg-blue-50 text-blue-600 border-blue-100';
    return 'bg-gray-50 text-gray-400 border-gray-100';
  };

  const formatJustification = (text: string) => {
    if (!text) return '';
    const trimmed = text.trim();
    // Check if it starts and ends with " or **
    const isQuoted = trimmed.startsWith('"') && trimmed.endsWith('"');
    const isBolded = trimmed.startsWith('**') && trimmed.endsWith('**');
    
    if (isQuoted || isBolded) {
      // If it's already bolded with **, return as is. 
      // If it's quoted, wrap it in ** to make it bold.
      if (isQuoted && !isBolded) {
        return `**${trimmed}**`;
      }
      return trimmed;
    }
    return trimmed;
  };

  /**
   * Benefit Score Progress Ring
   * Calculated with extra padding in the viewBox to prevent 'round' stroke-linecap clipping
   */
  const BenefitScoreRing = ({ score }: { score: number }) => {
    const size = 100; // SVG ViewBox base
    const strokeWidth = 12;
    // We add extra margin to the radius so the rounded cap doesn't hit the viewBox edge
    const r = (size - strokeWidth * 2) / 2; 
    const center = size / 2;
    const circumference = 2 * Math.PI * r;
    const validScore = Math.min(Math.max(score || 0, 0), 100);
    const strokeDashoffset = circumference - (validScore / 100) * circumference;
    
    return (
      <div className="w-20 h-20 relative flex items-center justify-center shrink-0">
        <svg 
          viewBox={`0 0 ${size} ${size}`} 
          width="100%" 
          height="100%" 
          className="transform -rotate-90 overflow-visible"
        >
          {/* Background Track */}
          <circle
            cx={center}
            cy={center}
            r={r}
            stroke="#f3f4f6"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Overlay */}
          <circle
            cx={center}
            cy={center}
            r={r}
            stroke={discoveryType === 'domain' ? '#4db6ac' : '#9d7bb0'}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="bg-[#fcfdff] min-h-screen pb-24 md:pb-32">
      {/* Premium Header */}
      <div className="bg-white border-b border-gray-100 px-4 md:px-8 py-6 md:py-14">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 md:gap-10">
           <div className="space-y-3 md:space-y-4 w-full lg:w-auto">
              <button 
                onClick={() => navigate(backPath)}
                className="group flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] hover:text-[#9d7bb0] transition-colors"
              >
                <svg className="w-3 h-3 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Back to Discovery
              </button>
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-gray-900 tracking-tighter leading-tight md:leading-none break-words">
                {data.domain || data.company_name} <span className="text-gray-200 hidden md:inline">/</span> <span className={`${discoveryType === 'domain' ? 'text-[#4db6ac]' : 'text-[#9d7bb0]'} block md:inline`}>Roadmap</span>
              </h1>
              <div className="flex flex-wrap items-center gap-3 md:gap-5">
                <div className="px-3 py-1 md:px-4 md:py-1.5 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-2">
                   <span className={`w-1.5 h-1.5 rounded-full ${discoveryType === 'domain' ? 'bg-[#4db6ac]' : 'bg-[#9d7bb0]'}`}></span>
                   <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{data.industry || (discoveryType === 'domain' ? 'Industry Mapping' : 'Company Analysis')}</span>
                </div>
                {data.user_role && (
                  <div className="px-3 py-1 md:px-4 md:py-1.5 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-2">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Role:</span>
                     <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{data.user_role}</span>
                  </div>
                )}
                {data.objective && (
                  <div className="px-3 py-1 md:px-4 md:py-1.5 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-2">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Objective:</span>
                     <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{data.objective}</span>
                  </div>
                )}
              </div>
           </div>
           
           {/* 
           <div className="flex flex-row gap-3 md:gap-4 w-full lg:w-auto">
              <div className="flex-1 lg:flex-none p-3 md:p-6 bg-white rounded-2xl md:rounded-3xl border border-gray-100 text-center min-w-[100px] md:min-w-[140px] shadow-sm">
                 <div className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Compute Yield</div>
                 <div className="text-lg md:text-2xl font-black text-gray-900">{data.usage?.total_tokens?.toLocaleString() || 'N/A'}</div>
              </div>
              <div className="flex-1 lg:flex-none p-3 md:p-6 bg-gray-900 rounded-2xl md:rounded-3xl shadow-2xl text-center min-w-[100px] md:min-w-[140px]">
                 <div className="text-[8px] md:text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Total Scenarios</div>
                 <div className="text-lg md:text-2xl font-black text-white">{data.totalUseCases || data.use_cases?.length || 0}</div>
              </div>
           </div>
           */}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8 md:mt-16 space-y-12 md:space-y-16">
        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
           {[
             { label: 'Avg ROI Index', value: `${Math.round(data.avgBusinessBenefitScore || 0)}%`, color: 'text-gray-900' },
             { label: 'Strong ROI', value: data.strongROICount || 0, color: 'text-emerald-500' },
             { label: 'Moderate ROI', value: data.moderateROICount || 0, color: 'text-blue-500' },
             { label: 'Peak Benefit', value: `${data.maxBusinessBenefitScore || 0}%`, color: discoveryType === 'domain' ? 'text-[#4db6ac]' : 'text-[#9d7bb0]' }
           ].map((stat, i) => (
             <div key={i} className="bg-white p-4 md:p-8 rounded-[24px] md:rounded-[40px] border border-gray-100 shadow-sm">
                <p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <div className={`text-xl md:text-4xl font-black ${stat.color}`}>{stat.value}</div>
             </div>
           ))}
        </div>

        {/* Use Case Catalog */}
        <div className="space-y-8 md:space-y-10">
           <div className="flex justify-between items-center border-b border-gray-100 pb-6">
              <h3 className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-[0.4em] flex items-center gap-2 md:gap-4">
                 <span className="w-6 md:w-10 h-px bg-gray-200"></span>
                 Opportunity Catalog
              </h3>
              <span className="text-[9px] md:text-[10px] font-black text-gray-300 uppercase tracking-widest">Diagnostic Detail</span>
           </div>
           
           <div className="grid grid-cols-1 gap-8 md:gap-12">
              {data.use_cases?.map((uc: any, idx: number) => (
                <div key={idx} className={`bg-white rounded-[32px] md:rounded-[56px] border border-gray-100 shadow-sm overflow-hidden group transition-all ${discoveryType === 'domain' ? 'hover:border-[#4db6ac]/20' : 'hover:border-[#9d7bb0]/20'}`}>
                  <div className="grid grid-cols-1 lg:grid-cols-12">
                    
                    {/* Left Diagnostic Panel */}
                    <div className="lg:col-span-5 p-6 md:p-12 lg:p-14 bg-gray-50/50 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col justify-between">
                       <div className="space-y-6 md:space-y-8">
                          <div className="flex justify-between items-start">
                             <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-lg md:text-2xl shadow-sm group-hover:scale-110 transition-transform">
                                {idx % 2 === 0 ? '🦾' : '🧠'}
                             </div>
                             <div className={`px-2 py-0.5 md:px-4 md:py-1.5 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest border shadow-sm ${getInterpretationColor(uc.business_benefit_score?.interpretation || 'In Review')}`}>
                                {uc.business_benefit_score?.interpretation || 'In Review'}
                             </div>
                          </div>
                          <div className="space-y-2 md:space-y-3">
                             <h4 className={`text-lg md:text-2xl font-black text-gray-900 leading-tight transition-colors ${discoveryType === 'domain' ? 'group-hover:text-[#4db6ac]' : 'group-hover:text-[#9d7bb0]'}`}>{uc.title}</h4>
                             <div className="text-[11px] md:text-sm font-medium text-gray-500 leading-relaxed italic opacity-80">
                                <ReactMarkdown components={{
                                  p: ({node, ...props}) => <p className="m-0 inline" {...props} />,
                                  strong: ({node, ...props}) => <strong className="font-black text-gray-900" {...props} />
                                }}>
                                  {"\"" + uc.description + "\""}
                                </ReactMarkdown>
                             </div>
                             {uc.why_relevant && (
                               <div className="mt-4 p-4 bg-white/50 rounded-2xl border border-gray-100/50">
                                  <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${discoveryType === 'domain' ? 'text-[#4db6ac]' : 'text-[#9d7bb0]'}`}>Strategic Relevance</p>
                                  <div className="text-[11px] md:text-xs text-gray-600 leading-relaxed font-medium">
                                     <ReactMarkdown components={{
                                       p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                       strong: ({node, ...props}) => <strong className="font-black text-gray-900" {...props} />
                                     }}>
                                       {uc.why_relevant}
                                     </ReactMarkdown>
                                  </div>
                               </div>
                             )}
                          </div>
                       </div>
                       
                       <div className="pt-6 md:pt-8 border-t border-gray-200 mt-6 md:mt-10">
                          <div 
                            className={`flex justify-between items-center bg-white p-5 md:p-8 lg:p-10 rounded-[24px] md:rounded-[40px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all cursor-help hover:border-[#9d7bb0]/30`}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setHoveredFeasibility({
                                idx,
                                rect,
                                scoring: uc.technical_scoring || []
                              });
                            }}
                            onMouseLeave={() => setHoveredFeasibility(null)}
                          >
                             <div className="space-y-1">
                                <p className="text-[9px] md:text-[11px] font-bold text-gray-400 uppercase tracking-widest">FEASIBILITY SCORE</p>
                                <div className="text-2xl md:text-4xl font-black text-gray-900 flex items-baseline gap-1">
                                  {(discoveryType === 'domain' && !uc.technical_feasibility_score?.score) 
                                    ? (uc.business_benefit_score?.score || 0) + 2 
                                    : (uc.technical_feasibility_score?.score || 0)}
                                  <span className="text-[10px] md:text-sm text-gray-300 font-bold">/100</span>
                                </div>
                             </div>
                             <BenefitScoreRing score={(discoveryType === 'domain' && !uc.technical_feasibility_score?.score) 
                               ? (uc.business_benefit_score?.score || 0) + 2 
                               : (uc.technical_feasibility_score?.score || 0)} />
                          </div>
                       </div>
                    </div>

                    {/* Right Justification Matrix */}
                    <div className="lg:col-span-7 p-6 md:p-14 space-y-6 md:space-y-10">
                       <h5 className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">AI Reasoning Matrix</h5>
                       <div className="space-y-5 md:space-y-8">
                          {(uc.parameter_scoring || []).map((param: any, pIdx: number) => (
                            <div key={pIdx} className="space-y-2 md:space-y-3">
                               <div className="flex justify-between items-end gap-4">
                                  <div className="space-y-1 flex-1">
                                     <p className="text-[10px] md:text-xs font-black text-gray-800 uppercase tracking-tight">{param.parameter}</p>
                                     <div className="text-[9px] md:text-[11px] font-medium text-gray-500 leading-snug">
                                         <ReactMarkdown components={{
                                           p: ({node, ...props}) => <p className="m-0" {...props} />,
                                           strong: ({node, ...props}) => <strong className="font-black text-gray-900" {...props} />
                                         }}>
                                           {param.justification}
                                         </ReactMarkdown>
                                      </div>
                                      {(param.source_type || param.source_details) && (
                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                          {param.source_type && (
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[8px] font-black uppercase tracking-tighter">
                                              {param.source_type}
                                            </span>
                                          )}
                                          {param.source_details && (
                                            <span className="text-[8px] md:text-[9px] text-gray-400 font-medium italic">
                                              {param.source_details}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                  </div>
                                  <div className="text-right shrink-0 flex flex-col items-end">
                                     <div className="flex items-baseline gap-1">
                                        <span className={`text-sm md:text-lg font-black ${discoveryType === 'domain' ? 'text-[#4db6ac]' : 'text-[#9d7bb0]'}`}>{param.score}</span>
                                        <span className="text-[8px] md:text-[10px] font-bold text-gray-300">/{param.weight || 10}</span>
                                     </div>
                                     {param.weight && (
                                       <div className="text-[7px] md:text-[8px] font-black text-gray-400 uppercase tracking-tighter">
                                          Weight: {param.weight}
                                       </div>
                                     )}
                                  </div>
                               </div>
                               <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                                  <div className={`h-full transition-all duration-1000 ease-out ${discoveryType === 'domain' ? 'bg-[#4db6ac]' : 'bg-[#9d7bb0]'}`} style={{width: `${(param.score / (param.weight || 10)) * 100}%`}}></div>
                               </div>
                            </div>
                          ))}
                       </div>
                       
                       <div className={`p-4 md:p-6 rounded-[24px] md:rounded-[32px] border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6 md:mt-8 ${discoveryType === 'domain' ? 'bg-[#4db6ac]/5 border-[#4db6ac]/10' : 'bg-[#9d7bb0]/5 border-[#9d7bb0]/10'}`}>
                          <div className="flex items-center gap-3 shrink-0">
                             <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-xs md:text-sm shrink-0">🎯</div>
                             <div>
                                <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest ${discoveryType === 'domain' ? 'text-[#4db6ac]' : 'text-[#9d7bb0]'}`}>Benefit Score</p>
                                <p className="text-[9px] md:text-[11px] font-bold text-gray-600">Calculated Strategy Alignment</p>
                             </div>
                          </div>
                          <div className="flex items-center justify-end w-full sm:w-auto gap-4 md:gap-8">
                             <div className="flex flex-col gap-2 shrink-0 min-w-[140px] md:min-w-[160px]">
                                <button 
                                  onClick={() => openChat({
                                    sourceType: discoveryType as any,
                                    documentId: data._id || data.id,
                                     usecaseId: (uc._id || uc.id)?.toString(),
                                    title: uc.title
                                  })}
                                  className={`w-full px-4 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                    discoveryType === 'domain' 
                                      ? 'bg-[#4db6ac] text-white hover:bg-[#3d968d]' 
                                      : 'bg-[#9d7bb0] text-white hover:bg-[#8b6aa1]'
                                  }`}
                                >
                                  <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                  </svg>
                                  Ask Avagama
                                </button>
                                 {(() => {
                                   const ucId = (uc._id || uc.id)?.toString();
                                   // Try to find status by ID string or by looking for the ID in keys
                                   const status = agentStatuses[ucId] || 
                                                Object.entries(agentStatuses).find(([key]) => key === ucId)?.[1];
                                   
                                   if (status) {
                                     console.log(`[DiscoveryDetail] UseCase ${ucId} status found:`, status);
                                   }
                                   
                                   const hasAgent = !!(status && (
                                     (typeof status === 'number' && status > 0) ||
                                     (typeof status === 'object' && (status.exists || status.count > 0))
                                   ));
                                   const agentCount = typeof status === 'object' ? (status.count || 0) : (typeof status === 'number' ? status : 0);

                                   return hasAgent ? (
                                     <button 
                                       onClick={() => navigate(`/agents?type=${discoveryType}&entityId=${data._id || data.id}&usecaseId=${ucId}`)}
                                       className={`w-full px-4 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-2 ${
                                         discoveryType === 'domain' 
                                           ? 'border-[#4db6ac] text-[#4db6ac] hover:bg-[#4db6ac] hover:text-white' 
                                           : 'border-[#9d7bb0] text-[#9d7bb0] hover:bg-[#9d7bb0] hover:text-white'
                                       }`}
                                     >
                                       <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                       </svg>
                                       View Agents ({agentCount})
                                     </button>
                                   ) : (
                                     <button 
                                       onClick={() => navigate(`/admin/agent-builder?type=${discoveryType}&entityId=${data._id || data.id}&usecaseId=${ucId}`)}
                                       className={`w-full px-4 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-2 ${
                                         discoveryType === 'domain' 
                                           ? 'border-[#4db6ac] text-[#4db6ac] hover:bg-[#4db6ac] hover:text-white' 
                                           : 'border-[#9d7bb0] text-[#9d7bb0] hover:bg-[#9d7bb0] hover:text-white'
                                       }`}
                                     >
                                       <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                       </svg>
                                       Create Agent
                                     </button>
                                   );
                                 })()}
                             </div>
                             <span className="text-3xl md:text-5xl font-black text-gray-900">
                                {uc.business_benefit_score?.score || '-'}
                             </span>
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Functional Steps Section - Full Width at Bottom */}
                  {uc.functional_steps && uc.functional_steps.length > 0 && (
                    <div className="border-t border-gray-100 bg-white p-6 md:p-14">
                       <div className="flex items-center gap-4 mb-10">
                          <h5 className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Functional Execution Roadmap</h5>
                          <div className="h-px flex-1 bg-gray-50"></div>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10 relative">
                          {uc.functional_steps.map((step: string, sIdx: number) => {
                            // Extract step number and content if possible for better styling
                            const stepMatch = step.match(/Step (\d+):/i);
                            const stepNum = stepMatch ? stepMatch[1] : (sIdx + 1).toString();
                            const stepContent = step.replace(/Step \d+:/i, '').trim();
                            
                            // Format subpoints (•, (1), (a), etc.) to appear on new lines
                            const formattedText = stepContent
                              .replace(/(•|\(\d+\)|\([a-z]\))/g, '\n\n$1')
                              .trim();
                            
                            return (
                              <div key={sIdx} className="relative group/step">
                                 <div className="flex gap-5">
                                    <div className="flex flex-col items-center shrink-0">
                                       <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-[10px] md:text-xs font-black shadow-sm border transition-all ${
                                         discoveryType === 'domain' 
                                           ? 'bg-[#4db6ac]/5 border-[#4db6ac]/20 text-[#4db6ac] group-hover/step:bg-[#4db6ac] group-hover/step:text-white' 
                                           : 'bg-[#9d7bb0]/5 border-[#9d7bb0]/20 text-[#9d7bb0] group-hover/step:bg-[#9d7bb0] group-hover/step:text-white'
                                       }`}>
                                          {stepNum}
                                       </div>
                                    </div>
                                    <div className="space-y-2 pt-1">
                                       <div className="prose prose-sm max-w-none text-[11px] md:text-xs text-gray-600 font-medium leading-relaxed">
                                          <ReactMarkdown components={{
                                             p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                             strong: ({node, ...props}) => <strong className="font-black text-gray-900" {...props} />
                                           }}>
                                             {formattedText}
                                           </ReactMarkdown>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                            );
                          })}
                       </div>
                    </div>
                  )}
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Technical Feasibility Tooltip Portal */}
      {hoveredFeasibility && createPortal(
        <div 
          className="fixed z-[9999] pointer-events-none animate-in fade-in zoom-in duration-200"
          style={{
            top: hoveredFeasibility.rect.top - 4,
            left: hoveredFeasibility.rect.left + hoveredFeasibility.rect.width / 2,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 p-6 w-[320px] md:w-[450px] space-y-5">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <h6 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Technical Scoring Parameters</h6>
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-xs">⚙️</div>
            </div>
            <div className="space-y-5 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {hoveredFeasibility.scoring.length > 0 ? (
                hoveredFeasibility.scoring.map((ts, i) => (
                  <div key={i} className="space-y-2 group/item">
                    <div className="flex justify-between items-end gap-4">
                      <div className="space-y-1 flex-1">
                        <p className="text-[10px] font-black text-gray-800 uppercase tracking-tight">{ts.parameter}</p>
                        <div className="text-[9px] font-medium text-gray-500 leading-snug">
                          <ReactMarkdown components={{
                            p: ({node, ...props}) => <p className="m-0" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-black text-gray-900" {...props} />
                          }}>
                            {formatJustification(ts.justification)}
                          </ReactMarkdown>
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end">
                        <div className="flex items-baseline gap-1">
                          <span className={`text-sm font-black ${discoveryType === 'domain' ? 'text-[#4db6ac]' : 'text-[#9d7bb0]'}`}>{ts.score}</span>
                          <span className="text-[8px] font-bold text-gray-300">/{ts.weight || 10}</span>
                        </div>
                        {ts.weight && (
                          <div className="text-[7px] font-black text-gray-400 uppercase tracking-tighter">
                            Weight: {ts.weight}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="h-1 w-full bg-gray-50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ease-out ${discoveryType === 'domain' ? 'bg-[#4db6ac]' : 'bg-[#9d7bb0]'}`} 
                        style={{width: `${(ts.score / (ts.weight || 10)) * 100}%`}}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[10px] font-bold text-gray-400 uppercase text-center py-4">No parameters available</p>
              )}
            </div>
            <div className="pt-1 flex justify-center">
               <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
            </div>
          </div>
          {/* Tooltip Arrow */}
          <div className="w-4 h-4 bg-white border-r border-b border-gray-100 rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2"></div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DiscoveryDetail;
