import { supabase } from './supabaseClient';
import { CourseVersion } from '../types';

export async function createStepVersion(
  courseId: string,
  stepId: string,
  content: string,
  changeType: 'import' | 'manual_edit' | 'ai_generation' | 'restore',
  description?: string
): Promise<{ ok: boolean; error?: string; version?: CourseVersion }> {
  try {
    // 1. Get current max version number for this step
    const { data: maxVer } = await supabase
      .from('course_versions')
      .select('version_number')
      .eq('step_id', stepId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    let nextVersion = 1;
    if (maxVer) {
      nextVersion = maxVer.version_number + 1;
    }
    
    console.log('[Versioning] Creating version', nextVersion, 'for step', stepId);

    // 2. Insert new version
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return { ok: false, error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('course_versions')
      .insert({
        course_id: courseId,
        step_id: stepId,
        version_number: nextVersion,
        content: content,
        change_type: changeType,
        change_description: description,
        created_by: user.user.id
      })
      .select()
      .single();

    if (error) throw error;

    return { ok: true, version: data as CourseVersion };
  } catch (e: any) {
    console.error('Error creating version:', e);
    return { ok: false, error: e.message };
  }
}

export async function getStepVersions(stepId: string): Promise<CourseVersion[]> {
  console.log('[Versioning] Fetching versions for step:', stepId);
  const { data, error } = await supabase
    .from('course_versions')
    .select('*')
    .eq('step_id', stepId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching versions:', error);
    return [];
  }
  console.log('[Versioning] Found versions:', data?.length);
  return data as CourseVersion[];
}
