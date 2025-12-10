import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Course, CourseBlueprint } from '../types';
import { useTranslation } from '../contexts/I18nContext';
import { Loader2, X, FileText } from 'lucide-react';

interface UploadBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  onBlueprintReady: (bp: CourseBlueprint) => void;
}

const UploadBlueprintModal: React.FC<UploadBlueprintModalProps> = ({ isOpen, onClose, course, onBlueprintReady }) => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-course-content', {
        body: {
          action: 'analyze_upload',
          environment: course.environment,
          fileName: 'pasted.md',
          fileContent: text,
        }
      });
      if (fnError) throw fnError;
      const bp = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
      const { error: upErr } = await supabase.from('courses').update({ blueprint: bp }).eq('id', course.id);
      if (upErr) throw upErr;
      onBlueprintReady(bp);
    } catch (e: any) {
      setError(e?.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="card-premium w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b dark:border-ink-700 flex items-center justify-between">
          <div className="flex items-center gap-2"><FileText size={20} /><h2 className="text-2xl font-bold">{t('modal.courseEntry.import')}</h2></div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-ink-100 dark:hover:bg-ink-800"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <p className="text-sm text-ink-600 dark:text-ink-300">Lipeste aici materialul tău (.md/.txt) pentru analiză și generarea blueprintului.</p>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={12} className="input-premium w-full resize-y" placeholder="Conținut de referință" />
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
        <div className="p-4 border-t dark:border-ink-700 flex justify-end gap-3">
          <button onClick={onClose} className="btn-premium--secondary">{t('modal.newCourse.cancel')}</button>
          <button onClick={handleAnalyze} disabled={loading || !text.trim()} className="btn-premium">
            {loading ? <Loader2 className="animate-spin" size={16} /> : null}
            <span className="ml-1">Generează Blueprint</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadBlueprintModal;
