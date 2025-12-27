import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from '../contexts/I18nContext';
import { PlayCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DemoPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-900 flex items-center justify-center p-4">
      <Helmet>
        <title>{t('demo.title', { defaultValue: 'Course Copilot Demo' })}</title>
      </Helmet>

      <div className="max-w-4xl w-full">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-ink-600 dark:text-ink-400 hover:text-accent-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('demo.back', { defaultValue: 'Back to Home' })}
        </button>

        <div className="bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800 aspect-video flex items-center justify-center relative group">
          <div className="text-center text-gray-400">
             <PlayCircle className="w-20 h-20 mx-auto mb-4 opacity-50 group-hover:opacity-100 transition-opacity text-accent-500" />
             <p className="text-2xl font-medium">{t('demo.placeholder', { defaultValue: 'Demo Video Placeholder' })}</p>
             <p className="text-base mt-2 opacity-60">demo coursecopilot.mp4</p>
          </div>
          {/* 
          <video controls autoPlay className="w-full h-full">
             <source src="/demo coursecopilot.mp4" type="video/mp4" />
             Your browser does not support the video tag.
          </video>
          */}
        </div>
        
        <div className="mt-8 text-center">
             <h1 className="text-3xl font-bold text-ink-900 dark:text-white mb-4">
                {t('demo.headline', { defaultValue: 'See Course Copilot in Action' })}
             </h1>
             <p className="text-lg text-ink-600 dark:text-ink-300 max-w-2xl mx-auto">
                {t('demo.subheadline', { defaultValue: 'Watch how you can generate a complete course structure in less than 2 minutes.' })}
             </p>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
