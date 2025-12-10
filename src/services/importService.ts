import TurndownService from 'turndown';
import { supabase } from './supabaseClient';

async function parseDocx(arrayBuffer: ArrayBuffer): Promise<string> {
  type MammothModule = { convertToHtml: (args: { arrayBuffer: ArrayBuffer }) => Promise<{ value?: string }> };
  const mammothLib = (await import('mammoth')) as unknown as MammothModule;
  const result = await mammothLib.convertToHtml({ arrayBuffer });
  const html: string = result.value || '';
  const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
  td.keep(['img']);
  return td.turndown(html);
}

async function parsePdf(arrayBuffer: ArrayBuffer): Promise<string> {
  type PdfTextItem = { str: string };
  type PdfTextContent = { items: PdfTextItem[] };
  type PdfPage = { getTextContent: () => Promise<PdfTextContent> };
  type PdfDocument = { numPages: number; getPage: (i: number) => Promise<PdfPage> };
  type PdfJsModule = {
    version: string;
    GlobalWorkerOptions: { workerSrc: string };
    getDocument: (args: { data: ArrayBuffer }) => { promise: Promise<PdfDocument> };
  };
  const pdfjsLib = (await import('pdfjs-dist')) as unknown as PdfJsModule;
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: PdfTextItem) => item.str).join(' ');
    fullText += pageText + '\n\n';
  }
  return fullText;
}

async function parseHtmlToMarkdown(html: string): Promise<string> {
  const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
  td.keep(['img']);
  return td.turndown(html);
}

export async function normalizeFileToMarkdown(file: File): Promise<{ ok: boolean; markdown?: string; error?: string }> {
  try {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const buf = await file.arrayBuffer();
    if (['md', 'markdown', 'txt'].includes(ext)) {
      const text = new TextDecoder().decode(new Uint8Array(buf));
      return { ok: true, markdown: text };
    }
    if (ext === 'html') {
      const html = new TextDecoder().decode(new Uint8Array(buf));
      const md = await parseHtmlToMarkdown(html);
      return { ok: true, markdown: md };
    }
    if (ext === 'docx') {
      const md = await parseDocx(buf);
      return { ok: true, markdown: md };
    }
    if (ext === 'pdf') {
      const text = await parsePdf(buf);
      if (!text.trim()) return { ok: false, error: 'PDF nu conține text selectabil' };
      return { ok: true, markdown: text };
    }
    if (ext === 'pptx') {
      const md = await parsePptx(buf);
      return { ok: true, markdown: md };
    }
    return { ok: false, error: 'Unsupported file type. Use DOCX, PDF (text), HTML, MD or TXT.' };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg || 'Failed to process file' };
  }
}

export async function applyImportToStep(stepId: string, mode: 'append' | 'replace', imported: string, current: string): Promise<{ ok: boolean; error?: string }> {
  const next = mode === 'replace' ? imported : `${current}${current.endsWith('\n') ? '' : '\n\n'}${imported}`;
  const { error } = await supabase
    .from('course_steps')
    .update({ content: next })
    .eq('id', stepId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function parsePptx(arrayBuffer: ArrayBuffer): Promise<string> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(arrayBuffer);
  const slideEntries = Object.keys(zip.files)
    .filter(k => /^ppt\/slides\/slide\d+\.xml$/.test(k))
    .map(k => ({ key: k, idx: parseInt(k.match(/slide(\d+)\.xml$/)![1], 10) }))
    .sort((a, b) => a.idx - b.idx);
  const notesEntries = Object.keys(zip.files)
    .filter(k => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(k))
    .map(k => ({ key: k, idx: parseInt(k.match(/notesSlide(\d+)\.xml$/)![1], 10) }))
    .reduce<Record<number, string>>((acc, e) => { acc[e.idx] = e.key; return acc; }, {});
  let out = '';
  for (const s of slideEntries) {
    const xml = await zip.file(s.key)!.async('string');
    const text = Array.from(xml.matchAll(/<a:t>([^<]+)<\/a:t>/g)).map(m => m[1]).join('\n').trim();
    const lines = text.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
    const title = lines[0] || `Slide ${s.idx}`;
    const bullets = lines.slice(1);
    out += `\n\n## ${title}\n`;
    for (const b of bullets) out += `- ${b}\n`;
    const notesKey = notesEntries[s.idx];
    if (notesKey) {
      const nxml = await zip.file(notesKey)!.async('string');
      const ntext = Array.from(nxml.matchAll(/<a:t>([^<]+)<\/a:t>/g)).map(m => m[1]).join(' ').trim();
      if (ntext) out += `\n> Hint: ${ntext}\n`;
    }
  }
  return out.trim();
}

