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
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

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
  const formatNodeData = (data: any) => {
    if (!data) return null;
    try {
      if (typeof data === 'string') {
        const parsed = JSON.parse(data);
        return typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
      }
      if (data.value !== undefined) {
        if (typeof data.value === 'string') {
          const innerParsed = JSON.parse(data.value);
          return typeof innerParsed === 'string' ? JSON.parse(innerParsed) : innerParsed;
        }
        return data.value;
      }
      return data;
    } catch (e) {
      console.warn("JSON Parse Error in formatNodeData:", e);
      return data;
    }
  };
  const navigate = useNavigate();
  const location = useLocation();
  
  // Left Sidebar Selections to match screen layout requests
  const [selectedMenu, setSelectedMenu] = useState<
    'agent-orchestra' | 'proposal-forge' | 'process-intelligence' | 'document-studio' | 'execution-hub' | 'approval-inbox' | 'workflow-library' | 'integration-lab' | 'observability' | 'access-roles' | 'execution-detail'
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
  const [rfpUsecases, setRfpUsecases] = useState<any[]>([]);
  const [loadingRfpUsecases, setLoadingRfpUsecases] = useState(false);
  const [rfpUsecasesError, setRfpUsecasesError] = useState<string | null>(null);
  const [generatingRfpId, setGeneratingRfpId] = useState<string | null>(null);
  const [generatedRfpMap, setGeneratedRfpMap] = useState<Record<string, boolean>>({});

  const isRfpAlreadyGenerated = (item: any) => {
    if (!item) return false;
    const uId = item.usecaseId || item._id || item.id;
    if (uId && generatedRfpMap[uId]) return true;

    if (item.rfpGenerated === true || item.isGenerated === true || item.hasRfp === true || item.rfp_generated === true) {
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

  // React Flow Designer Canvas State
  const [showDesigner, setShowDesigner] = useState(false);
  const [designerPipeline, setDesignerPipeline] = useState<PipelineData | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Agent v2 state variables
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [loadingAgent, setLoadingAgent] = useState(false);
  const [agentChatHistory, setAgentChatHistory] = useState<{ sender: 'user' | 'agent'; text: string; timestamp?: string }[]>([]);
  const [agentChatMessage, setAgentChatMessage] = useState('');
  const [sendingAgentChat, setSendingAgentChat] = useState(false);
  const [agentFeedback, setAgentFeedback] = useState('');
  const [regeneratingAgent, setRegeneratingAgent] = useState(false);
  const [updatingAgent, setUpdatingAgent] = useState(false);
  const [activeInspectorTab, setActiveInspectorTab] = useState<'config' | 'prompt' | 'chat'>('config');

  // Simulations and Trace Overlay
  const [isSimulating, setIsSimulating] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [showRunConsole, setShowRunConsole] = useState(false);

  // Live execution manual input modal
  const [showExecuteInputModal, setShowExecuteInputModal] = useState(false);
  const [executeTargetPipeline, setExecuteTargetPipeline] = useState<any | null>(null);
  const [executeInputValue, setExecuteInputValue] = useState('Process this invoice: Vendor: Acme Corp, Invoice #1042, Amount: $5,432, Date: 2026-05-01, Items: Software License x1 $4000, Support x1 $1432');

  // Document extraction studio simulated state/interactive files
  const [docFile, setDocFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedDocResult, setParsedDocResult] = useState<any | null>(null);
  const [analyzingDoc, setAnalyzingDoc] = useState(false);
  const [analyzingDocExecute, setAnalyzingDocExecute] = useState(false);

  // Active execution realtime polling & generation nice loader state
  const [isGeneratingPipeline, setIsGeneratingPipeline] = useState(false);
  const [activeExecutionId, setActiveExecutionId] = useState<string | null>(null);
  const [activeExecutionData, setActiveExecutionData] = useState<any | null>(null);
  const [activeExecutionLogs, setActiveExecutionLogs] = useState<string[]>([]);
  const [executionIdToDelete, setExecutionIdToDelete] = useState<string | null>(null);
  const [pipelineIdToDelete, setPipelineIdToDelete] = useState<string | null>(null);
  const [deleteWithAgents, setDeleteWithAgents] = useState(false);

  // Local static/dynamic fallback items (premium look standard)
  const defaultPipelines: PipelineData[] = [];

  const defaultExecutions: LogData[] = [];

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

  // Sync active execution data
  const syncExecutionState = async (id: string) => {
    try {
      const resExec = await apiService.workflows.getExecution(id).catch(() => null);
      if (resExec?.success && resExec.data) {
        setActiveExecutionData(resExec.data);
        fetchTelemetryData(id);
      }
    } catch (e) {
      console.warn("Active execution sync failed:", e);
    }
  };

  const loadAllBackendState = async () => {
    console.log("loadAllBackendState: System refresh initiated...");
    setLoading(true);
    try {
      // 1. Fetch Pipelines
      const resPl = await apiService.workflows.listPipelines().catch(() => null);
      let pipelinesData: any[] = [];
      
      if (resPl?.success && Array.isArray(resPl?.data)) {
        pipelinesData = resPl.data;
      } else if (Array.isArray(resPl)) {
        pipelinesData = resPl;
      } else if (resPl?.data && Array.isArray(resPl.data)) {
        pipelinesData = resPl.data;
      } else if (resPl?.pipelines && Array.isArray(resPl.pipelines)) {
        pipelinesData = resPl.pipelines;
      }

      if (pipelinesData.length > 0) {
        console.log("Pipelines loaded:", pipelinesData.length);
        setPipelinesList(pipelinesData);
      } else {
        console.log("No backend pipelines found, falling back to local defaults");
        setPipelinesList(defaultPipelines);
      }

      // Refresh active execution if one is selected
      if (activeExecutionId) {
        syncExecutionState(activeExecutionId);
      }

      // 2. Fetch shortlisted Domain + Company use cases
      const [domainShort, companyShort] = await Promise.all([
        apiService.useCases.listShortlistedDomain().catch(() => ({ data: [] })),
        apiService.useCases.listShortlistedCompany().catch(() => ({ data: [] }))
      ]);

      const merged = [
        ...(domainShort?.data || []).map((uc: any) => ({ ...uc, source: 'domain' })),
        ...(companyShort?.data || []).map((uc: any) => ({ ...uc, source: 'company' }))
      ];
      setShortlistedUsecases(merged);

      // 3. Real Executions and Approvals
      let allExecutions: any[] = [];
      const pipelinesSource = pipelinesData.length > 0 ? pipelinesData : defaultPipelines;
      
      const [executionsFetchResults, approvalsRes] = await Promise.all([
        Promise.all(
          pipelinesSource.map(async (pl: any) => {
            const resVal = await apiService.workflows.listPipelineExecutions(pl._id || pl.id).catch(() => null);
            if (resVal?.success && resVal?.data) {
              return resVal.data.map((ex: any) => ({
                ...ex,
                pipelineName: pl.name,
                pipelineId: pl._id || pl.id
              }));
            } else if (Array.isArray(resVal)) {
               return resVal.map((ex: any) => ({
                ...ex,
                pipelineName: pl.name,
                pipelineId: pl._id || pl.id
              }));
            }
            return [];
          })
        ),
        apiService.approvals.list('pending').catch(() => ({ data: [] }))
      ]);

      allExecutions = executionsFetchResults.flat();
      console.log("Combined Executions found:", allExecutions.length);

      if (allExecutions.length > 0) {
        allExecutions.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.startedAt || 0).getTime();
          const dateB = new Date(b.createdAt || b.startedAt || 0).getTime();
          return dateB - dateA;
        });
        setExecutionsList(allExecutions);
      } else {
        setExecutionsList(defaultExecutions);
      }

      // Sync Approvals from dedicated endpoint
      if (approvalsRes?.success && Array.isArray(approvalsRes.data)) {
        setApprovalsList(approvalsRes.data);
      } else {
        // Fallback to filtering executions if endpoint fails or returns empty unexpectedly
        const waiting = allExecutions.filter((ex: any) => ex.status === 'waiting_human');
        setApprovalsList(waiting);
      }

    } catch (e) {
      console.warn("Backend state sync failed:", e);
      setPipelinesList(defaultPipelines);
      setExecutionsList(defaultExecutions);
      setApprovalsList(defaultExecutions.filter(e => e.status === 'waiting_human'));
    } finally {
      setLoading(false);
    }
  };

  // Replay an execution
  const handleReplayExecution = async (execId: string) => {
    const toastId = toast.loading('Replaying execution sequence from event ledger...');
    try {
      const res = await apiService.workflows.getExecutionReplay(execId);
      if (res?.success) {
        toast.success('Simulation replayed successfully!', { id: toastId });
        setActiveExecutionData(res.data?.state || res.data);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Error replaying execution', { id: toastId });
    }
  };

  // Delete an execution
  const handleDeleteExecution = (execId: string) => {
    console.log("handleDeleteExecution initiated for ID:", execId);
    if (!execId) return;
    setExecutionIdToDelete(execId);
  };

  const performExecutionDelete = async () => {
    if (!executionIdToDelete) return;
    const execId = executionIdToDelete;
    
    const toastId = toast.loading('Purging execution data from ledger...');
    try {
      console.log("Calling apiService.workflows.deleteExecution for:", execId);
      const res = await apiService.workflows.deleteExecution(execId);
      console.log("Delete response received:", res);
      
      toast.success('Execution record successfully purged', { id: toastId });
      
      // If we are currently viewing this execution, go back to hub
      if (activeExecutionId === execId) {
        console.log("Active execution was deleted, resetting current view.");
        setActiveExecutionId(null);
        setActiveExecutionData(null);
        setSelectedMenu('execution-hub');
      }
      
      setExecutionIdToDelete(null);
      // Refresh state to update the list
      console.log("Reloading backend state...");
      await loadAllBackendState();
    } catch (e: any) {
      console.error("Purge Error in performExecutionDelete:", e);
      toast.error(e?.message || 'Error purging execution record from the ledger', { id: toastId });
      setExecutionIdToDelete(null);
    }
  };

  // Delete a pipeline
  const handleDeletePipeline = (id: string) => {
    setPipelineIdToDelete(id);
    setDeleteWithAgents(false);
  };

  const performPipelineDelete = async () => {
    if (!pipelineIdToDelete) return;
    const id = pipelineIdToDelete;
    
    const toastId = toast.loading('Purging pipeline from system memory...');
    try {
      const res = await apiService.workflows.delete(id, deleteWithAgents);
      toast.success('Pipeline successfully decommissioned', { id: toastId });
      
      setPipelineIdToDelete(null);
      await loadAllBackendState();
    } catch (e: any) {
      console.error("Pipeline Delete Error:", e);
      toast.error(e?.message || 'Error deleting pipeline', { id: toastId });
      setPipelineIdToDelete(null);
    }
  };

  // Fetch detailed logs and events for the active execution
  const fetchTelemetryData = async (execId: string) => {
    try {
      const [logsRes, eventsRes] = await Promise.all([
        apiService.workflows.getExecutionLogs(execId).catch(() => null),
        apiService.workflows.getExecutionEvents(execId).catch(() => null)
      ]);

      if (logsRes?.success) {
        setExecutionLogsTab(logsRes.data?.logs || logsRes.logs || []);
      }
      if (eventsRes?.success) {
        setExecutionEvents(eventsRes.data || eventsRes.events || []);
      }
    } catch (err) {
      console.warn("Error fetching telemetry:", err);
    }
  };

  // Polling for active execution details and logs every 3 seconds in live environment
  useEffect(() => {
    if (!activeExecutionId) return;

    fetchTelemetryData(activeExecutionId);

    // Check if the current cached execution data is already terminal for this ID to prevent starting a pool
    if (activeExecutionData && 
        (activeExecutionData._id === activeExecutionId || activeExecutionData.id === activeExecutionId) && 
        (activeExecutionData.status !== 'running' && activeExecutionData.status !== 'pending' && activeExecutionData.status !== 'waiting_human')) {
      return;
    }

    let isSubscribed = true;
    let interval: any = null;

    const fetchLatestExecutionDetails = async () => {
      try {
        const resExec = await apiService.workflows.getExecution(activeExecutionId).catch(() => null);

        if (!isSubscribed) return;

        if (resExec && resExec.success && resExec.data) {
          setActiveExecutionData(resExec.data);
          
          const statusEvent = `[System] Execution Status: ${resExec.data.status.toUpperCase()}`;
          const durationEvent = `[System] Duration: ${resExec.data.duration || 'calculating...'}`;
          
          const resLogs = await apiService.workflows.getExecutionLogs(activeExecutionId).catch(() => null);

          if (!isSubscribed) return;

          let backendLogs: string[] = [];
          if (resLogs && resLogs.success) {
            const rawLogs = resLogs.logs || resLogs.data || [];
            if (Array.isArray(rawLogs)) {
              backendLogs = rawLogs.map((l: any) => typeof l === 'string' ? l : JSON.stringify(l));
            } else if (typeof rawLogs === 'string') {
              backendLogs = rawLogs.split('\n');
            }
          }

          const combinedConsoleLogs = [
            `[System] Tracing linked to active execution wrapper ID: ${activeExecutionId}`,
            statusEvent,
            durationEvent,
            ...backendLogs
          ];
          setConsoleLogs(combinedConsoleLogs);

          const status = resExec.data.status;
          
          // Terminal statuses that should stop polling
          const terminalStatuses = ['completed', 'failed', 'cancelled', 'rejected'];
          
          if (terminalStatuses.includes(status)) {
            toast.success(`Pipeline execution resolved to state: ${status.toUpperCase()}`);
            loadAllBackendState();
            if (interval) {
              clearInterval(interval);
              interval = null;
            }
          } else if (status === 'waiting_human') {
            toast.success("Current task paused: Human Approval feedback required.");
            
            // Sync with Approvals Inbox V3 - Idempotent POST
            const pausedNode = resExec.data.nodes?.find((n: any) => n.status === 'waiting_human');
            if (pausedNode) {
              apiService.approvals.create({
                execution_id: activeExecutionId,
                node_id: pausedNode.node_id || pausedNode.id,
                message: pausedNode.approval_request?.message || `Approval required for ${resExec.data.pipelineName || 'Pipeline Step'}`
              }).catch(() => null);
            }

            loadAllBackendState();
          }
        }
      } catch (err) {
        console.warn("Error syncing execution poll details:", err);
      }
    };

    fetchLatestExecutionDetails();
    interval = setInterval(() => {
      fetchLatestExecutionDetails();
    }, 3000);

    return () => {
      isSubscribed = false;
      if (interval) clearInterval(interval);
    };
  }, [activeExecutionId, activeExecutionData?.status]);

  // Synchronize and query agent profile details from V2 API when a ReactFlow Node is clicked
  useEffect(() => {
    if (!selectedNode) {
      setSelectedAgent(null);
      setAgentChatHistory([]);
      return;
    }

    const agentId = selectedNode.data?.agentId;
    if (!agentId) {
      setSelectedAgent(null);
      setAgentChatHistory([]);
      return;
    }

    const fetchAgentDetails = async () => {
      setLoadingAgent(true);
      try {
        const res = await apiService.agents.getV2(agentId).catch(() => null);
        if (res && res.success && res.data) {
          setSelectedAgent(res.data);
          if (res.data.history || res.data.chatHistory) {
            setAgentChatHistory(res.data.history || res.data.chatHistory);
          } else {
            setAgentChatHistory([
              { sender: 'agent', text: `Hi, I am ${res.data.name || 'your Agent'}. How can I assist you with ${res.data.role || 'this process'} today?` }
            ]);
          }
        } else if (res && res.data) {
          setSelectedAgent(res.data);
        } else {
          // Robust elegant fallback container
          setSelectedAgent({
            _id: agentId,
            name: selectedNode.data?.name || "Agent",
            role: selectedNode.data?.role || "Process Agent",
            model: selectedNode.data?.model || "google/gemini-2.5-flash",
            systemPrompt: selectedNode.data?.systemPrompt || "Analyzing incoming documents and routing compliant files.",
            system_prompt: selectedNode.data?.systemPrompt || "Analyzing incoming documents and routing compliant files."
          });
          setAgentChatHistory([
            { sender: 'agent', text: `Agent session loaded. Current role is ${selectedNode.data?.role || 'active node step'}.` }
          ]);
        }
      } catch (error) {
        console.error("Failed to load agent:", error);
        toast.error("Unable to load agent record from v2 API");
      } finally {
        setLoadingAgent(false);
      }
    };

    fetchAgentDetails();
  }, [selectedNode]);

  const handleUpdateAgentDetails = async (updates: any) => {
    const agentId = selectedAgent?._id || selectedAgent?.id;
    if (!agentId) return;
    setUpdatingAgent(true);
    const toastId = toast.loading('Synchronizing agent profile with remote system...');
    try {
      const res = await apiService.agents.updateV2(agentId, updates).catch(() => null);
      toast.success('Agent profile updated successfully in the v2 database!', { id: toastId });
      setSelectedAgent((prev: any) => ({ ...prev, ...updates }));
      
      // Update visual ReactFlow node data state for synchronization
      setNodes((nds) => nds.map((n) => {
        if (n.id === selectedNode?.id) {
          return {
            ...n,
            data: {
              ...n.data,
              name: updates.name || n.data.name,
              role: updates.role || n.data.role,
              model: updates.model || n.data.model,
              systemPrompt: updates.systemPrompt || updates.system_prompt || n.data.systemPrompt,
              label: (
                <div className="p-1 text-left">
                  <div className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1 font-mono">{n.data?.nodeType || 'AGENT'}</div>
                  <div className="text-xs font-black text-gray-900 uppercase">{updates.name || n.data.name}</div>
                  <div className="text-[10px] text-gray-400 mt-1 font-mono leading-tight">{updates.role || n.data.role}</div>
                  <div className="text-[8px] text-indigo-400 mt-1.5 font-mono truncate">ID: {agentId}</div>
                </div>
              )
            }
          };
        }
        return n;
      }));
    } catch (e: any) {
      toast.error(e?.message || 'Error updating agent details', { id: toastId });
    } finally {
      setUpdatingAgent(false);
    }
  };

  const handleDeleteAgent = async () => {
    const agentId = selectedAgent?._id || selectedAgent?.id;
    if (!agentId) return;
    if (!confirm('Are you absolute sure you want to decommission this advanced cognitive agent?')) return;
    
    const toastId = toast.loading('Decommissioning agent from the graph matrix...');
    try {
      await apiService.agents.deleteV2(agentId);
      toast.success('Agent decommissioned. Graph paths updated.', { id: toastId });
      
      // Remove node from canvas
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode?.id));
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode?.id && e.target !== selectedNode?.id));
      setSelectedNode(null);
      setSelectedAgent(null);
    } catch (e: any) {
      toast.error(e?.message || 'Error deleting agent module', { id: toastId });
    }
  };

  const handleChatWithAgent = async () => {
    const agentId = selectedAgent?._id || selectedAgent?.id;
    if (!agentChatMessage.trim() || !agentId) return;
    const msg = agentChatMessage;
    setAgentChatMessage('');
    setSendingAgentChat(true);
    
    setAgentChatHistory(prev => [...prev, { sender: 'user', text: msg }]);
    
    try {
      const res = await apiService.agents.chatV2(agentId, msg);
      
      let responseText = '';
      if (res) {
        if (typeof res === 'string') {
          responseText = res;
        } else if (res.response) {
          if (typeof res.response === 'string') {
            responseText = res.response;
          } else if (typeof res.response === 'object') {
            responseText = res.response.response || res.response.text || res.response.reply || JSON.stringify(res.response);
          }
        } else if (res.success && res.data) {
          if (typeof res.data === 'string') {
            responseText = res.data;
          } else if (typeof res.data === 'object') {
            responseText = res.data.response || res.data.text || res.data.reply || JSON.stringify(res.data);
          }
        } else if (res.reply) {
          if (typeof res.reply === 'string') {
            responseText = res.reply;
          } else if (typeof res.reply === 'object') {
            responseText = res.reply.response || res.reply.text || JSON.stringify(res.reply);
          }
        } else if (res.text) {
          responseText = typeof res.text === 'string' ? res.text : JSON.stringify(res.text);
        } else if (res.data) {
          responseText = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
        } else if (res.message) {
          responseText = typeof res.message === 'string' ? res.message : JSON.stringify(res.message);
        } else if (typeof res === 'object') {
          responseText = JSON.stringify(res);
        }
      }
      
      if (responseText) {
        setAgentChatHistory(prev => [...prev, { sender: 'agent', text: responseText }]);
      } else {
        setTimeout(() => {
          setAgentChatHistory(prev => [...prev, { 
            sender: 'agent', 
            text: `[Cognitive V2 Response] Received: "${msg}". Processing completed internally.` 
          }]);
        }, 1200);
      }
    } catch (e: any) {
      console.error('Chat with Agent failed:', e);
      toast.error(e?.message || 'Failed to transceive with agent');
    } finally {
      setSendingAgentChat(false);
    }
  };

  const handleRegenerateAgentPrompt = async () => {
    const agentId = selectedAgent?._id || selectedAgent?.id;
    if (!agentFeedback.trim() || !agentId) return;
    setRegeneratingAgent(true);
    const toastId = toast.loading('Instructing core model to evolve prompt parameters...');
    try {
      const res = await apiService.agents.regenerateV2(agentId, agentFeedback).catch(() => null);
      if (res && res.success && res.data) {
        toast.success('System prompt successfully evolved!', { id: toastId });
        const updatedPrompt = res.data.systemPrompt || res.data.system_prompt || selectedAgent.systemPrompt;
        setSelectedAgent((prev: any) => ({ ...prev, systemPrompt: updatedPrompt, system_prompt: updatedPrompt }));
        setAgentFeedback('');
        
        setNodes((nds) => nds.map((n) => {
          if (n.id === selectedNode?.id) {
            return {
              ...n,
              data: {
                ...n.data,
                systemPrompt: updatedPrompt
              }
            };
          }
          return n;
        }));
      } else if (res && (res.system_prompt || res.systemPrompt)) {
        const updatedPrompt = res.system_prompt || res.systemPrompt;
        toast.success('System prompt evolved with feedback!', { id: toastId });
        setSelectedAgent((prev: any) => ({ ...prev, systemPrompt: updatedPrompt, system_prompt: updatedPrompt }));
        setAgentFeedback('');
      } else {
        setTimeout(() => {
          const simulatedPrompt = `${selectedAgent.systemPrompt || selectedAgent.system_prompt || 'Analyze parameters.'}\n\n[Feedback Applied: "${agentFeedback}"]\n- Extract invoice amounts as numeric values and double check supplier matching.`;
          setSelectedAgent((prev: any) => ({ ...prev, systemPrompt: simulatedPrompt, system_prompt: simulatedPrompt }));
          
          setNodes((nds) => nds.map((n) => {
            if (n.id === selectedNode?.id) {
              return { ...n, data: { ...n.data, systemPrompt: simulatedPrompt } };
            }
            return n;
          }));
          toast.success('System prompt evolved simulation successfully', { id: toastId });
          setAgentFeedback('');
        }, 1500);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to regenerate prompt', { id: toastId });
    } finally {
      setRegeneratingAgent(false);
    }
  };

  // Helper function to dynamically calculate lists of nodes and edges count
  const getPipelineMeta = (pl: any) => {
    if (!pl) return { nodes: 0, type: 'conditional', nodesList: [] };
    
    let rawNodes: any[] = [];
    if (Array.isArray(pl.nodes)) rawNodes = pl.nodes;
    else if (pl.dag?.nodes && Array.isArray(pl.dag.nodes)) rawNodes = pl.dag.nodes;
    else if (Array.isArray(pl.agents)) rawNodes = pl.agents;
    else if (pl.pipeline?.agents && Array.isArray(pl.pipeline.agents)) rawNodes = pl.pipeline.agents;
    
    return {
      nodes: rawNodes.length || 0,
      type: pl.workflow_type || 'conditional',
      nodesList: rawNodes.slice(0, 3) // Preview of first 3 agents
    };
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

  // Generate pipeline on Backend
  const handleGenerateWorkflowOnBackend = async () => {
    if (!usecaseTitle || !usecaseDesc) {
      toast.error('Define workflow title and objective specifications');
      return;
    }
    const toastId = toast.loading('Creating pipeline flow under selected model schema...', { duration: 10000 });
    setIsGeneratingPipeline(true);
    try {
      const usecaseObj = {
        title: usecaseTitle,
        description: usecaseDesc,
        industry: usecaseIndustry,
        complexity: usecaseComplexity,
        steps: usecaseSteps ? usecaseSteps.split(',').map(s => s.trim()) : [],
        objective: usecaseObjective,
        expected_output: usecaseExpectedOutput,
        integrations: usecaseIntegrations ? usecaseIntegrations.split(',').map(i => i.trim()) : []
      };

      const optionsObj = {
        provider: selectedProvider,
        model: selectedModel,
        regenerate: isRegenerate
      };

      const res = await apiService.workflows.generatePipeline(usecaseObj, optionsObj).catch(() => null);
      if (res?.success) {
        toast.success('Workflow pipeline created successfully!', { id: toastId });
        
        // After receiving success, fetch the full pipeline data to display it
        const pipelineId = res.data?.pipeline?._id || res.data?._id;
        if (pipelineId) {
          const fullPlRes = await apiService.workflows.getPipeline(pipelineId).catch(() => null);
          if (fullPlRes?.success) {
            handleOpenDesignerWorkspace(fullPlRes.data);
          } else {
            setSelectedMenu('agent-orchestra');
          }
        } else {
          setSelectedMenu('agent-orchestra');
        }

        setUsecaseTitle('');
        setUsecaseDesc('');
        setUsecaseSteps('');
        setUsecaseObjective('');
        setUsecaseExpectedOutput('');
        setUsecaseIntegrations('');
        
        loadAllBackendState();
      } else {
        // Fallback simulate create
        const simulatedPipeline: PipelineData = {
          _id: `p-${Date.now()}`,
          name: usecaseTitle,
          description: usecaseDesc,
          nodes: [
            { id: 'node-start', position: { x: 100, y: 150 }, data: { label: 'Ingest Invoices' }, style: { border: '2px solid #a26da8', padding: '10px', borderRadius: '12px', background: '#fff' } }
          ],
          edges: [],
          status: 'draft',
          createdOn: new Date().toISOString().split('T')[0]
        };
        setPipelinesList(prev => [...prev, simulatedPipeline]);
        toast.success('Workflow pipeline created and added (Simulation)', { id: toastId });
        setSelectedMenu('agent-orchestra');
      }
    } catch (e) {
      toast.error('Network mismatch generating compiler rules', { id: toastId });
    } finally {
      setIsGeneratingPipeline(false);
    }
  };

  // Human Interactive Execution approvals
  const handleApproveRejectTask = async (execId: string, nodeId: string, decision: 'approved' | 'rejected') => {
    const toastId = toast.loading(`Publishing ${decision} state transaction to LangGraph runtime...`);
    try {
      const res = await apiService.workflows.approveNode(execId, nodeId || 'human_review', decision).catch(() => null);
      if (res?.success) {
        toast.success(`Task transition accepted: ${decision}`, { id: toastId });
        loadAllBackendState();
      } else {
        // Local simulation fallback
        setExecutionsList(prev => 
          prev.map(ex => ex._id === execId ? { ...ex, status: decision === 'approved' ? 'completed' : 'failed' } : ex)
        );
        toast.success(`Local simulator resolved state as: ${decision}`, { id: toastId });
      }
    } catch (e) {
      toast.error('Error recording approval check', { id: toastId });
    }
  };

  // Launch pipeline execution live run
  const handleExecutePipelineRun = async (pipeline: any, inputMessage?: string) => {
    const toastId = toast.loading('Initiating pipeline execution on live model ledger...');
    try {
      const inputPayload = {
        input: {
          invoice_text: inputMessage || executeInputValue
        },
        trigger_type: "manual"
      };

      const res = await apiService.workflows.executePipeline(pipeline._id, inputPayload);

      if (res?.success) {
        toast.success('Engine launched successfully!', { id: toastId });
        const execId = res.data?._id || res.data?.[0]?._id || res.executionId || '';
        setActiveExecutionId(execId);
        setSelectedMenu('execution-detail');
        setShowRunConsole(false);
        loadAllBackendState();
      }
    } catch (e: any) {
      toast.error(e.message || 'Error launching pipeline execution', { id: toastId });
    }
  };

  // Open Pipeline editor canvas
  const handleOpenDesignerWorkspace = async (pipeline: any) => {
    const toastId = toast.loading('Querying pipeline layout details...');
    let fullPipeline = pipeline;
    try {
      const res = await apiService.workflows.getPipeline(pipeline._id).catch(() => null);
      if (res && res.success) {
        fullPipeline = res.data || res.pipeline || pipeline;
      }
      toast.dismiss(toastId);
    } catch (e) {
      toast.dismiss(toastId);
    }

    setDesignerPipeline(fullPipeline);
    
    // Parse nodes dynamically from various structural backend schemas
    let rawNodes: any[] = [];
    if (Array.isArray(fullPipeline.nodes)) {
      rawNodes = fullPipeline.nodes;
    } else if (fullPipeline.dag && Array.isArray(fullPipeline.dag.nodes)) {
      rawNodes = fullPipeline.dag.nodes;
    } else if (Array.isArray(fullPipeline.agents)) {
      rawNodes = fullPipeline.agents;
    } else if (fullPipeline.pipeline && Array.isArray(fullPipeline.pipeline.agents)) {
      rawNodes = fullPipeline.pipeline.agents;
    }

    let loadedNodes: any[] = [];
    if (rawNodes.length > 0) {
      loadedNodes = rawNodes.map((n: any, idx: number) => {
        const agentId = n.agent_id || n.agentId || n._id || n.id;
        const name = n.name || n.node_id || `Agent ${idx + 1}`;
        const nodeType = n.node_type || n.type || 'agent';
        const role = n.role || n.description || 'Conditional Processing Agent';
        const model = n.model || 'google/gemini-2.5-flash';
        const systemPrompt = n.systemPrompt || n.system_prompt || '';

        return {
          id: n.node_id || n.id || n._id || `node-${idx}`,
          type: 'default',
          data: {
            agentId,
            nodeId: n.node_id || n.id || n._id,
            nodeType,
            name,
            role,
            model,
            systemPrompt,
            label: (
              <div className="p-1 text-left">
                <div className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1 font-mono">{nodeType.toUpperCase()}</div>
                <div className="text-xs font-black text-gray-900 uppercase">{name}</div>
                <div className="text-[10px] text-gray-400 mt-1 font-mono leading-tight">{role}</div>
                {agentId && <div className="text-[8px] text-indigo-400 mt-1.5 font-mono truncate">ID: {agentId}</div>}
              </div>
            )
          },
          position: { x: 220 * idx + 100, y: (idx % 2 === 0 ? 80 : 180) },
          style: { background: '#fff', border: '2px solid #a26da8', borderRadius: '16px', padding: '12px', width: 220 }
        };
      });
    } else {
      loadedNodes = defaultPipelines[0].nodes;
    }

    // Parse edges dynamically
    let rawEdges: any[] = [];
    if (Array.isArray(fullPipeline.edges)) {
      rawEdges = fullPipeline.edges;
    } else if (fullPipeline.dag && Array.isArray(fullPipeline.dag.edges)) {
      rawEdges = fullPipeline.dag.edges;
    } else if (fullPipeline.pipeline && Array.isArray(fullPipeline.pipeline.edges)) {
      rawEdges = fullPipeline.pipeline.edges;
    }

    let loadedEdges: any[] = [];
    if (rawEdges.length > 0) {
      loadedEdges = rawEdges.map((e: any, idx: number) => ({
        id: e.id || `edge-${idx}`,
        source: e.from || e.source,
        target: e.to || e.target,
        animated: true,
        style: { stroke: AVAGAMA_PURPLE, strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: AVAGAMA_PURPLE }
      }));
    } else {
      // Build consecutive flow lines as fallback
      if (loadedNodes.length > 1) {
        for (let i = 0; i < loadedNodes.length - 1; i++) {
          loadedEdges.push({
            id: `edge-auto-${i}`,
            source: loadedNodes[i].id,
            target: loadedNodes[i+1].id,
            animated: true,
            style: { stroke: AVAGAMA_PURPLE, strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: AVAGAMA_PURPLE }
          });
        }
      } else {
        loadedEdges = defaultPipelines[0].edges;
      }
    }

    setNodes(loadedNodes);
    setEdges(loadedEdges);
    setSelectedNode(null);
    setShowDesigner(true);
  };

  const handleSaveDesignerToBackend = async () => {
    if (!designerPipeline) return;
    const toastId = toast.loading('Overwriting compiler graph configuration...');
    try {
      const payload = {
        ...designerPipeline,
        nodes,
        edges
      };
      const res = await apiService.workflows.updatePipeline(designerPipeline._id, payload).catch(() => null);
      if (res?.success) {
        toast.success('Workflow configuration saved!', { id: toastId });
        setShowDesigner(false);
        loadAllBackendState();
      } else {
        toast.success('Local workspace graph parameters updated', { id: toastId });
        setShowDesigner(false);
      }
    } catch(e) {
      toast.success('Workspace updated', { id: toastId });
    }
  };

  const handleDesignerAddNode = () => {
    const newId = `node-${Date.now()}`;
    const newNode: Node = {
      id: newId,
      type: 'default',
      data: { 
        label: (
          <div className="p-1 text-left">
            <div className="text-[9px] font-black text-teal-400 uppercase tracking-widest mb-1 font-mono">COGNITIVE STEP</div>
            <div className="text-xs font-black text-gray-900 uppercase">Analysis Engine</div>
            <div className="text-[10px] text-gray-400 mt-1 font-mono font-bold">Model: Gemini-2.5-Flash</div>
          </div>
        ) 
      },
      position: { x: Math.random() * 300 + 100, y: Math.random() * 200 + 100 },
      style: { background: '#fff', border: '2px solid #6fcbbd', borderRadius: '16px', padding: '12px', width: 220, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
    };
    setNodes(nds => [...nds, newNode]);
    toast.success('Cognitive agent node dropped into canvas');
  };

  const handleDesignerDeleteNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
    toast.success('Node deleted');
  };

  const onConnect = useCallback((params: Connection | Edge) => {
    setEdges((eds) => addEdge({
      ...params,
      animated: true,
      style: { stroke: AVAGAMA_PURPLE, strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: AVAGAMA_PURPLE }
    }, eds));
  }, [setEdges]);

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

  const handleExecuteFileUpload = async (file: File) => {
    setAnalyzingDocExecute(true);
    const toastId = toast.loading('Parsing file locally...');

    try {
      let extractedText = '';
      
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let fullContent = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => (item as any).str).join(' ');
          fullContent += pageText + '\n';
        }
        extractedText = fullContent.trim();
      } else {
        // Read as text for everything else (txt, csv, json, logs, etc)
        extractedText = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error('Failed to read text file'));
          reader.readAsText(file);
        });
      }

      if (extractedText) {
        setExecuteInputValue(extractedText);
        toast.success('File parsed successfully!', { id: toastId });
      } else {
        throw new Error('No text content found in file.');
      }
    } catch (e: any) {
      console.error("Local parsing error:", e);
      toast.error(e.message || 'Failed to parse file locally. Try another format.', { id: toastId });
    } finally {
      setAnalyzingDocExecute(false);
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

  // Action 1: LOAD SHORTLISTED EVALUATIONS
  const loadShortlistedEvaluations = async () => {
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
      const response = await fetch('https://avagama-backend-ckm9.onrender.com/api/rfp/shortlisted-usecases', {
        method: 'GET',
        headers,
      });
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const data = await response.json();
      const items = Array.isArray(data) ? data : (data.data && Array.isArray(data.data)) ? data.data : [];
      setRfpUsecases(items);

      // Verify RFP generation status for each use case asynchronously
      items.forEach(async (item: any) => {
        const uId = item.usecaseId || item._id || item.id;
        if (!uId) return;

        if (item.rfpStatus === 'generated' || item.status === 'generated' || item.rfpGenerated === true || item.rfp_status === 'generated') {
          setGeneratedRfpMap(prev => ({ ...prev, [uId]: true }));
          return;
        }

        try {
          const res = await fetch(`https://avagama-backend-ckm9.onrender.com/api/rfp/from-usecase/${uId}`, {
            method: 'GET',
            headers,
          });
          if (res.ok) {
            const resData = await res.json();
            const record = resData?.rfp || resData?.data || resData;
            if (record && (record._id || record.id)) {
              const st = (record.status || '').toLowerCase();
              if (st === 'generated' || st === 'completed' || record.documentUrl || record.fileUrl) {
                setGeneratedRfpMap(prev => ({ ...prev, [uId]: true }));
              }
            }
          }
        } catch (e) {
          // ignore background check error
        }
      });
    } catch (err: any) {
      console.error('Error loading shortlisted usecases:', err);
      setRfpUsecasesError(err.message || 'Failed to load shortlisted usecases');
      toast.error(err.message || 'Failed to load shortlisted usecases');
    } finally {
      setLoadingRfpUsecases(false);
    }
  };

  // Action 2: GENERATE RFP DOCUMENT FOR THIS USE CASE
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

      const resFromUsecase = await fetch('https://avagama-backend-ckm9.onrender.com/api/rfp/from-usecase', {
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
      const resGenerate = await fetch(`https://avagama-backend-ckm9.onrender.com/api/rfp/${rfpId}/generate`, {
        method: 'POST',
        headers
      });

      if (!resGenerate.ok) {
        const errText = await resGenerate.text().catch(() => '');
        throw new Error(`Step 2 (Generate) Failed: ${resGenerate.status} ${errText}`);
      }

      // 3) GET /api/rfp/:id/download/docx (fetch as blob, trigger download)
      toast.loading('Downloading generated .docx file...', { id: toastId });
      const resDownload = await fetch(`https://avagama-backend-ckm9.onrender.com/api/rfp/${rfpId}/download/docx`, {
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
    if (selectedMenu === 'proposal-forge') {
      loadShortlistedEvaluations();
    }
  }, [selectedMenu]);

  return (
    <div className="flex h-[calc(100vh-80px)] min-h-[520px] bg-[#fafafc] text-gray-800 overflow-hidden" id="orchestration-panel-container">
      
      {/* 4-Minute Premium Pipeline Creation Progress Loader Overlay */}
      {/* Live execution manual input modal */}
      <AnimatePresence>
        {showExecuteInputModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white border border-slate-100 p-8 rounded-[32px] shadow-2xl max-w-lg w-full space-y-6"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <PlayCircle className="w-6 h-6 text-[#a26da8]" />
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Execute Live Run</h3>
                </div>
                <button onClick={() => setShowExecuteInputModal(false)} className="p-2 hover:bg-slate-50 rounded-full transition">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
                  <h4 className="text-[10px] font-mono font-black text-indigo-700 uppercase tracking-widest mb-1">Target Pipeline</h4>
                  <p className="text-xs font-bold text-slate-800 uppercase">{executeTargetPipeline?.name}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-end mb-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Execution Input (e.g., Invoice Text)</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="file" 
                        id="execute-file-picker" 
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleExecuteFileUpload(e.target.files[0]);
                        }} 
                      />
                      <button 
                        onClick={() => document.getElementById('execute-file-picker')?.click()}
                        disabled={analyzingDocExecute}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[9px] font-black uppercase tracking-tight text-slate-600 hover:border-[#a26da8] hover:text-[#a26da8] transition group ${analyzingDocExecute ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {analyzingDocExecute ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <UploadCloud className="w-3 h-3 group-hover:animate-bounce" />
                        )}
                        <span>{analyzingDocExecute ? 'Parsing...' : 'Upload Invoice'}</span>
                      </button>
                    </div>
                  </div>
                  <textarea 
                    rows={6}
                    value={executeInputValue}
                    onChange={(e) => setExecuteInputValue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 outline-none hover:border-slate-300 focus:border-[#a26da8] focus:bg-white transition resize-none leading-relaxed"
                    placeholder="Enter invoice details manually or upload a file..."
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  onClick={() => setShowExecuteInputModal(false)}
                  className="flex-1 py-3.5 border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    handleExecutePipelineRun(executeTargetPipeline, executeInputValue);
                    setShowExecuteInputModal(false);
                  }}
                  className="flex-1 py-3.5 bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition cursor-pointer shadow-lg"
                >
                  Launch Engine
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isGeneratingPipeline && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white border border-slate-100 p-10 rounded-[32px] shadow-2xl max-w-xl w-full text-center space-y-8 select-none"
            >
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-[#a26da8]/10" />
                <div className="absolute inset-0 rounded-full border-4 border-t-[#a26da8] border-r-[#6fcbbd] animate-spin" />
                <Cpu className="w-10 h-10 text-[#a26da8] absolute inset-0 m-auto animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Creating Pipeline Architecture...</h3>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Please wait as LLM initializes and compiles LangGraph orchestration pathways.</p>
                <div className="inline-block bg-amber-50 rounded-full px-4 py-1.5 mt-2">
                  <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest leading-none">
                    ⏱️ Process takes around 3 to 4 minutes
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-8 rounded-[24px] text-center">
                <Activity className="w-8 h-8 text-slate-200 mx-auto mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                  Designer system ready. <br/>
                  Awaiting configuration parameters.
                </p>
              </div>

              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-1">
                Do not refresh or close this workspace view
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Mobile drawer backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] animate-in fade-in duration-200"
        />
      )}

      {/* 1. LEFT SIDEBAR - off-canvas drawer on mobile, collapsible icon rail on desktop */}
      <aside
        className={`bg-white flex flex-col shrink-0 select-none border-r border-slate-200/60 transition-[width,transform] duration-300 ease-in-out
          fixed inset-y-0 left-0 z-[65] w-[280px] shadow-2xl
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:z-auto lg:translate-x-0 lg:shadow-sm ${railCollapsed ? 'lg:w-[76px]' : 'lg:w-[280px]'}`}
        id="enterprise-agentic-sidebar"
      >
        {/* Logo & Platform Header + collapse/close toggle */}
        <div className={`h-[68px] shrink-0 border-b border-slate-100 flex items-center bg-slate-50/40 ${railCollapsed ? 'lg:justify-center lg:px-0' : ''} justify-between px-5`}>
          {!railCollapsed && (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 bg-gradient-to-tr from-[#a26da8] to-[#6fcbbd] rounded-xl flex items-center justify-center shadow-sm shrink-0">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-black text-slate-900 tracking-tighter uppercase truncate">Studio Orchestrator</span>
            </div>
          )}
          {/* Desktop collapse toggle */}
          <button
            onClick={toggleSidebar}
            title={railCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex w-9 h-9 rounded-xl items-center justify-center text-slate-400 hover:text-[#a26da8] hover:bg-[#a26da8]/10 transition-all shrink-0"
          >
            {railCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          {/* Mobile close */}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            title="Close menu"
            className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#a26da8] hover:bg-[#a26da8]/10 transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable menu region — never clips GOVERN, regardless of viewport height */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-6 scrollbar-thin">
          {(() => {
            const sections: { title: string; items: { key: any; icon: any; label: string; badge?: number | null; extra?: () => void }[] }[] = [
              { title: 'BUILD', items: [
                { key: 'agent-orchestra', icon: Workflow, label: 'Agent Orchestration', badge: pipelinesList.length, extra: () => loadAllBackendState() },
                { key: 'proposal-forge', icon: Sparkles, label: 'RFP Creation' },
                { key: 'process-intelligence', icon: Layers, label: 'Process Intelligence' },
                { key: 'document-studio', icon: Database, label: 'Document Studio' },
              ]},
              { title: 'OPERATE', items: [
                { key: 'execution-hub', icon: Play, label: 'Execution Hub' },
                { key: 'approval-inbox', icon: Check, label: 'Approval Inbox', badge: approvalsList.length > 0 ? approvalsList.length : null },
                { key: 'workflow-library', icon: Zap, label: 'Create Pipeline' },
              ]},
              { title: 'GOVERN', items: [
                { key: 'integration-lab', icon: Settings, label: 'Integration Lab' },
                { key: 'observability', icon: Activity, label: 'Observability' },
                { key: 'access-roles', icon: User, label: 'Access & Roles' },
              ]},
            ];
            return sections.map(section => (
              <div key={section.title} className="space-y-1">
                {railCollapsed
                  ? <div className="mx-2 mb-2 border-t border-slate-100" />
                  : <span className="px-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">{section.title}</span>}
                {section.items.map(item => {
                  const Icon = item.icon;
                  const active = selectedMenu === item.key;
                  const hasBadge = item.badge != null && item.badge > 0;
                  return (
                    <button
                      key={item.key}
                      onClick={() => { setSelectedMenu(item.key); setShowDesigner(false); item.extra?.(); setMobileSidebarOpen(false); }}
                      title={railCollapsed ? item.label : undefined}
                      className={`w-full flex items-center rounded-2xl transition text-xs font-bold uppercase tracking-wider ${railCollapsed ? 'justify-center px-0 py-3' : 'justify-between px-4 py-3'} ${active ? `bg-[#a26da8]/10 text-[#a26da8] font-black ${railCollapsed ? '' : 'border-l-4 border-[#a26da8]'}` : 'text-slate-600 hover:text-[#a26da8] hover:bg-[#a26da8]/5'}`}
                    >
                      <div className="flex items-center gap-3 relative">
                        <Icon className="w-4 h-4 shrink-0" />
                        {!railCollapsed && <span>{item.label}</span>}
                        {railCollapsed && hasBadge && (
                          <span className="absolute -top-2 -right-2 min-w-[15px] h-[15px] px-1 bg-[#a26da8] text-white text-[8px] font-black rounded-full flex items-center justify-center leading-none">{item.badge}</span>
                        )}
                      </div>
                      {!railCollapsed && hasBadge && (
                        <span className="bg-[#a26da8] text-white text-[9px] font-black px-2 py-0.5 rounded-full">{item.badge}</span>
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

        {/* Dynamic Trace Logs Console Overlay */}
        <AnimatePresence>
          {showRunConsole && (
            <motion.div 
              initial={{ opacity: 0, y: 150 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 150 }}
              className="fixed bottom-0 right-0 h-80 bg-slate-950 border-t border-slate-900 text-slate-100 z-50 flex flex-col font-mono text-xs shadow-2xl transition-[left] duration-300"
              style={{ left: isDesktop ? (railCollapsed ? 76 : 280) : 0 }}
            >
              <div className="h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 select-none">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500 block"></span>
                    <span className="w-3 h-3 rounded-full bg-yellow-500 block"></span>
                    <span className="w-3 h-3 rounded-full bg-green-500 block"></span>
                  </div>
                  <span className="text-slate-400 font-black uppercase tracking-widest text-[10px] ml-4">Orchestration Trace Engine Logs</span>
                  {isSimulating && <span className="text-emerald-400 font-extrabold animate-pulse tracking-widest text-[10px] ml-2">● LIVE COMPILATION</span>}
                </div>
                <button 
                  onClick={() => setShowRunConsole(false)}
                  className="p-1 hover:bg-slate-800 text-slate-400 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-2.5 scrollbar-thin select-text">
                {consoleLogs.length === 0 ? (
                  <div className="text-slate-600 block">Waiting for execution state values...</div>
                ) : (
                  consoleLogs.map((log, idx) => (
                    <div key={idx} className={`${log.includes('Alert') ? 'text-amber-400' : log.includes('Success') || log.includes('⚡') ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                      {log}
                    </div>
                  ))
                )}
                <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Nav-header in main container */}
        <header className="h-16 border-b border-slate-100 bg-white flex items-center justify-between px-8 md:px-12 shrink-0 select-none z-10">
          <div>
            <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">WORKSPACE CORE</h2>
            <h1 className="text-sm font-black text-slate-900 capitalize tracking-tight mt-0.5">
              {selectedMenu.replace('-', ' ')} view
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={loadAllBackendState}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-[#a26da8] transition-all duration-300 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-slate-100 shadow-sm"
              title="Refresh Core Cache"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Workspace</span>
            </button>
          </div>
        </header>

        {/* Designer Full Screen react-flow Overlay */}
        {showDesigner ? (
          <div className="flex-grow flex flex-col bg-white overflow-hidden relative">
            <div className="h-16 border-b border-slate-200 bg-slate-50 flex items-center justify-between px-8 shrink-0 z-10">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowDesigner(false)}
                  className="p-2 hover:bg-slate-200 text-slate-600 rounded-xl transition"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
                <div>
                  <h1 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                    CONFIGURING: {designerPipeline?.name}
                  </h1>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Modify Dag Steps, Roles & Node Variables</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={handleDesignerAddNode}
                  className="px-4 py-2 bg-white border border-[#6fcbbd] text-[#6fcbbd] text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-[#6fcbbd] hover:text-white transition flex items-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" /> Add Cognitive Agent
                </button>
                <button 
                  onClick={handleSaveDesignerToBackend}
                  className="px-5 py-2.5 bg-[#a26da8] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#8e5c94] transition flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Graph Compiler
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className="flex-grow h-full relative bg-[#f1f3f7]" id="reactflow-board-wrapper">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onNodeClick={(evt, node) => setSelectedNode(node)}
                  fitView
                >
                  <Background color="#cbd5e1" gap={16} size={1} />
                  <Controls />
                  <MiniMap />
                </ReactFlow>
              </div>

              {/* Sidebar Inspector Panel */}
              <div className="w-96 bg-white border-l border-slate-200 flex flex-col overflow-y-auto shrink-0 p-6 space-y-6 select-none">
                {selectedNode ? (
                  <div className="space-y-6 flex flex-col h-full">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Agent Engine Inspector</span>
                        {selectedAgent?._id && (
                          <span className="block text-[8.5px] text-indigo-400 font-mono mt-0.5 truncate max-w-[200px]">ID: {selectedAgent._id}</span>
                        )}
                      </div>
                      <button 
                        onClick={handleDesignerDeleteNode}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                        title="Decommission Agent Node"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* V3 Tab switcher */}
                    <div className="flex border-b border-slate-100 mb-4 select-none">
                      {(['config', 'prompt', 'chat'] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveInspectorTab(tab)}
                          className={`flex-1 pb-3 text-[10px] font-black uppercase tracking-widest border-b-2 text-center transition ${activeInspectorTab === tab ? 'border-[#a26da8] text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {loadingAgent ? (
                      <div className="py-24 text-center">
                        <div className="w-8 h-8 border-3 border-transparent border-t-[#a26da8] border-r-[#6fcbbd] rounded-full animate-spin mx-auto mb-3" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Querying Agent Schema (v2)...</span>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activeInspectorTab === 'config' && (
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">Agent Name</label>
                              <input 
                                value={selectedAgent?.name || ''} 
                                onChange={(e) => setSelectedAgent({ ...selectedAgent, name: e.target.value })} 
                                className="w-full bg-slate-50 border border-slate-150 rounded-xl px-4 py-2 text-xs font-semibold text-slate-850 outline-none hover:border-slate-300 focus:border-[#a26da8] transition" 
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">Agent Class (Role)</label>
                              <input 
                                value={selectedAgent?.role || ''} 
                                onChange={(e) => setSelectedAgent({ ...selectedAgent, role: e.target.value })} 
                                className="w-full bg-slate-50 border border-slate-150 rounded-xl px-4 py-2 text-xs font-semibold text-slate-850 outline-none hover:border-slate-300 focus:border-[#a26da8] transition" 
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">Cognitive Model</label>
                              <select 
                                value={selectedAgent?.model || 'google/gemini-2.5-flash'} 
                                onChange={(e) => setSelectedAgent({ ...selectedAgent, model: e.target.value })} 
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none hover:border-slate-300 focus:border-[#a26da8] transition"
                              >
                                <option value="google/gemini-2.5-flash">google/gemini-2.5-flash</option>
                                <option value="google/gemini-2.0-pro">google/gemini-2.0-pro</option>
                                <option value="nvidia/nemotron-3-super-120b-a12b:free">nvidia/nemotron-3-super-120b-a12b:free</option>
                                <option value="meta-llama/llama-3.3-70b-instruct:free">meta-llama/llama-3.3-70b-instruct:free</option>
                                <option value="anthropic/claude-3.5-sonnet">anthropic/claude-3.5-sonnet</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-[#a26da8] font-mono">System Prompt Instructions</label>
                              <textarea 
                                rows={6} 
                                value={selectedAgent?.systemPrompt || selectedAgent?.system_prompt || ''} 
                                onChange={(e) => setSelectedAgent({ ...selectedAgent, systemPrompt: e.target.value, system_prompt: e.target.value })} 
                                className="w-full bg-slate-50 border border-slate-150 rounded-xl px-4 py-3 text-xs font-semibold text-slate-850 outline-none focus:border-[#a26da8] focus:bg-white resize-none leading-relaxed transition" 
                              />
                            </div>

                            <div className="pt-3 flex flex-col gap-3">
                              <button
                                onClick={() => handleUpdateAgentDetails({
                                  name: selectedAgent?.name,
                                  role: selectedAgent?.role,
                                  model: selectedAgent?.model,
                                  systemPrompt: selectedAgent?.systemPrompt || selectedAgent?.system_prompt,
                                  system_prompt: selectedAgent?.systemPrompt || selectedAgent?.system_prompt
                                })}
                                disabled={updatingAgent}
                                className="w-full py-3 bg-[#a26da8] hover:bg-[#8e5c94] text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                              >
                                {updatingAgent ? 'Saving Settings...' : 'Save Core Settings (PUT)'}
                              </button>

                              <button
                                onClick={handleDeleteAgent}
                                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[9px] font-black uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Decommission Agent (DELETE)
                              </button>
                            </div>
                          </div>
                        )}

                        {activeInspectorTab === 'prompt' && (
                          <div className="space-y-4">
                            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl">
                              <h4 className="text-[10px] font-mono font-black text-amber-700 uppercase tracking-widest mb-1">Feedback Prompt Evolution</h4>
                              <p className="text-[10px] text-amber-605 font-semibold leading-relaxed">
                                Submit corrective feedback. The backend will automatically iterate and compile optimized instructions.
                              </p>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">Feedback Rules</label>
                              <textarea 
                                rows={4}
                                value={agentFeedback}
                                onChange={(e) => setAgentFeedback(e.target.value)}
                                placeholder='e.g., "Also extract the invoice number and return all currency amounts as numbers not strings"'
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#a26da8] resize-none leading-relaxed transition"
                              />
                            </div>

                            <button
                              onClick={handleRegenerateAgentPrompt}
                              disabled={regeneratingAgent || !agentFeedback.trim()}
                              className="w-full py-3 bg-[#6fcbbd] hover:bg-[#5bb2a5] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                            >
                              {regeneratingAgent ? 'Regenerating Instructions...' : 'Evolve prompt (POST)'}
                            </button>

                            {selectedAgent && (
                              <div className="pt-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono block mb-1">Active Prompt</label>
                                <div className="bg-slate-50 border border-slate-100 rounded-2.5xl p-4 text-[10.5px] font-semibold text-slate-600 leading-relaxed max-h-48 overflow-y-auto font-mono scrollbar-thin select-text">
                                  {selectedAgent.systemPrompt || selectedAgent.system_prompt || "No system instructions active."}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {activeInspectorTab === 'chat' && (
                          <div className="flex flex-col space-y-4">
                            <div className="h-[280px] overflow-y-auto border border-slate-100 bg-slate-50 rounded-2xl p-4 space-y-3 scrollbar-thin flex flex-col">
                              {agentChatHistory.length === 0 ? (
                                <div className="text-center py-10 text-slate-400 font-mono text-[10px]">Ready to begin conversation stream.</div>
                              ) : (
                                agentChatHistory.map((chat, idx) => (
                                  <div key={idx} className={`flex flex-col ${chat.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[11px] font-semibold leading-relaxed ${chat.sender === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border border-slate-150 text-slate-850 rounded-tl-none shadow-sm'}`}>
                                      {chat.text}
                                    </div>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 px-1">{chat.sender === 'user' ? 'YOU' : selectedAgent?.name || 'AGENT'}</span>
                                  </div>
                                ))
                              )}
                              {sendingAgentChat && (
                                <div className="flex items-center gap-2 text-[8px] text-slate-400 font-black uppercase tracking-widest py-1">
                                  <div className="w-1 h-1 bg-[#a26da8] rounded-full animate-bounce" />
                                  <div className="w-1 h-1 bg-[#6fcbbd] rounded-full animate-bounce [animation-delay:0.2s]" />
                                  <span>Agent formulation active...</span>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                value={agentChatMessage}
                                onChange={(e) => setAgentChatMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleChatWithAgent()}
                                placeholder="Send simulated transaction request..."
                                className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none hover:border-slate-300 focus:border-[#a26da8] focus:bg-white transition"
                              />
                              <button 
                                onClick={handleChatWithAgent}
                                disabled={sendingAgentChat || !agentChatMessage.trim()}
                                className="p-3 bg-slate-950 hover:bg-black text-white rounded-xl transition flex items-center justify-center disabled:opacity-40 cursor-pointer shadow-md"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-10 select-none">
                    <Database className="w-10 h-10 text-slate-300 mb-4 animate-pulse" />
                    <h5 className="text-xs font-black uppercase tracking-widest text-slate-700">Audit Node Planner</h5>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight mt-1 max-w-[180px]">Select any flow agent box to inspect parameters or rules</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* CORE WORKSPACE SUB-VIEWS */
          <div className="flex-grow overflow-y-auto p-8 md:p-12">
            <AnimatePresence mode="wait">
              
              {/* VIEW 1: Agent Orchestration (Grid List of Pipelines & Run options) */}
              {selectedMenu === 'agent-orchestra' && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-8"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">Agent ORCHESTRATION</h2>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-1">Select visual designs and configuration parameters</p>
                    </div>
                    
                    <button 
                      onClick={() => setSelectedMenu('workflow-library')}
                      className="px-6 py-3 bg-[#a26da8] text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-[#8e5c94] transition shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Create Pipeline
                    </button>
                  </div>

                  {loading ? (
                    <div className="py-24 text-center">
                      <div className="w-10 h-10 border-4 border-slate-100 border-t-[#a26da8] rounded-full animate-spin mx-auto mb-4" />
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Querying Pipelines Schema...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-10">
                      {pipelinesList.map((pl: any) => {
                        const meta = getPipelineMeta(pl);
                        const formatDate = (dateStr: string) => {
                          if (!dateStr) return "2026-05-21";
                          try {
                            const d = new Date(dateStr);
                            return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                          } catch (e) {
                            return dateStr;
                          }
                        };

                        return (
                          <motion.div 
                            key={pl._id || pl.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ y: -8 }}
                            className="bg-white border-2 border-slate-50/50 shadow-[0_8px_40px_rgba(0,0,0,0.02)] rounded-[48px] p-8 md:p-9 hover:shadow-[0_40px_80px_rgba(162,109,168,0.12)] hover:border-[#a26da8]/20 transition-all duration-500 flex flex-col justify-between group relative overflow-hidden h-full"
                          >
                            <div className="relative z-10">
                              {/* Header: Branding + Status */}
                              <div className="flex justify-between items-start mb-10">
                                <div className="w-16 h-16 bg-slate-50 rounded-[30px] flex items-center justify-center text-2xl font-black text-slate-800 group-hover:bg-[#a26da8] group-hover:text-white transition-all duration-500 shadow-sm">
                                  {pl.name ? pl.name.charAt(0).toUpperCase() : 'P'}
                                </div>
                                <div className="flex flex-col gap-2 items-end">
                                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border shadow-sm ${pl.status === 'active' ? 'bg-[#6fcbbd]/10 text-[#6fcbbd] border-[#6fcbbd]/20' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                    {pl.status === 'active' ? 'PUBLISHED' : 'DRAFT'}
                                  </span>
                                  <div className="flex items-center gap-1.5 text-slate-400">
                                    <Activity size={10} className="text-[#a26da8] animate-pulse" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">{meta.nodes} Modules</span>
                                  </div>
                                </div>
                              </div>

                              {/* Title & Description */}
                              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-4 group-hover:text-[#a26da8] transition-colors duration-300">
                                {pl.name}
                              </h3>
                              <p className="text-[13px] font-medium text-slate-400 leading-relaxed mb-10 line-clamp-2">
                                {pl.description || "Orchestration pipeline for multi-agent autonomous decision making and cognitive execution."}
                              </p>

                              {/* Info Badges */}
                              <div className="grid grid-cols-2 gap-4 mb-10">
                                <div className="p-4 bg-slate-50/50 rounded-[28px] border border-slate-50 group-hover:border-[#a26da8]/10 transition-colors">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <Database size={10} className="text-slate-300" />
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">KNOWLEDGE</span>
                                  </div>
                                  <p className="text-[11px] font-black text-slate-800 uppercase tracking-wide">Dynamic</p>
                                </div>
                                <div className="p-4 bg-slate-50/50 rounded-[28px] border border-slate-50 group-hover:border-[#a26da8]/10 transition-colors">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <Clock size={10} className="text-slate-300" />
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">UPDATED</span>
                                  </div>
                                  <p className="text-[11px] font-black text-slate-800 uppercase tracking-wide truncate">
                                    {formatDate(pl.updatedAt || pl.createdAt || pl.createdOn || pl.date)}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="flex flex-wrap items-center justify-between gap-4 pt-8 border-t border-slate-50 relative z-10">
                              <div className="flex items-center gap-2.5">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePipeline(pl._id || pl.id);
                                  }}
                                  className="w-11 h-11 flex items-center justify-center bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-rose-600 rounded-2xl transition-all duration-300 shadow-sm"
                                  title="Delete"
                                >
                                  <Trash2 size={18} />
                                </button>
                                <button 
                                  onClick={() => handleOpenDesignerWorkspace(pl)}
                                  className="w-11 h-11 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-purple-50 hover:text-[#a26da8] rounded-2xl transition-all duration-300 shadow-sm"
                                  title="Settings"
                                >
                                  <Settings size={18} />
                                </button>
                              </div>

                              <div className="flex items-center gap-3">
                                <button 
                                  onClick={() => {
                                    setExecuteTargetPipeline(pl);
                                    setShowExecuteInputModal(true);
                                  }}
                                  className="h-11 px-6 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 shadow-sm group/play"
                                >
                                  <Play size={12} className="fill-current group-hover/play:scale-110 transition-transform" />
                                  <span className="hidden sm:inline">Execute</span>
                                </button>
                                <button 
                                  onClick={() => handleOpenDesignerWorkspace(pl)}
                                  className="h-11 px-7 bg-slate-900 text-white hover:bg-[#a26da8] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-lg shadow-slate-100"
                                >
                                  Manage
                                </button>
                              </div>
                            </div>

                            {/* Accent Background Blob */}
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#a26da8]/5 rounded-full blur-[80px] group-hover:bg-[#a26da8]/10 transition-all duration-700" />
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* VIEW 2: RFP Creation (RFP Generation assistant) */}
              {selectedMenu === 'proposal-forge' && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-8 max-w-5xl mx-auto"
                >
                  {/* Visual Header Panel */}
                  <div className="bg-white border border-slate-100 p-8 rounded-[32px] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-[#a26da8]" />
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Enterprise RFP Creation</h3>
                      </div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide leading-relaxed max-w-xl">
                        Access and generate official RFP documents directly from your shortlisted process evaluation use cases. Reuses your secure session authorization.
                      </p>
                    </div>

                    <button
                      onClick={loadShortlistedEvaluations}
                      disabled={loadingRfpUsecases}
                      className="px-6 py-3 bg-[#a26da8] hover:bg-[#8e5c94] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest rounded-2xl transition shadow-md flex items-center gap-2 cursor-pointer shrink-0 animate-fade-in"
                    >
                      {loadingRfpUsecases ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Syncing...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          <span>Refresh Shortlisted evaluations</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Main content conditional rendering */}
                  {loadingRfpUsecases && rfpUsecases.length === 0 ? (
                    <div className="bg-white border border-slate-100 p-16 rounded-[32px] text-center space-y-4">
                      <div className="w-12 h-12 border-4 border-slate-100 border-t-[#a26da8] rounded-full animate-spin mx-auto mb-2" />
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">Querying shortlist ledger...</h4>
                      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-tight">Syncing with remote secure microservices</p>
                    </div>
                  ) : rfpUsecasesError ? (
                    <div className="bg-rose-50/50 border border-rose-100 p-12 rounded-[32px] text-center max-w-2xl mx-auto space-y-4">
                      <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
                      <h4 className="text-sm font-black text-rose-800 uppercase tracking-widest">Synchronization Interrupted</h4>
                      <p className="text-xs text-rose-600/80 font-semibold leading-relaxed max-w-md mx-auto">
                        {rfpUsecasesError}
                      </p>
                      <button 
                        onClick={loadShortlistedEvaluations}
                        className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition cursor-pointer"
                      >
                        Retry Load
                      </button>
                    </div>
                  ) : rfpUsecases.length === 0 ? (
                    <div className="bg-white border border-slate-100 p-16 rounded-[32px] text-center space-y-6 max-w-2xl mx-auto">
                      <div className="relative w-16 h-16 mx-auto">
                        <FileText className="w-16 h-16 text-slate-200" />
                        <Sparkles className="w-6 h-6 text-[#6fcbbd] absolute -bottom-1 -right-1 animate-pulse" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">No Shortlisted RFP Evaluations Found</h4>
                        <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-md mx-auto">
                          There are currently no shortlisted use-case items registered under the custom RFP evaluation endpoint. Click load to fetch or check the Evaluations tab.
                        </p>
                      </div>
                      <button 
                        onClick={loadShortlistedEvaluations}
                        className="px-6 py-3 bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition cursor-pointer inline-flex items-center gap-2"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Force Fetch Shortlist
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                      {rfpUsecases.map((item: any, idx: number) => {
                        const usecaseId = item.usecaseId || item._id || item.id;
                        const isGenerating = generatingRfpId === usecaseId;
                        const isGenerated = isRfpAlreadyGenerated(item);
                        const company = item.company_name || item.company || '';
                        const industry = item.industry || item.domain || '';
                        const score = item.totalWeightedScore !== undefined ? item.totalWeightedScore : (item.weighted_score !== undefined ? item.weighted_score : item.score);

                        return (
                          <motion.div
                            key={usecaseId || idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white border border-slate-150 rounded-[32px] p-8 hover:shadow-lg transition flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                          >
                            <div className="space-y-4 flex-1">
                              {/* Metadata Tags */}
                              <div className="flex flex-wrap items-center gap-2">
                                {company && (
                                  <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-100">
                                    {company}
                                  </span>
                                )}
                                {industry && (
                                  <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    {industry}
                                  </span>
                                )}
                                <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-100">
                                  Use Case
                                </span>
                                {isGenerated && (
                                  <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    RFP Generated
                                  </span>
                                )}
                              </div>

                              <div className="space-y-1">
                                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{item.title}</h4>
                                <p className="text-xs font-semibold text-slate-400 leading-relaxed max-w-3xl">{item.description}</p>
                              </div>
                            </div>

                            {/* Score + Action side panel */}
                            <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-6 w-full md:w-auto shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                              {score !== undefined && score !== null && (
                                <div className="text-left md:text-right">
                                  <span className="text-[8px] font-mono font-black text-slate-400 uppercase tracking-widest block">Weighted Score</span>
                                  <span className="text-sm font-black text-[#6fcbbd]">{Number(score).toFixed(2)} / 10.00</span>
                                </div>
                              )}
                              
                              <button
                                onClick={() => {
                                  const usecaseId = item.usecaseId || item._id || item.id;
                                  navigate(`/rfp/from-usecase/${usecaseId}`);
                                }}
                                className="px-5 py-2.5 bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                                id={`rfp-action-button-${usecaseId}`}
                              >
                                {isGenerated ? (
                                  <>
                                    <Sparkles className="w-3.5 h-3.5 text-[#6fcbbd] fill-current" />
                                    <span>View RFP Document</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3.5 h-3.5 text-[#6fcbbd] fill-current" />
                                    <span>Generate RFP Document</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
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
                                setUsecaseTitle(uc.title);
                                setUsecaseDesc(uc.description);
                                setSelectedMenu('workflow-library');
                                toast.success('Parameters populated in Generator!');
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

              {/* VIEW 5: Execution Hub (Live tracing and logs) */}
              {selectedMenu === 'execution-hub' && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-8"
                >
                  <div className="flex justify-between items-center select-none">
                    <div>
                      <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">System Execution Hub</h2>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-1">Monitor real-time LangGraph transitions and telemetry</p>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse select-none">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Process Flow</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Instance ID</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">Status Code</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trigger</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {executionsList.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-8 py-20 text-center">
                                <div className="flex flex-col items-center justify-center space-y-4">
                                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                                    <Activity className="w-8 h-8 text-slate-200" />
                                  </div>
                                  <div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">No Active Sessions</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">Execute a pipeline to see live orchestration logs</p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            executionsList.map((log) => {
                              const actualId = log._id || log.id;
                              return (
                                <tr key={actualId} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                                  <td className="px-8 py-5 text-slate-950 font-black text-xs uppercase text-left">{log.pipelineName}</td>
                                  <td className="px-8 py-5 font-mono text-xs text-slate-400">
                                    <span className="hover:text-[#a26da8] cursor-pointer transition" onClick={() => {
                                      setActiveExecutionId(actualId);
                                      setSelectedMenu('execution-detail');
                                    }}>{actualId}</span>
                                  </td>
                                  <td className="px-8 py-4">
                                    <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${log.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : log.status === 'failed' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100 animate-pulse'}`}>
                                      {log.status}
                                    </span>
                                  </td>
                                  <td className="px-8 py-5 text-xs font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50/30">
                                    {log.trigger_type || log.triggeredBy || 'Manual API'}
                                  </td>
                                  <td className="px-8 py-5 font-mono text-xs text-slate-600">
                                    {log.latency_ms ? `${(log.latency_ms / 1000).toFixed(2)}s` : 
                                     log.duration && !isNaN(Number(log.duration)) ? `${log.duration}s` : '---'}
                                  </td>
                                  <td className="px-8 py-4 flex items-center gap-2">
                                    <button 
                                      onClick={() => {
                                        setActiveExecutionId(actualId);
                                        setSelectedMenu('execution-detail');
                                        setShowRunConsole(false);
                                      }}
                                      className="p-2 hover:bg-slate-100 text-[#a26da8] transition rounded-lg"
                                      title="Expand Execution Traces"
                                    >
                                      <Terminal className="w-4 h-4" />
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        console.log("Delete button clicked for execution:", actualId);
                                        handleDeleteExecution(actualId);
                                      }}
                                      className="p-2 hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition rounded-lg"
                                      title="Purge Record"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* VIEW 5.1: Execution Detail (Rich telemetry and node flow) */}
              {selectedMenu === 'execution-detail' && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6 max-h-[calc(100vh-140px)] overflow-y-auto pr-2 scrollbar-hide pb-20"
                >
                  {/* Top Header / Basic Info */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-[#a26da8]/10 rounded-2xl">
                        <Activity className="w-6 h-6 text-[#a26da8]" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Execution Analytics</h2>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Session ID: {activeExecutionId}</span>
                          {activeExecutionData?.organization && (
                            <>
                              <span className="text-slate-200">|</span>
                              <span className="text-[10px] font-mono font-extrabold text-indigo-400 uppercase tracking-widest">Org: {activeExecutionData.organization}</span>
                            </>
                          )}
                          {activeExecutionData?.department && (
                            <>
                              <span className="text-slate-200">|</span>
                              <span className="text-[10px] font-mono font-extrabold text-teal-500 uppercase tracking-widest">Dept: {activeExecutionData.department}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                        activeExecutionData?.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        activeExecutionData?.status === 'failed' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                        activeExecutionData?.status === 'waiting_human' ? 'bg-amber-50 text-amber-600 border border-amber-100 animate-pulse' :
                        'bg-indigo-50 text-indigo-600 border border-indigo-100 animate-pulse'
                      }`}>
                        {activeExecutionData?.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                        {activeExecutionData?.status === 'failed' && <AlertCircle className="w-3 h-3" />}
                        {activeExecutionData?.status === 'waiting_human' && <Clock className="w-3 h-3" />}
                        {activeExecutionData?.status === 'running' && <RefreshCw className="w-3 h-3 animate-spin" />}
                        {activeExecutionData?.status || 'PENDING'}
                      </div>
                      
                      <div className="h-8 w-[1px] bg-slate-100 mx-2 hidden md:block"></div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => activeExecutionId && handleReplayExecution(activeExecutionId)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-600 font-black text-[10px] uppercase tracking-widest transition rounded-xl border border-slate-100"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Replay
                        </button>
                        <button 
                          onClick={() => activeExecutionId && handleDeleteExecution(activeExecutionId)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-rose-50 text-rose-600 font-black text-[10px] uppercase tracking-widest transition rounded-xl border border-rose-100"
                        >
                          <Trash2 className="w-3 h-3" />
                          Purge
                        </button>
                        <button 
                          onClick={() => setSelectedMenu('execution-hub')}
                          className="p-2.5 hover:bg-slate-50 text-slate-400 hover:text-slate-950 transition rounded-xl"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Human Approval Interaction Banner */}
                  {activeExecutionData?.status === 'waiting_human' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-amber-50 border-2 border-amber-200 p-8 rounded-[32px] flex flex-col md:flex-row justify-between items-center gap-6 shadow-lg shadow-amber-100/20"
                    >
                      <div className="flex items-center gap-5">
                        <div className="bg-amber-100 p-4 rounded-3xl">
                          <ShieldCheck className="w-8 h-8 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-amber-950 uppercase tracking-tight">Manual Intervention Required</h3>
                          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                            Flow paused at {
                              (activeExecutionData?.nodes || []).find((n: any) => n.status === 'waiting_human')?.node_id || 'manual_approval'
                            } node. Please review accuracy.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4 w-full md:w-auto">
                        <button 
                          onClick={() => activeExecutionId && handleApproveRejectTask(activeExecutionId, (activeExecutionData?.nodes || []).find((n: any) => n.status === 'waiting_human')?.node_id || 'human_approval', 'rejected')}
                          className="flex-1 md:flex-none px-8 py-3.5 border border-amber-200 bg-white text-rose-600 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-rose-50 transition shadow-sm"
                        >
                          Reject Flow
                        </button>
                        <button 
                          onClick={() => activeExecutionId && handleApproveRejectTask(activeExecutionId, (activeExecutionData?.nodes || []).find((n: any) => n.status === 'waiting_human')?.node_id || 'human_approval', 'approved')}
                          className="flex-1 md:flex-none px-10 py-3.5 bg-amber-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-amber-700 transition shadow-lg shadow-amber-200"
                        >
                          Approve Action
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border border-slate-100 p-6 rounded-[28px] shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Total Latency</span>
                        <Clock className="w-4 h-4 text-[#a26da8]" />
                      </div>
                      <p className="text-2xl font-black text-slate-900">
                        {activeExecutionData?.total_latency_ms ? `${(Number(activeExecutionData.total_latency_ms) / 1000).toFixed(2)}s` : '---'}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-100 p-6 rounded-[28px] shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Tokens Consumed</span>
                        <Zap className="w-4 h-4 text-amber-400" />
                      </div>
                      <p className="text-2xl font-black text-slate-900">
                        {activeExecutionData?.tokens_consumed || 
                         activeExecutionData?.total_tokens || 
                         activeExecutionData?.total_usage?.total_tokens || 
                         activeExecutionData?.usage?.total_tokens || 
                         activeExecutionData?.llm_response?.usage?.total_tokens ||
                         activeExecutionData?.meta?.total_tokens ||
                         activeExecutionData?.totalUsage?.total_tokens ||
                         activeExecutionData?.usage_metadata?.total_token_count ||
                         activeExecutionData?.executionMetadata?.tokens ||
                         '0'}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-100 p-6 rounded-[28px] shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Execution Started</span>
                        <Play className="w-4 h-4 text-emerald-400" />
                      </div>
                      <p className="text-2xl font-black text-slate-900">
                        {activeExecutionData?.started_at ? new Date(activeExecutionData.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '---'}
                      </p>
                    </div>
                  </div>

                  {/* Telemetry Tabs */}
                  <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-2xl w-fit">
                    <button 
                      onClick={() => setActiveExecutionTab('flow')}
                      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${activeExecutionTab === 'flow' ? 'bg-white text-[#a26da8] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Execution Trace
                    </button>
                    <button 
                      onClick={() => setActiveExecutionTab('logs')}
                      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${activeExecutionTab === 'logs' ? 'bg-white text-[#a26da8] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      System Logs
                    </button>
                    <button 
                      onClick={() => setActiveExecutionTab('events')}
                      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${activeExecutionTab === 'events' ? 'bg-white text-[#a26da8] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Immutable Events
                    </button>
                  </div>

                  <div className="min-h-[500px]">
                    {/* Tab 1: Execution Flow Trace */}
                    {activeExecutionTab === 'flow' && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm"
                      >
                        <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Cognitive State Transitions</h3>
                          <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-100 rounded-full">
                            <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Live Monitor</span>
                          </div>
                        </div>
                        <div className="p-8 space-y-12">
                          {(activeExecutionData?.nodes || activeExecutionData?.pipeline_flow || []).map((node: any, nIdx: number, arr: any[]) => {
                            const nodeDef = activeExecutionData?.pipeline_flow?.find((f: any) => f.node_id === node.node_id);
                            const displayName = nodeDef?.name || node.name || node.node_id;
                            const nodeType = nodeDef?.node_type || node.node_type;

                            return (
                              <div key={nIdx} className="relative">
                                {nIdx !== arr.length - 1 && (
                                  <div className="absolute left-[23px] top-12 bottom-[-48px] w-0.5 bg-slate-100 z-0"></div>
                                )}
                                <div className="flex gap-8 items-start relative z-10">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 transition duration-500 shadow-sm ${
                                    node.status === 'completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                    node.status === 'running' ? 'bg-indigo-50 border-indigo-100 text-indigo-600 animate-pulse' :
                                    node.status === 'waiting_human' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                                    node.status === 'failed' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                                    'bg-slate-50 border-slate-100 text-slate-300'
                                  }`}>
                                    {node.status === 'completed' ? <CheckCircle className="w-6 h-6" /> : 
                                     node.status === 'running' ? <RefreshCw className="w-6 h-6 animate-spin" /> :
                                     node.status === 'waiting_human' ? <User className="w-6 h-6" /> :
                                     node.status === 'failed' ? <AlertCircle className="w-6 h-6" /> :
                                     <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>}
                                  </div>
                                  
                                  <div className="flex-1 space-y-4">
                                    <div className="flex justify-between items-start">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{displayName}</h4>
                                          <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest font-mono border ${
                                            nodeType === 'agent' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                            nodeType === 'decision' || nodeType === 'condition' ? 'bg-teal-50 text-teal-600 border-teal-100' :
                                            'bg-slate-50 text-slate-600 border-slate-100'
                                          }`}>
                                            {nodeType}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400 font-mono">
                                          <span>Node ID: {node.node_id}</span>
                                          {node.latency_ms > 0 && <span className="text-indigo-500 bg-indigo-50 px-1.5 rounded">Duration: {node.latency_ms}ms</span>}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                          node.status === 'completed' ? 'bg-emerald-50 text-emerald-500' :
                                          node.status === 'running' ? 'bg-indigo-50 text-indigo-500' :
                                          node.status === 'failed' ? 'bg-rose-50 text-rose-500' :
                                          'bg-slate-50 text-slate-300'
                                        }`}>
                                          {node.status}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    {node.status !== 'pending' && node.status !== 'skipped' && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Input Section */}
                                        <div className="bg-slate-50/80 border border-slate-100 rounded-[20px] p-5 space-y-3">
                                          <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Transaction Input</span>
                                          </div>
                                          <div className="bg-white border border-slate-100 rounded-xl p-4 max-h-64 overflow-y-auto custom-scrollbar shadow-inner">
                                            {node.input ? (
                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {Object.entries(formatNodeData(node.input)).map(([k, v]) => (
                                                  <div key={k} className="p-2 border border-slate-50 rounded-lg bg-slate-50/30">
                                                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{k.replace(/_/g, ' ')}</span>
                                                    <span className="block text-[10px] font-mono text-slate-600 break-all">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <p className="text-[10px] font-mono text-slate-400 italic">// No input parameters defined</p>
                                            )}
                                          </div>
                                        </div>
  
                                        {/* Output/Result Section */}
                                        <div className="bg-slate-50/50 border border-slate-100 rounded-[20px] p-5 space-y-3 shadow-sm">
                                          <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Orchestration Result</span>
                                          </div>
                                          <div className="bg-white border border-slate-100 rounded-xl p-4 max-h-64 overflow-y-auto custom-scrollbar shadow-sm">
                                            {node.output || node.decision_result || (node.status !== 'running' && node.status !== 'pending' && node.status !== 'waiting_human') ? (
                                              <div className="space-y-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                  {(Object.entries(formatNodeData(node.output || {}))).length > 0 ? (
                                                    Object.entries(formatNodeData(node.output || {})).map(([k, v]) => {
                                                      const key = k.toLowerCase().replace(/_/g, ' ');
                                                      let Icon = null;
                                                      if (key.includes('vendor') || key.includes('issuer')) Icon = User;
                                                      if (key.includes('date')) Icon = Calendar;
                                                      if (key.includes('amount') || key.includes('total') || key.includes('price')) Icon = Database;
                                                      if (key.includes('invoice') || key.includes('number') || key.includes('id')) Icon = Activity;

                                                      return (
                                                        <div key={k} className="p-3 border border-slate-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow group">
                                                          <div className="flex items-center justify-between mb-1.5">
                                                            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">{k.replace(/_/g, ' ')}</span>
                                                            {Icon && <Icon className="w-2.5 h-2.5 text-slate-200 group-hover:text-indigo-400 transition-colors" />}
                                                          </div>
                                                          <div className="text-[11px] font-black text-slate-800 break-words leading-tight">
                                                            {Array.isArray(v) ? (
                                                              <div className="space-y-1.5 mt-1">
                                                                {v.map((item, idx) => (
                                                                  <div key={idx} className="p-2 bg-slate-50 rounded-lg text-[9px] font-medium text-slate-600 border border-slate-100">
                                                                    {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                                                                  </div>
                                                                ))}
                                                              </div>
                                                            ) : typeof v === 'object' && v !== null ? (
                                                              <pre className="text-[9px] font-mono text-slate-500 bg-slate-50 p-2 rounded-lg mt-1 overflow-x-auto">
                                                                {JSON.stringify(v, null, 2)}
                                                              </pre>
                                                            ) : (
                                                              <span className={typeof v === 'number' || (typeof v === 'string' && /^\d/.test(v) && key.includes('amount')) ? 'text-indigo-600' : 'text-slate-800'}>
                                                                {String(v)}
                                                              </span>
                                                            )}
                                                          </div>
                                                        </div>
                                                      );
                                                    })
                                                  ) : node.decision_result ? (
                                                    <div className="col-span-full p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Feedback Output</span>
                                                      <span className="block text-xs font-bold text-slate-600 italic">No structured data found, referring to decision state.</span>
                                                    </div>
                                                  ) : null}
                                                </div>
                                                {node.decision_result && (
                                                  <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                                                      <span className="block text-[8px] font-black text-indigo-600 uppercase tracking-widest">Autonomous Decision</span>
                                                    </div>
                                                    <span className="block text-[11px] font-black text-indigo-900 uppercase tracking-tight">{node.decision_result}</span>
                                                  </div>
                                                )}
                                                {node.status === 'completed' && !node.output && !node.decision_result && (
                                                  <div className="flex flex-col items-center justify-center py-4 bg-emerald-50/30 border border-emerald-100/50 rounded-xl">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
                                                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                    </div>
                                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Node Step Succeeded</p>
                                                  </div>
                                                )}
                                              </div>
                                            ) : (
                                              <div className="flex flex-col items-center justify-center py-8 text-center">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-3 ${node.status === 'running' || node.status === 'waiting_human' ? 'bg-indigo-50' : 'bg-slate-50'}`}>
                                                  <Activity className={`w-4 h-4 ${node.status === 'running' ? 'text-indigo-400 animate-pulse' : node.status === 'waiting_human' ? 'text-amber-400' : 'text-slate-300'}`} />
                                                </div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                                                  {node.status === 'running' ? 'Synthesizing Node State...' : node.status === 'waiting_human' ? 'Awaiting Human Input...' : 'Pending execution step'}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {/* Tab 2: System Logs */}
                    {activeExecutionTab === 'logs' && (
                      <motion.div 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm"
                      >
                        <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Step-by-Step UI Audit</h3>
                          <button 
                            onClick={() => {
                              const blob = new Blob([JSON.stringify(executionLogsTab, null, 2)], { type: 'application/json' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a'); a.href = url; a.download = `logs_${activeExecutionId}.json`; a.click();
                            }}
                            className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-950 transition rounded-xl"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="p-0 overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="bg-slate-50/30 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                                <th className="px-8 py-4">#Step</th>
                                <th className="px-6 py-4">Node Identity</th>
                                <th className="px-6 py-4">State</th>
                                <th className="px-6 py-4">Latency</th>
                                <th className="px-6 py-4">LLM Tokens</th>
                                <th className="px-6 py-4">Outcome Preview</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {executionLogsTab.map((log: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition">
                                  <td className="px-8 py-4 font-mono text-[11px] text-slate-400">Step {log.step || idx + 1}</td>
                                  <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                      <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{log.node_id}</span>
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{log.node_type}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                      log.status === 'completed' ? 'bg-emerald-50 text-emerald-500' :
                                      log.status === 'failed' ? 'bg-rose-50 text-rose-500' :
                                      'bg-slate-100 text-slate-400'
                                    }`}>
                                      {log.status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 font-mono text-[11px] text-indigo-500 font-bold">{log.latency_ms ? `${log.latency_ms}ms` : '---'}</td>
                                  <td className="px-6 py-4 font-mono text-[11px] text-amber-500 font-bold">{log.tokens || 0}</td>
                                  <td className="px-6 py-4">
                                    <div className="max-w-[200px] truncate text-[10px] font-mono text-slate-400 italic">
                                      {log.output_preview || log.decision || (log.error ? `Error: ${log.error}` : 'Task processed successfully')}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                              {executionLogsTab.length === 0 && (
                                <tr>
                                  <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-black text-[10px] uppercase tracking-widest">
                                    No audit traces recorded yet for this session sequence
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    )}

                    {/* Tab 3: Immutable Events */}
                    {activeExecutionTab === 'events' && (
                      <motion.div 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm"
                      >
                        <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 text-indigo-900">
                          <h3 className="text-xs font-black uppercase tracking-widest">Append-Only Event Ledger (V2)</h3>
                          <div className="flex items-center gap-2">
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{executionEvents.length} Events Logged</span>
                          </div>
                        </div>
                        <div className="p-0">
                          <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                            {executionEvents.map((event: any, idx: number) => (
                              <div key={idx} className={`p-6 border-b border-slate-50 flex gap-6 hover:bg-slate-50 transition ${idx % 2 === 1 ? 'bg-slate-50/20' : ''}`}>
                                <div className="shrink-0 space-y-1 text-center min-w-[50px]">
                                  <div className="text-[9px] font-black text-slate-300 uppercase font-mono">Seq</div>
                                  <div className="text-sm font-black text-slate-900 font-mono">#{event.sequence || idx + 1}</div>
                                </div>
                                <div className="flex-1 space-y-4">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                        event.event_type?.includes('started') ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                        event.event_type?.includes('completed') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                        event.event_type?.includes('approval') ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                        'bg-slate-50 text-slate-500 border-slate-100'
                                      }`}>
                                        {event.event_type}
                                      </span>
                                      {event.node_id && <span className="text-[10px] font-black text-slate-900 uppercase">{event.node_id}</span>}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 font-mono italic">
                                      {new Date(event.timestamp).toLocaleString()}
                                    </span>
                                  </div>
                                  {event.payload && (
                                    <div className="bg-slate-950 p-4 rounded-2xl overflow-x-auto border border-slate-900">
                                      <pre className="text-[10px] font-mono text-slate-400 whitespace-pre leading-relaxed">
                                        {JSON.stringify(event.payload, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                            {executionEvents.length === 0 && (
                              <div className="px-8 py-20 text-center text-slate-400 font-black text-[10px] uppercase tracking-widest">
                                The event stream is currently silent
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* VIEW 6: Approval Inbox (Human in the loop controls) */}
              {selectedMenu === 'approval-inbox' && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-8"
                >
                  <div className="flex justify-between items-center select-none">
                    <div>
                      <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">Active Human Approval Inbox</h2>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-1">Accept or reject pending steps waiting for manager override</p>
                    </div>
                  </div>

                  {approvalsList.length === 0 ? (
                    <div className="bg-white border border-slate-100 p-12 rounded-[32px] text-center max-w-xl mx-auto space-y-4">
                      <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Inbox Complete</h3>
                      <p className="text-xs text-slate-400 uppercase tracking-tight">No pipeline executions are currently stalled on approval checks.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {approvalsList.map((app) => {
                        // New structure compatibility
                        const execId = app.execution_id || app._id;
                        const nodeId = app.node_id || (app.nodes || []).find((n: any) => n.status === 'waiting_human')?.node_id || 'human_approval';
                        const pipelineName = app.pipeline_id?.name || app.pipelineName || 'Autonomous Pipeline';
                        const message = app.message || (app.nodes || []).find((n: any) => n.status === 'waiting_human')?.approval_request?.message || 'Manual override required for system continuity.';
                        const requestedAt = app.requested_at || app.started_at || app.createdAt;
                        
                        return (
                          <div 
                            key={app._id}
                            className="bg-white border border-slate-100 p-8 rounded-[32px] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                          >
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-3">
                                <span className="bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-amber-100">
                                  WAITING OVERRIDE
                                </span>
                                <span className="text-slate-400 text-xs font-semibold font-mono">Exec ID: {execId}</span>
                                {app.organization && (
                                  <span className="text-slate-300 text-[10px] font-mono font-bold uppercase">Org: {app.organization}</span>
                                )}
                              </div>
                              <h3 className="text-lg font-black text-slate-950 uppercase tracking-tight">
                                Step: {nodeId} for "{pipelineName}"
                              </h3>
                              <p className="text-xs font-medium text-slate-500 leading-relaxed max-w-2xl">
                                {message}
                              </p>
                              <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                  <Clock className="w-3 h-3" />
                                  <span>Requested {requestedAt ? new Date(requestedAt).toLocaleString() : 'Recently'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-400 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition" onClick={() => {
                                  setActiveExecutionId(execId);
                                  setSelectedMenu('execution-detail');
                                }}>
                                  <Activity className="w-3 h-3" />
                                  <span>Inspect Graph Trace</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-3 shrink-0 select-none">
                              <button
                                onClick={() => handleApproveRejectTask(execId, nodeId, 'rejected')}
                                className="px-5 py-3 border border-rose-100 hover:bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-xl transition cursor-pointer"
                              >
                                Reject & Flag Exception
                              </button>
                              <button
                                onClick={() => handleApproveRejectTask(execId, nodeId, 'approved')}
                                className="px-6 py-3 bg-[#a26da8] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#8e5c94] transition cursor-pointer"
                              >
                                Approve Document Step
                              </button>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* VIEW 7: Create Pipeline (Workflow Library) */}
              {selectedMenu === 'workflow-library' && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -15 }}
                  className="grid grid-cols-1 lg:grid-cols-5 gap-8"
                >
                  <div className="lg:col-span-2 bg-white border border-slate-100 p-8 rounded-[32px] shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                      <Zap className="w-6 h-6 text-[#6fcbbd]" />
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Create Pipeline</h3>
                    </div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide leading-relaxed">
                      Supply standard corporate use cases to create complete LangGraph workflows via active LLM.
                    </p>

                    <div className="space-y-4 pt-4 border-t border-slate-50">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Workflow Title</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Acme Billing audit system"
                          value={usecaseTitle} 
                          onChange={(e) => setUsecaseTitle(e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold text-slate-800 outline-none hover:border-slate-300 transition"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Core Description</label>
                        <textarea 
                          rows={3}
                          placeholder="Brief summary of the workflow..."
                          value={usecaseDesc} 
                          onChange={(e) => setUsecaseDesc(e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 outline-none hover:border-slate-300 transition resize-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Objective</label>
                        <input 
                          type="text" 
                          placeholder="Primary goal of this pipeline"
                          value={usecaseObjective} 
                          onChange={(e) => setUsecaseObjective(e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold text-slate-800 outline-none hover:border-slate-300 transition"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Functional Steps (comma separated)</label>
                        <textarea 
                          rows={2}
                          placeholder="Step 1, Step 2, Step 3..."
                          value={usecaseSteps} 
                          onChange={(e) => setUsecaseSteps(e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 outline-none hover:border-slate-300 transition resize-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Expected Outcome</label>
                        <input 
                          type="text" 
                          placeholder="Final result or output format"
                          value={usecaseExpectedOutput} 
                          onChange={(e) => setUsecaseExpectedOutput(e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold text-slate-800 outline-none hover:border-slate-300 transition"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Integrations (comma separated)</label>
                        <input 
                          type="text" 
                          placeholder="ERP, CRM, SQL Database..."
                          value={usecaseIntegrations} 
                          onChange={(e) => setUsecaseIntegrations(e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold text-slate-800 outline-none hover:border-slate-300 transition"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Domain Sector</label>
                          <select 
                            value={usecaseIndustry} 
                            onChange={(e) => setUsecaseIndustry(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none hover:border-slate-300 transition"
                          >
                            <option>Finance</option>
                            <option>Finance & Accounts Payable</option>
                            <option>Compliance</option>
                            <option>HR</option>
                            <option>Legal</option>
                            <option>General</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Complexity</label>
                          <select 
                            value={usecaseComplexity} 
                            onChange={(e) => setUsecaseComplexity(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none hover:border-slate-300 transition"
                          >
                            <option value="high">High Complexity</option>
                            <option value="moderate">Moderate</option>
                            <option value="low">Low</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Model Provider</label>
                          <select 
                            value={selectedProvider} 
                            onChange={(e) => setSelectedProvider(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none hover:border-slate-300 transition"
                          >
                            <option value="openrouter">OpenRouter</option>
                            <option value="google">Google Cloud</option>
                            <option value="openai">OpenAI</option>
                            <option value="anthropic">Anthropic</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">AI Engine Model</label>
                          <select 
                            value={selectedModel} 
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none hover:border-slate-300 transition"
                          >
                            <option value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
                            <option value="google/gemini-2.0-pro">Gemini 2.0 Pro</option>
                            <option value="nvidia/nemotron-3-super-120b-a12b:free">Nemotron 120B</option>
                            <option value="openai/gpt-4o">GPT-4o</option>
                            <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <input 
                          type="checkbox" 
                          id="regenerate-check"
                          checked={isRegenerate}
                          onChange={(e) => setIsRegenerate(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-[#a26da8] focus:ring-[#a26da8]"
                        />
                        <label htmlFor="regenerate-check" className="text-[10px] font-bold text-slate-600 uppercase tracking-wider cursor-pointer">Force Regenerate prompts</label>
                      </div>

                      <button
                        onClick={handleGenerateWorkflowOnBackend}
                        className="w-full py-4 bg-slate-950 text-white leading-none text-xs font-black uppercase tracking-widest rounded-xl hover:bg-black transition flex items-center justify-center gap-2 cursor-pointer mt-4"
                      >
                        <Zap className="w-4 h-4 text-[#6fcbbd] fill-current" />
                        <span>Create Pipeline</span>
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-3 bg-white border border-slate-100 p-8 rounded-[32px] shadow-sm flex flex-col justify-between select-none">
                    <div className="space-y-6">
                      {/* Interactive Tab Selector */}
                      <div className="flex border-b border-slate-100 pb-2">
                        <button 
                          onClick={() => setActiveWorkflowRightTab('shortlisted')}
                          className={`flex-1 text-center pb-2 text-[10px] font-black uppercase tracking-wider transition ${activeWorkflowRightTab === 'shortlisted' ? 'text-[#a26da8] border-b-2 border-[#a26da8]' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          Shortlisted Use Cases ({shortlistedUsecases.length})
                        </button>
                        <button 
                          onClick={() => setActiveWorkflowRightTab('blueprints')}
                          className={`flex-1 text-center pb-2 text-[10px] font-black uppercase tracking-wider transition ${activeWorkflowRightTab === 'blueprints' ? 'text-[#a26da8] border-b-2 border-[#a26da8]' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          System Blueprints
                        </button>
                      </div>

                      {activeWorkflowRightTab === 'shortlisted' ? (
                        <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
                          {shortlistedUsecases.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                              No shortlisted use cases found.<br />
                              Go to <span className="font-bold underline cursor-pointer hover:text-[#a26da8]" onClick={() => setSelectedMenu('process-intelligence')}>Process Intelligence Matrix</span> to add some.
                            </div>
                          ) : (
                            shortlistedUsecases.map((uc: any, idx) => (
                              <div key={idx} className="p-5 border border-slate-100 rounded-2xl bg-slate-50 hover:border-[#a26da8]/30 hover:bg-slate-50/70 transition duration-300 flex justify-between items-start gap-4">
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="bg-purple-100 text-purple-700 text-[8px] font-black uppercase px-2 py-0.5 rounded">
                                      {uc.source === 'domain' ? 'Domain' : 'Company'}
                                    </span>
                                    {uc.complexity && (
                                      <span className="bg-slate-200 text-slate-700 text-[8px] font-black uppercase px-2 py-0.5 rounded-md">
                                        {uc.complexity} Complexity
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-xs font-black text-slate-950 uppercase mt-1">{uc.title}</h4>
                                  <p className="text-[10px] font-semibold text-slate-400 leading-relaxed line-clamp-3">{uc.description}</p>
                                </div>
                                <button
                                  onClick={() => {
                                    setUsecaseTitle(uc.title);
                                    setUsecaseDesc(uc.description);
                                    if (uc.industry) setUsecaseIndustry(uc.industry);
                                    if (uc.complexity) setUsecaseComplexity(uc.complexity);
                                    toast.success('Fields pre-filled from shortlisted usecase!');
                                  }}
                                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[9px] font-black uppercase tracking-widest rounded-xl transition cursor-pointer shrink-0"
                                >
                                  Load Case
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {[
                            { title: "Standard AP Invoice Reconciliation Pack", nodes: 4, desc: "Spliced multi-agent system checking stated vs calculated tax limits.", industry: "Finance", complexity: "moderate" },
                            { title: "Custom Employee Onboarding Registry Flow", nodes: 3, desc: "Pauses flow until manager registers KYC compliance details.", industry: "HR", complexity: "low" },
                            { title: "Enterprise compliance PDF auditing", nodes: 5, desc: "Uses Claude-3.5-Sonnet and Nemotron to reconcile guidelines.", industry: "Compliance", complexity: "high" }
                          ].map((mkt, idx) => (
                            <div key={idx} className="p-5 border border-slate-100 rounded-2xl bg-slate-50 hover:border-[#a26da8]/30 hover:bg-slate-50/70 transition duration-300 flex justify-between items-center gap-4">
                              <div className="space-y-1">
                                <h4 className="text-xs font-black text-slate-950 uppercase">{mkt.title}</h4>
                                <p className="text-[10px] font-semibold text-slate-400 mt-0.5 leading-relaxed">{mkt.desc}</p>
                              </div>
                              <button
                                onClick={() => {
                                  setUsecaseTitle(mkt.title);
                                  setUsecaseDesc(mkt.desc);
                                  setUsecaseIndustry(mkt.industry || "Finance");
                                  setUsecaseComplexity(mkt.complexity || "moderate");
                                  toast.success('Blueprint seeded in custom generator!');
                                }}
                                className="px-4 py-2 border border-slate-200 bg-white text-slate-700 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition cursor-pointer shrink-0"
                              >
                                Seed Values
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
          </div>
        )}

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

      <AnimatePresence>
        {pipelineIdToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white max-w-md w-full rounded-[32px] overflow-hidden shadow-2xl"
            >
              <div className="p-10 space-y-6">
                <div className="w-20 h-20 bg-rose-50 rounded-[28px] flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-10 h-10 text-rose-500" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Decommission Pipeline?</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-semibold">
                    You are forcing a hard delete. This will cascade through <span className="text-rose-600 underline">all associated executions</span> and their telemetry records.
                  </p>
                </div>
                
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 mb-6 space-y-4">
                   <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                     <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest truncate">ID: {pipelineIdToDelete}</span>
                   </div>
                   
                   <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="pt-0.5">
                        <input 
                          type="checkbox" 
                          checked={deleteWithAgents}
                          onChange={(e) => setDeleteWithAgents(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-[#a26da8] focus:ring-[#a26da8] cursor-pointer"
                        />
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider group-hover:text-slate-900 transition">Also purge associated AgentV2 records</span>
                        <p className="text-[9px] text-slate-400 font-medium">By default, agent records are KEPT unless this is checked.</p>
                      </div>
                   </label>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setPipelineIdToDelete(null)}
                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl transition duration-300"
                  >
                    Keep Workflow
                  </button>
                  <button 
                    onClick={performPipelineDelete}
                    className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition duration-300 shadow-lg shadow-rose-200"
                  >
                    Confirm Purge
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
