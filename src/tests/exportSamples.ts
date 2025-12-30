import './nodePolyfills';
import { exportCourseAsPptx } from '../services/exportService.ts';
import { Course, CourseStep, GenerationEnvironment } from '../types';

const mkStep = (key: string, content: string, order: number): CourseStep => ({
  id: `${key}-${order}`,
  course_id: 'course-marketing',
  user_id: 'user-1',
  title_key: key,
  content,
  is_completed: true,
  step_order: order,
  created_at: new Date().toISOString(),
});

const marketingSlidesContent = `
Slide nr: 1: Marketing Online Reușit
Visual: digital marketing small business
Text:
- Obiectivele cursului
- Public țintă
- Beneficii cheie

Slide nr: 2: Campanii de Publicitate Plătită
Visual: advertising dashboard analytics
Text:
1. Ce sunt campaniile plătite
2. Măsurarea performanței
3. Optimizare continuă
`;

const schimbareaSlidesContent = `
Slide nr: 1: Modelele de Schimbare
Visual: people teamwork change
Text:
- Lewin 3 pași
- Kotter (8 pași)
- ADKAR

Slide nr: 2: Recapitulare
Text:
- Mulțumim pentru participare
- Continuați cu proiectele practice
- Aplicați tehnicile în 48h
`;

const marketingCourse: Course = {
  id: 'course-marketing',
  user_id: 'user-1',
  title: 'Marketing Online',
  subject: 'Marketing',
  target_audience: 'Administratori și Solopreneuri',
  environment: GenerationEnvironment.Corporate,
  language: 'ro',
  progress: 100,
  created_at: new Date().toISOString(),
  steps: [
    mkStep('structure', 'Module 1: Introducere\nModule 2: Campanii', 0),
    mkStep('livrables.slides', marketingSlidesContent, 1),
  ],
  blueprint: null as any,
};

const schimbareaCourse: Course = {
  id: 'course-schimbarea',
  user_id: 'user-1',
  title: 'Schimbarea',
  subject: 'Managementul schimbării',
  target_audience: 'Manageri',
  environment: GenerationEnvironment.Corporate,
  language: 'ro',
  progress: 100,
  created_at: new Date().toISOString(),
  steps: [
    mkStep('structure', 'Module 1: Modele\nModule 2: Practică', 0),
    mkStep('livrables.slides', schimbareaSlidesContent, 1),
  ],
  blueprint: null as any,
};

async function run() {
  console.log('Export Marketing...');
  await exportCourseAsPptx(marketingCourse);
  console.log('Export Schimbarea...');
  await exportCourseAsPptx(schimbareaCourse);
  console.log('Done. Files should be in the project directory.');
}

run().catch((e) => {
  console.error('Export error', e);
  process.exitCode = 1;
});
