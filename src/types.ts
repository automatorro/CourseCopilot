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
  title?: string; // Optional override from analysis
  target_audience?: string; // Optional override from analysis
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

export interface CourseFile {
  id: string;
  course_id: string;
  user_id: string;
  filename: string;
  storage_path: string;
  file_type: 'pdf' | 'docx' | 'txt' | 'pptx';
  file_size: number;
  extracted_text: string | null;
  uploaded_at: string;
  created_at: string;
}

// NEW: The 12 Steps of the Trainer's Flow
export enum TrainerStepType {
  PerformanceObjectives = 'performance_objectives',
  CourseObjectives = 'course_objectives',
  Structure = 'structure',
  LearningMethods = 'learning_methods',
  TimingAndFlow = 'timing_and_flow',
  Exercises = 'exercises',
  ExamplesAndStories = 'examples_and_stories',
  FacilitatorNotes = 'facilitator_notes',
  Slides = 'slides',
  FacilitatorManual = 'facilitator_manual',
  ParticipantWorkbook = 'participant_workbook',
  VideoScripts = 'video_scripts',
  CheatSheets = 'cheat_sheets',
  Projects = 'projects',
  Tests = 'tests',
}

export interface CourseGenerationStatus {
  is_generating: boolean;
  current_step: TrainerStepType | null;
  completed_steps: TrainerStepType[];
  error?: string;
}

// Slide IR (minimal viable)
export enum SlideArchetype {
  Title = 'title',
  Explainer = 'explainer',
  ImageText = 'image_text',
  Quote = 'quote',
  Agenda = 'agenda',
  Exercise = 'exercise',
  CaseStudy = 'case_study',
  Summary = 'summary',
}

export interface SlideRules {
  maxTitleChars?: number;
  maxBullets?: number;
  maxBulletLength?: number;
  requiresImage?: boolean;
}

export interface SlideModel {
  id: string;
  slide_type: SlideArchetype;
  title?: string;
  subtitle?: string;
  core_message?: string;
  bullets?: string[];
  image_url?: string | null;
  trainer_notes?: string | null;
  objective_links?: string[];
  section_id?: string;
}

export interface CourseVersion {
  id: string;
  course_id: string;
  step_id?: string;
  version_number: number;
  content: string;
  change_type: 'import' | 'manual_edit' | 'ai_generation' | 'restore';
  change_description?: string;
  created_at: string;
  created_by: string;
}
