export interface SourceCitation {
  title: string;
  url: string;
  snippet?: string;
}

export interface UpcyclingStep {
  step_number: number;
  title: string;
  instruction: string;
}

export interface UpcyclingProject {
  id: string;
  title: string;
  category: string;
  materials_needed: string[];
  difficulty: string;
  estimated_time: string;
  steps: UpcyclingStep[];
  benefits: string;
  source_url?: string;
}

export interface ChatQueryRequest {
  message: string;
  area_id?: number | null;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface ChatQueryResponse {
  reply: string;
  is_from_cache: boolean;
  is_fallback: boolean;
  model_used: string;
  citations: SourceCitation[];
  featured_project?: UpcyclingProject | null;
  suggested_prompts: string[];
}

export interface QuickPromptItem {
  id: string;
  category: string;
  prompt: string;
  icon: string;
}
