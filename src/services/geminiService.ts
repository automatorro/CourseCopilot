// ABOUTME: This service handles communication with the Supabase Edge Function
// ABOUTME: for generating and improving course content using the Gemini API.
import { supabase } from './supabaseClient';
import { Course, CourseStep } from '../types';
import { getCourseFiles } from './fileStorageService';

const invokeContentFunction = async (
  action: 'generate' | 'improve' | 'refine',
  course: Course,
  step: CourseStep,
  originalContent?: string,
  refinePayload?: { selectedText: string, actionType: string }
): Promise<string> => {
  console.log(`Invoking Edge Function with action '${action}' for step: ${step.title_key}`);

  try {
    // Fetch context files (Knowledge Base)
    const files = await getCourseFiles(course.id);
    const context_files = files.map(f => f.id);

    const courseForPayload: Course = {
      ...course,
      steps: course.steps?.map(s => {
        if (s.step_order >= step.step_order) {
          return { ...s, content: '' };
        }
        // Strip base64 images from content to avoid payload too large errors
        // This replaces data:image/... with a placeholder
        const cleanContent = s.content?.replace(/!\[([^\]]*)\]\(data:image\/[^;]+;base64,[^)]+\)/g, '![$1]([Image])') || '';
        return { ...s, content: cleanContent };
      })
    };

    const body: {
      course: Course,
      step: CourseStep,
      action: string,
      originalContent?: string,
      refinePayload?: any,
      context_files?: string[]
    } = {
      course: courseForPayload,
      step: step,
      action: action,
      context_files: context_files
    };

    if (action === 'improve' || action === 'refine') {
      body.originalContent = originalContent;
    }

    if (action === 'refine') {
      body.refinePayload = refinePayload;
    }

    const { data, error } = await supabase.functions.invoke('generate-course-content', { body });

    if (error) {
      console.error('Error invoking Supabase Edge Function:', error);
      return `Error from server: ${error.message}.`;
    }

    if (!data || typeof data.content !== 'string') {
      console.error('Unexpected response format from Edge Function. Expected { content: string }, received:', data);
      return 'Error: Received an invalid or empty response from the generation service.';
    }

    return data.content;
  } catch (err: any) {
    console.error(`Client-side error during '${action}':`, err);
    return `An unexpected error occurred: ${err.message}.`;
  }
};


/**
 * Invokes the Edge Function to generate initial content for a course step.
 */
export const generateCourseContent = async (course: Course, step: CourseStep): Promise<string> => {
  return invokeContentFunction('generate', course, step);
};

/**
 * Invokes the Edge Function to improve existing content for a course step.
 * @deprecated This function is kept for potential future use but is replaced by refineCourseContent in the UI.
 */
export const improveCourseContent = async (course: Course, step: CourseStep, originalContent: string): Promise<string> => {
  return invokeContentFunction('improve', course, step, originalContent);
};

/**
 * Invokes the Edge Function to refine content based on a specific action.
 */
export const refineCourseContent = async (course: Course, step: CourseStep, fullContent: string, selectedText: string, actionType: string): Promise<string> => {
  return invokeContentFunction('refine', course, step, fullContent, { selectedText, actionType });
}