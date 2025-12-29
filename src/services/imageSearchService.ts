import { supabase } from './supabaseClient';

export type ImageSearchResult = {
  url: string
  thumb: string
  author?: string
  source?: string
  link?: string
}

export const searchImages = async (query: string, page = 1): Promise<ImageSearchResult[]> => {
  try {
    // Try the new Unsplash Edge Function first
    const { data, error } = await supabase.functions.invoke('unsplash-search', {
      body: { query, page, per_page: 20 }
    })
    
    if (!error && data && Array.isArray(data.results)) {
        return data.results.map((r: any) => ({
            url: r.urls.regular,
            thumb: r.urls.small,
            author: r.user.name,
            source: 'Unsplash',
            link: r.links.html
        }));
    }
  } catch (e) {
    console.warn('Unsplash search failed, falling back to Lexica', e);
  }

  // Fallback to Lexica (existing logic)
  const baseUrl = `https://lexica.art/api/v1/search?q=${encodeURIComponent(query)}&page=${page}`
  const tryFetchJson = async (u: string) => {
    const res = await fetch(u, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  }
  let json: any = null
  try {
    json = await tryFetchJson(baseUrl)
  } catch {}
  if (!json) {
    const proxied = `https://cors.isomorphic-git.org/${baseUrl}`
    try {
      json = await tryFetchJson(proxied)
    } catch {}
  }
  const items: any[] = Array.isArray(json?.images) ? json.images : []
  return items.map(it => ({
    url: it.src || '',
    thumb: it.srcSmall || it.src || '',
    author: it.prompt ? 'Lexica' : undefined,
    source: 'Lexica',
    link: it.src || undefined
  })).filter(x => x.url)
}
