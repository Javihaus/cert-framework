/**
 * CERT Framework Data Contract
 * Defines the structure of trace data used across Python backend and TypeScript dashboard
 */

export interface Trace {
  timestamp: string;           // ISO 8601 format
  platform: string;            // "openai" | "anthropic" | "langchain" | "bedrock"
  model: string;               // "gpt-4-turbo" | "claude-3-opus" | etc
  function?: string;           // Function name if using @trace decorator
  input_data: any;             // Prompt/messages (format varies by platform)
  output_data: any;            // Response (format varies by platform)
  context?: string;            // Ground truth for evaluation
  cost?: number;               // USD cost of API call
  confidence?: number;         // 0-1 accuracy score
  metadata?: {
    tokens?: {
      prompt: number;
      completion: number;
    };
    latency_ms?: number;
    finish_reason?: string;
    error?: string;
    [key: string]: any;
  };
}

export interface CostSummary {
  totalCost: number;
  dailyCosts: Record<string, number>;
  byModel: Record<string, number>;
  byPlatform: Record<string, number>;
  avgPerTask: number;
  projectedMonthlyCost: number;
}

export interface OptimizationOpportunity {
  type: 'model_downgrade' | 'caching' | 'prompt_optimization' | 'batch_processing';
  description: string;
  currentCost: number;
  potentialSavings: number;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  details?: string;
}

export interface ConnectorStatus {
  name: string;
  platform: string;
  status: 'active' | 'disabled' | 'error' | 'available' | 'planned';
  tracesLogged: number;
  failureCount: number;
  lastActivity?: string;
  description: string;
  installCommand?: string;
  usageExample?: string;
}
