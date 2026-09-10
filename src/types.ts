import { User as SupabaseUser } from '@supabase/supabase-js';
import { SlideState } from './types/slideState';
import { LocalizedLabels } from './constants/localizedLabels';

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
  // AI Credit System (added in 20260621_credit_system migration)
  ai_operations_used?: number;
  ai_operations_limit?: number;
  plan_reset_at?: string;
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
  description?: string;
  subject: string;
  target_audience: string;
  environment: GenerationEnvironment;
  language: string;
  localized_labels?: Partial<LocalizedLabels> | null;
  progress: number;
  learning_objectives?: string; // NEW: User-provided or AI-generated learning outcomes
  steps?: CourseStep[]; // Optional, as we might load them separately
  blueprint?: CourseBlueprint;
  blueprint_version?: number; // NEW: The current version of the blueprint
  blueprint_history?: CourseBlueprint[]; // NEW: History of previous blueprints
  ai_refinement_history?: AIMessage[]; // NEW: Optional log of AI suggestions
  dna?: CourseDNA; // NEW: The Single Source of Truth for the course
  macro_plan?: {
    macroBlocks: Array<{
      type: 'INTRO' | 'CONTENT_BLOCK' | 'BREAK' | 'WRAP_UP';
      duration: number;
      title?: string;
      moduleRef?: string;
      purpose?: string;
    }>;
  };
}

// === COURSE DNA (Global Source of Truth) ===
// F3-T1: simplified per docs/CURATENIE-SI-MODERNIZARE-CourseCopilot.md §A.3 —
// the author's voice is captured verbatim (toneFreeText) instead of being
// forced through formality/humor enums, which the model would translate into
// generic Mentor/Coach/Buddy archetypes. narrativeUniverse (global
// protagonists), masterTimeline and learningPhilosophy are removed: the first
// two were superseded by F1's local-characters rule and the deterministic
// macro-structure fallback; the third was never exposed in the editor UI.
export interface CourseDNA {
  toneFreeText?: string; // verbatim voice sample, in the author's own words
  terminology: {
    participant: string; // e.g. "Participant" vs "Learner"
    exercise: string;    // e.g. "Exercise" vs "Activity"
    trainer: string;     // e.g. "Facilitator" vs "Instructor"
    mandatoryTerms: Record<string, {
      term: string;
      abbreviation?: string;
      definition: string;
      firstMention?: string;
    }>;
    forbiddenPhrases?: string[];
  };
  domainContext?: {
    industryTerms: Record<string, string>;
    clientProfiles: Array<{ type: string; decisionLogic: string; approach: string }>;
    productCatalog: Array<{ category: string; items: string[] }>;
    competitorIntelligence: Array<{ name: string; weaknesses: string[]; counterStrategy: string }>;
    negotiationFrameworks: Array<{ name: string; steps: string[] }>;
  };
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
  lesson_id?: string | null; // NEW: Reference to the specific lesson this step belongs to
  status?: 'draft' | 'generat' | 'editat' | 'aprobat'; // NEW: Lifecycle state of the material
  slides_data?: SlideState[] | null; // NEW: Structured slide states for deterministic export
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
  lessons?: CourseLesson[]; // NEW: Granular lessons under this module
}

export interface CourseLesson {
  id: string;
  module_id: string;
  course_id: string;
  title: string;
  learning_objective?: string; // Bloom taxonomy objective
  has_exercise: boolean; // Flag to generate activities
  estimated_minutes: number; // Lesson duration
  key_takeaways: string[]; // 3-5 structured bullets, max 20 words each
  order_index: number;
  created_at: string;
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
  CourseDNA = 'course_dna', // Step 0: The Single Source of Truth
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
  // NEW: Additional facilitator materials (inspired by real-world course reference)
  DiscussionGuide = 'discussion_guide',       // Per-module Hook + Takeaway table for trainer
  ActionPlan = 'action_plan',                  // Post-course individual action plan sheet
  DiagnosticQuestionnaire = 'diagnostic_questionnaire', // Pre-course self-assessment
  AgendaTable = 'agenda_table',               // Chronometric agenda with materials per module
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
  ImageLeft = 'image_left', // New
  ImageRight = 'image_right', // New
  FullImage = 'full_image', // New
  Quote = 'quote',
  BigNumber = 'big_number', // New
  ThreeCol = 'three_col', // New
  Comparison = 'comparison', // New
  Timeline = 'timeline', // New
  GridCards = 'grid_cards', // New
  SectionHeader = 'section_header', // New
  Checklist = 'checklist', // New
  DoDont = 'do_dont', // New
  Table = 'table', // New
  ImageCenter = 'image_center', // New
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
  originalIndex?: number; // Index in the source markdown, for deterministic updates
  slide_type: SlideArchetype;
  title?: string;
  subtitle?: string;
  core_message?: string;
  bullets?: string[];
  image_url?: string | null;
  image_prompt?: string; // NEW: Visual description for AI/Search
  trainer_notes?: string | null;
  objective_links?: string[];
  section_id?: string;
  adaptedContent?: Record<string, string>; // Map of layout_type -> adapted_content
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
