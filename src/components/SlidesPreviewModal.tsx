import React, { useEffect, useMemo, useState } from 'react';
import { X, AlertTriangle, CheckCircle, Wand2 } from 'lucide-react';
import { Course, SlideArchetype, SlideModel } from '../types';
import { getSlideModelsForPreview, getTemplateRules, validateSlide, normalizeSlide, getPedagogicWarnings } from '../services/exportService';

type Props = { isOpen: boolean; onClose: () => void; course: Course; onApplySuggestion?: (s: string, targetTitle?: string) => void };

const SlidesPreviewModal: React.FC<Props> = ({ isOpen, onClose, course, onApplySuggestion }) => {
  const [models, setModels] = useState<SlideModel[]>([]);
  const [fixed, setFixed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getSlideModelsForPreview(course)
      .then(setModels)
      .finally(() => setLoading(false));
  }, [isOpen, course]);

  const issues = models.map(m => ({ m, ok: validateSlide(m, getTemplateRules(m.slide_type)) }));
  const hasIssues = issues.some(i => !i.ok);
  const summary = useMemo(() => {
    let critical = 0, warn = 0, info = 0;
    models.forEach(m => {
      const ws = getPedagogicWarnings(m);
      ws.forEach(w => {
        if (w.startsWith('[CRITICAL]')) critical++;
        else if (w.startsWith('[WARN]')) warn++;
        else if (w.startsWith('[INFO]')) info++;
      });
    });
    return { critical, warn, info };
  }, [models]);
  const suggestions = useMemo(() => {
    const set = new Set<string>();
    models.forEach(m => {
      const ws = getPedagogicWarnings(m);
      ws.forEach(w => {
        if (w.includes('Exercițiu fără pași')) set.add('Adaugă cel puțin 3 pași clari la Exercițiu');
        if (w.includes('aplicare') || w.includes('Nivel Bloom prea scăzut')) set.add('Adaugă verbe de aplicare: aplică, utilizează, implementează');
        if (w.includes('Lipsește imaginea')) set.add('Inserează o imagine relevantă în Image+Text');
        if (w.includes('Studiu de caz fără structură')) set.add('Adaugă context, problemă, soluție, rezultat');
        if (w.includes('evaluare')) set.add('Adaugă concluzii sau criterii de evaluare');
        if (w.includes('Conținut prea dens')) set.add('Reduce numărul de bullets sau scurtează enunțurile');
        if (w.includes('Titlu prea lung')) set.add('Scurtează titlul pentru lizibilitate');
        if (w.includes('Prea multe bullets')) set.add('Reduce bullets la limita arhetipului');
        if (w.includes('Bullets prea lungi')) set.add('Scurtează formulările din bullets');
      });
    });
    return Array.from(set);
  }, [models]);

  const handleFix = () => {
    const next = models.map(m => {
      const rules = getTemplateRules(m.slide_type);
      if (validateSlide(m, rules)) return m;
      const fallbackRules = getTemplateRules(SlideArchetype.Explainer);
      const patched = { ...m, slide_type: SlideArchetype.Explainer };
      return normalizeSlide(patched, fallbackRules);
    });
    setModels(next);
    setFixed(true);
  };

  if (!isOpen) return null;

  const Tile: React.FC<{ m: SlideModel }> = ({ m }) => {
    const bulletsText = (m.bullets || []).join('\n');
    const warns = getPedagogicWarnings(m);
    const [lowRes, setLowRes] = useState(false);
    const renderWarn = (w: string, i: number) => {
      const isCritical = w.startsWith('[CRITICAL]');
      const isWarn = w.startsWith('[WARN]');
      const text = w.replace(/^\[(CRITICAL|WARN|INFO)\]\s*/, '');
      const cls = isCritical
        ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
        : isWarn
          ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
          : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
      const Icon = isCritical ? AlertTriangle : isWarn ? AlertTriangle : CheckCircle;
      return (
        <span key={i} className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] mr-2 mb-2 ${cls}`}>
          <Icon size={12} /> {text}
        </span>
      );
    };
    const localSuggestions = (() => {
      const set = new Set<string>();
      warns.forEach(w => {
        if (w.includes('Studiu de caz fără structură')) set.add('Adaugă context, problemă, soluție, rezultat');
        if (w.includes('evaluare')) set.add('Adaugă concluzii sau criterii de evaluare');
        if (w.includes('Nivel Bloom prea scăzut')) set.add('Adaugă verbe de aplicare: aplică, utilizează, implementează');
        if (w.includes('Lipsește imaginea')) set.add('Inserează o imagine relevantă în Image+Text');
      });
      return Array.from(set);
    })();
    return (
      <div className="rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div className="px-4 py-2 text-xs bg-gray-50 dark:bg-gray-900/40 flex items-center justify-between">
          <span className="font-semibold">{m.slide_type}</span>
          {validateSlide(m, getTemplateRules(m.slide_type)) ? (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400"><CheckCircle size={14}/> OK</span>
          ) : (
            <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400"><AlertTriangle size={14}/> Needs fix</span>
          )}
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {m.slide_type === 'image_text' ? (
            <>
              <div>
                <h3 className="font-bold text-lg mb-2">{m.title}</h3>
                {bulletsText && <ul className="list-disc ml-5 text-sm">
                  {(m.bullets || []).map((b, i) => (<li key={i}>{b}</li>))}
                </ul>}
              </div>
              <div className="flex items-center justify-center">
                {m.image_url ? (
                  <div className="text-center">
                    <img
                      src={m.image_url}
                      alt=""
                      className="max-h-48 rounded-lg object-contain"
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        const nw = img.naturalWidth || 0;
                        const nh = img.naturalHeight || 0;
                        setLowRes(nw < 800 || nh < 600);
                      }}
                    />
                    {lowRes && (
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
                        <AlertTriangle size={12} /> Rezoluție imagine mică
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">No image</div>
                )}
              </div>
            </>
          ) : m.slide_type === 'exercise' ? (
            <div className="md:col-span-2">
              <div className="px-3 py-2 rounded bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs font-semibold mb-2">Exercițiu</div>
              <h3 className="font-bold text-lg mb-2">{m.title}</h3>
              {bulletsText && <ul className="list-disc ml-5 text-sm">
                {(m.bullets || []).map((b, i) => (<li key={i}>{b}</li>))}
              </ul>}
            </div>
          ) : m.slide_type === 'case_study' ? (
            <div className="md:col-span-2">
              <div className="px-3 py-2 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2">Studiu de caz</div>
              <h3 className="font-bold text-lg mb-2">{m.title}</h3>
              {bulletsText && <ul className="list-disc ml-5 text-sm">
                {(m.bullets || []).map((b, i) => (<li key={i}>{b}</li>))}
              </ul>}
            </div>
          ) : m.slide_type === 'quote' ? (
            <div className="md:col-span-2">
              <blockquote className="text-xl italic text-center p-6">{m.title}</blockquote>
            </div>
          ) : (
            <div className="md:col-span-2">
              <h3 className="font-bold text-lg mb-2">{m.title}</h3>
              {bulletsText && <ul className="list-disc ml-5 text-sm">
                {(m.bullets || []).map((b, i) => (<li key={i}>{b}</li>))}
              </ul>}
            </div>
          )}
        </div>
        {warns.length > 0 && (
          <div className="px-4 pb-3">
            {warns.map(renderWarn)}
          </div>
        )}
        {localSuggestions.length > 0 && (
          <div className="px-4 pb-3">
            <div className="text-[11px] font-semibold mb-1">Aplică sugestii pentru acest slide</div>
            <div className="flex flex-wrap">
              {localSuggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onApplySuggestion && onApplySuggestion(s, m.title || '')}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 mr-2 mb-2 hover:bg-primary-100 dark:hover:bg-primary-900/30"
                >
                  <Wand2 size={12}/> {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[95vw] max-w-6xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl ring-1 ring-black/5 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold">Slides Preview</h2>
            <p className="text-xs text-gray-500">Deterministic render pe arhetipuri</p>
          </div>
        <div className="flex items-center gap-2">
            {hasIssues && (
              <button onClick={handleFix} className="px-3 py-2 rounded bg-primary-600 text-white text-sm flex items-center gap-2">
                <Wand2 size={16}/> Fix issues
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="px-4 py-2 border-b dark:border-gray-700 flex items-center gap-2 text-[12px]">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300">
            <AlertTriangle size={12}/> {summary.critical} critical
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
            <AlertTriangle size={12}/> {summary.warn} warnings
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
            <CheckCircle size={12}/> {summary.info} info
          </span>
        </div>
        {suggestions.length > 0 && (
          <div className="px-4 py-3 border-b dark:border-gray-700 text-[12px]">
            <div className="font-semibold mb-1">Sugestii rapide</div>
            <div className="flex flex-wrap">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onApplySuggestion && onApplySuggestion(s)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 mr-2 mb-2 hover:bg-primary-100 dark:hover:bg-primary-900/30"
                >
                  <Wand2 size={12}/> {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="p-4 overflow-y-auto space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-sm">Loading...</div>
          ) : models.length === 0 ? (
            <div className="text-sm text-gray-500">Nu există slide-uri de previzualizat.</div>
          ) : (
            models.map(m => (<Tile key={m.id} m={m}/>))
          )}
        </div>
        {fixed && (
          <div className="p-3 border-t dark:border-gray-700 text-xs text-green-700 dark:text-green-300 flex items-center gap-2">
            <CheckCircle size={14}/> Normalizările au fost aplicate în previzualizare.
          </div>
        )}
      </div>
    </div>
  );
};

export default SlidesPreviewModal;
