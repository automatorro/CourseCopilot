import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../services/supabaseClient';
import { PRICING_PLANS } from '../constants';
import { Plan } from '../types';
import { Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [courseCount, setCourseCount] = useState(0);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    let isMounted = true;
    setIsLoadingCourses(true);
    
    const fetchCourseCount = async () => {
      const { count, error } = await supabase.from('courses').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      
      if (isMounted) {
        if (error) {
            console.error('Error fetching course count:', error);
        } else {
            setCourseCount(count || 0);
        }
        setIsLoadingCourses(false);
      }
    };
    
    fetchCourseCount();

    return () => {
        isMounted = false;
    };
  }, [user]);

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingDetails(true);
    const { error } = await supabase.from('profiles').update({ first_name: firstName, last_name: lastName }).eq('id', user.id);
    if (error) {
        showToast(`Error: ${error.message}`, 'error');
    } else {
        showToast(t('profile.details.success'), 'success');
    }
    setIsSavingDetails(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast(t('profile.password.mismatch'), 'error');
      return;
    }
    if (!password) return;
    setIsSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
        showToast(`Error: ${error.message}`, 'error');
    } else {
      showToast(t('profile.password.success'), 'success');
      setPassword('');
      setConfirmPassword('');
    }
    setIsSavingPassword(false);
  };

  if (!user) return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" size={32}/></div>;

  const planDetails = user.role === 'admin' ? PRICING_PLANS[Plan.Pro] : (PRICING_PLANS[user.plan] || PRICING_PLANS[Plan.Trial]);
  const canUpgrade = user.role !== 'admin' && (user.plan === Plan.Trial || user.plan === Plan.Basic);
  
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in-up">
      <h1 className="text-3xl font-bold text-center mb-12">{t('profile.title')}</h1>
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-6">{t('profile.details.title')}</h2>
            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium">{t('profile.details.firstName')}</label>
                <input type="text" id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600" />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium">{t('profile.details.lastName')}</label>
                <input type="text" id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600" />
              </div>
              <div className="pt-2">
                <button type="submit" disabled={isSavingDetails} className="w-full px-4 py-2 rounded-md font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 flex justify-center items-center">
                  {isSavingDetails ? <><Loader2 className="animate-spin mr-2" size={16}/>{t('profile.details.saving')}</> : t('profile.details.save')}
                </button>
              </div>
            </form>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-6">{t('profile.password.title')}</h2>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="password">{t('profile.password.new')}</label>
                <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600" />
              </div>
              <div>
                <label htmlFor="confirmPassword">{t('profile.password.confirm')}</label>
                <input type="password" id="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600" />
              </div>
              <div className="pt-2">
                <button type="submit" disabled={isSavingPassword || !password} className="w-full px-4 py-2 rounded-md font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 flex justify-center items-center">
                  {isSavingPassword ? <><Loader2 className="animate-spin mr-2" size={16}/>{t('profile.password.changing')}</> : t('profile.password.change')}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border dark:border-gray-700">
           <h2 className="text-2xl font-bold mb-6">{t('profile.subscription.title')}</h2>
           <div className="space-y-5">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('profile.subscription.currentPlan')}</p>
                <p className="text-xl font-semibold text-primary-600 dark:text-primary-400">{user.role === 'admin' ? 'Admin' : planDetails.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('profile.subscription.usage')}</p>
                 {isLoadingCourses ? <Loader2 className="animate-spin mt-1" size={20}/> : (
                    <>
                        <p className="text-lg font-semibold">
                            {user.role === 'admin' 
                                ? `${courseCount} courses used` 
                                : t('profile.subscription.coursesUsed', { count: courseCount, limit: planDetails.courseLimit })
                            }
                        </p>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-2">
                            <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: user.role === 'admin' ? '100%' : `${(courseCount / planDetails.courseLimit) * 100}%` }}></div>
                        </div>
                    </>
                 )}
              </div>
              {canUpgrade && (
                  <div className="pt-2">
                     <button onClick={() => navigate('/billing')} className="w-full flex justify-center items-center gap-2 px-4 py-2.5 rounded-md font-semibold text-white bg-green-600 hover:bg-green-700">
                        {t('profile.subscription.upgrade')}
                        <ArrowRight size={18}/>
                    </button>
                  </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;