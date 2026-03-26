
export enum EvaluationStatus {
  COMPLETED = 'Completed',
  DRAFT = 'Draft',
  IN_PROGRESS = 'In Progress'
}

export enum FitType {
  AGENTIC_AI = 'Agentic AI',
  AUGMENT_AI = 'Augment AI',
  RPA = 'RPA',
  TRANSFORMATION = 'Transformation'
}

export interface Evaluation {
  id: string;
  processName: string;
  createdOn: string;
  automationScore: number | null;
  feasibilityScore: number | null;
  fitmentType: FitType;
  llmType: string;
  status: EvaluationStatus;
  shortlisted?: boolean;
}

export interface PricingPlan {
  name: string;
  subtitle: string;
  price: string;
  duration: string;
  validity: string;
  runs: string;
  users: string;
  features: string[];
  footerNote?: string;
}
