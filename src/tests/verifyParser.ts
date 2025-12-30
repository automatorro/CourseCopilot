import { __debugParseContentSections } from '../services/exportService.ts';

const marketingSample = `
Slide nr: 1: Marketing Online Reușit
- **Titlu:** Marketing Online Reușit: Ghid pentru Administratori și Solopreneuri
- **Subtitlu:** Transformă prezența ta digitală în rezultate concrete.
- **Imagine Sugerată:** O imagine dinamică ce combină elemente digitale...
Text:
- Obiectivele cursului
- Public țintă
- Beneficii cheie

Slide nr: 2: Campanii de Publicitate
- **Titlu:** Campanii de Publicitate Plătită
- **Subtitlu:** Google Ads/Facebook Ads
Visual: business advertising analytics dashboard
Text:
1. Ce sunt campaniile plătite
2. Măsurarea performanței
3. Optimizare continuă
`;

const schimbareaSample = `
Slide nr: 1: Introducere
Visual: people teamwork change
Text:
- Ce este schimbarea?
- De ce e importantă?
Speaker Notes: ignoră complet

Slide nr: 2: Modele de schimbare
Text:
- Modelul Lewin
- ADKAR
- Kotter (8 Pași)
`;

const check = (name: string, sample: string, expectedCount: number) => {
  const sections = __debugParseContentSections(sample);
  console.log(`[${name}] sections=${sections.length}`);
  sections.forEach((s, i) => {
    console.log(`#${i + 1} title="${s.title}" bullets=${s.bulletPoints.length} visual="${s.visualSearchTerm || ''}"`);
  });
  if (sections.length !== expectedCount) {
    process.exitCode = 1;
    console.error(`Expected ${expectedCount}, got ${sections.length}`);
  }
};

check('marketing', marketingSample, 2);
check('schimbarea', schimbareaSample, 2);

console.log('Parser verification complete.');
