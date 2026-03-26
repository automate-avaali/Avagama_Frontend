
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { apiService } from '../services/api';

const Evaluations: React.FC = () => {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [shortlistedIds, setShortlistedIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'shortlisted'>('all');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const fetchEvals = async () => {
    setLoading(true);
    try {
      const res = filter === 'shortlisted' 
        ? await apiService.evaluations.getShortlisted()
        : await apiService.evaluations.list();
        
      if (res.success) {
        setEvaluations(res.data);
        // Sync shortlistedIds from the data
        const ids = res.data
          .filter((item: any) => item.shortlisted)
          .map((item: any) => item._id);
        setShortlistedIds(ids);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvals();
  }, [filter]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === currentItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentItems.map(item => item._id));
    }
  };

  const handleCompare = () => {
    if (selectedIds.length < 2) return;
    navigate(`/compare?ids=${selectedIds.join(',')}`);
  };

  const handleQuadrant = () => {
    if (selectedIds.length === 0) return;
    navigate(`/quadrant?ids=${selectedIds.join(',')}`);
  };

  const handleExport = async () => {
    if (evaluations.length === 0) {
      alert("No data available to export.");
      return;
    }
    
    setIsExporting(true);
    try {
      const blob = await apiService.evaluations.export();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Avagama_Evaluations_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch (err: any) {
      console.error("Export error:", err);
      alert(`Export Error: ${err.message || "The server encountered an error generating your file. Please ensure you have evaluations completed."}`);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleShortlist = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await apiService.evaluations.toggleShortlist(id);
      if (res.success) {
        setShortlistedIds(prev => 
          res.shortlisted ? [...prev, id] : prev.filter(i => i !== id)
        );
        // Update the local evaluations list to reflect the change
        setEvaluations(prev => prev.map(item => 
          item._id === id ? { ...item, shortlisted: res.shortlisted } : item
        ));
      }
    } catch (err) {
      console.error("Shortlist toggle error:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      const res = await apiService.evaluations.delete(id);
      if (res.success) {
        setEvaluations(prev => prev.filter(item => item._id !== id));
        setSelectedIds(prev => prev.filter(i => i !== id));
        setShortlistedIds(prev => prev.filter(i => i !== id));
        setDeleteConfirm(null);
      } else {
        alert("Failed to delete evaluation.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("An error occurred while deleting.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'bg-gray-200';
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-orange-400';
    return 'bg-red-500';
  };

  // Filter Logic
  const filteredEvaluations = filter === 'all' 
    ? evaluations 
    : evaluations.filter(item => shortlistedIds.includes(item._id));

  // Pagination Logic
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredEvaluations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEvaluations.length / rowsPerPage);

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 bg-[#fcfdff] min-h-screen">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-8">
          <h1 className="text-xl md:text-2xl font-black text-gray-900">My Evaluations</h1>
          
          {/* Filter Toggle */}
          <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
            <button 
              onClick={() => { setFilter('all'); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === 'all' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              All
            </button>
            <button 
              onClick={() => { setFilter('shortlisted'); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                filter === 'shortlisted' ? 'bg-[#9d7bb0] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Shortlisted
              {shortlistedIds.length > 0 && (
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${filter === 'shortlisted' ? 'bg-white text-[#9d7bb0]' : 'bg-gray-100 text-gray-400'}`}>
                  {shortlistedIds.length}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:gap-4 w-full lg:w-auto">
          <button 
            onClick={handleCompare}
            disabled={selectedIds.length < 2}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 rounded-xl font-bold text-xs md:text-sm border transition-all ${
              selectedIds.length >= 2 
                ? 'bg-white border-[#9d7bb0] text-[#9d7bb0] hover:bg-purple-50 shadow-sm' 
                : 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="hidden sm:inline">Compare</span>
            <span className="sm:hidden">Comp</span>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${selectedIds.length >= 2 ? 'bg-[#9d7bb0] text-white' : 'bg-gray-200 text-white'}`}>
              {selectedIds.length}
            </span>
          </button>

          <button 
            onClick={handleQuadrant}
            disabled={selectedIds.length === 0}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 rounded-xl font-bold text-xs md:text-sm border transition-all ${
              selectedIds.length >= 1 
                ? 'bg-white border-[#4db6ac] text-[#4db6ac] hover:bg-teal-50 shadow-sm' 
                : 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="hidden sm:inline">Strategic Quadrant</span>
            <span className="sm:hidden">Quadrant</span>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${selectedIds.length >= 1 ? 'bg-[#4db6ac] text-white' : 'bg-gray-200 text-white'}`}>
              {selectedIds.length}
            </span>
          </button>
          
          <button 
            onClick={handleExport}
            disabled={isExporting || evaluations.length === 0}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 bg-white border border-gray-100 rounded-xl font-bold text-xs md:text-sm text-gray-600 hover:bg-gray-50 transition-all shadow-sm ${isExporting || evaluations.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
            <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export'}</span>
            <span className="sm:hidden">Exp</span>
          </button>

          <Link to="/evaluate" className="w-full sm:w-auto bg-[#9d7bb0] text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#8b6aa1] transition-all shadow-lg shadow-purple-100 text-xs md:text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            New Evaluation
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {/* Table Header Styling - Hidden on Mobile */}
        <div className="hidden lg:grid grid-cols-[40px_1.5fr_1fr_1fr_1fr_0.8fr_0.8fr_0.8fr_50px] gap-4 px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
          <div className="flex items-center gap-2">
             <input 
               type="checkbox" 
               className="w-4 h-4 rounded border-gray-200 text-[#9d7bb0] focus:ring-[#9d7bb0] cursor-pointer" 
               checked={currentItems.length > 0 && selectedIds.length === currentItems.length}
               onChange={toggleSelectAll}
             />
          </div>
          <div className="pl-8">Process name</div>
          <div>Created on</div>
          <div>Automation score</div>
          <div>Feasibility score</div>
          <div>Fit type</div>
          <div>LLM type</div>
          <div className="text-right pr-4">Status</div>
          <div></div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
             <div className="w-10 h-10 border-4 border-[#9d7bb0]/20 border-t-[#9d7bb0] rounded-full animate-spin"></div>
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Retrieving Roadmap...</p>
          </div>
        ) : evaluations.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
             <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">No evaluations found.</p>
             <Link to="/evaluate" className="text-[#9d7bb0] text-sm font-bold mt-2 inline-block hover:underline">Start your first assessment</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {currentItems.map((item) => {
              const isSelected = selectedIds.includes(item._id);
              const isShortlisted = shortlistedIds.includes(item._id);
              const automation = item.aiAnalysis?.automationScore;
              const businessBenefit = item.aiAnalysis?.businessBenefitScore;
              
              let feasibility = item.aiAnalysis?.feasibilityScore;
              if (!feasibility && automation && businessBenefit) {
                feasibility = Math.round((automation + businessBenefit) / 2);
              }

              const fitment = item.aiAnalysis?.fitmentType;
              const status = item.status || 'Draft';
              
              const recs = item.recommendations || item.aiAnalysis?.recommendations || {};
              const llmType = recs.llmRecommendation || 
                              recs.llm_recommendation || 
                              recs.llRecommendation || 
                              recs.llmrecomendation || 
                              item.aiConfig?.baseModel || 
                              '-';
              const formattedLLMType = llmType.replace(/_/g, ' ').toUpperCase();

              return (
                <div 
                  key={item._id} 
                  className={`bg-white rounded-2xl md:rounded-3xl border transition-all hover:shadow-md overflow-hidden ${isSelected ? 'border-[#9d7bb0] shadow-sm' : 'border-gray-100 shadow-sm'}`}
                >
                  {/* Desktop View */}
                  <div className="hidden lg:grid grid-cols-[40px_1.5fr_1fr_1fr_1fr_0.8fr_0.8fr_0.8fr_50px] gap-4 px-6 py-5 items-center">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleSelect(item._id)}
                        className="w-4 h-4 rounded border-gray-200 text-[#9d7bb0] focus:ring-[#9d7bb0]" 
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => toggleShortlist(item._id, e)}
                        className={`shrink-0 transition-all ${isShortlisted ? 'text-amber-400 scale-110' : 'text-gray-200 hover:text-gray-300'}`}
                      >
                        <svg className="w-5 h-5" fill={isShortlisted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                      <Link 
                        to={status.toLowerCase() === 'draft' ? `/evaluate?id=${item._id}` : `/results/${item._id}`} 
                        className="font-bold text-[#9d7bb0] text-sm hover:underline block truncate max-w-[280px]"
                      >
                        {item.discovery?.processName || 'Untitled Process'}
                      </Link>
                    </div>
                    <div className="text-xs font-medium text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}, {new Date(item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${getScoreColor(automation)}`}></div>
                      <span className="text-sm font-bold text-gray-700">{automation ? `${automation}%` : '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${getScoreColor(feasibility)}`}></div>
                      <span className="text-sm font-bold text-gray-700">{feasibility ? `${feasibility}%` : '-'}</span>
                    </div>
                    <div>
                      <span className="px-3 py-1 bg-gray-50 text-gray-400 border border-gray-100 rounded-lg text-[10px] font-bold uppercase tracking-wide">
                        {fitment || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="px-3 py-1 bg-gray-50 text-gray-400 border border-gray-100 rounded-lg text-[10px] font-bold uppercase tracking-wide">
                        {formattedLLMType}
                      </span>
                    </div>
                    <div className="text-right pr-4">
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${status.toLowerCase() === 'completed' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                        {status}
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeleteConfirm(item._id);
                        }}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Mobile View */}
                  <div className="lg:hidden p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleSelect(item._id)}
                          className="w-5 h-5 rounded border-gray-200 text-[#9d7bb0] focus:ring-[#9d7bb0]" 
                        />
                        <button 
                          onClick={(e) => toggleShortlist(item._id, e)}
                          className={`shrink-0 transition-all ${isShortlisted ? 'text-amber-400' : 'text-gray-200'}`}
                        >
                          <svg className="w-5 h-5" fill={isShortlisted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </button>
                        <Link 
                          to={status.toLowerCase() === 'draft' ? `/evaluate?id=${item._id}` : `/results/${item._id}`} 
                          className="font-black text-[#9d7bb0] text-base hover:underline line-clamp-2"
                        >
                          {item.discovery?.processName || 'Untitled Process'}
                        </Link>
                      </div>
                      <span className={`shrink-0 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${status.toLowerCase() === 'completed' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                        {status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Automation</p>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getScoreColor(automation)}`}></div>
                          <span className="text-sm font-bold text-gray-700">{automation ? `${automation}%` : '-'}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Feasibility</p>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getScoreColor(feasibility)}`}></div>
                          <span className="text-sm font-bold text-gray-700">{feasibility ? `${feasibility}%` : '-'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="px-2 py-1 bg-gray-50 text-gray-400 border border-gray-100 rounded-md text-[9px] font-bold uppercase tracking-wide">
                        {fitment || 'N/A'}
                      </span>
                      <span className="px-2 py-1 bg-gray-50 text-gray-400 border border-gray-100 rounded-md text-[9px] font-bold uppercase tracking-wide">
                        {formattedLLMType}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-gray-300 uppercase">
                          {new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeleteConfirm(item._id);
                          }}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <Link 
                        to={status.toLowerCase() === 'draft' ? `/evaluate?id=${item._id}` : `/results/${item._id}`}
                        className="text-[10px] font-black text-[#9d7bb0] uppercase tracking-widest flex items-center gap-1"
                      >
                        View Details
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-4 pt-4 text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4">
           <span className="hidden sm:inline">Rows per page</span>
            <div className="relative">
              <select 
                value={rowsPerPage} 
                onChange={handleRowsPerPageChange}
                className="appearance-none bg-white px-3 py-1.5 pr-8 rounded-lg border border-gray-100 text-gray-600 shadow-sm cursor-pointer outline-none focus:border-[#9d7bb0]"
              >
                {[10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75].map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
           <span className="md:ml-4">
             {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredEvaluations.length)} of {filteredEvaluations.length}
           </span>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <button 
               onClick={goToFirstPage}
               disabled={currentPage === 1}
               className="p-2 px-3 md:px-4 hover:bg-gray-50 text-gray-400 disabled:opacity-30 border-r border-gray-50"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 19l-7-7 7-7m8 14l-7-7 7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
             </button>
             <button 
               onClick={goToPrevPage}
               disabled={currentPage === 1}
               className="p-2 px-3 md:px-4 hover:bg-gray-50 text-gray-400 disabled:opacity-30 border-r border-gray-50"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
             </button>
             <button 
               onClick={goToNextPage}
               disabled={currentPage === totalPages}
               className="p-2 px-3 md:px-4 hover:bg-gray-50 text-gray-400 disabled:opacity-30 border-r border-gray-50"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
             </button>
             <button 
               onClick={goToLastPage}
               disabled={currentPage === totalPages}
               className="p-2 px-3 md:px-4 hover:bg-gray-50 text-gray-400 disabled:opacity-30"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 5l7 7-7 7m-8-14l7 7-7 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
             </button>
           </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && createPortal(
        <div className="fixed inset-0 bg-white/40 backdrop-blur-md z-[9999] flex items-center justify-center p-4 md:p-6">
          <div className="bg-white rounded-[32px] md:rounded-[50px] p-8 md:p-16 max-w-xl w-full shadow-2xl space-y-8 md:space-y-10 border border-white/20 animate-scaleUp">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-red-50 text-red-500 rounded-2xl md:rounded-[30px] flex items-center justify-center mx-auto border border-red-100 shadow-inner">
              <svg className="w-8 h-8 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div className="text-center space-y-3 md:space-y-4">
              <h3 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Delete Evaluation?</h3>
              <p className="text-gray-500 text-sm md:text-lg leading-relaxed">
                This action is permanent and will remove all synthesized data for this process.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <button 
                onClick={() => setDeleteConfirm(null)} 
                disabled={isDeleting}
                className="flex-1 py-4 md:py-5 border-2 border-gray-100 rounded-2xl md:rounded-3xl font-black text-gray-400 hover:bg-gray-50 transition-colors uppercase text-[10px] md:text-xs tracking-widest disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDelete(deleteConfirm)} 
                disabled={isDeleting}
                className="flex-1 py-4 md:py-5 bg-red-500 text-white rounded-2xl md:rounded-3xl font-black hover:bg-red-600 shadow-2xl shadow-red-200 transition-all uppercase text-[10px] md:text-xs tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Evaluations;
