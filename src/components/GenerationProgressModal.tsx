import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, Circle, Loader2, AlertTriangle } from 'lucide-react';
import { TrainerStepType, Course } from '../types';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/I18nContext';

interface GenerationProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    course: Course;
    onComplete: () => void;
}

const STEPS_ORDER = [
    { type: TrainerStepType.PerformanceObjectives, key: 'generation.steps.performanceObjectives' },
    { type: TrainerStepType.CourseObjectives, key: 'generation.steps.courseObjectives' },
    { type: TrainerStepType.Structure, key: 'generation.steps.structure' },
    { type: TrainerStepType.LearningMethods, key: 'generation.steps.learningMethods' },
    { type: TrainerStepType.TimingAndFlow, key: 'generation.steps.timingFlow' },
    { type: TrainerStepType.Exercises, key: 'generation.steps.exercises' },
    { type: TrainerStepType.ExamplesAndStories, key: 'generation.steps.examplesStories' },
    { type: TrainerStepType.FacilitatorNotes, key: 'generation.steps.facilitatorNotes' },
    { type: TrainerStepType.Slides, key: 'generation.steps.slides' },
    { type: TrainerStepType.FacilitatorManual, key: 'generation.steps.facilitatorManual' },
    { type: TrainerStepType.ParticipantWorkbook, key: 'generation.steps.participantWorkbook' },
    { type: TrainerStepType.VideoScripts, key: 'generation.steps.videoScripts' },
];

