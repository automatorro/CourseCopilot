import { isEnabled } from '../config/featureFlags';

export const detectChatLanguage = (
  courseLanguage?: string,
  appLanguage?: string
): string => {
  if (!isEnabled('languageDetector')) {
    return (courseLanguage || appLanguage || 'en').toLowerCase();
  }
  const fromCourse = courseLanguage?.toLowerCase();
  if (fromCourse) return fromCourse;
  const fromApp = appLanguage?.toLowerCase();
  if (fromApp) return fromApp;
  const nav = typeof navigator !== 'undefined' ? navigator.language?.slice(0, 2) : undefined;
  return (nav || 'en').toLowerCase();
};

