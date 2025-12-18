import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
// Uses existing image generation service; uploads happen elsewhere in the app when needed.
import { generateImage } from '../services/imageAiService';

interface ImageStudioModalProps {
  onClose: () => void;
  onInsert: (url: string, alt?: string) => void;
}

const ImageStudioModal: React.FC<ImageStudioModalProps> = ({ onClose, onInsert }) => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('');
  const [size, setSize] = useState<number>(768);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [alt, setAlt] = useState('Image');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setPreviewUrl(null);
    try {
      const combinedPrompt = style ? `${prompt}. Style: ${style}` : prompt;
      const { blob } = await generateImage(combinedPrompt, { size });
      const tempUrl = URL.createObjectURL(blob);
      setPreviewUrl(tempUrl);
    } catch (err: any) {
      setError(err?.message || 'Generarea a eșuat.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsert = async () => {
    if (!previewUrl) return;
    // Trimite direct blob URL către insertImageAtCursor pentru a fi procesat ca token
    onInsert(previewUrl, alt || 'Image');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
      <div className="w-[95%] max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-xl ring-1 ring-black/5 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Image Studio</h2>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Prompt</label>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={4} className="w-full px-3 py-2 text-sm rounded border dark:border-gray-700 bg-white dark:bg-gray-900" placeholder="Ex: Diagramă simplă cu 3 cutii și săgeți" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Stil (opțional)</label>
              <input value={style} onChange={e => setStyle(e.target.value)} className="w-full px-3 py-2 text-sm rounded border dark:border-gray-700 bg-white dark:bg-gray-900" placeholder="minimal, flat, sketch, hand-drawn" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Dimensiune</label>
                <select value={size} onChange={e => setSize(Number(e.target.value))} className="w-full px-3 py-2 text-sm rounded border dark:border-gray-700 bg-white dark:bg-gray-900">
                  <option value={512}>512 x 512</option>
                  <option value={768}>768 x 768</option>
                  <option value={1024}>1024 x 1024</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Alt text</label>
                <input value={alt} onChange={e => setAlt(e.target.value)} className="w-full px-3 py-2 text-sm rounded border dark:border-gray-700 bg-white dark:bg-gray-900" placeholder="Image" />
              </div>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button onClick={handleGenerate} disabled={!prompt || isGenerating} className="px-3 py-1.5 text-sm rounded bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
                {isGenerating ? (<span className="inline-flex items-center gap-1"><Loader2 className="animate-spin" size={16}/> Generare...</span>) : 'Generează'}
              </button>
              <button onClick={onClose} className="px-3 py-1.5 text-sm rounded border dark:border-gray-700">Închide</button>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Imaginile generate se salvează în Supabase Storage și se inserează ca URL public.</p>
          </div>
          <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg min-h-[220px]">
            {previewUrl ? (
              <div className="w-full">
                <img src={previewUrl} alt="Preview" className="max-w-full h-auto rounded" />
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={handleInsert} className="px-3 py-1.5 text-sm rounded bg-primary-600 text-white hover:bg-primary-700">Inserează în editor</button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Completează promptul și apasă „Generează”.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageStudioModal;