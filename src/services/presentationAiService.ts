import { supabase } from './supabaseClient';

export interface SlideDesignJSON {
  layout: 'HERO' | 'SPLIT_LEFT' | 'SPLIT_RIGHT' | 'BIG_STAT' | 'COMPARISON' | 'QUOTATION' | 'TRIAD' | 'TIMELINE' | 'FULL_IMAGE' | 'GRID_CARDS' | 'IMAGE_CENTER' | 'THREE_COLUMNS' | 'DEFAULT';
  title: string;
  content: string[];
  imagePrompt: string;
  accentColor?: string;
}

export const analyzeSlideContent = async (content: string): Promise<SlideDesignJSON> => {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-slide', {
      body: { content }
    });

    if (error) {
      console.warn('AI Analysis failed (likely missing API Key or Server Error), falling back to default:', error);
      return getDefaultDesign(content);
    }

    return data as SlideDesignJSON;
  } catch (e) {
    console.warn('Exception analyzing slide, falling back to smart fallback:', e);
    return getSmartFallbackDesign(content);
  }
};

const getDefaultDesign = (content: string): SlideDesignJSON => {
  return getSmartFallbackDesign(content);
};

// Global counter for fallback rotation
let fallbackCounter = 0;

export const getSmartFallbackDesign = (content: string): SlideDesignJSON => {
  // Extended layout rotation for variety
  const layouts: SlideDesignJSON['layout'][] = [
      'HERO', 
      'SPLIT_LEFT', 
      'SPLIT_RIGHT', 
      'TRIAD', 
      'FULL_IMAGE', 
      'GRID_CARDS', 
      'IMAGE_CENTER',
      'THREE_COLUMNS',
      'BIG_STAT', 
      'QUOTATION', 
      'COMPARISON',
      'TIMELINE'
  ];
  const layout = layouts[fallbackCounter % layouts.length];
  fallbackCounter++;

  const title = extractTitle(content);
  
  return {
    layout: layout,
    title: title,
    content: [content], // Or parse bullets if possible
    imagePrompt: title || 'business professional', // Use title as prompt if no better option
    accentColor: '#1E3A8A'
  };
};

const extractTitle = (content: string): string => {
  const match = content.match(/^##\s+(.+)$/m) || content.match(/^#\s+(.+)$/m);
  return match ? match[1] : 'Slide Title';
};
