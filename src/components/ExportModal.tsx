import React, { useEffect, useState } from 'react';
import { FileText, Presentation, FileArchive, X } from 'lucide-react';
import { useTranslation } from '../contexts/I18nContext';
import { isEnabled } from '../config/featureFlags';
import { Course } from '../types';
import { getSlideModelsForPreview, getPedagogicWarnings } from '../services/exportService';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (format: 'pptx' | 'pdf' | 'zip') => void;
    isExporting: boolean;
    course?: Course | null;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, isExporting, course }) => {
    const { t } = useTranslation();
    const [hasCritical, setHasCritical] = useState(false);

    useEffect(() => {
        const check = async () => {
            if (!isOpen || !course) { setHasCritical(false); return; }
            // We verify in background without blocking
            try {
                const models = await getSlideModelsForPreview(course);
                const crit = models.some(m => (getPedagogicWarnings(m) || []).some(w => w.startsWith('[CRITICAL]')));
                setHasCritical(crit);
            } catch {
                setHasCritical(false);
            }
        };
        check();
    }, [isOpen, course?.id]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {t('export.title') || 'Download Course'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {hasCritical && (
                    <div className="px-6 py-3 border-b border-yellow-100 dark:border-yellow-900/30 bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-300 text-sm">
                        Există probleme critice identificate de asistent, dar poți continua exportul.
                    </div>
                )}

                <div className="p-6 space-y-4">
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {t('export.subtitle') || 'Choose a format to download your course materials:'}
                    </p>

                    <button
                        onClick={() => onExport('pptx')}
                        disabled={isExporting}
                        className={`w-full flex items-center p-4 border-2 rounded-xl transition-all group ${
                            hasCritical 
                                ? 'border-yellow-100 dark:border-yellow-900/30 bg-yellow-50 dark:bg-yellow-900/10 hover:border-yellow-500' 
                                : 'border-orange-100 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-900/10 hover:border-orange-500'
                        }`}
                    >
                        <div className={`p-3 rounded-lg transition-colors ${
                            hasCritical
                                ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400 group-hover:bg-yellow-500 group-hover:text-white'
                                : 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white'
                        }`}>
                            <Presentation size={24} />
                        </div>
                        <div className="ml-4 text-left">
                            <h4 className="font-bold text-gray-900 dark:text-white">PowerPoint (.pptx){isEnabled('newPptxExporter') ? ' — Beta' : ''}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t('export.pptx.subtitle') || (hasCritical ? 'Atenție: Probleme critice detectate, dar poți exporta.' : (isEnabled('newPptxExporter') ? 'New deterministic exporter' : 'Legacy exporter'))}
                            </p>
                        </div>
                    </button>

                    <button
                        onClick={() => onExport('pdf')}
                        disabled={isExporting}
                        className="w-full flex items-center p-4 border-2 border-red-100 dark:border-red-900/30 rounded-xl hover:border-red-500 dark:hover:border-red-500 bg-red-50 dark:bg-red-900/10 transition-all group"
                    >
                        <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-lg text-red-600 dark:text-red-400 group-hover:bg-red-500 group-hover:text-white transition-colors">
                            <FileText size={24} />
                        </div>
                        <div className="ml-4 text-left">
                            <h4 className="font-bold text-gray-900 dark:text-white">PDF Document (.pdf)</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('export.pdf.subtitle') || 'Download course manual as PDF'}</p>
                        </div>
                    </button>

                    <button
                        onClick={() => onExport('zip')}
                        disabled={isExporting}
                        className="w-full flex items-center p-4 border-2 border-blue-100 dark:border-blue-900/30 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 bg-blue-50 dark:bg-blue-900/10 transition-all group"
                    >
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <FileArchive size={24} />
                        </div>
                        <div className="ml-4 text-left">
                            <h4 className="font-bold text-gray-900 dark:text-white">ZIP Archive (.zip)</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('export.zip.subtitle') || 'Download all materials as DOCX inside a ZIP'}</p>
                        </div>
                    </button>
                </div>

                {isExporting && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center backdrop-blur-sm">
                        <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                            <p className="mt-4 font-medium text-gray-900 dark:text-white">Generating files...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExportModal;
