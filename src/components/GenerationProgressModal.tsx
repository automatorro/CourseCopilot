import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, Circle, Loader2, AlertTriangle, Play, Pause } from 'lucide-react';
import { TrainerStepType, Course } from '../types';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/I18nContext';
import { detectNonLocalizedFragments, compareModuleTitlesText, extractModuleDurations, validateDurationsArray, alignWorkbookDurationsByStructure } from '../lib/outputValidators';
import { isEnabled } from '../config/featureFlags';

const extractModuleTitlesFromMarkdown = (md: string): string[] => {
    const titles: string[] = [];
    const lines = String(md || '').split('\n');
    for (const line of lines) {
        const m = line.match(/^#{1,6}\s+(.*)$/);
        if (!m) continue;
        const s = m[1].trim();
        const low = s.toLowerCase();
        if (/^(module|modul)\b/.test(low) || low.includes('modul ') || low.includes('module ')) {
            titles.push(s);
        }
    }
    return titles;
};

const buildContextSummary = (acc: any[]): { modules: string[]; durations: number[]; exercisesCount: number } => {
    const structure = (acc || []).find((s: any) => s.step_type === TrainerStepType.Structure)?.content || '';
    const exercises = (acc || []).find((s: any) => s.step_type === TrainerStepType.Exercises)?.content || '';
    const modules = extractModuleTitlesFromMarkdown(String(structure || ''));
    const durations = extractModuleDurations(String(structure || '')) || [];
    const exCount = (String(exercises || '').match(/\b(Exerci\w+|Exercise)\b/gi) || []).length;
    return { modules, durations, exercisesCount: exCount };
};

interface GenerationProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    course: Course;
    onComplete: () => void;
}

const LEGACY_STEPS_ORDER = [
    { type: TrainerStepType.CourseDNA, key: 'generation.steps.courseDNA' },
    { type: TrainerStepType.PerformanceObjectives, key: 'generation.steps.performanceObjectives' },
    { type: TrainerStepType.CourseObjectives, key: 'generation.steps.courseObjectives' },
    { type: TrainerStepType.Structure, key: 'generation.steps.structure' },
    { type: TrainerStepType.LearningMethods, key: 'generation.steps.learningMethods' },
    { type: TrainerStepType.TimingAndFlow, key: 'generation.steps.timingFlow' },
    { type: TrainerStepType.AgendaTable, key: 'generation.steps.agendaTable' },
    { type: TrainerStepType.Exercises, key: 'generation.steps.exercises' },
    { type: TrainerStepType.DiagnosticQuestionnaire, key: 'generation.steps.diagnosticQuestionnaire' },
    { type: TrainerStepType.ExamplesAndStories, key: 'generation.steps.examplesStories' },
    { type: TrainerStepType.FacilitatorNotes, key: 'generation.steps.facilitatorNotes' },
    { type: TrainerStepType.FacilitatorManual, key: 'generation.steps.facilitatorManual' },
    { type: TrainerStepType.DiscussionGuide, key: 'generation.steps.discussionGuide' },
    { type: TrainerStepType.Slides, key: 'generation.steps.slides' },
    { type: TrainerStepType.ParticipantWorkbook, key: 'generation.steps.participantWorkbook' },
    { type: TrainerStepType.ActionPlan, key: 'generation.steps.actionPlan' },
    { type: TrainerStepType.VideoScripts, key: 'generation.steps.videoScripts' },
];

