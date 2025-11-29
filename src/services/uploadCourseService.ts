import { supabase } from './supabaseClient';
import { CourseBlueprint } from '../types';

/**
 * Parse DOCX file to markdown
 */
async function parseDocx(arrayBuffer: ArrayBuffer): Promise<string> {
    try {
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

        const markdown = turndownService.turndown(html);
        return markdown;
    } catch (e) {
        console.warn('DOCX parse error:', e);
        // Fallback to plain text
        const text = new TextDecoder().decode(new Uint8Array(arrayBuffer));
        return text;
    }
}

/**
 * Parse TXT file
 */
function parseTxt(arrayBuffer: ArrayBuffer): string {
    return new TextDecoder().decode(new Uint8Array(arrayBuffer));
}

/**
 * Create a new course from an uploaded file
 */
export async function createCourseFromUpload(
    file: File,
    environment: 'LiveWorkshop' | 'OnlineCourse',
    userId: string
): Promise<{ success: boolean; courseId?: string; error?: string }> {
    try {
        // 1. Parse file based on extension
        const arrayBuffer = await file.arrayBuffer();
        const ext = file.name.split('.').pop()?.toLowerCase();
        let content = '';

        if (ext === 'docx') {
            content = await parseDocx(arrayBuffer);
        } else if (ext === 'txt') {
            content = parseTxt(arrayBuffer);
        } else {
            return { success: false, error: 'Unsupported file format. Please use .docx or .txt' };
        }

        if (!content || content.trim().length === 0) {
            return { success: false, error: 'Could not extract content from file' };
        }

        // 2. Call Edge Function to analyze content and generate Blueprint
        const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
            'generate-course-content',
            {
                body: {
                    action: 'analyze_upload',
                    fileContent: content,
                    fileName: file.name,
                    environment
                }
            }
        );

        if (analysisError) {
            console.error('Analysis error:', analysisError);
            return { success: false, error: 'Failed to analyze file content' };
        }

        let blueprint: CourseBlueprint;
        try {
            blueprint = JSON.parse(analysisData.content);
        } catch (e) {
            console.error('Blueprint parse error:', e);
            return { success: false, error: 'Failed to generate course blueprint' };
        }

        // 3. Create course record with Blueprint
        const courseTitle = blueprint.title || file.name.replace(/\.\w+$/, '');
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .insert({
                user_id: userId,
                title: courseTitle,
                subject: 'Imported Course',
                environment,
                target_audience: blueprint.target_audience || 'General',
                language: 'en',
                learning_objectives: blueprint.modules
                    .map(m => m.learning_objective)
                    .join('\n'),
                blueprint,
                progress: 0
            })
            .select()
            .single();

        if (courseError) {
            console.error('Course creation error:', courseError);
            return { success: false, error: 'Failed to create course' };
        }

        // 4. Fill content gaps (generate missing exercises, quizzes, etc.)
        // Note: This is optional and non-blocking
        fillContentGaps(course.id, blueprint, content, environment).catch(err => {
            console.warn('Gap filling failed (non-critical):', err);
        });

        return { success: true, courseId: course.id };
    } catch (error: any) {
        console.error('Upload error:', error);
        return { success: false, error: error.message || 'Upload failed' };
    }
}

/**
 * Fill missing content types in the course (runs in background)
 */
async function fillContentGaps(
    courseId: string,
    blueprint: CourseBlueprint,
    existingContent: string,
    environment: string
): Promise<void> {
    try {
        // Call Edge Function to identify and generate missing content
        const { data, error } = await supabase.functions.invoke('generate-course-content', {
            body: {
                action: 'fill_gaps',
                blueprint,
                existingContent,
                environment
            }
        });

        if (error) {
            console.error('Gap filling error:', error);
            return;
        }

        const gapsData = JSON.parse(data.content);
        const gaps = gapsData.gaps || [];

        if (gaps.length === 0) {
            console.log('No content gaps to fill');
            return;
        }

        // Log generated gap content
        console.log('Generated gap content:', gaps);

        // TODO: In a full implementation, you would create additional course_steps
        // or append this content to the blueprint
    } catch (error) {
        console.error('Gap filling failed:', error);
        // Non-critical, so we don't throw
    }
}
