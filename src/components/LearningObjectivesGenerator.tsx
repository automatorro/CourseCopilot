import React, { useState, useEffect } from 'react';
import { Loader2, Lightbulb, RefreshCw, Check } from 'lucide-react';
import { Course } from '../types';
import { supabase } from '../services/supabaseClient';

interface LearningObjectivesGeneratorProps {
    course: Course;
    onComplete: () => void;
}

const LearningObjectivesGenerator: React.FC<LearningObjectivesGeneratorProps> = ({ course, onComplete }) => {
    const [objectives, setObjectives] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auto-generate on mount
    useEffect(() => {
        generateObjectives();
    }, []);

    const generateObjectives = async () => {
        setIsGenerating(true);
        setError(null);

        try {
            const { data, error: functionError } = await supabase.functions.invoke('generate-course-content', {
                body: {
                    action: 'generate_learning_objectives',
                    course: {
                        title: course.title,
                        subject: course.subject,
                        target_audience: course.target_audience,
                        environment: course.environment,
                        language: course.language,
                    },
                },
            });

            if (functionError) throw functionError;

            // Parse JSON response
            let response;
            try {
                response = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
            } catch (e) {
                console.error('Failed to parse JSON content:', data.content);
                throw new Error('Invalid response format from AI');
            }

            const objectivesList = response.objectives || [];

            // Convert array to newline-separated string
            const objectivesText = objectivesList
                .map((obj: string, index: number) => `${index + 1}. ${obj}`)
                .join('\n');

            setObjectives(objectivesText);
            setHasGenerated(true);
        } catch (err: any) {
            console.error('Error generating learning objectives:', err);
            setError(err.message || 'Failed to generate learning objectives');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!objectives.trim()) {
            setError('Please provide at least one learning objective');
            return;
        }

        try {
            // Save to database
            const { error: updateError } = await supabase
                .from('courses')
                .update({ learning_objectives: objectives })
                .eq('id', course.id);

            if (updateError) throw updateError;

            // Call onComplete callback (no params needed, course will be reloaded)
            onComplete();
        } catch (err: any) {
            console.error('Error saving learning objectives:', err);
            setError(err.message || 'Failed to save learning objectives');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-600 to-indigo-600 p-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-white/20 p-2 rounded-full">
                            <Lightbulb size={24} />
                        </div>
                        <h2 className="text-2xl font-bold">Define Learning Objectives</h2>
                    </div>
                    <p className="text-primary-100">
                        What should participants be able to do after completing this course?
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Course Info */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-2">
                        <div className="flex items-baseline gap-2">
                            <span className="text-sm font-medium text-ink-600 dark:text-ink-400">Course:</span>
                            <span className="font-semibold text-ink-900 dark:text-white">{course.title}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-sm font-medium text-ink-600 dark:text-ink-400">Audience:</span>
                            <span className="text-ink-800 dark:text-ink-200">{course.target_audience}</span>
                        </div>
                    </div>

                    {/* AI-Generated Objectives */}
                    {isGenerating && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <Loader2 className="animate-spin text-primary-600" size={48} />
                            <p className="text-ink-600 dark:text-ink-400">
                                AI is analyzing your course and generating learning objectives...
                            </p>
                        </div>
                    )}

                    {!isGenerating && (
                        <>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-ink-700 dark:text-ink-200">
                                        Learning Objectives
                                        {hasGenerated && (
                                            <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-normal">
                                                <Check size={14} className="inline mr-1" />
                                                AI-generated
                                            </span>
                                        )}
                                    </label>
                                    <button
                                        onClick={generateObjectives}
                                        className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                                        disabled={isGenerating}
                                    >
                                        <RefreshCw size={16} />
                                        Regenerate
                                    </button>
                                </div>
                                <textarea
                                    value={objectives}
                                    onChange={(e) => setObjectives(e.target.value)}
                                    rows={8}
                                    className="w-full input-premium resize-none"
                                    placeholder="e.g.,
1. Build a functional React application using components and hooks
2. Implement state management using Context API
3. Debug React applications using Developer Tools"
                                />
                                <p className="text-xs text-ink-500 dark:text-ink-400 mt-2">
                                    💡 You can edit these objectives or add your own. Be specific about what participants will be able to DO.
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={handleSave}
                                    disabled={isGenerating || !objectives.trim()}
                                    className="btn-premium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Check size={20} />
                                    Continue to Blueprint
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LearningObjectivesGenerator;
