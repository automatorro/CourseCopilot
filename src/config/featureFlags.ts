export type FeatureFlagKey =
  | 'localizedChat'
  | 'adaptiveGreeting'
  | 'languageDetector'
  | 'editorUiUnified';

export const FEATURE_FLAGS: Record<FeatureFlagKey, boolean> = {
  localizedChat: true,
  adaptiveGreeting: true,
  languageDetector: true,
  editorUiUnified: true,
};

export const FEATURE_DOCS: Record<FeatureFlagKey, string> = {
  localizedChat: 'Extinde chat-ul de onboarding pentru a afișa mesajele în limba cursului (ISO).',
  adaptiveGreeting: 'Evită redundanța: dacă există obiective în modal, chat-ul sare direct la următoarea clarificare.',
  languageDetector: 'Detector simplu: preferă course.language, apoi limba UI, apoi navigator.language.',
  editorUiUnified: 'Uniformizează clasele și stilurile editorului cu modalele premium (culori, raioane, umbre).',
};

export const isEnabled = (key: FeatureFlagKey): boolean => FEATURE_FLAGS[key];

