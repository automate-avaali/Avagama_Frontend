import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { apiService } from '../services/api';
import { useCortex } from '../context/CortexContext';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  ChevronsRight, 
  ChevronsLeft, 
  Calendar, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Star,
  CheckCircle2,
  AlertCircle,
  FileText,
  LayoutGrid,
  ArrowRightLeft,
  Download,
  MoreVertical,
  X
} from 'lucide-react';
import { format } from 'date-fns';

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
  
  // Sorting state
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSortMenu, setActiveSortMenu] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  const navigate = useNavigate();
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const { openChat } = useCortex();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setActiveSortMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const currentProcessedEvaluations = [...evaluations]
    .filter(item => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const processName = (item.discovery?.processName || '').toLowerCase();
        if (!processName.includes(query)) return false;
      }
      if (filter === 'shortlisted' && !shortlistedIds.includes(item._id)) return false;
      if (startDate || endDate) {
        const itemDate = new Date(item.createdAt);
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (itemDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (itemDate > end) return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      if (sortField === 'processName') {
        valA = (a.discovery?.processName || '').toLowerCase();
        valB = (b.discovery?.processName || '').toLowerCase();
      } else if (sortField === 'createdAt') {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = currentProcessedEvaluations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(currentProcessedEvaluations.length / rowsPerPage);

  const toggleSelectAll = () => {
    if (selectedIds.length === currentItems.length && currentItems.length > 0) {
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

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleSort = (field: string, order: 'asc' | 'desc') => {
    setSortField(field);
    setSortOrder(order);
    setActiveSortMenu(null);
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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-8">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900">My Evaluations</h1>
          </div>
          
          <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm self-start">
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

          <div className="lg:hidden flex items-center gap-2">
            <button 
              onClick={() => setActiveSortMenu(activeSortMenu === 'mobile-sort' ? null : 'mobile-sort')}
              className={`p-2.5 rounded-xl border transition-all ${activeSortMenu === 'mobile-sort' ? 'bg-[#9d7bb0] border-[#9d7bb0] text-white shadow-md' : 'bg-white border-gray-100 text-gray-500'}`}
              title="Sort and Filter"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
            {activeSortMenu === 'mobile-sort' && (
              <div ref={sortMenuRef} className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Sort Roadmap</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => handleSort('processName', 'asc')}
                        className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all text-center ${sortField === 'processName' && sortOrder === 'asc' ? 'bg-[#9d7bb0] text-white' : 'bg-gray-50 text-gray-600'}`}
                      >
                        A-Z
                      </button>
                      <button 
                        onClick={() => handleSort('processName', 'desc')}
                        className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all text-center ${sortField === 'processName' && sortOrder === 'desc' ? 'bg-[#9d7bb0] text-white' : 'bg-gray-50 text-gray-600'}`}
                      >
                        Z-A
                      </button>
                      <button 
                        onClick={() => handleSort('createdAt', 'desc')}
                        className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all text-center ${sortField === 'createdAt' && sortOrder === 'desc' ? 'bg-[#9d7bb0] text-white' : 'bg-gray-50 text-gray-600'}`}
                      >
                        Newest
                      </button>
                      <button 
                        onClick={() => handleSort('createdAt', 'asc')}
                        className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all text-center ${sortField === 'createdAt' && sortOrder === 'asc' ? 'bg-[#9d7bb0] text-white' : 'bg-gray-50 text-gray-600'}`}
                      >
                        Oldest
                      </button>
                    </div>
                  </div>

                  <div className="h-px bg-gray-100"></div>

                  <div className="space-y-3">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Filter by date</p>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-gray-400 ml-1">START DATE</label>
                        <input 
                          type="date" 
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold text-gray-600 focus:outline-none focus:border-[#9d7bb0]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-gray-400 ml-1">END DATE</label>
                        <input 
                          type="date" 
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold text-gray-600 focus:outline-none focus:border-[#9d7bb0]"
                        />
                      </div>
                    </div>
                    {(startDate || endDate) && (
                      <button 
                        onClick={() => { setStartDate(''); setEndDate(''); }}
                        className="w-full py-2.5 bg-gray-50 text-[10px] font-bold text-red-400 hover:text-red-600 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <X className="w-3.5 h-3.5" /> Clear Dates
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:gap-4 w-full lg:w-auto">
          <div className="relative flex-1 md:flex-none md:w-64 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#9d7bb0] transition-colors" />
            <input 
              type="text" 
              placeholder="Search processes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-bold shadow-sm focus:outline-none focus:border-[#9d7bb0] transition-all"
            />
          </div>

          <button 
            onClick={handleCompare}
            disabled={selectedIds.length < 2}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 rounded-xl font-bold text-xs border transition-all ${
              selectedIds.length >= 2 
                ? 'bg-white border-[#9d7bb0] text-[#9d7bb0] hover:bg-purple-50 shadow-sm' 
                : 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Compare</span>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${selectedIds.length >= 2 ? 'bg-[#9d7bb0] text-white' : 'bg-gray-200 text-white'}`}>
              {selectedIds.length}
            </span>
          </button>

          <button 
            onClick={handleQuadrant}
            disabled={selectedIds.length === 0}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 rounded-xl font-bold text-xs border transition-all ${
              selectedIds.length >= 1 
                ? 'bg-white border-[#4db6ac] text-[#4db6ac] hover:bg-teal-50 shadow-sm' 
                : 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Quadrant</span>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${selectedIds.length >= 1 ? 'bg-[#4db6ac] text-white' : 'bg-gray-200 text-white'}`}>
              {selectedIds.length}
            </span>
          </button>
          
          <button 
            onClick={handleExport}
            disabled={isExporting || evaluations.length === 0}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 bg-white border border-gray-100 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-50 transition-all shadow-sm ${isExporting || evaluations.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export'}</span>
          </button>

          <Link to="/evaluate" className="w-full sm:w-auto bg-[#9d7bb0] text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#8b6aa1] transition-all shadow-lg shadow-purple-100 text-xs text-white">
            <Plus className="w-4 h-4 text-white" />
            <span className="text-white">New Evaluation</span>
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {/* Table Header - Improved proportions */}
        <div className="hidden lg:grid grid-cols-[48px_minmax(200px,2.5fr)_minmax(180px,1.5fr)_minmax(130px,1.2fr)_minmax(130px,1.2fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(100px,0.8fr)_48px] gap-4 px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
          <div className="flex items-center">
             <input 
               type="checkbox" 
               className="w-4 h-4 rounded border-gray-200 text-[#9d7bb0] focus:ring-[#9d7bb0] cursor-pointer" 
               checked={currentItems.length > 0 && selectedIds.length === currentItems.length}
               onChange={toggleSelectAll}
             />
          </div>
          
          <div className="relative group">
            <button 
              onClick={() => setActiveSortMenu(activeSortMenu === 'name' ? null : 'name')}
              className="flex items-center gap-2 hover:text-gray-600 transition-colors whitespace-nowrap"
            >
              PROCESS NAME
              <ArrowUpDown className={`w-3 h-3 ${sortField === 'processName' ? 'text-[#9d7bb0]' : ''}`} />
            </button>
            {activeSortMenu === 'name' && (
              <div ref={sortMenuRef} className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50">
                <button onClick={() => handleSort('processName', 'asc')} className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  <ArrowUp className="w-3.5 h-3.5 text-gray-400" /> Sort Ascending
                </button>
                <button onClick={() => handleSort('processName', 'desc')} className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  <ArrowDown className="w-3.5 h-3.5 text-gray-400" /> Sort Descending
                </button>
                <div className="h-px bg-gray-100 my-2"></div>
                <div className="relative p-2">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search.." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold placeholder:text-gray-300 focus:outline-none focus:border-[#9d7bb0] focus:bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button 
              onClick={() => setActiveSortMenu(activeSortMenu === 'date' ? null : 'date')}
              className={`flex items-center gap-2 hover:text-gray-600 transition-colors whitespace-nowrap ${(startDate || endDate) ? 'text-[#9d7bb0]' : ''}`}
            >
              CREATED ON
              {(startDate || endDate) ? <Filter className="w-3 h-3" /> : <ArrowUpDown className={`w-3 h-3 ${sortField === 'createdAt' ? 'text-[#9d7bb0]' : ''}`} />}
            </button>
            {activeSortMenu === 'date' && (
              <div ref={sortMenuRef} className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50">
                <button onClick={() => handleSort('createdAt', 'asc')} className="w-full flex items-center gap-3 px-3 py-1.5 text-[10px] font-bold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  <ArrowUp className="w-3.5 h-3.5 text-gray-400" /> Sort Ascending
                </button>
                <button onClick={() => handleSort('createdAt', 'desc')} className="w-full flex items-center gap-3 px-3 py-1.5 text-[10px] font-bold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  <ArrowDown className="w-3.5 h-3.5 text-gray-400" /> Sort Descending
                </button>
                <div className="h-px bg-gray-100 my-3"></div>
                <div className="space-y-3">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Filter by date</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-gray-400 ml-1">START DATE</label>
                      <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[9px] font-bold text-gray-600 focus:outline-none focus:border-[#9d7bb0]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-gray-400 ml-1">END DATE</label>
                      <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[9px] font-bold text-gray-600 focus:outline-none focus:border-[#9d7bb0]"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    className="w-full py-2 bg-gray-50 text-[9px] font-bold text-gray-400 hover:text-gray-600 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-3 h-3" /> Reset Dates
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="whitespace-nowrap">AUTOMATION SCORE</div>
          <div className="whitespace-nowrap">FEASIBILITY SCORE</div>
          <div className="whitespace-nowrap">FIT TYPE</div>
          <div className="whitespace-nowrap">LLM TYPE</div>
          <div className="text-right whitespace-nowrap">STATUS</div>
          <div></div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
             <div className="w-10 h-10 border-4 border-[#9d7bb0]/20 border-t-[#9d7bb0] rounded-full animate-spin"></div>
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Retrieving Roadmap...</p>
          </div>
        ) : currentProcessedEvaluations.length === 0 ? (
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
                  <div className="hidden lg:grid grid-cols-[48px_minmax(200px,2.5fr)_minmax(180px,1.5fr)_minmax(130px,1.2fr)_minmax(130px,1.2fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(100px,0.8fr)_48px] gap-4 px-6 py-5 items-center">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleSelect(item._id)}
                        className="w-4 h-4 rounded border-gray-200 text-[#9d7bb0] focus:ring-[#9d7bb0]" 
                      />
                    </div>
                    <div className="flex items-center gap-3 min-w-0">
                      <button 
                        onClick={(e) => toggleShortlist(item._id, e)}
                        className={`shrink-0 transition-all ${isShortlisted ? 'text-amber-400 scale-110' : 'text-gray-200 hover:text-gray-300'}`}
                      >
                        <Star className="w-5 h-5" fill={isShortlisted ? "currentColor" : "none"} strokeWidth={isShortlisted ? 0 : 2} />
                      </button>
                      <Link 
                        to={status.toLowerCase() === 'draft' ? `/evaluate?id=${item._id}` : `/results/${item._id}`} 
                        className="font-bold text-[#9d7bb0] text-sm hover:underline block truncate"
                        title={item.discovery?.processName}
                      >
                        {item.discovery?.processName || 'Untitled Process'}
                      </Link>
                    </div>
                    <div className="text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed whitespace-nowrap">
                      {format(new Date(item.createdAt), 'dd/MM/yyyy, hh:mm a')}
                    </div>
                    
                    <div className="flex items-center gap-2 whitespace-nowrap">
                       <div className={`w-2.5 h-2.5 rounded-full ${getScoreColor(automation)}`}></div>
                       <span className="text-sm font-bold text-gray-700">{automation ? `${automation}%` : '-'}</span>
                    </div>

                    <div className="flex items-center gap-2 whitespace-nowrap">
                       <div className={`w-2.5 h-2.5 rounded-full ${getScoreColor(feasibility)}`}></div>
                       <span className="text-sm font-bold text-gray-700">{feasibility ? `${feasibility}%` : '-'}</span>
                    </div>

                    <div className="min-w-0">
                      <span className="inline-block px-3 py-1 bg-gray-50 text-gray-400 border border-gray-100 rounded-lg text-[10px] font-bold uppercase tracking-wide truncate max-w-full">
                        {fitment || '-'}
                      </span>
                    </div>
                    
                    <div className="min-w-0">
                      <span className="inline-block px-3 py-1 bg-gray-50 text-gray-400 border border-gray-100 rounded-lg text-[10px] font-bold uppercase tracking-wide truncate max-w-full">
                        {formattedLLMType}
                      </span>
                    </div>

                    <div className="text-right">
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
                        <Trash2 className="w-4 h-4" />
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
                          className="w-5 h-5 rounded border-gray-200 text-[#9d7bb0] focus:ring-[#9d7bb0] shadow-sm" 
                        />
                        <button 
                          onClick={(e) => toggleShortlist(item._id, e)}
                          className={`shrink-0 transition-all ${isShortlisted ? 'text-amber-400' : 'text-gray-200'}`}
                        >
                          <Star className="w-5 h-5" fill={isShortlisted ? "currentColor" : "none"} strokeWidth={isShortlisted ? 0 : 2} />
                        </button>
                        <Link 
                          to={status.toLowerCase() === 'draft' ? `/evaluate?id=${item._id}` : `/results/${item._id}`} 
                          className="font-black text-[#9d7bb0] text-base hover:underline line-clamp-2"
                        >
                          {item.discovery?.processName || 'Untitled Process'}
                        </Link>
                      </div>
                      <span className={`shrink-0 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                        status.toLowerCase() === 'completed' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm' 
                          : 'bg-amber-50 text-amber-600 border-amber-100 shadow-sm'
                      }`}>
                        {status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Automation</p>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full shadow-sm ${getScoreColor(automation)}`}></div>
                          <span className="text-sm font-bold text-gray-700 tabular-nums">{automation ? `${automation}%` : '-'}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Feasibility</p>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full shadow-sm ${getScoreColor(feasibility)}`}></div>
                          <span className="text-sm font-bold text-gray-700 tabular-nums">{feasibility ? `${feasibility}%` : '-'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="px-2 py-1 bg-gray-50 text-gray-400 border border-gray-100 rounded-lg text-[10px] font-bold uppercase tracking-wide">
                        {fitment || '-'}
                      </span>
                      <span className="px-2 py-1 bg-gray-50 text-gray-400 border border-gray-100 rounded-lg text-[10px] font-bold uppercase tracking-wide">
                        {formattedLLMType}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider tabular-nums">
                          {format(new Date(item.createdAt), 'dd MMM yyyy')}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeleteConfirm(item._id);
                          }}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <Link 
                        to={status.toLowerCase() === 'draft' ? `/evaluate?id=${item._id}` : `/results/${item._id}`}
                        className="text-[10px] font-black text-[#9d7bb0] uppercase tracking-widest flex items-center gap-1.5 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100"
                      >
                        Details
                        <ChevronRight className="w-3.5 h-3.5" />
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
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 px-6 py-8 bg-white/50 backdrop-blur-sm rounded-[32px] border border-gray-100 mt-12">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-12 w-full md:w-auto">
           <div className="flex items-center gap-4">
             <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">ROWS PER PAGE</span>
             <div className="relative group">
               <select 
                 value={rowsPerPage} 
                 onChange={handleRowsPerPageChange}
                 className="appearance-none bg-white px-4 py-2 pr-10 rounded-xl border border-[#9d7bb0] text-sm font-bold text-gray-700 shadow-sm cursor-pointer outline-none focus:ring-2 focus:ring-[#9d7bb0]/20 transition-all min-w-[80px]"
               >
                 {[10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75].map(val => (
                   <option key={val} value={val}>{val}</option>
                 ))}
               </select>
               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#9d7bb0]">
                 <ChevronDown className="w-4 h-4" />
               </div>
             </div>
           </div>

           <div className="flex-1 md:flex-none flex justify-center md:justify-start">
             <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest tabular-nums whitespace-nowrap">
               {currentProcessedEvaluations.length === 0 ? '0-0' : `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, currentProcessedEvaluations.length)}`} OF {currentProcessedEvaluations.length}
             </span>
           </div>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-1.5 gap-1">
             <button 
               onClick={goToFirstPage}
               disabled={currentPage === 1}
               className="p-2 hover:bg-gray-50 text-gray-400 disabled:opacity-20 transition-colors rounded-lg"
               title="First Page"
             >
               <ChevronsLeft className="w-4 h-4" />
             </button>
             <button 
               onClick={goToPrevPage}
               disabled={currentPage === 1}
               className="p-2 hover:bg-gray-50 text-gray-400 disabled:opacity-20 transition-colors rounded-lg"
               title="Previous Page"
             >
               <ChevronLeft className="w-4 h-4" />
             </button>
             
             <div className="flex items-center px-5 border-x border-gray-100">
                <span className="text-xs font-bold text-gray-900 tabular-nums">{currentPage}</span>
                <span className="text-gray-300 mx-2 text-xs">/</span>
                <span className="text-xs font-bold text-gray-400 tabular-nums">{totalPages || 1}</span>
             </div>

             <button 
               onClick={goToNextPage}
               disabled={currentPage === totalPages || totalPages === 0}
               className="p-2 hover:bg-gray-50 text-gray-400 disabled:opacity-20 transition-colors rounded-lg"
               title="Next Page"
             >
               <ChevronRight className="w-4 h-4" />
             </button>
             <button 
               onClick={goToLastPage}
               disabled={currentPage === totalPages || totalPages === 0}
               className="p-2 hover:bg-gray-50 text-gray-400 disabled:opacity-20 transition-colors rounded-lg"
               title="Last Page"
             >
               <ChevronsRight className="w-4 h-4" />
             </button>
           </div>
        </div>
      </div>

      {deleteConfirm && createPortal(
        <div className="fixed inset-0 bg-white/40 backdrop-blur-md z-[9999] flex items-center justify-center p-4 md:p-6">
          <div className="bg-white rounded-[32px] md:rounded-[50px] p-8 md:p-16 max-w-xl w-full shadow-2xl space-y-8 md:space-y-10 border border-white/20 animate-scaleUp">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-red-50 text-red-500 rounded-2xl md:rounded-[30px] flex items-center justify-center mx-auto border border-red-100 shadow-inner">
              <Trash2 className="w-8 h-8 md:w-12 md:h-12" />
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

// Add missing icon for selector
const ChevronDown: React.FC<{className?: string}> = ({className}) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
  </svg>
);

export default Evaluations;
