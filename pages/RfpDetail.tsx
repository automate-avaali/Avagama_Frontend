import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload
} from 'lucide-react';
import toast from '../components/studio/notify';
import { Button, Callout, EmptyState, Field, IconButton, Input, KeyValue, Modal, PageHeader, Spinner, StudioTheme, Tag, cx, useFillHeight } from '../components/studio/ui';
import { Elapsed, IndeterminateBar, RfpStatusTag, ScoreBar, sourceLabel } from './Admin/orchestration/rfpUi';
import rfpSessionCache from '../services/rfpSessionCache';
import { RFP_API_BASE } from '../services/api';

const BASE_URL = RFP_API_BASE;

interface UsecaseDetails {
  id?: string;
  usecaseId?: string;
  title: string;
  description: string;
  company: string;
  industry: string;
  score: number | string | null;
  status: string;
  displayTitle?: string;
  displayCompany?: string;
  displayIndustry?: string;
  source?: string;
}

const RfpDetail: React.FC = () => {
  const { usecaseId } = useParams<{ usecaseId: string }>();
  const navigate = useNavigate();
  const fillHeight = useFillHeight();

  // Load and initialization state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // resolved RFP ID from step 1
  const [rfpId, setRfpId] = useState<string | null>(null);
  const [usecaseData, setUsecaseData] = useState<UsecaseDetails | null>(null);

  // Entity/Company field (sourced from account's Company Name, editable, mandatory)
  const [entityCompany, setEntityCompany] = useState('');

  // Optional RFP template upload
  const [templateInfo, setTemplateInfo] = useState<{ filename: string; mimetype?: string; uploadedAt?: string } | null>(null);
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);
  const [templateUploadError, setTemplateUploadError] = useState<string | null>(null);
  const [isDeletingTemplate, setIsDeletingTemplate] = useState(false);
  const [showDeleteTemplateConfirm, setShowDeleteTemplateConfirm] = useState(false);

  // Generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<{ code: string; requestId?: string } | null>(null);
  const [generationSuccess, setGenerationSuccess] = useState(false);
  const [generationStatusText, setGenerationStatusText] = useState('');

  // Deletion states
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Download preparation state
  const [downloadingFormat, setDownloadingFormat] = useState<'docx' | 'pdf' | null>(null);

  // Body for POST /rfp/from-usecase, prepared on load; the RFP itself is created on the first explicit action.
  const createPayloadRef = useRef<any>(null);

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
        const shortlistResponse = await fetch(`${BASE_URL}/rfp/shortlisted-usecases`, {
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

      // No RFP yet: viewing the page does not create one (backend contract F.8). It is created on the
      // first explicit action — uploading a template or clicking Create RFP — via ensureRfpId().
      createPayloadRef.current = {
        usecaseId,
        type: matchedUsecase?.type || matchedUsecase?.source || 'domain',
        entityId: matchedUsecase?.entityId || matchedUsecase?.documentId || matchedUsecase?._id || matchedUsecase?.id || usecaseId
      };
      if (alreadyExists) createPayloadRef.current = null;

      // Populate states with resolved RFP record
      const finalRfpId = rfpRecord?._id || rfpRecord?.id;
      setRfpId(finalRfpId || null);

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
        status: (rfpRecord ? (rfpRecord.status || 'draft') : 'not_created').toUpperCase(),
        displayTitle: String(rawTitle).replace(/^RFP\s*-\s*/i, '').trim() || 'Untitled use case',
        displayCompany: matchedUsecase?.company_name || matchedUsecase?.company || nestedUsecase?.company_name || nestedUsecase?.company || '',
        displayIndustry: matchedUsecase?.industry || matchedUsecase?.domain || nestedUsecase?.industry || nestedUsecase?.domain || '',
        source: matchedUsecase?.type || matchedUsecase?.source || ''
      });

      // Entity/Company must reflect the Company Name provided at account creation,
      // unless the user has manually overridden it for this RFP
      let accountCompanyName = '';
      try {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          accountCompanyName = parsedUser?.organization?.name || '';
        }
      } catch (e) {
        console.error('Failed to parse account company name from session', e);
      }

      let manualEntityCompany = '';
      try {
        manualEntityCompany = localStorage.getItem(`rfp-entity-company-${usecaseId}`) || '';
      } catch (e) {
        console.error('Failed to read saved entity/company override', e);
      }

      setEntityCompany(manualEntityCompany || accountCompanyName || (company !== 'NOT SPECIFIED' ? company : ''));

      // Reflect any template already stored on the RFP record
      setTemplateInfo(rfpRecord?.template || null);

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

  // Returns the RFP id, creating the RFP first if it does not exist yet (POST is idempotent per use case).
  const ensureRfpId = async (): Promise<string> => {
    if (rfpId) return rfpId;
    const token = sessionStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/rfp/from-usecase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(createPayloadRef.current || { usecaseId, type: 'domain', entityId: usecaseId })
    });
    if (!response.ok) {
      const rawBody = await response.text().catch(() => '');
      console.error('RFP create failed:', response.status, rawBody);
      const err: any = new Error('Could not prepare the RFP for this use case. Please try again.');
      err.status = response.status;
      throw err;
    }
    const data = await response.json();
    const record = data?.rfp || data?.data || data;
    const id = record?._id || record?.id;
    if (!id) throw new Error('Could not prepare the RFP for this use case. Please try again.');
    setRfpId(id);
    setUsecaseData(prev => prev ? { ...prev, status: String(record?.status || 'draft').toUpperCase() } : prev);
    return id;
  };

  // 2. Trigger RFP Generation
  // Error copy shown for the RFP generation failure state — never the raw
  // response body. Unknown/missing codes fall back to GENERATION_FAILED's copy.
  const RFP_GENERATION_ERROR_COPY: Record<string, { heading: string; message: string }> = {
    UPSTREAM_UNAVAILABLE: {
      heading: 'Generation unavailable',
      message: "We're unable to generate your RFP right now. Please try again in a few moments.",
    },
    GENERATION_FAILED: {
      heading: 'Generation failed',
      message: 'Something went wrong while generating the RFP. Please try again.',
    },
  };
  const DEFAULT_GENERATION_ERROR_COPY = RFP_GENERATION_ERROR_COPY.GENERATION_FAILED;

  // Classifies a caught error into { code, requestId }. Prefers a sanitized
  // code/requestId already on the error (in case the backend starts sending
  // one), otherwise maps by HTTP status / network failure. Never touches
  // err.message for display — that's the raw body, and it must never reach
  // the UI verbatim.
  const getGenerationErrorInfo = (err: any): { code: string; requestId?: string } => {
    if (err && typeof err.code === 'string') {
      return { code: err.code, requestId: typeof err.requestId === 'string' ? err.requestId : undefined };
    }
    const status = err?.status;
    if (typeof status === 'number' && status >= 500) return { code: 'UPSTREAM_UNAVAILABLE' };
    if (!status && (err instanceof TypeError || !navigator.onLine)) return { code: 'UPSTREAM_UNAVAILABLE' };
    return { code: 'GENERATION_FAILED' };
  };

  const handleCreateRfp = async () => {
    if (!entityCompany.trim()) {
      toast.error('Entity/Company is required to generate the RFP document.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setGenerationSuccess(false);
    setGenerationStatusText('Initializing RFP generation pipeline...');

    const statuses = [
      'Establishing connection with the RFP generation service...',
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

      // 0. Create the RFP on this explicit action if it does not exist yet
      const currentId = await ensureRfpId();

      // 1. Get the GET /api/rfp/:id key
      const getResponse = await fetch(`${BASE_URL}/rfp/${currentId}`, {
        method: 'GET',
        headers
      });

      if (!getResponse.ok) {
        const statusErr: any = new Error(`Failed to fetch RFP key with status ${getResponse.status}`);
        statusErr.status = getResponse.status;
        throw statusErr;
      }

      const getResponseData = await getResponse.json();
      const rfpRecord = getResponseData?.rfp || getResponseData?.data || getResponseData;
      const resolvedId = rfpRecord?._id || rfpRecord?.id || currentId;

      // 2. Pass it to the POST /api/rfp/:id/generate
      const response = await fetch(`${BASE_URL}/rfp/${resolvedId}/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ organizationName: entityCompany.trim() })
      });

      clearInterval(interval);

      if (!response.ok) {
        const rawBody = await response.clone().text().catch(() => '');
        const statusErr: any = new Error(`RFP generation request failed with status ${response.status}`);
        statusErr.status = response.status;
        statusErr.rawBody = rawBody;
        // If the backend ever sends a sanitized { code, requestId } shape,
        // pick it up — but this never becomes the displayed message.
        try {
          const parsed = JSON.parse(rawBody);
          if (parsed && typeof parsed === 'object') {
            if (typeof parsed.code === 'string') statusErr.code = parsed.code;
            if (typeof parsed.requestId === 'string') statusErr.requestId = parsed.requestId;
          }
        } catch {
          // Not JSON — status-based mapping still applies.
        }
        throw statusErr;
      }

      setGenerationSuccess(true);
      setUsecaseData(prev => prev ? { ...prev, status: 'GENERATED' } : null);

      // Patch just this use case in the RFP Creation page's cached list, so it
      // shows as generated on return without the whole list being re-fetched.
      if (usecaseId) {
        rfpSessionCache.updateOne(usecaseId, {
          rfpId,
          rfpStatus: 'generated',
          rfpGenerated: true,
          company_name: entityCompany.trim(),
        });
      }

      toast.success('RFP Document created successfully!');
    } catch (err: any) {
      // Full upstream body (when we have it) stays in the console only.
      console.error('Error in generation step:', err?.rawBody || err);
      setGenerationError(getGenerationErrorInfo(err));
      toast.error('RFP document compilation interrupted.');
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
      setGenerationStatusText('');
    }
  };

  // Upload (or replace) the optional RFP template
  const MAX_TEMPLATE_SIZE_BYTES = 15 * 1024 * 1024;

  const handleTemplateFileSelect = async (file: File | null) => {
    if (!file) return;
    setTemplateUploadError(null);

    const lowerName = file.name.toLowerCase();
    const hasValidExtension = lowerName.endsWith('.docx');
    if (!hasValidExtension) {
      const message = 'Only .docx files are supported.';
      setTemplateUploadError(message);
      toast.error(message);
      return;
    }

    if (file.size > MAX_TEMPLATE_SIZE_BYTES) {
      const message = 'File exceeds the 15 MB size limit.';
      setTemplateUploadError(message);
      toast.error(message);
      return;
    }

    setIsUploadingTemplate(true);
    try {
      const currentId = await ensureRfpId();
      const token = sessionStorage.getItem('token');
      const formData = new FormData();
      formData.append('template', file);

      const response = await fetch(`${BASE_URL}/rfp/${currentId}/template`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || `Template upload failed with status ${response.status}`);
      }

      setTemplateInfo(data?.template || null);
    } catch (err: any) {
      console.error('Template upload error:', err);
      const message = err.message || 'Failed to upload the RFP template.';
      setTemplateUploadError(message);
      toast.error(message);
    } finally {
      setIsUploadingTemplate(false);
    }
  };

  // Delete the uploaded RFP template
  const handleDeleteTemplate = async () => {
    if (!rfpId) return;

    setIsDeletingTemplate(true);
    try {
      const token = sessionStorage.getItem('token');
      const headers = {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const response = await fetch(`${BASE_URL}/rfp/${rfpId}/template`, {
        method: 'DELETE',
        headers
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || `Failed to delete template with status ${response.status}`);
      }

      setTemplateInfo(null);
      setTemplateUploadError(null);
      setShowDeleteTemplateConfirm(false);
    } catch (err: any) {
      console.error('Template delete error:', err);
      toast.error(err.message || 'Failed to delete the RFP template.');
    } finally {
      setIsDeletingTemplate(false);
    }
  };

  // Maps technical download failures to calm, non-technical copy.
  // Raw details (status, message) stay in console.error only.
  const getDownloadErrorMessage = (err: any): string => {
    const status = err?.status;

    if (status === 500) {
      return "We couldn't generate your document. Please try again in a moment or delete and retry.";
    }
    if (status === 413) {
      return 'This document is too large to generate right now. Try reducing the number of sections.';
    }
    if (status === 400) {
      return 'Some information needed to generate this document is missing. Please review the RFP details and try again.';
    }
    if (!status && (err instanceof TypeError || !navigator.onLine)) {
      return "We couldn't reach the server. Please check your connection and try again.";
    }
    return 'Something went wrong while downloading your document. Please try again.';
  };

  // 3. Document download handlers
  const handleDownloadFile = async (format: 'docx' | 'pdf') => {
    if (!rfpId || downloadingFormat) return;

    setDownloadingFormat(format);
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
        const statusErr: any = new Error(`Download endpoint returned status ${response.status}`);
        statusErr.status = response.status;
        throw statusErr;
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
    } catch (err: any) {
      console.error('Download error:', err);
      const message = getDownloadErrorMessage(err);
      toast.warning(message, { duration: 6000 });
    } finally {
      setDownloadingFormat(null);
    }
  };

  // 4. Delete RFP Document handler
  const handleDeleteRfp = async () => {
    if (!rfpId) {
      toast.error('Failed to delete the RFP document. Please try again.');
      return;
    }

    setIsDeleting(true);
    try {
      const token = sessionStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const response = await fetch(`${BASE_URL}/rfp/${rfpId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      // Reset state upon successful deletion
      setGenerationSuccess(false);
      setUsecaseData(prev => prev ? { ...prev, status: 'DRAFT' } : null);

      // Reset this one cached entry to exactly the shape the list endpoint
      // returns for a use case that has no RFP. Clearing rfpGenerated alone is
      // not enough: the row would keep the rfpId and rfpStatus it was fetched
      // with, and the RFP Creation page treats those as evidence that a
      // document exists — so the button would stay on "View RFP Document"
      // until an explicit refresh re-fetched the list.
      if (usecaseId) {
        rfpSessionCache.updateOne(usecaseId, {
          rfpId: null,
          rfpStatus: 'not_created',
          rfpGenerated: false,
        });
      }

      toast.success('RFP document deleted successfully.');
      setShowDeleteConfirm(false);
      // rfpDeletedUsecaseId tells the RFP Creation page to re-fetch its list on
      // arrival instead of relying on the cache patch above alone — the cache
      // may be missing or expired, and the patch then never reaches the page.
      navigate('/admin/orchestration', {
        state: { selectedMenu: 'proposal-forge', rfpDeletedUsecaseId: usecaseId }
      });
    } catch (err: any) {
      console.error('Delete RFP error:', err);
      toast.error('Failed to delete the RFP document. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const goBack = () => navigate('/admin/orchestration', { state: { selectedMenu: 'proposal-forge' } });
  const locked = generationSuccess || isGenerating;
  const isGeneratedStatus = generationSuccess || /^(GENERATED|COMPLETED)$/.test(usecaseData?.status || '');
  const errorCopy = generationError ? (RFP_GENERATION_ERROR_COPY[generationError.code] || DEFAULT_GENERATION_ERROR_COPY) : null;
  const displayTitle = usecaseData?.displayTitle || usecaseData?.title || 'Untitled use case';
  // Friendly copy for the load failure; the technical detail stays in the console.
  const loadErrorText = !error ? ''
    : /failed to fetch|networkerror/i.test(error) ? "We couldn't reach the server. Check your connection and try again."
    : error === 'Usecase ID is missing from the URL route.' ? 'This link does not include a use case. Open the RFP from the RFP Creation list.'
    : 'Something went wrong while preparing the RFP for this use case. Please try again.';

  return (
    <StudioTheme accent="avagama" className="bg-[#f4f5f7]" style={{ minHeight: fillHeight ?? undefined }}>
      <div className="pb-12" id="rfp-detail-page-container">
        {/* Header bar */}
        <div className="border-b border-slate-200 bg-white" id="rfp-detail-header-banner">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-6">
            <button
              type="button"
              onClick={goBack}
              title="Back to RFP Creation"
              aria-label="Back to RFP Creation"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              id="rfp-detail-back-button"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <nav className="flex min-w-0 items-center gap-1.5 text-[13.5px]" aria-label="Breadcrumb">
              <button type="button" onClick={goBack} className="shrink-0 text-slate-500 hover:text-slate-900">Orchestration</button>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
              <button type="button" onClick={goBack} className="shrink-0 text-slate-500 hover:text-slate-900">RFP Creation</button>
              {!loading && !error && usecaseData && (
                <>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                  <span className="truncate font-semibold text-slate-900">{displayTitle}</span>
                </>
              )}
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-6 pt-6">
          {loading ? (
            <div className="rounded-lg border border-slate-200 bg-white" id="rfp-detail-loading-state">
              <Spinner label="Opening the RFP for this use case…" className="py-20" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-slate-200 bg-white" id="rfp-detail-error-state">
              <EmptyState
                icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
                title="We couldn't open this RFP"
                description={loadErrorText}
                action={(
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button variant="primary" onClick={checkOrCreateRfp} icon={<RefreshCw className="h-4 w-4" />}>Try again</Button>
                    <Button onClick={goBack}>Back to RFP Creation</Button>
                  </div>
                )}
              />
            </div>
          ) : (
            <>
              <PageHeader
                breadcrumb={<span className="inline-flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />RFP document</span>}
                title={displayTitle}
                subtitle="Review the use case, confirm the issuing company and create the RFP document."
                actions={<RfpStatusTag generated={isGeneratedStatus} status={usecaseData?.status} />}
              />

              <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_400px]" id="usecase-details-panel">
                {/* Left: the use case the RFP is written for */}
                <div className="min-w-0 space-y-5">
                  <section className="rounded-lg border border-slate-200 bg-white">
                    <div className="border-b border-slate-200 px-5 py-3">
                      <h2 className="text-[14.5px] font-semibold text-slate-900">Use case</h2>
                    </div>
                    <div className="space-y-5 px-5 py-4">
                      <div>
                        <div className="mb-1 text-[12.5px] font-medium text-slate-500">Objective</div>
                        <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-slate-800">{usecaseData?.description}</p>
                      </div>
                      <KeyValue
                        items={[
                          ['Company', usecaseData?.displayCompany || <span className="text-slate-400">Not specified</span>],
                          ['Industry / domain', usecaseData?.displayIndustry || <span className="text-slate-400">Not specified</span>],
                          ...(usecaseData?.source ? [['Source', sourceLabel(usecaseData.source)] as [React.ReactNode, React.ReactNode]] : []),
                          ['Priority score', <ScoreBar score={usecaseData?.score} />],
                          ['RFP status', <RfpStatusTag generated={isGeneratedStatus} status={usecaseData?.status} />],
                        ]}
                      />
                    </div>
                  </section>

                  <section className="rounded-lg border border-slate-200 bg-white px-5 py-4">
                    <h2 className="mb-3 text-[14.5px] font-semibold text-slate-900">How it works</h2>
                    <ol className="space-y-3">
                      {[
                        ['Confirm the issuing company', 'It appears in the RFP as the organisation issuing it.'],
                        ['Add your template (optional)', 'Upload a Word (.docx) template to use your own layout and branding.'],
                        ['Create the RFP', 'Avagama drafts the scope, requirements, evaluation criteria and SLAs. This usually takes a minute or two.'],
                        ['Download', 'Get the document as Word (.docx) or PDF. Delete it if you want to create it again.'],
                      ].map(([step, detail], i) => (
                        <li key={step} className="flex gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--sx-primary-soft)] text-[12px] font-semibold text-[var(--sx-primary)]">{i + 1}</span>
                          <div className="min-w-0">
                            <div className="text-[13.5px] font-medium text-slate-800">{step}</div>
                            <div className="text-[12.5px] text-slate-500">{detail}</div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </section>
                </div>

                {/* Right: create and download */}
                <section className="rounded-lg border border-slate-200 bg-white lg:sticky lg:top-4" id="rfp-generation-controls-panel">
                  <div className="border-b border-slate-200 px-5 py-3">
                    <h2 className="text-[14.5px] font-semibold text-slate-900">{generationSuccess ? 'RFP document' : 'Create RFP'}</h2>
                    <p className="mt-0.5 text-[12.5px] text-slate-500">
                      {generationSuccess ? 'Your document is ready to download.' : 'Fill in the details below, then create the document.'}
                    </p>
                  </div>

                  <div className="space-y-5 px-5 py-4">
                    <Field
                      label="Issuing company"
                      required
                      error={!locked && !entityCompany.trim() ? 'Enter the company name to create the RFP.' : undefined}
                      hint={generationSuccess ? 'Locked after the RFP is created. Delete the RFP to change it.' : 'Shown in the RFP as the organisation issuing it.'}
                    >
                      <Input
                        type="text"
                        value={entityCompany}
                        onChange={(e) => {
                          const value = e.target.value;
                          setEntityCompany(value);
                          try {
                            if (usecaseId) localStorage.setItem(`rfp-entity-company-${usecaseId}`, value);
                          } catch (err) {
                            console.error('Failed to persist entity/company override', err);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            setEntityCompany(e.currentTarget.value);
                            e.currentTarget.blur();
                          }
                        }}
                        onBlur={(e) => {
                          // Committed on blur rather than on every keystroke — the
                          // cache update rewrites the whole list, which is not worth
                          // doing per character. Enter blurs the field, so both ways
                          // of finishing the edit land here.
                          if (usecaseId) {
                            rfpSessionCache.updateOne(usecaseId, { company_name: e.target.value.trim() });
                          }
                        }}
                        placeholder="Company name"
                        required
                        disabled={locked}
                        autoComplete="off"
                        id="entity-company-input"
                        className={cx(!locked && !entityCompany.trim() && '!border-red-300 focus:!border-red-500 focus:!ring-red-500/15')}
                      />
                    </Field>

                    {/* Optional RFP template */}
                    <div id="rfp-template-upload-section">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-[12.5px] font-medium text-slate-700">RFP template</span>
                        <Tag>Optional</Tag>
                      </div>

                      {isUploadingTemplate ? (
                        <div className="flex items-center gap-2.5 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-[13px] text-slate-600" id="rfp-template-uploading-state">
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />
                          {templateInfo ? 'Replacing template…' : 'Uploading template…'}
                        </div>
                      ) : templateInfo ? (
                        <div
                          className={cx('flex items-center justify-between gap-3 rounded-md border px-3 py-2.5', locked ? 'border-slate-200 bg-slate-50' : 'border-emerald-200 bg-emerald-50/60')}
                          id="rfp-template-applied-state"
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <FileText className={cx('h-4 w-4 shrink-0', locked ? 'text-slate-400' : 'text-emerald-600')} />
                            <div className="min-w-0">
                              <div className={cx('truncate text-[13px] font-medium', locked ? 'text-slate-500' : 'text-slate-800')} title={templateInfo.filename}>{templateInfo.filename}</div>
                              <div className="text-[12px] text-slate-500">Template applied</div>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <label
                              htmlFor="rfp-template-upload-input"
                              className={cx('inline-flex h-8 items-center rounded-md border px-2.5 text-[13px] font-medium transition-colors',
                                locked ? 'cursor-not-allowed border-slate-200 text-slate-300' : 'cursor-pointer border-slate-300 bg-white text-slate-700 hover:bg-slate-50')}
                            >
                              Replace
                            </label>
                            <IconButton
                              label="Remove template"
                              tone="danger"
                              onClick={() => setShowDeleteTemplateConfirm(true)}
                              disabled={locked || isDeletingTemplate}
                              id="delete-template-button"
                            >
                              {isDeletingTemplate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </IconButton>
                          </div>
                        </div>
                      ) : (
                        <label
                          htmlFor="rfp-template-upload-input"
                          className={cx('flex items-center gap-3 rounded-md border border-dashed px-3 py-3 transition-colors',
                            locked ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60' : 'cursor-pointer border-slate-300 bg-slate-50/60 hover:border-[var(--sx-primary)] hover:bg-[var(--sx-primary-soft)]')}
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-slate-500 ring-1 ring-slate-200">
                            <Upload className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13px] font-medium text-slate-700">Choose a .docx file</span>
                            <span className="block text-[12px] text-slate-500">Word only, up to 15 MB</span>
                          </span>
                          <span className="shrink-0 text-[13px] font-medium text-[var(--sx-primary)]">Browse</span>
                        </label>
                      )}

                      <input
                        id="rfp-template-upload-input"
                        type="file"
                        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="hidden"
                        disabled={generationSuccess || isGenerating || isUploadingTemplate}
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          handleTemplateFileSelect(file);
                          e.target.value = '';
                        }}
                      />

                      {templateUploadError
                        ? <p className="mt-1 text-[12px] text-red-600">{templateUploadError}</p>
                        : <p className="mt-1 text-[12px] text-slate-500">Without a template, the default RFP format is used.</p>}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 px-5 py-4">
                    {isGenerating ? (
                      <div className="rounded-md border border-[var(--sx-primary-soft)] bg-[var(--sx-primary-soft)] px-4 py-3.5" id="generation-spinner-state">
                        <div className="flex items-center gap-2.5">
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--sx-primary)]" />
                          <div className="flex-1 text-[13.5px] font-semibold text-slate-900">Creating the RFP document</div>
                          <span className="font-mono text-[12px] tabular-nums text-slate-500" title="Elapsed time"><Elapsed /></span>
                        </div>
                        <IndeterminateBar className="mt-2.5" />
                        <p className="mt-2.5 text-[12.5px] text-slate-700">{generationStatusText}</p>
                        <p className="mt-1 text-[12px] text-slate-500">This can take a couple of minutes. Keep this page open.</p>
                      </div>
                    ) : generationError && errorCopy ? (
                      <div className="space-y-3" id="generation-failed-state">
                        <Callout tone="danger" icon={<AlertTriangle className="h-4 w-4" />} title={errorCopy.heading}>
                          {errorCopy.message}
                          {generationError.requestId && (
                            <div className="mt-1 text-[12px] opacity-80">Reference: <span className="font-mono">{generationError.requestId}</span></div>
                          )}
                        </Callout>
                        <Button variant="primary" className="h-10 w-full" onClick={handleCreateRfp} icon={<RefreshCw className="h-4 w-4" />}>Try again</Button>
                      </div>
                    ) : generationSuccess ? (
                      <div className="space-y-3">
                        <div className="flex items-start gap-2.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5" id="generation-completed-state">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <div>
                            <div className="text-[13.5px] font-semibold text-emerald-900">RFP document ready</div>
                            <div className="text-[12.5px] text-emerald-800">Download it as Word or PDF.</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2" id="rfp-download-buttons">
                          <Button
                            variant="primary"
                            onClick={() => handleDownloadFile('docx')}
                            disabled={downloadingFormat !== null}
                            loading={downloadingFormat === 'docx'}
                            icon={<Download className="h-4 w-4" />}
                            id="download-docx-button"
                          >
                            {downloadingFormat === 'docx' ? 'Preparing…' : 'Word (.docx)'}
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => handleDownloadFile('pdf')}
                            disabled={downloadingFormat !== null}
                            loading={downloadingFormat === 'pdf'}
                            icon={<Download className="h-4 w-4" />}
                            id="download-pdf-button"
                          >
                            {downloadingFormat === 'pdf' ? 'Preparing…' : 'PDF'}
                          </Button>
                        </div>

                        <div className="border-t border-slate-100 pt-3" id="rfp-delete-button-container">
                          <Button
                            variant="danger"
                            className="w-full"
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={isDeleting}
                            icon={<Trash2 className="h-4 w-4" />}
                            id="delete-rfp-button"
                          >
                            Delete RFP document
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        className="h-10 w-full"
                        onClick={handleCreateRfp}
                        disabled={isGenerating}
                        icon={<Sparkles className="h-4 w-4" />}
                        id="create-rfp-button"
                      >
                        Create RFP
                      </Button>
                    )}
                  </div>
                </section>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete RFP confirmation */}
      <Modal
        open={showDeleteConfirm}
        onClose={() => { if (!isDeleting) setShowDeleteConfirm(false); }}
        dismissable={!isDeleting}
        title="Delete RFP document"
        width={460}
        footer={(
          <>
            <Button onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting} id="cancel-delete-button">Cancel</Button>
            <Button
              variant="primary"
              className="!bg-red-600 hover:!bg-red-700"
              onClick={handleDeleteRfp}
              loading={isDeleting}
              icon={<Trash2 className="h-4 w-4" />}
              id="confirm-delete-button"
            >
              {isDeleting ? 'Deleting…' : 'Delete RFP document'}
            </Button>
          </>
        )}
      >
        <div className="text-[13.5px] text-slate-600" id="delete-rfp-modal">
          Delete the generated RFP document for <span className="font-medium text-slate-900">{displayTitle}</span>? This can't be undone.
        </div>
      </Modal>

      {/* Remove template confirmation */}
      <Modal
        open={showDeleteTemplateConfirm}
        onClose={() => { if (!isDeletingTemplate) setShowDeleteTemplateConfirm(false); }}
        dismissable={!isDeletingTemplate}
        title="Remove template"
        width={460}
        footer={(
          <>
            <Button onClick={() => setShowDeleteTemplateConfirm(false)} disabled={isDeletingTemplate} id="cancel-delete-template-button">Cancel</Button>
            <Button
              variant="primary"
              className="!bg-red-600 hover:!bg-red-700"
              onClick={handleDeleteTemplate}
              loading={isDeletingTemplate}
              icon={<Trash2 className="h-4 w-4" />}
              id="confirm-delete-template-button"
            >
              {isDeletingTemplate ? 'Removing…' : 'Remove template'}
            </Button>
          </>
        )}
      >
        <div className="text-[13.5px] text-slate-600" id="delete-template-modal">
          Remove <span className="font-medium text-slate-900">{templateInfo?.filename || 'this template'}</span>? Future downloads will use the default RFP format.
        </div>
      </Modal>
    </StudioTheme>
  );
};

export default RfpDetail;
