export interface AdminBlueprint {
  _id: string;
  name: string;
  description: string;
  industry: string;
  use_case_category?: string;
  tags: string[];
  persona_template: {
    role: string;
    goal: string;
    instructions: string;
    tone: string[];
    greeting: string;
    fallback_message: string;
  };
  llm_template: {
    provider: string;
    model: string;
    temperature: number;
    top_p: number;
    max_tokens: number;
  };
  kb_seed: Array<{
    type: 'text' | 'url' | 'qa';
    title: string;
    inline_text?: string;
    url?: string;
    qa_pairs?: Array<{ q: string; a: string }>;
  }>;
  tool_seeds: Array<{
    type: 'builtin' | 'webhook' | 'mcp' | 'zapier';
    name: string;
    config: any;
  }>;
  action_seeds: Array<{
    name: string;
    trigger: any;
    effect: any;
    enabled: boolean;
  }>;
  is_published: boolean;
  is_system: boolean;
  clone_count: number;
  avg_rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSolution {
  _id: string;
  name: string;
  slug: string;
  summary: string;
  description: string;
  industry: string;
  category: string;
  tags: string[];
  difficulty: 'Starter' | 'Intermediate' | 'Advanced';
  estimated_setup: string;
  kpis: Array<{ metric: string; impact: string }>;
  data_manager: {
    arguments: Array<{
      name: string;
      direction: 'in' | 'out' | 'inout';
      type: string;
      required: boolean;
      default?: any;
    }>;
    variables: Array<{
      name: string;
      type: string;
      default?: any;
    }>;
  };
  graph: {
    nodes: Array<{
      node_id: string;
      type: string;
      label: string;
      x: number;
      y: number;
      config: any;
    }>;
    edges: Array<{
      edge_id: string;
      from: string;
      to: string;
      kind: string;
    }>;
  };
  step_count: number;
  steps: Array<{ label: string; type: string }>;
  agents_used: string[];
  connectors_used: string[];
  has_human_approval: boolean;
  is_published: boolean;
  status: string;
  clone_count: number;
  avg_rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAuditLog {
  _id: string;
  actor_id: string;
  actor_email: string;
  actor_role: string;
  action: string;
  resource: 'agent_blueprint' | 'solution';
  resource_id: string;
  resource_name: string;
  changes: any;
  ip: string;
  user_agent: string;
  status: 'success' | 'failed';
  createdAt: string;
}

export interface AdminMeta {
  industries: string[];
  solution_categories: string[];
  difficulties: string[];
  llm_providers: string[];
  tool_types: string[];
  kb_types: string[];
}