export const GenerationProgressModal: React.FC<GenerationProgressModalProps> = ({
    isOpen,
    onClose,
    course,
    onComplete,
}) => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<TrainerStepType[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const accumulatedContentRef = useRef<any[]>([]); // Store content to pass as context

    // Filter steps based on environment
    const relevantSteps = STEPS_ORDER.filter(step => {
        if (course.environment === 'LiveWorkshop' && step.type === TrainerStepType.VideoScripts) return false;
        if (course.environment === 'OnlineCourse' && step.type === TrainerStepType.FacilitatorManual) return false; // Optional: Online might not need Facilitator Manual
        return true;
    });

    const hasStartedRef = useRef(false);

    useEffect(() => {
        if (isOpen && !isGenerating && completedSteps.length === 0 && !hasStartedRef.current) {
            hasStartedRef.current = true;
            startGeneration();
        }
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [isOpen]);

    const startGeneration = async () => {
        setIsGenerating(true);
        console.log('[GenerationProgressModal] Starting generation...');
        setError(null);
        setCurrentStepIndex(0);
        setCompletedSteps([]);
        accumulatedContentRef.current = [];

        try {
            // 0. Connection Check (Ping)
            console.log('[GenerationProgressModal] Pinging Edge Function...');
            const { data: pingData, error: pingError } = await supabase.functions.invoke('generate-course-content', {
                body: { action: 'ping' }
            });

            if (pingError) {
                console.error('[GenerationProgressModal] Ping failed:', pingError);
                throw new Error(`Connection failed: ${pingError.message}. Please check if the Edge Function is deployed.`);
            }

            if (!pingData || pingData.message !== 'pong') {
                console.error('[GenerationProgressModal] Invalid ping response:', pingData);
                throw new Error('Connection verification failed. Invalid response from server.');
            }

            console.log('[GenerationProgressModal] Ping successful. Starting steps...');
            await processStep(0);
        } catch (err: any) {
            console.error("Generation failed:", err);
            setError(err.message || "An unexpected error occurred.");
            setIsGenerating(false);
        }
    };

    const processStep = async (index: number) => {
        if (index >= relevantSteps.length) {
            await finalizeGeneration();
            return;
        }

        setCurrentStepIndex(index);
        const step = relevantSteps[index];
            console.log(`[GenerationProgressModal] Processing step ${index + 1}/${relevantSteps.length}: ${step.key}`);

        try {
            // Validate that we have user_id (use fallback from auth context if needed)
            const userId = course.user_id || user?.id;
            if (!userId) {
                throw new Error('User ID is missing. Please refresh the page and try again.');
            }

            // 1. Call Edge Function
            const { data, error: fnError } = await supabase.functions.invoke('generate-course-content', {
                body: {
                    action: 'generate_step_content',
                    course: course,
                    step_type: step.type,
                    previous_steps: accumulatedContentRef.current
                }
            });

            if (fnError) throw new Error(fnError.message);
            if (data.error) throw new Error(data.error);

            const generatedContent = data.content;

            // 2. Store in Memory (Don't save to DB yet)
            accumulatedContentRef.current.push({
                step_type: step.type,
                content: generatedContent
            });

            setCompletedSteps(prev => [...prev, step.type]);

            // 3. Next Step (Recursive)
            await processStep(index + 1);

        } catch (err: any) {
            console.error(`Error processing step ${step.key}:`, err);
            setError(err.message || "An error occurred during generation.");
            setIsGenerating(false);
        }
    };

    const finalizeGeneration = async () => {
        try {
            console.log('[GenerationProgressModal] Finalizing generation...');
            const userId = course.user_id || user?.id;
            if (!userId) throw new Error('User ID is missing.');

            // 1. Define Mapping (8 Livrables - Fixed to separate incompatible types)
            const LIVRABLE_MAPPING = [
                {
                    key: 'course.livrables.structure',
                    label: 'Complete Structure',
                    sources: [
                        TrainerStepType.PerformanceObjectives,
                        TrainerStepType.CourseObjectives,
                        TrainerStepType.Structure,
                        TrainerStepType.TimingAndFlow
                    ]
                },
                {
                    key: 'course.livrables.examples',
                    label: 'Examples & Case Studies',
                    sources: [
                        TrainerStepType.ExamplesAndStories
                    ]
                },
                {
                    key: 'course.livrables.participant_workbook',
                    label: 'Participant Workbook',
                    sources: [
                        TrainerStepType.ParticipantWorkbook,
                        TrainerStepType.CheatSheets
                    ]
                },
                {
                    key: 'course.livrables.trainer_manual',
                    label: 'Trainer Manual',
                    sources: [
                        TrainerStepType.LearningMethods,
                        TrainerStepType.FacilitatorNotes,
                        TrainerStepType.FacilitatorManual
                    ]
                },
                {
                    key: 'course.livrables.exercises',
                    label: 'Exercises & Activities',
                    sources: [
                        TrainerStepType.Exercises,
                        TrainerStepType.Projects
                    ]
                },
                {
                    key: 'course.livrables.slides',
                    label: 'Slide Deck',
                    sources: [
                        TrainerStepType.Slides
                    ]
                },
                {
                    key: 'course.livrables.video_scripts',
                    label: 'Video Scripts',
                    sources: [
                        TrainerStepType.VideoScripts
                    ]
                },
                {
                    key: 'course.livrables.assessment',
                    label: 'Assessment & Tests',
                    sources: [
                        TrainerStepType.Tests // Note: Currently not generated in 12-step flow, but keeping for future
                    ]
                }
            ];

            // 2. Delete existing steps to avoid duplicates
            console.log('[GenerationProgressModal] Deleting existing steps for course:', course.id);
            const { error: deleteError } = await supabase
                .from('course_steps')
                .delete()
                .eq('course_id', course.id);

            if (deleteError) throw deleteError;

            // 3. Aggregate and Insert
            const stepsToInsert = [];
            let orderCounter = 1;

            console.log('[GenerationProgressModal] Accumulated content:', accumulatedContentRef.current);

            for (const livrable of LIVRABLE_MAPPING) {
                // Find all content chunks that belong to this livrable
                const chunks = accumulatedContentRef.current.filter(item =>
                    livrable.sources.includes(item.step_type)
                );

                if (chunks.length > 0) {
                    console.log(`[GenerationProgressModal] Found ${chunks.length} chunks for ${livrable.key}`);
                    // Join content with separators
                    const aggregatedContent = chunks.map(c => c.content).join('\n\n---\n\n');

                    stepsToInsert.push({
                        course_id: course.id,
                        user_id: userId,
                        title_key: livrable.key,
                        content: aggregatedContent,
                        step_order: orderCounter++,
                        is_completed: true
                    });
                } else {
                    console.log(`[GenerationProgressModal] No chunks found for ${livrable.key}`);
                }
            }

            console.log('[GenerationProgressModal] Steps to insert:', stepsToInsert);

            if (stepsToInsert.length > 0) {
                const { error: insertError } = await supabase
                    .from('course_steps')
                    .insert(stepsToInsert);

                if (insertError) {
                    console.error('[GenerationProgressModal] Insert error:', insertError);
                    throw insertError;
                }
                console.log('[GenerationProgressModal] Insert successful');
            } else {
                console.warn('[GenerationProgressModal] No steps to insert!');
            }

            setIsGenerating(false);
            onComplete();

        } catch (err: any) {
            console.error("Finalization failed:", err);
            setError("Failed to save generated materials: " + err.message);
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            {t('generation.title')}
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {t('generation.subtitle', { env: course.environment === 'LiveWorkshop' ? t('generation.env.workshop') : t('generation.env.online') })}
                        </p>
                    </div>
                    {!isGenerating && (
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-red-900 dark:text-red-200">{t('generation.paused')}</h3>
                                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                                <button
                                    onClick={startGeneration}
                                    className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    {t('common.retry')}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        {relevantSteps.map((step, index) => {
                            const isCompleted = completedSteps.includes(step.type);
                            const isCurrent = index === currentStepIndex && isGenerating;

                            return (
                                <div
                                    key={step.type}
                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isCurrent
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                        : isCompleted
                                            ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30'
                                            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-60'
                                        }`}
                                >
                                    <div className="shrink-0">
                                        {isCompleted ? (
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        ) : isCurrent ? (
                                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                        ) : (
                                            <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <span className={`font-medium ${isCurrent ? 'text-blue-700 dark:text-blue-300' :
                                            isCompleted ? 'text-green-700 dark:text-green-300' :
                                                'text-slate-500 dark:text-slate-500'
                                            }`}>
                                            {`${index + 1}. ${t(step.key)}`}
                                        </span>
                                    </div>

                                    {isCurrent && (
                                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400 animate-pulse">
                                            {t('generation.generating')}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl">
                    <div className="flex justify-between items-center text-sm text-slate-500">
                        <span>
                            {t('generation.completed', { done: completedSteps.length, total: relevantSteps.length })}
                        </span>
                        {isGenerating && (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                {t('generation.processing')}
                            </span>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 transition-all duration-500 ease-out"
                            style={{ width: `${(completedSteps.length / relevantSteps.length) * 100}%` }}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};
