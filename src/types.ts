import { User as SupabaseUser } from '@supabase/supabase-js';

export enum Plan {
  Trial = 'Trial',
  Basic = 'Basic',
  Pro = 'Pro',
}

// Combines Supabase auth user with our custom profile data
export interface User extends SupabaseUser {
  plan: Plan;
  role: 'admin' | 'user';
  first_name?: string | null;
  last_name?: string | null;
}

export enum GenerationEnvironment {
  LiveWorkshop = 'LiveWorkshop',
  OnlineCourse = 'OnlineCourse',
  // Deprecated but kept for backward compatibility
  Corporate = 'Corporate',
  Academic = 'Academic',
}

export interface Course {
  id: string;
  user_id: string;
  created_at: string;
  title: string;
  subject: string;
  target_audience: string;
  environment: GenerationEnvironment;
  language: string;
  progress: number;
  learning_objectives?: string; // NEW: User-provided or AI-generated learning outcomes
  steps?: CourseStep[]; // Optional, as we might load them separately
  blueprint?: CourseBlueprint;
  ai_refinement_history?: AIMessage[]; // NEW: Optional log of AI suggestions
}

export interface CourseStep {
  id: string;
  course_id: string;
  user_id: string;
  created_at: string;
  title_key: string;
  content: string;
  is_completed: boolean;
  step_order: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  action?: string; // e.g., 'generate_learning_objectives', 'refine_blueprint'
}

export interface CourseBlueprint {
  version: '1.0';
  modules: CourseModule[];
  estimated_duration?: string; // e.g., "2 hours", "3 days"
  generated_at: string; // ISO timestamp
}

export interface CourseModule {
  id: string; // Unique identifier for module
  title: string;
  learning_objective: string; // Links back to course LOs
  sections: CourseSection[];
}

export interface CourseSection {
  id: string; // Unique identifier for section
  title: string;
  content_type: 'slides' | 'video_script' | 'exercise' | 'reading' | 'quiz';
  order: number;
  content_outline?: string; // Brief description of what will be covered
}