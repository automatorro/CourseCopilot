import { describe, it, expect } from 'vitest';
import { validateDurations, validateModulesConsistency, detectNonLocalizedFragments } from '../lib/outputValidators';

describe('outputValidators', () => {
  it('validateDurations detects mismatch', () => {
    const res = validateDurations(6, 5);
    expect(res.ok).toBe(false);
    expect(res.expected).toBe(6);
    expect(res.actual).toBe(5);
  });

  it('validateModulesConsistency finds missing modules', () => {
    const a = [{ id: '1', title: 'A', sections: [] }, { id: '2', title: 'B', sections: [] }];
    const b = [{ id: '1', title: 'A', sections: [] }];
    const res = validateModulesConsistency(a as any, b as any);
    expect(res.ok).toBe(false);
    expect(res.missingInB).toContain('B');
  });

  it('detectNonLocalizedFragments flags english text in RO', () => {
    const res = detectNonLocalizedFragments('This section requires context. Processing...', 'ro');
    expect(res.ok).toBe(false);
    expect(res.hints.length).toBeGreaterThan(0);
  });
});

