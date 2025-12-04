import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, Circle, Loader2, AlertTriangle } from 'lucide-react';
import { TrainerStepType, Course } from '../types';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/I18nContext';
import { detectNonLocalizedFragments, compareModuleTitlesText, extractModuleDurations, validateDurationsArray, alignWorkbookDurationsByStructure } from '../lib/outputValidators';
import { isEnabled } from '../config/featureFlags';

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
    const safeT = (key: string, fallback: string) => {
        const v = t(key);
        return (typeof v === 'string' && v === key) ? fallback : v;
    };
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<TrainerStepType[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationReport, setValidationReport] = useState<{ ok: boolean; items: { ok: boolean; message: string; key?: string; type?: string }[] } | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const accumulatedContentRef = useRef<any[]>([]); // Store content to pass as context
    const pendingStepsRef = useRef<any[]>([]); // Steps ready to insert if user chooses to save despite warnings

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

    const handleRegenerateAffected = async () => {
        try {
            if (!validationReport || validationReport.ok) return;
            setIsGenerating(true);

            const LIVRABLE_MAPPING: { key: string; sources: TrainerStepType[] }[] = [
                { key: 'course.livrables.structure', sources: [TrainerStepType.PerformanceObjectives, TrainerStepType.CourseObjectives, TrainerStepType.Structure, TrainerStepType.TimingAndFlow] },
                { key: 'course.livrables.examples', sources: [TrainerStepType.ExamplesAndStories] },
                { key: 'course.livrables.participant_workbook', sources: [TrainerStepType.ParticipantWorkbook, TrainerStepType.CheatSheets] },
                { key: 'course.livrables.trainer_manual', sources: [TrainerStepType.LearningMethods, TrainerStepType.FacilitatorNotes, TrainerStepType.FacilitatorManual] },
                { key: 'course.livrables.exercises', sources: [TrainerStepType.Exercises, TrainerStepType.Projects] },
                { key: 'course.livrables.slides', sources: [TrainerStepType.Slides] },
                { key: 'course.livrables.video_scripts', sources: [TrainerStepType.VideoScripts] },
            ];

            const affectedKeys = new Set<string>();
            for (const it of validationReport.items) {
                if (it.type === 'nonLocalized' && it.key) affectedKeys.add(it.key);
                if (it.type === 'modulesMismatch') affectedKeys.add('course.livrables.slides');
                if (it.type === 'durationMismatch') affectedKeys.add('course.livrables.participant_workbook');
            }

            const stepTypesToRegenerate = new Set<TrainerStepType>();
            for (const m of LIVRABLE_MAPPING) {
                if (affectedKeys.has(m.key)) {
                    m.sources.forEach(s => stepTypesToRegenerate.add(s));
                }
            }

            const userId = course.user_id || user?.id;
            if (!userId) throw new Error('User ID is missing.');

            for (const s of stepTypesToRegenerate) {
                const { data, error: fnError } = await supabase.functions.invoke('generate-course-content', {
                    body: { action: 'generate_step_content', course, step_type: s, context_files: [] },
                });
                if (fnError) throw fnError;
                const generatedContent = data.content;
                const arr = accumulatedContentRef.current;
                const idx = arr.findIndex((i: any) => i.step_type === s);
                if (idx >= 0) arr[idx].content = generatedContent; else arr.push({ step_type: s, content: generatedContent });
            }

            await finalizeGeneration();
        } catch (err: any) {
            console.error('[GenerationProgressModal] Regenerate affected failed:', err);
            setError(err.message || 'Failed to regenerate affected deliverables.');
            setIsGenerating(false);
        }
    };

    const handleAutoFixWorkbook = async () => {
        try {
            if (!validationReport || validationReport.ok) return;
            const steps = pendingStepsRef.current || [];
            if (steps.length === 0) return;

            const structureStep = steps.find((s: any) => s.title_key === 'course.livrables.structure');
            const workbookStep = steps.find((s: any) => s.title_key === 'course.livrables.participant_workbook');
            if (!structureStep || !workbookStep) return;

            const fixed = alignWorkbookDurationsByStructure(structureStep.content, workbookStep.content);
            workbookStep.content = fixed;

            const sd = extractModuleDurations(structureStep.content);
            const wd = extractModuleDurations(workbookStep.content);
            const v = validateDurationsArray(sd, wd);
            const items = (validationReport.items || []).filter(it => it.type !== 'durationMismatch');
            if (!v.ok) {
                items.push({ ok: false, message: t('validation.durationMismatch'), type: 'durationMismatch', key: 'course.livrables.participant_workbook' });
                setValidationReport({ ok: false, items });
                return;
            }
            items.push({ ok: true, message: t('validation.durationMatch') });
            const stillIssues = items.some(it => it.ok === false);
            setValidationReport({ ok: !stillIssues, items });

            if (!stillIssues) {
                setIsGenerating(true);
                const { error: deleteError } = await supabase
                    .from('course_steps')
                    .delete()
                    .eq('course_id', course.id);
                if (deleteError) throw deleteError;

                const { error: insertError } = await supabase
                    .from('course_steps')
                    .insert(steps);
                if (insertError) throw insertError;

                setIsGenerating(false);
                setValidationReport(null);
                onComplete();
            }
        } catch (err: any) {
            console.error('[GenerationProgressModal] Auto-fix workbook failed:', err);
            setError(err.message || 'Failed to auto-fix workbook durations.');
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

            // 2. Aggregate (prepare, but do not delete yet)
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

            console.log('[GenerationProgressModal] Steps prepared to insert:', stepsToInsert);

            // 4. Validation before insert
            const byKey: Record<string, string> = Object.fromEntries(stepsToInsert.map(s => [s.title_key, s.content]));
            const items: { ok: boolean; message: string; key?: string; type?: string }[] = [];
            let overallOk = true;

            // a) Non-localized fragments (if not EN)
            if ((course.language || 'en').toLowerCase() !== 'en') {
                for (const [key, content] of Object.entries(byKey)) {
                    const res = detectNonLocalizedFragments(content, course.language || 'ro');
                    if (!res.ok) {
                        if (isEnabled('validationStrictLocalization')) {
                            overallOk = false;
                        }
                        items.push({ ok: false, message: t('validation.nonLocalized', { key: t(key), hints: res.hints.join(', ') }), key, type: 'nonLocalized' });
                    } else {
                        items.push({ ok: true, message: t('validation.okNonLocalized', { key: t(key) }) });
                    }
                }
            }

            // b) Module titles consistency between Structure and Slides
            if (byKey['course.livrables.structure'] && byKey['course.livrables.slides']) {
                const cmp = compareModuleTitlesText(byKey['course.livrables.structure'], byKey['course.livrables.slides']);
                if (!cmp.ok) {
                    overallOk = false;
                    items.push({ ok: false, message: t('validation.modulesMismatch', { missing: (cmp.missingInB || []).join('; '), extra: (cmp.extraInB || []).join('; ') }), type: 'modulesMismatch' });
                } else {
                    items.push({ ok: true, message: t('validation.modulesMatch') });
                }
            }

            // c) Durations array consistency between Structure and Workbook
            if (byKey['course.livrables.structure'] && byKey['course.livrables.participant_workbook']) {
                const sd = extractModuleDurations(byKey['course.livrables.structure']);
                const wd = extractModuleDurations(byKey['course.livrables.participant_workbook']);
                const v = validateDurationsArray(sd, wd);
                if (!v.ok) {
                    overallOk = false;
                    items.push({ ok: false, message: t('validation.durationMismatch'), type: 'durationMismatch', key: 'course.livrables.participant_workbook' });
                } else {
                    items.push({ ok: true, message: t('validation.durationMatch') });
                }
            }

            setValidationReport({ ok: overallOk, items });

            if (!overallOk) {
                setIsGenerating(false);
                console.warn('[GenerationProgressModal] Validation failed. Not inserting steps.');
                pendingStepsRef.current = stepsToInsert; // Allow user to save as draft
                return; // Stop here, show report in UI
            }

            // 5. Delete existing and insert if validation ok
            console.log('[GenerationProgressModal] Deleting existing steps for course:', course.id);
            const { error: deleteError } = await supabase
                .from('course_steps')
                .delete()
                .eq('course_id', course.id);

            if (deleteError) throw deleteError;

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

    const handleSaveDraft = async () => {
        try {
            const steps = pendingStepsRef.current || [];
            if (steps.length === 0) {
                setValidationReport(null);
                return;
            }
            setIsGenerating(true);

            console.log('[GenerationProgressModal] Saving draft despite warnings...');
            const { error: deleteError } = await supabase
                .from('course_steps')
                .delete()
                .eq('course_id', course.id);
            if (deleteError) throw deleteError;

            const { error: insertError } = await supabase
                .from('course_steps')
                .insert(steps);
            if (insertError) throw insertError;

            setValidationReport(null);
            setIsGenerating(false);
            onComplete();
        } catch (err: any) {
            console.error('[GenerationProgressModal] Save draft failed:', err);
            setError(err.message || 'Failed to save draft.');
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
                    {/* Validation Report */}
                    {validationReport && !isGenerating && (
                        <div className={`p-4 rounded-lg border ${validationReport.ok ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-900/30' : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-900/30'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                {validationReport.ok ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                )}
                                <span className="font-semibold">
                                    {validationReport.ok ? t('validation.titleOk') : t('validation.titleIssues')}
                                </span>
                            </div>
                            <ul className="space-y-1">
                                {validationReport.items.map((it, idx) => (
                                    <li key={idx} className="text-sm">
                                        <span className={it.ok ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}>• {it.message}</span>
                                    </li>
                                ))}
                            </ul>
                            {!validationReport.ok && (
                                <div className="mt-3 flex flex-wrap gap-2 md:justify-start">
                                    <button onClick={startGeneration} className="btn-premium-sm w-full sm:w-auto">
                                        {safeT('validation.actions.retry', 'Regenerează')}
                                    </button>
                                    <button onClick={() => setValidationReport(null)} className="btn-premium--secondary-sm w-full sm:w-auto">
                                        {safeT('validation.actions.dismiss', 'Ascunde raportul')}
                                    </button>
                                    <button onClick={handleSaveDraft} className="btn-premium-sm w-full sm:w-auto">
                                        {safeT('validation.actions.saveDraft', 'Salvează ca draft')}
                                    </button>
                                    <button onClick={handleRegenerateAffected} className="btn-premium-sm w-full sm:w-auto">
                                        {safeT('validation.actions.regenerateAffected', 'Regenerează livrabilele afectate')}
                                    </button>
                                    {validationReport.items.some(it => it.type === 'durationMismatch') && (
                                        <button onClick={handleAutoFixWorkbook} className="btn-premium-sm w-full sm:w-auto">
                                            {safeT('validation.actions.autoFixWorkbook', 'Auto‑fix durate Workbook')}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
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

                    {!isGenerating && !validationReport && (
                        <div className="mt-3 flex flex-wrap gap-2 md:justify-end">
                            {(pendingStepsRef.current?.length || 0) > 0 && (
                                <button onClick={handleSaveDraft} className="btn-premium-sm w-full sm:w-auto">
                                    {safeT('validation.actions.saveDraft', 'Salvează ca draft')}
                                </button>
                            )}
                            <button onClick={onClose} className="btn-premium--secondary-sm w-full sm:w-auto">
                                {safeT('common.close', 'Închide')}
                            </button>
                        </div>
                    )}

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
