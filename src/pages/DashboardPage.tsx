import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';
import NewCourseModal from '../components/NewCourseModal';
import { Course, GenerationEnvironment } from '../types';
import { PRICING_PLANS, LIVE_WORKSHOP_STEPS, ONLINE_COURSE_STEPS } from '../constants';
import { supabase } from '../services/supabaseClient';
import { deleteCourseById } from '../services/courseService';
import { PlusCircle, Loader2, Edit, Copy, Download, Trash2, Rocket } from 'lucide-react';
import { exportCourseAsZip } from '../services/exportService';

const GettingStartedGuide: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="text-center py-16 px-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
      <Rocket className="mx-auto h-12 w-12 text-primary-500" />
      <h2 className="mt-6 text-2xl font-bold">{t('dashboard.gettingStarted.title')}</h2>
      <p className="mt-2 text-gray-500 dark:text-gray-400">{t('dashboard.gettingStarted.subtitle')}</p>
      <div className="mt-8 text-left max-w-md mx-auto space-y-3">
        <p className="flex items-center gap-3"><span className="flex-shrink-0 bg-primary-600 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold text-sm">1</span> <span>{t('dashboard.gettingStarted.step1')}</span></p>
        <p className="flex items-center gap-3"><span className="flex-shrink-0 bg-primary-600 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold text-sm">2</span> <span>{t('dashboard.gettingStarted.step2')}</span></p>
        <p className="flex items-center gap-3"><span className="flex-shrink-0 bg-primary-600 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold text-sm">3</span> <span>{t('dashboard.gettingStarted.step3')}</span></p>
      </div>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});

  const courseLimit = user ? PRICING_PLANS[user.plan].courseLimit : 0;
  const isAdmin = user?.role === 'admin';
  const canCreateCourse = isAdmin || (user ? courses.length < courseLimit : false);

  useEffect(() => {
    let isMounted = true;
    const fetchCourses = async () => {
      if (!user) return;
      setIsLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select('*, steps:course_steps(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (isMounted) {
        if (error) {
          console.error('Error fetching courses:', error);
          showToast('Failed to load courses.', 'error');
        } else {
          setCourses(data || []);
        }
        setIsLoading(false);
      }
    };

    fetchCourses();

    return () => {
      isMounted = false;
    };
  }, [user, showToast]);

  const refetchCourses = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('courses')
      .select('*, steps:course_steps(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error refetching courses:', error);
    } else {
      setCourses(data || []);
    }
  };


  const handleCreateCourse = async (details: {
    title: string;
    subject: string;
    targetAudience: string;

    environment: GenerationEnvironment;
    language: string;
  }) => {
    if (!user) return;

    // 1. Insert the course
    const { data: newCourseData, error: courseError } = await supabase
      .from('courses')
      .insert({
        user_id: user.id,
        title: details.title,
        subject: details.subject,
        target_audience: details.targetAudience,
        environment: details.environment,
        language: details.language,
        progress: 0,
      })
      .select('*, steps:course_steps(*)')
      .single();

    if (courseError) {
      console.error("Error creating course:", courseError);
      showToast('Error creating course.', 'error');
      return;
    }

    // 2. Insert the course steps based on environment
    let stepsKeys = LIVE_WORKSHOP_STEPS;
    if (details.environment === GenerationEnvironment.OnlineCourse) {
      stepsKeys = ONLINE_COURSE_STEPS;
    } else if (details.environment === GenerationEnvironment.Corporate) {
      stepsKeys = LIVE_WORKSHOP_STEPS; // Fallback
    }

    const stepsToInsert = stepsKeys.map((key, index) => ({
      course_id: newCourseData.id,
      user_id: user.id,
      title_key: key,
      content: '',
      is_completed: false,
      step_order: index,
    }));

    const { error: stepsError } = await supabase.from('course_steps').insert(stepsToInsert);

    if (stepsError) {
      console.error("Error creating course steps:", stepsError);
      showToast('Error setting up course steps.', 'error');
      return;
    }

    newCourseData.steps = stepsToInsert.map(s => ({ ...s, id: '', created_at: new Date().toISOString() }));

    setCourses(prev => [newCourseData as Course, ...prev]);
    setIsModalOpen(false);
    navigate(`/course/${newCourseData.id}`);
  };

  const handleAction = async (courseId: string, action: 'duplicate' | 'delete' | 'download', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const key = `${action}-${courseId}`;
    // Pentru delete, gestionăm loader-ul în handleDelete după confirmare
    if (action === 'delete') {
      await handleDelete(courseId);
      return;
    }

    // Pentru celelalte acțiuni, menținem comportamentul existent
    setLoadingStates(prev => ({ ...prev, [key]: true }));
    switch (action) {
      case 'duplicate':
        await handleDuplicate(courseId);
        break;
      case 'download':
        await handleDownload(courseId);
        break;
    }
    setLoadingStates(prev => ({ ...prev, [key]: false }));
  };

  const handleDuplicate = async (courseId: string) => {
    const originalCourse = courses.find(c => c.id === courseId);
    if (!originalCourse || !user) return;

    const { data: newCourseData, error: courseError } = await supabase
      .from('courses')
      .insert({
        user_id: user.id,
        title: `(Copy) ${originalCourse.title}`,
        subject: originalCourse.subject,
        target_audience: originalCourse.target_audience,
        environment: originalCourse.environment,
        language: originalCourse.language,
        progress: 0,
      })
      .select('*, steps:course_steps(*)')
      .single();

    if (courseError) {
      console.error("Error duplicating course:", courseError);
      showToast('Failed to duplicate course.', 'error');
      return;
    }

    const originalSteps = originalCourse.steps || [];
    const newSteps = originalSteps.map(step => ({
      course_id: newCourseData.id,
      user_id: user.id,
      title_key: step.title_key,
      content: step.content,
      is_completed: false, // Reset progress
      step_order: step.step_order,
    }));

    if (newSteps.length > 0) {
      const { error: stepsError } = await supabase.from('course_steps').insert(newSteps);
      if (stepsError) {
        console.error("Error duplicating course steps:", stepsError);
        showToast('Failed to duplicate course steps.', 'error');
        return;
      }
      newCourseData.steps = newSteps.map(s => ({ ...s, id: '', created_at: new Date().toISOString() }));
    }

    setCourses(prev => [newCourseData as Course, ...prev]);
    showToast('Course duplicated successfully!', 'success');
  };

  const handleDelete = async (courseId: string) => {
    // Doar dialogul nativ de confirmare, fără toast suplimentar
    console.debug('[Dashboard] Delete clicked for', courseId);
    const confirmed = window.confirm('Sunteți sigur că doriți să ștergeți acest curs?');
    if (!confirmed || !user) return;

    const key = `delete-${courseId}`;
    setLoadingStates(prev => ({ ...prev, [key]: true }));
    try {
      // 2) Trimite cererea către backend și așteaptă răspunsul
      console.debug('[Dashboard] Sending delete request for', courseId);
      const result = await deleteCourseById(courseId, user.id);
      if (!result.ok) {
        console.error('Error deleting course:', result.message);
        // Păstrăm cardul și nu afișăm toast (evităm mesaje duplicat)
        // Re-sincronizează lista pentru a evita discrepanțe cu backend-ul
        await refetchCourses();
        return;
      }

      // 2.d) Nu mai eliminăm cardul local; ne bazăm pe refetch pentru consistență
      // 4) Refetch pentru persistență și sincronizare completă UI-DB
      try {
        await refetchCourses();
      } catch (e) {
        console.warn('Refetch eșuat după ștergere');
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  };

  // Removed unused helper to satisfy typecheck (TS6133).

  const handleDownload = async (courseId: string) => {
    const courseToDownload = courses.find(c => c.id === courseId);
    if (courseToDownload) {
      try {
        await exportCourseAsZip(courseToDownload, t);
      } catch (error) {
        console.error("Failed to export course:", error);
        showToast('Failed to prepare download.', 'error');
      }
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-[calc(100vh-8rem)]"><Loader2 className="animate-spin text-primary-500" size={48} /></div>;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={!canCreateCourse}
          className="btn-premium disabled:opacity-50"
          title={!canCreateCourse ? t('dashboard.limitReached') : ''}
        >
          <PlusCircle size={20} />
          {t('dashboard.newCourse')}
        </button>
      </div>

      {courses.length === 0 ? (
        <GettingStartedGuide />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map(course => (
            <div key={course.id} className="card-premium flex flex-col justify-between transform transition-transform hover:-translate-y-1">
              <div onClick={() => navigate(`/course/${course.id}`)} className="p-6 cursor-pointer flex-grow">
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-bold mb-2 pr-2">{course.title}</h2>
                  <span className={`flex-shrink-0 px-2 py-1 text-xs font-semibold rounded-full ${course.environment === GenerationEnvironment.OnlineCourse
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                    {t(`modal.newCourse.environment.${course.environment.toLowerCase()}`)}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{course.subject}</p>
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('dashboard.progress')}</span>
                    <span className="text-sm font-medium text-primary-600 dark:text-primary-400">{course.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${course.progress}%` }}></div>
                  </div>
                </div>
              </div>
              <div className="border-t dark:border-gray-700 p-2 flex justify-end items-center gap-1 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
                <button onClick={(e) => { e.stopPropagation(); navigate(`/course/${course.id}`) }} title="Edit" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
                  <Edit size={18} />
                </button>
                <button type="button" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => handleAction(course.id, 'duplicate', e)} title="Duplicate" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300" disabled={loadingStates[`duplicate-${course.id}`] || !canCreateCourse}>
                  {loadingStates[`duplicate-${course.id}`] ? <Loader2 size={18} className="animate-spin" /> : <Copy size={18} />}
                </button>
                {course.progress === 100 && (
                  <button type="button" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => handleAction(course.id, 'download', e)} title="Download" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300" disabled={loadingStates[`download-${course.id}`]}>
                    {loadingStates[`download-${course.id}`] ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  </button>
                )}
                <button type="button" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => handleAction(course.id, 'delete', e)} title="Delete" className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 text-red-500 dark:text-red-400" disabled={loadingStates[`delete-${course.id}`]}>
                  {loadingStates[`delete-${course.id}`] ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <NewCourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateCourse}
      />
    </div>
  );
};

export default DashboardPage;