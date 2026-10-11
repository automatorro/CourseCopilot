import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Coffee,
  Compass,
  FileText,
  MapPin,
  BookOpen,
  Presentation,
  Quote,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { useTranslation } from '../contexts/I18nContext';

type DemoStep = 1 | 2 | 3;
export type LandingArtifact = 'guide' | 'manual' | 'slides' | 'exercise' | 'flow';

const demoArtifacts = [
  { icon: FileText, key: 'guide' },
  { icon: BookOpen, key: 'manual' },
  { icon: Presentation, key: 'slides' },
  { icon: FileText, key: 'exercise' },
  { icon: Compass, key: 'flow' },
];

export const CourseCopilotDemoVideo: React.FC = () => {
  const { t } = useTranslation();
  const fullText = String(t('landing.redesign.demo.subject', { defaultValue: 'Leadership under pressure & direct communication' }));
  const [step, setStep] = useState<DemoStep>(1);
  const [typedSubject, setTypedSubject] = useState('');

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches) {
      setTypedSubject(fullText);
      setStep(3);
      return;
    }

    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = (Date.now() - startedAt) % 30000;
      if (elapsed < 4000) {
        setStep(1);
        setTypedSubject(fullText.slice(0, Math.min(fullText.length, Math.floor(elapsed / 75))));
      } else if (elapsed < 7500) {
        setStep(1);
        setTypedSubject(fullText);
      } else if (elapsed < 12500) {
        setStep(2);
        setTypedSubject(fullText);
      } else {
        setStep(3);
        setTypedSubject(fullText);
      }
    }, 60);

    return () => window.clearInterval(interval);
  }, [fullText]);

  return (
    <div className="section-dark w-full border border-hairline shadow-premium overflow-hidden" aria-label={t('landing.redesign.demo.aria', { defaultValue: 'Animated preview of a course being designed' })}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-2 font-mono text-[10px] text-stone sm:text-xs">coursecopilot.app / studio</span>
        </div>
        <span className="mono-eyebrow border border-hairline px-2 py-1 text-[9px] text-gold sm:text-[10px]">
          {t(`landing.redesign.demo.step${step}`, { defaultValue: ['Configure course', 'Designing course architecture', 'Course package ready'][step - 1] })}
        </span>
      </div>

      <div className="grid gap-4 p-4 sm:gap-5 sm:p-5 md:grid-cols-[0.9fr_1.1fr]">
        <div className="flex min-w-0 flex-col justify-between gap-5 border border-hairline bg-paper-alt/50 p-4">
          <div className="space-y-3">
            <p className="mono-eyebrow text-[9px] text-stone">{t('landing.redesign.demo.inputs', { defaultValue: 'Course parameters' })}</p>
            <div>
              <p className="mb-1 font-mono text-[10px] text-stone">{t('landing.redesign.demo.subjectLabel', { defaultValue: 'Subject' })}</p>
              <div className="flex min-h-10 items-center border border-hairline bg-paper px-2.5 py-2 font-mono text-[10px] leading-relaxed text-graphite sm:text-[11px]">
                <span className="break-words">{typedSubject}</span>
                {step === 1 && <span className="ml-1 h-4 w-1.5 shrink-0 animate-pulse bg-gold motion-reduce:animate-none" />}
              </div>
            </div>
            <div>
              <p className="mb-1 font-mono text-[10px] text-stone">{t('landing.redesign.demo.audienceLabel', { defaultValue: 'Audience' })}</p>
              <div className="border border-hairline bg-paper px-2.5 py-2 font-mono text-[10px] leading-relaxed text-graphite sm:text-[11px]">
                {t('landing.redesign.demo.audience', { defaultValue: 'Managers, team leads · intermediate' })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="border border-hairline bg-paper px-2.5 py-2">
                <p className="mb-1 font-mono text-[10px] text-stone">{t('landing.redesign.demo.toneLabel', { defaultValue: 'Tone' })}</p>
                <p className="font-mono text-[10px] text-graphite">{t('landing.redesign.demo.tone', { defaultValue: 'Practical, direct' })}</p>
              </div>
              <div className="border border-hairline bg-paper px-2.5 py-2">
                <p className="mb-1 font-mono text-[10px] text-stone">{t('landing.redesign.demo.durationLabel', { defaultValue: 'Duration' })}</p>
                <p className="font-mono text-[10px] text-graphite">{t('landing.redesign.demo.duration', { defaultValue: '1 day · 8 hours' })}</p>
              </div>
            </div>
          </div>

          <div className="flex min-h-10 items-center justify-center gap-2 border border-gold-dim bg-gold px-3 py-2 text-center font-mono text-[10px] font-semibold uppercase text-gold-fg">
            {step === 2 ? <Sparkles size={14} className="animate-spin motion-reduce:animate-none" /> : step === 3 ? <CheckCircle2 size={14} /> : <span>{t('landing.redesign.demo.start', { defaultValue: 'Build the course' })}</span>}
            {step === 2 && <span>{t('landing.redesign.demo.generating', { defaultValue: 'Building five artefacts...' })}</span>}
            {step === 3 && <span>{t('landing.redesign.demo.complete', { defaultValue: 'Course package ready' })}</span>}
          </div>
        </div>

        <div className="flex min-h-[250px] min-w-0 flex-col justify-center border border-dashed border-hairline bg-paper/30 p-4 sm:p-5">
          {step < 3 ? (
            <div className="mx-auto max-w-xs text-center">
              <Sparkles size={30} className={`mx-auto mb-3 ${step === 2 ? 'animate-pulse text-gold motion-reduce:animate-none' : 'text-stone'}`} />
              <p className="font-mono text-xs leading-relaxed text-stone">
                {step === 2
                  ? t('landing.redesign.demo.generatingMessage', { defaultValue: 'Structuring trainer scripts, exercises and the room flow...' })
                  : t('landing.redesign.demo.waiting', { defaultValue: 'Course materials will appear here.' })}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="mono-eyebrow text-[9px] text-gold">{t('landing.redesign.demo.files', { defaultValue: 'Five trainer artefacts' })}</span>
                <span className="font-mono text-[9px] text-stone">{t('landing.redesign.demo.editable', { defaultValue: 'Editable · print-ready' })}</span>
              </div>
              {demoArtifacts.map(({ icon: Icon, key }, index) => (
                <div key={key} className="flex min-w-0 items-center gap-2.5 border-b border-hairline pb-2 last:border-b-0 last:pb-0">
                  <Icon size={14} className="shrink-0 text-gold" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-graphite">{String(index + 1).padStart(2, '0')}. {t(`landing.redesign.output.${key}.title`, { defaultValue: key })}</span>
                  <CheckCircle2 size={12} className="shrink-0 text-gold" aria-hidden="true" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface LandingDeliverableCardProps {
  artifact: LandingArtifact;
}

export const LandingDeliverableCard: React.FC<LandingDeliverableCardProps> = ({ artifact }) => {
  const { t } = useTranslation();
  const key = `landing.redesign.output.${artifact}`;
  const title = t(`${key}.title`, { defaultValue: artifact });
  const badge = t(`${key}.badge`, { defaultValue: 'COURSE MATERIAL' });

  return (
    <article className="overflow-hidden rounded-md border border-hairline bg-paper shadow-premium">
      <header className="flex items-center justify-between gap-3 border-b border-hairline bg-paper-alt px-4 py-3">
        <span className="mono-eyebrow text-[9px] text-gold">{badge}</span>
        <span className="font-mono text-[10px] text-stone">{title}</span>
      </header>
      <div className="p-4 sm:p-5">
        {artifact === 'guide' && (
          <div className="min-h-[190px]">
            <p className="mb-4 inline-flex border border-gold-dim px-2 py-1 font-mono text-[10px] font-semibold text-gold">{t(`${key}.time`, { defaultValue: '10:00 (5m)' })}</p>
            <h3 className="mb-3 font-display text-xl text-graphite">{t(`${key}.heading`, { defaultValue: 'Open module 2' })}</h3>
            <div className="border-l-2 border-gold pl-3">
              <Quote size={14} className="mb-1 text-gold" aria-hidden="true" />
              <p className="font-mono text-xs leading-relaxed text-graphite">“{t(`${key}.dialogue`, { defaultValue: 'Which sentence names the person, and which names the behaviour?' })}”</p>
            </div>
          </div>
        )}

        {artifact === 'manual' && (
          <div className="min-h-[190px]">
            <p className="mono-eyebrow mb-4">{t(`${key}.module`, { defaultValue: 'MODULE 2 · PRACTICE' })}</p>
            <p className="mb-3 font-display text-lg text-graphite">{t(`${key}.prompt`, { defaultValue: 'Draft your opening sentence.' })}</p>
            <div className="space-y-2 font-mono text-xs text-stone">
              <p>{t(`${key}.fact`, { defaultValue: 'Fact' })} <span className="text-gold">___________________</span></p>
              <p>{t(`${key}.impact`, { defaultValue: 'Impact' })} <span className="text-gold">_________________</span></p>
              <p>{t(`${key}.question`, { defaultValue: 'Question' })} <span className="text-gold">______________</span></p>
            </div>
            <p className="mt-4 border-t border-hairline pt-3 font-mono text-[10px] leading-relaxed text-stone">{t(`${key}.reflection`, { defaultValue: 'Pause for seven seconds. Notice what changes.' })}</p>
          </div>
        )}

        {artifact === 'slides' && (
          <div className="min-h-[190px]">
            <div className="aspect-video border border-hairline bg-paper-alt p-3 sm:p-4">
              <p className="mono-eyebrow mb-2 text-[9px]">{t(`${key}.number`, { defaultValue: 'SLIDE 12' })}</p>
              <h3 className="mb-3 font-display text-base text-graphite sm:text-lg">{t(`${key}.slideTitle`, { defaultValue: 'Fact vs. character' })}</h3>
              <div className="grid grid-cols-2 gap-2 font-mono text-[9px] text-graphite sm:text-[10px]">
                <p className="border-l border-gold pl-2">{t(`${key}.fact`, { defaultValue: 'Yesterday at 3pm, you sent the reply-all.' })}</p>
                <p className="border-l border-hairline pl-2">{t(`${key}.label`, { defaultValue: 'You are careless.' })}</p>
              </div>
            </div>
            <div className="mt-2 border-l-2 border-gold bg-paper-alt px-3 py-2">
              <p className="mono-eyebrow mb-1 text-[9px]">{t(`${key}.notesLabel`, { defaultValue: 'SPEAKER NOTES' })}</p>
              <p className="font-mono text-[10px] leading-relaxed text-stone">{t(`${key}.notes`, { defaultValue: 'Give the room 20 seconds to reflect.' })}</p>
            </div>
          </div>
        )}

        {artifact === 'exercise' && (
          <div className="min-h-[190px]">
            <p className="mono-eyebrow mb-3">{t(`${key}.frontLabel`, { defaultValue: 'FRONT · ROLEPLAY SCENARIO' })}</p>
            <div className="border-y border-hairline py-3">
              <h3 className="mb-2 font-display text-lg text-graphite">{t(`${key}.frontTitle`, { defaultValue: 'EXERCISE 3 · 15 MIN · PAIRS' })}</h3>
              <p className="font-mono text-xs leading-relaxed text-stone">{t(`${key}.scenario`, { defaultValue: 'Practise a one-to-one conversation that redirects a behaviour.' })}</p>
            </div>
            <div className="mt-3 border-l-2 border-gold bg-paper-alt px-3 py-2">
              <p className="mono-eyebrow mb-1 text-[9px] text-gold">{t(`${key}.backLabel`, { defaultValue: 'BACK · DEBRIEF GUIDE' })}</p>
              <p className="font-mono text-[10px] leading-relaxed text-stone">{t(`${key}.debrief`, { defaultValue: 'What was observable? What impact did it have? What will you ask next?' })}</p>
            </div>
          </div>
        )}

        {artifact === 'flow' && (
          <div className="min-h-[190px]">
            <p className="mono-eyebrow mb-4">{t(`${key}.label`, { defaultValue: 'ROOM CHOREOGRAPHY' })}</p>
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="w-12 shrink-0 font-mono text-[10px] font-semibold text-gold">{t(`${key}.time1`, { defaultValue: '13:15' })}</span>
                <MapPin size={14} className="shrink-0 text-gold" aria-hidden="true" />
                <p className="font-mono text-[10px] leading-relaxed text-graphite">{t(`${key}.action1`, { defaultValue: 'Return from break. Stand by the flipchart.' })}</p>
              </div>
              <div className="flex gap-3">
                <span className="w-12 shrink-0 font-mono text-[10px] font-semibold text-gold">{t(`${key}.time2`, { defaultValue: '13:20' })}</span>
                <Presentation size={14} className="shrink-0 text-gold" aria-hidden="true" />
                <p className="font-mono text-[10px] leading-relaxed text-graphite">{t(`${key}.action2`, { defaultValue: 'Recap from memory. Keep slides closed.' })}</p>
              </div>
              <div className="flex gap-3">
                <span className="w-12 shrink-0 font-mono text-[10px] font-semibold text-gold">{t(`${key}.time3`, { defaultValue: '13:35' })}</span>
                <Coffee size={14} className="shrink-0 text-gold" aria-hidden="true" />
                <p className="font-mono text-[10px] leading-relaxed text-graphite">{t(`${key}.action3`, { defaultValue: 'Break. Let the room reset.' })}</p>
              </div>
              <div className="flex gap-3 border-t border-hairline pt-3">
                <span className="w-12 shrink-0 font-mono text-[10px] text-stone">{t(`${key}.room`, { defaultValue: 'ROOM' })}</span>
                <UsersRound size={14} className="shrink-0 text-stone" aria-hidden="true" />
                <p className="font-mono text-[10px] leading-relaxed text-stone">{t(`${key}.position`, { defaultValue: 'Move between the flipchart and the group.' })}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      <footer className="border-t border-hairline px-4 py-2 font-mono text-[9px] text-stone">
        {t('landing.redesign.output.cardFooter', { defaultValue: 'EDITABLE COURSE MATERIAL' })}
      </footer>
    </article>
  );
};
