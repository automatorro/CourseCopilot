// ABOUTME: This service handles communication with the Supabase Edge Function
// ABOUTME: for generating and improving course content using the Gemini API.
import { supabase } from './supabaseClient';
import { Course, CourseStep, CourseBlueprint } from '../types';
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
      const errObj = error as unknown as { context?: Response; status?: number; message: string };
      const ctx = errObj.context;
      let status: number | undefined = errObj.status;
      let serverMsg: string | undefined;
      try {
        if (ctx && typeof (ctx as any).status === 'number') status = (ctx as any).status;
        if (ctx && typeof ctx.clone === 'function') {
          const cloned = ctx.clone();
          const ct = cloned.headers?.get?.('content-type') || '';
          if (ct.includes('application/json')) {
            const json = await cloned.json();
            serverMsg = (json as any)?.error || (json as any)?.message || JSON.stringify(json);
          } else {
            serverMsg = await cloned.text();
          }
        }
      } catch (e) { void e; }
      const message = `Server error (${status || 'unknown'}): ${serverMsg || errObj.message}`;
      throw new Error(message);
    }

    if (!data || typeof data.content !== 'string') {
      throw new Error('Serviciul de generare a returnat un răspuns invalid.');
    }

    return data.content;
  } catch (err: any) {
    throw err;
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
};

export const pingEdgeFunction = async (): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-course-content', { body: { action: 'ping' } });
    if (error) {
      const status = (error as any)?.status;
      const context = (error as any)?.context;
      console.error('Ping error:', { message: error.message, status, context });
      return `Ping failed (${status || 'unknown'}): ${context?.message || error.message}`;
    }
    return typeof data?.message === 'string' ? data.message : 'pong';
  } catch (e: any) {
    console.error('Ping client-side error:', e);
    return `Ping failed: ${e.message}`;
  }
};

/**
 * Refines the Course Blueprint using Edge Function.
 * Returns the refined blueprint or the original on failure.
 */
export const refineBlueprint = async (course: Course, blueprint: CourseBlueprint): Promise<CourseBlueprint> => {
  try {
    const body = {
      action: 'refine_blueprint',
      course: { ...course, steps: [] },
      blueprint,
      language: course.language
    };
    const { data, error } = await supabase.functions.invoke('generate-course-content', { body });
    if (error) {
      console.warn('[refineBlueprint] Edge Function error:', error);
      return blueprint;
    }
    if (typeof data?.content === 'string') {
      try {
        const refined = JSON.parse(data.content);
        if (refined && Array.isArray(refined.modules)) return refined as CourseBlueprint;
      } catch (e) {
        console.warn('[refineBlueprint] Failed to parse content as JSON:', e);
      }
    } else if (data?.blueprint && Array.isArray(data.blueprint.modules)) {
      return data.blueprint as CourseBlueprint;
    }
    return blueprint;
  } catch (e) {
    console.warn('[refineBlueprint] Client-side error:', e);
    return blueprint;
  }
};
