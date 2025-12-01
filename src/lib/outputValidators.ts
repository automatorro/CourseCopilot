export type BlueprintModule = {
  id: string;
  title: string;
  sections: { id: string; title: string }[];
};

export const validateDurations = (structureHours: number, workbookHours: number) => {
  return {
    ok: structureHours === workbookHours,
    expected: structureHours,
    actual: workbookHours,
  };
};

export const validateModulesConsistency = (a: BlueprintModule[], b: BlueprintModule[]) => {
  const namesA = a.map(m => m.title.trim());
  const namesB = b.map(m => m.title.trim());
  const missingInB = namesA.filter(n => !namesB.includes(n));
  const extraInB = namesB.filter(n => !namesA.includes(n));
  return {
    ok: missingInB.length === 0 && extraInB.length === 0,
    missingInB,
    extraInB,
  };
};

export const detectNonLocalizedFragments = (text: string, languageCode: string) => {
  const englishHints = [/This section/, /I can, however/, /Generation Paused/, /Processing\.\.\./];
  const hits = englishHints.filter(r => r.test(text));
  return {
    ok: hits.length === 0,
    hints: hits.map(r => r.source),
    language: languageCode,
  };
};

