import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import PricingTable from '../components/PricingTable';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/I18nContext';
import { 
  Zap, BrainCircuit, Globe, Pencil, PartyPopper, 
  GraduationCap, BookCopy, Check, Clock, TrendingUp, ShieldCheck, 
  Users, Sparkles, ArrowRight, PlayCircle, FileText, Layout, 
  Wand2, FileUp, X
} from 'lucide-react';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleCTA = () => {
    navigate(user ? '/dashboard' : '/login');
  };

  const VideoModal = () => {
    if (!showVideoModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
          <button 
            onClick={() => setShowVideoModal(false)}
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="aspect-video w-full flex items-center justify-center bg-gray-900">
             {/* Placeholder for video */}
             <div className="text-center text-gray-400">
                <PlayCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl font-medium">{t('homepage.video.placeholder', { defaultValue: 'Demo Video Placeholder' })}</p>
                <p className="text-sm mt-2 opacity-60">demo coursecopilot.mp4</p>
             </div>
             {/* 
             <video controls autoPlay className="w-full h-full">
                <source src="/demo coursecopilot.mp4" type="video/mp4" />
                Your browser does not support the video tag.
             </video>
             */}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="overflow-x-hidden relative min-h-screen bg-ink-50 dark:bg-ink-900 transition-colors duration-300">
      <Helmet>
        <title>{t('homepage.meta.title', { defaultValue: 'Course Copilot - Generare Cursuri AI' })}</title>
        <meta name="description" content={t('homepage.meta.desc', { defaultValue: 'Transformă expertiza ta în cursuri complete în minute, nu săptămâni. Platforma AI preferată de traineri și companii.' })} />
      </Helmet>

      <VideoModal />

      {/* Animated Mesh Background */}
      <div className="stg-mesh-bg fixed inset-0 z-0 opacity-60 dark:opacity-40" />
      
      {/* Floating Particles */}
      <div className="stg-particles fixed inset-0 z-0">
        {[...Array(15)].map((_, i) => (
          <div 
            key={i}
            className="stg-particle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* Hero Content */}
          <div className={`transition-all duration-1000 transform ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-ink-900 dark:text-white leading-tight mb-6">
              <span className="block">{t('homepage.hero.title1', { defaultValue: 'Course' })}</span>
              <span className="stg-gradient-text">{t('homepage.hero.title2', { defaultValue: 'Copilot' })}</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-ink-600 dark:text-ink-300 mb-8 leading-relaxed max-w-lg">
               <span dangerouslySetInnerHTML={{ __html: t('homepage.hero.subtitle_new', { defaultValue: 'De la idee la curs complet în <span class="font-bold text-ink-900 dark:text-white">2 ore</span>, nu 2 săptămâni. Platforma care transformă expertiza ta în educație scalabilă.' }) }} />
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={handleCTA} className="btn-premium px-8 py-4 text-lg shadow-lg shadow-[#2DD4BF]/30">
                {t('homepage.hero.cta', { defaultValue: 'Începe Gratuit' })}
                <ArrowRight className="w-5 h-5" />
              </button>
              <button onClick={() => navigate('/demo')} className="btn-premium--secondary px-8 py-4 text-lg">
                <PlayCircle className="w-5 h-5" />
                {t('homepage.hero.demo', { defaultValue: 'Vezi Demo' })}
              </button>
            </div>

            <div className="flex items-center gap-8 pt-4">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-ink-900 bg-gray-200 dark:bg-ink-700 flex items-center justify-center overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+10}`} alt="User" />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-white dark:border-ink-900 bg-accent-100 dark:bg-accent-900 flex items-center justify-center text-xs font-bold text-accent-700 dark:text-accent-300">
                  +2k
                </div>
              </div>
              <div className="text-sm font-medium text-ink-600 dark:text-ink-400">
                <div className="flex items-center gap-1 text-yellow-500 mb-1">
                  {[1, 2, 3, 4, 5].map((i) => <span key={i} className="fill-current">★</span>)}
                </div>
                {t('homepage.hero.trust', { defaultValue: 'Trusted by 2,000+ trainers' })}
              </div>
            </div>
          </div>

          {/* Hero Visual - 3D Mockups */}
          <div className={`stg-hero-visual relative h-[600px] hidden lg:block transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
            {/* Main Window */}
            <div className="stg-mockup-window stg-float-main absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] bg-white/90 dark:bg-ink-800/90 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-ink-700 overflow-hidden z-30">
              <div className="h-10 bg-gray-50 dark:bg-ink-900/50 border-b border-gray-100 dark:border-ink-700 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="h-8 w-3/4 bg-gray-200 dark:bg-ink-700 rounded animate-pulse" />
                  <div className="h-4 w-full bg-gray-100 dark:bg-ink-800 rounded" />
                  <div className="h-4 w-5/6 bg-gray-100 dark:bg-ink-800 rounded" />
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="h-24 bg-accent-50 dark:bg-accent-900/20 rounded-xl border border-accent-100 dark:border-accent-800/30 p-4 flex flex-col justify-center items-center gap-2">
                       <BrainCircuit className="w-8 h-8 text-accent-600" />
                       <span className="text-xs font-medium text-accent-700 dark:text-accent-400">AI Generating...</span>
                    </div>
                    <div className="h-24 bg-gray-50 dark:bg-ink-800 rounded-xl border border-gray-100 dark:border-ink-700 p-4 flex flex-col justify-center items-center gap-2">
                       <BookCopy className="w-8 h-8 text-gray-400" />
                       <span className="text-xs font-medium text-gray-500">Structure Ready</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Window 1 */}
            <div className="stg-mockup-window stg-float-secondary-1 absolute top-[10%] left-[5%] w-[280px] bg-white/80 dark:bg-ink-800/80 backdrop-blur-md rounded-xl border border-white/20 dark:border-ink-700 z-20 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-ink-900 dark:text-white">Buyer Persona</div>
                  <div className="text-xs text-ink-500">Analiză automată</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full bg-gray-100 dark:bg-ink-700 rounded-full overflow-hidden">
                  <div className="h-full w-[85%] bg-blue-500 rounded-full" />
                </div>
                <div className="text-xs text-right text-blue-600 font-medium">85% Match</div>
              </div>
            </div>

            {/* Secondary Window 2 */}
            <div className="stg-mockup-window stg-float-secondary-2 absolute bottom-[15%] right-[5%] w-[260px] bg-white/80 dark:bg-ink-800/80 backdrop-blur-md rounded-xl border border-white/20 dark:border-ink-700 z-20 p-4">
               <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-ink-900 dark:text-white">Timp Salvat</div>
                  <div className="text-xs text-ink-500">Pe curs generat</div>
                </div>
              </div>
              <div className="text-3xl font-bold text-ink-900 dark:text-white">
                80<span className="text-green-500">h</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-16 bg-white/50 dark:bg-ink-800/50 backdrop-blur-sm border-y border-ink-100 dark:border-ink-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: t('homepage.stats.hours', { defaultValue: 'Ore economisite/curs' }), value: '80+' },
              { label: t('homepage.stats.cost', { defaultValue: 'Cost redus cu' }), value: '90%' },
              { label: t('homepage.stats.roi', { defaultValue: 'ROI Mediu' }), value: '10x' },
              { label: t('homepage.stats.generated', { defaultValue: 'Cursuri Generate' }), value: '5k+' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="stg-stat-number text-4xl md:text-5xl font-bold text-ink-900 dark:text-white mb-2" data-value={stat.value}>
                  {stat.value}
                </div>
                <div className="text-sm md:text-base text-ink-600 dark:text-ink-400 font-medium uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES DEEP DIVE (NEW SECTION) */}
      <section id="features-deep-dive" className="relative z-10 py-32 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto mb-20">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300 text-xs font-bold uppercase tracking-wider mb-4">
                    {t('homepage.features.badge', { defaultValue: 'Platforma Completă' })}
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-ink-900 dark:text-white mb-6">
                    {t('homepage.features.title_part1', { defaultValue: 'Tot ce ai nevoie pentru a preda,' })} <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-600 to-teal-500">{t('homepage.features.title_part2', { defaultValue: 'într-un singur loc' })}</span>
                </h2>
                <p className="text-xl text-ink-600 dark:text-ink-300">
                    {t('homepage.features.subtitle', { defaultValue: 'Elimină haosul din procesul de creație. De la documente vechi la cursuri gata de livrare, fluxul tău de lucru nu a fost niciodată mai fluid.' })}
                </p>
            </div>

            {/* Feature 1: Import & Transform */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
                <div className="order-2 lg:order-1 relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-accent-200 to-blue-200 dark:from-accent-900/40 dark:to-blue-900/40 rounded-3xl blur-3xl opacity-30" />
                    <div className="stg-mockup-window relative bg-white dark:bg-ink-800 rounded-2xl border border-ink-200 dark:border-ink-700 p-8 shadow-2xl">
                         {/* Visual Representation of Import */}
                         <div className="flex items-center justify-between mb-8">
                             <div className="w-16 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-lg border-2 border-blue-200 dark:border-blue-700/50 flex flex-col items-center justify-center stg-file-float">
                                 <FileText className="w-8 h-8 text-blue-600" />
                                 <span className="text-[10px] font-bold mt-1 text-blue-800 dark:text-blue-300">DOCX</span>
                             </div>
                             <div className="flex-1 h-px bg-gray-200 dark:bg-ink-600 mx-4 relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center text-white z-10 shadow-lg">
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                             </div>
                             <div className="w-16 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-lg border-2 border-orange-200 dark:border-orange-700/50 flex flex-col items-center justify-center stg-file-float" style={{animationDelay: '1s'}}>
                                 <Layout className="w-8 h-8 text-orange-600" />
                                 <span className="text-[10px] font-bold mt-1 text-orange-800 dark:text-orange-300">PPT</span>
                             </div>
                         </div>
                         <div className="bg-gray-50 dark:bg-ink-900/50 rounded-xl p-4 border border-gray-100 dark:border-ink-700">
                             <div className="flex items-center gap-3 mb-2">
                                 <div className="stg-pulse-ring absolute w-4 h-4 bg-accent-500 rounded-full opacity-20" />
                                 <BrainCircuit className="w-5 h-5 text-accent-600" />
                                 <span className="text-sm font-bold text-ink-900 dark:text-white">Analyzing Content Structure...</span>
                             </div>
                             <div className="space-y-2 pl-8">
                                 <div className="h-2 w-full bg-gray-200 dark:bg-ink-700 rounded-full" />
                                 <div className="h-2 w-3/4 bg-gray-200 dark:bg-ink-700 rounded-full" />
                             </div>
                         </div>
                    </div>
                </div>
                <div className="order-1 lg:order-2">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                        <FileUp className="w-6 h-6" />
                    </div>
                    <h3 className="text-3xl font-bold text-ink-900 dark:text-white mb-4">{t('homepage.feature1.title', { defaultValue: 'Importă orice, transformă în curs' })}</h3>
                    <p className="text-lg text-ink-600 dark:text-ink-300 leading-relaxed mb-6">
                        {t('homepage.feature1.desc', { defaultValue: 'Ai deja prezentări vechi sau documente Word? Nu le arunca. Course Copilot extrage esența, restructurează informația și creează un curs pedagogic corect în secunde.' })}
                    </p>
                    <ul className="space-y-3">
                        {[
                            t('homepage.feature1.point1', { defaultValue: 'Suport pentru PDF, DOCX, PPTX' }),
                            t('homepage.feature1.point2', { defaultValue: 'Extragere automată a conceptelor cheie' }),
                            t('homepage.feature1.point3', { defaultValue: 'Păstrarea structurii logice originale' })
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-ink-700 dark:text-ink-200">
                                <Check className="w-5 h-5 text-accent-600" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Feature 2: AI Blueprint Architect */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
                <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-6 text-purple-600 dark:text-purple-400">
                        <Pencil className="w-6 h-6" />
                    </div>
                    <h3 className="text-3xl font-bold text-ink-900 dark:text-white mb-4">{t('homepage.feature2.title', { defaultValue: 'Tu ești arhitectul, AI-ul este constructorul' })}</h3>
                    <p className="text-lg text-ink-600 dark:text-ink-300 leading-relaxed mb-6">
                        {t('homepage.feature2.desc', { defaultValue: 'Nu primi doar un text generat la întâmplare. Definește structura exactă, modulele, lecțiile și tonul vocii. AI-ul umple golurile, dar tu deții controlul editorial complet.' })}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white dark:bg-ink-800 rounded-xl border border-ink-100 dark:border-ink-700 shadow-sm">
                            <div className="font-bold text-ink-900 dark:text-white mb-1">{t('homepage.feature2.stat1_val', { defaultValue: '100%' })}</div>
                            <div className="text-sm text-ink-500">{t('homepage.feature2.stat1_label', { defaultValue: 'Personalizabil' })}</div>
                        </div>
                        <div className="p-4 bg-white dark:bg-ink-800 rounded-xl border border-ink-100 dark:border-ink-700 shadow-sm">
                            <div className="font-bold text-ink-900 dark:text-white mb-1">{t('homepage.feature2.stat2_val', { defaultValue: 'Drag & Drop' })}</div>
                            <div className="text-sm text-ink-500">{t('homepage.feature2.stat2_label', { defaultValue: 'Organizare' })}</div>
                        </div>
                    </div>
                </div>
                <div className="relative h-[400px]">
                     <div className="absolute inset-0 bg-gradient-to-bl from-purple-200 to-pink-200 dark:from-purple-900/40 dark:to-pink-900/40 rounded-3xl blur-3xl opacity-30" />
                     {/* Tree Structure Visual */}
                     <div className="stg-tree-container absolute inset-0 flex items-center justify-center">
                         <div className="relative w-full max-w-md">
                             <div className="flex flex-col items-center gap-8">
                                 {/* Root */}
                                 <div className="bg-white dark:bg-ink-800 p-4 rounded-xl border-2 border-purple-500 shadow-lg z-10 w-48 text-center font-bold text-ink-900 dark:text-white">
                                     {t('homepage.feature2.course_title', { defaultValue: 'Curs Leadership' })}
                                 </div>
                                 
                                 {/* Branches */}
                                 <div className="grid grid-cols-3 gap-4 w-full relative">
                                     {/* Connector Lines */}
                                     <div className="absolute top-[-32px] left-1/2 -translate-x-1/2 w-[80%] h-8 border-t-2 border-x-2 border-purple-300 rounded-t-xl -z-10" />
                                     <div className="absolute top-[-16px] left-1/2 -translate-x-1/2 w-0.5 h-4 bg-purple-300 -z-10" />

                                     {[t('homepage.feature2.module1', { defaultValue: 'Modul 1: Bazele' }), t('homepage.feature2.module2', { defaultValue: 'Modul 2: Echipe' }), t('homepage.feature2.module3', { defaultValue: 'Modul 3: Strategie' })].map((mod, i) => (
                                         <div key={i} className="flex flex-col gap-2">
                                             <div className="bg-white dark:bg-ink-800 p-3 rounded-lg border border-purple-200 dark:border-purple-800 shadow text-sm font-semibold text-center text-ink-800 dark:text-ink-200 stg-node-pop" style={{animationDelay: `${i * 0.2}s`}}>
                                                 {mod}
                                             </div>
                                             <div className="h-4 w-0.5 bg-gray-300 mx-auto" />
                                             <div className="bg-gray-50 dark:bg-ink-900/50 p-2 rounded border border-gray-200 dark:border-ink-700 text-xs text-gray-500 text-center">
                                                 {t('homepage.feature2.lesson', { defaultValue: 'Lecția 1...' })}
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                         </div>
                     </div>
                </div>
            </div>

            {/* Feature 3: Smart Editor */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
                <div className="order-2 lg:order-1 relative h-[400px]">
                     <div className="absolute inset-0 bg-gradient-to-tr from-green-200 to-teal-200 dark:from-green-900/40 dark:to-teal-900/40 rounded-3xl blur-3xl opacity-30" />
                     <div className="stg-mockup-window relative bg-white dark:bg-ink-800 rounded-2xl border border-ink-200 dark:border-ink-700 p-6 shadow-2xl h-full flex flex-col">
                         {/* Toolbar */}
                         <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 dark:bg-ink-900/50 rounded-lg border border-gray-100 dark:border-ink-700">
                             {['B', 'I', 'U', 'H1', 'H2'].map((btn, i) => (
                                 <div key={i} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-ink-800 rounded border border-gray-200 dark:border-ink-600 text-xs font-bold text-gray-600 dark:text-gray-300 shadow-sm cursor-pointer hover:bg-gray-50">
                                     {btn}
                                 </div>
                             ))}
                             <div className="w-px h-6 bg-gray-300 mx-2" />
                             <div className="flex items-center gap-1 px-3 py-1 bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300 text-xs rounded-full border border-accent-200 dark:border-accent-800 cursor-pointer">
                                 <Wand2 className="w-3 h-3" />
                                 <span>AI Rewrite</span>
                             </div>
                         </div>
                         {/* Content Area */}
                         <div className="flex-1 bg-gray-50 dark:bg-ink-900/30 rounded-xl p-6 relative overflow-hidden group">
                             <div className="space-y-3">
                                 <div className="h-4 w-3/4 bg-gray-200 dark:bg-ink-700 rounded animate-pulse" />
                                 <div className="h-4 w-full bg-gray-200 dark:bg-ink-700 rounded animate-pulse delay-75" />
                                 <div className="h-4 w-5/6 bg-gray-200 dark:bg-ink-700 rounded animate-pulse delay-150" />
                                 <div className="h-32 w-full bg-gray-200 dark:bg-ink-700 rounded mt-4 opacity-50 border-2 border-dashed border-gray-300 dark:border-ink-600 flex items-center justify-center">
                                     <span className="text-gray-400 text-sm">{t('homepage.feature3.image_placeholder', { defaultValue: 'Imagine Contextuală Generată' })}</span>
                                 </div>
                             </div>
                             
                             {/* AI Suggestion Popup */}
                             <div className="absolute bottom-6 right-6 w-64 bg-white dark:bg-ink-800 rounded-xl shadow-xl border border-accent-200 dark:border-accent-800 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                 <div className="flex items-start gap-3">
                                     <div className="w-8 h-8 rounded-full bg-accent-100 dark:bg-accent-900/50 flex items-center justify-center shrink-0">
                                         <Sparkles className="w-4 h-4 text-accent-600" />
                                     </div>
                                     <div>
                                         <div className="text-xs font-bold text-ink-900 dark:text-white mb-1">{t('homepage.feature3.suggestion_title', { defaultValue: 'Sugestie AI' })}</div>
                                         <p className="text-[10px] text-ink-500 leading-tight">
                                             {t('homepage.feature3.suggestion_text', { defaultValue: 'Acest paragraf poate fi simplificat pentru o mai bună retenție. Vrei să îl rescriu?' })}
                                         </p>
                                         <div className="flex gap-2 mt-2">
                                             <button className="text-[10px] bg-gradient-to-br from-[#2DD4BF] to-[#3B82F6] text-white px-2 py-1 rounded hover:brightness-110">{t('homepage.feature3.accept', { defaultValue: 'Da' })}</button>
                                             <button className="text-[10px] text-gray-500 hover:text-gray-700">{t('homepage.feature3.ignore', { defaultValue: 'Nu' })}</button>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         </div>
                    </div>
                </div>
                <div className="order-1 lg:order-2">
                    <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6 text-green-600 dark:text-green-400">
                        <Wand2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-3xl font-bold text-ink-900 dark:text-white mb-4">{t('homepage.feature3.title', { defaultValue: 'Editor Asistat de AI' })}</h3>
                    <p className="text-lg text-ink-600 dark:text-ink-300 leading-relaxed mb-6">
                        {t('homepage.feature3.desc', { defaultValue: 'Nu ești niciodată singur în fața paginii goale. Editorul nostru inteligent îți sugerează îmbunătățiri, rescrie pasaje complexe și generează exemple relevante în timp real.' })}
                    </p>
                    <ul className="space-y-3">
                        {[
                            t('homepage.feature3.point1', { defaultValue: 'Rescriere și simplificare automată' }),
                            t('homepage.feature3.point2', { defaultValue: 'Generare de studii de caz' }),
                            t('homepage.feature3.point3', { defaultValue: 'Sugestii de imagini și diagrame' })
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-ink-700 dark:text-ink-200">
                                <Check className="w-5 h-5 text-accent-600" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Feature 4: Trainer's Dream (New Section) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32 mt-32">
                <div>
                    <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-6 text-pink-600 dark:text-pink-400">
                        <PartyPopper className="w-6 h-6" />
                    </div>
                    <h3 className="text-3xl font-bold text-ink-900 dark:text-white mb-4">{t('homepage.feature4.title', { defaultValue: 'Visul oricărui trainer devenit realitate' })}</h3>
                    <p className="text-lg text-ink-600 dark:text-ink-300 leading-relaxed mb-6">
                        <span dangerouslySetInnerHTML={{ __html: t('homepage.feature4.desc', { defaultValue: 'Ai visat să ai slide-urile gata structurate exact în momentul în care definești obiectivele cursului? <br/><br/><strong>Acum le ai aproape instantaneu.</strong> <br/>Fără nopți pierdute în Canva, fără lupta pentru aliniere. Doar expertiza ta transformată într-un flow pedagogic perfect, gata de prezentat în sală sau online.' }) }} />
                    </p>
                    <div className="p-4 bg-accent-50 dark:bg-accent-900/10 border border-accent-100 dark:border-accent-800 rounded-xl">
                         <p className="text-sm italic text-ink-600 dark:text-ink-400">
                            "{t('homepage.feature4.quote', { defaultValue: 'Am construit Course Copilot pentru că am trecut prin asta. După sute de cursuri livrate și mii de ore de pregătire manuală, am creat soluția pe care ne-am dorit-o întotdeauna.' })}"
                         </p>
                    </div>
                </div>
                <div className="relative h-[400px] flex items-center justify-center">
                     <div className="absolute inset-0 bg-gradient-to-tr from-pink-200 to-rose-200 dark:from-pink-900/40 dark:to-rose-900/40 rounded-3xl blur-3xl opacity-30" />
                     
                     {/* Slide Deck Animation Container */}
                     <div className="stg-slide-deck w-[320px] h-[240px]">
                        
                        {/* Slide 4 (Back-most initially) */}
                        <div className="stg-slide stg-slide-4 bg-white dark:bg-ink-800 rounded-xl border border-ink-200 dark:border-ink-700 p-6 flex flex-col shadow-xl overflow-hidden">
                             <div className="flex items-center gap-2 mb-4">
                                 <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                     <TrendingUp className="w-4 h-4 text-orange-600" />
                                 </div>
                                 <div className="h-4 w-24 bg-gray-200 dark:bg-ink-700 rounded" />
                             </div>
                             <div className="flex-1 flex items-end justify-between gap-2 px-2 pb-2">
                                 {[40, 65, 45, 80, 55].map((h, i) => (
                                     <div key={i} className="w-8 bg-orange-200 dark:bg-orange-900/40 rounded-t" style={{height: `${h}%`}} />
                                 ))}
                             </div>
                        </div>

                        {/* Slide 3 */}
                        <div className="stg-slide stg-slide-3 bg-white dark:bg-ink-800 rounded-xl border border-ink-200 dark:border-ink-700 p-6 flex flex-col shadow-xl">
                            <div className="flex justify-between items-center mb-4">
                                <div className="h-4 w-1/2 bg-gray-200 dark:bg-ink-700 rounded" />
                                <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50" />
                            </div>
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${i === 1 ? 'border-purple-500 bg-purple-500' : 'border-gray-300 dark:border-ink-600'}`}>
                                            {i === 1 && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <div className="h-2 flex-1 bg-gray-100 dark:bg-ink-700 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Slide 2 */}
                        <div className="stg-slide stg-slide-2 bg-white dark:bg-ink-800 rounded-xl border border-ink-200 dark:border-ink-700 p-6 flex flex-col shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500 transform rotate-45 translate-x-8 -translate-y-8" />
                            <div className="h-4 w-1/3 bg-gray-200 dark:bg-ink-700 rounded mb-6" />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="aspect-video bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                    <Globe className="w-6 h-6 text-blue-400" />
                                </div>
                                <div className="space-y-2">
                                    <div className="h-2 w-full bg-gray-100 dark:bg-ink-700 rounded" />
                                    <div className="h-2 w-full bg-gray-100 dark:bg-ink-700 rounded" />
                                    <div className="h-2 w-2/3 bg-gray-100 dark:bg-ink-700 rounded" />
                                </div>
                            </div>
                        </div>

                        {/* Slide 1 (Front) */}
                        <div className="stg-slide stg-slide-1 bg-white dark:bg-ink-800 rounded-xl border border-ink-200 dark:border-ink-700 p-6 flex flex-col shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-accent-500" />
                            <h4 className="text-xl font-bold text-ink-900 dark:text-white mb-2">{t('homepage.feature4.slide.conclusions', { defaultValue: 'Concluzii Cheie' })}</h4>
                            <div className="space-y-3 mt-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-accent-100 dark:bg-accent-900/50 text-accent-600 flex items-center justify-center text-xs font-bold">1</div>
                                    <div className="h-2 flex-1 bg-gray-100 dark:bg-ink-700 rounded" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-accent-100 dark:bg-accent-900/50 text-accent-600 flex items-center justify-center text-xs font-bold">2</div>
                                    <div className="h-2 flex-1 bg-gray-100 dark:bg-ink-700 rounded" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-accent-100 dark:bg-accent-900/50 text-accent-600 flex items-center justify-center text-xs font-bold">3</div>
                                    <div className="h-2 flex-1 bg-gray-100 dark:bg-ink-700 rounded" />
                                </div>
                            </div>
                            <div className="mt-auto pt-4 border-t border-gray-100 dark:border-ink-700 flex justify-between items-center">
                                <span className="text-[10px] text-gray-400">Course Copilot AI</span>
                                <div className="px-2 py-1 bg-accent-50 text-accent-700 text-[10px] rounded font-bold">{t('homepage.feature4.slide.ready', { defaultValue: 'READY' })}</div>
                            </div>
                        </div>
                     </div>
                </div>
            </div>

            {/* Feature 5: Human Expertise & Instructional Design (New Section) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32 mt-32">
                <div className="order-2 lg:order-1 relative h-[500px] flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-200 to-purple-200 dark:from-indigo-900/40 dark:to-purple-900/40 rounded-3xl blur-3xl opacity-30" />
                    
                    {/* Expertise Layers Animation */}
                    <div className="stg-layers-container">
                         <div className="stg-connector-line" />
                         
                         {/* Layer 1: Instructional Design */}
                         <div className="stg-layer stg-layer-1">
                             <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                                 <BrainCircuit className="w-6 h-6 text-indigo-600" />
                             </div>
                             <div>
                                 <div className="text-sm font-bold text-ink-900 dark:text-white">{t('homepage.feature5.layer1_title', { defaultValue: 'Design Instrucțional Modern' })}</div>
                                 <div className="text-xs text-ink-500">{t('homepage.feature5.layer1_desc', { defaultValue: "Bloom's Taxonomy, ADDIE, Gagne" })}</div>
                             </div>
                         </div>

                         {/* Layer 2: Experience */}
                         <div className="stg-layer stg-layer-2">
                             <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                                 <GraduationCap className="w-6 h-6 text-amber-600" />
                             </div>
                             <div>
                                 <div className="text-sm font-bold text-ink-900 dark:text-white">{t('homepage.feature5.layer2_title', { defaultValue: '25 Ani Experiență Umană' })}</div>
                                 <div className="text-xs text-ink-500">{t('homepage.feature5.layer2_desc', { defaultValue: 'Training & Dezvoltare Profesională' })}</div>
                             </div>
                         </div>

                         {/* Layer 3: AI Engine */}
                         <div className="stg-layer stg-layer-3">
                             <div className="w-12 h-12 rounded-full bg-accent-100 dark:bg-accent-900/50 flex items-center justify-center shrink-0 stg-brain-pulse">
                                 <Sparkles className="w-6 h-6 text-accent-600" />
                             </div>
                             <div>
                                 <div className="text-sm font-bold text-ink-900 dark:text-white">{t('homepage.feature5.layer3_title', { defaultValue: 'Google Gemini AI Core' })}</div>
                                 <div className="text-xs text-ink-500">{t('homepage.feature5.layer3_desc', { defaultValue: 'Procesare Contextuală Avansată' })}</div>
                             </div>
                         </div>
                    </div>
                </div>
                
                <div className="order-1 lg:order-2">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-6 text-indigo-600 dark:text-indigo-400">
                        <BrainCircuit className="w-6 h-6" />
                    </div>
                    <h3 className="text-3xl font-bold text-ink-900 dark:text-white mb-4">{t('homepage.feature5.scientific.title', { defaultValue: 'Fundamentat Științific, nu doar Generat Statistic' })}</h3>
                    <p className="text-lg text-ink-600 dark:text-ink-300 leading-relaxed mb-6">
                        <span dangerouslySetInnerHTML={{ __html: t('homepage.feature5.scientific.desc', { defaultValue: 'Course Copilot nu este doar un simplu generator de text. <br/><br/> În spatele fiecărei instrucțiuni date AI-ului se află <strong>25 de ani de experiență umană</strong> în training și dezvoltare. Am codificat principiile moderne de design instrucțional direct în "creierul" aplicației.' }) }} />
                    </p>
                    <ul className="space-y-4">
                        <li className="flex items-start gap-3 text-ink-700 dark:text-ink-200">
                            <Check className="w-5 h-5 text-accent-600 mt-1 shrink-0" />
                            <span dangerouslySetInnerHTML={{ __html: t('homepage.feature5.scientific.point1', { defaultValue: '<strong>Pedagogie Corectă:</strong> Structurile cursurilor respectă fluxurile cognitive naturale de învățare.' }) }} />
                        </li>
                        <li className="flex items-start gap-3 text-ink-700 dark:text-ink-200">
                            <Check className="w-5 h-5 text-accent-600 mt-1 shrink-0" />
                            <span dangerouslySetInnerHTML={{ __html: t('homepage.feature5.scientific.point2', { defaultValue: '<strong>Focus pe Rezultate:</strong> Totul pornește de la obiectivele de învățare, nu de la umplutura de text.' }) }} />
                        </li>
                    </ul>
                </div>
            </div>

        </div>
      </section>

      {/* Why Us Section (Reusing content but restyled) */}
      <section className="relative z-10 py-24 bg-white/50 dark:bg-ink-800/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-ink-900 dark:text-white mb-4">
                    {t('homepage.whyUsNew.mainTitle', { defaultValue: 'De ce aleg experții Course Copilot?' })}
                </h2>
                <p className="text-lg text-ink-600 dark:text-ink-300">
                    {t('homepage.whyUsNew.mainSubtitle', { defaultValue: 'Fie că ești freelancer, manager L&D sau profesor, platforma noastră se adaptează nevoilor tale.' })}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Card 1: Freelancer */}
                <div className="card-premium p-8 transform transition-all hover:-translate-y-2 hover:shadow-2xl group">
                    <div className="w-14 h-14 rounded-2xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Zap className="w-8 h-8 text-accent-600" />
                    </div>
                    <h3 className="text-xl font-bold text-ink-900 dark:text-white mb-3">{t('homepage.whyUsNew.card1.title', { defaultValue: 'Viteză și Eficiență' })}</h3>
                    <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
                        {t('homepage.whyUsNew.card1.desc', { defaultValue: '"Nu mai pierd 40% din timp cu PowerPoint-uri. Generez structura și conținutul în minute, nu zile."' })}
                    </p>
                    <div className="mt-6 pt-6 border-t border-ink-100 dark:border-ink-700 flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-gray-200" /> {/* Avatar placeholder */}
                         <div className="text-sm">
                            <div className="font-bold text-ink-900 dark:text-white">Florin</div>
                            <div className="text-xs text-ink-500">{t('homepage.whyUsNew.card1.role', { defaultValue: 'Freelance Trainer' })}</div>
                         </div>
                    </div>
                </div>

                {/* Card 2: Corporate */}
                <div className="card-premium p-8 transform transition-all hover:-translate-y-2 hover:shadow-2xl group relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-gradient-to-br from-[#2DD4BF] to-[#3B82F6] text-white text-xs font-bold px-3 py-1 rounded-bl-xl">{t('homepage.whyUsNew.card2.badge', { defaultValue: 'POPULAR' })}</div>
                    <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-ink-900 dark:text-white mb-3">{t('homepage.whyUsNew.card2.title', { defaultValue: 'Scalabilitate' })}</h3>
                    <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
                        {t('homepage.whyUsNew.card2.desc', { defaultValue: '"Echipa mea produce de 3 ori mai multe cursuri fără să angajăm oameni noi. ROI în mai puțin de 30 de zile."' })}
                    </p>
                    <div className="mt-6 pt-6 border-t border-ink-100 dark:border-ink-700 flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-gray-200" />
                         <div className="text-sm">
                            <div className="font-bold text-ink-900 dark:text-white">Maria</div>
                            <div className="text-xs text-ink-500">{t('homepage.whyUsNew.card2.role', { defaultValue: 'L&D Manager' })}</div>
                         </div>
                    </div>
                </div>

                {/* Card 3: Enterprise */}
                <div className="card-premium p-8 transform transition-all hover:-translate-y-2 hover:shadow-2xl group">
                    <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <ShieldCheck className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-ink-900 dark:text-white mb-3">{t('homepage.whyUsNew.card3.title', { defaultValue: 'Standard Enterprise' })}</h3>
                    <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
                        {t('homepage.whyUsNew.card3.desc', { defaultValue: '"Securitate, integrare și consistență. Exact ce are nevoie o companie Fortune 500 pentru a scala trainingul."' })}
                    </p>
                    <div className="mt-6 pt-6 border-t border-ink-100 dark:border-ink-700 flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-gray-200" />
                         <div className="text-sm">
                            <div className="font-bold text-ink-900 dark:text-white">Dan</div>
                            <div className="text-xs text-ink-500">{t('homepage.whyUsNew.card3.role', { defaultValue: 'Director Enterprise' })}</div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold tracking-tight text-center text-ink-900 dark:text-white sm:text-4xl mb-12">
                {t('homepage.pricingNew.header', { defaultValue: 'Planuri flexibile pentru orice etapă' })}
            </h2>
            {pricingError && (
                <div className="mb-8 p-4 text-center text-sm text-red-800 bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded-md">
                    <strong>{t('common.error', { defaultValue: 'Error' })}:</strong> {pricingError}
                </div>
            )}
            <div>
                <PricingTable user={user} error={pricingError} setError={setPricingError} />
            </div>
            </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-24 bg-gradient-to-br from-[#2DD4BF] to-[#3B82F6] text-white overflow-hidden">
         {/* Background pattern */}
         <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
         
         <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-20">
             <div className="max-w-3xl mx-auto">
               <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">{t('homepage.finalCtaNew.title', { defaultValue: 'Gata să transformi modul în care creezi cursuri?' })}</h2>
               <p className="text-xl text-white/90 mb-10">{t('homepage.finalCtaNew.subtitle', { defaultValue: 'Alătură-te celor care au descoperit puterea Course Copilot.' })}</p>
                 <button
                    onClick={handleCTA}
                    className="bg-white text-[#0284c7] hover:bg-gray-50 px-8 py-4 rounded-xl text-lg font-bold shadow-xl transition-all transform hover:-translate-y-1"
                >
                {t('homepage.finalCta.cta')}
                </button>
                <p className="mt-4 text-sm text-white/80">{t('homepage.finalCtaNew.note', { defaultValue: 'Nu necesită card de credit pentru început.' })}</p>
             </div>
         </div>
      </section>

    </div>
  );
};

export default HomePage;
