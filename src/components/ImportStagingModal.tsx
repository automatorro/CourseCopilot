import React, { useState } from 'react';
import { Upload, X, Loader2, AlertTriangle, FileText, Replace } from 'lucide-react';
import { CourseStep } from '../types';
import MarkdownPreview from './MarkdownPreview';
import { normalizeFileToMarkdown, applyImportToStep } from '../services/importService';

type Props = { isOpen: boolean; onClose: () => void; step: CourseStep; onApplied: () => void };

const ImportStagingModal: React.FC<Props> = ({ isOpen, onClose, step, onApplied }) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string>('');
  const [mode, setMode] = useState<'append' | 'replace'>('append');
  const accept = '.docx,.pdf,.md,.markdown,.html,.txt,.pptx';

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
    setMarkdown(res.markdown || '');
    setImporting(false);
  };

  const onApply = async () => {
    if (!markdown.trim()) { setError('Conținutul importat este gol'); return; }
    setImporting(true);
    const res = await applyImportToStep(step.id, mode, markdown, step.content || '');
    setImporting(false);
    if (!res.ok) { setError(res.error || 'Aplicarea importului a eșuat'); return; }
    onApplied();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl">
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={20} />
            <h2 className="text-lg font-bold">Import Staging</h2>
            <span className="ml-2 text-xs text-gray-500">Scope: {step.title_key}</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Închide">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Fișier</label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input type="file" accept={accept} onChange={onFileChange} id="import-file" className="hidden" />
              <label htmlFor="import-file" className="cursor-pointer flex flex-col items-center">
                {file ? (
                  <>
                    <Upload className="text-primary-600 mb-2" size={36} />
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </>
                ) : importing ? (
                  <>
                    <Loader2 className="animate-spin text-primary-600 mb-2" size={36} />
                    <p className="text-sm">Procesare...</p>
                  </>
                ) : (
                  <>
                    <Upload className="text-gray-400 mb-2" size={36} />
                    <p className="text-sm font-medium">Click pentru upload sau drag & drop</p>
                    <p className="text-xs text-gray-500">Acceptat: DOCX, PPTX, PDF (text), MD, HTML, TXT</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600"><AlertTriangle size={18} /> <span className="text-sm">{error}</span></div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-lg border dark:border-gray-700">
              <div className="p-2 border-b dark:border-gray-700 text-sm font-semibold">Conținut existent</div>
              <div className="p-4">
                <MarkdownPreview content={step.content || ''} />
              </div>
            </div>
            <div className="rounded-lg border dark:border-gray-700">
              <div className="p-2 border-b dark:border-gray-700 text-sm font-semibold">Conținut importat</div>
              <div className="p-4">
                {markdown ? <MarkdownPreview content={markdown} /> : <p className="text-sm text-gray-500">Încărcați un fișier pentru previzualizare</p>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input type="radio" id="mode-append" checked={mode === 'append'} onChange={() => setMode('append')} />
              <label htmlFor="mode-append" className="text-sm">Append</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="radio" id="mode-replace" checked={mode === 'replace'} onChange={() => setMode('replace')} />
              <label htmlFor="mode-replace" className="text-sm">Replace (scoped)</label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-md border">Anulează</button>
            <button onClick={onApply} disabled={importing || !markdown} className="px-4 py-2 rounded-md bg-primary-600 text-white flex items-center gap-2">
              {importing ? <Loader2 className="animate-spin" size={16} /> : <Replace size={16} />}
              Aplică importul
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportStagingModal;
