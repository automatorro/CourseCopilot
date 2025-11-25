import { supabase } from './supabaseClient';

export type DeleteCourseResult = {
  ok: boolean;
  code?: 'FORBIDDEN' | 'NOT_FOUND' | 'NETWORK' | 'UNKNOWN';
  message?: string;
};

/**
 * Deletes a course, relying on FK ON DELETE CASCADE when configured.
 * Falls back to deleting steps first if a foreign key constraint blocks deletion.
 */
export async function deleteCourseById(courseId: string, _userId: string): Promise<DeleteCourseResult> {
  console.log(`[CourseService] deleteCourseById called: courseId=${courseId}`);
  try {
    // Try deleting the course directly (preferred when FK ON DELETE CASCADE is set)
    const { error: courseError } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (courseError) {
      console.warn('[CourseService] Direct delete failed:', courseError);
      const msg = (courseError.message || '').toLowerCase();
      const code = (courseError.code || '').toLowerCase();
      const isFkViolation = msg.includes('foreign key') || code === '23503';

      if (!isFkViolation) {
        const mapped = mapSupabaseError(courseError);
        return { ok: false, code: mapped, message: courseError.message };
      }

      console.log('[CourseService] FK violation detected, attempting cascade delete manually...');
      // FK constraint blocked deletion; delete steps first then retry course
      const { error: stepsError } = await supabase
        .from('course_steps')
        .delete()
        .eq('course_id', courseId);

      if (stepsError) {
        console.error('[CourseService] Failed to delete steps:', stepsError);
        const mapped = mapSupabaseError(stepsError);
        return { ok: false, code: mapped, message: stepsError.message };
      }

      const { error: retryError } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (retryError) {
        console.error('[CourseService] Retry delete failed:', retryError);
        const mapped = mapSupabaseError(retryError);
        return { ok: false, code: mapped, message: retryError.message };
      }
    }

    // Post-delete verification: confirm the course no longer exists
    const { data: stillExists, error: checkError } = await supabase
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .maybeSingle();

    if (checkError) {
      console.error('[CourseService] Verification check failed:', checkError);
      const mapped = mapSupabaseError(checkError);
      return { ok: false, code: mapped, message: checkError.message };
    }

    if (stillExists) {
      console.error('[CourseService] Course still exists after delete (RLS issue?):', stillExists);
      // Deletion did not occur: likely blocked by RLS permissions
      return { ok: false, code: 'FORBIDDEN', message: 'Deletion disallowed by RLS or constraints' };
    }

    console.log('[CourseService] Delete successful');
    return { ok: true };
  } catch (e: any) {
    console.error('[CourseService] Unexpected error:', e);
    const message = e?.message || 'Network or unexpected error';
    return { ok: false, code: 'NETWORK', message };
  }
}

function mapSupabaseError(error: { message: string; code?: string }): DeleteCourseResult['code'] {
  const msg = (error.message || '').toLowerCase();
  const code = (error.code || '').toLowerCase();
  if (msg.includes('permission denied') || code === '42501') return 'FORBIDDEN';
  if (msg.includes('not found')) return 'NOT_FOUND';
  if (msg.includes('fetch') || msg.includes('network')) return 'NETWORK';
  return 'UNKNOWN';
}