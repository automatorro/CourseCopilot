import React, { useEffect, useMemo, useState } from 'react';
import { X, Loader2, CheckCircle, AlertTriangle, Diff } from 'lucide-react';
import { Course, CourseBlueprint, CourseModule } from '../types';
import { useTranslation } from '../contexts/I18nContext';
import { refineBlueprint } from '../services/geminiService';
import { validateModulesConsistency } from '../lib/outputValidators';

interface Props {
  isOpen: boolean;
  course: Course;
  original: CourseBlueprint;
  onClose: () => void;
  onAccept: (bp: CourseBlueprint) => Promise<void> | void;
}

const ModulePreview: React.FC<{ bp: CourseBlueprint; t: (k: string, v?: any) => string }> = ({ bp, t }) => (
  <div className="space-y-3">
    {(bp.modules || []).map((m: CourseModule, mi: number) => (
      <div key={m.id} className="border rounded-lg p-3 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">{t('blueprint.moduleN', { n: mi + 1 })}</span>
          <h4 className="font-bold text-ink-900 dark:text-white">{m.title}</h4>
        </div>
        <p className="text-sm text-ink-600 dark:text-ink-400 mt-1">{m.learning_objective}</p>
        <ul className="mt-2 text-sm text-ink-700 dark:text-ink-300 list-disc ml-5">
          {(m.sections || []).map(s => (
            <li key={s.id}>{s.title}</li>
          ))}
        </ul>
      </div>
    ))}
  </div>
);

const BlueprintRefineModal: React.FC<Props> = ({ isOpen, course, original, onClose, onAccept }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refined, setRefined] = useState<CourseBlueprint | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!isOpen) return;
      setLoading(true);
      setError(null);
      const res = await refineBlueprint(course, original);
      setRefined(res);
      setLoading(false);
    };
    run();
  }, [isOpen, course, original]);

  const validation = useMemo(() => {
    if (!refined) return null;
    const a = (original.modules || []).map(m => ({ id: m.id, title: m.title, sections: m.sections.map(s => ({ id: s.id, title: s.title })) }));
    const b = (refined.modules || []).map(m => ({ id: m.id, title: m.title, sections: m.sections.map(s => ({ id: s.id, title: s.title })) }));
    return validateModulesConsistency(a as any, b as any);
  }, [original, refined]);

  const changes = useMemo(() => {
    if (!refined) return [] as string[];
    const list: string[] = [];
    const om = original.modules || [];
    const rm = refined.modules || [];
    if (om.length !== rm.length) list.push(t('blueprint.refine.diff.modulesCount', { a: om.length, b: rm.length }));
    rm.forEach((m, i) => {
      const o = om[i];
      if (!o) return;
      if (o.title !== m.title) list.push(t('blueprint.refine.diff.moduleTitle', { n: i + 1 }));
      if ((o.sections || []).length !== (m.sections || []).length) list.push(t('blueprint.refine.diff.sectionsCount', { n: i + 1 }));
    });
    return list;
  }, [original, refined, t]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-[95vw] max-w-6xl border border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col">
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-2xl">
          <h3 className="text-lg font-bold">{t('blueprint.refine.title')}</h3>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="flex items-center gap-2"><Loader2 className="animate-spin" size={18} /><span>{t('blueprint.refine.loading')}</span></div>
          ) : error ? (
            <div className="p-3 rounded bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">{error}</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">{t('blueprint.refine.original')}</h4>
                <ModulePreview bp={original} t={t} />
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">{t('blueprint.refine.refined')}</h4>
                {refined && <ModulePreview bp={refined} t={t} />}
              </div>
            </div>
          )}
        </div>
        {!loading && refined && (
          <div className="px-4 pb-2">
            <div className="p-3 rounded-lg bg-ink-50 dark:bg-ink-800/30">
              <div className="flex items-center gap-2 mb-2">
                <Diff size={16} />
                <span className="text-sm font-semibold">{t('blueprint.refine.changes')}</span>
              </div>
              <ul className="list-disc ml-5 text-sm">
                {changes.length === 0 ? (<li>{t('blueprint.refine.noChanges')}</li>) : changes.map((c, i) => (<li key={i}>{c}</li>))}
              </ul>
            </div>
            {validation && (
              <div className={`mt-3 p-3 rounded-lg ${validation.ok ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {validation.ok ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                  <span className="font-semibold text-sm">{validation.ok ? t('blueprint.refine.validation.ok') : t('blueprint.refine.validation.warn')}</span>
                </div>
                {!validation.ok && (
                  <ul className="list-disc ml-5 text-sm">
                    {validation.missingInB?.length ? (<li>{t('blueprint.refine.validation.missing', { items: validation.missingInB.join(', ') })}</li>) : null}
                    {validation.extraInB?.length ? (<li>{t('blueprint.refine.validation.extra', { items: validation.extraInB.join(', ') })}</li>) : null}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
        <div className="flex items-center justify-end gap-2 p-4 border-t dark:border-gray-700">
          <button onClick={onClose} className="btn-secondary">{t('blueprint.edit.cancel')}</button>
          <button disabled={!refined} onClick={() => refined && onAccept(refined)} className="btn-premium flex items-center gap-2">
            <CheckCircle size={18} />
            {t('blueprint.refine.accept')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlueprintRefineModal;
