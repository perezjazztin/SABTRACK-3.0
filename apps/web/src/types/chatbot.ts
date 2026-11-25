// Represents an external reference link or citation returned with an AI answer.
export interface SourceCitation {
  title: string;
  url: string;
  snippet?: string;
}

// Represents a sequential step in an upcycling DIY waste-reduction guide.
export interface UpcyclingStep {
  step_number: number;
  title: string;
  instruction: string;
}

// Represents an AI-generated or curated upcycling guide for recyclable materials.
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

// Request payload sent to the EcoBot conversational endpoint.
export interface ChatQueryRequest {
  message: string;
  area_id?: number | null;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

// Response payload from the Gemini-powered waste assistance chatbot.
export interface ChatQueryResponse {
  reply: string;
  is_from_cache: boolean;
  is_fallback: boolean;
  model_used: string;
  citations: SourceCitation[];
  featured_project?: UpcyclingProject | null;
  suggested_prompts: string[];
}

// Represents a preset quick-reply chip to trigger common resident inquiries.
export interface QuickPromptItem {
  id: string;
  category: string;
  prompt: string;
  icon: string;
}
