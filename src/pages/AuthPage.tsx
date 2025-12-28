import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/I18nContext';

const AuthPage: React.FC = () => {
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let authResponse;
      if (isLogin) {
        authResponse = await supabase.auth.signInWithPassword({ email, password });
      } else {
        authResponse = await supabase.auth.signUp({ email, password });
      }

      if (authResponse.error) {
        throw authResponse.error;
      }
      
      // onAuthStateChange in AuthContext will handle navigation
      // but we can navigate here for a faster user experience.
      if (authResponse.data.user) {
        navigate('/dashboard');
      }

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Helmet>
        <title>Autentificare — CourseCopilot</title>
        <meta name="description" content="Autentifică-te pentru a accesa dashboardul și workspace-ul de cursuri." />
        <link rel="canonical" href={`https://coursecopilot.app${location.pathname}`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Autentificare — CourseCopilot" />
        <meta property="og:description" content="Intră în cont pentru a crea și gestiona cursuri cu AI." />
        <meta property="og:url" content={`https://coursecopilot.app${location.pathname}`} />
        <meta name="twitter:card" content="summary" />
      </Helmet>
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-center">
            {isLogin ? t('auth.login.title') : t('auth.signup.title')}
          </h2>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && <div className="p-3 text-center text-sm text-red-800 bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded-md">{error}</div>}
          <div className="space-y-4">
             <div>
              <label htmlFor="email" className="block text-sm font-medium">{t('auth.email')}</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
             <div>
              <label htmlFor="password">{t('auth.password')}</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-premium disabled:opacity-50"
            >
              {loading ? 'Processing...' : (isLogin ? t('auth.login.button') : t('auth.signup.button'))}
            </button>
          </div>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              {t('auth.orContinueWith')}
            </span>
          </div>
        </div>
        
        <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full inline-flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-3" aria-hidden="true" fill="currentColor" viewBox="0 0 16 16">
                <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.265H8V9.018h7.545z"/>
              </svg>
              <span>{t('auth.signInWithGoogle')}</span>
            </button>
        </div>

        <div className="text-sm text-center">
          <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
            {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
