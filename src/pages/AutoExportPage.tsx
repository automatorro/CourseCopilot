import React, { useEffect, useState } from 'react';
import { exportCourseAsPptx } from '../services/exportService';
import { Course, CourseStep, GenerationEnvironment } from '../types';

const mkStep = (courseId: string, userId: string, key: string, content: string, order: number): CourseStep => ({
  id: `${key}-${order}`,
  course_id: courseId,
  user_id: userId,
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

const buildCourse = (id: string, title: string, subject: string, slidesContent: string): Course => ({
  id,
  user_id: 'user-preview',
  title,
  subject,
  target_audience: 'Preview',
  environment: GenerationEnvironment.Corporate,
  language: 'ro',
  progress: 100,
  created_at: new Date().toISOString(),
  steps: [
    mkStep(id, 'user-preview', 'structure', 'Module 1: Introducere\nModule 2: Practică', 0),
    mkStep(id, 'user-preview', 'livrables.slides', slidesContent, 1),
  ],
  blueprint: null as any,
});

const AutoExportPage: React.FC = () => {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>('');

  const doExport = async () => {
    setBusy(true);
    setStatus('Generez PPTX pentru Marketing…');
    await exportCourseAsPptx(buildCourse('course-marketing', 'Marketing Online', 'Marketing', marketingSlidesContent));
    setStatus('Generez PPTX pentru Schimbarea…');
    await exportCourseAsPptx(buildCourse('course-schimbarea', 'Schimbarea', 'Change Management', schimbareaSlidesContent));
    setStatus('Fișiere generate. Verifică folderul descărcărilor (browser).');
    setBusy(false);
  };

  useEffect(() => {
    void doExport();
  }, []);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-4">Auto Export PPTX (Preview)</h1>
      <p className="mb-2 text-sm text-gray-600">Se va genera automat două fișiere PPTX (Marketing și Schimbarea) folosind parserul nou.</p>
      <div className="flex gap-3 mb-4">
        <button disabled={busy} onClick={doExport} className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50">Regenerează PPTX</button>
      </div>
      <div className="text-sm">{status}</div>
    </div>
  );
};

export default AutoExportPage;
