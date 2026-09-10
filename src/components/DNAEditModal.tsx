import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Wand2 } from 'lucide-react';
import { useTranslation } from '../contexts/I18nContext';
import { CourseDNA, Course, TrainerStepType, GenerationEnvironment } from '../types';
import { supabase } from '../services/supabaseClient';
import { isEnabled } from '../config/featureFlags';

interface DNAEditModalProps {
    isOpen: boolean;
    dna: CourseDNA;
    course?: Course;
    onClose: () => void;
    onSave: (dna: CourseDNA) => Promise<void>;
}

const DNAEditModal: React.FC<DNAEditModalProps> = ({ isOpen, dna, course, onClose, onSave }) => {
    const { t } = useTranslation();

    // Form State (Source of Truth)
    const [formData, setFormData] = useState<Partial<CourseDNA>>({});

    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (dna) {
            // Initialize form with existing DNA
            // We ensure deep copies of arrays/objects to avoid reference issues
            setFormData(JSON.parse(JSON.stringify(dna)));
        }
    }, [dna]);

    const handleAutoGenerate = async () => {
        if (!course) return;

        try {
            setIsGenerating(true);
            setError(null);

            const { data, error } = await supabase.functions.invoke('generate-course-content', {
                body: {
                    action: 'generate_step_content',
                    step_type: TrainerStepType.CourseDNA,
                    course
                }
            });

            if (error) throw error;

            let content = data?.content || '';
            // Clean markdown code blocks if present
            content = content.replace(/```json/g, '').replace(/```/g, '').trim();

            const generatedDNA = JSON.parse(content);
            setFormData(generatedDNA);

        } catch (err: any) {
            console.error("Auto-generation failed:", err);
            setError("Failed to generate DNA: " + (err.message || "Unknown error"));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        try {
            setError(null);

            let dataToSave = formData;

            // Auto-generate if empty and course is available
            if (!dataToSave.terminology && course) {
                setIsSaving(true); // Show saving/processing state
                try {
                    const { data, error } = await supabase.functions.invoke('generate-course-content', {
                        body: {
                            action: 'generate_step_content',
                            step_type: TrainerStepType.CourseDNA,
                            course,
                            contractPipeline: isEnabled('contractPipeline')
                        }
                    });

                    if (error) throw error;

                    let content = data?.content || '';
                    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
                    dataToSave = JSON.parse(content);
                    setFormData(dataToSave);
                } catch (genErr: any) {
                    setIsSaving(false);
                    setError("Auto-generation failed during save: " + genErr.message);
                    return;
                }
            }

            // Basic validation
            if (!dataToSave.terminology) {
                throw new Error(t('dna.edit.error.structure') || "Invalid DNA structure.");
            }

            setIsSaving(true);
            // We cast to CourseDNA because we assume the structure is valid based on the form inputs
            await onSave(dataToSave as CourseDNA);
            setIsSaving(false);
            onClose();
        } catch (e: any) {
            setError(e.message || "Error saving DNA.");
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    const environmentLabelKey = course?.environment === GenerationEnvironment.OnlineCourse
        ? 'dna.edit.environment.online'
        : 'dna.edit.environment.live';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🧬</span>
                        <span className="font-medium text-lg text-gray-900 dark:text-gray-100">{t('dna.edit.title')}</span>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900/30">
                    <div className="p-6 space-y-8">
                        {/* Terminology Section */}
                        <section>
                            <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-4 border-b pb-2">
                                {t('dna.edit.section.terminology')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {t('dna.edit.field.participant')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.terminology?.participant || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            terminology: { ...formData.terminology!, participant: e.target.value }
                                        })}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {t('dna.edit.field.trainer')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.terminology?.trainer || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            terminology: { ...formData.terminology!, trainer: e.target.value }
                                        })}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {t('dna.edit.field.exercise')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.terminology?.exercise || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            terminology: { ...formData.terminology!, exercise: e.target.value }
                                        })}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm p-2"
                                    />
                                </div>
                            </div>

                            {/* Mandatory Terms */}
                            <div className="mt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="block">
                                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                            {t('dna.edit.section.mandatory')}
                                        </label>
                                        <p className="text-[10px] font-normal text-gray-500 mt-0.5">{t('dna.edit.mandatory.help')}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const currentTerms = formData.terminology?.mandatoryTerms || {};
                                            const newKey = `term_${Date.now()}`;
                                            setFormData({
                                                ...formData,
                                                terminology: {
                                                    ...formData.terminology!,
                                                    mandatoryTerms: {
                                                        ...currentTerms,
                                                        [newKey]: { term: '', definition: '' }
                                                    }
                                                }
                                            });
                                        }}
                                        className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium"
                                    >
                                        <Plus size={14} />
                                        {t('dna.edit.term.add')}
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {Object.entries(formData.terminology?.mandatoryTerms || {}).map(([key, item]) => (
                                        <div key={key} className="flex gap-2 items-start bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 group">
                                            <input
                                                type="text"
                                                value={item.term}
                                                onChange={(e) => {
                                                    const newTerms = { ...(formData.terminology?.mandatoryTerms || {}) };
                                                    newTerms[key] = { ...item, term: e.target.value };
                                                    setFormData({
                                                        ...formData,
                                                        terminology: { ...formData.terminology!, mandatoryTerms: newTerms }
                                                    });
                                                }}
                                                placeholder={t('dna.edit.mandatory.term')}
                                                className="flex-1 rounded border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm p-1.5"
                                            />
                                            <input
                                                type="text"
                                                value={item.definition}
                                                onChange={(e) => {
                                                    const newTerms = { ...(formData.terminology?.mandatoryTerms || {}) };
                                                    newTerms[key] = { ...item, definition: e.target.value };
                                                    setFormData({
                                                        ...formData,
                                                        terminology: { ...formData.terminology!, mandatoryTerms: newTerms }
                                                    });
                                                }}
                                                placeholder={t('dna.edit.mandatory.definition')}
                                                className="flex-[2] rounded border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm p-1.5"
                                            />
                                            <button
                                                onClick={() => {
                                                    const newTerms = { ...(formData.terminology?.mandatoryTerms || {}) };
                                                    delete newTerms[key];
                                                    setFormData({
                                                        ...formData,
                                                        terminology: { ...formData.terminology!, mandatoryTerms: newTerms }
                                                    });
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Forbidden Phrases */}
                            <div className="mt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="block">
                                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                            {t('dna.edit.section.forbidden')}
                                        </label>
                                        <p className="text-[10px] font-normal text-gray-500 mt-0.5">{t('dna.edit.forbidden.help')}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const current = formData.terminology?.forbiddenPhrases || [];
                                            setFormData({
                                                ...formData,
                                                terminology: { ...formData.terminology!, forbiddenPhrases: [...current, ''] }
                                            });
                                        }}
                                        className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium"
                                    >
                                        <Plus size={14} />
                                        {t('dna.edit.phrase.add')}
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {(formData.terminology?.forbiddenPhrases || []).map((phrase, idx) => (
                                        <div key={idx} className="flex gap-2 items-center group">
                                            <input
                                                type="text"
                                                value={phrase}
                                                onChange={(e) => {
                                                    const newPhrases = [...(formData.terminology?.forbiddenPhrases || [])];
                                                    newPhrases[idx] = e.target.value;
                                                    setFormData({
                                                        ...formData,
                                                        terminology: { ...formData.terminology!, forbiddenPhrases: newPhrases }
                                                    });
                                                }}
                                                className="w-full rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm p-1.5"
                                            />
                                            <button
                                                onClick={() => {
                                                    const newPhrases = [...(formData.terminology?.forbiddenPhrases || [])];
                                                    newPhrases.splice(idx, 1);
                                                    setFormData({
                                                        ...formData,
                                                        terminology: { ...formData.terminology!, forbiddenPhrases: newPhrases }
                                                    });
                                                }}
                                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Voice Section — verbatim, free-form (replaces the old formality/humor enums) */}
                        <section>
                            <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-4 border-b pb-2">
                                {t('dna.edit.section.voice')}
                            </h3>
                            <p className="text-xs text-gray-500 mb-2">{t('dna.edit.voice.help')}</p>
                            <textarea
                                value={formData.toneFreeText || ''}
                                onChange={(e) => setFormData({ ...formData, toneFreeText: e.target.value })}
                                rows={5}
                                placeholder={t('dna.edit.voice.placeholder')}
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm p-3 resize-none"
                            />
                        </section>

                        {/* Environment Section — read-only, set at course creation */}
                        <section>
                            <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-4 border-b pb-2">
                                {t('dna.edit.section.environment')}
                            </h3>
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300">
                                {t(environmentLabelKey)}
                            </div>
                            <p className="text-[10px] font-normal text-gray-500 mt-1">{t('dna.edit.environment.help')}</p>
                        </section>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                    <div className="text-red-500 text-sm font-medium">
                        {error}
                    </div>
                    <div className="flex gap-3">
                        {course && (
                             <button
                                onClick={handleAutoGenerate}
                                disabled={isGenerating || isSaving}
                                className="px-3 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors flex items-center gap-2"
                                title="Regenerate DNA based on course context"
                            >
                                {isGenerating ? <span className="animate-spin">✨</span> : <Wand2 size={18} />}
                                <span className="hidden sm:inline">{t('dna.edit.auto_fill')}</span>
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            {t('dna.edit.cancel')}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || isGenerating}
                            className="btn-primary flex items-center gap-2"
                        >
                            {isSaving || isGenerating ? <span className="animate-spin">⏳</span> : ((!formData.terminology && course) ? <Wand2 size={18} /> : <Save size={18} />)}
                            {(!formData.terminology && course) ? t('dna.edit.generate_save') : t('dna.edit.save')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DNAEditModal;
