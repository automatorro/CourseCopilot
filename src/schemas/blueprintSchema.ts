import { z } from 'zod';

// Zod schema for CourseBlueprint validation
export const CourseSectionSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    content_type: z.enum(['slides', 'video_script', 'exercise', 'reading', 'quiz']),
    order: z.number().int().min(0),
    content_outline: z.string().optional(),
});

export const CourseModuleSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    learning_objective: z.string().min(1),
    sections: z.array(CourseSectionSchema).min(1),
});

export const CourseBlueprintSchema = z.object({
    version: z.literal('1.0'),
    modules: z.array(CourseModuleSchema).min(1).max(10),
    estimated_duration: z.string().optional(),
    generated_at: z.string().datetime(),
});

// Type inference from Zod schemas
export type ValidatedCourseBlueprint = z.infer<typeof CourseBlueprintSchema>;
export type ValidatedCourseModule = z.infer<typeof CourseModuleSchema>;
export type ValidatedCourseSection = z.infer<typeof CourseSectionSchema>;
