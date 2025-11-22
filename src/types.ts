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
  steps?: CourseStep[]; // Optional, as we might load them separately
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