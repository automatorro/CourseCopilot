import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from '../contexts/I18nContext';
import { BookOpen } from 'lucide-react';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <footer className="bg-gradient-to-t from-white to-transparent dark:from-ink-900/40 border-t border-ink-100 dark:border-ink-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
             {(!imageLoaded || imageError) && (
                <div className={`flex items-center gap-3 ${imageLoaded && !imageError ? 'hidden' : ''}`}>
                  <BookOpen size={24} className="text-primary-600 dark:text-primary-400" />
                  <span className="text-lg font-semibold font-display tracking-tight text-ink-900 dark:text-white">{t('header.title')}</span>
                </div>
             )}
             <img 
               src="/logo-cc.png" 
               alt="CourseCopilot Logo" 
               className={`h-8 w-auto ${!imageLoaded || imageError ? 'hidden' : 'block'}`}
               onLoad={() => setImageLoaded(true)}
               onError={() => setImageError(true)}
             />
          </div>
          <div className="text-center md:text-left">
            <p className="text-sm text-ink-500 dark:text-ink-400">
              {t('footer.copyright', { year: currentYear })}
            </p>
            <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
              {t('footer.poweredBy')}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <NavLink to="/" className="text-sm text-ink-700 hover:text-primary-600 dark:text-ink-200 dark:hover:text-primary-400 transition-colors">
              {t('footer.home')}
            </NavLink>
            <NavLink to="/#pricing" className="text-sm text-ink-700 hover:text-primary-600 dark:text-ink-200 dark:hover:text-primary-400 transition-colors">
              {t('footer.pricing')}
            </NavLink>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;