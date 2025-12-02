import React, { useEffect, useMemo, useState } from 'react';
import { X, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { CourseBlueprint, CourseModule, CourseSection } from '../types';
import { useTranslation } from '../contexts/I18nContext';

interface BlueprintEditModalProps {
  isOpen: boolean;
  blueprint: CourseBlueprint;
  onClose: () => void;
  onSave: (bp: CourseBlueprint) => Promise<void> | void;
}

const safeStringify = (bp: CourseBlueprint) => JSON.stringify(bp, null, 2);

const BlueprintEditModal: React.FC<BlueprintEditModalProps> = ({ isOpen, blueprint, onClose, onSave }) => {
  const { t } = useTranslation();
  const [text, setText] = useState<string>('');
  const [parsed, setParsed] = useState<CourseBlueprint | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState<'form' | 'json'>('form');

  useEffect(() => {
    if (isOpen) {
      setText(safeStringify(blueprint));
      setParsed(blueprint);
      setErrors([]);
    }
  }, [isOpen, blueprint]);

  const validateBlueprint = (bp: CourseBlueprint): string[] => {
    const errs: string[] = [];
    if (!bp || !Array.isArray(bp.modules)) {
      errs.push(t('blueprint.edit.validation.invalidStructure'));
      return errs;
    }
    if (bp.modules.length === 0) {
      errs.push(t('blueprint.edit.validation.noModules'));
    }
    bp.modules.forEach((m: CourseModule, mi: number) => {
      if (!m.title || m.title.trim().length === 0) {
        errs.push(t('blueprint.edit.validation.emptyModuleTitle', { n: mi + 1 }));
      }
      if (!Array.isArray(m.sections) || m.sections.length === 0) {
        errs.push(t('blueprint.edit.validation.noSections', { n: mi + 1 }));
      }
      const seen: Record<string, boolean> = {};
      m.sections.forEach((s: CourseSection, si: number) => {
        if (!s.title || s.title.trim().length === 0) {
          errs.push(t('blueprint.edit.validation.emptySectionTitle', { module: mi + 1, n: si + 1 }));
        }
        if (seen[s.id]) {
          errs.push(t('blueprint.edit.validation.duplicateSectionId', { module: mi + 1 }));
        }
        seen[s.id] = true;
      });
    });
    return errs;
  };

  const preview = useMemo(() => {
    if (!parsed) return null;
    return (
      <div className="space-y-3">
        {parsed.modules.map((m, mi) => (
          <div key={m.id} className="border rounded-lg p-3 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">{t('blueprint.moduleN', { n: mi + 1 })}</span>
              <h4 className="font-bold text-ink-900 dark:text-white">{m.title}</h4>
            </div>
            <p className="text-sm text-ink-600 dark:text-ink-400 mt-1">{m.learning_objective}</p>
            <ul className="mt-2 text-sm text-ink-700 dark:text-ink-300 list-disc ml-5">
              {m.sections.map(s => (
                <li key={s.id}>{s.title} — <span className="uppercase text-xs">{s.content_type.replace('_',' ')}</span></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }, [parsed, t]);

  const updateBlueprint = (updater: (bp: CourseBlueprint) => CourseBlueprint) => {
    if (!parsed) return;
    const next = updater(parsed);
    setParsed(next);
    setText(safeStringify(next));
    setErrors([]);
  };

  const onTopFieldChange = (field: keyof CourseBlueprint, value: string) => {
    updateBlueprint(bp => ({ ...bp, [field]: value }));
  };

  const onModuleFieldChange = (mi: number, field: keyof CourseModule, value: string) => {
    updateBlueprint(bp => ({
      ...bp,
      modules: bp.modules.map((m, idx) => idx === mi ? { ...m, [field]: value } : m)
    }));
  };

  const onSectionFieldChange = (mi: number, si: number, field: keyof CourseSection, value: string) => {
    updateBlueprint(bp => ({
      ...bp,
      modules: bp.modules.map((m, idx) => idx === mi ? {
        ...m,
        sections: m.sections.map((s, j) => j === si ? { ...s, [field]: value } : s)
      } : m)
    }));
  };

  const addSection = (mi: number) => {
    const id = `sec_${Date.now()}`;
    updateBlueprint(bp => ({
      ...bp,
      modules: bp.modules.map((m, idx) => idx === mi ? {
        ...m,
        sections: [...m.sections, { id, title: t('blueprint.edit.sectionNewTitle'), content_type: 'slides', order: m.sections.length + 1 }]
      } : m)
    }));
  };

  const removeSection = (mi: number, si: number) => {
    updateBlueprint(bp => ({
      ...bp,
      modules: bp.modules.map((m, idx) => idx === mi ? {
        ...m,
        sections: m.sections.filter((_, j) => j !== si).map((s, j) => ({ ...s, order: j + 1 }))
      } : m)
    }));
  };

  const handleTextChange = (v: string) => {
    setText(v);
    try {
      const bp = JSON.parse(v) as CourseBlueprint;
      setParsed(bp);
      setErrors([]);
    } catch (e) {
      setParsed(null);
      setErrors([t('blueprint.edit.invalidJson')]);
    }
  };

  const handleSave = async () => {
    if (!parsed) {
      setErrors([t('blueprint.edit.invalidJson')]);
      return;
    }
    const errs = validateBlueprint(parsed);
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    setIsSaving(true);
    try {
      await onSave(parsed);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-[95vw] max-w-5xl border border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col">
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-2xl">
          <h3 className="text-lg font-bold">{t('blueprint.edit.title')}</h3>
          <div className="flex items-center gap-2">
            <nav className="hidden lg:flex gap-2 mr-2" aria-label="Tabs">
              <button onClick={() => setMode('form')} className={`px-3 py-1 rounded-md text-sm ${mode === 'form' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>{t('blueprint.edit.tab.form')}</button>
              <button onClick={() => setMode('json')} className={`px-3 py-1 rounded-md text-sm ${mode === 'json' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>{t('blueprint.edit.tab.json')}</button>
            </nav>
            <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close"><X size={18} /></button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-y-auto">
          <div className="p-4 border-r dark:border-gray-700">
            {mode === 'json' ? (
              <>
                <label className="block text-sm font-medium mb-2">{t('blueprint.edit.jsonLabel')}</label>
                <textarea
                  className="w-full h-[50vh] font-mono text-sm rounded-lg border dark:border-gray-700 p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-900"
                  value={text}
                  onChange={e => handleTextChange(e.target.value)}
                />
              </>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('blueprint.edit.titleLabel')}</label>
                    <input className="w-full rounded-md border dark:border-gray-700 p-2 bg-white dark:bg-gray-900" value={parsed?.title || ''} onChange={e => onTopFieldChange('title', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('blueprint.edit.audienceLabel')}</label>
                    <input className="w-full rounded-md border dark:border-gray-700 p-2 bg-white dark:bg-gray-900" value={parsed?.target_audience || ''} onChange={e => onTopFieldChange('target_audience', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('blueprint.edit.durationLabel')}</label>
                    <input className="w-full rounded-md border dark:border-gray-700 p-2 bg-white dark:bg-gray-900" value={parsed?.estimated_duration || ''} onChange={e => onTopFieldChange('estimated_duration', e.target.value)} />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">{t('blueprint.edit.modulesLabel')}</h4>
                  {(parsed?.modules || []).map((m, mi) => (
                    <div key={m.id} className="mb-3 p-3 rounded-lg border dark:border-gray-700">
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <label className="block text-xs font-medium mb-1">{t('blueprint.edit.moduleTitleLabel', { n: mi + 1 })}</label>
                          <input className="w-full rounded-md border dark:border-gray-700 p-2 bg-white dark:bg-gray-900" value={m.title} onChange={e => onModuleFieldChange(mi, 'title', e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">{t('blueprint.edit.moduleLOLabel')}</label>
                          <textarea className="w-full rounded-md border dark:border-gray-700 p-2 bg-white dark:bg-gray-900" value={m.learning_objective} onChange={e => onModuleFieldChange(mi, 'learning_objective', e.target.value)} />
                        </div>
                      </div>
                      <div className="mt-2">
                        <label className="block text-xs font-medium mb-1">{t('blueprint.edit.sectionsLabel')}</label>
                        {(m.sections || []).map((s, si) => (
                          <div key={s.id} className="flex items-center gap-2 mb-2">
                            <input className="flex-1 rounded-md border dark:border-gray-700 p-2 bg-white dark:bg-gray-900" value={s.title} onChange={e => onSectionFieldChange(mi, si, 'title', e.target.value)} />
                            <select className="w-40 rounded-md border dark:border-gray-700 p-2 bg-white dark:bg-gray-900" value={s.content_type} onChange={e => onSectionFieldChange(mi, si, 'content_type', e.target.value)}>
                              <option value="slides">Slides</option>
                              <option value="video_script">Video Script</option>
                              <option value="exercise">Exercise</option>
                              <option value="reading">Reading</option>
                              <option value="quiz">Quiz</option>
                            </select>
                            <button className="btn-secondary" onClick={() => removeSection(mi, si)}>{t('blueprint.edit.removeSection')}</button>
                          </div>
                        ))}
                        <button className="btn-secondary mt-1" onClick={() => addSection(mi)}>{t('blueprint.edit.addSection')}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {errors.length > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
                <div className="flex items-center gap-2 mb-1"><AlertTriangle size={16} /><span className="font-semibold text-sm">{t('blueprint.edit.validation.title')}</span></div>
                <ul className="list-disc ml-5 text-sm">
                  {errors.map((e, i) => (<li key={i}>{e}</li>))}
                </ul>
              </div>
            )}
          </div>
          <div className="p-4">
            <label className="block text-sm font-medium mb-2">{t('blueprint.edit.previewLabel')}</label>
            <div className="h-[50vh] overflow-y-auto">{preview}</div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t dark:border-gray-700">
          <button onClick={onClose} className="btn-secondary">{t('blueprint.edit.cancel')}</button>
          <button onClick={handleSave} className="btn-premium flex items-center gap-2" disabled={isSaving || !!errors.length}>
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
            {t('blueprint.edit.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlueprintEditModal;
