import { supabase } from './supabaseClient';

// Normalize common broken image markdown: URL on next line
export const normalizeMarkdownImages = (md: string): string =>
  md.replace(/!\[([^\]]*)\]\s*\n\s*\(([^)]+)\)/g, '![$1]($2)');

// Upload a blob to Supabase Storage and return public URL
export const uploadBlobToStorage = async (
  blob: Blob,
  userId: string | null,
  courseId: string | null,
  fileNameHint?: string
): Promise<string> => {
  const BUCKET = 'course-assets';
  const mime = blob.type || 'image/png';
  const ext = mime.split('/')[1] || 'png';
  const hint = (fileNameHint || 'img').toString().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 24) || 'img';
  const uniqueName = `${hint}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const path = `${userId || 'anonymous'}/${courseId || 'course'}/${uniqueName}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: mime, upsert: false });
  if (error) throw new Error(error.message || 'Upload image failed');
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

// Replace blob: URLs and @img tokens in markdown with public URLs (uploads blobs)
export const replaceBlobUrlsWithPublic = async (
  md: string,
  userId: string | null,
  courseId: string | null
): Promise<string> => {
  const normalized = normalizeMarkdownImages(md);
  let updated = normalized;
  
  // Handle @img{uuid} tokens - these need to be processed at component level
  // since we don't have access to imageMap here. The component should handle
  // uploading the images referenced by tokens and replacing tokens with public URLs.
  
  // Handle direct blob: URLs
  const blobMatches = [...normalized.matchAll(/!\[[^\]]*\]\((blob:[^)]+)\)/g)];
  const dataMatches = [...normalized.matchAll(/!\[[^\]]*\]\((data:[^)]+)\)/g)];
  const blobUrls = Array.from(new Set(blobMatches.map(m => m[1])));
  const dataUrls = Array.from(new Set(dataMatches.map(m => m[1])));
  
  for (const blobUrl of blobUrls) {
    try {
      const res = await fetch(blobUrl);
      if (!res.ok) continue;
      const blob = await res.blob();
      const publicUrl = await uploadBlobToStorage(blob, userId, courseId);
      updated = updated.split(`(${blobUrl})`).join(`(${publicUrl})`);
    } catch {}
  }
  
  for (const dataUrl of dataUrls) {
    try {
      const parts = dataUrl.split(',');
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
      const bstr = atob(parts[1]);
      let n = bstr.length; const u8arr = new Uint8Array(n);
      while (n--) u8arr[n] = bstr.charCodeAt(n);
      const blob = new Blob([u8arr], { type: mime });
      const publicUrl = await uploadBlobToStorage(blob, userId, courseId);
      updated = updated.split(`(${dataUrl})`).join(`(${publicUrl})`);
    } catch (e) {
      void e;
    }
  }
  return updated;
};

// Convert blob: URLs to data URLs for export-only scenarios
export const replaceBlobUrlsWithData = async (md: string): Promise<string> => {
  const normalized = normalizeMarkdownImages(md);
  const matches = [...normalized.matchAll(/!\[[^\]]*\]\((blob:[^)]+)\)/g)];
  if (matches.length === 0) return normalized;
  let updated = normalized;
  const uniqueBlobUrls = Array.from(new Set(matches.map(m => m[1])));
  for (const blobUrl of uniqueBlobUrls) {
    try {
      const res = await fetch(blobUrl);
      if (!res.ok) continue;
      const blob = await res.blob();
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      updated = updated.split(`(${blobUrl})`).join(`(${dataUrl})`);
    } catch (e) {
      void e;
      // leave as-is on failure
    }
  }
  return updated;
};

export const ensurePublicExternalImages = async (
  md: string,
  userId: string | null,
  courseId: string | null
): Promise<string> => {
  const normalized = normalizeMarkdownImages(md);
  let updated = normalized;
  const urlRegex = /(https?:\/\/[^\s)]+?\.(?:png|jpe?g|gif|webp)(?:\?[^\s)]*)?)/ig;
  const allMatches = Array.from(new Set(Array.from(normalized.matchAll(urlRegex)).map(m => m[1])));
  for (const url of allMatches) {
    const isAlreadyPublic = /course-assets/.test(url);
    if (isAlreadyPublic) continue;
    try {
      let blob: Blob | null = null;
      try {
        const res = await fetch(url);
        if (res.ok) blob = await res.blob();
      } catch (e) {
        void e;
      }
      if (!blob) {
        const proxied = `https://images.weserv.nl/?url=${encodeURIComponent(url)}&output=png`;
        const res2 = await fetch(proxied);
        if (!res2.ok) continue;
        blob = await res2.blob();
      }
      const publicUrl = await uploadBlobToStorage(blob, userId, courseId);
      updated = updated.split(url).join(publicUrl);
    } catch (e) {
      void e;
    }
  }
  return updated;
};
