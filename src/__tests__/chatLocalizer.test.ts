import { describe, it, expect } from 'vitest';
import { detectChatLanguage } from '../lib/chatLocalizer';

describe('detectChatLanguage', () => {
  it('prefers course.language when available', () => {
    expect(detectChatLanguage('ro', undefined)).toBe('ro');
  });

  it('falls back to app language', () => {
    expect(detectChatLanguage(undefined, 'es')).toBe('es');
  });

  it('defaults to en when none provided', () => {
    expect(detectChatLanguage(undefined, undefined)).toBe('en');
  });
});

