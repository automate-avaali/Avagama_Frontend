
export type AgentStatus = 'draft' | 'published' | 'archived';

export interface AgentPersona {
  role: string;
  goal: string;
  instructions: string;
  tone: string[];
  greeting: string;
  fallback_message: string;
}

export interface AgentLLM {
  provider: string;
  model: string;
  temperature: number;
  top_p: number;
  max_tokens: number;
}

export interface AgentGuardrails {
  hallucination_check: boolean;
  pii_detection: 'none' | 'mask' | 'flag';
  safety_filter: 'relaxed' | 'standard' | 'strict';
  forbidden_topics: string[];
}

export interface AgentChannel {
  type: 'web' | 'whatsapp' | 'instagram' | 'slack';
  enabled: boolean;
  status: string;
}

export interface StandaloneAgent {
  _id: string;
  name: string;
  description: string;
  slug: string;
  status: AgentStatus;
  persona: AgentPersona;
  llm: AgentLLM;
  guardrails: AgentGuardrails;
  system_prompt?: string;
  channels: AgentChannel[];
  knowledge_summary: {
    source_count: number;
    chunk_count: number;
  };
  version: number;
  createdBy: string;
  organization: string;
  department?: string;
  chat_count: number;
  createdAt: string;
  updatedAt: string;
  share_token?: string;
  is_deployed?: boolean;
  public_url?: string;
  deployment?: {
    is_deployed: boolean;
    slug: string;
    public_url: string;
    deployed_at: string;
    deploy_count: number;
    chat_count: number;
    last_chat_at?: string;
  };
}

export interface StandaloneBlueprint {
  _id: string;
  name: string;
  description: string;
  industry: string;
  tags: string[];
  persona_template: any;
  llm_template: any;
  kb_seed: any[];
  action_seeds: any[];
  tool_seeds: any[];
  clone_count: number;
  avg_rating: number;
}

export interface StandaloneKnowledgeSource {
  _id: string;
  agent_id: string;
  type: 'file' | 'url' | 'text' | 'qa' | 'youtube';
  status: 'pending' | 'processing' | 'ready' | 'failed';
  title: string;
  source_meta: any;
  chunk_count: number;
  error_message?: string;
  createdAt: string;
}

export interface StandaloneAction {
  _id: string;
  agent_id: string;
  name: string;
  enabled: boolean;
  priority: number;
  trigger: {
    kind: string;
    value: string;
    threshold?: number;
  };
  effect: {
    kind: string;
    config: any;
  };
  fired_count?: number;
  fire_count?: number;
}

export interface StandaloneTool {
  _id: string;
  agent_id: string;
  name: string;
  description: string;
  type: 'mcp' | 'zapier' | 'webhook' | 'builtin';
  enabled: boolean;
  config: any;
}
