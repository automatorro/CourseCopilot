import { supabase } from './supabaseClient';
import { CourseFile } from '../types';

// Cache simplu în memorie pentru fișierele cursului, cu TTL pentru consistență
const filesCache: Record<string, { ts: number; files: CourseFile[] }> = {};
const FILES_CACHE_TTL_MS = 60_000;

/**
 * Extract text from uploaded file based on file type
 */
async function extractTextFromFile(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const ext = file.name.split('.').pop()?.toLowerCase();

    try {
        if (ext === 'docx') {
            const mammothLib: any = await import('mammoth');
            const result = await mammothLib.convertToHtml({ arrayBuffer });
            const html: string = result.value || '';

            // Convert HTML to Markdown
            const TurndownService = (await import('turndown')).default;
            const turndownPluginGfm = await import('turndown-plugin-gfm');
            const gfm = turndownPluginGfm.gfm || turndownPluginGfm;

            const turndownService = new TurndownService({
                headingStyle: 'atx',
                codeBlockStyle: 'fenced'
            });
            turndownService.use(gfm);
            turndownService.keep(['img']);

            return turndownService.turndown(html);
        } else if (ext === 'txt') {
            return new TextDecoder().decode(new Uint8Array(arrayBuffer));
        } else if (ext === 'pdf') {
            const pdfjsLib: any = await import('pdfjs-dist');
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                fullText += pageText + '\n\n';
            }

            return fullText;
        } else {
            throw new Error(`Unsupported file type: ${ext}`);
        }
    } catch (error) {
        console.error('Text extraction error:', error);
        throw new Error(`Failed to extract text from ${ext} file`);
    }
}

/**
 * Upload a file to course knowledge base
 */
export async function uploadCourseFile(
    courseId: string,
    file: File,
    userId: string
): Promise<{ success: boolean; fileId?: string; error?: string }> {
    try {
        // Validate file type
        const ext = file.name.split('.').pop()?.toLowerCase();
        const allowedTypes = ['pdf', 'docx', 'txt', 'pptx'];
        if (!ext || !allowedTypes.includes(ext)) {
            return { success: false, error: 'Unsupported file type. Please use PDF, DOCX, TXT, or PPTX.' };
        }

        // Validate file size (25MB limit)
        const maxSize = 25 * 1024 * 1024; // 25MB in bytes
        if (file.size > maxSize) {
            return { success: false, error: 'File size exceeds 25MB limit.' };
        }

        // Extract text content
        let extractedText: string | null = null;
        try {
            extractedText = await extractTextFromFile(file);
        } catch (error) {
            console.warn('Could not extract text, storing file without text content:', error);
        }

        // Upload file to Supabase Storage
        const storagePath = `${userId}/${courseId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
            .from('course-files')
            .upload(storagePath, file);

        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            return { success: false, error: 'Failed to upload file to storage.' };
        }

        // Store file metadata in database
        const { data: fileRecord, error: dbError } = await supabase
            .from('course_files')
            .insert({
                course_id: courseId,
                user_id: userId,
                filename: file.name,
                storage_path: storagePath,
                file_type: ext,
                file_size: file.size,
                extracted_text: extractedText
            })
            .select()
            .single();

        if (dbError) {
            console.error('Database insert error:', dbError);
            // Clean up uploaded file
            await supabase.storage.from('course-files').remove([storagePath]);
            return { success: false, error: 'Failed to save file metadata.' };
        }

        // Invalidează cache-ul pentru acest curs
        delete filesCache[courseId];

        return { success: true, fileId: fileRecord.id };
    } catch (error: any) {
        console.error('Upload error:', error);
        return { success: false, error: error.message || 'Upload failed.' };
    }
}

/**
 * Get all files for a course
 */
export async function getCourseFiles(courseId: string): Promise<CourseFile[]> {
    const now = Date.now();
    const cached = filesCache[courseId];
    if (cached && (now - cached.ts) < FILES_CACHE_TTL_MS) {
        return cached.files;
    }

    const { data, error } = await supabase
        .from('course_files')
        .select('*')
        .eq('course_id', courseId)
        .order('uploaded_at', { ascending: false });

    if (error) {
        console.error('Error fetching course files:', error);
        return [];
    }

    const files = data || [];
    filesCache[courseId] = { ts: now, files };
    return files;
}

/**
 * Delete a course file
 */
export async function deleteCourseFile(fileId: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Get file metadata first
        const { data: file, error: fetchError } = await supabase
            .from('course_files')
            .select('storage_path, course_id')
            .eq('id', fileId)
            .single();

        if (fetchError || !file) {
            return { success: false, error: 'File not found.' };
        }

        // Delete from storage
        const { error: storageError } = await supabase.storage
            .from('course-files')
            .remove([file.storage_path]);

        if (storageError) {
            console.error('Storage delete error:', storageError);
        }

        // Delete from database
        const { error: dbError } = await supabase
            .from('course_files')
            .delete()
            .eq('id', fileId);

        if (dbError) {
            console.error('Database delete error:', dbError);
            return { success: false, error: 'Failed to delete file.' };
        }

        // Invalidează cache-ul pentru cursul afectat
        if (file?.course_id) {
            delete filesCache[file.course_id as string];
        }

        return { success: true };
    } catch (error: any) {
        console.error('Delete error:', error);
        return { success: false, error: error.message || 'Delete failed.' };
    }
}

/**
 * Get file content by ID (for AI context)
 */
export async function getFileContent(fileId: string): Promise<string | null> {
    const { data, error } = await supabase
        .from('course_files')
        .select('extracted_text')
        .eq('id', fileId)
        .single();

    if (error || !data) {
        console.error('Error fetching file content:', error);
        return null;
    }

    return data.extracted_text;
}
