import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { NavLink } from 'react-router-dom';
import { BookOpen, Sun, Moon, ArrowRight, PenLine, Layers, Clock, Sparkles, FileText } from 'lucide-react';
import { useTranslation } from '../contexts/I18nContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import EarlyAccessModal from '../components/EarlyAccessModal';
import { CourseCopilotDemoVideo, LandingDeliverableCard, type LandingArtifact } from '../components/LandingVisuals';

const FINAL_CTA_IMG   = '/landing/final-cta.png';

const withImageFallback: React.ImgHTMLAttributes<HTMLImageElement> = {
  onError: (e) => {
    const t = e.currentTarget;
    if (t.dataset.fallback === '1') return;
    t.dataset.fallback = '1';
    t.style.opacity = '0';
  },
};

const HomePage: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [earlyAccessOpen, setEarlyAccessOpen] = useState(false);

  const openEarlyAccess = () => setEarlyAccessOpen(true);

  const problems = [
    {
      Icon: PenLine,
      titleKey: 'problem.item1.title',
      bodyKey: 'problem.item1.body',
    },
    {
      Icon: Layers,
      titleKey: 'problem.item2.title',
      bodyKey: 'problem.item2.body',
    },
    {
      Icon: Clock,
      titleKey: 'problem.item3.title',
      bodyKey: 'problem.item3.body',
    },
  ];

  const artifacts: LandingArtifact[] = ['guide', 'manual', 'slides', 'exercise', 'flow'];

  return (
    <div className="min-h-screen bg-paper text-graphite">
      <Helmet>
        <title>{t('landing.redesign.meta.title', { defaultValue: 'CourseCopilot — AI Instructional Design Platform' })}</title>
        <meta name="description" content={t('landing.redesign.meta.description', { defaultValue: 'A complete, battle-ready course architecture in minutes, built around your subject, audience and voice.' })} />
      </Helmet>

      {/* NAV — landing-specific, replaces the app Header on this route */}
      <header className="border-b border-hairline">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <NavLink to="/" className="flex items-center gap-2 text-graphite">
            <BookOpen size={20} className="text-gold" />
            <span className="font-display text-lg tracking-tight">{t('header.title', { defaultValue: 'CourseCopilot' })}</span>
          </NavLink>
          <div className="flex items-center gap-3">
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="input-premium w-[70px] py-1 text-xs"
              aria-label="Language"
            >
              <option value="en">EN</option>
              <option value="ro">RO</option>
              <option value="es">ES</option>
              <option value="fr">FR</option>
              <option value="de">DE</option>
              <option value="it">IT</option>
            </select>
            <button
              onClick={toggleTheme}
              className="p-2 text-stone hover:text-graphite transition-colors"
              aria-label={theme === 'light' ? 'Switch to dark' : 'Switch to light'}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            {user ? (
              <NavLink to="/dashboard" className="btn-premium">
                {t('landing.nav.dashboard', { defaultValue: 'Dashboard' })}
              </NavLink>
            ) : (
              <button onClick={openEarlyAccess} className="btn-premium">
                {t('landing.redesign.nav.cta', { defaultValue: 'Get Early Access' })}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="border-b border-hairline">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <p className="mono-eyebrow mb-6">{t('landing.redesign.hero.eyebrow', { defaultValue: 'AI Instructional Design Platform' })}</p>
            <h1 className="mb-6 max-w-2xl font-display text-4xl leading-tight text-graphite md:text-5xl lg:text-6xl">
              {t('landing.redesign.hero.title', { defaultValue: 'For trainers who craft — not assemble.' })}
            </h1>
            <p className="mb-8 max-w-xl text-base leading-relaxed text-graphite md:text-lg">
              {t('landing.redesign.hero.body', { defaultValue: 'You have spent years mastering your craft. CourseCopilot is the AI instructional designer that respects that. Feed it your subject, your audience, and your voice — and it returns a complete, battle-ready course architecture in minutes.' })}
            </p>
            <div className="flex flex-col items-start gap-3">
              <button onClick={openEarlyAccess} className="btn-premium">
                {t('landing.redesign.hero.cta', { defaultValue: 'Get Early Access' })}
                <ArrowRight size={14} />
              </button>
              <p className="font-mono text-xs leading-relaxed text-stone">{t('landing.redesign.hero.microcopy', { defaultValue: 'Free access during early beta. No spam, no noise.' })}</p>
            </div>
          </div>

          <CourseCopilotDemoVideo />
        </div>
      </section>

      {/* PROBLEM — light section, 3 items with hairline dividers */}
      <section className="bg-paper-alt border-b border-hairline">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <p className="mono-eyebrow mb-6">{t('landing.redesign.problem.eyebrow', { defaultValue: 'The Problem' })}</p>
          <h2 className="mb-16 max-w-2xl font-display text-3xl leading-tight text-graphite md:text-4xl">
            {t('landing.redesign.problem.title', { defaultValue: 'Three things every trainer has stopped talking about publicly.' })}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {problems.map((p, i) => (
              <div
                key={i}
                className={`p-8 border-t border-hairline ${i > 0 ? 'md:border-t-0 md:border-l' : ''}`}
              >
                <div className="mb-6 text-gold">
                  <p.Icon size={24} />
                </div>
                  <h3 className="mb-4 font-display text-2xl leading-snug text-graphite">
                    {t(`landing.redesign.${p.titleKey}`, { defaultValue: `0${i + 1} · ${['The Blank Page', 'The Shallow Slide', 'The Lost Week'][i]}` })}
                </h3>
                  <p className="text-sm leading-relaxed text-stone">
                    {t(`landing.redesign.${p.bodyKey}`, { defaultValue: '' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — always-dark section, grid backdrop */}
      <section className="section-dark mastery-grid border-b border-hairline">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <p className="mono-eyebrow mb-6">{t('landing.redesign.how.eyebrow', { defaultValue: 'How It Works' })}</p>
          <h2 className="font-display text-3xl md:text-4xl text-graphite leading-tight mb-16 max-w-2xl">
            {t('landing.redesign.how.title', { defaultValue: 'A trade of specifics — not generic prompts.' })}
          </h2>

          <div className="grid items-stretch gap-5 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
            <div className="border-y border-hairline py-5">
              <p className="mono-eyebrow mb-4 text-gold">{t('landing.redesign.how.input', { defaultValue: '01 · INPUT' })}</p>
              <ol className="space-y-3">
                {Array.from({ length: 6 }, (_, index) => (
                  <li key={index} className="flex gap-3 border-b border-hairline pb-3 last:border-b-0 last:pb-0">
                    <span className="font-mono text-[10px] text-gold">{String(index + 1).padStart(2, '0')}</span>
                    <span className="text-sm text-graphite">{t(`landing.redesign.how.input${index + 1}`, { defaultValue: ['Subject & learning objectives', 'Audience & experience', 'Duration & pace', 'Live or online setting', 'Tone & style rules', 'Existing materials (optional)'][index] })}</span>
                  </li>
                ))}
              </ol>
            </div>
            <ArrowRight className="mx-auto hidden text-gold lg:block" size={20} aria-hidden="true" />
            <div className="flex min-h-36 flex-col items-center justify-center border border-gold-dim bg-paper-alt px-5 py-6 text-center">
              <Sparkles size={22} className="mb-3 text-gold" aria-hidden="true" />
              <p className="mono-eyebrow mb-2 text-gold">{t('landing.redesign.how.engineLabel', { defaultValue: '02 · ENGINE' })}</p>
              <h3 className="font-display text-xl text-graphite">{t('landing.redesign.how.engine', { defaultValue: 'CourseCopilot Architectural Engine' })}</h3>
            </div>
            <ArrowRight className="mx-auto hidden text-gold lg:block" size={20} aria-hidden="true" />
            <div className="border-y border-hairline py-5">
              <p className="mono-eyebrow mb-4 text-gold">{t('landing.redesign.how.output', { defaultValue: '03 · OUTPUT' })}</p>
              <h3 className="mb-4 font-display text-xl text-graphite">{t('landing.redesign.how.artifactCount', { defaultValue: '5 Dedicated Trainer Artifacts' })}</h3>
              <ul className="space-y-2">
                {artifacts.map((artifact, index) => (
                  <li key={artifact} className="flex items-center gap-2 text-sm text-graphite">
                    <FileText size={14} className="shrink-0 text-gold" aria-hidden="true" />
                    {t(`landing.redesign.output.${artifact}.title`, { defaultValue: ['Trainer Guide', 'Participant Manual', 'Presentation Deck', 'Exercise Sheets', 'Trainer Flow'][index] })}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mx-auto mt-14 max-w-4xl border border-gold-dim px-6 py-7 text-center md:px-10">
            <p className="font-display text-xl leading-relaxed text-graphite md:text-2xl">
              {t('landing.redesign.how.audienceValue', { defaultValue: 'Drives efficiency for seasoned L&D professionals, while providing complete structure, scripts, and room confidence for first-time trainers.' })}
            </p>
          </div>
        </div>
      </section>

      {/* THE OUTPUT — five document previews */}
      <section className="border-b border-hairline">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="mb-12 max-w-3xl">
            <div>
              <p className="mono-eyebrow mb-6">{t('landing.redesign.output.eyebrow', { defaultValue: 'The Output' })}</p>
              <h2 className="font-display text-3xl md:text-4xl text-graphite leading-tight max-w-lg">
                {t('landing.redesign.output.title', { defaultValue: 'Five complete artefacts. Ready for the room.' })}
              </h2>
              <p className="text-graphite leading-relaxed mt-6 max-w-md">
                {t('landing.redesign.output.body', { defaultValue: 'Not an unformatted Markdown blob. Named, fully editable files exported in one click.' })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {artifacts.map(artifact => (
              <LandingDeliverableCard key={artifact} artifact={artifact} />
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-b border-hairline">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="aspect-[4/3] border border-hairline overflow-hidden order-2 lg:order-1">
            <img
              src={FINAL_CTA_IMG}
              alt="Brutalist concrete library with brass task lamps"
              className="w-full h-full object-cover"
              {...withImageFallback}
            />
          </div>
          <div className="order-1 lg:order-2">
            <p className="mono-eyebrow mb-6">{t('landing.redesign.finalCta.eyebrow', { defaultValue: 'The invitation' })}</p>
            <h2 className="font-display text-3xl md:text-4xl text-graphite leading-tight mb-6">
              {t('landing.redesign.finalCta.title', { defaultValue: 'Built by trainers, for trainers who take the work seriously.' })}
            </h2>
            <p className="mb-8 max-w-lg leading-relaxed text-graphite">
              {t('landing.redesign.finalCta.body', { defaultValue: 'Early access is limited. You will hear from us once, when we open the doors. No daily emails. No newsletter. No noise.' })}
            </p>
            <div className="flex flex-col items-start gap-3">
              <button onClick={openEarlyAccess} className="btn-premium">
                {t('landing.redesign.finalCta.cta', { defaultValue: 'Get Early Access' })}
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal footer within landing (no shared Footer here) */}
      <footer className="bg-paper-alt py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="mono-eyebrow">© {new Date().getFullYear()} CourseCopilot</p>
          <p className="mono-eyebrow">
            {t('landing.redesign.footer.tagline', { defaultValue: 'For trainers who craft — not assemble' })}
          </p>
        </div>
      </footer>

      <EarlyAccessModal open={earlyAccessOpen} onClose={() => setEarlyAccessOpen(false)} source="landing" />
    </div>
  );
};

export default HomePage;
