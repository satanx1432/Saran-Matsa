export interface Mission {
  title: string;
  code: string;
  sector: string;
  objective: string;
  difficulty: string;
  reward: number;
  time_est_m: number;
  loop_status: string;
  phases: string[];
}

export interface FlowchartNode {
  id: string;
  label: string;
  type: "productive" | "distraction" | "source" | "bottleneck" | "action";
  time_spent?: string;
  description?: string;
}

export interface FlowchartConnection {
  from: string;
  to: string;
  label?: string;
}

export interface FlowchartData {
  nodes: FlowchartNode[];
  edges: FlowchartConnection[];
}

export interface AnalysisResult {
  title: string;
  confidence: number;
  goal: string;
  distraction: string;
  time_lost: string;
  pattern_detected: string;
  impact: string;
  recommended_actions: string[];
  bottleneck_title: string;
  bottleneck_points: string[];
  actionable_title: string;
  actionable_desc: string;
  target: string;
  action_required: string;
  mission: Mission;
  usingFallback?: boolean;
  error_message?: string;
  flowchart?: FlowchartData;
}

export interface CompletedMission {
  id: string;
  title: string;
  code: string;
  sector: string;
  objective: string;
  reward: number;
  time_spent_s: number;
  completed_at: string;
  verification_explanation?: string;
  verification_evidence?: string;
  verification_reflection?: string;
  verification_result?: string;
}

export interface CognitiveLog {
  id: string;
  rawText: string;
  title: string;
  confidence: number;
  bottleneckTitle: string;
  createdAt: string;
}
