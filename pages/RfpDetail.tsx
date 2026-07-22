import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  FileText, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Loader2, 
  Building, 
  Globe, 
  Percent 
} from 'lucide-react';
import toast from 'react-hot-toast';

const BASE_URL = 'https://avagama-backend-ckm9.onrender.com/api';

interface UsecaseDetails {
  id?: string;
  usecaseId?: string;
  title: string;
  description: string;
  company: string;
  industry: string;
  score: number | string | null;
  status: string;
}

const RfpDetail: React.FC = () => {
  const { usecaseId } = useParams<{ usecaseId: string }>();
  const navigate = useNavigate();

  // Load and initialization state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // resolved RFP ID from step 1
  const [rfpId, setRfpId] = useState<string | null>(null);
  const [usecaseData, setUsecaseData] = useState<UsecaseDetails | null>(null);

  // Generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationSuccess, setGenerationSuccess] = useState(false);
  const [generationStatusText, setGenerationStatusText] = useState('');

  // 1. Fetch or Create RFP on Load
  const checkOrCreateRfp = async () => {
    if (!usecaseId) {
      setError('Usecase ID is missing from the URL route.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setGenerationError(null);
    
    try {
      const token = sessionStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      // 1a. Fetch shortlisted usecases to enrich details
      let matchedUsecase: any = null;
      try {
        const shortlistResponse = await fetch(`https://avagama-backend-ckm9.onrender.com/api/rfp/shortlisted-usecases`, {
          method: 'GET',
          headers
        });
        if (shortlistResponse.ok) {
          const shortlistData = await shortlistResponse.json();
          const items = Array.isArray(shortlistData) 
            ? shortlistData 
            : (shortlistData?.data && Array.isArray(shortlistData.data)) 
              ? shortlistData.data 
              : [];
          
          matchedUsecase = items.find((item: any) => {
            const itemUsecaseId = item.usecaseId || item._id || item.id;
            return String(itemUsecaseId) === String(usecaseId);
          });
        }
      } catch (err) {
        console.error('Failed to fetch shortlisted usecases for detail page:', err);
      }

      // 1b. Call GET /api/rfp/from-usecase/:usecaseId to check if an RFP already exists
      let response = await fetch(`${BASE_URL}/rfp/from-usecase/${usecaseId}`, {
        method: 'GET',
        headers
      });

      let rfpRecord: any = null;
      let alreadyExists = false;

      if (response.ok) {
        const data = await response.json();
        const record = data?.rfp || data?.data || data;
        const resolvedId = record?._id || record?.id;
        
        if (resolvedId) {
          rfpRecord = record;
          alreadyExists = true;
        }
      }

      // If no RFP exists yet (either non-ok response or missing ID), create it
      if (!alreadyExists) {
        const payload = {
          usecaseId,
          type: matchedUsecase?.type || matchedUsecase?.source || 'domain',
          entityId: matchedUsecase?.entityId || matchedUsecase?.documentId || matchedUsecase?._id || matchedUsecase?.id || usecaseId
        };

        const createResponse = await fetch(`${BASE_URL}/rfp/from-usecase`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });

        if (!createResponse.ok) {
          const errBody = await createResponse.text().catch(() => '');
          throw new Error(`Failed to initialize RFP container from usecase: ${createResponse.status} ${errBody}`);
        }

        const data = await createResponse.json();
        const record = data?.rfp || data?.data || data;
        const resolvedId = record?._id || record?.id;
        
        if (!resolvedId) {
          throw new Error('RFP initialized but the server returned no record ID.');
        }

        rfpRecord = record;
      }

      // Populate states with resolved RFP record
      const finalRfpId = rfpRecord?._id || rfpRecord?.id;
      setRfpId(finalRfpId);

      // Extract usecase details nested inside the RFP or direct properties
      const nestedUsecase = rfpRecord?.usecase || rfpRecord?.usecaseData || matchedUsecase || rfpRecord;
      
      let rawTitle = matchedUsecase?.title || nestedUsecase?.title || 'Untitled Use Case';
      let title = rawTitle;
      if (!title.toUpperCase().startsWith('RFP -')) {
        title = `RFP - ${title}`;
      }
      title = title.toUpperCase();

      const description = matchedUsecase?.description || nestedUsecase?.description || 'No description provided for this use case.';
      const company = (matchedUsecase?.company_name || matchedUsecase?.company || nestedUsecase?.company_name || nestedUsecase?.company || 'NOT SPECIFIED').toUpperCase();
      const industry = (matchedUsecase?.industry || matchedUsecase?.domain || nestedUsecase?.industry || nestedUsecase?.domain || 'NOT SPECIFIED').toUpperCase();
      const score = matchedUsecase?.totalWeightedScore !== undefined 
        ? matchedUsecase.totalWeightedScore 
        : (matchedUsecase?.weighted_score !== undefined 
            ? matchedUsecase.weighted_score 
            : (nestedUsecase?.totalWeightedScore !== undefined 
                ? nestedUsecase.totalWeightedScore 
                : (nestedUsecase?.weighted_score !== undefined ? nestedUsecase.weighted_score : nestedUsecase?.score)));

      setUsecaseData({
        id: usecaseId,
        title,
        description,
        company,
        industry,
        score: score !== undefined && score !== null ? score : null,
        status: (rfpRecord?.status || 'draft').toUpperCase()
      });

      // If document status is already generated/completed, show download options directly
      if (rfpRecord?.status === 'generated' || rfpRecord?.status === 'completed') {
        setGenerationSuccess(true);
      }

    } catch (err: any) {
      console.error('Error resolving RFP state:', err);
      setError(err.message || 'An unexpected error occurred during RFP retrieval.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkOrCreateRfp();
  }, [usecaseId]);

  // 2. Trigger Mistral RFP Generation Agent
  const handleCreateRfp = async () => {
    if (!rfpId) {
      toast.error('Unable to generate: No RFP ID has been resolved yet.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setGenerationSuccess(false);
    setGenerationStatusText('Initializing Mistral generation pipeline...');

    const statuses = [
      'Establishing contact with Mistral RFP agent...',
      'Analyzing business process boundaries...',
      'Mapping technical design metrics...',
      'Drafting executive summary and requirements...',
      'Structuring evaluation standards and SLAs...',
      'Formatting deliverables & .docx packaging...'
    ];

    let statusIndex = 0;
    const interval = setInterval(() => {
      if (statusIndex < statuses.length - 1) {
        statusIndex++;
        setGenerationStatusText(statuses[statusIndex]);
      }
    }, 8000);

    try {
      const token = sessionStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      // 1. Get the GET /api/rfp/:id key
      const getResponse = await fetch(`${BASE_URL}/rfp/${rfpId}`, {
        method: 'GET',
        headers
      });

      if (!getResponse.ok) {
        const errText = await getResponse.text().catch(() => '');
        throw new Error(errText || `Failed to fetch RFP key with status ${getResponse.status}`);
      }

      const getResponseData = await getResponse.json();
      const rfpRecord = getResponseData?.rfp || getResponseData?.data || getResponseData;
      const resolvedId = rfpRecord?._id || rfpRecord?.id || rfpId;

      // 2. Pass it to the POST /api/rfp/:id/generate
      const response = await fetch(`${BASE_URL}/rfp/${resolvedId}/generate`, {
        method: 'POST',
        headers
      });

      clearInterval(interval);

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(errText || `Server returned status ${response.status}`);
      }

      setGenerationSuccess(true);
      setUsecaseData(prev => prev ? { ...prev, status: 'GENERATED' } : null);
      toast.success('RFP Document created successfully!');
    } catch (err: any) {
      console.error('Error in generation step:', err);
      setGenerationError(err.message || 'RFP generation pipeline failed to execute.');
      toast.error('RFP document compilation interrupted.');
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
      setGenerationStatusText('');
    }
  };

  // 3. Document download handlers
  const handleDownloadFile = async (format: 'docx' | 'pdf') => {
    if (!rfpId) return;

    const toastId = toast.loading(`Preparing ${format.toUpperCase()} download...`);
    try {
      const token = sessionStorage.getItem('token');
      const headers = {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const response = await fetch(`${BASE_URL}/rfp/${rfpId}/download/${format}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Download endpoint returned status ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;

      // Clean filename
      let filename = `${usecaseData?.title || 'rfp-document'}.${format}`.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const disposition = response.headers.get('Content-Disposition');
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`${format.toUpperCase()} downloaded successfully!`, { id: toastId });
    } catch (err: any) {
      console.error('Download error:', err);
      toast.error(`Failed to download ${format.toUpperCase()} file: ${err.message}`, { id: toastId });
    }
  };

  return (
    <div className="bg-[#fafafc] min-h-screen pb-24" id="rfp-detail-page-container">
      {/* Upper Navigation Banner */}
      <div className="bg-white border-b border-slate-100 py-6" id="rfp-detail-header-banner">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/admin/orchestration', { state: { selectedMenu: 'proposal-forge' } })}
            className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            id="rfp-detail-back-button"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to RFP creation
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest bg-slate-50 border border-slate-150 px-3 py-1 rounded-md">
              RFP ID: {rfpId || 'Resolving...'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-10">
        {loading ? (
          <div className="bg-white border border-slate-100 rounded-[32px] p-20 text-center space-y-6 shadow-sm" id="rfp-detail-loading-state">
            <Loader2 className="w-12 h-12 text-[#a26da8] animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-850 uppercase tracking-widest">Resolving RFP Authorization State</h3>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-tight">Accessing shortlisted process ledger templates</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white border border-slate-100 rounded-[32px] p-16 text-center max-w-2xl mx-auto space-y-6 shadow-sm" id="rfp-detail-error-state">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto border border-rose-100">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-black text-rose-800 uppercase tracking-widest">Resolution Failed</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                {error}
              </p>
            </div>
            <div className="pt-4 flex justify-center gap-4">
              <button
                onClick={checkOrCreateRfp}
                className="px-6 py-3 bg-slate-950 hover:bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl transition cursor-pointer"
              >
                Retry Load
              </button>
              <button
                onClick={() => navigate('/admin/orchestration', { state: { selectedMenu: 'proposal-forge' } })}
                className="px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-black uppercase tracking-widest rounded-xl transition cursor-pointer"
              >
                Back to RFP creation
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto bg-white border border-slate-150 rounded-[32px] p-8 md:p-10 shadow-sm space-y-8" id="usecase-details-panel">
            <div className="space-y-2 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-2 text-[#a26da8]">
                <FileText className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] font-mono">Process Scope Specifications</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">
                {usecaseData?.title}
              </h2>
            </div>

            {/* Descriptions & Parameters */}
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono block">Functional Objective Description</span>
                <div className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50/50 p-5 rounded-2xl border border-slate-100/50">
                  {usecaseData?.description}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-100 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Building className="w-4 h-4" />
                    <span className="text-[9px] font-black uppercase tracking-widest font-mono">ENTITY/COMPANY</span>
                  </div>
                  <span className="text-sm font-black text-slate-800 uppercase tracking-tight block">
                    {usecaseData?.company}
                  </span>
                </div>

                <div className="border border-slate-100 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Globe className="w-4 h-4" />
                    <span className="text-[9px] font-black uppercase tracking-widest font-mono">INDUSTRY/DOMAIN</span>
                  </div>
                  <span className="text-sm font-black text-slate-800 uppercase tracking-tight block">
                    {usecaseData?.industry}
                  </span>
                </div>

                {usecaseData?.score !== undefined && usecaseData?.score !== null && (
                  <div className="border border-slate-100 rounded-2xl p-5 space-y-2">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Percent className="w-4 h-4" />
                      <span className="text-[9px] font-black uppercase tracking-widest font-mono">PRIORITY SCORE</span>
                    </div>
                    <span className="text-sm font-black text-[#6fcbbd] block">
                      {Number(usecaseData.score).toFixed(2)} / 10.00
                    </span>
                  </div>
                )}

                <div className="border border-slate-100 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest font-mono">SYNC STATUS</span>
                  </div>
                  <span className="text-sm font-black text-slate-700 uppercase tracking-tight block">
                    {usecaseData?.status || 'DRAFT'}
                  </span>
                </div>
              </div>

              {/* Actions Area - placed at the bottom of the section shown in the screenshot */}
              <div className="pt-6 border-t border-slate-100 space-y-4" id="rfp-generation-controls-panel">
                {isGenerating ? (
                  <div className="py-6 text-center space-y-4" id="generation-spinner-state">
                    <Loader2 className="w-10 h-10 text-[#a26da8] animate-spin mx-auto" />
                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-700 animate-pulse">Mistral Agent Working</p>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight max-w-[280px] mx-auto leading-relaxed">
                        {generationStatusText}
                      </p>
                    </div>
                  </div>
                ) : generationError ? (
                  <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl text-center space-y-3" id="generation-failed-state">
                    <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
                    <h4 className="text-xs font-black text-rose-800 uppercase tracking-widest">Generation Failed</h4>
                    <p className="text-[10px] text-rose-650 leading-relaxed font-semibold max-w-[280px] mx-auto">
                      {generationError}
                    </p>
                    <button
                      onClick={handleCreateRfp}
                      className="mt-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition cursor-pointer"
                    >
                      Retry Generation
                    </button>
                  </div>
                ) : generationSuccess ? (
                  <div className="space-y-6">
                    <div className="py-2 text-center space-y-2" id="generation-completed-state">
                      <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Proposal Document Ready</h4>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">
                          Mistral RFP compilation finished. Access the document assets below.
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="rfp-download-buttons">
                      <button
                        onClick={() => handleDownloadFile('docx')}
                        className="w-full py-4 bg-slate-950 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm border border-slate-200"
                        id="download-docx-button"
                      >
                        <Download className="w-3.5 h-3.5 text-[#6fcbbd]" />
                        <span>Download .docx</span>
                      </button>
                      <button
                        onClick={() => handleDownloadFile('pdf')}
                        className="w-full py-4 bg-white hover:bg-slate-50 text-slate-800 text-[10px] font-black uppercase tracking-widest rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer border border-slate-200 shadow-sm"
                        id="download-pdf-button"
                      >
                        <Download className="w-3.5 h-3.5 text-[#a26da8]" />
                        <span>Download .pdf</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleCreateRfp}
                    disabled={isGenerating}
                    className="w-full py-4.5 bg-slate-950 hover:bg-black disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    id="create-rfp-button"
                  >
                    <Sparkles className="w-4 h-4 text-[#6fcbbd] fill-current" />
                    <span>Create RFP</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RfpDetail;
