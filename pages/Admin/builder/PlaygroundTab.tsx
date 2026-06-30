
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  XYPosition,
  MarkerType,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { apiService } from '../../../services/api';
import { 
  Play, 
  Save, 
  Trash2, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Plus,
  Settings2,
  Zap,
  Brain,
  Database,
  Globe,
  Puzzle,
  History,
  ShieldCheck,
  ChevronRight,
  Info,
  X,
  Search,
  MessageSquare,
  Clock,
  ArrowRight,
  Filter,
  Layers,
  Activity,
  Sparkles,
  Terminal,
  ChevronDown,
  PlusCircle,
  PlayCircle,
  GitBranch,
  Grid,
  Maximize2,
  Minimize2
} from 'lucide-react';
import toast from 'react-hot-toast';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const NODE_TYPES_CONFIG: Record<string, { icon: any; color: string; name: string; description: string }> = {
  start: { icon: Play, color: '#3fb950', name: 'Start', description: 'Trigger point' },
  agent: { icon: Brain, color: '#6ea8fe', name: 'Agent', description: 'Calls published agent' },
  connector: { icon: Puzzle, color: '#5ed3f3', name: 'Connector', description: 'External tools & integrations' },
  condition: { icon: GitBranch, color: '#c792ea', name: 'Condition', description: 'Exclusive gateway' },
  transform: { icon: RotateCcw, color: '#7ee0c0', name: 'Transform', description: 'Reshape data' },
  human_task: { icon: ShieldCheck, color: '#ffb454', name: 'Human Task', description: 'Pause for sign-off' },
  parallel: { icon: GitBranch, color: '#6366f1', name: 'Parallel', description: 'Fork branches' },
  join: { icon: Grid, color: '#8b5cf6', name: 'Join', description: 'Wait for branches' },
  api_call: { icon: Zap, color: '#ff7b9c', name: 'API Call', description: 'HTTP request' },
  end: { icon: Info, color: '#f85149', name: 'End', description: 'Terminate flow' },
};

const CustomNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const config = NODE_TYPES_CONFIG[data.type] || NODE_TYPES_CONFIG.agent;
  const Icon = config.icon;

  return (
    <div className={`px-2.5 py-1.5 rounded-[16px] bg-white border-2 transition-all min-w-[130px] max-w-[180px] group ${
      selected ? 'border-[#a26da8] shadow-lg' : 'border-gray-100 shadow-sm'
    }`}>
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-2 !h-2 !bg-white !border-[1.5px] !border-gray-200 !-left-1" 
      />
      
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-xl shrink-0" style={{ backgroundColor: `${config.color}15`, color: config.color }}>
          <Icon size={12} />
        </div>
        <div className="min-w-0 pr-1">
          <div className="text-[8px] font-black text-gray-900 uppercase tracking-tight truncate leading-tight">{data.label || config.name}</div>
          <div className="text-[7.5px] font-bold text-gray-300 uppercase tracking-widest truncate leading-none mt-0.5">{config.name}</div>
        </div>
      </div>
      
      {(data.subLabel || data.status) && (
        <div className="mt-1.5 pt-1.5 border-t border-gray-50 flex items-center justify-between gap-2 overflow-hidden">
          <div className="text-[7px] font-bold text-gray-400 italic truncate flex-1">{data.subLabel}</div>
          {data.status && (
            <div className={`flex items-center gap-1 text-[7px] font-black uppercase tracking-widest px-1 py-0.5 rounded-md shrink-0 ${
              data.status === 'completed' ? 'bg-green-50 text-green-600' :
              data.status === 'running' ? 'bg-blue-50 text-blue-600' :
              data.status === 'failed' ? 'bg-red-50 text-red-600' :
              data.status === 'waiting_approval' ? 'bg-amber-50 text-amber-600 animate-pulse' :
              data.status === 'skipped' ? 'bg-gray-100 text-gray-400' :
              'bg-gray-50 text-gray-400'
            }`}>
              {data.status === 'running' && <Loader2 size={6} className="animate-spin" />}
              {data.status === 'waiting_approval' && <Clock size={6} />}
              {data.status.replace('_', ' ')}
            </div>
          )}
        </div>
      )}

      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-2 !h-2 !border-0 !-right-1"
        style={{ backgroundColor: config.color === '#3fb950' ? '#3fb950' : config.color }}
      />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const DataManagerPanel = ({ dataManager, setDataManager }: { dataManager: any; setDataManager: any }) => {
  const [activeTab, setActiveTab] = useState<'arguments' | 'variables'>('arguments');

  const addArgument = () => {
    const args = dataManager?.arguments || [];
    const newArgs = [...args, { name: `arg${args.length + 1}`, direction: 'in', type: 'string', required: false, default: '', description: '' }];
    setDataManager({ ...dataManager, arguments: newArgs });
  };

  const addVariable = () => {
    const vars = dataManager?.variables || [];
    const newVars = [...vars, { name: `var${vars.length + 1}`, type: 'string', default: '', description: '' }];
    setDataManager({ ...dataManager, variables: newVars });
  };

  const updateArgument = (index: number, field: string, value: any) => {
    const args = dataManager?.arguments || [];
    const newArgs = [...args];
    if (newArgs[index]) {
      newArgs[index] = { ...newArgs[index], [field]: value };
      setDataManager({ ...dataManager, arguments: newArgs });
    }
  };

  const updateVariable = (index: number, field: string, value: any) => {
    const vars = dataManager?.variables || [];
    const newVars = [...vars];
    if (newVars[index]) {
      newVars[index] = { ...newVars[index], [field]: value };
      setDataManager({ ...dataManager, variables: newVars });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
      <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
        <button 
          onClick={() => setActiveTab('arguments')}
          className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'arguments' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'
          }`}
        >
          Arguments
        </button>
        <button 
          onClick={() => setActiveTab('variables')}
          className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'variables' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'
          }`}
        >
          Variables
        </button>
      </div>

      {activeTab === 'arguments' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Flow I/O</label>
            <button onClick={addArgument} className="p-1 text-[#a26da8] hover:bg-purple-50 rounded-lg">
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-3">
            {(dataManager.arguments || []).map((arg: any, i: number) => (
              <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 group relative">
                <button 
                  onClick={() => {
                    const args = dataManager?.arguments || [];
                    const newArgs = args.filter((_: any, idx: number) => idx !== i);
                    setDataManager({ ...dataManager, arguments: newArgs });
                  }}
                  className="absolute top-3 right-3 p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={12} />
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Name</label>
                    <input 
                      value={arg.name}
                      onChange={(e) => updateArgument(i, 'name', e.target.value)}
                      className="w-full bg-white border-none rounded-xl px-3 py-2 text-[10px] font-bold outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Direction</label>
                    <select 
                      value={arg.direction}
                      onChange={(e) => updateArgument(i, 'direction', e.target.value)}
                      className="w-full bg-white border-none rounded-xl px-2 py-2 text-[10px] font-bold outline-none cursor-pointer"
                    >
                      <option value="in">Input</option>
                      <option value="out">Output</option>
                      <option value="inout">In/Out</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Type</label>
                    <select 
                      value={arg.type}
                      onChange={(e) => updateArgument(i, 'type', e.target.value)}
                      className="w-full bg-white border-none rounded-xl px-2 py-2 text-[10px] font-bold outline-none cursor-pointer"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="object">Object</option>
                      <option value="array">Array</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={arg.required}
                        onChange={(e) => updateArgument(i, 'required', e.target.checked)}
                        className="rounded border-gray-300 text-[#a26da8] focus:ring-[#a26da8]"
                      />
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Required</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Default Value</label>
                  <input
                    value={arg.default ?? ''}
                    onChange={(e) => updateArgument(i, 'default', e.target.value)}
                    className="w-full bg-white border-none rounded-xl px-3 py-2 text-[10px] font-bold outline-none"
                    placeholder="Optional default..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Description</label>
                  <input
                    value={arg.description ?? ''}
                    onChange={(e) => updateArgument(i, 'description', e.target.value)}
                    className="w-full bg-white border-none rounded-xl px-3 py-2 text-[10px] font-bold outline-none"
                    placeholder="Describe this argument..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Internal State</label>
            <button onClick={addVariable} className="p-1 text-[#a26da8] hover:bg-purple-50 rounded-lg">
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-3">
            {(dataManager.variables || []).map((v: any, i: number) => (
              <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 group relative">
                 <button 
                  onClick={() => {
                    const vars = dataManager?.variables || [];
                    const newVars = vars.filter((_: any, idx: number) => idx !== i);
                    setDataManager({ ...dataManager, variables: newVars });
                  }}
                  className="absolute top-3 right-3 p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={12} />
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Name</label>
                    <input 
                      value={v.name}
                      onChange={(e) => updateVariable(i, 'name', e.target.value)}
                      className="w-full bg-white border-none rounded-xl px-3 py-2 text-[10px] font-bold outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Type</label>
                    <select 
                      value={v.type}
                      onChange={(e) => updateVariable(i, 'type', e.target.value)}
                      className="w-full bg-white border-none rounded-xl px-2 py-2 text-[10px] font-bold outline-none cursor-pointer"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="object">Object</option>
                      <option value="array">Array</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Default Value</label>
                  <input
                    value={v.default ?? ''}
                    onChange={(e) => updateVariable(i, 'default', e.target.value)}
                    className="w-full bg-white border-none rounded-xl px-3 py-2 text-[10px] font-bold outline-none"
                    placeholder="Set default..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Description</label>
                  <input
                    value={v.description ?? ''}
                    onChange={(e) => updateVariable(i, 'description', e.target.value)}
                    className="w-full bg-white border-none rounded-xl px-3 py-2 text-[10px] font-bold outline-none"
                    placeholder="Describe this variable..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MappingTable = ({ 
  label, 
  mappings = [], 
  onChange, 
  mode = 'kv', // 'kv' for key-value, 'to-from' for output assignments
  variables = [],
  arguments_list = []
}: { 
  label: string; 
  mappings: any[];
  onChange: (newMappings: any[]) => void;
  mode?: 'kv' | 'to-from';
  variables?: any[];
  arguments_list?: any[];
}) => {
  const safeMappings = Array.isArray(mappings) ? mappings : [];
  
  // Available targets for 'to-from' mode
  const targets = [
    ...variables.map(v => `vars.${v.name}`),
    ...arguments_list.filter(a => a.direction === 'out' || a.direction === 'inout' || a.direction === 'in').map(a => `args.${a.name}`)
  ];

  // Helper template strings that can be inserted
  const quickInserts = [
    ...arguments_list.map(a => `{{args.${a.name}}}`),
    ...variables.map(v => `{{vars.${v.name}}}`)
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">{label}</label>
        <button 
          onClick={() => onChange([...safeMappings, mode === 'to-from' ? { to: '', from: '' } : { k: '', v: '' }])}
          className="p-1 text-[#a26da8] hover:bg-purple-50 rounded-lg transition-all"
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="bg-gray-50/50 rounded-[24px] border border-gray-100 p-3 space-y-2">
        {safeMappings.length === 0 && (
          <div className="py-4 text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest">No mappings</div>
        )}
        {safeMappings.map((m: any, i: number) => {
          const keyField = mode === 'to-from' ? 'to' : 'k';
          const valField = mode === 'to-from' ? 'from' : 'v';
          
          return (
            <div key={i} className="flex gap-1.5 items-start group">
              <div className="flex-1 space-y-1">
                {mode === 'to-from' ? (
                  <div className="space-y-1">
                    <select
                      value={m[keyField] || ''}
                      onChange={(e) => {
                        const next = [...safeMappings];
                        next[i] = { ...next[i], [keyField]: e.target.value };
                        onChange(next);
                      }}
                      className="w-full bg-white border border-gray-100 rounded-lg px-2 py-1.5 text-[9px] font-bold outline-none focus:border-purple-200 cursor-pointer"
                    >
                      <option value="">Select Target...</option>
                      {targets.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                      {m[keyField] && !targets.includes(m[keyField]) && (
                        <option value={m[keyField]}>{m[keyField]} (custom)</option>
                      )}
                    </select>
                  </div>
                ) : (
                  <input 
                    value={m[keyField] || ''}
                    onChange={(e) => {
                      const next = [...safeMappings];
                      next[i] = { ...next[i], [keyField]: e.target.value };
                      onChange(next);
                    }}
                    placeholder="input_key"
                    className="w-full bg-white border border-gray-100 rounded-lg px-2 py-1.5 text-[9px] font-bold outline-none focus:border-purple-200"
                  />
                )}
              </div>
              <div className="text-gray-300 pt-2">
                <ArrowRight size={10} />
              </div>
              <div className="flex-[1.5] space-y-1">
                <input 
                  value={m[valField] || ''}
                  onChange={(e) => {
                    const next = [...safeMappings];
                    next[i] = { ...next[i], [valField]: e.target.value };
                    onChange(next);
                  }}
                  placeholder={mode === 'to-from' ? "$.source_path" : "{{vars.source}}"}
                  className="w-full bg-white border border-gray-100 rounded-lg px-2 py-1.5 text-[9px] font-bold outline-none focus:border-purple-200"
                />

                {/* Sub-row helper suggestions for from / value fields */}
                {mode === 'to-from' ? (
                  <div className="flex flex-wrap gap-1 mt-1 pl-0.5">
                    <span className="text-[7px] text-gray-400 uppercase font-bold self-center mr-1">Quick Path:</span>
                    {['$', '$.value', '$.articles', '$.headlines'].map(path => (
                      <button
                        key={path}
                        onClick={() => {
                          const next = [...safeMappings];
                          next[i] = { ...next[i], [valField]: path };
                          onChange(next);
                        }}
                        className="px-1 py-0.5 bg-gray-100 hover:bg-purple-50 text-gray-500 hover:text-[#a26da8] text-[7.5px] rounded font-mono transition-all border border-gray-200/50"
                      >
                        {path}
                      </button>
                    ))}
                  </div>
                ) : (
                  quickInserts.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 pl-0.5">
                      <span className="text-[7px] text-gray-400 uppercase font-bold self-center mr-1">Insert Var:</span>
                      {quickInserts.map(pill => (
                        <button
                          key={pill}
                          onClick={() => {
                            const next = [...safeMappings];
                            const currentVal = next[i][valField] || '';
                            next[i] = { ...next[i], [valField]: currentVal + pill };
                            onChange(next);
                          }}
                          className="px-1 py-0.5 bg-gray-100 hover:bg-purple-50 text-gray-500 hover:text-[#a26da8] text-[7.5px] rounded transition-all border border-gray-200/50 font-bold"
                        >
                          {pill}
                        </button>
                      ))}
                    </div>
                  )
                )}
              </div>
              <button 
                onClick={() => onChange(safeMappings.filter((_, idx) => idx !== i))}
                className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all pt-2"
              >
                <Trash2 size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RenderValue = ({ value, label }: { value: any; label?: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic text-[10px]">empty</span>;
  }

  // Normalize string value and inner string values (literal newlines)
  let normalizedValue = value;
  if (typeof value === 'string') {
    normalizedValue = value.replace(/\\n/g, '\n');
  } else if (typeof value === 'object' && value !== null) {
    const textVal = value.value ?? value.text ?? value.response;
    if (typeof textVal === 'string') {
      const textKey = 'value' in value ? 'value' : ('text' in value ? 'text' : ('response' in value ? 'response' : null));
      if (textKey) {
        normalizedValue = { ...value, [textKey]: textVal.replace(/\\n/g, '\n') };
      }
    }
  }

  const isAgentStoppedEarly = typeof normalizedValue === 'string' && normalizedValue.includes("I've taken the actions I could");

  const renderContent = () => {
    if (typeof normalizedValue === 'object') {
      const textVal = normalizedValue.value ?? normalizedValue.text ?? normalizedValue.response;
      const hasText = typeof textVal === 'string';
      const otherKeys = Object.keys(normalizedValue).filter(k => k !== 'value' && k !== 'text' && k !== 'response');
      
      if (hasText && otherKeys.length === 0) {
        return <RenderValue value={textVal} />;
      }
      
      if (hasText && otherKeys.length > 0) {
        const otherData: Record<string, any> = {};
        otherKeys.forEach(k => {
          otherData[k] = normalizedValue[k];
        });
        
        return (
          <div className="space-y-3 w-full">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Agent Response</span>
              <RenderValue value={textVal} />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Structured Data Outputs</span>
              <pre className="text-[12.5px] font-mono p-4 bg-gray-50 border border-gray-100 rounded-xl overflow-x-auto max-h-[55vh] custom-scrollbar text-gray-700 leading-relaxed">
                {JSON.stringify(otherData, null, 2)}
              </pre>
            </div>
          </div>
        );
      }

      return (
        <pre className="text-[12.5px] font-mono p-4 bg-gray-50 border border-gray-100 rounded-xl overflow-x-auto max-h-[55vh] custom-scrollbar text-gray-700 leading-relaxed">
          {JSON.stringify(normalizedValue, null, 2)}
        </pre>
      );
    }

    if (typeof normalizedValue === 'string') {
      const isMarkdown = normalizedValue.includes('#') || normalizedValue.includes('|') || normalizedValue.includes('**') || normalizedValue.includes('- ') || normalizedValue.length > 50;
      if (isMarkdown) {
        return (
          <div className="space-y-1.5">
            {isAgentStoppedEarly && (
              <div className="p-2 bg-amber-50 border border-amber-100 text-amber-800 text-[8.5px] font-bold rounded-lg flex items-center gap-1.5 leading-normal">
                <AlertCircle size={10} className="shrink-0" />
                <span>The agent stopped early (tool limit / fallback) — try again or pick a more reliable model.</span>
              </div>
            )}
            <div className="prose prose-sm max-w-none text-gray-800 bg-white border border-gray-100 rounded-xl p-4 shadow-sm overflow-x-auto max-h-[55vh] custom-scrollbar markdown-body text-[13.5px] leading-relaxed">
              <Markdown remarkPlugins={[remarkGfm]}>{normalizedValue}</Markdown>
            </div>
          </div>
        );
      }
      return <span className="font-mono text-[13px] text-gray-800 break-all leading-relaxed bg-gray-50 px-3 py-2 rounded border border-gray-100 block">{normalizedValue}</span>;
    }

    return <span className="font-mono text-[13px] text-gray-800 bg-gray-50 px-3 py-2 rounded border border-gray-100 block">{String(normalizedValue)}</span>;
  };

  return (
    <div className="space-y-1 w-full text-left">
      <style dangerouslySetInnerHTML={{ __html: `
        .markdown-body table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          margin: 16px 0;
          font-size: 11px;
          line-height: 1.5;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        .markdown-body th {
          background-color: #f8fafc;
          color: #475569;
          font-weight: 800;
          border-bottom: 1px solid #e5e7eb;
          border-right: 1px solid #e5e7eb;
          padding: 10px 14px;
          text-align: left;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }
        .markdown-body th:last-child {
          border-right: none;
        }
        .markdown-body td {
          border-bottom: 1px solid #f1f5f9;
          border-right: 1px solid #f1f5f9;
          padding: 10px 14px;
          color: #334155;
          vertical-align: top;
        }
        .markdown-body td:last-child {
          border-right: none;
        }
        .markdown-body tr:last-child td {
          border-bottom: none;
        }
        .markdown-body tr:nth-child(even) {
          background-color: #fcfcfd;
        }
        .markdown-body tr:hover {
          background-color: #f8fafc;
        }
        .markdown-body p {
          margin-bottom: 10px;
        }
        .markdown-body p:last-child {
          margin-bottom: 0;
        }
        .markdown-body strong {
          color: #0f172a;
          font-weight: 700;
        }
        .markdown-body ul, .markdown-body ol {
          margin-bottom: 12px;
          padding-left: 1.5rem;
        }
        .markdown-body li {
          margin-bottom: 4px;
        }
        .markdown-body blockquote {
          border-left: 4px solid #e2e8f0;
          padding-left: 1rem;
          color: #64748b;
          font-style: italic;
          margin: 1rem 0;
        }
        .markdown-body h1, .markdown-body h2, .markdown-body h3 {
          color: #1e293b;
          font-weight: 800;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          letter-spacing: -0.025em;
        }
        .markdown-body h1 { font-size: 1.25rem; }
        .markdown-body h2 { font-size: 1.1rem; }
        .markdown-body h3 { font-size: 1rem; }
      `}} />
      {label && <div className="text-[10.5px] font-black text-gray-500 uppercase tracking-widest pl-1 mb-1">{label}</div>}
      <div className="relative group/val">
        {renderContent()}
        {((typeof normalizedValue === 'string' && normalizedValue.length > 100) || typeof normalizedValue === 'object') && (
          <button 
            onClick={() => setIsExpanded(true)}
            className="absolute top-1.5 right-1.5 p-1 bg-white hover:bg-purple-50 border border-gray-100 hover:text-[#a26da8] text-gray-400 rounded-md opacity-0 group-hover/val:opacity-100 transition-all text-[8px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm"
            title="Expand value block"
          >
            <span>⤢</span> Expand
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between shrink-0">
              <span className="text-xs font-black text-gray-900 uppercase tracking-wider">{label || 'Value Detail'}</span>
              <button onClick={() => setIsExpanded(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar text-left">
              {isAgentStoppedEarly && (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-2xl flex items-center gap-3 mb-4">
                  <AlertCircle size={16} />
                  <span>The agent stopped early (tool limit / fallback) — try again or pick a more reliable model.</span>
                </div>
              )}
              <div className="prose max-w-none text-gray-800 markdown-body text-xs leading-relaxed">
                {typeof normalizedValue === 'object' ? (
                  <div className="space-y-4">
                    {(() => {
                      const textVal = normalizedValue.value ?? normalizedValue.text ?? normalizedValue.response;
                      const hasText = typeof textVal === 'string';
                      const otherKeys = Object.keys(normalizedValue).filter(k => k !== 'value' && k !== 'text' && k !== 'response');
                      
                      return (
                        <>
                          {hasText && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Agent Response</span>
                              <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                <Markdown remarkPlugins={[remarkGfm]}>{textVal}</Markdown>
                              </div>
                            </div>
                          )}
                          {otherKeys.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Structured Data Outputs</span>
                              <pre className="font-mono text-xs p-4 bg-gray-50 rounded-xl leading-relaxed overflow-x-auto">
                                {JSON.stringify(
                                  hasText 
                                    ? Object.fromEntries(Object.entries(normalizedValue).filter(([k]) => k !== 'value' && k !== 'text' && k !== 'response'))
                                    : normalizedValue,
                                  null,
                                  2
                                )}
                              </pre>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : typeof normalizedValue === 'string' ? (
                  <Markdown remarkPlugins={[remarkGfm]}>{normalizedValue}</Markdown>
                ) : (
                  <pre className="font-mono text-xs p-4 bg-gray-50 rounded-xl leading-relaxed">{String(normalizedValue)}</pre>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface PlaygroundTabProps {
  agentId: string;
  refreshKey?: number;
}

const PlaygroundTab: React.FC<PlaygroundTabProps> = ({ agentId }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [running, setRunning] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [catalog, setCatalog] = useState<{
    nodeTypes: any[];
    connectors: any[];
    agents: any[];
  }>({ nodeTypes: [], connectors: [], agents: [] });

  const [activeView, setActiveView] = useState<'builder' | 'runs' | 'schedules' | 'library'>('builder');
  const [flows, setFlows] = useState<any[]>([]);
  const [fetchingFlows, setFetchingFlows] = useState(false);
  const [addingField, setAddingField] = useState<{ type: 'input_schema' | 'param' | 'mutation', value: string } | null>(null);
  
  const [flowId, setFlowId] = useState<string | null>(null);
  const [flowName, setFlowName] = useState<string>('Untitled Flow');
  const [dataManager, setDataManager] = useState<{
    arguments: any[];
    variables: any[];
  }>({ arguments: [], variables: [] });
  const [activePalette, setActivePalette] = useState<'nodes' | 'agents'>('nodes');
  
  const [runInput, setRunInput] = useState<string>('{\n  "topic": "world"\n}');
  const [showRunModal, setShowRunModal] = useState(false);
  const [runs, setRuns] = useState<any[]>([]);
  const [selectedRun, setSelectedRun] = useState<any>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);

  const [runInputFields, setRunInputFields] = useState<Record<string, any>>({});
  const [activeInspectNodeId, setActiveInspectNodeId] = useState<string | null>(null);
  const [runDetailTab, setRunDetailTab] = useState<'flow' | 'data'>('flow');
  const [useRawJson, setUseRawJson] = useState<boolean>(false);
  const [runFullscreen, setRunFullscreen] = useState<boolean>(true);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [savingSchedule, setSavingSchedule] = useState<boolean>(false);
  const [scheduleForm, setScheduleForm] = useState<{ name: string; triggerType: 'cron' | 'interval'; cron: string; everyMinutes: number; enabled: boolean }>({
    name: '',
    triggerType: 'interval',
    cron: '0 9 * * *',
    everyMinutes: 60,
    enabled: true,
  });

  const [fetchingRuns, setFetchingRuns] = useState(false);
  const [fetchingSchedules, setFetchingSchedules] = useState(false);
  const pollIntervalRef = useRef<any>(null);
  const [confirmAction, setConfirmAction] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const viewRun = async (run: any) => {
    // Open instantly with the lightweight list row so the modal feels responsive.
    setActiveInspectNodeId(null);
    setRunDetailTab('flow');
    setSelectedRun(run);
    // The runs LIST endpoint returns lightweight rows (logs[]/nodes[]/output/context are stripped
    // for size). Always re-fetch the full run document so the timeline, node trace, data states and
    // final output actually render. Cache-busted to avoid a frozen 304 response.
    try {
      const res = await apiService.playground.runs.get(`${run._id}?_=${Date.now()}`);
      if (res.success && res.data) setSelectedRun(res.data);
    } catch (e) {
      // Keep the lightweight row visible; panels will show whatever is available.
      console.error('Failed to load full run detail', e);
    }
  };

  const isEmptyValue = (val: any) => {
    if (val === undefined || val === null || val === '') return true;
    if (Array.isArray(val) && val.length === 0) return true;
    if (typeof val === 'object' && Object.keys(val).length === 0) return true;
    return false;
  };

  const resolveValueFromTrace = (fieldName: string, fieldType: 'args' | 'vars', run: any) => {
    if (!run) return null;
    
    // 1. Check if the run has the value explicitly on its final context
    const contextVal = run.context?.[fieldType]?.[fieldName];
    if (contextVal !== undefined && contextVal !== null && contextVal !== '') {
      return contextVal;
    }

    // 2. For input arguments, check run.input
    if (fieldType === 'args') {
      const inputVal = run.input?.[fieldName];
      if (inputVal !== undefined && inputVal !== null && inputVal !== '') {
        return inputVal;
      }
    }

    // 2. Fallback: Search the execution steps trace backwards
    const steps = run.nodes || [];
    for (let i = steps.length - 1; i >= 0; i--) {
      const step = steps[i];
      if (step.status !== 'completed') continue; // only completed steps have valid output
      
      // Resolve the configuration of this node
      const canvasNode = nodes.find(n => n.id === step.node_id);
      const graphNode = run.graph?.nodes?.find((gn: any) => gn.node_id === step.node_id);
      const flowNode = run.flow?.graph?.nodes?.find((gn: any) => gn.node_id === step.node_id);
      
      const nodeConfig = canvasNode?.data?.config || graphNode?.config || flowNode?.config || step.config || {};
      const outputAssign = nodeConfig.output_assign || [];
      const targetMatch = `${fieldType}.${fieldName}`;
      
      const foundAssign = outputAssign.find((assign: any) => {
        if (!assign || !assign.to) return false;
        const cleanTo = assign.to.trim();
        return cleanTo === targetMatch || 
               cleanTo === fieldName || 
               cleanTo === `$.${fieldName}` ||
               cleanTo === `$.${fieldType}.${fieldName}`;
      });

      if (foundAssign) {
        // We found a node that was configured to assign to this variable/argument!
        const stepOutputWrapped = step.output;
        if (stepOutputWrapped !== undefined && stepOutputWrapped !== null) {
          // Unwrap stepOutput
          const stepOutput = (typeof stepOutputWrapped === 'object' && ('value' in stepOutputWrapped || 'text' in stepOutputWrapped || 'response' in stepOutputWrapped))
            ? (stepOutputWrapped.value ?? stepOutputWrapped.text ?? stepOutputWrapped.response)
            : stepOutputWrapped;

          if (stepOutput !== undefined && stepOutput !== null) {
            const fromKey = foundAssign.from || '$';
            if (fromKey === '$') {
              return stepOutput;
            } else {
              // Handle JSON path-like keys (e.g. $.data.articles)
              const pathParts = fromKey.replace(/^\$\.?/, '').split('.');
              let current = stepOutput;
              for (const part of pathParts) {
                if (current && typeof current === 'object' && part in current) {
                  current = current[part];
                } else {
                  current = undefined;
                  break;
                }
              }
              if (current !== undefined && current !== null) return current;
            }
          }
        }
      }

      // Dynamic parsing fallback: If no explicit mapping, but node output has a field with this name
      const stepOutputRaw = step.output;
      if (stepOutputRaw && typeof stepOutputRaw === 'object') {
        const stepOutput = stepOutputRaw.value ?? stepOutputRaw.text ?? stepOutputRaw.response ?? stepOutputRaw;
        if (stepOutput && typeof stepOutput === 'object' && stepOutput[fieldName] !== undefined && stepOutput[fieldName] !== null) {
          return stepOutput[fieldName];
        }
      }
    }
    
    return null;
  };

  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!initialLoadDone.current) {
      fetchInitialData();
      initialLoadDone.current = true;
    }
    if (activeView === 'runs') fetchRuns();
    if (activeView === 'schedules') fetchSchedules();
    if (activeView === 'library') fetchFlows();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [agentId, activeView]);

  useEffect(() => {
    if (selectedRun && ['running', 'queued', 'waiting_approval'].includes(selectedRun.status)) {
      startPolling(selectedRun._id);
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [selectedRun?._id, selectedRun?.status]);

  const fetchFlows = async () => {
    setFetchingFlows(true);
    try {
      const res = await apiService.playground.flows.list();
      if (res.success) {
        setFlows(res.data || []);
      } else {
        throw new Error(res.error || 'Failed to fetch flows');
      }
    } catch (err: any) {
      console.error('Failed to fetch flows:', err);
      toast.error('Could not sync with library: ' + (err.message || 'Server unreachable'));
    } finally {
      setFetchingFlows(false);
    }
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [nodesRes, connectorsRes, agentsRes, flowsRes] = await Promise.all([
        apiService.playground.catalog.getNodeTypes(),
        apiService.playground.catalog.getConnectors(),
        apiService.playground.catalog.getAgents(),
        apiService.playground.flows.list()
      ]);

      setCatalog({
        nodeTypes: nodesRes.data || [],
        connectors: connectorsRes.data || [],
        agents: agentsRes.data || []
      });

      // Find if there's an existing flow for this agent or just load the first one for now
      if (!flowId && flowsRes && flowsRes.data && flowsRes.data.length > 0) {
        const flow = flowsRes.data[0];
        if (flow && flow._id) loadFlow(flow._id);
      } else if (!flowId) {
        // Create initial flow
        const newFlow = await apiService.playground.flows.create({
          name: `Agent Orchestration - ${agentId}`,
          description: 'Multi-agent orchestration workflow'
        });
        if (newFlow.success) {
          setFlowId(newFlow.data._id);
          setNodes([]);
          setEdges([]);
        }
      }
    } catch (error) {
      console.error('Failed to load playground data:', error);
      toast.error('Failed to load playground components');
    } finally {
      setLoading(false);
    }
  };

  const loadFlow = async (id: string) => {
    setLoading(true);
    try {
      const res = await apiService.playground.flows.get(id);
    if (res.success) {
      setFlowId(res.data._id);
      setFlowName(res.data.name || 'Untitled Flow');
      setDataManager(res.data.data_manager || { arguments: [], variables: [] });
      setSelectedNode(null);
      setSelectedEdge(null);
      setAddingField(null);
      const { graph } = res.data;
      if (graph) {
        const rfNodes = (graph.nodes || []).map((n: any) => ({
          id: n.node_id,
          type: 'custom',
          position: { x: n.x, y: n.y },
          data: { 
            type: n.type, 
            label: n.label, 
            config: n.config,
            subLabel: getSubLabel(n)
          },
        }));
        const rfEdges = (graph.edges || []).map((e: any) => {
          const kind = e.kind || 'sequence';
          let stroke = '#94a3b8';
          let strokeDasharray = undefined;
          
          if (kind === 'conditional') stroke = '#c792ea';
          if (kind === 'parallel') stroke = '#6366f1';
          if (kind === 'escalation') { stroke = '#f59e0b'; strokeDasharray = '5 5'; }
          
          return {
            id: e.edge_id,
            source: e.from,
            target: e.to,
            label: e.label || e.outcome,
            animated: true,
            data: { kind, outcome: e.outcome },
            markerEnd: { type: MarkerType.ArrowClosed, color: stroke },
            style: { stroke, strokeWidth: 2, strokeDasharray }
          };
        });
        setNodes(rfNodes);
        setEdges(rfEdges);
      }
    }
    } catch (error) {
      toast.error('Failed to load flow');
    } finally {
      setLoading(false);
    }
  };

  const getSubLabel = (node: any) => {
    if (node.type === 'agent') {
      const agent = catalog.agents.find(a => (a.id === node.config?.agent_id || a._id === node.config?.agent_id));
      return agent ? agent.name : 'No agent picked';
    }
    if (node.type === 'connector') {
      return node.config?.connector || 'No tool selected';
    }
    return '';
  };

  const loadSample = () => {
    setFlowName('Global News Researcher');
    setDataManager({
      arguments: [
        { name: 'location', direction: 'in', type: 'string', required: true, default: 'London', description: 'The place to research news for' },
        { name: 'news_articles', direction: 'out', type: 'string', required: false, default: '', description: 'Top news articles output' }
      ],
      variables: [
        { name: 'news_articles', type: 'string', default: '' }
      ]
    });

    const sNodes: Node[] = [
      { id: 'start', type: 'custom', position: { x: 100, y: 150 }, data: { type: 'start', label: 'Location Input' } },
      { 
        id: 'news_agent', 
        type: 'custom', 
        position: { x: 400, y: 150 }, 
        data: { 
          type: 'agent', 
          label: 'News Researcher', 
          config: { 
            agent_id: catalog.agents[0]?.id || catalog.agents[0]?._id || 'news-agent-id',
            input_map: [{ k: 'message', v: 'Find the top 10 news articles for {{args.location}}' }],
            output_assign: [
              { to: 'vars.news_articles', from: '$' },
              { to: 'args.news_articles', from: '$' }
            ]
          } 
        } 
      },
      { id: 'end', type: 'custom', position: { x: 700, y: 150 }, data: { type: 'end', label: 'Results Ready' } },
    ];

    const sEdges: Edge[] = [
      { id: 'e1', source: 'start', target: 'news_agent', animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' } },
      { id: 'e2', source: 'news_agent', target: 'end', animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' } },
    ];

    // Update sublabels
    const nodesWithSublabels = sNodes.map(n => ({
      ...n,
      data: { ...n.data, subLabel: getSubLabel({ type: n.data.type, config: n.data.config }) }
    }));

    setNodes(nodesWithSublabels);
    setEdges(sEdges);
    toast.success('News Researcher sample loaded');
  };

  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find(n => n.id === params.source);
      
      let kind = 'sequence';
      let stroke = '#94a3b8';

      if (sourceNode?.data.type === 'condition') {
        kind = 'conditional';
        stroke = '#c792ea';
      } else if (sourceNode?.data.type === 'parallel') {
        kind = 'parallel';
        stroke = '#6366f1';
      }

      const edge = {
        ...params,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color: stroke },
        style: { stroke, strokeWidth: 2 },
        data: { kind }
      };

      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges, nodes]
  );

  const addNode = (type: string) => {
    const config = NODE_TYPES_CONFIG[type];
    let defaultConfig = {};
    if (type === 'agent') {
      const ins = (dataManager.arguments || []).filter((a: any) => a.direction === 'in');
      const vars = (dataManager.variables || []);
      const primaryInArg = ins[0]?.name || 'location';
      const primaryTarget = vars[0]?.name ? `vars.${vars[0].name}` : 'vars.news_articles';
      defaultConfig = { 
        input_map: [{ k: 'message', v: `Find and analyze data for {{args.${primaryInArg}}}` }], 
        output_assign: [{ to: primaryTarget, from: '$' }] 
      };
    }
    if (type === 'connector') defaultConfig = { input_map: [], output_assign: [] };
    if (type === 'api_call') defaultConfig = { input_map: [], output_assign: [], method: 'POST' };
    if (type === 'condition') defaultConfig = { outcomes: [], default_route: '' };
    if (type === 'transform') defaultConfig = { assign: [] };
    if (type === 'join') defaultConfig = { merge: 'merge' };
    if (type === 'human_task') defaultConfig = { title: '', assignees: '', outcomes: [{ label: 'Approve', route: '' }], sla_duration: '', sla_breach: 'none', escalate_to: '' };

    const newNode: Node = {
      id: `n${nodes.length + 1}_${Date.now()}`,
      type: 'custom',
      position: { x: 100 + nodes.length * 30, y: 100 + nodes.length * 30 },
      data: { 
        type, 
        label: config.name, 
        config: defaultConfig,
        subLabel: ''
      },
      selected: true
    };
    
    // Select the newly added node and deselect others
    setNodes((nds) => [...nds.map(n => ({ ...n, selected: false })), newNode]);
    setSelectedNode(newNode);
    setSelectedEdge(null);
  };

  const handleSave = async (isNew = false) => {
    setSaving(true);
    try {
      const graph = {
        nodes: nodes.map(n => ({
          node_id: n.id,
          type: n.data.type,
          label: n.data.label,
          x: Math.round(n.position.x),
          y: Math.round(n.position.y),
          config: n.data.config
        })),
        edges: edges.map(e => ({
          edge_id: e.id,
          from: e.source,
          to: e.target,
          label: e.label,
          kind: e.data?.kind || 'sequence',
          outcome: e.data?.outcome || (e.data?.kind === 'conditional' ? e.label : null)
        }))
      };

      const payload = {
        name: flowName,
        data_manager: dataManager,
        graph
      };

      let res;
      if (flowId && !isNew) {
        res = await apiService.playground.flows.update(flowId, payload);
      } else {
        res = await apiService.playground.flows.create(payload);
      }

      if (res && res.success && res.data) {
        setFlowId(res.data._id);
        toast.success(isNew ? 'New flow created' : 'Flow saved successfully');
        fetchFlows();
      } else {
        throw new Error(res?.error || 'Save failed');
      }
    } catch (error) {
      toast.error('Failed to save flow');
    } finally {
      setSaving(false);
    }
  };

  const fetchRuns = async () => {
    if (!flowId) return;
    setFetchingRuns(true);
    try {
      const res = await apiService.playground.runs.list({ flow_id: flowId });
      if (res.success) setRuns(res.data);
    } catch (e) {
      console.error('Failed to fetch runs');
    } finally {
      setFetchingRuns(false);
    }
  };

  const fetchSchedules = async () => {
    if (!flowId) return;
    setFetchingSchedules(true);
    try {
      const res = await apiService.playground.schedules.list({ flow_id: flowId });
      if (res.success) setSchedules(res.data);
    } catch (e) {
      console.error('Failed to fetch schedules');
    } finally {
      setFetchingSchedules(false);
    }
  };

  const openScheduleModal = () => {
    if (!flowId) {
      toast.error('Save the flow first, then add a schedule');
      return;
    }
    setScheduleForm({ name: '', triggerType: 'interval', cron: '0 9 * * *', everyMinutes: 60, enabled: true });
    setShowScheduleModal(true);
  };

  const createSchedule = async () => {
    if (!flowId) {
      toast.error('Save the flow first');
      return;
    }
    if (!scheduleForm.name.trim()) {
      toast.error('Give the schedule a name');
      return;
    }
    const trigger = scheduleForm.triggerType === 'cron'
      ? { type: 'cron', cron: scheduleForm.cron.trim() }
      : { type: 'interval', every_minutes: Number(scheduleForm.everyMinutes) || 60 };

    setSavingSchedule(true);
    try {
      const res = await apiService.playground.schedules.create(flowId, {
        name: scheduleForm.name.trim(),
        enabled: scheduleForm.enabled,
        trigger,
      });
      if (res && res.success) {
        toast.success('Schedule created');
        setShowScheduleModal(false);
        fetchSchedules();
      } else {
        throw new Error(res?.error || 'Failed to create schedule');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to create schedule');
    } finally {
      setSavingSchedule(false);
    }
  };

  const toggleSchedule = async (sch: any) => {
    try {
      const res = await apiService.playground.schedules.update(sch._id, { enabled: !sch.enabled });
      if (res && res.success) {
        fetchSchedules();
      } else {
        throw new Error(res?.error || 'Update failed');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to update schedule');
    }
  };

  const deleteSchedule = (sch: any) => {
    setConfirmAction({
      message: `Delete the schedule "${sch.name}"? This stops its automated runs.`,
      onConfirm: async () => {
        try {
          await apiService.playground.schedules.delete(sch._id);
          setSchedules(prev => prev.filter(s => s._id !== sch._id));
          toast.success('Schedule removed');
        } catch (e: any) {
          toast.error(e.message || 'Failed to delete schedule');
        }
      },
    });
  };

  const runFlow = async () => {
    if (!flowId) return;
    let parsedInput: any = {};

    if (useRawJson) {
      try {
        parsedInput = JSON.parse(runInput);
      } catch (e) {
        toast.error('Invalid JSON input');
        return;
      }
    } else {
      const inputArgs = (dataManager.arguments || [])
        .filter((arg: any) => arg.direction === 'in' || arg.direction === 'inout');

      for (const arg of inputArgs) {
        const val = runInputFields[arg.name];
        if (arg.required && (val === undefined || val === null || val === '')) {
          toast.error(`Input field "${arg.name}" is required`);
          return;
        }
        parsedInput[arg.name] = val;
      }
    }

    setRunning(true);
    setShowRunModal(false);
    try {
      const runRes = await apiService.playground.flows.run(flowId, { input: parsedInput });
      if (runRes.success) {
        toast.success('Flow run initiated');
        setSelectedRun(runRes.data); // Open run detail instantly!
        startPolling(runRes.data._id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to run flow');
      setRunning(false);
    }
  };

  const handleRun = () => {
    const initialFields: Record<string, any> = {};
    (dataManager.arguments || [])
      .filter((arg: any) => arg.direction === 'in' || arg.direction === 'inout')
      .forEach((arg: any) => {
        initialFields[arg.name] = arg.default !== undefined && arg.default !== null ? arg.default : '';
      });
    setRunInputFields(initialFields);
    setRunInput(JSON.stringify(initialFields, null, 2));
    setShowRunModal(true);
  };

  const startPolling = (runId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    
    pollIntervalRef.current = setInterval(async () => {
      try {
        const cacheBuster = `?_=${Date.now()}`;
        const res = await apiService.playground.runs.get(runId + cacheBuster);
        if (res.success) {
          const run = res.data;
          
          setSelectedRun((currentSelected: any) => {
            if (currentSelected && currentSelected._id === runId) {
              return run;
            }
            return currentSelected;
          });
          
          setNodes((nds) =>
            nds.map((node) => {
              const runNode = run.nodes?.find((rn: any) => rn.node_id === node.id);
              if (runNode) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    status: runNode.status
                  }
                };
              }
              return node;
            })
          );

          if (['completed', 'failed', 'cancelled'].includes(run.status)) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            setRunning(false);
            if (run.status === 'completed') {
              toast.success('Execution Finished', { icon: '✅' });
            } else {
              toast.error(`Execution ${run.status}`, { icon: '❌' });
            }
          }
        }
      } catch (e) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
        setRunning(false);
      }
    }, 1500);
  };

  const updateNodeData = (nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const updatedNode = {
            ...node,
            data: {
              ...node.data,
              ...newData,
            },
          };
          // Update subLabel if agent/connector changed
          updatedNode.data.subLabel = getSubLabel({ type: updatedNode.data.type, config: updatedNode.data.config });
          return updatedNode;
        }
        return node;
      })
    );
  };

  const activeNode = nodes.find(n => n.id === selectedNode?.id) || selectedNode;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#a26da8] animate-spin" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Waking Canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[800px] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
            <Sparkles size={16} className="text-[#a26da8]" />
          </div>
          <div>
            <div className="text-[11px] font-black text-gray-900 uppercase tracking-tight">Agent Flow Playground</div>
            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Maestro-style visual orchestration</div>
          </div>
        </div>

        <div className="flex bg-white/50 backdrop-blur-sm border border-gray-100 rounded-2xl p-1 shadow-sm items-center">
          <button 
            onClick={() => setActiveView('builder')} 
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeView === 'builder' ? 'bg-[#a26da8] text-white shadow-lg shadow-purple-100' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Layers size={14} />
            Builder
          </button>
          <button 
            onClick={() => setActiveView('library')} 
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeView === 'library' ? 'bg-[#a26da8] text-white shadow-lg shadow-purple-100' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Database size={14} />
            Library
          </button>
          <button 
            onClick={() => setActiveView('runs')} 
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeView === 'runs' ? 'bg-[#a26da8] text-white shadow-lg shadow-purple-100' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <History size={14} />
            Runs
          </button>
          <button 
            onClick={() => setActiveView('schedules')} 
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeView === 'schedules' ? 'bg-[#a26da8] text-white shadow-lg shadow-purple-100' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Clock size={14} />
            Schedules
          </button>

          {activeView === 'builder' && (
            <div className="h-4 w-px bg-gray-100 mx-3" />
          )}
          
          {activeView === 'builder' && (
            <div className="px-5 py-1 flex items-center gap-3 border-l border-gray-100 ml-2 animate-in fade-in slide-in-from-left-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-sm shadow-green-200" />
              <div className="flex flex-col">
                <span className="text-[7px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mb-1">Active Configuration</span>
                <input 
                  value={flowName}
                  onChange={(e) => setFlowName(e.target.value)}
                  className="text-[10px] font-black text-gray-900 uppercase tracking-widest bg-transparent outline-none border-none p-0 h-4 focus:ring-0 w-48"
                  placeholder="Name your flow..."
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setFlowId(null);
              setFlowName('Untitled Flow');
              setNodes([]);
              setEdges([]);
              setDataManager({ arguments: [], variables: [] });
              setSelectedNode(null);
              setSelectedEdge(null);
              setAddingField(null);
              toast.success('Started a fresh flow layout. Click Save to publish.');
            }}
            className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-[#a26da8] hover:bg-purple-50 rounded-xl transition-all font-black text-[9px] uppercase tracking-widest"
          >
            <Plus size={14} />
            New
          </button>
          <button 
            onClick={() => {
              setConfirmAction({
                message: "Are you sure you want to clear the canvas? (This won't affect your saved flow on the server until you explicitly Save or Update)",
                onConfirm: () => {
                  setNodes([]);
                  setEdges([]);
                  setDataManager({ arguments: [], variables: [] });
                  setSelectedNode(null);
                  setSelectedEdge(null);
                  setAddingField(null);
                  toast.success('Canvas cleared locally');
                }
              });
            }}
            className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all font-black text-[9px] uppercase tracking-widest"
          >
            <Trash2 size={14} />
            Clear
          </button>
          <button 
            onClick={loadSample}
            className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-[#a26da8] hover:bg-purple-50 rounded-xl transition-all font-black text-[9px] uppercase tracking-widest"
          >
            <RotateCcw size={14} />
            Sample
          </button>
          <div className="w-px h-6 bg-gray-200 mx-2" />
          <button 
            onClick={() => loadFlow(flowId!)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all"
            title="Reload from server"
          >
            <ArrowRight size={16} className="rotate-180" />
          </button>
          <div className="w-px h-6 bg-gray-200 mx-2" />
          <button 
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-purple-200 hover:text-[#a26da8] transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {flowId ? 'Update' : 'Save'}
          </button>
          {!flowId ? null : (
            <button 
              onClick={() => handleSave(true)}
              disabled={saving}
              className="p-2 border border-gray-200 text-gray-400 hover:text-[#a26da8] hover:border-purple-200 hover:bg-purple-50 rounded-xl transition-all"
              title="Save As New"
            >
              <PlusCircle size={18} />
            </button>
          )}
          <button 
            onClick={handleRun}
            disabled={running || validating}
            className="flex items-center gap-2 px-5 py-2 bg-[#a26da8] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#8e5a94] transition-all shadow-lg shadow-purple-100 disabled:opacity-50"
          >
            {validating ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Run Flow
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 relative">
        {activeView === 'library' && (
          <div className="flex-1 p-12 bg-white flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto">
            <div className="flex items-end justify-between border-b border-gray-50 pb-8">
              <div>
                <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Flow Library</h1>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">Manage and load saved flow configurations</p>
              </div>
              <button 
                onClick={fetchFlows}
                className="p-3 bg-gray-50 text-gray-400 hover:text-[#a26da8] hover:bg-purple-50 rounded-2xl transition-all"
                title="Refresh Library"
              >
                <Activity size={20} className={fetchingFlows ? 'animate-spin' : ''} />
              </button>
            </div>

            {fetchingFlows ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
                <Loader2 className="animate-spin text-[#a26da8]" size={32} />
                <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Retrieving Library...</div>
              </div>
            ) : flows.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-6 py-20 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-100">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-gray-200 shadow-sm">
                  <Database size={32} />
                </div>
                <div className="text-center space-y-2">
                  <div className="text-sm font-black text-gray-900 uppercase tracking-tight">No flows found</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Save your first flow in the builder to see it here</div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {flows.map(flow => {
                  const nodeCount = flow.node_count ?? flow.graph?.nodes?.length ?? flow.nodes?.length ?? 0;
                  const edgeCount = flow.edge_count ?? flow.graph?.edges?.length ?? flow.edges?.length ?? 0;
                  const initial = (flow.name || 'F').trim().charAt(0).toUpperCase();
                  return (
                  <div key={flow._id} className="p-6 bg-white border border-gray-100 rounded-[28px] hover:border-purple-200 hover:shadow-lg transition-all flex flex-col gap-5">
                    {/* Top row: avatar + badge */}
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#a26da8] to-[#6fcbbd] text-white flex items-center justify-center text-lg font-black shadow-sm">
                        {initial}
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="px-2.5 py-1 bg-purple-50 text-[#a26da8] rounded-full text-[8px] font-black uppercase tracking-widest">Flow</span>
                        <span className="text-[9px] font-bold text-gray-400">{flow.updatedAt ? new Date(flow.updatedAt).toLocaleDateString() : ''}</span>
                      </div>
                    </div>

                    {/* Title + description */}
                    <div className="space-y-1">
                      <h3 className="text-base font-black text-gray-900 tracking-tight leading-snug line-clamp-2">{flow.name}</h3>
                      <p className="text-[11px] font-medium text-gray-400 line-clamp-2 leading-relaxed">{flow.description || 'Multi-step agent workflow'}</p>
                    </div>

                    {/* Stat sub-cards */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-2xl px-3 py-2.5 border border-gray-100">
                        <div className="flex items-center gap-1.5 text-gray-400"><Layers size={11} /><span className="text-[8px] font-black uppercase tracking-widest">Nodes</span></div>
                        <div className="text-sm font-black text-gray-900 mt-0.5">{nodeCount}</div>
                      </div>
                      <div className="bg-gray-50 rounded-2xl px-3 py-2.5 border border-gray-100">
                        <div className="flex items-center gap-1.5 text-gray-400"><GitBranch size={11} /><span className="text-[8px] font-black uppercase tracking-widest">Connections</span></div>
                        <div className="text-sm font-black text-gray-900 mt-0.5">{edgeCount}</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <button
                        onClick={() => {
                          setConfirmAction({
                            message: `Are you sure you want to delete the flow configuration "${flow.name}"? This action cannot be undone.`,
                            onConfirm: async () => {
                              try {
                                await apiService.playground.flows.delete(flow._id);
                                setFlows(prev => prev.filter(f => f._id !== flow._id));
                                toast.success('Flow deleted');
                              } catch (err) {
                                toast.error('Failed to delete');
                              }
                            }
                          });
                        }}
                        className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete flow"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          loadFlow(flow._id);
                          setActiveView('builder');
                          toast.success(`Loaded "${flow.name}"`);
                        }}
                        className="px-5 py-2.5 bg-[#a26da8] text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-[#8e5a94] transition-all shadow-sm flex items-center gap-1.5"
                      >
                        Load Flow <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeView === 'builder' ? (
          <>
            {/* Palette sidebar */}
        <div className="w-80 border-r border-gray-100 bg-white flex flex-col shrink-0 overflow-hidden">
          <div className="p-6 border-b border-gray-50 bg-gray-50/30">
            <div className="flex p-1 bg-gray-100 rounded-xl">
              <button 
                onClick={() => setActivePalette('nodes')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  activePalette === 'nodes' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'
                }`}
              >
                <Layers size={12} />
                Elements
              </button>
              <button 
                onClick={() => setActivePalette('agents')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  activePalette === 'agents' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'
                }`}
              >
                <Brain size={12} />
                Agents
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4">
            {activePalette === 'nodes' ? (
              Object.entries(NODE_TYPES_CONFIG).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <button
                    key={type}
                    onClick={() => addNode(type)}
                    className="w-full group flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-50 hover:border-purple-100 hover:bg-purple-50/30 transition-all text-left"
                  >
                    <div className="p-3 rounded-xl transition-all group-hover:scale-110" style={{ backgroundColor: `${config.color}15`, color: config.color }}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="text-[11px] font-black text-gray-900 uppercase tracking-tight mb-0.5">{config.name}</div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wide leading-tight">{config.description}</div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="space-y-3">
                {catalog.agents.map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      const newNode: Node = {
                        id: `n${nodes.length + 1}`,
                        type: 'custom',
                        position: { x: 100, y: 100 },
                        data: { 
                          type: 'agent', 
                          label: agent.name, 
                          config: { agent_id: agent.id },
                          subLabel: agent.name
                        },
                      };
                      setNodes((nds) => [...nds, newNode]);
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-50 hover:border-purple-100 hover:bg-purple-50/30 transition-all text-left bg-white"
                  >
                    <div className="p-3 rounded-xl bg-purple-50 text-[#a26da8]">
                      <Brain size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-black text-gray-900 uppercase tracking-tight mb-0.5 truncate">{agent.name}</div>
                      <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest truncate">{agent.llm?.model || 'Nemotron 120B'}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-100">
             <div className="flex items-center gap-2 mb-3">
                <Info size={12} className="text-gray-400" />
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">Canvas Help</span>
             </div>
             <p className="text-[10px] font-bold text-gray-400 leading-relaxed uppercase tracking-tight">
                Nodes marked with <Activity size={8} className="inline mr-1" /> show live execution status.
             </p>
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 min-w-0 bg-[#f8fafc] relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => { setSelectedNode(node); setSelectedEdge(null); setAddingField(null); }}
            onEdgeClick={(_, edge) => { setSelectedEdge(edge); setSelectedNode(null); setAddingField(null); }}
            onPaneClick={() => { setSelectedNode(null); setSelectedEdge(null); setAddingField(null); }}
            fitView
          >
            <Background color="#cbd5e1" gap={24} />
            <Controls className="!bg-white !border-gray-100 !shadow-xl !rounded-xl overflow-hidden" />
          </ReactFlow>
        </div>

        {/* Properties sidebar */}
        <div className="w-80 border-l border-gray-100 bg-white p-6 overflow-y-auto shrink-0 shadow-2xl animate-in slide-in-from-right duration-300 custom-scrollbar">
          {!activeNode && !selectedEdge ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-8">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Flow Orchestrator</div>
                <div className="p-1.5 bg-purple-50 text-[#a26da8] rounded-lg">
                  <Settings2 size={16} />
                </div>
              </div>
              <DataManagerPanel dataManager={dataManager} setDataManager={setDataManager} />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{activeNode ? 'Node Properties' : 'Edge Properties'}</div>
                <button 
                  onClick={() => { setSelectedNode(null); setSelectedEdge(null); }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-6">
                {selectedEdge ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Edge Label</label>
                      <input 
                        type="text"
                        value={selectedEdge.label as string || ''}
                        onChange={(e) => {
                          const newLabel = e.target.value;
                          setEdges((eds) => eds.map(edge => edge.id === selectedEdge.id ? { ...edge, label: newLabel } : edge));
                          setSelectedEdge(prev => prev ? { ...prev, label: newLabel } : null);
                        }}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none"
                        placeholder="e.g. Success, Rejected"
                      />
                    </div>
                    {selectedEdge.data?.kind === 'conditional' && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Outcome Trigger</label>
                        <input 
                          type="text"
                          value={selectedEdge.data?.outcome || ''}
                          onChange={(e) => {
                            const newOutcome = e.target.value;
                            setEdges((eds) => eds.map(edge => edge.id === selectedEdge.id ? { ...edge, data: { ...edge.data, outcome: newOutcome }, label: newOutcome } : edge));
                            setSelectedEdge(prev => prev ? { ...prev, data: { ...prev.data, outcome: newOutcome }, label: newOutcome } : null);
                          }}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none"
                          placeholder="Outcome name"
                        />
                      </div>
                    )}
                    <button 
                      onClick={() => {
                        setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
                        setSelectedEdge(null);
                      }}
                      className="w-full mt-10 flex items-center justify-center gap-2 px-4 py-3 border border-red-100 text-red-500 bg-red-50/30 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all"
                    >
                      <Trash2 size={14} />
                      Delete Edge
                    </button>
                  </>
                ) : activeNode && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Display Label</label>
                      <input 
                        type="text"
                        value={activeNode.data.label}
                        onChange={(e) => updateNodeData(activeNode.id, { label: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:bg-white focus:border-purple-200 outline-none transition-all"
                        placeholder="Enter custom label"
                      />
                    </div>
                    {(activeNode.data.type === 'agent' || activeNode.data.type === 'connector' || activeNode.data.type === 'api_call' || activeNode.data.type === 'transform' || activeNode.data.type === 'human_task' || activeNode.data.type === 'condition' || activeNode.data.type === 'join') && (
                      <div className="space-y-6 pt-6 border-t border-gray-50">
                        {activeNode.data.type === 'agent' && (
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Target Agent</label>
                            <select 
                              value={activeNode.data.config?.agent_id || ''}
                              onChange={(e) => updateNodeData(activeNode.id, { config: { ...activeNode.data.config, agent_id: e.target.value } })}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none cursor-pointer"
                            >
                              <option value="">Select Published Agent</option>
                              {catalog.agents.map(agent => (
                                <option key={agent.id || agent._id} value={agent.id || agent._id}>{agent.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        
                        {activeNode.data.type === 'connector' && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Platform Connector</label>
                              <select 
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none cursor-pointer"
                                value={activeNode.data.config?.connector || ''}
                                onChange={(e) => updateNodeData(activeNode.id, { config: { ...activeNode.data.config, connector: e.target.value, operation: '' } })}
                              >
                                <option value="">Select Platform Tool</option>
                                {catalog.connectors.map(c => <option key={c.key} value={c.key}>{c.name}</option>)}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Operation</label>
                              <select 
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none cursor-pointer"
                                value={activeNode.data.config?.operation || ''}
                                onChange={(e) => updateNodeData(activeNode.id, { config: { ...activeNode.data.config, operation: e.target.value } })}
                              >
                                <option value="">Select Operation</option>
                                {catalog.connectors.find(c => c.key === activeNode.data.config?.connector)?.operations.map((op: any) => (
                                  <option key={op.name} value={op.name}>{op.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}

                        {activeNode.data.type === 'api_call' && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Request URL</label>
                              <input 
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none"
                                value={activeNode.data.config?.url || ''}
                                onChange={(e) => updateNodeData(activeNode.id, { config: { ...activeNode.data.config, url: e.target.value } })}
                                placeholder="https://api.example.com/..."
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Method</label>
                              <select 
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none cursor-pointer"
                                value={activeNode.data.config?.method || 'POST'}
                                onChange={(e) => updateNodeData(activeNode.id, { config: { ...activeNode.data.config, method: e.target.value } })}
                              >
                                {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                            </div>
                          </div>
                        )}

                        {activeNode.data.type === 'transform' && (
                          <MappingTable 
                            label="Data Mutations" 
                            mode="to-from"
                            mappings={activeNode.data.config?.assign || []} 
                            onChange={(next) => updateNodeData(activeNode.id, { config: { ...activeNode.data.config, assign: next } })}
                            variables={dataManager.variables}
                            arguments_list={dataManager.arguments}
                          />
                        )}

                        {activeNode.data.type === 'join' && (
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Join Strategy</label>
                            <select 
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none cursor-pointer"
                              value={activeNode.data.config?.merge || 'merge'}
                              onChange={(e) => updateNodeData(activeNode.id, { config: { ...activeNode.data.config, merge: e.target.value } })}
                            >
                              <option value="merge">Merge Objects</option>
                              <option value="last">Take Last Output</option>
                              <option value="array">Collect into Array</option>
                            </select>
                          </div>
                        )}

                        {activeNode.data.type === 'human_task' && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Task Title</label>
                              <input 
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none"
                                value={activeNode.data.config?.title || ''}
                                onChange={(e) => updateNodeData(activeNode.id, { config: { ...activeNode.data.config, title: e.target.value } })}
                                placeholder="e.g. Compliance Review"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Assignees</label>
                              <input 
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none"
                                value={activeNode.data.config?.assignees || ''}
                                onChange={(e) => updateNodeData(activeNode.id, { config: { ...activeNode.data.config, assignees: e.target.value } })}
                                placeholder="e.g. analysts, @user"
                              />
                            </div>
                            <div className="space-y-3 pt-4 border-t border-gray-50">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Decision Options</label>
                              {(activeNode.data.config?.outcomes || []).map((oc: any, i: number) => (
                                <div key={i} className="flex gap-2 items-center group">
                                  <input 
                                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold outline-none focus:bg-white"
                                    value={oc.label}
                                    onChange={(e) => {
                                      const outcomes = activeNode.data.config?.outcomes || [];
                                      const next = [...outcomes];
                                      if (next[i]) {
                                        next[i] = { ...next[i], label: e.target.value };
                                        updateNodeData(activeNode.id, { config: { ...activeNode.data.config, outcomes: next } });
                                      }
                                    }}
                                    placeholder="Option Label (e.g. Approved)"
                                  />
                                  <button 
                                    onClick={() => {
                                      const outcomes = activeNode.data.config?.outcomes || [];
                                      const next = outcomes.filter((_: any, idx: number) => idx !== i);
                                      updateNodeData(activeNode.id, { config: { ...activeNode.data.config, outcomes: next } });
                                    }}
                                    className="p-2 text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))}
                              <button 
                                onClick={() => {
                                  const next = [...(activeNode.data.config?.outcomes || []), { label: '', route: '' }];
                                  updateNodeData(activeNode.id, { config: { ...activeNode.data.config, outcomes: next } });
                                }}
                                className="w-full py-2 border border-dashed border-gray-100 rounded-lg text-[9px] font-black uppercase text-gray-400 hover:text-[#a26da8] transition-all"
                              >
                                + Add Option
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">SLA Duration</label>
                                <input 
                                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none"
                                  value={activeNode.data.config?.sla_duration || ''}
                                  onChange={(e) => updateNodeData(activeNode.id, { config: { ...activeNode.data.config, sla_duration: e.target.value } })}
                                  placeholder="e.g. 2h, 3d"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">SLA Breach</label>
                                <select 
                                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none cursor-pointer"
                                  value={activeNode.data.config?.sla_breach || 'none'}
                                  onChange={(e) => updateNodeData(activeNode.id, { config: { ...activeNode.data.config, sla_breach: e.target.value } })}
                                >
                                  <option value="none">None</option>
                                  <option value="escalate">Escalate</option>
                                  <option value="notify">Notify Only</option>
                                  <option value="terminate">Terminate Run</option>
                                </select>
                              </div>
                            </div>
                            {activeNode.data.config?.sla_breach === 'escalate' && (
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Escalate To</label>
                                <input 
                                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none"
                                  value={activeNode.data.config?.escalate_to || ''}
                                  onChange={(e) => updateNodeData(activeNode.id, { config: { ...activeNode.data.config, escalate_to: e.target.value } })}
                                  placeholder="e.g. manager"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {(['agent', 'connector', 'api_call', 'transform'].includes(activeNode.data.type)) && (
                          <>
                            {/* Smart Mapping Assistant for agent / connector / api_call */}
                            {['agent', 'connector', 'api_call'].includes(activeNode.data.type) && (
                              <div className="p-4 bg-purple-50/40 border border-purple-100 rounded-[20px] space-y-2 mb-4">
                                <div className="flex items-center gap-1.5">
                                  <Sparkles size={13} className="text-[#a26da8]" />
                                  <span className="text-[10px] font-black uppercase text-[#a26da8] tracking-widest">Smart Mapping Assistant</span>
                                </div>
                                <p className="text-[9px] font-semibold text-gray-500 leading-normal">
                                  Instantly align variables and arguments in your flow with this node.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const ins = (dataManager.arguments || []).filter((a: any) => a.direction === 'in');
                                    const outs = (dataManager.arguments || []).filter((a: any) => a.direction === 'out');
                                    const vars = (dataManager.variables || []);

                                    let newInputMap = [...(activeNode.data.config?.input_map || [])];
                                    let newOutputAssign = [...(activeNode.data.config?.output_assign || [])];

                                    // Input mapping: Message parameter
                                    const primaryInArg = ins[0]?.name || 'location';
                                    const messageVal = `Find and analyze data for {{args.${primaryInArg}}}`;
                                    
                                    const msgIdx = newInputMap.findIndex((m: any) => m.k === 'message');
                                    if (msgIdx > -1) {
                                      newInputMap[msgIdx] = { k: 'message', v: messageVal };
                                    } else {
                                      newInputMap.push({ k: 'message', v: messageVal });
                                    }

                                    // Output mapping: Map target variables/out arguments
                                    const primaryTarget = vars[0]?.name 
                                      ? `vars.${vars[0].name}` 
                                      : (outs[0]?.name ? `args.${outs[0].name}` : 'vars.output');
                                    
                                    const outIdx = newOutputAssign.findIndex((m: any) => m.to === primaryTarget || m.to.startsWith('vars.'));
                                    if (outIdx > -1) {
                                      newOutputAssign[outIdx] = { to: primaryTarget, from: '$' };
                                    } else {
                                      newOutputAssign.push({ to: primaryTarget, from: '$' });
                                    }

                                    // Also if there is an 'out' argument, assign it as well so final output works perfectly!
                                    const primaryOutArg = outs[0]?.name;
                                    if (primaryOutArg) {
                                      const argOutIdx = newOutputAssign.findIndex((m: any) => m.to === `args.${primaryOutArg}`);
                                      if (argOutIdx === -1) {
                                        newOutputAssign.push({ to: `args.${primaryOutArg}`, from: '$' });
                                      }
                                    }

                                    updateNodeData(activeNode.id, {
                                      config: {
                                        ...activeNode.data.config,
                                        input_map: newInputMap,
                                        output_assign: newOutputAssign
                                      }
                                    });
                                    toast.success('Smart bindings aligned successfully!');
                                  }}
                                  className="w-full mt-1.5 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#a26da8] hover:bg-[#8e5c94] text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shadow-sm"
                                >
                                  <Sparkles size={11} />
                                  Auto-Configure Mappings
                                </button>
                              </div>
                            )}

                            <MappingTable 
                              label="Input Bindings" 
                              mappings={activeNode.data.config?.input_map || []} 
                              onChange={(next) => updateNodeData(activeNode.id, { config: { ...activeNode.data.config, input_map: next } })}
                              variables={dataManager.variables}
                              arguments_list={dataManager.arguments}
                            />
                            <MappingTable 
                              label="Output Assignments" 
                              mode="to-from"
                              mappings={activeNode.data.config?.output_assign || []} 
                              onChange={(next) => updateNodeData(activeNode.id, { config: { ...activeNode.data.config, output_assign: next } })}
                              variables={dataManager.variables}
                              arguments_list={dataManager.arguments}
                            />
                          </>
                        )}
                      </div>
                    )}

                    {activeNode.data.type === 'condition' && (
                      <div className="space-y-6 pt-6 border-t border-gray-50">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Exclusive Outcomes</label>
                          {(activeNode.data.config?.outcomes || []).map((oc: any, i: number) => (
                            <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 relative group">
                              <button 
                                onClick={() => {
                                  const outcomes = activeNode.data.config?.outcomes || [];
                                  const next = outcomes.filter((_: any, idx: number) => idx !== i);
                                  updateNodeData(activeNode.id, { config: { ...activeNode.data.config, outcomes: next } });
                                }}
                                className="absolute top-3 right-3 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 size={12} />
                              </button>
                              <div className="grid grid-cols-2 gap-2">
                                <input 
                                  placeholder="Label"
                                  className="px-3 py-2 bg-white border border-gray-100 rounded-lg text-[10px] font-bold outline-none"
                                  value={oc.label}
                                  onChange={(e) => {
                                    const outcomes = activeNode.data.config?.outcomes || [];
                                    const next = [...outcomes];
                                    if (next[i]) {
                                      next[i] = { ...next[i], label: e.target.value };
                                      updateNodeData(activeNode.id, { config: { ...activeNode.data.config, outcomes: next } });
                                    }
                                  }}
                                />
                                <select 
                                  className="px-2 py-2 bg-white border border-gray-100 rounded-lg text-[10px] font-bold outline-none cursor-pointer"
                                  value={oc.route}
                                  onChange={(e) => {
                                    const outcomes = activeNode.data.config?.outcomes || [];
                                    const next = [...outcomes];
                                    if (next[i]) {
                                      next[i] = { ...next[i], route: e.target.value };
                                      updateNodeData(activeNode.id, { config: { ...activeNode.data.config, outcomes: next } });
                                    }
                                  }}
                                >
                                  <option value="">Route To...</option>
                                  {nodes.filter(n => n.id !== activeNode.id).map(n => <option key={n.id} value={n.id}>{n.data.label}</option>)}
                                </select>
                              </div>
                              <input 
                                placeholder="Condition (e.g. vars.score > 50)"
                                className="w-full px-3 py-2 bg-white border border-gray-100 rounded-lg text-[10px] font-bold outline-none"
                                value={oc.when}
                                onChange={(e) => {
                                  const outcomes = activeNode.data.config?.outcomes || [];
                                  const next = [...outcomes];
                                  if (next[i]) {
                                    next[i] = { ...next[i], when: e.target.value };
                                    updateNodeData(activeNode.id, { config: { ...activeNode.data.config, outcomes: next } });
                                  }
                                }}
                              />
                            </div>
                          ))}
                          <button 
                            onClick={() => {
                              const next = [...(activeNode.data.config?.outcomes || []), { label: '', when: '', route: '' }];
                              updateNodeData(activeNode.id, { config: { ...activeNode.data.config, outcomes: next } });
                            }}
                            className="w-full py-3 border-2 border-dashed border-gray-100 rounded-xl text-[10px] font-black uppercase text-gray-400 hover:text-[#a26da8] hover:border-purple-200 transition-all"
                          >
                            + Add Outcome
                          </button>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Default Fallback</label>
                          <select 
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none cursor-pointer"
                            value={activeNode.data.config?.default_route || ''}
                            onChange={(e) => updateNodeData(activeNode.id, { config: { ...activeNode.data.config, default_route: e.target.value } })}
                          >
                            <option value="">Select Fallback Node</option>
                            {nodes.filter(n => n.id !== activeNode.id).map(n => <option key={n.id} value={n.id}>{n.data.label}</option>)}
                          </select>
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={() => {
                        setNodes((nds) => nds.filter((n) => n.id !== activeNode.id));
                        setEdges((eds) => eds.filter((e) => e.source !== activeNode.id && e.target !== activeNode.id));
                        setSelectedNode(null);
                      }}
                      className="w-full mt-10 flex items-center justify-center gap-2 px-4 py-3 border border-red-100 text-red-500 bg-red-50/30 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all"
                    >
                      <Trash2 size={14} />
                      Delete Node
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </>
    ) : activeView === 'runs' ? (
          <div className="flex-1 bg-gray-50 flex flex-col p-8 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Execution History</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Audit trail for flow runs</p>
              </div>
              <button 
                onClick={fetchRuns}
                className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-gray-900 transition-all shadow-sm"
              >
                <RotateCcw size={18} />
              </button>
            </div>

            {fetchingRuns ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-gray-300" size={32} />
              </div>
            ) : runs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 mb-4">
                  <History size={32} className="text-gray-200" />
                </div>
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">No runs recorded</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-1 max-w-[200px]">Initial runs will appear here once triggered</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {runs.map(run => (
                  <div
                    key={run._id}
                    onClick={() => viewRun(run)}
                    className="p-6 bg-white rounded-[24px] border border-gray-100 hover:border-purple-100 transition-all shadow-sm flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-6">
                      <div className={`p-3 rounded-2xl ${
                        run.status === 'completed' ? 'bg-green-50 text-green-500' :
                        run.status === 'failed' ? 'bg-red-50 text-red-500' :
                        run.status === 'waiting_approval' ? 'bg-amber-50 text-amber-500' :
                        run.status === 'cancelled' ? 'bg-gray-100 text-gray-400' :
                        'bg-blue-50 text-blue-500'
                      }`}>
                        {run.status === 'completed' ? <CheckCircle2 size={20} /> :
                         run.status === 'failed' ? <AlertCircle size={20} /> :
                         run.status === 'waiting_approval' ? <Clock size={20} /> :
                         run.status === 'cancelled' ? <X size={20} /> :
                         <Loader2 size={20} className="animate-spin" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[11px] font-black text-gray-900 uppercase tracking-tight">Run #{run._id ? run._id.slice(-6).toUpperCase() : 'N/A'}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                            run.status === 'completed' ? 'bg-green-50 text-green-600' :
                            run.status === 'failed' ? 'bg-red-50 text-red-600' :
                            run.status === 'waiting_approval' ? 'bg-amber-50 text-amber-600' :
                            run.status === 'cancelled' ? 'bg-gray-100 text-gray-400' :
                            'bg-blue-50 text-blue-600'
                          }`}>{run.status}</span>
                          <span className="px-2 py-0.5 bg-gray-50 rounded-md text-[8px] font-black text-gray-400 uppercase tracking-widest">{run.trigger}</span>
                          {(run.flow_name || run.metadata?.flow_name) && (
                            <span className="px-2 py-0.5 bg-purple-50 text-[#a26da8] rounded-md text-[8px] font-black uppercase tracking-widest">{run.flow_name || run.metadata?.flow_name}</span>
                          )}
                          {run.status === 'waiting_approval' && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md text-[8px] font-black uppercase tracking-widest animate-pulse">Needs Approval</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest flex-wrap">
                          <span className="flex items-center gap-1"><Clock size={10} /> {new Date(run.createdAt).toLocaleString()}</span>
                          <span className="flex items-center gap-1"><Activity size={10} /> {run.total_latency_ms ?? 0}ms</span>
                          <span className="flex items-center gap-1"><Zap size={10} /> {run.total_tokens || 0} tokens</span>
                        </div>
                        {run.status === 'failed' && run.error && (
                          <div className="mt-1.5 text-[9px] font-bold text-red-500 font-mono break-all line-clamp-2 max-w-md">{run.error}</div>
                        )}
                      </div>
                    </div>
                    <button className="p-2 border border-gray-100 rounded-xl text-gray-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-gray-50">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 bg-gray-50 flex flex-col p-8 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Scheduled Triggers</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Automated recurring executions</p>
              </div>
              <button
                onClick={openScheduleModal}
                className="flex items-center gap-2 px-4 py-2 bg-[#a26da8] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#8e5a94] transition-all shadow-sm"
              >
                <Plus size={14} />
                New Schedule
              </button>
            </div>

            {fetchingSchedules ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-gray-300" size={32} />
              </div>
            ) : schedules.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 mb-4">
                  <Clock size={32} className="text-gray-200" />
                </div>
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">No schedules configured</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-1">Set up automated recurring jobs for this flow</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {schedules.map(sch => (
                  <div key={sch._id} className="p-6 bg-white rounded-[24px] border border-gray-100 shadow-sm flex items-center justify-between hover:border-purple-100 transition-all">
                    <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${sch.enabled ? 'bg-purple-50 text-[#a26da8]' : 'bg-gray-50 text-gray-300'}`}>
                        <Clock size={24} />
                      </div>
                      <div>
                        <div className="text-[11px] font-black text-gray-900 uppercase tracking-tight mb-0.5">{sch.name}</div>
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{sch.trigger?.type === 'cron' ? sch.trigger?.cron : `Every ${sch.trigger?.every_minutes ?? '?'}m`}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${sch.enabled ? 'bg-green-50 text-green-500' : 'bg-gray-100 text-gray-400'}`}>
                        {sch.enabled ? 'Active' : 'Paused'}
                      </div>
                      <button
                        onClick={() => toggleSchedule(sch)}
                        className="px-3 py-2 border border-gray-100 rounded-xl text-[8px] font-black uppercase tracking-widest text-gray-500 hover:text-[#a26da8] hover:border-purple-200 hover:bg-purple-50 transition-all"
                        title={sch.enabled ? 'Pause schedule' : 'Activate schedule'}
                      >
                        {sch.enabled ? 'Pause' : 'Activate'}
                      </button>
                      <button
                        onClick={() => deleteSchedule(sch)}
                        className="p-2 border border-gray-100 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all"
                        title="Delete schedule"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* New Schedule Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-[105] flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 flex flex-col animate-in zoom-in-95 duration-300">
              <div className="p-7 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">New Schedule</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Automate recurring runs of this flow</p>
                </div>
                <button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-all">
                  <X size={20} />
                </button>
              </div>
              <div className="p-7 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Schedule Name</label>
                  <input
                    value={scheduleForm.name}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                    placeholder="e.g. Nightly invoice sweep"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:bg-white focus:ring-1 focus:ring-purple-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Trigger Type</label>
                  <div className="flex p-1 bg-gray-100 rounded-xl">
                    <button type="button" onClick={() => setScheduleForm({ ...scheduleForm, triggerType: 'interval' })}
                      className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${scheduleForm.triggerType === 'interval' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}>
                      Interval
                    </button>
                    <button type="button" onClick={() => setScheduleForm({ ...scheduleForm, triggerType: 'cron' })}
                      className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${scheduleForm.triggerType === 'cron' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}>
                      Cron
                    </button>
                  </div>
                </div>
                {scheduleForm.triggerType === 'interval' ? (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Run Every (minutes)</label>
                    <input type="number" min={1}
                      value={scheduleForm.everyMinutes}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, everyMinutes: Number(e.target.value) })}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:bg-white focus:ring-1 focus:ring-purple-200"
                    />
                    <p className="text-[9px] font-bold text-gray-400 pl-1">e.g. 60 = hourly · 1440 = once a day</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Cron Expression</label>
                    <input
                      value={scheduleForm.cron}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, cron: e.target.value })}
                      placeholder="0 9 * * *"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-xs font-mono font-bold outline-none focus:bg-white focus:ring-1 focus:ring-purple-200"
                    />
                    <p className="text-[9px] font-bold text-gray-400 pl-1">min hour day month weekday — "0 9 * * *" = daily at 09:00</p>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Active on creation</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={scheduleForm.enabled} onChange={(e) => setScheduleForm({ ...scheduleForm, enabled: e.target.checked })} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#a26da8]"></div>
                  </label>
                </div>
              </div>
              <div className="p-7 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
                <button onClick={() => setShowScheduleModal(false)} className="flex-1 py-3.5 border border-gray-200 bg-white text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-gray-300">
                  Cancel
                </button>
                <button onClick={createSchedule} disabled={savingSchedule}
                  className="flex-[2] py-3.5 bg-[#a26da8] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#8e5a94] flex items-center justify-center gap-2 disabled:opacity-50">
                  {savingSchedule ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
                  Create Schedule
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Run Modal */}
        {showRunModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100">
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Manual Execution</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Configure initial flow context</p>
                </div>
                <button onClick={() => setShowRunModal(false)} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-all">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="flex p-1 bg-gray-100 rounded-xl mb-4">
                  <button 
                    type="button"
                    onClick={() => setUseRawJson(false)}
                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                      !useRawJson ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    Dynamic Form
                  </button>
                  <button 
                    type="button"
                    onClick={() => setUseRawJson(true)}
                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                      useRawJson ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    Raw JSON
                  </button>
                </div>

                {useRawJson ? (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pl-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Initial JSON Input</label>
                      <button 
                        type="button"
                        onClick={() => {
                          const startNode = nodes.find(n => n.data.type === 'start');
                          if (startNode?.data.config?.input_schema?.length) {
                            const template: any = {};
                            startNode.data.config.input_schema.forEach((f: string) => template[f] = "");
                            setRunInput(JSON.stringify(template, null, 2));
                          } else {
                            toast.error('No schema defined in START node');
                          }
                        }}
                        className="text-[9px] font-black text-[#a26da8] hover:underline uppercase tracking-widest"
                      >
                        Load From Schema
                      </button>
                    </div>
                    <div className="relative group">
                      <div className="absolute left-4 top-4 text-gray-300 pointer-events-none group-focus-within:text-[#a26da8] transition-colors">
                        <Terminal size={14} />
                      </div>
                      <textarea 
                        value={runInput}
                        onChange={(e) => setRunInput(e.target.value)}
                        className="w-full min-h-[160px] bg-gray-50 border border-gray-100 rounded-[32px] p-6 pl-12 text-xs font-mono font-medium focus:bg-white focus:border-purple-200 focus:ring-4 focus:ring-purple-50 outline-none transition-all resize-none leading-relaxed"
                        placeholder='{ "key": "value" }'
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar animate-in fade-in duration-200">
                    {(() => {
                      const inputArgs = (dataManager.arguments || [])
                        .filter((arg: any) => arg.direction === 'in' || arg.direction === 'inout');
                      
                      if (inputArgs.length === 0) {
                        return (
                          <div className="text-center py-6 text-gray-400 text-xs">
                            No input arguments defined. Switch to Raw JSON or add arguments in the Data Manager.
                          </div>
                        );
                      }

                      return inputArgs.map((arg: any) => {
                        return (
                          <div key={arg.name} className="space-y-1">
                            <div className="flex justify-between pl-1">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                {arg.name} {arg.required && <span className="text-red-500">*</span>}
                              </label>
                              <span className="text-[8px] text-gray-300 uppercase tracking-widest font-black">{arg.type}</span>
                            </div>
                            
                            {arg.type === 'boolean' ? (
                              <div className="flex items-center">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox"
                                    checked={!!runInputFields[arg.name]}
                                    onChange={(e) => setRunInputFields({ ...runInputFields, [arg.name]: e.target.checked })}
                                    className="sr-only peer"
                                  />
                                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#a26da8]"></div>
                                  <span className="ml-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{runInputFields[arg.name] ? 'True' : 'False'}</span>
                                </label>
                              </div>
                            ) : arg.type === 'object' || arg.type === 'array' ? (
                              <textarea 
                                value={typeof runInputFields[arg.name] === 'object' ? JSON.stringify(runInputFields[arg.name], null, 2) : (runInputFields[arg.name] || '')}
                                onChange={(e) => {
                                  let val = e.target.value;
                                  try {
                                    val = JSON.parse(e.target.value);
                                  } catch (err) {}
                                  setRunInputFields({ ...runInputFields, [arg.name]: val });
                                }}
                                placeholder={arg.type === 'array' ? '[ ]' : '{ }'}
                                className="w-full min-h-[60px] bg-gray-50 border border-gray-100 rounded-2xl p-3 text-xs font-mono font-medium outline-none focus:bg-white focus:ring-1 focus:ring-purple-200"
                              />
                            ) : arg.type === 'datetime' ? (
                              <input 
                                type="datetime-local"
                                value={runInputFields[arg.name] || ''}
                                onChange={(e) => setRunInputFields({ ...runInputFields, [arg.name]: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2.5 text-xs font-bold outline-none focus:bg-white focus:ring-1 focus:ring-purple-200"
                              />
                            ) : arg.type === 'number' ? (
                              <input 
                                type="number"
                                value={runInputFields[arg.name] ?? ''}
                                onChange={(e) => setRunInputFields({ ...runInputFields, [arg.name]: e.target.value === '' ? '' : Number(e.target.value) })}
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2.5 text-xs font-bold outline-none focus:bg-white focus:ring-1 focus:ring-purple-200"
                              />
                            ) : (
                              <input 
                                type="text"
                                value={runInputFields[arg.name] || ''}
                                onChange={(e) => setRunInputFields({ ...runInputFields, [arg.name]: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2.5 text-xs font-bold outline-none focus:bg-white focus:ring-1 focus:ring-purple-200"
                              />
                            )}
                            {arg.description && (
                              <p className="text-[9px] font-bold text-gray-400 mt-0.5 pl-1 italic">{arg.description}</p>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
                <button 
                  onClick={() => setShowRunModal(false)}
                  className="flex-1 py-4 border border-gray-200 bg-white text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-gray-300"
                >
                  Cancel
                </button>
                <button 
                  onClick={runFlow}
                  disabled={running}
                  className="flex-[2] py-4 bg-[#a26da8] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#8e5a94] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {running ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                  Execute Workflow
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Run Details Modal */}
        {selectedRun && (
          <div className={`fixed inset-0 z-[101] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300 ${runFullscreen ? 'p-3 sm:p-5' : 'p-4'}`}>
            <div className={`bg-white flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 shadow-2xl rounded-[28px] ${runFullscreen ? 'w-full h-full' : 'w-full max-w-[1400px] h-[94vh]'}`}>
              
              {/* Header section */}
              <div className="p-6 border-b border-gray-50 shrink-0 bg-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setSelectedRun(null)}
                      className="p-2 hover:bg-gray-50 border border-gray-100 text-gray-500 rounded-xl transition-all"
                      title="Back to lists"
                    >
                      <RotateCcw size={16} className="-scale-x-100" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-gray-900 uppercase tracking-tight">{flowName}</span>
                        <span className="text-gray-300">•</span>
                        <span className={`text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          selectedRun.status === 'completed' ? 'bg-green-50 text-green-600 border border-green-100' :
                          selectedRun.status === 'failed' ? 'bg-red-50 text-red-600 border border-red-100 animate-pulse' :
                          selectedRun.status === 'waiting_approval' ? 'bg-amber-50 text-amber-600 border border-amber-100 animate-pulse' :
                          selectedRun.status === 'running' ? 'bg-blue-50 text-blue-600 border border-blue-100 animate-pulse' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {selectedRun.status}
                        </span>
                        {['running', 'queued', 'waiting_approval'].includes(selectedRun.status) && (
                          <span className="flex items-center gap-1 text-[8px] font-black text-blue-500 uppercase tracking-widest animate-pulse">
                            <Loader2 size={10} className="animate-spin" /> Live Polling
                          </span>
                        )}
                      </div>
                      
                      {/* Meta block */}
                      <div className="flex items-center gap-4 text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1.5 flex-wrap">
                        <span>ID: <span className="font-mono text-gray-600">{selectedRun._id}</span></span>
                        <span>•</span>
                        <span>Latency: <span className="text-gray-600">{(selectedRun.total_latency_ms !== undefined && selectedRun.total_latency_ms !== null) ? selectedRun.total_latency_ms : (selectedRun.duration || 0)}ms</span></span>
                        <span>•</span>
                        <span>Tokens: <span className="text-gray-600">{selectedRun.total_tokens ?? 0} tok</span></span>
                        <span>•</span>
                        <span>Trigger: <span className="text-gray-600">{selectedRun.trigger}</span></span>
                        <span>•</span>
                        <span>Started: <span className="text-gray-600">{new Date(selectedRun.createdAt).toLocaleString()}</span></span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Active Run cancellation */}
                    {['running', 'queued'].includes(selectedRun.status) && (
                      <button 
                        onClick={() => {
                          setConfirmAction({
                            message: "Are you sure you want to cancel this execution?",
                            onConfirm: async () => {
                              try {
                                const res = await apiService.playground.runs.cancel(selectedRun._id);
                                if (res.success) {
                                  toast.success('Run cancelled successfully');
                                  const updated = await apiService.playground.runs.get(selectedRun._id);
                                  if (updated.success) setSelectedRun(updated.data);
                                }
                              } catch (e: any) {
                                toast.error(e.message || 'Failed to cancel run');
                              }
                            }
                          });
                        }}
                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                      >
                        Cancel Run
                      </button>
                    )}
                    <button
                      onClick={() => setRunFullscreen(f => !f)}
                      className="p-2 hover:bg-gray-50 border border-gray-100 rounded-xl text-gray-500 transition-all"
                      title={runFullscreen ? 'Exit full screen' : 'Full screen'}
                    >
                      {runFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                    <button
                      onClick={() => setSelectedRun(null)}
                      className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Warning / Error banner */}
                {selectedRun.status === 'failed' && selectedRun.error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-800 animate-in slide-in-from-top-2 duration-200">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-red-900">Execution Error</div>
                      <p className="text-xs font-medium font-mono mt-1 break-all">{selectedRun.error}</p>
                    </div>
                  </div>
                )}

                {/* Paused approval banner */}
                {selectedRun.status === 'waiting_approval' && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-800 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-start gap-3">
                      <Clock size={18} className="shrink-0 mt-0.5 text-amber-600 animate-pulse" />
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-amber-950">Execution Paused (Approval Required)</div>
                        <p className="text-xs font-bold text-amber-900 mt-1">
                          Paused at Node: <span className="font-mono underline">{selectedRun.paused_at_node || 'human_task_node'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        onClick={async () => {
                          try {
                            const res = await apiService.playground.runs.approve(selectedRun._id, 'approved');
                            if (res.success) {
                              toast.success('Execution approved & resumed');
                              const updated = await apiService.playground.runs.get(selectedRun._id + `?_=${Date.now()}`);
                              if (updated.success) setSelectedRun(updated.data);
                            }
                          } catch (e: any) {
                            toast.error(e.message || 'Approval failed');
                          }
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm transition-all"
                      >
                        Approve & Resume
                      </button>
                      <button 
                        onClick={async () => {
                          try {
                            const res = await apiService.playground.runs.approve(selectedRun._id, 'rejected');
                            if (res.success) {
                              toast.success('Execution rejected & terminated');
                              const updated = await apiService.playground.runs.get(selectedRun._id + `?_=${Date.now()}`);
                              if (updated.success) setSelectedRun(updated.data);
                            }
                          } catch (e: any) {
                            toast.error(e.message || 'Rejection failed');
                          }
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm transition-all"
                      >
                        Reject / Abort
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Main Workspace Panels */}
              <div className="flex-1 flex overflow-hidden bg-gray-50">
                
                {/* LEFT PANEL: TIMELINE LOGS (40% width) */}
                <div className="w-[38%] border-r border-gray-100 flex flex-col bg-white overflow-hidden">
                  <div className="p-4 border-b border-gray-50 bg-gray-50/50 shrink-0 flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Execution Timeline (logs[])</span>
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest font-mono">{(selectedRun.logs || []).length} events</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar bg-gray-50/20">
                    {(selectedRun.logs && selectedRun.logs.length > 0) ? (
                      selectedRun.logs.map((log: any, idx: number) => {
                        const isWarn = log.level === 'warn';
                        const isError = log.level === 'error';
                        const isHighlighted = activeInspectNodeId === log.node_id;
                        
                        return (
                          <div 
                            key={idx} 
                            onClick={() => {
                              if (log.node_id) {
                                setActiveInspectNodeId(log.node_id);
                                toast.success(`Inspecting node: ${log.node_id}`, { id: 'node_inspect' });
                              }
                            }}
                            className={`p-2.5 rounded-xl border transition-all text-left group/log ${
                              log.node_id ? 'cursor-pointer hover:shadow-sm' : ''
                            } ${
                              isError ? 'bg-red-50/80 border-red-100 text-red-900' :
                              isWarn ? 'bg-amber-50/80 border-amber-100 text-amber-900' :
                              isHighlighted ? 'bg-purple-50 border-purple-200 text-purple-950 shadow-sm' :
                              'bg-white border-gray-100 text-gray-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[8.5px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                  isError ? 'bg-red-100 text-red-700' :
                                  isWarn ? 'bg-amber-100 text-amber-700' :
                                  'bg-gray-100 text-gray-500'
                                }`}>
                                  {log.level || 'info'}
                                </span>
                                {log.node_id && (
                                  <span className="text-[8.5px] font-black font-mono text-purple-600 bg-purple-50 px-1 py-0.5 rounded group-hover/log:underline">
                                    {log.node_id}
                                  </span>
                                )}
                              </div>
                              <span 
                                className="text-[8.5px] font-bold text-gray-400 font-mono"
                                title={log.ts}
                              >
                                {log.ts ? new Date(log.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : ''}
                              </span>
                            </div>
                            <div className="font-mono text-[11.5px] mt-2 leading-relaxed break-words whitespace-pre-wrap">
                              {log.message}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center py-12 text-gray-400 space-y-2">
                        <Terminal size={24} className="text-gray-300" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">No timeline logs recorded</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT PANEL: TABS & DATA STATES (62% width) */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  
                  {/* Tab Switcher */}
                  <div className="bg-white border-b border-gray-100 shrink-0 p-4 flex items-center justify-between">
                    <div className="flex p-1 bg-gray-100 rounded-xl w-64">
                      <button 
                        onClick={() => setRunDetailTab('flow')}
                        className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                          runDetailTab === 'flow' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        Flow Trace
                      </button>
                      <button 
                        onClick={() => setRunDetailTab('data')}
                        className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                          runDetailTab === 'data' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        Data States
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setActiveView('builder');
                        setNodes((nds) =>
                          nds.map((node) => {
                            const runNode = selectedRun.nodes?.find((rn: any) => rn.node_id === node.id);
                            if (runNode) {
                              return {
                                ...node,
                                data: {
                                  ...node.data,
                                  status: runNode.status
                                }
                              };
                            }
                            return { ...node, data: { ...node.data, status: null }};
                          })
                        );
                        setSelectedRun(null);
                        toast.success('Canvas nodes updated with run statuses');
                      }}
                      className="px-3 py-1.5 border border-[#a26da8]/20 bg-[#a26da8]/5 hover:bg-[#a26da8]/10 text-[#a26da8] rounded-xl text-[8.5px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all"
                    >
                      <Search size={10} /> Inspect on Canvas
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6 text-left">
                    {runDetailTab === 'flow' ? (
                      <div className="space-y-6">
                        {/* Node Trace List */}
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Interactive Steps Trace</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(selectedRun.nodes || []).map((step: any, idx: number) => {
                              const config = NODE_TYPES_CONFIG[step.type] || NODE_TYPES_CONFIG.agent;
                              const Icon = config.icon;
                              const isHighlighted = activeInspectNodeId === step.node_id;
                              
                              return (
                                <div 
                                  key={idx}
                                  onClick={() => setActiveInspectNodeId(step.node_id)}
                                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 bg-white text-left ${
                                    isHighlighted
                                      ? 'border-[#a26da8] shadow-md bg-purple-50/20'
                                      : 'border-gray-100 hover:border-gray-200 shadow-sm'
                                  } ${step.status === 'skipped' ? 'opacity-50 border-dashed' : ''}`}
                                >
                                  <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: `${config.color}15`, color: config.color }}>
                                    <Icon size={14} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[10px] font-black text-gray-900 uppercase tracking-tight truncate">
                                      {step.label || step.node_id}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className={`text-[7px] font-black uppercase tracking-widest px-1 py-0.5 rounded ${
                                        step.status === 'completed' ? 'bg-green-50 text-green-600' :
                                        step.status === 'running' ? 'bg-blue-50 text-blue-600 animate-pulse' :
                                        step.status === 'failed' ? 'bg-red-50 text-red-600 animate-pulse' :
                                        step.status === 'waiting_approval' ? 'bg-amber-50 text-amber-600' :
                                        step.status === 'skipped' ? 'bg-gray-50 text-gray-400 italic' :
                                        'bg-gray-100 text-gray-400'
                                      }`}>
                                        {step.status}
                                      </span>
                                      {step.latency_ms !== undefined && (
                                        <span className="text-[7.5px] font-bold text-gray-300 font-mono">{step.latency_ms}ms</span>
                                      )}
                                      {(step.outcome || step.route) && (
                                        <span className="text-[7px] font-black uppercase tracking-widest px-1 py-0.5 rounded bg-purple-50 text-[#a26da8] truncate max-w-[120px]" title={`${step.outcome || ''}${step.route ? ' → ' + step.route : ''}`}>
                                          {step.outcome || ''}{step.route ? ` → ${step.route}` : ''}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Node Input/Output Inspector Panel */}
                        {activeInspectNodeId ? (() => {
                          const step = (selectedRun.nodes || []).find((rn: any) => rn.node_id === activeInspectNodeId);
                          const nodeConfig = step ? (NODE_TYPES_CONFIG[step.type] || NODE_TYPES_CONFIG.agent) : null;
                          
                          if (!step) {
                            return (
                              <div className="p-6 bg-white border border-gray-100 rounded-[24px] text-center text-gray-400 text-xs">
                                Node details not found in execution nodes trace. Click a valid log or card.
                              </div>
                            );
                          }

                          return (
                            <div className="bg-white border border-gray-100 rounded-[28px] p-6 shadow-sm space-y-5 animate-in slide-in-from-bottom-2 duration-300">
                              <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                                <div className="flex items-center gap-2">
                                  {nodeConfig && (
                                    <div className="p-1.5 rounded-lg shrink-0" style={{ backgroundColor: `${nodeConfig.color}15`, color: nodeConfig.color }}>
                                      {React.createElement(nodeConfig.icon, { size: 12 })}
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-xs font-black text-gray-900 uppercase tracking-tight">{step.label || step.node_id}</span>
                                    <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest block font-mono">NODE_ID: {step.node_id}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {step.latency_ms !== undefined && (
                                    <span className="text-[9px] font-black uppercase text-gray-400 font-mono">LATENCY: {step.latency_ms}ms</span>
                                  )}
                                  {step.tokens !== undefined && step.tokens > 0 && (
                                    <span className="text-[9px] font-black uppercase text-gray-400 font-mono">TOKENS: {step.tokens}</span>
                                  )}
                                </div>
                              </div>

                              {/* Error message inside node */}
                              {step.status === 'failed' && step.error && (
                                <div className="p-3 bg-red-50 border border-red-100 text-red-900 text-[10px] font-bold rounded-xl flex items-center gap-2">
                                  <AlertCircle size={12} />
                                  <span>Node Error: {step.error}</span>
                                </div>
                              )}

                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  {(() => {
                                    let inputVal = step.input?.value ?? step.input;
                                    // If it's an object with null values (common in END node), try resolving them
                                    if (inputVal && typeof inputVal === 'object' && !Array.isArray(inputVal)) {
                                      const resolvedInput = { ...inputVal };
                                      let hasChanges = false;
                                      Object.keys(resolvedInput).forEach(key => {
                                        if (isEmptyValue(resolvedInput[key])) {
                                          const traceVal = resolveValueFromTrace(key, 'vars', selectedRun) || resolveValueFromTrace(key, 'args', selectedRun);
                                          if (traceVal !== null && traceVal !== undefined && !isEmptyValue(traceVal)) {
                                            resolvedInput[key] = traceVal;
                                            hasChanges = true;
                                          }
                                        }
                                      });
                                      if (hasChanges) inputVal = resolvedInput;
                                    }
                                    return <RenderValue value={inputVal} label="Node Inputs" />;
                                  })()}
                                </div>
                                <div className="space-y-1.5">
                                  {(() => {
                                    let outputVal = step.output?.value ?? step.output;
                                    // If output is null but it's an END node or similar, try resolving from context
                                    if (isEmptyValue(outputVal) && (step.type === 'results' || step.node_id === 'END')) {
                                       const resolvedOutput: Record<string, any> = {};
                                       (dataManager.arguments || []).filter((a: any) => a.direction === 'out' || a.direction === 'inout').forEach((arg: any) => {
                                          resolvedOutput[arg.name] = selectedRun.context?.args?.[arg.name] ?? resolveValueFromTrace(arg.name, 'args', selectedRun);
                                       });
                                       if (Object.keys(resolvedOutput).length > 0) outputVal = resolvedOutput;
                                    }
                                    return <RenderValue value={outputVal} label="Node Outputs (actual)" />;
                                  })()}
                                </div>
                              </div>
                            </div>
                          );
                        })() : (
                          <div className="p-8 bg-white border border-gray-100 rounded-[24px] text-center text-gray-400 text-[10px] uppercase tracking-widest font-bold flex flex-col items-center gap-2 py-12">
                            <Layers size={20} className="text-gray-300" />
                            Click any log line or step card above to inspect its Inputs and Outputs
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Data Manager State Tables */}
                        <div className="grid md:grid-cols-2 gap-6">
                          
                          {/* Arguments Live Values */}
                          <div className="bg-white border border-gray-100 rounded-[28px] p-5 shadow-sm space-y-4">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block pl-1">Arguments (Live Values)</label>
                            
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                              {(dataManager.arguments || []).length > 0 ? (
                                (dataManager.arguments || []).map((arg: any) => {
                                  // Live value from run.context.args or default
                                  let liveVal = selectedRun.context?.args?.[arg.name];
                                  if (isEmptyValue(liveVal) && (arg.direction === 'in' || arg.direction === 'inout')) {
                                    liveVal = selectedRun.input?.[arg.name];
                                  }
                                  if (isEmptyValue(liveVal)) {
                                    liveVal = arg.default !== undefined ? arg.default : null;
                                  }
                                  
                                  if (isEmptyValue(liveVal)) {
                                    const traceVal = resolveValueFromTrace(arg.name, 'args', selectedRun);
                                    if (traceVal !== null && traceVal !== undefined && !isEmptyValue(traceVal)) {
                                      liveVal = traceVal;
                                    }
                                  }
                                  
                                  return (
                                    <div key={arg.name} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                                      <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-tight">{arg.name}</span>
                                        <div className="flex items-center gap-1">
                                          <span className="text-[7.5px] font-black bg-gray-100 text-gray-400 px-1 py-0.5 rounded uppercase tracking-widest">{arg.type}</span>
                                          <span className={`text-[7.5px] font-black px-1 py-0.5 rounded uppercase tracking-widest ${
                                            arg.direction === 'in' ? 'bg-blue-50 text-blue-500' :
                                            arg.direction === 'out' ? 'bg-green-50 text-green-500' :
                                            'bg-purple-50 text-purple-500'
                                          }`}>{arg.direction}</span>
                                        </div>
                                      </div>
                                      <RenderValue value={liveVal} />
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-center py-6 text-gray-400 text-xs">No arguments declared in flow catalog.</div>
                              )}
                            </div>
                          </div>

                          {/* Variables Live Values */}
                          <div className="bg-white border border-gray-100 rounded-[28px] p-5 shadow-sm space-y-4">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block pl-1">Variables (Live States)</label>
                            
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                              {(dataManager.variables || []).length > 0 ? (
                                (dataManager.variables || []).map((v: any) => {
                                  // Live value from run.context.vars or default
                                  let liveVal = selectedRun.context?.vars?.[v.name] !== undefined 
                                    ? selectedRun.context.vars[v.name] 
                                    : (v.default !== undefined ? v.default : null);
                                  
                                  if (isEmptyValue(liveVal)) {
                                    const traceVal = resolveValueFromTrace(v.name, 'vars', selectedRun);
                                    if (traceVal !== null && traceVal !== undefined && !isEmptyValue(traceVal)) {
                                      liveVal = traceVal;
                                    }
                                  }
                                  
                                  return (
                                    <div key={v.name} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                                      <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-tight">{v.name}</span>
                                        <span className="text-[7.5px] font-black bg-gray-100 text-gray-400 px-1 py-0.5 rounded uppercase tracking-widest">{v.type}</span>
                                      </div>
                                      <RenderValue value={liveVal} />
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-center py-6 text-gray-400 text-xs">No local variables declared in flow catalog.</div>
                              )}
                            </div>
                          </div>

                        </div>

                        {/* Core Workflow Output Box */}
                        <div className="bg-white border border-gray-100 rounded-[28px] p-6 shadow-sm space-y-4">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block pl-1">Final Workflow Output (run.output)</label>
                          {(() => {
                            const mergedOutput: Record<string, any> = { ...(selectedRun.output || {}) };
                            (dataManager.arguments || [])
                              .filter((arg: any) => arg.direction === 'out' || arg.direction === 'inout')
                              .forEach((arg: any) => {
                                if (isEmptyValue(mergedOutput[arg.name])) {
                                  const resolved = resolveValueFromTrace(arg.name, 'args', selectedRun);
                                  if (resolved !== null && resolved !== undefined && !isEmptyValue(resolved)) {
                                    mergedOutput[arg.name] = resolved;
                                  }
                                }
                              });

                            // Drop any keys that resolved to nothing so we never render blank rows.
                            Object.keys(mergedOutput).forEach((k) => {
                              if (isEmptyValue(mergedOutput[k])) delete mergedOutput[k];
                            });

                            // Fallback: flows that declare no out-arguments (or where the backend returned
                            // an empty output map) should still surface a meaningful final result on a
                            // finished run — never show "no output" for a run that actually completed.
                            const isFinished = ['completed', 'failed', 'cancelled'].includes(selectedRun.status);
                            if (Object.keys(mergedOutput).length === 0 && isFinished) {
                              // 1) Non-empty final variables (run.context.vars)
                              const finalVars = selectedRun.context?.vars || {};
                              Object.keys(finalVars).forEach((k) => {
                                if (!isEmptyValue(finalVars[k])) mergedOutput[k] = finalVars[k];
                              });

                              // 2) Otherwise the output of the last completed node (typically the END / final step)
                              if (Object.keys(mergedOutput).length === 0) {
                                const completedSteps = (selectedRun.nodes || []).filter(
                                  (n: any) => n.status === 'completed' && !isEmptyValue(n.output)
                                );
                                const lastStep = completedSteps[completedSteps.length - 1];
                                if (lastStep) {
                                  const lastOut = lastStep.output?.value ?? lastStep.output;
                                  if (!isEmptyValue(lastOut)) mergedOutput[lastStep.label || 'result'] = lastOut;
                                }
                              }
                            }

                            if (Object.keys(mergedOutput).length > 0) {
                              return (
                                <div className="space-y-4">
                                  {Object.keys(mergedOutput).map((key: string) => {
                                    return (
                                      <div key={key} className="space-y-1 bg-purple-50/5 p-4 rounded-2xl border border-purple-50/50">
                                        <RenderValue value={mergedOutput[key]} label={key} />
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            }

                            return (
                              <div className="p-6 bg-gray-50 rounded-2xl text-center text-gray-400 text-[10px] uppercase tracking-widest font-black py-8">
                                Workflow is either running, failed, or has not generated output keys yet.
                              </div>
                            );
                          })()}
                        </div>

                      </div>
                    )}
                  </div>

                </div>

              </div>
              
              {/* Footer row */}
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
                <button 
                  onClick={() => setSelectedRun(null)}
                  className="px-6 py-3 border border-gray-200 bg-white text-gray-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-gray-300 transition-all"
                >
                  Close Details
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Custom Confirmation Modal */}
        {confirmAction && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 flex flex-col p-6 space-y-4">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Confirm Action</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{confirmAction.message}</p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  onClick={() => setConfirmAction(null)} 
                  className="px-4 py-2 border border-gray-200 text-gray-400 hover:text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    confirmAction.onConfirm();
                    setConfirmAction(null);
                  }} 
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-all"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaygroundTab;
