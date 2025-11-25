import { supabase } from '../services/supabaseClient';
import { CourseBlueprintSchema } from '../schemas/blueprintSchema';
import { CourseBlueprint } from '../types';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

/**
 * Generate course blueprint with retry logic for AI failures
 */
export async function generateBlueprintWithRetry(
    courseId: string,
    learningObjectives: string,
    courseMetadata: {
        title: string;
        subject: string;
        target_audience: string;
        environment: string;
        language: string;
    }
): Promise<{ success: boolean; blueprint?: CourseBlueprint; error?: string }> {

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            // Call Edge Function
            const { data, error: functionError } = await supabase.functions.invoke('generate-course-content', {
                body: {
                    action: 'generate_blueprint',
                    course: {
                        ...courseMetadata,
                        learning_objectives: learningObjectives,
                    },
                },
            });

            if (functionError) {
                throw new Error(`Edge Function error: ${functionError.message}`);
            }

            // Parse response
            const responseContent = data.content;
            let parsedBlueprint;

            try {
                parsedBlueprint = typeof responseContent === 'string'
                    ? JSON.parse(responseContent)
                    : responseContent;
            } catch (parseError: unknown) {
                const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parse error';
                throw new Error(`JSON parse error: ${errorMessage}`);
            }

            // Validate with Zod
            const validationResult = CourseBlueprintSchema.safeParse(parsedBlueprint);

            if (!validationResult.success) {
                const errorMessages = validationResult.error.issues
                    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
                    .join(', ');
                throw new Error(`Blueprint validation failed: ${errorMessages}`);
            }

            // Success! Save to database
            const { error: updateError } = await supabase
                .from('courses')
                .update({ blueprint: validationResult.data })
                .eq('id', courseId);

            if (updateError) {
                throw new Error(`Database update error: ${updateError.message}`);
            }

            return { success: true, blueprint: validationResult.data };

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Blueprint generation attempt ${attempt + 1} failed:`, errorMessage);

            // If this was the last retry, return error
            if (attempt === MAX_RETRIES) {
                return {
                    success: false,
                    error: `Failed after ${MAX_RETRIES + 1} attempts: ${errorMessage}`
                };
            }

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
        }
    }

    // This should never be reached, but TypeScript requires it
    return { success: false, error: 'Unknown error occurred' };
}

/**
 * Validate existing blueprint from database
 */
export function validateBlueprint(blueprint: any): { valid: boolean; error?: string } {
    const result = CourseBlueprintSchema.safeParse(blueprint);

    if (result.success) {
        return { valid: true };
    }

    const errorMessages = result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');
    return { valid: false, error: errorMessages };
}
