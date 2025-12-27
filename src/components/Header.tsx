import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/I18nContext';
import { supabase } from '../services/supabaseClient';
import { Sun, Moon, LogOut, BookOpen, CreditCard, User as UserIcon, LayoutDashboard } from 'lucide-react';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await supabase.auth.signOut();
    navigate('/');
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 bg-gradient-to-b from-white/70 to-white/40 dark:from-ink-900/70 dark:to-ink-900/30 backdrop-blur-md border-b border-ink-100 dark:border-ink-800 shadow-premium z-50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <NavLink to="/" className="flex-shrink-0 flex items-center gap-2">
               {(!imageLoaded || imageError) && (
                  <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                     <BookOpen size={28}/>
                     <span className="font-display tracking-tight text-2xl font-bold">{t('header.title')}</span>
                  </div>
               )}
               {!imageError && (
                 <img 
                   src="/logo-cc.png" 
                   alt="CourseCopilot Logo" 
                   className={`h-10 w-auto ${!imageLoaded ? 'hidden' : 'block'}`}
                   onLoad={() => setImageLoaded(true)}
                   onError={() => setImageError(true)}
                 />
               )}
            </NavLink>
          </div>
          <div className="flex items-center gap-4">
            <select value={language} onChange={e => setLanguage(e.target.value)} className="input-premium w-[80px] py-1 text-sm">
                <option value="en">EN</option>
                <option value="ro">RO</option>
            </select>

            <button onClick={toggleTheme} className="p-2 rounded-full text-ink-600 dark:text-ink-300 hover:bg-ink-100/60 dark:hover:bg-ink-800/60 interactive-soft focus:outline-none focus:ring-2 focus:ring-primary-500">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            
            {user ? (
                 <div className="relative" ref={dropdownRef}>
                    <button onClick={() => setIsDropdownOpen(prev => !prev)} className="btn-premium--secondary px-3 py-2">
                        <UserIcon size={20} />
                         {user.first_name && <span className="hidden sm:inline text-sm font-medium pr-2">{user.first_name}</span>}
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 card-premium py-1 z-50">
                            <div className="px-4 py-3 text-sm text-ink-700 dark:text-ink-200 border-b dark:border-ink-700">
                                <p className="font-semibold">Signed in as</p>
                                <p className="truncate">{user.email}</p>
                            </div>
                            <div className="py-1">
                                <NavLink to="/profile" onClick={() => setIsDropdownOpen(false)} className="w-full text-left px-4 py-2 text-sm text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 flex items-center gap-3">
                                  <UserIcon size={16} />
                                  {t('header.profile')}
                                </NavLink>
                                <NavLink to="/dashboard" onClick={() => setIsDropdownOpen(false)} className="w-full text-left px-4 py-2 text-sm text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 flex items-center gap-3">
                                  <LayoutDashboard size={16} />
                                  {t('header.dashboard')}
                                </NavLink>
                                <NavLink to="/billing" onClick={() => setIsDropdownOpen(false)} className="w-full text-left px-4 py-2 text-sm text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 flex items-center gap-3">
                                  <CreditCard size={16} />
                                  {t('header.billing')}
                                </NavLink>
                            </div>
                            <div className="py-1">
                                <div className="my-1 separator-premium"></div>
                                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 flex items-center gap-3">
                                  <LogOut size={16} />
                                  {t('header.logout')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
              <NavLink to="/login" className="btn-premium">
                {t('header.login')}
              </NavLink>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;