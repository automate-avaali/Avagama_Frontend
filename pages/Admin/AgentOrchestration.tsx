import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Workflow, 
  GitFork, 
  Play, 
  Save, 
  Plus, 
  Trash2, 
  Compass, 
  Settings, 
  HelpCircle, 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Terminal, 
  Database, 
  Cpu, 
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  RefreshCw,
  Clock, 
  Calendar,
  ExternalLink, 
  Layers, 
  Sparkles, 
  User, 
  Zap, 
  Check,
  FileText,
  UploadCloud,
  Download,
  AlertTriangle,
  Search,
  BookOpen,
  ShieldCheck,
  X,
  PlusCircle,
  PlayCircle,
  Send,
  MessageSquare,
  Menu
} from 'lucide-react';
import { apiService, RFP_API_BASE } from '../../services/api';
import rfpSessionCache from '../../services/rfpSessionCache';
import toast from 'react-hot-toast';
import { OrchestrationModule, OrchestrationView } from './orchestration/OrchestrationModule';
import { StudioTheme, useFillHeight } from '../../components/studio/ui';
import { RfpCreationList } from './orchestration/rfpUi';
import studioToast from '../../components/studio/notify';

// Styling to match Avagama theme perfectly
const AVAGAMA_PURPLE = '#a26da8';
const AVAGAMA_TEAL = '#6fcbbd';

import * as pdfjs from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

interface WorkflowData {
  _id: string;
  name: string;
  description: string;
  workflow_type?: string;
  status: 'active' | 'draft';
  nodesCount?: number;
  successRate?: number;
  lastRun?: string;
  createdAt?: string;
}

interface PipelineData {
  _id: string;
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
  status: 'active' | 'draft';
  createdOn: string;
}

interface LogData {
  _id: string;
  pipelineName: string;
  status: 'completed' | 'failed' | 'running' | 'waiting_human';
  startedAt: string;
  duration: string;
  stepsCount: number;
  triggeredBy: string;
}

