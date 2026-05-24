export type FlagType = 'boolean' | 'string' | 'json';

export interface Rule {
  id: string;
  attribute: string;
  operator: 'eq' | 'neq' | 'in' | 'nin' | 'contains';
  value: string;
  type: FlagType;
  serveValue: string;
}

export interface FlagRollout {
  percentage: number;
  serveValue: string;
  fallbackValue: string; // The fully fallback value if nothing else matches
}

export interface Flag {
  id: string;
  projectId: string;
  envId: string;
  key: string;
  name: string;
  description: string;
  type: FlagType;
  active: boolean;
  rules: Rule[];
  rollout: FlagRollout;
  createdAt: number;
  updatedAt: number;
}

export interface Environment {
  id: string;
  name: string;
  sdkKey: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  environments: Environment[];
}

export interface EvalContext {
  userId?: string;
  [key: string]: any;
}

export interface EvalResult {
  key: string;
  value: any;
  reason: string;
}
