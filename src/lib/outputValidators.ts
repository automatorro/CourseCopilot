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

export const extractModuleTitles = (text: string): string[] => {
  const lines = text.split(/\r?\n/);
  const titles: string[] = [];
  const modRegex = /^(?:Modul(?:ul)?\s*)(\d+)\s*:\s*(.+)$/i;
  for (const line of lines) {
    const m = line.match(modRegex);
    if (m) {
      titles.push(m[2].trim());
    }
  }
  return titles;
};

export const compareModuleTitlesText = (aText: string, bText: string) => {
  const aTitles = extractModuleTitles(aText);
  const bTitles = extractModuleTitles(bText);
  const missingInB = aTitles.filter(n => !bTitles.includes(n));
  const extraInB = bTitles.filter(n => !aTitles.includes(n));
  return { ok: missingInB.length === 0 && extraInB.length === 0, missingInB, extraInB };
};

export const extractModuleDurations = (text: string): number[] => {
  const lines = text.split(/\r?\n/);
  const durations: number[] = [];
  const durRegex = /\((\d+)\s*(?:oră|ore)\)/i;
  for (const line of lines) {
    const m = line.match(durRegex);
    if (m) durations.push(parseInt(m[1], 10));
  }
  return durations;
};

export const validateDurationsArray = (structureDurations: number[], workbookDurations: number[]) => {
  const ok = structureDurations.length === workbookDurations.length && structureDurations.every((v, i) => v === workbookDurations[i]);
  return {
    ok,
    expected: structureDurations,
    actual: workbookDurations,
  };
};