const CONTRACT_STEPS_ORDER = [
    { type: TrainerStepType.CourseDNA, key: 'generation.steps.courseDNA' },
    { type: TrainerStepType.PerformanceObjectives, key: 'generation.steps.performanceObjectives' },
    { type: TrainerStepType.CourseObjectives, key: 'generation.steps.courseObjectives' },
    { type: TrainerStepType.Structure, key: 'generation.steps.structure' },
    { type: TrainerStepType.LearningMethods, key: 'generation.steps.learningMethods' },
    { type: TrainerStepType.TimingAndFlow, key: 'generation.steps.timingFlow' },
    { type: TrainerStepType.Exercises, key: 'generation.steps.exercises' },
    { type: TrainerStepType.ExamplesAndStories, key: 'generation.steps.examplesStories' },
    { type: TrainerStepType.FacilitatorManual, key: 'generation.steps.facilitatorManual' },
    { type: TrainerStepType.Slides, key: 'generation.steps.slides' },
    { type: TrainerStepType.ParticipantWorkbook, key: 'generation.steps.participantWorkbook' },
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
    const [regenerateAttempts, setRegenerateAttempts] = useState(0);
    const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const accumulatedContentRef = useRef<any[]>([]); // Store content to pass as context
    const pendingStepsRef = useRef<any[]>([]); // Steps ready to insert if user chooses to save despite warnings
    const isStoppedRef = useRef(false);

    const baseStepOrder = isEnabled('contractPipeline') ? CONTRACT_STEPS_ORDER : LEGACY_STEPS_ORDER;

    // Filter steps based on environment
    const relevantSteps = baseStepOrder.filter(step => {
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

        if (!isOpen) {
            hasStartedRef.current = false;
            setIsGenerating(false);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
            setCompletedSteps([]);
            setCurrentStepIndex(0);
            setError(null);
            setSuccessMessage(null);
            setValidationReport(null);
            accumulatedContentRef.current = [];
            pendingStepsRef.current = [];
        }

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [isOpen]);

    // --- Local Storage Cache Helpers ---
    const getCacheKey = () => `generation_progress_${course.id}`;

    const saveProgressToCache = (completed: TrainerStepType[], content: any[]) => {
        try {
            localStorage.setItem(getCacheKey(), JSON.stringify({
                completedSteps: completed,
                accumulatedContent: content,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.error('[GenerationProgressModal] Failed to save progress:', e);
        }
    };

    const loadProgressFromCache = () => {
        try {
            const raw = localStorage.getItem(getCacheKey());
            if (!raw) return null;
            const data = JSON.parse(raw);
            
            // Check timestamp validity (24h)
            const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
            if (Date.now() - data.timestamp > TWENTY_FOUR_HOURS) {
                console.log('[GenerationProgressModal] Cache expired.');
                clearProgress();
                return null;
            }

            return data;
        } catch (e) {
            return null;
        }
    };

    const clearProgress = () => {
        try {
            localStorage.removeItem(getCacheKey());
        } catch (e) { console.error(e); }
    };

    const stopGeneration = () => {
        console.log('[GenerationProgressModal] User requested stop.');
        isStoppedRef.current = true;
        setIsGenerating(false);
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    };

    // Wraps supabase.functions.invoke with a per-call timeout and global stop signal.
    // Throws a descriptive error on timeout so the retry loop can handle it gracefully.
    const invokeWithTimeout = async (body: object, timeoutMs = 240000): Promise<{ data: any; error: any }> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort('timeout'), timeoutMs);

        const globalSignal = abortControllerRef.current?.signal;
        const onGlobalAbort = () => controller.abort('stopped');
        if (globalSignal) {
            if (globalSignal.aborted) {
                controller.abort('stopped');
            } else {
                globalSignal.addEventListener('abort', onGlobalAbort, { once: true });
            }
        }

        try {
            const result = await supabase.functions.invoke('generate-course-content', {
                body,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return result;
        } catch (e: any) {
            clearTimeout(timeoutId);
            if (controller.signal.aborted) {
                const reason = controller.signal.reason;
                if (reason === 'timeout') throw new Error(`Timeout: generarea a durat prea mult (>${Math.round(timeoutMs / 1000)}s). Reîncercați.`);
                throw new Error('Generare oprită de utilizator.');
            }
            throw e;
        } finally {
            clearTimeout(timeoutId);
            globalSignal?.removeEventListener('abort', onGlobalAbort);
        }
    };

    const getMinimalCourse = (c: Course): Partial<Course> => {
        return {
            id: c.id,
            title: c.title,
            description: c.description,
            subject: c.subject,
            target_audience: c.target_audience,
            environment: c.environment,
            language: c.language,
            dna: c.dna,
            blueprint: c.blueprint,
            macro_plan: c.macro_plan,
            user_id: c.user_id
        };
    };

    const titleKeyToStepType = (titleKey: string): TrainerStepType | null => {
        const allSteps = [...LEGACY_STEPS_ORDER, ...CONTRACT_STEPS_ORDER];
        const match = allSteps.find(step => step.key === titleKey);
        return match ? match.type : null;
    };

    const loadProgressFromDb = async () => {
        try {
            let data: any = null;
            let error: any = null;

            const query = supabase
                .from('course_steps')
                .select('title_key, content, status')
                .eq('course_id', course.id)
                .eq('status', 'draft')
                .order('step_order', { ascending: true });

            const firstResult = await query;
            data = firstResult.data;
            error = firstResult.error;

            if (error && String(error.message).includes('status')) {
                console.warn('[GenerationProgressModal] loadProgressFromDb status column missing, retrying without status filter.');
                const fallbackResult = await supabase
                    .from('course_steps')
                    .select('title_key, content')
                    .eq('course_id', course.id)
                    .eq('is_completed', false)
                    .order('step_order', { ascending: true });
                data = fallbackResult.data;
                error = fallbackResult.error;
            }

            if (error) {
                console.warn('[GenerationProgressModal] loadProgressFromDb failed:', error);
                return null;
            }

            if (!data || data.length === 0) return null;

            const steps: Array<{ step_type: TrainerStepType; content: string }> = [];
            for (const row of data) {
                const type = titleKeyToStepType(String(row.title_key));
                if (!type) continue;
                steps.push({ step_type: type, content: String(row.content || '') });
            }

            if (steps.length === 0) return null;

            const orderedSteps = relevantSteps
                .map(step => steps.find(saved => saved.step_type === step.type))
                .filter(Boolean) as Array<{ step_type: TrainerStepType; content: string }>;

            return {
                completedSteps: orderedSteps.map(s => s.step_type),
                accumulatedContent: orderedSteps
            };
        } catch (e) {
            console.warn('[GenerationProgressModal] Error loading progress from DB:', e);
            return null;
        }
    };

    const clearDbDrafts = async () => {
        try {
            let result = await supabase
                .from('course_steps')
                .delete()
                .eq('course_id', course.id)
                .eq('status', 'draft');

            if (result.error && String(result.error.message).includes('status')) {
                console.warn('[GenerationProgressModal] clearDbDrafts status column missing, retrying with is_completed filter.');
                result = await supabase
                    .from('course_steps')
                    .delete()
                    .eq('course_id', course.id)
                    .eq('is_completed', false);
            }

            if (result.error) {
                console.warn('[GenerationProgressModal] Failed to clear DB drafts:', result.error);
            }
        } catch (e) {
            console.warn('[GenerationProgressModal] clearDbDrafts error:', e);
        }
    };

    // Persist a single generated step as a draft so we can resume from server-side later.
    const saveStepDraft = async (title_key: string, content: string, stepOrder?: number) => {
        try {
            const userId = course.user_id || user?.id;
            if (!userId) {
                console.warn('[GenerationProgressModal] saveStepDraft: missing user id, skipping save.');
                return;
            }

            const payload: any = {
                course_id: course.id,
                user_id: userId,
                title_key,
                content,
                is_completed: false,
                status: 'draft'
            };
            if (typeof stepOrder === 'number') payload.step_order = stepOrder;

            let existing: any = null;
            let selectError: any = null;

            const primarySelect = await supabase
                .from('course_steps')
                .select('id')
                .eq('course_id', course.id)
                .eq('title_key', title_key)
                .eq('status', 'draft')
                .maybeSingle();

            existing = primarySelect.data;
            selectError = primarySelect.error;

            if (selectError && String(selectError.message).includes('status')) {
                console.warn('[GenerationProgressModal] saveStepDraft status column missing, retrying select by is_completed=false.');
                const fallback = await supabase
                    .from('course_steps')
                    .select('id')
                    .eq('course_id', course.id)
                    .eq('title_key', title_key)
                    .eq('is_completed', false)
                    .maybeSingle();
                existing = fallback.data;
                selectError = fallback.error;
            }

            if (selectError && !String(selectError.message).includes('status')) {
                console.warn('[GenerationProgressModal] saveStepDraft select failed:', selectError);
            }

            const savePayload = async (payloadToSave: any) => {
                if (existing && existing.id) {
                    const { error: updateError } = await supabase
                        .from('course_steps')
                        .update(payloadToSave)
                        .eq('id', existing.id);
                    return updateError;
                }
                const { error: insertError } = await supabase
                    .from('course_steps')
                    .insert(payloadToSave);
                return insertError;
            };

            let errorResult = await savePayload(payload);

            if (errorResult && String(errorResult.message).includes('status')) {
                console.warn('[GenerationProgressModal] saveStepDraft failed due to missing status column, retrying without status field.');
                const cleanedPayload = { ...payload };
                delete cleanedPayload.status;
                errorResult = await savePayload(cleanedPayload);
            }

            if (errorResult) {
                console.warn('[GenerationProgressModal] saveStepDraft failed:', errorResult);
                const existingPending = pendingStepsRef.current.find((p: any) => p.title_key === title_key);
                if (existingPending) existingPending.content = content;
                else pendingStepsRef.current.push(payload);
                return;
            }

            pendingStepsRef.current = pendingStepsRef.current.filter((p: any) => p.title_key !== title_key);
            console.log('[GenerationProgressModal] Step draft saved:', title_key);
        } catch (e) {
            console.warn('[GenerationProgressModal] saveStepDraft error:', e);
            const payload = { course_id: course.id, title_key, content, is_completed: false, status: 'draft' } as any;
            const existing = pendingStepsRef.current.find((p: any) => p.title_key === title_key);
            if (existing) existing.content = content; else pendingStepsRef.current.push(payload);
        }
    };

    const startGeneration = async () => {
        setIsGenerating(true);
        isStoppedRef.current = false;
        abortControllerRef.current = new AbortController();

        console.log('[GenerationProgressModal] Starting generation...');
        setError(null);

        // Try to resume from DB first
        const dbCached = await loadProgressFromDb();
        if (dbCached && dbCached.completedSteps.length > 0) {
            console.log('[GenerationProgressModal] Resuming from DB cache:', dbCached.completedSteps.length, 'steps done.');
            accumulatedContentRef.current = dbCached.accumulatedContent;
            saveProgressToCache(dbCached.completedSteps, dbCached.accumulatedContent);

            let nextIndex = 0;
            for (let i = 0; i < relevantSteps.length; i++) {
                if (!dbCached.completedSteps.includes(relevantSteps[i].type)) {
                    nextIndex = i;
                    break;
                }
                if (i === relevantSteps.length - 1 && dbCached.completedSteps.includes(relevantSteps[i].type)) {
                    nextIndex = relevantSteps.length;
                }
            }

            let validCompletedSteps = dbCached.completedSteps;
            if (nextIndex < relevantSteps.length) {
                validCompletedSteps = dbCached.completedSteps.filter((stepType: any) => {
                     const idx = relevantSteps.findIndex(r => r.type === stepType);
                     return idx !== -1 && idx < nextIndex;
                });
                if (validCompletedSteps.length !== dbCached.completedSteps.length) {
                    console.log(`[GenerationProgressModal] Cleaning up ${dbCached.completedSteps.length - validCompletedSteps.length} stale future steps from DB cache.`);
                    saveProgressToCache(validCompletedSteps, dbCached.accumulatedContent);
                }
            }
            
            setCompletedSteps(validCompletedSteps);
            setCurrentStepIndex(nextIndex);
            await processStep(nextIndex);
            return;
        }

        // Fallback to localStorage cache
        const cached = loadProgressFromCache();
        if (cached && cached.completedSteps && cached.completedSteps.length > 0) {
            console.log('[GenerationProgressModal] Resuming from cache:', cached.completedSteps.length, 'steps done.');
            
            // Restore content first
            accumulatedContentRef.current = cached.accumulatedContent;

            let nextIndex = 0;
            for (let i = 0; i < relevantSteps.length; i++) {
                if (!cached.completedSteps.includes(relevantSteps[i].type)) {
                    nextIndex = i;
                    break;
                }
                if (i === relevantSteps.length - 1 && cached.completedSteps.includes(relevantSteps[i].type)) {
                    nextIndex = relevantSteps.length;
                }
            }

            let validCompletedSteps = cached.completedSteps;
            if (nextIndex < relevantSteps.length) {
                validCompletedSteps = cached.completedSteps.filter((stepType: any) => {
                     const idx = relevantSteps.findIndex(r => r.type === stepType);
                     return idx !== -1 && idx < nextIndex;
                });
                
                if (validCompletedSteps.length !== cached.completedSteps.length) {
                    console.log(`[GenerationProgressModal] Cleaning up ${cached.completedSteps.length - validCompletedSteps.length} stale future steps.`);
                    saveProgressToCache(validCompletedSteps, cached.accumulatedContent);
                }
            }
            
            setCompletedSteps(validCompletedSteps);
            setCurrentStepIndex(nextIndex);
            
            await processStep(nextIndex);
            return;
        }

        // Fresh start
        setCurrentStepIndex(0);
        setCompletedSteps([]);
        accumulatedContentRef.current = [];

        // Attempt to restore DNA from DB (User closed modal case)
        try {
             const { data: existingDNA } = await supabase
                 .from('course_steps')
                 .select('content')
                 .eq('course_id', course.id)
                 .eq('title_key', 'course.livrables.course_dna')
                 .maybeSingle();
             
             if (existingDNA && existingDNA.content) {
                 console.log('[GenerationProgressModal] Found existing Course DNA in DB. Resuming from Step 1.');
                 
                 accumulatedContentRef.current = [{
                     step_type: TrainerStepType.CourseDNA,
                     content: existingDNA.content
                 }];
                 
                 setCompletedSteps([TrainerStepType.CourseDNA]);
                 setCurrentStepIndex(1);
                 
                 // Immediately process Step 1
                 await processStep(1);
                 return;
             }
        } catch (e) {
             console.warn('[GenerationProgressModal] Failed to check existing DNA:', e);
        }

        try {
            // 0. Connection Check (Ping)
            console.log('[GenerationProgressModal] Pinging Edge Function...');
            const { data: pingData, error: pingError } = await supabase.functions.invoke('generate-course-content', {
                body: { action: 'ping' },
                // signal: abortControllerRef.current?.signal // Optional: support abort on ping
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

            // Limit check
            if (regenerateAttempts >= 3) {
                setError("Ați atins limita maximă de regenerări (3). Vă rugăm să salvați draft-ul.");
                return;
            }

            setIsGenerating(true);
            setRegenerateAttempts(prev => prev + 1);

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
                // Build Context (Identical to processStep)
                const contextMap: Record<TrainerStepType, TrainerStepType[]> = {
                    [TrainerStepType.CourseDNA]: [],
                    [TrainerStepType.PerformanceObjectives]: [TrainerStepType.CourseDNA],
                    [TrainerStepType.CourseObjectives]: [TrainerStepType.CourseDNA, TrainerStepType.PerformanceObjectives],
                    [TrainerStepType.Structure]: [TrainerStepType.CourseDNA, TrainerStepType.PerformanceObjectives, TrainerStepType.CourseObjectives],
                    [TrainerStepType.LearningMethods]: [TrainerStepType.CourseDNA, TrainerStepType.Structure],
                    [TrainerStepType.TimingAndFlow]: [TrainerStepType.CourseDNA, TrainerStepType.Structure, TrainerStepType.LearningMethods],
                    [TrainerStepType.AgendaTable]: [TrainerStepType.CourseDNA, TrainerStepType.Structure, TrainerStepType.TimingAndFlow],
                    [TrainerStepType.Exercises]: [TrainerStepType.CourseDNA, TrainerStepType.Structure],
                    [TrainerStepType.DiagnosticQuestionnaire]: [TrainerStepType.CourseDNA, TrainerStepType.Structure, TrainerStepType.CourseObjectives],
                    [TrainerStepType.ExamplesAndStories]: [TrainerStepType.CourseDNA, TrainerStepType.Structure],
                    [TrainerStepType.FacilitatorNotes]: [TrainerStepType.CourseDNA, TrainerStepType.Structure, TrainerStepType.Exercises],
            [TrainerStepType.FacilitatorManual]: [TrainerStepType.CourseDNA, TrainerStepType.Structure, TrainerStepType.TimingAndFlow, TrainerStepType.FacilitatorNotes, TrainerStepType.Exercises],
            [TrainerStepType.DiscussionGuide]: [TrainerStepType.CourseDNA, TrainerStepType.Structure, TrainerStepType.FacilitatorManual],
            [TrainerStepType.Slides]: [TrainerStepType.CourseDNA, TrainerStepType.Structure, TrainerStepType.ExamplesAndStories, TrainerStepType.FacilitatorManual],
            [TrainerStepType.ParticipantWorkbook]: [TrainerStepType.CourseDNA, TrainerStepType.Structure, TrainerStepType.Exercises],
                    [TrainerStepType.ActionPlan]: [TrainerStepType.CourseDNA, TrainerStepType.Structure, TrainerStepType.CourseObjectives],
                    [TrainerStepType.VideoScripts]: [TrainerStepType.CourseDNA, TrainerStepType.Structure],
                    [TrainerStepType.CheatSheets]: [TrainerStepType.CourseDNA, TrainerStepType.Structure, TrainerStepType.ParticipantWorkbook],
                    [TrainerStepType.Projects]: [TrainerStepType.CourseDNA, TrainerStepType.Structure, TrainerStepType.Exercises],
                    [TrainerStepType.Tests]: [TrainerStepType.CourseDNA, TrainerStepType.Structure, TrainerStepType.CourseObjectives]
                };

                const allowed = new Set(contextMap[s] || []);
                const prevForContext = accumulatedContentRef.current
                    .filter((item: any) => allowed.size === 0 || allowed.has(item.step_type))
                    .map((item: any) => ({ step_type: item.step_type, content: String(item.content || '').slice(0, 2000) }));
                
                const summary = buildContextSummary(accumulatedContentRef.current);

                const { data, error: fnError } = await supabase.functions.invoke('generate-course-content', {
                    body: { 
                        action: 'generate_step_content', 
                        course, 
                        step_type: s, 
                        previous_steps: prevForContext,
                        context_summary: summary,
                        contractPipeline: isEnabled('contractPipeline')
                    },
                });
                if (fnError) {
                    const ctx = (fnError as any)?.context;
                    let msg = (fnError as any)?.message || 'Edge Function error';
                    
                    // Try to extract detailed error from response body
                    if (ctx) {
                        // If supabase-js parsed it as JSON object
                        if (typeof ctx === 'object' && ctx !== null) {
                             if (ctx.error && typeof ctx.error === 'string') {
                                 msg = ctx.error;
                             } else if (ctx.body && typeof ctx.body === 'string') {
                                 try {
                                     const parsed = JSON.parse(ctx.body);
                                     if (parsed.error) msg = parsed.error;
                                 } catch { 
                                     msg = ctx.body; // Use raw body if not JSON
                                 }
                             }
                        } 
                        // If it's a string (raw body)
                        else if (typeof ctx === 'string') {
                             try {
                                 const parsed = JSON.parse(ctx);
                                 if (parsed.error) msg = parsed.error;
                             } catch {
                                 msg = ctx;
                             }
                        }
                    }
                    
                    throw new Error(msg);
                }
                const generatedContent = data.content;
                const arr = accumulatedContentRef.current;
                const idx = arr.findIndex((i: any) => i.step_type === s);
                if (idx >= 0) arr[idx].content = generatedContent; else arr.push({ step_type: s, content: generatedContent });
                
                // Update cache with regenerated content
                saveProgressToCache(completedSteps, accumulatedContentRef.current);
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
        if (isStoppedRef.current) return;

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

            // --- NEW: Client-Side Iteration for Slides (To avoid Timeouts) ---
            if (step.type === TrainerStepType.Slides) {
                 const summary = buildContextSummary(accumulatedContentRef.current || []);
                 let modulesToProcess = course.blueprint?.modules;
                 
                 // Fallback to structure titles if blueprint missing
                 if ((!modulesToProcess || modulesToProcess.length === 0) && summary.modules.length > 0) {
                      modulesToProcess = summary.modules.map((t: string, idx: number) => ({ 
                          id: `generated-mod-${idx}`, 
                          title: t, 
                          learning_objective: "See content.",
                          sections: [] 
                      }));
                 }

                 if (modulesToProcess && modulesToProcess.length > 0) {
                     console.log('[GenerationProgressModal] Using Client-Side Iteration for Slides');
                     const slidesCacheKey = `slides_partial_${course.id}`;
                     let parts: string[] = [];
                     
                     // Try to load partial slides progress
                     try {
                        const sCached = localStorage.getItem(slidesCacheKey);
                        if (sCached) {
                            parts = JSON.parse(sCached);
                            console.log(`[Slides] Resuming from partial cache with ${parts.length} parts.`);
                        }
                     } catch(e) { console.error(e); }

                     // Slides don't have Intro/Outro in this model, just modules.
                     const startIndex = parts.length;
                     
                     // Batch processing (Concurrency = 1 for Slides to prevent timeouts and improve feedback)
                    const BATCH_SIZE = 1;
                    for (let i = startIndex; i < modulesToProcess.length; i += BATCH_SIZE) {
                         if (isStoppedRef.current) break;
                         
                         const batch = modulesToProcess.slice(i, i + BATCH_SIZE);
                         console.log(`[Slides] Processing batch starting at index ${i}, size ${batch.length}`);

                         const results = await Promise.all(batch.map(async (m: any, batchIdx: number) => {
                             const realIdx = i + batchIdx;
                             let modContent = "";
                             let retries = 0;
                             while(retries < 3 && !modContent) {
                                 try {
                                     // Build previous context just like for normal steps
                                    // We need it for context chaining
                                    const contextMap: Partial<Record<TrainerStepType, TrainerStepType[]>> = {
                                        [TrainerStepType.Slides]: [TrainerStepType.CourseDNA, TrainerStepType.Structure, TrainerStepType.FacilitatorManual, TrainerStepType.FacilitatorNotes],
                                        // Fallback map for others not needed here
                                        [TrainerStepType.CourseDNA]: []
                                    };
                                    const allowed = new Set(contextMap[TrainerStepType.Slides] || []);
                                     const prevForContext = (accumulatedContentRef.current || [])
                                         .filter((s: any) => allowed.has(s.step_type))
                                         .map((s: any) => ({ step_type: s.step_type, content: String(s.content || '').slice(0, 2000) }));

                                     const { data: modData, error: modErr } = await invokeWithTimeout({
                                        action: 'generate_slides_part', 
                                        course: getMinimalCourse(course), 
                                        module_data: m, 
                                        module_index: realIdx,
                                        previous_steps: prevForContext
                                    });
                                     if (modErr) throw modErr;
                                     modContent = modData.content;
                                     if (!modContent) throw new Error("Received empty content from server");
                                } catch (e) {
                                     console.warn(`Error generating slides module ${realIdx}, retry ${retries}`, e);
                                     retries++;
                                     await new Promise(r => setTimeout(r, 1500));
                                 }
                             }
                             if (!modContent) {
                                 modContent = `## Module ${realIdx+1}: ${m.title}\n\n(Slides generation failed for this module.)`;
                             }
                             return { index: realIdx, content: modContent };
                         }));

                         // Push to parts in order
                         results.sort((a, b) => a.index - b.index).forEach(r => {
                             parts.push(r.content);
                         });
                         
                         // Progressive Save
                         try {
                             localStorage.setItem(slidesCacheKey, JSON.stringify(parts));
                         } catch (e) {
                             console.warn('[Slides] Failed to save partial progress to cache.');
                         }
                     }
                     
                     // Cleanup partial cache after success
                     if (!isStoppedRef.current) {
                        localStorage.removeItem(slidesCacheKey);
                     } else {
                        console.log('[Slides] Generation stopped.');
                        setIsGenerating(false);
                        return;
                     }

                     const finalContent = parts.join('\n\n---\n\n');
                     
                     accumulatedContentRef.current.push({
                        step_type: step.type,
                        content: finalContent
                     });

                     setCompletedSteps(prev => {
                        const newSet = new Set([...prev, step.type]);
                        const newArr = Array.from(newSet);
                        saveProgressToCache(newArr, accumulatedContentRef.current);
                        return newArr;
                     });

                     // Persist this workbook livrable as a draft so generation can be resumed server-side
                     try {
                         await saveStepDraft(step.key, finalContent, index + 1);
                     } catch (e) {
                         console.warn('[GenerationProgressModal] Non-fatal: failed to persist workbook draft', e);
                     }

                     // Persist this livrable as a draft so generation can be resumed server-side
                     try {
                         await saveStepDraft(step.key, finalContent, index + 1);
                     } catch (e) {
                         console.warn('[GenerationProgressModal] Non-fatal: failed to persist slides draft', e);
                     }

                     await processStep(index + 1);
                     return;
                 }
            }

            // --- NEW: Client-Side Iteration for Workbook ---
            if (step.type === TrainerStepType.ParticipantWorkbook) {
                 const summary = buildContextSummary(accumulatedContentRef.current || []);
                 let modulesToProcess = course.blueprint?.modules;
                 
                 // Fallback to structure titles if blueprint missing
                 if ((!modulesToProcess || modulesToProcess.length === 0) && summary.modules.length > 0) {
                      modulesToProcess = summary.modules.map((t: string, idx: number) => ({ 
                          id: `generated-mod-${idx}`, 
                          title: t, 
                          learning_objective: "See content.",
                          sections: [] 
                      }));
                 }

                 if (modulesToProcess && modulesToProcess.length > 0) {
                     console.log('[GenerationProgressModal] Using Client-Side Iteration for Workbook');
                     const wbCacheKey = `workbook_partial_${course.id}`;
                     let parts: string[] = [];
                     
                     // Try to load partial workbook progress
                     try {
                        const wbCached = localStorage.getItem(wbCacheKey);
                        if (wbCached) {
                            parts = JSON.parse(wbCached);
                            console.log(`[Workbook] Resuming from partial cache with ${parts.length} parts.`);
                        }
                     } catch(e) { console.error(e); }

                     // 1. Intro (only if parts is empty)
                     if (parts.length === 0) {
                        console.log('[Workbook] Generating Intro...');
                        let introContent = "";
                        let introRetries = 0;
                        while(introRetries < 3 && !introContent) {
                            try {
                                const { data: introData, error: introError } = await invokeWithTimeout({ action: 'generate_workbook_part', part_type: 'intro', course: getMinimalCourse(course) });
                                if (introError) throw introError;
                                introContent = introData?.content;
                                if (!introContent) throw new Error("Received empty intro content from server");
                            } catch (e) {
                                console.warn(`Error generating Intro, retry ${introRetries}`, e);
                                introRetries++;
                                await new Promise(r => setTimeout(r, 1000 * Math.pow(2, introRetries)));
                            }
                        }
                        if (!introContent) introContent = "# Introducere\n\n(Generarea introducerii a eșuat. Vă rugăm să editați manual.)";
                        parts.push(introContent);
                        try {
                            localStorage.setItem(wbCacheKey, JSON.stringify(parts));
                        } catch (e) {
                            console.warn('[Workbook] Failed to save partial progress to cache.');
                        }
                     }

                     // 2. Modules
                     // parts[0] is Intro. parts[1] is Module 0.
                     // So start index for modules is parts.length - 1
                     const startIndex = Math.max(0, parts.length - 1);
                     
                     // Batch processing (Concurrency = 1 for Workbook to ensure Golden Data is generated reliably)
                    const BATCH_SIZE = 1;
                    for (let i = startIndex; i < modulesToProcess.length; i += BATCH_SIZE) {
                         if (isStoppedRef.current) break;
                         
                         const batch = modulesToProcess.slice(i, i + BATCH_SIZE);
                         console.log(`[Workbook] Processing batch starting at index ${i}, size ${batch.length}`);

                         const results = await Promise.all(batch.map(async (m: any, batchIdx: number) => {
                             const realIdx = i + batchIdx;
                             let modContent = "";
                             let retries = 0;
                             while(retries < 3 && !modContent) {
                                 try {
                                     console.log(`[Workbook] Generating module ${realIdx + 1}/${modulesToProcess.length} (attempt ${retries + 1})...`);
                                     const { data: modData, error: modErr } = await invokeWithTimeout({
                                        action: 'generate_workbook_part',
                                        part_type: 'module',
                                        course: getMinimalCourse(course),
                                        module_data: m,
                                        module_index: realIdx,
                                        context_files: []
                                    });
                                     if (modErr) throw modErr;
                                     modContent = modData.content;
                                 } catch (e) {
                                     console.warn(`Error generating module ${realIdx}, retry ${retries}`, e);
                                     retries++;
                                     if (retries < 3) await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
                                 }
                             }
                             if (!modContent) {
                                 modContent = `## Module ${realIdx+1}: ${m.title}\n\n(Content generation failed for this module after retries.)`;
                             }
                             return { index: realIdx, content: modContent };
                         }));

                         // Push to parts in order
                         results.sort((a, b) => a.index - b.index).forEach(r => {
                             parts.push(r.content);
                         });
                         
                         // Progressive Save
                         try {
                             localStorage.setItem(wbCacheKey, JSON.stringify(parts));
                         } catch (e) {
                             console.warn('[Workbook] Failed to save partial progress to cache (likely quota exceeded). Continuing in memory.');
                         }
                     }

                     // 3. Outro
                     // We expect parts to have 1 (Intro) + N (Modules). Total N+1.
                     // If parts.length == modulesToProcess.length + 1, we need Outro.
                     if (parts.length === modulesToProcess.length + 1) {
                         console.log('[Workbook] Generating Outro...');
                         let outroContent = "";
                         let outroRetries = 0;
                         while(outroRetries < 3 && !outroContent) {
                             try {
                                const { data: outroData, error: outroError } = await invokeWithTimeout({ action: 'generate_workbook_part', part_type: 'outro', course: getMinimalCourse(course) });
                                if (outroError) throw outroError;
                                outroContent = outroData?.content;
                             } catch (e) {
                                 console.warn(`Error generating Outro, retry ${outroRetries}`, e);
                                 outroRetries++;
                                 if (outroRetries < 3) await new Promise(r => setTimeout(r, 1000 * Math.pow(2, outroRetries)));
                             }
                         }
                         if (!outroContent) outroContent = "# Concluzie\n\n(Generarea concluziei a eșuat. Vă rugăm să editați manual.)";
                         parts.push(outroContent);
                         try {
                             localStorage.setItem(wbCacheKey, JSON.stringify(parts));
                         } catch (e) {
                             console.warn('[Workbook] Failed to save partial progress to cache.');
                         }
                     }
                     
                     // Cleanup partial cache after success
                     if (!isStoppedRef.current) {
                        localStorage.removeItem(wbCacheKey);
                     } else {
                        console.log('[Workbook] Generation stopped. Keeping partial cache.');
                        setIsGenerating(false);
                        return;
                     }

                     const finalContent = parts.join('\n\n---\n\n');
                     
                     accumulatedContentRef.current.push({
                        step_type: step.type,
                        content: finalContent
                     });

                     setCompletedSteps(prev => {
                        const newSet = new Set([...prev, step.type]);
                        const newArr = Array.from(newSet);
                        saveProgressToCache(newArr, accumulatedContentRef.current);
                        return newArr;
                     });

                     await processStep(index + 1);
                     return;
                 }
            }

            // --- Helper: Client-Side Iteration for per-module steps (Exercises, Examples, Manual) ---
            const runPerModuleIteration = async (
                actionName: string,
                cacheKey: string,
                contextStepTypes: TrainerStepType[]
            ): Promise<boolean> => {
                const iterSummary = buildContextSummary(accumulatedContentRef.current || []);
                let modulesToProcess: any[] | undefined = course.blueprint?.modules;
                if ((!modulesToProcess || modulesToProcess.length === 0) && iterSummary.modules.length > 0) {
                    modulesToProcess = iterSummary.modules.map((t: string, idx: number) => ({
                        id: `generated-mod-${idx}`,
                        title: t,
                        learning_objective: 'See content.',
                        sections: []
                    }));
                }
                if (!modulesToProcess || modulesToProcess.length === 0) return false;

                console.log(`[GenerationProgressModal] Client-Side Iteration for ${actionName}`);
                let parts: string[] = [];
                try {
                    const cached = localStorage.getItem(cacheKey);
                    if (cached) parts = JSON.parse(cached);
                } catch (e) { console.error(e); }

                const iterAllowed = new Set(contextStepTypes);
                const iterPrevContext = (accumulatedContentRef.current || [])
                    .filter((s: any) => iterAllowed.has(s.step_type))
                    .map((s: any) => ({ step_type: s.step_type, content: String(s.content || '').slice(0, 2000) }));

                for (let i = parts.length; i < modulesToProcess.length; i++) {
                    if (isStoppedRef.current) break;
                    let modContent = '';
                    let retries = 0;
                    while (retries < 3 && !modContent) {
                        try {
                            const { data: modData, error: modErr } = await invokeWithTimeout({
                                action: actionName,
                                course: getMinimalCourse(course),
                                module_data: modulesToProcess[i],
                                module_index: i,
                                previous_steps: iterPrevContext
                            });
                            if (modErr) throw modErr;
                            modContent = modData?.content;
                            if (!modContent) throw new Error('Empty content from server');
                        } catch (e) {
                            console.warn(`[${actionName}] Module ${i} error, retry ${retries}`, e);
                            retries++;
                            await new Promise(r => setTimeout(r, 1500));
                        }
                    }
                    if (!modContent) modContent = `## Module ${i + 1}: ${modulesToProcess[i].title}\n\n(Generation failed for this module.)`;
                    parts.push(modContent);
                    try { localStorage.setItem(cacheKey, JSON.stringify(parts)); } catch (_e) { /* ignore */ }
                }

                if (isStoppedRef.current) {
                    setIsGenerating(false);
                    return true;
                }
                localStorage.removeItem(cacheKey);

                const finalContent = parts.join('\n\n---\n\n');
                accumulatedContentRef.current.push({ step_type: step.type, content: finalContent });
                setCompletedSteps(prev => {
                    const newSet = new Set([...prev, step.type]);
                    const newArr = Array.from(newSet);
                    saveProgressToCache(newArr, accumulatedContentRef.current);
                    return newArr;
                });
                try {
                    await saveStepDraft(step.key, finalContent, index + 1);
                } catch (e) {
                    console.warn(`[GenerationProgressModal] Non-fatal: failed to persist ${actionName} draft`, e);
                }
                return false;
            };

            if (step.type === TrainerStepType.Exercises) {
                const stopped = await runPerModuleIteration(
                    'generate_exercises_part',
                    `exercises_partial_${course.id}`,
                    [TrainerStepType.CourseDNA, TrainerStepType.Structure]
                );
                if (!stopped) await processStep(index + 1);
                return;
            }

            if (step.type === TrainerStepType.ExamplesAndStories) {
                const stopped = await runPerModuleIteration(
                    'generate_examples_part',
                    `examples_partial_${course.id}`,
                    [TrainerStepType.CourseDNA, TrainerStepType.Structure]
                );
                if (!stopped) await processStep(index + 1);
                return;
            }

            if (step.type === TrainerStepType.FacilitatorManual) {
                const stopped = await runPerModuleIteration(
                    'generate_manual_part',
                    `manual_partial_${course.id}`,
                    [TrainerStepType.CourseDNA, TrainerStepType.Structure, TrainerStepType.TimingAndFlow, TrainerStepType.Exercises]
                );
                if (!stopped) await processStep(index + 1);
                return;
            }

            const contextMap: Record<TrainerStepType, TrainerStepType[]> = {
                [TrainerStepType.CourseDNA]: [],
                [TrainerStepType.PerformanceObjectives]: [TrainerStepType.CourseDNA],
                [TrainerStepType.CourseObjectives]: [TrainerStepType.CourseDNA, TrainerStepType.PerformanceObjectives],
                [TrainerStepType.Structure]: [TrainerStepType.CourseDNA, TrainerStepType.PerformanceObjectives, TrainerStepType.CourseObjectives],
                [TrainerStepType.LearningMethods]: [TrainerStepType.CourseDNA, TrainerStepType.Structure],
                [TrainerStepType.TimingAndFlow]: [TrainerStepType.CourseDNA, TrainerStepType.Structure, TrainerStepType.LearningMethods],
                [TrainerStepType.AgendaTable]: [TrainerStepType.CourseDNA, TrainerStepType.Structure, TrainerStepType.TimingAndFlow],
                [TrainerStepType.Exercises]: [TrainerStepType.CourseDNA, TrainerStepType.Structure],
                [TrainerStepType.DiagnosticQuestionnaire]: [TrainerStepType.CourseDNA, TrainerStepType.Structure, TrainerStepType.CourseObjectives],
                [TrainerStepType.ExamplesAndStories]: [TrainerStepType.CourseDNA, TrainerStepType.Structure],
                [TrainerStepType.FacilitatorNotes]: [TrainerStepType.CourseDNA, TrainerStepType.Structure, TrainerStepType.Exercises],
                [TrainerStepType.Slides]: [TrainerStepType.CourseDNA, TrainerStepType.Structure, TrainerStepType.ExamplesAndStories, TrainerStepType.FacilitatorManual],
                [TrainerStepType.FacilitatorManual]: [TrainerStepType.CourseDNA, TrainerStepType.Structure, TrainerStepType.TimingAndFlow, TrainerStepType.FacilitatorNotes, TrainerStepType.Exercises],
                [TrainerStepType.DiscussionGuide]: [TrainerStepType.CourseDNA, TrainerStepType.Structure, TrainerStepType.FacilitatorManual],
                [TrainerStepType.ParticipantWorkbook]: [TrainerStepType.CourseDNA, TrainerStepType.Structure, TrainerStepType.Exercises, TrainerStepType.ExamplesAndStories],
                [TrainerStepType.ActionPlan]: [TrainerStepType.CourseDNA, TrainerStepType.Structure, TrainerStepType.CourseObjectives],
                [TrainerStepType.VideoScripts]: [TrainerStepType.CourseDNA, TrainerStepType.Structure, TrainerStepType.ExamplesAndStories, TrainerStepType.ParticipantWorkbook],
                [TrainerStepType.CheatSheets]: [TrainerStepType.CourseDNA, TrainerStepType.Structure, TrainerStepType.ParticipantWorkbook],
                [TrainerStepType.Projects]: [TrainerStepType.CourseDNA, TrainerStepType.Structure, TrainerStepType.Exercises],
                [TrainerStepType.Tests]: [TrainerStepType.CourseDNA, TrainerStepType.Structure, TrainerStepType.CourseObjectives]
            };
            const allowed = new Set(contextMap[step.type] || []);
            const prevForContext = (accumulatedContentRef.current || [])
                .filter((s: any) => allowed.size === 0 || allowed.has(s.step_type))
                .map((s: any) => ({ step_type: s.step_type, content: String(s.content || '').slice(0, 2000) }));
            const summary = buildContextSummary(accumulatedContentRef.current || []);
            let attempt = 0;
            let data: any = null;
            let fnError: any = null;
            while (attempt < 2) {
                const requestBody = {
                    action: 'generate_step_content',
                    course: course,
                    step_type: step.type,
                    previous_steps: prevForContext,
                    context_summary: summary,
                    contractPipeline: isEnabled('contractPipeline')
                };
                
                // Diagnostic log
                try {
                    console.log(`[GenerationProgressModal] Sending request for ${step.type}. Payload size: ~${JSON.stringify(requestBody).length} chars`);
                } catch (e) { console.warn('Could not calc payload size', e); }

                const resp = await invokeWithTimeout(requestBody);
                data = resp.data;
                fnError = resp.error;
                if (!fnError && !data?.error) break;
                attempt++;
                await new Promise(r => setTimeout(r, 800));
            }

            if (fnError) {
                console.error('[GenerationProgressModal] Edge Function Error Object:', fnError);
                const ctx = (fnError as any)?.context;
                let msg = (fnError as any)?.message || 'Edge Function error';

                // Try to extract detailed error from response body
                if (ctx) {
                    // If supabase-js parsed it as JSON object
                    if (typeof ctx === 'object' && ctx !== null) {
                            if (ctx.error && typeof ctx.error === 'string') {
                                msg = ctx.error;
                            } else if (ctx.body && typeof ctx.body === 'string') {
                                try {
                                    const parsed = JSON.parse(ctx.body);
                                    if (parsed.error) msg = parsed.error;
                                } catch { 
                                    msg = ctx.body; // Use raw body if not JSON
                                }
                            }
                    } 
                    // If it's a string (raw body)
                    else if (typeof ctx === 'string') {
                            try {
                                const parsed = JSON.parse(ctx);
                                if (parsed.error) msg = parsed.error;
                            } catch {
                                msg = ctx;
                            }
                    }
                }
                
                console.error('[GenerationProgressModal] Extracted Error Message:', msg);
                throw new Error(msg);
            }
            if (data.error) throw new Error(data.error);

            const generatedContent = data.content;

            // 2. Store in Memory (Don't save to DB yet)
            const existingIdx = accumulatedContentRef.current.findIndex((i: any) => i.step_type === step.type);
            if (existingIdx >= 0) {
                accumulatedContentRef.current[existingIdx] = { step_type: step.type, content: generatedContent };
            } else {
                accumulatedContentRef.current.push({
                    step_type: step.type,
                    content: generatedContent
                });
            }

            setCompletedSteps(prev => {
                const newSet = new Set([...prev, step.type]);
                const newArr = Array.from(newSet);
                // Save to cache on every step completion
                saveProgressToCache(newArr, accumulatedContentRef.current);
                return newArr;
            });

            // Persist this individual step as draft to allow server-side resume
            try {
                const contentToSave = generatedContent;
                await saveStepDraft(step.key, contentToSave, index + 1);
            } catch (e) {
                console.warn('[GenerationProgressModal] Non-fatal: failed to persist step draft', e);
            }

            // 3. Next Step (Recursive)
            if (!isStoppedRef.current) {
                // NEW: Pause after CourseDNA (Step 0) to allow user review
                if (step.type === TrainerStepType.CourseDNA) {
                     console.log('[GenerationProgressModal] Pausing after CourseDNA for user review.');
                     
                     // SAVE DNA TO DB (courses table)
                     try {
                         let dnaContent = generatedContent;
                         let parsedDNA = null;

                         if (typeof dnaContent === 'string') {
                             // 1. Try to find code blocks
                             const jsonMatch = dnaContent.match(/```json\s*([\s\S]*?)\s*```/) || dnaContent.match(/```\s*([\s\S]*?)\s*```/);
                             if (jsonMatch) {
                                 dnaContent = jsonMatch[1];
                             } else {
                                 // 2. Try to find raw JSON object structure (start with { and end with })
                                 const firstBrace = dnaContent.indexOf('{');
                                 const lastBrace = dnaContent.lastIndexOf('}');
                                 if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                                     dnaContent = dnaContent.substring(firstBrace, lastBrace + 1);
                                 } else {
                                     // No braces found? It's not JSON.
                                      // Log warning but CREATE FALLBACK so user can edit raw text
                                      console.warn("No JSON object found in Course DNA response. Creating fallback.");
                                      dnaContent = null; 
                                  }
                              }
                              
                              // 3. Try to parse (only if we have content)
                              if (dnaContent) {
                                 try {
                                     parsedDNA = JSON.parse(dnaContent);
                                 } catch (e) {
                                     console.warn("JSON parse failed. Creating fallback.");
                                     parsedDNA = null;
                                 }
                              }
                          } else {
                              // Already an object?
                              parsedDNA = dnaContent;
                          }
                          
                          // 4. Fallback if parsing failed or no JSON found
                          if (!parsedDNA) {
                              parsedDNA = {
                                  _status: "parse_error",
                                  _raw_content: typeof generatedContent === 'string' ? generatedContent : JSON.stringify(generatedContent),
                                  terminology: {
                                      participant: "Participant",
                                      trainer: "Trainer",
                                      exercise: "Exercise",
                                      mandatoryTerms: {},
                                      forbiddenPhrases: []
                                  },
                                  toneFreeText: ""
                              };
                          }
                          
                          // Always save something (valid or fallback)
                          if (parsedDNA) {
                             const { error: updateError } = await supabase
                                 .from('courses')
                                 .update({ dna: parsedDNA })
                                 .eq('id', course.id);
                                 
                             if (updateError) throw updateError;
                             
                             const { error: dirtyError } = await supabase
                                 .from('course_modules')
                                 .update({ is_dirty: true })
                                 .eq('course_id', course.id);
                             if (dirtyError) {
                                 console.warn('[GenerationProgressModal] Failed to mark modules as dirty after DNA generation:', dirtyError);
                             }

                             console.log('[GenerationProgressModal] DNA saved to courses table.');
                          }
                     } catch (e) {
                         console.error('[GenerationProgressModal] Failed to save DNA to DB (Non-fatal):', e);
                         // Do NOT rethrow, so the UI keeps working.
                     }

                     setIsGenerating(false);
                     setSuccessMessage("ADN-ul Cursului a fost generat cu succes. Puteți închide fereastra pentru a revizui/edita ADN-ul, apoi reluați generarea.");
                     return;
                }

                await processStep(index + 1);
            }

        } catch (err: any) {
            if (isStoppedRef.current || err.name === 'AbortError') {
                console.log('Generation paused by user.');
                setIsGenerating(false);
                return;
            }
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

            const LIVRABLE_MAPPING = [
                // NOTE: Course DNA (Step 0) is internal and stored in course.dna column. 
                // We do not create a standalone user-facing step for it here to avoid confusion.
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
                        TrainerStepType.CheatSheets,
                        TrainerStepType.ActionPlan  // Post-course action plan appended to workbook
                    ]
                },
                {
                    key: 'course.livrables.trainer_manual',
                    label: 'Trainer Manual',
                    sources: [
                        TrainerStepType.LearningMethods,
                        TrainerStepType.FacilitatorNotes,
                        TrainerStepType.FacilitatorManual,
                        TrainerStepType.DiscussionGuide,  // Hook + Takeaway per module
                        TrainerStepType.AgendaTable       // Chronometric agenda with materials
                    ]
                },
                {
                    key: 'course.livrables.exercises',
                    label: 'Exercises & Activities',
                    sources: [
                        TrainerStepType.DiagnosticQuestionnaire, // Pre-course self-assessment
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
                        is_completed: true,
                        status: 'generat'
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
                    const expected = (v.expected || []).join(', ');
                    const actual = (v.actual || []).join(', ');
                    items.push({ ok: false, message: `${t('validation.durationMismatch')} (Structură: ${expected} • Workbook: ${actual})`, type: 'durationMismatch', key: 'course.livrables.participant_workbook' });
                } else {
                    items.push({ ok: true, message: t('validation.durationMatch') });
                }
            }

            setValidationReport({ ok: overallOk, items });

            if (!overallOk) {
                const onlyDurationIssue = items.every(it => it.type === 'durationMismatch' || it.ok === true);
                pendingStepsRef.current = stepsToInsert;
                if (onlyDurationIssue) {
                    await handleAutoFixWorkbook();
                    // If auto-fix worked, validationReport might be updated? 
                    // But we proceed anyway in this relaxed mode.
                } 
                
                // FORCE SAVE: We proceed even if validation failed, as per user request to "pass over".
                console.warn('[GenerationProgressModal] Validation failed, but proceeding to save (Relaxed Mode).');
                // setIsGenerating(false);
                // return; 
            }

            // 5. Preserving Step IDs: Fetch existing steps and upsert/insert granularly
            console.log('[GenerationProgressModal] Syncing steps for course:', course.id);
            const { data: existingSteps, error: fetchStepsError } = await supabase
                .from('course_steps')
                .select('id, title_key')
                .eq('course_id', course.id);

            if (fetchStepsError) {
                console.error('[GenerationProgressModal] Failed to fetch existing steps:', fetchStepsError);
            }

            const toUpdate: any[] = [];
            const toInsert: any[] = [];

            for (const step of stepsToInsert) {
                const existing = existingSteps?.find((es: any) => es.title_key === step.title_key);
                if (existing) {
                    toUpdate.push({
                        id: existing.id,
                        ...step
                    });
                } else {
                    toInsert.push(step);
                }
            }

            // Helper to attempt write and retry without `status` column if schema missing
            async function attemptWrite() {
                // Try upsert first
                if (toUpdate.length > 0) {
                    const { error: updateError } = await supabase
                        .from('course_steps')
                        .upsert(toUpdate);
                    if (updateError) {
                        const msg = String(updateError?.message || updateError);
                        // If error mentions missing 'status' column, retry without it
                        if (msg.includes("status") || msg.includes("Could not find the 'status' column")) {
                            console.warn('[GenerationProgressModal] Upsert failed due to missing status column. Retrying without status field.');
                            const cleaned = toUpdate.map(s => {
                                const c = { ...s } as any;
                                delete c.status;
                                return c;
                            });
                            const { error: retryErr } = await supabase
                                .from('course_steps')
                                .upsert(cleaned);
                            if (retryErr) throw retryErr;
                        } else {
                            throw updateError;
                        }
                    } else {
                        console.log(`[GenerationProgressModal] Updated ${toUpdate.length} steps.`);
                    }
                }

                // Then insert new ones
                if (toInsert.length > 0) {
                    const { error: insertError } = await supabase
                        .from('course_steps')
                        .insert(toInsert);
                    if (insertError) {
                        const msg = String(insertError?.message || insertError);
                        if (msg.includes("status") || msg.includes("Could not find the 'status' column")) {
                            console.warn('[GenerationProgressModal] Insert failed due to missing status column. Retrying without status field.');
                            const cleaned = toInsert.map(s => {
                                const c = { ...s } as any;
                                delete c.status;
                                return c;
                            });
                            const { error: retryInsertErr } = await supabase
                                .from('course_steps')
                                .insert(cleaned);
                            if (retryInsertErr) throw retryInsertErr;
                        } else {
                            throw insertError;
                        }
                    } else {
                        console.log(`[GenerationProgressModal] Inserted ${toInsert.length} new steps.`);
                    }
                }
            }

            await attemptWrite();

            console.log('[GenerationProgressModal] Sync successful');

            // Clear DB draft rows once final persistence has succeeded
            await clearDbDrafts();
            clearProgress();

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
            const rawSteps = pendingStepsRef.current || [];
            if (rawSteps.length === 0) {
                setValidationReport(null);
                return;
            }
            const steps = rawSteps.map(s => ({
                ...s,
                status: 'draft',
                is_completed: false
            }));
            setIsGenerating(true);

            // Preserving Step IDs: Fetch existing steps and upsert/insert draft steps
            const { data: existingSteps, error: fetchStepsError } = await supabase
                .from('course_steps')
                .select('id, title_key')
                .eq('course_id', course.id);

            if (fetchStepsError) {
                console.error('[GenerationProgressModal] Failed to fetch existing steps:', fetchStepsError);
            }

            const toUpdate: any[] = [];
            const toInsert: any[] = [];

            for (const step of steps) {
                const existing = existingSteps?.find((es: any) => es.title_key === step.title_key);
                if (existing) {
                    toUpdate.push({
                        id: existing.id,
                        ...step
                    });
                } else {
                    toInsert.push(step);
                }
            }

            async function attemptDraftWrite() {
                if (toUpdate.length > 0) {
                    const { error: updateError } = await supabase
                        .from('course_steps')
                        .upsert(toUpdate);
                    if (updateError) {
                        const msg = String(updateError?.message || updateError);
                        if (msg.includes("status") || msg.includes("Could not find the 'status' column")) {
                            console.warn('[GenerationProgressModal] Draft upsert failed due to missing status column. Retrying without status field.');
                            const cleaned = toUpdate.map(s => {
                                const c = { ...s } as any;
                                delete c.status;
                                return c;
                            });
                            const { error: retryErr } = await supabase
                                .from('course_steps')
                                .upsert(cleaned);
                            if (retryErr) throw retryErr;
                        } else {
                            throw updateError;
                        }
                    }
                }

                if (toInsert.length > 0) {
                    const { error: insertError } = await supabase
                        .from('course_steps')
                        .insert(toInsert);
                    if (insertError) {
                        const msg = String(insertError?.message || insertError);
                        if (msg.includes("status") || msg.includes("Could not find the 'status' column")) {
                            console.warn('[GenerationProgressModal] Draft insert failed due to missing status column. Retrying without status field.');
                            const cleaned = toInsert.map(s => {
                                const c = { ...s } as any;
                                delete c.status;
                                return c;
                            });
                            const { error: retryInsertErr } = await supabase
                                .from('course_steps')
                                .insert(cleaned);
                            if (retryInsertErr) throw retryInsertErr;
                        } else {
                            throw insertError;
                        }
                    }
                }
            }

            await attemptDraftWrite();

            setValidationReport(null);
            setIsGenerating(false);
            
            setSuccessMessage("Draft salvat cu succes! Puteți continua editarea în fluxul dedicat.");
            setTimeout(() => {
                onComplete();
            }, 2000);
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
                                <div className="mt-3">
                                    {showRegenerateConfirm ? (
                                        <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 mb-3">
                                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                                                Regenerarea poate consuma tokeni suplimentari. Recomandăm salvarea draft-ului curent.
                                                <br/>
                                                <span className="text-xs opacity-80">(Regeneration may consume additional tokens. We recommend saving the current draft.)</span>
                                            </p>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => setShowRegenerateConfirm(false)}
                                                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-sm font-medium hover:bg-slate-300"
                                                >
                                                    Anulează
                                                </button>
                                                <button 
                                                    onClick={() => { setShowRegenerateConfirm(false); handleRegenerateAffected(); }}
                                                    className="px-3 py-1.5 bg-yellow-600 text-white rounded text-sm font-medium hover:bg-yellow-700"
                                                >
                                                    Confirmă regenerarea
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-2 md:justify-start">
                                            <button 
                                                onClick={handleSaveDraft} 
                                                className="btn-premium-sm w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-md transform hover:scale-105 transition-all"
                                            >
                                                {safeT('validation.actions.saveDraft', 'Salvează ca draft')}
                                            </button>
                                            
                                            <button 
                                                onClick={() => {
                                                    setValidationReport(null);
                                                    setSuccessMessage("Vă recomandăm să salvați draft-ul pentru editare ulterioară");
                                                }} 
                                                className="btn-premium--secondary-sm w-full sm:w-auto"
                                            >
                                                {safeT('validation.actions.dismiss', 'Ascunde raportul')}
                                            </button>
                                            
                                            <button 
                                                onClick={() => setShowRegenerateConfirm(true)} 
                                                className={`btn-premium-sm w-full sm:w-auto ${regenerateAttempts >= 3 ? 'bg-slate-400 cursor-not-allowed opacity-70' : 'opacity-90 hover:opacity-100'}`}
                                                disabled={regenerateAttempts >= 3}
                                                title={regenerateAttempts >= 3 ? safeT('validation.limitReached', "Limita de regenerare atinsă") : ""}
                                            >
                                                {regenerateAttempts >= 3 
                                                    ? safeT('validation.limitReachedButton', "Limita atinsă (3/3)") 
                                                    : safeT('validation.actions.regenerateAffected', 'Regenerează livrabilele afectate')
                                                }
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    {successMessage && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">{successMessage}</p>
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
                                            {step.type === TrainerStepType.CourseDNA ? 
                            <span className="font-bold text-green-700 dark:text-green-400">ADN-ul Cursului --&gt; Apasa acum "Inchide"</span> 
                            : `${index}. ${t(step.key)}`}
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
                <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl space-y-4">
                    <div className="flex justify-between items-center">
                         <div className="text-sm text-slate-500 flex items-center gap-2">
                             <span>{t('generation.completed', { done: completedSteps.length, total: relevantSteps.length })}</span>
                             {isGenerating && (
                                 <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-xs">
                                     <Loader2 className="w-3 h-3 animate-spin" />
                                     {t('generation.processing')}
                                 </span>
                             )}
                         </div>
                         <div className="flex gap-2">
                            {isGenerating ? (
                                <button 
                                    onClick={stopGeneration} 
                                    className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 font-medium transition-colors flex items-center gap-2"
                                >
                                    <Pause className="w-4 h-4" />
                                    {safeT('generation.actions.stop', 'Stop')}
                                </button>
                            ) : (
                                <>
                                    {(completedSteps.length < relevantSteps.length) && (
                                        <button 
                                            onClick={startGeneration} 
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2"
                                        >
                                            <Play className="w-4 h-4" />
                                            {completedSteps.length > 0 ? safeT('generation.actions.resume', 'Reluare') : safeT('generation.actions.start', 'Start')}
                                        </button>
                                    )}
                                    <button onClick={onClose} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors">
                                        {safeT('common.close', 'Închide')}
                                    </button>
                                </>
                            )}
                         </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
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
