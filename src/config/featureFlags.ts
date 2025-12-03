export type FeatureFlagKey =
  | 'localizedChat'
  | 'adaptiveGreeting'
  | 'languageDetector'
  | 'editorUiUnified'
  | 'validationStrictLocalization'
  | 'blueprintRefineEnabled'
  | 'editorGenerateButtonEnabled';

export const FEATURE_FLAGS: Record<FeatureFlagKey, boolean> = {
  localizedChat: true,
  adaptiveGreeting: true,
  languageDetector: true,
  editorUiUnified: true,
  validationStrictLocalization: false,
  blueprintRefineEnabled: false,
  editorGenerateButtonEnabled: false,
};

export const FEATURE_DOCS: Record<FeatureFlagKey, string> = {
  localizedChat: 'Extinde chat-ul de onboarding pentru a afișa mesajele în limba cursului (ISO).',
  adaptiveGreeting: 'Evită redundanța: dacă există obiective în modal, chat-ul sare direct la următoarea clarificare.',
  languageDetector: 'Detector simplu: preferă course.language, apoi limba UI, apoi navigator.language.',
  editorUiUnified: 'Uniformizează clasele și stilurile editorului cu modalele premium (culori, raioane, umbre).',
  validationStrictLocalization: 'Dacă este activ, livrabilele cu fragmente nelocalizate vor bloca finalizarea generării.',
  blueprintRefineEnabled: 'Controlează afișarea butonului „Rafinează cu AI” în Review Blueprint.',
  editorGenerateButtonEnabled: 'Controlează afișarea butonului „Generează Conținut” din editor.',
};

export const isEnabled = (key: FeatureFlagKey): boolean => FEATURE_FLAGS[key];
