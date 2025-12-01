import { describe, it, expect } from 'vitest';
import { FEATURE_FLAGS, isEnabled } from '../config/featureFlags';

describe('Feature Flags', () => {
  it('should have all optional features enabled by default', () => {
    expect(FEATURE_FLAGS.localizedChat).toBe(true);
    expect(FEATURE_FLAGS.adaptiveGreeting).toBe(true);
    expect(FEATURE_FLAGS.languageDetector).toBe(true);
    expect(FEATURE_FLAGS.editorUiUnified).toBe(true);
  });

  it('isEnabled returns current flag value', () => {
    Object.entries(FEATURE_FLAGS).forEach(([key, value]) => {
      expect(isEnabled(key as any)).toBe(value);
    });
  });
});

