import React, { useState, useEffect } from 'react';
import { Upload, X, Loader2, AlertTriangle, FileText, Replace, GitCompare, LayoutList, ArrowRight } from 'lucide-react';
import { CourseStep } from '../types';
import MarkdownPreview from './MarkdownPreview';
import { normalizeFileToMarkdown, normalizeUrlToMarkdown, applyImportToStep } from '../services/importService';
import { computeLineDiff, analyzeStructure, DiffChange } from '../lib/diffUtils';

type Props = { 
  isOpen: boolean; 
  onClose: () => void; 
  step: CourseStep; 
  onApplied: (oldContent: string) => void;
  initialFileUrl?: string;
  initialFileType?: string;
  initialFileName?: string;
};

const ImportStagingModal: React.FC<Props> = ({ isOpen, onClose, step, onApplied, initialFileUrl, initialFileType, initialFileName }) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string>('');
  const [mode, setMode] = useState<'append' | 'replace'>('append');
  const [viewMode, setViewMode] = useState<'diff' | 'preview'>('diff');
  const [diffChanges, setDiffChanges] = useState<DiffChange[]>([]);
  const [structure, setStructure] = useState<string[]>([]);
  
  // Flag to prevent double-fetch on mount
  const [hasInitialized, setHasInitialized] = useState(false);

  const accept = '.docx,.pdf,.md,.markdown,.html,.txt,.pptx';

  useEffect(() => {
    if (isOpen && initialFileUrl && !hasInitialized) {
        setHasInitialized(true);
        loadInitialFile(initialFileUrl, initialFileType || 'docx', initialFileName);
    }
  }, [isOpen, initialFileUrl]);

  const loadInitialFile = async (url: string, type: string, name?: string) => {
    setImporting(true);
    setError(null);
    try {
        const res = await normalizeUrlToMarkdown(url, type);
        if (!res.ok) {
            setError(res.error || 'Failed to load remote file');
        } else {
            setMarkdown(res.markdown || '');
            if (name) {
                // Mock file object for display
                const mockFile = new File([], name, { type: 'application/octet-stream' });
                setFile(mockFile);
            }
        }
    } catch (e) {
        setError('Error loading file');
    } finally {
        setImporting(false);
    }
  };

  useEffect(() => {
    if (markdown || step.content) {
      const current = step.content || '';
      const next = mode === 'replace' ? markdown : `${current}\n\n${markdown}`;
      setDiffChanges(computeLineDiff(current, next));
      setStructure(analyzeStructure(markdown));
    }
  }, [markdown, step.content, mode]);

  if (!isOpen) return null;

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setError(null);
    setMarkdown('');
    if (!f) return;
    setImporting(true);
    const res = await normalizeFileToMarkdown(f);
    if (!res.ok) {
      setError(res.error || 'Eroare la procesarea fișierului');
      setImporting(false);
      return;
    }
    
    if (!res.markdown?.trim()) {
      setError('Nu am putut extrage text din acest fișier. Verifică dacă conține text editabil (nu doar imagini).');
    }

    setMarkdown(res.markdown || '');
    setImporting(false);
  };

  const onApply = async () => {
    if (!markdown.trim()) { setError('Conținutul importat este gol'); return; }
    setImporting(true);
    const oldContent = step.content || '';
    const res = await applyImportToStep(step.id, mode, markdown, oldContent);
    setImporting(false);
    if (!res.ok) { setError(res.error || 'Aplicarea importului a eșuat'); return; }
    onApplied(oldContent);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-0 md:p-4">
      <div className="bg-white dark:bg-gray-800 md:rounded-xl shadow-2xl w-full max-w-6xl flex flex-col h-full md:h-[90vh] md:max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-primary-600" />
            <h2 className="text-lg font-bold">Import Staging</h2>
            <div className="h-4 w-[1px] bg-gray-300 dark:bg-gray-600 mx-2" />
            <span className="text-sm text-gray-500 font-medium">Scope: {step.title_key}</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Închide">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Sidebar: Controls & Structure */}
          <div className="w-full md:w-80 border-r dark:border-gray-700 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900/50 flex-shrink-0 max-h-[40vh] md:max-h-full">
            <div className="mb-6">
              <label className="block text-sm font-bold mb-2">1. Încarcă Fișier</label>
              {file || markdown ? (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                   <div className="flex items-center gap-2 overflow-hidden">
                      <CheckCircleIcon className="text-green-500 flex-shrink-0" size={20} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-sm text-gray-900 dark:text-white">{file?.name || 'Conținut importat'}</p>
                        {file && <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>}
                      </div>
                   </div>
                   <div className="flex items-center gap-2 ml-2">
                     <label htmlFor="import-file" className="cursor-pointer p-1.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md transition-colors" title="Schimbă fișierul">
                       <Replace size={16} />
                     </label>
                     <input type="file" accept={accept} onChange={onFileChange} id="import-file" className="hidden" />
                   </div>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-4 text-center bg-white dark:bg-gray-800 hover:border-primary-500 transition-colors">
                  <input type="file" accept={accept} onChange={onFileChange} id="import-file" className="hidden" />
                  <label htmlFor="import-file" className="cursor-pointer flex flex-col items-center">
                    {importing ? (
                      <>
                        <Loader2 className="animate-spin text-primary-600 mb-2" size={24} />
                        <p className="text-sm">Procesare...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="text-gray-400 mb-2" size={24} />
                        <p className="text-sm font-medium">Click sau Drag & Drop</p>
                        <p className="text-xs text-gray-500 mt-1">DOCX, PDF, PPTX, MD</p>
                      </>
                    )}
                  </label>
                </div>
              )}
            </div>

            {markdown && (
              <div className="mb-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <label className="block text-sm font-bold mb-2">2. Mod de Aplicare</label>
                <div className="space-y-2">
                  <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${mode === 'append' ? 'bg-primary-50 border-primary-500 ring-1 ring-primary-500' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                    <input type="radio" name="mode" className="mt-1" checked={mode === 'append'} onChange={() => setMode('append')} />
                    <div>
                      <span className="block text-sm font-medium">Append (Adaugă la final)</span>
                      <span className="text-xs text-gray-500">Păstrează conținutul actual și adaugă noul material la sfârșit.</span>
                    </div>
                  </label>
                  <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${mode === 'replace' ? 'bg-red-50 border-red-500 ring-1 ring-red-500' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                    <input type="radio" name="mode" className="mt-1" checked={mode === 'replace'} onChange={() => setMode('replace')} />
                    <div>
                      <span className="block text-sm font-medium text-red-700 dark:text-red-400">Replace (Înlocuiește)</span>
                      <span className="text-xs text-gray-500">Șterge tot conținutul din acest pas și îl înlocuiește cu importul.</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {structure.length > 0 && (
              <div className="mb-6 animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
                <div className="flex items-center gap-2 mb-2">
                  <LayoutList size={16} />
                  <label className="text-sm font-bold">Structură Detectată</label>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {structure.map((heading, i) => (
                    <div key={i} className="text-xs py-1 px-2 border-b dark:border-gray-700 last:border-0 truncate text-gray-600 dark:text-gray-300">
                      {heading.replace(/^#+\s/, '')}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Area: Diff / Preview */}
          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-900">
             <div className="border-b dark:border-gray-700 p-2 flex items-center justify-between bg-gray-50 dark:bg-gray-800">
               <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                 <button
                   onClick={() => setViewMode('diff')}
                   className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${viewMode === 'diff' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                 >
                   <GitCompare size={14} /> Diff View
                 </button>
                 <button
                   onClick={() => setViewMode('preview')}
                   className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${viewMode === 'preview' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                 >
                   <FileText size={14} /> Full Preview
                 </button>
               </div>
               {error && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full border border-red-200 dark:border-red-800">
                    <AlertTriangle size={14} /> <span className="text-xs font-medium">{error}</span>
                  </div>
                )}
             </div>

             <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {!markdown && !step.content ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                    <Upload size={48} className="mb-4" />
                    <p>Încarcă un fișier pentru a vedea diferențele</p>
                  </div>
                ) : viewMode === 'diff' ? (
                  <div className="font-mono text-sm space-y-0.5">
                    {diffChanges.map((change, idx) => (
                      <div key={idx} className={`flex ${
                        change.type === 'add' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-l-4 border-green-500' :
                        change.type === 'del' ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-l-4 border-red-500 decoration-slice line-through opacity-60' :
                        'text-gray-500 dark:text-gray-400 border-l-4 border-transparent pl-2'
                      } px-2 py-0.5`}>
                        <span className="select-none w-6 text-right mr-4 opacity-30 text-xs">{idx + 1}</span>
                        <span className="whitespace-pre-wrap break-all">{change.content || ' '}</span>
                      </div>
                    ))}
                    {diffChanges.length === 0 && <p className="text-gray-400 text-center py-10">Nicio modificare detectată</p>}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 h-full">
                    <div className="border rounded-lg p-4 overflow-y-auto">
                      <div className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Original</div>
                      <MarkdownPreview content={step.content || ''} />
                    </div>
                    <div className="border rounded-lg p-4 overflow-y-auto bg-gray-50 dark:bg-gray-800/50">
                      <div className="text-xs font-bold text-green-600 uppercase mb-2 tracking-wider">Rezultat</div>
                       <MarkdownPreview content={mode === 'replace' ? markdown : `${step.content || ''}\n\n${markdown}`} />
                    </div>
                  </div>
                )}
             </div>
          </div>
        </div>

        <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3 flex-shrink-0 z-10">
          <button onClick={onClose} className="px-4 py-2 rounded-md border bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors">Anulează</button>
          <button 
            onClick={onApply} 
            disabled={importing || !markdown} 
            className="px-6 py-2 rounded-md bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? <Loader2 className="animate-spin" size={18} /> : <Replace size={18} />}
            <span className="font-medium">Aplică Importul</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const CheckCircleIcon = ({ className, size }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);

export default ImportStagingModal;
