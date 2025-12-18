import React, { useEffect, useState } from 'react'
import { X, Search, Loader2, UploadCloud, Link as LinkIcon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { uploadBlobToStorage } from '../services/imageService'
import { searchImages, ImageSearchResult } from '../services/imageSearchService'

type Props = {
  onClose: () => void
  onInsert: (url: string, alt?: string) => void
}

const ImageSearchModal: React.FC<Props> = ({ onClose, onInsert }) => {
  const { user } = useAuth()
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ImageSearchResult[]>([])
  const [alt, setAlt] = useState('Image')
  const [copyToStorage, setCopyToStorage] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const doSearch = async () => {
    if (!q.trim()) return
    setLoading(true)
    setError(null)
    try {
      const items = await searchImages(q.trim(), page)
      setResults(items)
    } catch (e: any) {
      setError(e?.message || 'Căutarea a eșuat')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
  }, [q])

  const handleInsert = async (item: ImageSearchResult) => {
    try {
      if (copyToStorage) {
        let blob: Blob
        try {
          const res = await fetch(item.url)
          if (!res.ok) throw new Error('Failed to fetch')
          blob = await res.blob()
        } catch {
          const proxied = `https://images.weserv.nl/?url=${encodeURIComponent(item.url)}&output=png`
          const res2 = await fetch(proxied)
          if (!res2.ok) throw new Error('Failed to fetch image')
          blob = await res2.blob()
        }
        const publicUrl = await uploadBlobToStorage(blob, user?.id || null, null, 'web-image')
        onInsert(publicUrl, alt || 'Image')
      } else {
        onInsert(item.url, alt || 'Image')
      }
      onClose()
    } catch (e: any) {
      setError(e?.message || 'Inserarea a eșuat')
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
      <div className="w-[95%] max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-xl ring-1 ring-black/5 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Image Search</h2>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Ex: architecture diagram"
              className="flex-1 px-3 py-2 text-sm rounded border dark:border-gray-700 bg-white dark:bg-gray-900"
            />
            <button onClick={doSearch} disabled={loading || !q.trim()} className="px-3 py-2 rounded bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={16}/> : <Search size={16}/>} Caută
            </button>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={copyToStorage} onChange={e => setCopyToStorage(e.target.checked)} />
              Copiază în Storage pentru stabilitate
            </label>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <UploadCloud size={14}/> URL public vs <LinkIcon size={14}/> Hotlink extern
            </div>
            <div className="ml-auto">
              <input value={alt} onChange={e => setAlt(e.target.value)} className="px-3 py-2 text-sm rounded border dark:border-gray-700 bg-white dark:bg-gray-900" placeholder="Alt text" />
            </div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto">
            {results.map((it, idx) => (
              <div key={idx} className="rounded border dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-900">
                <img src={it.thumb || it.url} alt="" className="w-full h-32 object-cover" />
                <div className="p-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-gray-500 truncate">{it.author || it.source || ''}</span>
                  <button onClick={() => handleInsert(it)} className="px-2 py-1 rounded bg-primary-600 text-white text-xs hover:bg-primary-700">Inserează</button>
                </div>
              </div>
            ))}
            {!loading && results.length === 0 && (
              <div className="col-span-full text-center text-sm text-gray-500">Introduce un termen și apasă Caută.</div>
            )}
            {loading && (
              <div className="col-span-full flex items-center justify-center py-6"><Loader2 className="animate-spin text-primary-500" size={24}/></div>
            )}
          </div>
          {results.length > 0 && (
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1 || loading} className="px-3 py-1.5 rounded border text-sm disabled:opacity-50">Prev</button>
              <span className="text-sm">Pagina {page}</span>
              <button onClick={() => { setPage(p => p + 1); doSearch() }} disabled={loading} className="px-3 py-1.5 rounded border text-sm">Next</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImageSearchModal
