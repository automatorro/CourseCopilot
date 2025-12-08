import React, { useState } from 'react';
import { CheckCircle, ChevronDown, ChevronRight, Sparkles, Edit, Play } from 'lucide-react';
import { isEnabled } from '../config/featureFlags';
import { CourseBlueprint } from '../types';
import { useTranslation } from '../contexts/I18nContext';

interface BlueprintReviewProps {
    blueprint: CourseBlueprint;
    onGenerateContent: () => void;
    onRefine: () => void;
    onEdit: () => void;
}

const BlueprintReview: React.FC<BlueprintReviewProps> = ({
    blueprint,
    onGenerateContent,
    onRefine,
    onEdit,
}) => {
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
    const { t } = useTranslation();

    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev => {
            const next = new Set(prev);
            if (next.has(moduleId)) {
                next.delete(moduleId);
            } else {
                next.add(moduleId);
            }
            return next;
        });
    };

    const getContentTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            slides: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
            video_script: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
            exercise: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
            reading: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
            quiz: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        };
        return colors[type] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    };

    return (
        <div className="h-full"><div className="max-w-5xl mx-auto h-full p-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white rounded-t-2xl sticky top-0 z-30 shadow-md">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="bg-white/20 p-1.5 rounded-full">
                            <CheckCircle size={20} />
                        </div>
                        <h2 className="text-xl font-bold">{t('blueprint.title')}</h2>
                    </div>
                    <p className="text-indigo-100 text-sm">
                        {t('blueprint.subtitle')}
                    </p>
                </div>

                {/* Metadata */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-sm font-medium text-ink-600 dark:text-ink-400">{t('blueprint.totalModules')}</span>
                            <span className="ml-2 font-semibold text-ink-900 dark:text-white">{blueprint.modules.length}</span>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-ink-600 dark:text-ink-400">{t('blueprint.estimatedDuration')}</span>
                            <span className="ml-2 font-semibold text-ink-900 dark:text-white">
                                {blueprint.estimated_duration || t('blueprint.notSpecified')}
                            </span>
                        </div>
                </div>
                </div>

                {/* Module Tree */}
                <div className="p-6 space-y-4 flex-1">
                    {(!blueprint.modules || blueprint.modules.length === 0) ? (
                        <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                            {t('blueprint.noModules')}
                        </div>
                    ) : (
                        blueprint.modules.map((module, moduleIndex) => {
                            const isExpanded = expandedModules.has(module.id);
                            return (
                                <div
                                    key={module.id}
                                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                                >
                                    {/* Module Header */}
                                    <button
                                        onClick={() => toggleModule(module.id)}
                                        className="w-full flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                                    >
                                        {isExpanded ? (
                                            <ChevronDown size={20} className="text-primary-600 dark:text-primary-400" />
                                        ) : (
                                            <ChevronRight size={20} className="text-gray-400" />
                                        )}
                                        <div className="flex-1 text-left">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                                                    {t('blueprint.moduleN', { n: moduleIndex + 1 })}
                                                </span>
                                                <h3 className="font-bold text-ink-900 dark:text-white">{module.title}</h3>
                                            </div>
                                            <p className="text-sm text-ink-600 dark:text-ink-400 mt-1">
                                                <strong>{t('blueprint.learningObjective')}:</strong> {module.learning_objective}
                                            </p>
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {t('blueprint.sectionsCount', { count: module.sections.length })}
                                        </span>
                                    </button>

                                    {/* Module Sections */}
                                    {isExpanded && (
                                        <div className="p-4 space-y-2 bg-white dark:bg-gray-800">
                                            {module.sections.map((section, sectionIndex) => (
                                                <div
                                                    key={section.id}
                                                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                                                >
                                                    <div className="flex-shrink-0 mt-0.5">
                                                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-300">
                                                            {sectionIndex + 1}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-semibold text-ink-900 dark:text-white">
                                                                {section.title}
                                                            </h4>
                                                            <span
                                                                className={`px-2 py-0.5 text-xs font-medium rounded-full ${getContentTypeColor(
                                                                    section.content_type
                                                                )}`}
                                                            >
                                                                {section.content_type.replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                        {section.content_outline && (
                                                            <p className="text-sm text-ink-600 dark:text-ink-400">
                                                                {section.content_outline}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Actions */}
                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-3 justify-between sticky bottom-0 z-20 backdrop-blur-sm">
                    <div className="flex gap-3">
                        {isEnabled('blueprintRefineEnabled') && (
                            // INTENȚIONAT: Controlăm vizibilitatea „Rafinează cu AI” prin flag
                            <button
                                onClick={onRefine}
                                className="btn-secondary flex items-center gap-2"
                            >
                                <Sparkles size={18} />
                                {t('blueprint.actions.refine')}
                            </button>
                        )}
                        <button
                            onClick={onEdit}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <Edit size={18} />
                            {t('blueprint.actions.edit')}
                        </button>
                    </div>
                    <button
                        onClick={onGenerateContent}
                        className="btn-premium flex items-center gap-2"
                    >
                        <Play size={18} />
                        {t('blueprint.actions.generate')}
                    </button>
                </div>
            </div>
        </div></div>
    );
};

export default BlueprintReview;