export const AgentOrchestration: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Left Sidebar Selections to match screen layout requests
  const [selectedMenu, setSelectedMenu] = useState<
    'agent-orchestra' | 'proposal-forge' | 'process-intelligence' | 'document-studio' | 'execution-hub' | 'approval-inbox' | 'workflow-library' | 'integration-lab' | 'observability' | 'access-roles' | 'execution-detail' | 'triggers'
  >(location.state?.selectedMenu || 'agent-orchestra');

  // Collapsible left sidebar (icon rail ↔ full) on desktop. Persisted so it stays where the user left it.
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem('orchestraSidebarCollapsed') === '1'; } catch { return false; }
  });
  const toggleSidebar = () => setSidebarCollapsed(prev => {
    const next = !prev;
    try { localStorage.setItem('orchestraSidebarCollapsed', next ? '1' : '0'); } catch {}
    return next;
  });

  // On tablet/mobile the sidebar becomes an off-canvas drawer instead of an inline rail.
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const apply = () => { setIsDesktop(mq.matches); if (mq.matches) setMobileSidebarOpen(false); };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  // The icon-rail collapse only applies on desktop; the mobile drawer always shows full labels.
  const railCollapsed = isDesktop && sidebarCollapsed;

  // Loading indicator
  const [loading, setLoading] = useState(false);

  // Profile data
  const [profileName, setProfileName] = useState('Admin');
  const [profileRole, setProfileRole] = useState('Organization Lead');
  const [profileCompany, setProfileCompany] = useState('Avagama AI');

  // Core Orchestration Datasets
  const [pipelinesList, setPipelinesList] = useState<any[]>([]);
  const [executionsList, setExecutionsList] = useState<any[]>([]);
  const [shortlistedUsecases, setShortlistedUsecases] = useState<any[]>([]);
  const [approvalsList, setApprovalsList] = useState<any[]>([]);

  // Selected details for inspection
  const [selectedPipeline, setSelectedPipeline] = useState<any | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<any | null>(null);
  const [executionEvents, setExecutionEvents] = useState<any[]>([]);
  const [executionLogsTab, setExecutionLogsTab] = useState<any[]>([]);
  const [activeExecutionTab, setActiveExecutionTab] = useState<'flow' | 'logs' | 'events'>('flow');

  // Create pipeline inputs
  const [usecaseTitle, setUsecaseTitle] = useState('');
  const [usecaseDesc, setUsecaseDesc] = useState('');
  const [usecaseIndustry, setUsecaseIndustry] = useState('Finance & Accounts Payable');
  const [usecaseComplexity, setUsecaseComplexity] = useState('high');
  const [usecaseSteps, setUsecaseSteps] = useState('');
  const [usecaseObjective, setUsecaseObjective] = useState('');
  const [usecaseExpectedOutput, setUsecaseExpectedOutput] = useState('');
  const [usecaseIntegrations, setUsecaseIntegrations] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('openrouter');
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.5-flash');
  const [isRegenerate, setIsRegenerate] = useState(true);
  const [activeWorkflowRightTab, setActiveWorkflowRightTab] = useState<'shortlisted' | 'blueprints'>('shortlisted');

  // RFP generation playground state
  const [proposalClient, setProposalClient] = useState('Global Logistics Corp');
  const [proposalTopic, setProposalTopic] = useState('Standard Invoice Extraction Pipeline');
  const [generatedProposalText, setGeneratedProposalText] = useState('');
  const [forging, setForging] = useState(false);

  // New RFP Creation States
  //
  // Seeded synchronously from the sessionStorage cache (when present) so
  // returning from RFP Generation renders the list on the very first paint
  // instead of flashing the empty state while the mount effect below re-runs.
  const [rfpUsecases, setRfpUsecases] = useState<any[] | null>(() => rfpSessionCache.get() ?? null);
  const [loadingRfpUsecases, setLoadingRfpUsecases] = useState(false);
  const [rfpUsecasesError, setRfpUsecasesError] = useState<string | null>(null);
  const [generatingRfpId, setGeneratingRfpId] = useState<string | null>(null);
  const [generatedRfpMap, setGeneratedRfpMap] = useState<Record<string, boolean>>(() => {
    const cached = rfpSessionCache.get() || [];
    const map: Record<string, boolean> = {};
    cached.forEach((item: any) => {
      // `false` is recorded as deliberately as `true`. A row the user just
      // deleted the document for must read as a present "no", not as a missing
      // entry that the heuristics in isRfpAlreadyGenerated would then answer.
      // A row carrying no rfpGenerated at all is left out, so those heuristics
      // still get to speak for it.
      const uId = item.usecaseId || item._id || item.id;
      if (uId && typeof item.rfpGenerated === 'boolean') map[uId] = item.rfpGenerated;
    });
    return map;
  });
  // Ids whose generated/not-generated status is still being verified against
  // the API. While an id is present here, its action button holds off on
  // showing either "Generate" or "View" so it never has to flip after the
  // fact.
  const [verifyingRfpMap, setVerifyingRfpMap] = useState<Record<string, boolean>>({});

  const isRfpAlreadyGenerated = (item: any) => {
    if (!item) return false;
    const uId = item.usecaseId || item._id || item.id;

    // The map is the answer whenever it holds this row — it is built from the
    // list endpoint's own `rfpGenerated` field and carries the optimistic
    // updates made when a document is generated or deleted in this tab.
    //
    // It has to win outright rather than only being able to say "yes". The
    // checks below are fallbacks for rows that predate the inline status, and
    // every one of them can only turn a "no" into a "yes" — so after a delete
    // they would read the row's leftover rfpId/rfpStatus and keep the button on
    // "View RFP Document" even though the map had already been corrected.
    if (uId && uId in generatedRfpMap) return generatedRfpMap[uId];
    if (typeof item.rfpGenerated === 'boolean') return item.rfpGenerated;

    if (item.isGenerated === true || item.hasRfp === true || item.rfp_generated === true) {
      return true;
    }

    const statusCandidates = [
      item.rfpStatus,
      item.rfp_status,
      item.status,
      item.usecaseStatus,
      item.rfpState,
      item.state,
      item.rfp?.status
    ];

    for (const st of statusCandidates) {
      if (typeof st === 'string') {
        const lower = st.toLowerCase();
        if (lower === 'generated' || lower === 'completed' || lower === 'rfp_generated' || lower === 'generated_rfp' || lower === 'done') {
          return true;
        }
      }
    }

    if (item.rfpId || item.rfp_id || (item.rfp && (item.rfp._id || item.rfp.id))) {
      const rfpStatus = (item.rfp?.status || item.rfpStatus || '').toLowerCase();
      if (rfpStatus !== 'draft' && rfpStatus !== 'failed' && rfpStatus !== 'pending') {
        return true;
      }
    }

    return false;
  };

  // Orchestration module (Pipelines / Create / Executions / Approvals / Triggers) wiring
  const fillHeight = useFillHeight();
  const [navCounts, setNavCounts] = useState<{ pipelines: number; approvals: number }>({ pipelines: 0, approvals: 0 });
  const [createPrefill, setCreatePrefill] = useState<{ title?: string; description?: string; industry?: string; complexity?: string } | null>(null);
  const [moduleKey, setModuleKey] = useState(0);
  const ORCH_VIEW: Record<string, OrchestrationView> = { 'agent-orchestra': 'pipelines', 'workflow-library': 'create', 'execution-hub': 'executions', 'execution-detail': 'executions', 'approval-inbox': 'approvals', 'triggers': 'triggers' };
  const MENU_FOR_VIEW: Record<OrchestrationView, typeof selectedMenu> = { pipelines: 'agent-orchestra', create: 'workflow-library', executions: 'execution-hub', approvals: 'approval-inbox', triggers: 'triggers' };
  const orchView = ORCH_VIEW[selectedMenu];

  // Document extraction studio simulated state/interactive files
  const [docFile, setDocFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedDocResult, setParsedDocResult] = useState<any | null>(null);
  const [analyzingDoc, setAnalyzingDoc] = useState(false);
  const [analyzingDocExecute, setAnalyzingDocExecute] = useState(false);

  const [executionIdToDelete, setExecutionIdToDelete] = useState<string | null>(null);

  // Load profile and run initial calls
  useEffect(() => {
    const rawUser = sessionStorage.getItem('user');
    if (rawUser) {
      try {
        const userObj = JSON.parse(rawUser);
        if (userObj.name) setProfileName(userObj.name);
        if (userObj.role) setProfileRole(userObj.role === 'orgAdmin' ? 'Org Admin' : userObj.role);
        if (userObj.email) setProfileCompany(userObj.email.split('@')[1]?.split('.')[0].toUpperCase() || 'Avagama');
      } catch (e) {}
    }
    loadAllBackendState();
  }, []);

  // Data for Process Intelligence (shortlisted use cases) and Observability (recent executions).
  // One W-08 call replaces the old per-pipeline fan-out.
  const loadAllBackendState = async () => {
    setLoading(true);
    try {
      const [domainShort, companyShort, execRes] = await Promise.all([
        apiService.useCases.listShortlistedDomain().catch(() => ({ data: [] })),
        apiService.useCases.listShortlistedCompany().catch(() => ({ data: [] })),
        apiService.workflows.listExecutions({ limit: 100 }).catch(() => null),
      ]);
      setShortlistedUsecases([
        ...(domainShort?.data || []).map((uc: any) => ({ ...uc, source: 'domain' })),
        ...(companyShort?.data || []).map((uc: any) => ({ ...uc, source: 'company' }))
      ]);
      const execs: any[] = Array.isArray(execRes?.data) ? execRes.data : [];
      setExecutionsList(execs.map((ex: any) => ({ ...ex, pipelineName: ex.pipeline_name || ex.pipelineName, pipelineId: ex.pipeline_id })));
    } catch (e) {
      console.warn("Backend state sync failed:", e);
    } finally {
      setLoading(false);
    }
  };

  // Delete an execution (Observability)
  const handleDeleteExecution = (execId: string) => {
    if (!execId) return;
    setExecutionIdToDelete(execId);
  };

  const performExecutionDelete = async () => {
    if (!executionIdToDelete) return;
    const execId = executionIdToDelete;
    const toastId = toast.loading('Deleting execution…');
    try {
      await apiService.workflows.deleteExecution(execId);
      toast.success('Execution deleted', { id: toastId });
      setExecutionIdToDelete(null);
      if (selectedExecution?._id === execId) { setSelectedExecution(null); setExecutionEvents([]); }
      await loadAllBackendState();
    } catch (e: any) {
      toast.error(e?.message || 'Error deleting the execution', { id: toastId });
      setExecutionIdToDelete(null);
    }
  };


  // V3 Toggle Shortlisted States Interactive Actions
  const handleToggleShortlist = async (uc: any) => {
    const toastId = toast.loading('Toggling shortcut status...');
    try {
      const res = await apiService.evaluations.toggleShortlist(uc._id);

      if (res.success) {
        toast.success(res.shortlisted ? 'Standard use case shortlisted in dashboard' : 'Use case un-pinned', { id: toastId });
        loadAllBackendState();
      } else {
        toast.error('Sync failed', { id: toastId });
      }
    } catch (e: any) {
      toast.error(e?.message || 'Error toggling shortlist', { id: toastId });
    }
  };

  // Document Studio Parsing Upload Actions
  const handleDocFileUpload = async (file: File) => {
    setDocFile(file);
    setAnalyzingDoc(true);
    setParsedDocResult(null);
    const toastId = toast.loading('Uploading and analyzing document...');

    try {
      const res = await apiService.documents.upload(file);
      if (res && (res.data || res.success)) {
        setParsedDocResult(res.data || res);
        toast.success('Document analysis parsed successfully!', { id: toastId });
      }
    } catch (e: any) {
      toast.error(e.message || 'Document analysis failed', { id: toastId });
    } finally {
      setAnalyzingDoc(false);
    }
  };

  // RFP generation action
  const handleForgeProposal = async () => {
    if (!proposalTopic) return;
    setForging(true);
    setGeneratedProposalText('');
    const toastId = toast.loading('Generating enterprise RFP...');

    try {
      // Use cases domain generate for creating RFPs
      const res = await apiService.useCases.generateDomain({
        domain: proposalClient,
        user_role: "Executive Manager",
        objective: proposalTopic
      });
      
      if (res && res.success) {
        setGeneratedProposalText(JSON.stringify(res.data, null, 2));
        toast.success('RFP data generated successfully!', { id: toastId });
      }
    } catch (e: any) {
      toast.error(e.message || 'RFP creation failed', { id: toastId });
    } finally {
      setForging(false);
    }
  };

  // Rebuilds the "already generated" lookup from a cached list, so a cache hit
  // does not have to re-run the per-item verification requests below.
  const generatedMapFromItems = (items: any[]): Record<string, boolean> => {
    const map: Record<string, boolean> = {};
    items.forEach((item: any) => {
      // Same rule as the state initialiser above: an explicit boolean is
      // recorded either way, and a row without one is left for the fallbacks.
      const uId = item.usecaseId || item._id || item.id;
      if (uId && typeof item.rfpGenerated === 'boolean') map[uId] = item.rfpGenerated;
    });
    return map;
  };

  // Action 1: LOAD SHORTLISTED EVALUATIONS
  //
  // Reads the sessionStorage cache first so returning to this page — from RFP
  // Generation, or across a browser refresh — renders immediately without
  // touching the API. `force` is the explicit user action ("Refresh Shortlisted
  // evaluations" and the retry buttons): it drops the cache and re-fetches.
  // `deletedUsecaseId` is set when returning from RfpDetail right after a
  // document was deleted there; see the auto-load effect below.
  const loadShortlistedEvaluations = async (options: { force?: boolean; deletedUsecaseId?: string } = {}) => {
    const { force = false, deletedUsecaseId } = options;

    if (force) {
      rfpSessionCache.clear();
    } else {
      const cached = rfpSessionCache.get();
      if (cached) {
        setRfpUsecases(cached);
        setGeneratedRfpMap(generatedMapFromItems(cached));
        setVerifyingRfpMap({});
        setRfpUsecasesError(null);
        return;
      }
    }

    setLoadingRfpUsecases(true);
    setRfpUsecasesError(null);
    try {
      const token = sessionStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`${RFP_API_BASE}/rfp/shortlisted-usecases`, {
        method: 'GET',
        headers,
      });
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const data = await response.json();
      const fetched = Array.isArray(data) ? data : (data.data && Array.isArray(data.data)) ? data.data : [];

      // The delete for this use case has already succeeded, so its row is
      // reset to the "no RFP" shape whatever this response says — in case the
      // list has not caught up with the delete yet.
      const items = deletedUsecaseId
        ? fetched.map((item: any) =>
            String(item.usecaseId || item._id || item.id) === deletedUsecaseId
              ? { ...item, rfpId: null, rfpStatus: 'not_created', rfpGenerated: false }
              : item)
        : fetched;

      // The backend now returns rfpGenerated inline per row, so the map is
      // built — and set — before setRfpUsecases. Both updates land in the
      // same synchronous batch, so the first paint that includes these rows
      // already carries correct status; there is no longer a verification
      // window for the button to sit in.
      setGeneratedRfpMap(generatedMapFromItems(items));
      setVerifyingRfpMap({});
      setRfpUsecases(items);
      rfpSessionCache.set(items);
    } catch (err: any) {
      console.error('Error loading shortlisted usecases:', err);
      setRfpUsecasesError(err.message || 'Failed to load shortlisted usecases');
      studioToast.error(err.message || 'Failed to load shortlisted usecases');
    } finally {
      setLoadingRfpUsecases(false);
    }
  };

  // Action 2: GENERATE RFP DOCUMENT FOR THIS USE CASE
  // NOTE: not currently called from any button in this file — the wired-up
  // action navigates to /rfp/from-usecase/:id (RfpDetail.tsx), which already
  // does its own equivalent optimistic update on generate success. Patched
  // here to match anyway, in case this path is ever reconnected.
  const generateRfpDocument = async (item: any) => {
    const usecaseId = item.usecaseId || item._id || item.id;
    if (!usecaseId) {
      toast.error('Missing usecaseId or ID for this item');
      return;
    }

    setGeneratingRfpId(usecaseId);
    const toastId = toast.loading('Initiating RFP document generation pipeline...');
    try {
      const token = sessionStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // 1) POST /api/rfp/from-usecase (body: { type, entityId, usecaseId })
      const payload = {
        type: item.type || item.source || 'domain',
        entityId: item.entityId || item.documentId || item._id || item.id,
        usecaseId: usecaseId
      };

      const resFromUsecase = await fetch(`${RFP_API_BASE}/rfp/from-usecase`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!resFromUsecase.ok) {
        const errText = await resFromUsecase.text().catch(() => '');
        throw new Error(`Step 1 (From Usecase) Failed: ${resFromUsecase.status} ${errText}`);
      }

      const resData = await resFromUsecase.json();
      const rfpId = resData.rfp?._id || resData.rfp?.id || resData._id || resData.id || resData.data?._id || resData.data?.id;

      if (!rfpId) {
        throw new Error('Failed to retrieve RFP ID from generation initial step.');
      }

      // 2) POST /api/rfp/:id/generate (show spinner, disable button, no timeout)
      toast.loading('Generating RFP document content. This may take a minute...', { id: toastId });
      const resGenerate = await fetch(`${RFP_API_BASE}/rfp/${rfpId}/generate`, {
        method: 'POST',
        headers
      });

      if (!resGenerate.ok) {
        const errText = await resGenerate.text().catch(() => '');
        throw new Error(`Step 2 (Generate) Failed: ${resGenerate.status} ${errText}`);
      }

      // 3) GET /api/rfp/:id/download/docx (fetch as blob, trigger download)
      toast.loading('Downloading generated .docx file...', { id: toastId });
      const resDownload = await fetch(`${RFP_API_BASE}/rfp/${rfpId}/download/docx`, {
        method: 'GET',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (!resDownload.ok) {
        throw new Error(`Step 3 (Download) Failed with status ${resDownload.status}`);
      }

      const blob = await resDownload.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      let filename = `${item.title || 'rfp-document'}.docx`.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const disposition = resDownload.headers.get('Content-Disposition');
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

      setGeneratedRfpMap(prev => ({ ...prev, [usecaseId]: true }));
      rfpSessionCache.updateOne(usecaseId, { rfpStatus: 'generated', rfpGenerated: true });

      toast.dismiss(toastId);
    } catch (err: any) {
      console.error('Error generating RFP:', err);
      toast.error(err.message || 'Error occurred during RFP generation process', { id: toastId });
    } finally {
      setGeneratingRfpId(null);
    }
  };

  // Auto load shortlisted evaluations when navigating to proposal-forge
  useEffect(() => {
    if (selectedMenu !== 'proposal-forge') return;

    // Returning from RfpDetail right after deleting a document: re-sync the
    // list with the server, as the Refresh button does, so the button flips
    // back to "Generate RFP Document" without a manual refresh.
    const deletedUsecaseId = location.state?.rfpDeletedUsecaseId;
    if (deletedUsecaseId) {
      // Drop the marker from this history entry so a reload or Back does not
      // replay the delete over a document generated since.
      navigate(location.pathname, { replace: true, state: { selectedMenu } });
      loadShortlistedEvaluations({ force: true, deletedUsecaseId: String(deletedUsecaseId) });
      return;
    }

    loadShortlistedEvaluations();
  }, [selectedMenu]);

  const MENU_LABELS: Record<string, string> = {
    'agent-orchestra': 'Pipelines', 'workflow-library': 'Create pipeline', 'proposal-forge': 'RFP Creation', 'process-intelligence': 'Process Intelligence',
    'document-studio': 'Document Studio', 'execution-hub': 'Executions', 'execution-detail': 'Executions', 'approval-inbox': 'Approval Inbox', 'triggers': 'Triggers',
    'integration-lab': 'Integration Lab', 'observability': 'Observability', 'access-roles': 'Access & Roles',
  };

  return (
    <div className="flex min-h-[520px] bg-[#f4f5f7] text-gray-800 overflow-hidden" style={{ height: fillHeight ?? 'calc(100vh - 80px)' }} id="orchestration-panel-container">

      
      {/* Mobile drawer backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] animate-in fade-in duration-200"
        />
      )}

      {/* 1. LEFT SIDEBAR - off-canvas drawer on mobile, collapsible icon rail on desktop */}
      <aside
        className={`bg-white flex flex-col shrink-0 select-none border-r border-slate-200 transition-[width,transform] duration-200 ease-in-out
          fixed inset-y-0 left-0 z-[65] w-[248px] shadow-2xl
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:z-auto lg:translate-x-0 lg:shadow-none ${railCollapsed ? 'lg:w-[60px]' : 'lg:w-[248px]'}`}
        id="enterprise-agentic-sidebar"
      >
        <div className={`h-14 shrink-0 border-b border-slate-200 flex items-center ${railCollapsed ? 'lg:justify-center lg:px-0' : ''} justify-between px-4`}>
          {!railCollapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 bg-gradient-to-tr from-[#a26da8] to-[#6fcbbd] rounded-md flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 leading-tight">
                <div className="text-[14px] font-semibold text-slate-900 truncate">Orchestration</div>
                <div className="text-[11.5px] text-slate-500 truncate">Studio Orchestrator</div>
              </div>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            title={railCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex w-8 h-8 rounded-md items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0"
          >
            {railCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            title="Close menu"
            className="lg:hidden w-8 h-8 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 scrollbar-thin">
          {(() => {
            const sections: { title: string; items: { key: any; icon: any; label: string; badge?: number | null; extra?: () => void }[] }[] = [
              { title: 'Build', items: [
                { key: 'agent-orchestra', icon: Workflow, label: 'Pipelines', badge: navCounts.pipelines || null },
                { key: 'workflow-library', icon: PlusCircle, label: 'Create pipeline' },
                { key: 'proposal-forge', icon: Sparkles, label: 'RFP Creation' },
                { key: 'process-intelligence', icon: Layers, label: 'Process Intelligence', extra: () => loadAllBackendState() },
                { key: 'document-studio', icon: Database, label: 'Document Studio' },
              ]},
              { title: 'Operate', items: [
                { key: 'execution-hub', icon: Play, label: 'Executions' },
                { key: 'approval-inbox', icon: Check, label: 'Approval Inbox', badge: navCounts.approvals || null },
                { key: 'triggers', icon: Clock, label: 'Triggers' },
              ]},
              { title: 'Govern', items: [
                { key: 'integration-lab', icon: Settings, label: 'Integration Lab' },
                { key: 'observability', icon: Activity, label: 'Observability', extra: () => loadAllBackendState() },
                { key: 'access-roles', icon: User, label: 'Access & Roles' },
              ]},
            ];
            return sections.map(section => (
              <div key={section.title} className="mb-1">
                {railCollapsed
                  ? <div className="mx-3 my-2 border-t border-slate-100" />
                  : <span className="px-4 pt-2 pb-1 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide block">{section.title}</span>}
                {section.items.map(item => {
                  const Icon = item.icon;
                  const active = selectedMenu === item.key || (item.key === 'execution-hub' && selectedMenu === 'execution-detail');
                  const hasBadge = item.badge != null && item.badge > 0;
                  return (
                    <button
                      key={item.key}
                      onClick={() => { setSelectedMenu(item.key); item.extra?.(); setMobileSidebarOpen(false); }}
                      title={railCollapsed ? item.label : undefined}
                      className={`relative w-full flex items-center text-[13.5px] transition-colors ${railCollapsed ? 'justify-center h-10' : 'gap-2.5 h-9 px-4'} ${active ? 'bg-[#a26da8]/10 text-[#7d4f83] font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                      {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-[#8a5a90]" />}
                      <Icon className="w-4 h-4 shrink-0" />
                      {!railCollapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
                      {hasBadge && (
                        <span className={`rounded-full bg-[#8a5a90] text-white font-semibold ${railCollapsed ? 'absolute right-2 top-1 text-[10px] px-1 leading-[15px]' : 'text-[11px] px-1.5 leading-[18px]'}`}>{item.badge}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ));
          })()}
        </nav>
      </aside>


      {/* 2. MAIN ACTIVE LAYOUT WRAPPER */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">

        {/* Mobile top bar — opens the sidebar drawer */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-white shrink-0">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            title="Open menu"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-[#a26da8] hover:bg-[#a26da8]/10 border border-slate-200 transition-all shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 bg-gradient-to-tr from-[#a26da8] to-[#6fcbbd] rounded-lg flex items-center justify-center shadow-sm shrink-0">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider truncate">Studio Orchestrator</span>
          </div>
        </div>

        {/* Workspace header */}
        <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-5 md:px-6 shrink-0 select-none z-10">
          <div className="min-w-0 flex items-center gap-1.5 text-[13.5px]">
            <span className="text-slate-500">Orchestration</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span className="font-semibold text-slate-900 truncate">{MENU_LABELS[selectedMenu] || 'Workspace'}</span>
          </div>
          <button
            onClick={() => { loadAllBackendState(); setModuleKey(k => k + 1); }}
            className="h-8 px-3 rounded-md border border-slate-300 bg-white text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition flex items-center gap-2"
            title="Reload this workspace"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </header>

        {/* Workspace content */}
        <div className={`flex-grow overflow-y-auto ${orchView || selectedMenu === 'proposal-forge' ? 'p-5 md:p-6' : 'p-8 md:p-12'}`}>
          {orchView ? (
            <StudioTheme accent="avagama" className="h-full">
              <OrchestrationModule
                key={moduleKey}
                view={orchView}
                onNavigate={v => setSelectedMenu(MENU_FOR_VIEW[v])}
                onCounts={setNavCounts}
                createPrefill={createPrefill}
                onPrefillConsumed={() => setCreatePrefill(null)}
              />
            </StudioTheme>
          ) : (
            <AnimatePresence mode="wait">


              {/* VIEW 2: RFP Creation (RFP Generation assistant) */}
              {selectedMenu === 'proposal-forge' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                >
                  <StudioTheme accent="avagama">
                    <RfpCreationList
                      items={rfpUsecases}
                      loading={loadingRfpUsecases}
                      error={rfpUsecasesError}
                      isGenerated={isRfpAlreadyGenerated}
                      verifying={verifyingRfpMap}
                      onRefresh={() => loadShortlistedEvaluations({ force: true })}
                      onOpen={usecaseId => navigate(`/rfp/from-usecase/${usecaseId}`)}
                    />
                  </StudioTheme>
                </motion.div>
              )}

              {/* VIEW 3: Process Intelligence (Active & Shortlisted Evaluations checklist) */}
              {selectedMenu === 'process-intelligence' && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-8"
                >
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">Process Intelligence Matrix</h2>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-1">
                      Showing shortlisted evaluations and domain workflows registered under the V3 API Schema
                    </p>
                  </div>

                  {shortlistedUsecases.length === 0 ? (
                    <div className="bg-white border border-slate-100 p-12 rounded-[32px] text-center max-w-2xl mx-auto space-y-4">
                      <Layers className="w-12 h-12 text-slate-200 mx-auto" />
                      <h4 className="text-sm font-black text-slate-850 uppercase tracking-widest">No Shortlisted Use Cases Found</h4>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                        In V3, you toggle individual use-cases (Domain or Company templates) to populate your process list here. Visit Evaluations to shortlist.
                      </p>
                      <button 
                        onClick={() => navigate('/evaluations')}
                        className="px-6 py-2.5 bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition cursor-pointer"
                      >
                        Visit Evaluations
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {shortlistedUsecases.map((uc: any) => (
                        <div 
                          key={uc._id}
                          className="bg-white border border-slate-100 shadow-sm p-8 rounded-[32px] hover:shadow-lg transition flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-6">
                              <div className="flex gap-2">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${uc.source === 'domain' ? 'bg-indigo-50 text-indigo-700' : 'bg-pink-50 text-pink-700'}`}>
                                  {uc.source === 'domain' ? 'Domain Template' : 'Company Custom'}
                                </span>
                                {uc.domain && (
                                  <span className="bg-slate-50 text-slate-400 text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full">
                                    {uc.domain}
                                  </span>
                                )}
                              </div>
                              <button 
                                onClick={() => handleToggleShortlist(uc)}
                                className="text-amber-400 hover:text-slate-300 transition shrink-0"
                                title="Remove Shortcut"
                              >
                                <Zap className="w-5 h-5 fill-current" />
                              </button>
                            </div>

                            <h3 className="text-lg font-black text-slate-950 uppercase tracking-tight mb-2">{uc.title}</h3>
                            <p className="text-xs font-semibold text-slate-400 leading-relaxed block mb-6">{uc.description}</p>

                            {uc.functional_steps && uc.functional_steps.length > 0 && (
                              <div className="space-y-2 mb-6">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Workflow Step Boundaries:</span>
                                <div className="space-y-1.5 pl-2">
                                  {uc.functional_steps.map((st: string, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                                      <span>{st}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="border-t border-slate-50 pt-5 flex justify-between items-center mt-auto">
                            <div>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Priority Rank</span>
                              <span className="text-sm font-black text-slate-800">{uc.totalWeightedScore || "8.50"} / 10.00</span>
                            </div>
                            <button
                              onClick={() => {
                                setCreatePrefill({ title: uc.title, description: uc.description, industry: uc.industry || uc.domain, complexity: uc.complexity });
                                setSelectedMenu('workflow-library');
                              }}
                              className="px-5 py-2.5 bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition flex items-center gap-1.5 cursor-pointer"
                            >
                              Generate Flow <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* VIEW 4: Document Studio (OCR Workbench) */}
              {selectedMenu === 'document-studio' && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -15 }}
                  className="grid grid-cols-1 lg:grid-cols-5 gap-8"
                >
                  <div className="lg:col-span-2 bg-white border border-slate-100 p-8 rounded-[32px] shadow-sm flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 select-none">
                        <Database className="w-6 h-6 text-orange-400" />
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Extraction Studio</h3>
                      </div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide leading-relaxed">
                        Simulate and test parser rules with custom uploads. (Fulfills drag & drop and click file picker capabilities).
                      </p>

                      {/* DRAG AND DROP ZONE */}
                      <div 
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          if (e.dataTransfer.files?.[0]) handleDocFileUpload(e.dataTransfer.files[0]);
                        }}
                        className={`border-2 border-dashed rounded-[24px] p-8 text-center transition select-none flex flex-col items-center justify-center min-h-[180px] cursor-pointer ${isDragging ? 'border-[#a26da8] bg-[#a26da8]/5' : 'border-slate-200 hover:border-slate-300'}`}
                        onClick={() => {
                          const fileInput = document.getElementById('studio-file-picker');
                          fileInput?.click();
                        }}
                      >
                        <input 
                          type="file" 
                          id="studio-file-picker" 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleDocFileUpload(e.target.files[0]);
                          }} 
                        />
                        <UploadCloud className="w-10 h-10 text-slate-300 mb-3" />
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">
                          {docFile ? docFile.name : "Choose Invoice Layout PDF"}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block mt-1">
                          Drag & drop or Click to browse
                        </span>
                      </div>
                    </div>

                    {docFile && (
                      <div className="pt-6 border-t border-slate-50 flex gap-3">
                        <button 
                          onClick={() => { setDocFile(null); setParsedDocResult(null); }}
                          className="flex-1 py-3 text-rose-600 border border-rose-100 hover:bg-rose-50 text-[10px] font-black uppercase tracking-widest rounded-xl transition cursor-pointer"
                        >
                          Clear File
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-3 bg-white border border-slate-100 p-8 rounded-[32px] shadow-sm flex flex-col justify-between min-h-[500px]">
                    <div className="space-y-6">
                      <div className="flex justify-between items-center border-b border-slate-50 pb-4 select-none">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parsed Schema Key-values</span>
                        <span className="text-[9px] font-extrabold text-orange-400 uppercase tracking-widest bg-orange-50 px-2.5 py-1 rounded-md">
                          Schema v1.2
                        </span>
                      </div>

                      {analyzingDoc ? (
                        <div className="py-24 text-center">
                          <div className="w-10 h-10 border-4 border-slate-100 border-t-orange-400 rounded-full animate-spin mx-auto mb-4" />
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Parsing with OCR model...</span>
                        </div>
                      ) : parsedDocResult ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-2xl">
                              <span className="text-[9px] font-mono text-slate-400 uppercase">Vendor Name</span>
                              <h4 className="text-xs font-black text-slate-900 mt-1 uppercase">{parsedDocResult.vendor}</h4>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl">
                              <span className="text-[9px] font-mono text-slate-400 uppercase">Invoice Number</span>
                              <h4 className="text-xs font-black text-slate-900 mt-1">{parsedDocResult.invoice_number}</h4>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 bg-slate-50 rounded-2xl">
                              <span className="text-[9px] font-mono text-slate-400 uppercase">Calculated Amount</span>
                              <h4 className="text-sm font-black text-slate-900 mt-1">${Number(parsedDocResult.calculated_amount || 0).toFixed(2)}</h4>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl">
                              <span className="text-[9px] font-mono text-slate-400 uppercase">Tamper Likelihood</span>
                              <h4 className="text-sm font-black text-emerald-600 mt-1">{parsedDocResult.tamper_probability}</h4>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl">
                              <span className="text-[9px] font-mono text-slate-400 uppercase">Extraction Trust</span>
                              <h4 className="text-sm font-black text-[#a26da8] mt-1">{parsedDocResult.confidence}</h4>
                            </div>
                          </div>

                          <div className="p-4 bg-slate-50 rounded-2xl">
                            <span className="text-[9px] font-mono text-slate-400 uppercase block">Active Rule Matches</span>
                            <div className="flex gap-2 mt-2">
                              {parsedDocResult.active_rules_matched.map((r: string, idx: number) => (
                                <span key={idx} className="bg-slate-200/50 text-slate-700 text-[9px] font-mono font-black uppercase tracking-widest px-2.5 py-1 rounded">
                                  {r}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-80 flex flex-col items-center justify-center text-center text-slate-400">
                          <Database className="w-12 h-12 text-slate-200 mb-4" />
                          <p className="text-xs font-semibold uppercase tracking-widest text-slate-700">Studio Vacant</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-tight max-w-[280px] mt-1">Upload a document layout on the left to verify parser matching</p>
                        </div>
                      )}
                    </div>

                    {parsedDocResult && (
                      <button
                        onClick={() => {
                          toast.success('Fields injected into selected ERP template!');
                          setDocFile(null);
                          setParsedDocResult(null);
                        }}
                        className="w-full py-3.5 bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition cursor-pointer"
                      >
                        Push variables to Workspace Database
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* VIEW 8: Integration Lab (Config list) */}
              {selectedMenu === 'integration-lab' && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-8 select-none"
                >
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">Enterprise Integrations Laboratory</h2>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-1">Configure external system connectivity states</p>
                  </div>

                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] p-20 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-white shadow-sm rounded-[24px] flex items-center justify-center mb-6">
                      <Layers className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">No Active Integrations</h3>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-relaxed max-w-sm">
                      Sync your enterprise ERP, CRM, or document storage gateways to enable autonomous data extraction across the pipeline schema.
                    </p>
                    <button className="mt-8 px-8 py-4 bg-slate-950 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-black transition shadow-lg shadow-slate-200">
                      Connect System Gateway
                    </button>
                  </div>
                </motion.div>
              )}

              {/* VIEW 9: Observability (Logs Timeline reducer) */}
              {selectedMenu === 'observability' && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-8 select-none"
                >
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">System Observability Log Explorer</h2>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-1">Audit trail transitions executed inside the pure events reducer</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-2 bg-white border border-slate-100 p-8 rounded-[32px] shadow-sm flex flex-col justify-between">
                      <div className="space-y-6">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono block">SELECT RUN FOR ARCHIVE EXTRACTION</span>
                        <div className="space-y-4">
                          {executionsList.length === 0 ? (
                            <div className="p-8 border-2 border-dashed border-slate-100 rounded-[24px] text-center">
                              <Activity className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                                No archival telemetry discovered in the cold storage layer.
                              </p>
                            </div>
                          ) : (
                            executionsList.map((ex, idx) => {
                              const actualId = ex._id || ex.id;
                              return (
                                <div 
                                  key={actualId || idx}
                                  onClick={async () => {
                                    setSelectedExecution(ex);
                                    setExecutionEvents([]);
                                    const toastId = toast.loading('Extracting event log...');
                                    try {
                                      const res = await apiService.workflows.getExecutionEvents(actualId);
                                      if (res && res.success && res.data) {
                                        setExecutionEvents(res.data);
                                        toast.success('Event log extracted!', { id: toastId });
                                      } else if (res && Array.isArray(res)) {
                                        setExecutionEvents(res);
                                        toast.success('Event log extracted!', { id: toastId });
                                      } else {
                                        toast.error('No events found for this execution.', { id: toastId });
                                      }
                                    } catch (e: any) {
                                      toast.error(e.message || 'Failed to extract events', { id: toastId });
                                    }
                                  }}
                                  className={`p-4 border border-slate-100 rounded-2xl cursor-pointer transition flex items-center justify-between ${selectedExecution?._id === ex._id || selectedExecution?.id === ex.id ? 'border-[#a26da8] bg-[#a26da8]/5' : 'bg-slate-50 hover:bg-slate-100'}`}
                                >
                                  <div>
                                    <h4 className="text-xs font-black text-slate-900 uppercase">{ex.pipelineName}</h4>
                                    <span className="text-[10px] font-mono font-semibold text-slate-400">{actualId}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button 
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteExecution(actualId);
                                      }}
                                      className="p-2 hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition rounded-lg"
                                      title="Purge Record"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                    <ArrowRight className="w-4 h-4 text-slate-400" />
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-3 bg-white border border-slate-100 p-8 rounded-[32px] shadow-sm flex flex-col min-h-[500px]">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono border-b border-slate-50 pb-4 block">
                        RECONSTRUCTED TIMELINE STATE VIA REDUCER
                      </span>

                      {executionEvents.length > 0 ? (
                        <div className="space-y-6 pt-6 overflow-y-auto max-h-[400px]">
                          {executionEvents.map((ev, idx) => (
                            <div key={idx} className="flex gap-4 relative">
                              {idx < executionEvents.length - 1 && (
                                <div className="absolute top-8 left-4 bottom-[-16px] w-[2px] bg-slate-100" />
                              )}
                              <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black shrink-0 font-mono">
                                {ev.sequence}
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] font-mono font-black text-[#a26da8] uppercase tracking-widest block">
                                  {ev.event_type}
                                </span>
                                <h4 className="text-xs font-black text-slate-900">{ev.node_id || "Main Thread Boundary"}</h4>
                                <p className="text-[10px] font-semibold text-slate-400">{ev.desc}</p>
                                <span className="text-[9px] font-mono text-slate-400 block pt-0.5">{ev.time}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                          <Activity className="w-12 h-12 text-slate-200 mb-4 animate-pulse" />
                          <p className="text-xs font-semibold uppercase tracking-widest text-slate-700 font-bold">Observer Idle</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-tight max-w-[280px] mt-1">Select an active execution instance on the left to extract the events trace logs</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* VIEW 10: Access & Roles (Roles checklist) */}
              {selectedMenu === 'access-roles' && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-8 select-none"
                >
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">Access Control & Role Boundaries</h2>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-1">Audit team membership permissions under enterprise policy limits</p>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Full Name</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">System Role</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Affiliation Group</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Compliance Audit Clearance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Dynamically populated from enterprise roles registry */}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          )}
        </div>

      </main>

      <AnimatePresence>
        {executionIdToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white max-w-md w-full rounded-[32px] overflow-hidden shadow-2xl"
            >
              <div className="p-10 space-y-6">
                <div className="w-20 h-20 bg-rose-50 rounded-[28px] flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="w-10 h-10 text-rose-500" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Purge Execution Record?</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-semibold">
                    You are about to permanently delete this execution ledger from the system. This action <span className="text-rose-600 underline">cannot be undone</span> and will purge all associated telemetry and event logs.
                  </p>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                   <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                     <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest truncate">ID: {executionIdToDelete}</span>
                   </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setExecutionIdToDelete(null)}
                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl transition duration-300"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={performExecutionDelete}
                    className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition duration-300 shadow-lg shadow-rose-200"
                  >
                    Purge Record
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </div>
  );
};

export default AgentOrchestration;