import React, { useState, useEffect } from 'react';
import { History, RotateCcw, X, Loader2, Calendar } from 'lucide-react';
import { CourseVersion } from '../types';
import { getStepVersions, createStepVersion } from '../services/versioningService';
import { applyImportToStep } from '../services/importService';
import { useToast } from '../contexts/ToastContext';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  stepId: string;
  courseId: string;
  currentContent: string;
  onRestore: (content: string) => void;
};

const VersionHistoryModal: React.FC<Props> = ({ isOpen, onClose, stepId, courseId, currentContent, onRestore }) => {
  const [versions, setVersions] = useState<CourseVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadVersions();
    }
  }, [isOpen, stepId]);

  const loadVersions = async () => {
    setLoading(true);
    const data = await getStepVersions(stepId);
    setVersions(data);
    setLoading(false);
  };

  const handleRestore = async (version: CourseVersion) => {
    if (!confirm('Ești sigur că vrei să revii la această versiune? Conținutul actual va fi salvat ca o nouă versiune înainte de înlocuire.')) return;
    
    setRestoringId(version.id);
    try {
      // 1. Snapshot current state before restore
      await createStepVersion(courseId, stepId, currentContent, 'restore', `Auto-backup before restoring v${version.version_number}`);

      // 2. Apply restore
      const res = await applyImportToStep(stepId, 'replace', version.content, currentContent);
      if (!res.ok) throw new Error(res.error);

      onRestore(version.content);
      showToast(`Restaurat la versiunea ${version.version_number}`, 'success');
      onClose();
    } catch (e) {
      console.error(e);
      showToast('Eroare la restaurare', 'error');
    } finally {
      setRestoringId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[210] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh]">
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="text-primary-600" />
            <h3 className="font-bold text-lg">Istoric Versiuni</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X size={18} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary-500" /></div>
          ) : versions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>Nu există versiuni anterioare salvate.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((v) => (
                <div key={v.id} className="border dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between group">
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                       <span className="font-bold text-sm bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded text-xs">v{v.version_number}</span>
                       <span className="text-xs text-gray-500 flex items-center gap-1">
                         <Calendar size={12} />
                         {new Date(v.created_at).toLocaleString()}
                       </span>
                     </div>
                     <p className="text-sm font-medium">{v.change_description || 'Modificare automată'}</p>
                     <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{v.change_type}</p>
                   </div>
                   
                   <button 
                     onClick={() => handleRestore(v)}
                     disabled={restoringId !== null}
                     className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg"
                     title="Restaurează această versiune"
                   >
                     {restoringId === v.id ? <Loader2 className="animate-spin" size={18} /> : <RotateCcw size={18} />}
                   </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VersionHistoryModal;
