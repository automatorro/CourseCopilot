import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import PricingTable from '../components/PricingTable';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/I18nContext';
import { Zap, BrainCircuit, Globe, ClipboardList, Pencil, PartyPopper, GraduationCap, BookCopy, Check } from 'lucide-react';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [pricingError, setPricingError] = useState<string | null>(null);
  const location = useLocation();

  const handleCTA = () => {
    navigate(user ? '/dashboard' : '/login');
  };

  return (
    <div className="overflow-x-hidden">
      <Helmet>
        <title>CourseCopilot</title>
        <meta name="description" content="Creează și publică cursuri cu ajutorul AI, rapid și profesional." />
        <link rel="canonical" href={`https://coursecopilot.app${location.pathname}`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="CourseCopilot" />
        <meta property="og:description" content="Platformă AI pentru generarea de cursuri și materiale educaționale." />
        <meta property="og:url" content={`https://coursecopilot.app${location.pathname}`} />
        <meta name="twitter:card" content="summary" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'CourseCopilot',
            url: 'https://coursecopilot.app'
          })}
        </script>
      </Helmet>
      {/* Hero Section */}
      <section className="relative text-center py-20 sm:py-32 animate-fade-in-up bg-hero-vibrant">
        {/* Decorative blobs */}
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 left-12 h-40 w-40 rounded-full bg-accent-400/30 blur-2xl animate-soft-float" />
          <div className="absolute top-16 right-24 h-48 w-48 rounded-full bg-secondary-400/30 blur-2xl animate-soft-float" style={{animationDelay: '0.8s'}} />
        </div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl">
                <div className="hidden sm:mb-8 sm:flex sm:justify-center">
                    <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 dark:text-gray-300 ring-1 ring-gray-900/10 dark:ring-white/20 hover:ring-gray-900/20 dark:hover:ring-white/30">
                    Powered by Google Gemini.{' '}
                    <a href="https://deepmind.google/technologies/gemini/" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary-600 dark:text-primary-400">
                        <span className="absolute inset-0" aria-hidden="true" />
                        Read more <span aria-hidden="true">&rarr;</span>
                    </a>
                    </div>
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-6xl">
                    {t('homepage.hero.title')}
                </h1>
                <p className="mt-6 text-lg leading-8 text-ink-600 dark:text-ink-300">
                    {t('homepage.hero.subtitle')}
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                    <button
                        onClick={handleCTA}
                        className="btn-premium px-6 py-3"
                    >
                    {t('homepage.hero.cta')}
                    </button>
                </div>
            </div>
        </div>
      </section>

      {/* Why Us / Features Section */}
      <section className="py-20 sm:py-32 bg-white dark:bg-ink-800/50 animate-fade-in-up animation-delay-200">
         <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
             <h2 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-4xl">{t('homepage.whyUs.title')}</h2>
             <p className="mt-4 max-w-2xl mx-auto text-lg text-ink-600 dark:text-ink-300">{t('homepage.whyUs.subtitle')}</p>
             <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                <div className="p-8 card-premium transform transition-transform hover:-translate-y-2">
                    <Zap className="h-10 w-10 text-accent-600" />
                    <h3 className="mt-6 text-xl font-bold">{t('homepage.whyUs.feature1.title')}</h3>
                    <p className="mt-2 text-ink-600 dark:text-ink-300">{t('homepage.whyUs.feature1.desc')}</p>
                </div>
                 <div className="p-8 card-premium transform transition-transform hover:-translate-y-2">
                    <BrainCircuit className="h-10 w-10 text-secondary-600" />
                    <h3 className="mt-6 text-xl font-bold">{t('homepage.whyUs.feature2.title')}</h3>
                    <p className="mt-2 text-ink-600 dark:text-ink-300">{t('homepage.whyUs.feature2.desc')}</p>
                </div>
                 <div className="p-8 card-premium transform transition-transform hover:-translate-y-2">
                    <Globe className="h-10 w-10 text-accent-600" />
                    <h3 className="mt-6 text-xl font-bold">{t('homepage.whyUs.feature3.title')}</h3>
                    <p className="mt-2 text-ink-600 dark:text-ink-300">{t('homepage.whyUs.feature3.desc')}</p>
                </div>
             </div>
         </div>
      </section>

      {/* How it works Section */}
      <section className="py-20 sm:py-32 animate-fade-in-up animation-delay-400">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-4xl">{t('homepage.howItWorks.title')}</h2>
             <div className="relative mt-16">
                 <div className="absolute left-1/2 top-4 bottom-4 w-px bg-ink-300 dark:bg-ink-700 hidden md:block" />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                     {[
                         { icon: ClipboardList, title: t('homepage.howItWorks.step1.title'), desc: t('homepage.howItWorks.step1.desc') },
                         { icon: Zap, title: t('homepage.howItWorks.step2.title'), desc: t('homepage.howItWorks.step2.desc') },
                         { icon: Pencil, title: t('homepage.howItWorks.step3.title'), desc: t('homepage.howItWorks.step3.desc') },
                         { icon: PartyPopper, title: t('homepage.howItWorks.step4.title'), desc: t('homepage.howItWorks.step4.desc') },
                     ].map((item, index) => (
                         <div key={index} className={`flex items-start gap-6 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                             <div className="flex-shrink-0 bg-gradient-to-br from-accent-600 to-secondary-600 text-white rounded-full h-12 w-12 flex items-center justify-center shadow-premium">
                                 <item.icon className="h-6 w-6" />
                             </div>
                             <div className={`text-left ${index % 2 !== 0 ? 'md:text-right' : ''}`}>
                                 <h3 className="text-xl font-bold">{item.title}</h3>
                                 <p className="mt-2 text-ink-600 dark:text-ink-300">{item.desc}</p>
                             </div>
                         </div>
                     ))}
                 </div>
            </div>
        </div>
      </section>

      {/* Educational Principles Section */}
       <section className="py-20 sm:py-32 bg-white dark:bg-ink-800/50 animate-fade-in-up animation-delay-600">
         <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
             <h2 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-4xl">{t('homepage.pedagogy.title')}</h2>
             <p className="mt-4 max-w-3xl mx-auto text-lg text-ink-600 dark:text-ink-300">{t('homepage.pedagogy.subtitle')}</p>
             <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
               <div className="p-8 card-premium">
                    <div className="flex items-center gap-4">
                        <BookCopy className="h-8 w-8 text-primary-600" />
                        <h3 className="text-2xl font-bold">{t('homepage.pedagogy.corporate.title')}</h3>
                    </div>
                    <ul className="mt-6 space-y-4">
                        {[
                            { title: t('homepage.pedagogy.corporate.merrill'), desc: t('homepage.pedagogy.corporate.merrill.desc')},
                            { title: t('homepage.pedagogy.corporate.bloom'), desc: t('homepage.pedagogy.corporate.bloom.desc')},
                            { title: t('homepage.pedagogy.corporate.andragogy'), desc: t('homepage.pedagogy.corporate.andragogy.desc')},
                        ].map(item => (
                             <li key={item.title} className="flex items-start gap-3">
                                <Check className="h-6 w-6 flex-shrink-0 text-green-500 mt-1" />
                                <div>
                                    <h4 className="font-semibold">{item.title}</h4>
                                    <p className="text-ink-600 dark:text-ink-400">{item.desc}</p>
                                </div>
                             </li>
                        ))}
                    </ul>
                </div>
                 <div className="p-8 card-premium">
                    <div className="flex items-center gap-4">
                        <GraduationCap className="h-8 w-8 text-primary-600" />
                        <h3 className="text-2xl font-bold">{t('homepage.pedagogy.academic.title')}</h3>
                    </div>
                    <ul className="mt-6 space-y-4">
                       {[
                            { title: t('homepage.pedagogy.academic.constructivism'), desc: t('homepage.pedagogy.academic.constructivism.desc')},
                            { title: t('homepage.pedagogy.academic.bloom'), desc: t('homepage.pedagogy.academic.bloom.desc')},
                            { title: t('homepage.pedagogy.academic.scaffolding'), desc: t('homepage.pedagogy.academic.scaffolding.desc')},
                        ].map(item => (
                             <li key={item.title} className="flex items-start gap-3">
                                <Check className="h-6 w-6 flex-shrink-0 text-green-500 mt-1" />
                                <div>
                                    <h4 className="font-semibold">{item.title}</h4>
                                    <p className="text-ink-600 dark:text-ink-400">{item.desc}</p>
                                </div>
                             </li>
                        ))}
                    </ul>
                </div>
             </div>
         </div>
       </section>
      
      {/* Pricing Section */}
      <section id="pricing" className="py-20 sm:py-32 animate-fade-in-up animation-delay-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold tracking-tight text-center text-ink-900 dark:text-white sm:text-4xl">
                {t('homepage.pricing.title')}
            </h2>
            {pricingError && (
                <div className="mt-8 p-4 text-center text-sm text-red-800 bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded-md">
                    <strong>Error:</strong> {pricingError}
                </div>
            )}
            <div className="mt-8">
                <PricingTable user={user} error={pricingError} setError={setPricingError} />
            </div>
            </div>
        </div>
      </section>
      
      {/* Final CTA Section */}
      <section className="py-20 sm:py-32 animate-fade-in-up animation-delay-1000">
         <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
             <div className="max-w-2xl mx-auto">
               <h2 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-4xl">{t('homepage.finalCta.title')}</h2>
               <p className="mt-4 text-lg text-ink-600 dark:text-ink-300">{t('homepage.finalCta.subtitle')}</p>
                 <button
                    onClick={handleCTA}
                    className="mt-8 btn-premium px-6 py-4 text-lg"
                >
                {t('homepage.finalCta.cta')}
                </button>
             </div>
         </div>
      </section>

    </div>
  );
};

export default HomePage;
