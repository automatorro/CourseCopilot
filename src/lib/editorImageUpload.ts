import { supabase } from '../services/supabaseClient';

export const uploadEditorImageToSupabase = async (file: File, userId?: string): Promise<string> => {
  const primaryBucket: string = (import.meta as any).env?.VITE_EDITOR_IMAGES_BUCKET || 'course-assets';
  const fallbackBucket = 'editor-images';
  const ext = (file.name.split('.').pop() || 'png').toLowerCase();
  const base = file.name.replace(/\.[^\/\.]+$/, '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40) || 'img';
  const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const safeUser = (userId || 'anonymous').toLowerCase();
  const path = `${safeUser}/${unique}_${base}.${ext}`;

  const tryUpload = async (bucket: string): Promise<string> => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      contentType: file.type || 'image/png',
      upsert: false,
    });
    if (error) throw new Error(error.message || 'Upload to Supabase failed');
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  try {
    return await tryUpload(primaryBucket);
  } catch (_e: any) {
    try {
      return await tryUpload(fallbackBucket);
    } catch (e2: any) {
      throw e2;
    }
  }
};
