/**
 * Type definitions for the Content Generation Solution Accelerator
 */

export interface CreativeBrief {
  overview: string;
  objectives: string;
  target_audience: string;
  key_message: string;
  tone_and_style: string;
  deliverable: string;
  timelines: string;
  visual_guidelines: string;
  cta: string;
}

export interface Product {
  product_name: string;
  category: string;
  sub_category: string;
  marketing_description: string;
  detailed_spec_description: string;
  sku: string;
  model: string;
  image_description?: string;
  image_url?: string;
}

export type ComplianceSeverity = 'error' | 'warning' | 'info';

export interface ComplianceViolation {
  severity: ComplianceSeverity;
  message: string;
  suggestion: string;
  field: string;
}

export interface ContentResponse {
  content: Record<string, unknown>;
  violations: ComplianceViolation[];
  requires_modification: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agent?: string;
  timestamp: string;
  violations?: ComplianceViolation[];
  date?: string;
  feedback?: string;
  context?: any;
  citations?: Citation[];
  contentType?: string;
}

export interface Citation {
  content: string;
  url: string;
  title: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  messages: ChatMessage[];
  brief?: CreativeBrief;
  updated_at: string;
  title?: string;
  date?: string;
  updatedAt?: string;
}

export interface ConversationRequest {
  messages: ChatMessage[];
  id?: string;
  last_rag_response?: string;
}

export interface AgentResponse {
  type: 'agent_response' | 'error' | 'status';
  agent?: string;
  content: string;
  is_final: boolean;
  requires_user_input?: boolean;
  request_id?: string;
  conversation_history?: string;
  metadata?: {
    conversation_id?: string;
    handoff_to?: string;
  };
}

export interface BrandGuidelines {
  tone: string;
  voice: string;
  primary_color: string;
  secondary_color: string;
  prohibited_words: string[];
  required_disclosures: string[];
  max_headline_length: number;
  max_body_length: number;
  require_cta: boolean;
}

export interface ParsedBriefResponse {
  brief: CreativeBrief;
  requires_confirmation: boolean;
  message: string;
}

export interface GeneratedContent {
  text_content?: {
    headline?: string;
    body?: string;
    cta_text?: string;
    tagline?: string;
  };
  image_content?: {
    image_base64?: string;
    image_url?: string;
    alt_text?: string;
    prompt_used?: string;
  };
  violations: ComplianceViolation[];
  requires_modification: boolean;
}

export interface AppConfig {
  name?: string;
  description?: string;
  features?: {
    chatHistory?: boolean;
    charts?: boolean;
    search?: boolean;
  };
}

export interface ChartConfigItem {
  id: string;
  title: string;
  type: string;
  data?: any;
  options?: any;
}

export interface CosmosDBHealth {
  cosmosDB: boolean;
  status: CosmosDBStatus | string;
}

export enum CosmosDBStatus {
  Working = "Working",
  NotWorking = "NotWorking", 
  NotConfigured = "NotConfigured",
  InvalidCredentials = "InvalidCredentials"
}

export interface UserInfo {
  access_token: string;
  expires_on: string;
  id_token: string;
  provider_name: string;
  user_claims: any[];
  user_id: string;
}
