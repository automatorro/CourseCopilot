import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { marked } from 'marked';
import TurndownService from 'turndown';

import { Course, CourseStep, CourseBlueprint } from '../types';

import { refineCourseContent } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';
import { CheckCircle, Circle, Loader2, Sparkles, Wand, DownloadCloud, Save, Lightbulb, Pilcrow, Combine, BookOpen, ChevronRight, X, ArrowLeft, ListTodo, Upload, Replace } from 'lucide-react';
import BlueprintEditModal from '../components/BlueprintEditModal';
import BlueprintRefineModal from '../components/BlueprintRefineModal';
import { exportCourseAsZip, exportCourseAsPptx, exportCourseAsPdf, getSlideModelsForPreview, getPedagogicWarnings } from '../services/exportService';
import ExportModal from '../components/ExportModal';
import SlidesPreviewModal from '../components/SlidesPreviewModal';
import { detectNonLocalizedFragments, compareModuleTitlesText, extractModuleDurations } from '../lib/outputValidators';
import { replaceBlobUrlsWithPublic, uploadBlobToStorage } from '../services/imageService';
import { useToast } from '../contexts/ToastContext';
import ReviewChangesModal from '../components/ReviewChangesModal';
import ImageStudioModal from '../components/ImageStudioModal';

import MarkdownPreview from '../components/MarkdownPreview';
import TinyEditor from '../components/editor/TinyEditor';
import OnboardingChat from '../components/OnboardingChat';
import UploadBlueprintModal from '../components/UploadBlueprintModal';
import LearningObjectivesGenerator from '../components/LearningObjectivesGenerator';
import BlueprintReview from '../components/BlueprintReview';
import FileManager from '../components/FileManager';
import ImportStagingModal from '../components/ImportStagingModal';
import { GenerationProgressModal } from '../components/GenerationProgressModal';
import { isEnabled } from '../config/featureFlags';
import '../styles/sticky-editor.css';
const HelpModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useTranslation();
  const helpItems = [
    { title: t('course.helpModal.step1.title'), desc: t('course.helpModal.step1.desc'), icon: BookOpen },
    { title: t('course.helpModal.step2.title'), desc: t('course.helpModal.step2.desc'), icon: Sparkles },
  ];
  const userSteps = [
    t('course.helpModal.userSteps.step1'),
    t('course.helpModal.userSteps.step2'),
    t('course.helpModal.userSteps.step3'),
    t('course.helpModal.userSteps.step4'),
    t('course.helpModal.userSteps.step5'),
    t('course.helpModal.userSteps.step6'),
    t('course.helpModal.userSteps.step7'),
    t('course.helpModal.userSteps.step8'),
    t('course.helpModal.userSteps.step9'),
  ];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 animate-fade-in-up" style={{ animationDuration: '0.3s', zIndex: 10000 }} role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all max-h-[85vh] overflow-y-auto">
        <div className="p-4 sm:p-6 text-center border-b dark:border-gray-700">
          <h2 className="text-2xl font-bold">{t('course.helpModal.title')}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('course.helpModal.intro')}</p>
        </div>
        <div className="p-6 sm:p-8 space-y-6">
          {helpItems.map((item, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="flex-shrink-0 bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300 rounded-full h-10 w-10 flex items-center justify-center">
                <item.icon size={20} />
              </div>
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
              </div>
            </div>
          ))}
          <div className="mt-6">
            <h3 className="text-lg font-bold mb-3">{t('course.helpModal.userSteps.title')}</h3>
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('course.helpModal.userSteps.intro')}</p>
              <div className="space-y-2">
                {userSteps.map((s, idx) => (
                  <p key={idx} className="flex items-center gap-3"><span className="flex-shrink-0 bg-primary-600 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold text-sm">{idx + 1}</span> <span>{s}</span></p>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 flex items-center gap-2">
            {t('course.helpModal.button')} <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};


const CourseWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [userCourses, setUserCourses] = useState<Array<{ id: string; title: string }>>([]);
  const [activeStepIndex, setActiveStepIndex] = useState(() => {
    if (!id) return 0;
    const saved = sessionStorage.getItem(`course_tab_${id}`);
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    if (id) {
      sessionStorage.setItem(`course_tab_${id}`, activeStepIndex.toString());
    }
  }, [activeStepIndex, id]);
  const [isGenerating] = useState(false);
  const [isProposingChanges, setIsProposingChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSlidesPreview, setShowSlidesPreview] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [editorRefreshTick, setEditorRefreshTick] = useState(0);
  const [isAiActionsOpen, setIsAiActionsOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [proposedContent, setProposedContent] = useState<string | null>(null);
  const [originalForProposal, setOriginalForProposal] = useState<string | null>(null);

  const [localRefinements, setLocalRefinements] = useState<Record<string, boolean>>({});

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showImageStudio, setShowImageStudio] = useState(false);
  const [imageMap, setImageMap] = useState<Record<string, { previewUrl?: string; publicUrl?: string; alt?: string }>>({});
  const [showLinkPanel, setShowLinkPanel] = useState(false);
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [showTablePanel, setShowTablePanel] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [linkUrlValid, setLinkUrlValid] = useState(true);
  const [imageUrlValid, setImageUrlValid] = useState(true);

  // Phase 1.4: Routing states for intelligent onboarding
  const [showLOGenerator, setShowLOGenerator] = useState(false);
  const [showBlueprintReview, setShowBlueprintReview] = useState(false);
  const [showBlueprintEdit, setShowBlueprintEdit] = useState(false);
  const [showBlueprintRefine, setShowBlueprintRefine] = useState(false);
  const [showUploadBlueprint, setShowUploadBlueprint] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [localImageFile, setLocalImageFile] = useState<File | null>(null);
  const [localImageError, setLocalImageError] = useState<string | null>(null);
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [previewCache, setPreviewCache] = useState<Record<string, string>>({});
  const [lastUndoSnapshot, setLastUndoSnapshot] = useState<{ stepId: string; content: string } | null>(null);
  
  // New state for staging remote files
  const [stagingFile, setStagingFile] = useState<{ url: string; type: string; name: string } | null>(null);

  const resolveTokensForPreview = useCallback((md: string) => {
    return md.replace(/!\[([^\]]*)\]\(@img\{([^}]+)\}\)/g, (_m, alt, id) => {
      const entry = imageMap[id];
      const url = entry?.publicUrl || entry?.previewUrl || '';
      const safeAlt = (alt || entry?.alt || 'Image').trim();
      if (!url) return `![${safeAlt}](data:image/gif;base64,R0lGODlhAQABAAAAACw=)`;
      return `![${safeAlt}](${url})`;
    });
  }, [imageMap]);

  const looksLikeHtml = useCallback((s: string) => /^\s*<(p|div|h[1-6]|ul|ol|li|blockquote|pre|table|section|article|span|b|i|strong|em|u|a|img)/i.test(s), []);

  useEffect(() => {
    // Force specific CSS variables for sticky positioning
    document.documentElement.style.setProperty('--editor-tabs-h', '48px');
    document.documentElement.style.setProperty('--editor-header-h', '0px'); // Header is no longer sticky

    const updateOffsets = () => {
      // Kept for resize listener but forcing values for stability
      document.documentElement.style.setProperty('--editor-tabs-h', '48px');
    };

    window.addEventListener('resize', updateOffsets);
    return () => window.removeEventListener('resize', updateOffsets);
  }, []);

  useEffect(() => {
    const steps = course?.steps || [];
    const indices = [activeStepIndex - 1, activeStepIndex + 1].filter(i => i >= 0 && i < steps.length);
    indices.forEach((i) => {
      const s = steps[i];
      const key = s.id || `idx-${i}`;
      if (previewCache[key]) return;
      const content = s.content || '';
      const html = looksLikeHtml(content) ? content : (marked.parse(resolveTokensForPreview(content)) as string);
      setPreviewCache(prev => ({ ...prev, [key]: html }));
    });
  }, [activeStepIndex, course?.steps, resolveTokensForPreview, looksLikeHtml]);

  // Debounce scroll updates via requestAnimationFrame pentru performanță
  useEffect(() => {
    const container = document.querySelector('.course-workspace-container') as HTMLElement | null;
    if (!container) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const y = container.scrollTop || 0;
        document.documentElement.style.setProperty('--scroll-y', `${Math.floor(y)}`);
        raf = 0;
      });
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    void showLinkPanel; void showImagePanel; void showTablePanel;
    void linkUrl; void linkText; void imageUrl; void imageAlt; void linkUrlValid; void imageUrlValid; void tableRows; void tableCols; void localImageFile; void localImageError;
    void setLinkUrl; void setLinkText; void setImageUrl; void setImageAlt; void setTableRows; void setTableCols;
  }, []);


  // Import document state (DOCX/TXT/PDF prototype)
  // const [importFile, setImportFile] = useState<File | null>(null);
  // const [importing, setImporting] = useState(false);
  // const [importError, setImportError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectionRef = useRef<{ start: number, end: number }>({ start: 0, end: 0 });
  const aiActionsDesktopRef = useRef<HTMLDivElement>(null);
  const aiActionsMobileRef = useRef<HTMLDivElement>(null);

  // ... (lines 133-728)

  // const parseDocxToSteps = async (arrayBuffer: ArrayBuffer): Promise<{ title_key: string; content: string }[]> => {
  //   try {
  //     const mammothLib: any = await import('mammoth');
  //     const result = await mammothLib.convertToHtml({ arrayBuffer });
  //     const html: string = result.value || '';
  //     const TurndownService = (await import('turndown')).default;
  //     const turndownPluginGfm = await import('turndown-plugin-gfm');
  //     const gfm = turndownPluginGfm.gfm || turndownPluginGfm;
  //     const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
  //     turndownService.use(gfm);
  //     const markdown = turndownService.turndown(html);
  //     return [{ title_key: 'course.steps.manual', content: markdown }];
  //   } catch (err) {
  //     console.error('DOCX parse error:', err);
  //     throw new Error('Nu s-a putut procesa fișierul DOCX.');
  //   }
  // };

  // const parsePdfToSteps = async (arrayBuffer: ArrayBuffer): Promise<{ title_key: string; content: string }[]> => {
  //   try {
  //     const pdfjsLib: any = await import('pdfjs-dist');
  //     pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  //     const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  //     let fullText = '';
  //     for (let i = 1; i <= pdf.numPages; i++) {
  //       const page = await pdf.getPage(i);
  //       const textContent = await page.getTextContent();
  //       const pageText = textContent.items.map((item: any) => item.str).join(' ');
  //       fullText += pageText + '\n\n';
  //     }
  //     return [{ title_key: 'course.steps.manual', content: fullText }];
  //   } catch (err) {
  //     console.error('PDF parse error:', err);
  //     throw new Error('Nu s-a putut procesa fișierul PDF.');
  //   }
  // };


  // Helper functions for image token system
  const genImageId = useCallback(() => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`, []);



  // Process @img tokens and upload images to storage, replacing tokens with public URLs
  const processImageTokensForSave = useCallback(async (md: string) => {
    let processed = md;
    const tokenMatches = [...md.matchAll(/!\[([^\]]*)\]\(@img\{([^}]+)\}\)/g)];

    for (const match of tokenMatches) {
      const [fullMatch, altText, tokenId] = match;
      const entry = imageMap[tokenId];

      if (entry?.previewUrl && !entry.publicUrl) {
        try {
          let blob: Blob;

          if (entry.previewUrl.startsWith('data:')) {
            // Convert data URL to blob
            const parts = entry.previewUrl.split(',');
            const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
            const bstr = atob(parts[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) u8arr[n] = bstr.charCodeAt(n);
            blob = new Blob([u8arr], { type: mime });
          } else if (entry.previewUrl.startsWith('blob:')) {
            // Fetch blob URL
            const res = await fetch(entry.previewUrl);
            if (!res.ok) continue;
            blob = await res.blob();
          } else {
            continue;
          }

          // Upload to storage
          const publicUrl = await uploadBlobToStorage(blob, user?.id || null, course?.id || null, altText);

          // Update imageMap with public URL
          setImageMap(prev => ({
            ...prev,
            [tokenId]: { ...prev[tokenId], publicUrl }
          }));

          // Replace token with public URL in content
          processed = processed.replace(fullMatch, `![${altText || entry.alt || 'Image'}](${publicUrl})`);
        } catch (error) {
          console.error('Failed to upload image token:', error);
          // Leave token as-is if upload fails
        }
      } else if (entry?.publicUrl) {
        // Already has public URL, just replace token
        processed = processed.replace(fullMatch, `![${altText || entry.alt || 'Image'}](${entry.publicUrl})`);
      }
    }

    return processed;
  }, [imageMap, user?.id, course?.id]);

  const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
  const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

  const fetchCourseData = useCallback(async () => {
    if (!id || !user) return null;
    const { data, error } = await supabase
      .from('courses')
      .select(`*, steps:course_steps(*)`)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    if (error) {
      console.error('Error fetching course data:', error);
      showToast('Failed to load course data.', 'error');
      return null;
    }
    const sortedSteps = (data?.steps || []).sort((a: CourseStep, b: CourseStep) => a.step_order - b.step_order);
    return { ...data, steps: sortedSteps } as Course;
  }, [id, user, showToast]);

  useEffect(() => {
    const loadUserCourses = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching user courses:', error);
        return;
      }
      setUserCourses((data || []).map(c => ({ id: c.id as string, title: c.title as string })));
    };
    loadUserCourses();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      const insideDesktop = aiActionsDesktopRef.current ? aiActionsDesktopRef.current.contains(targetNode) : false;
      const insideMobile = aiActionsMobileRef.current ? aiActionsMobileRef.current.contains(targetNode) : false;
      if (!insideDesktop && !insideMobile) {
        setIsAiActionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    void handleFormat;
    void handleSubmitLink;
    void handleSubmitImage;
    void handleLocalImageChange;
    void handleSubmitTable;
  }, []);

  useEffect(() => {
    const hasSeenHelp = localStorage.getItem('hasSeenWorkspaceHelp');
    if (hasSeenHelp !== 'true') {
      setIsHelpModalOpen(true);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'editor') {
      setEditorRefreshTick((n) => n + 1);
    }
  }, [activeTab]);

  const handleCloseHelpModal = () => {
    setIsHelpModalOpen(false);
    localStorage.setItem('hasSeenWorkspaceHelp', 'true');
  };

  useEffect(() => {
    let isMounted = true;
    const loadCourse = async () => {
      setIsLoading(true);
      const courseData = await fetchCourseData();
      if (isMounted && courseData) {
        setCourse(courseData);
        const stepsArr = courseData.steps ?? [];
        const firstIncompleteStep = stepsArr.findIndex((s: CourseStep) => !s.is_completed);
        setActiveStepIndex(firstIncompleteStep >= 0 ? firstIncompleteStep : 0);
      }
      if (isMounted) setIsLoading(false);
    };
    loadCourse();
    return () => { isMounted = false; };
  }, [fetchCourseData]);

  // Phase 1.4: Routing logic for intelligent onboarding
  useEffect(() => {
    if (!course) {
      setShowLOGenerator(false);
      setShowBlueprintReview(false);
      return;
    }

    // Decision tree based on course state
    if (!course.learning_objectives) {
      setShowLOGenerator(true);
      setShowBlueprintReview(false);
    } else if (!course.blueprint) {
      setShowLOGenerator(false);
      setShowBlueprintReview(false);
    } else {
      // Both exist. Check if we should show the review or the editor.
      // Heuristic: If we have any steps, we assume the course is generated.
      const stepCount = (course.steps || []).length;
      const hasGeneratedSteps = stepCount > 0;

      console.log('[CourseWorkspace] Routing check:', { stepCount, hasGeneratedSteps });

      setShowLOGenerator(false);
      setShowBlueprintReview(!hasGeneratedSteps);
    }
  }, [course]);

  const originalContentForStep = course?.steps?.[activeStepIndex]?.content ?? '';

  useEffect(() => {
    const isHtml = /<[a-z][\s\S]*>/i.test(originalContentForStep || '');
    const next = isHtml ? originalContentForStep : marked.parse(originalContentForStep || '', { breaks: true }) as string;
    setEditedContent(next);
  }, [originalContentForStep]);

  // Asigură resetarea editorului imediat ce se schimbă pasul activ
  useEffect(() => {
    const nextContent = course?.steps?.[activeStepIndex]?.content ?? '';
    const isHtml = /<[a-z][\s\S]*>/i.test(nextContent || '');
    const next = isHtml ? nextContent : marked.parse(nextContent || '', { breaks: true }) as string;
    setEditedContent(next);
  }, [activeStepIndex]);

  const originalHtml = /<[a-z][\s\S]*>/i.test(originalContentForStep || '')
    ? (originalContentForStep || '')
    : (marked.parse(originalContentForStep || '', { breaks: true }) as string);
  const hasUnsavedChanges = editedContent !== originalHtml;

  const handleGenerate = useCallback(async () => {
    if (!course) return;
    // New Flow: Open the Generation Modal
    setShowGenerationModal(true);
  }, [course]);

  const handleGenerationComplete = async () => {
    setShowGenerationModal(false);
    showToast('Course materials generated successfully!', 'success');
    // Reload course to get the new steps
    const updated = await fetchCourseData();
    if (updated) {
      setCourse(updated);
      // Go to first step
      setActiveStepIndex(0);
    }
  };

  useEffect(() => {
    if (!course) return;
    const currentStep = course.steps?.[activeStepIndex];
    if (!currentStep) return;
    const key = `autosave:${course.id}:${currentStep.id}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved && saved.length > 0) {
        setEditedContent(saved);
      }
    } catch (e) { console.warn('Autosave read failed', e); }
  }, [course, activeStepIndex]);

  useEffect(() => {
    if (!course) return;
    const currentStep = course.steps?.[activeStepIndex];
    if (!currentStep) return;
    const key = `autosave:${course.id}:${currentStep.id}`;
    const interval = setInterval(() => {
      try {
        localStorage.setItem(key, editedContent || '');
      } catch (e) { console.warn('Autosave write failed', e); }
    }, 7000);
    return () => clearInterval(interval);
  }, [course, activeStepIndex, editedContent]);

  const handleAiAction = async (actionType: 'simplify' | 'expand' | 'example') => {
    if (!course || !course.steps) return;
    setIsAiActionsOpen(false);
    setIsProposingChanges(true);
    showToast('Rafinare în curs...', 'info');

    try {
      const currentStep = course.steps[activeStepIndex];
      const isHtml = /<[a-z][\s\S]*>/i.test(editedContent || '');
      let payloadMd: string;
      try {
        if (isHtml) {
          const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
          payloadMd = turndown.turndown(editedContent);
        } else {
          payloadMd = editedContent;
        }
      } catch {
        payloadMd = isHtml ? htmlToSimpleMarkdown(editedContent || '') : (editedContent || '');
      }

      if (!payloadMd || payloadMd.trim().length === 0) {
        throw new Error('Selectează text sau adaugă conținut pentru rafinare.');
      }

      if (!selectedText || !selectedText.trim()) {
        throw new Error('Selectează un fragment de text pentru rafinare.');
      }

      const refinedText = await refineCourseContent(course, currentStep, payloadMd, selectedText, actionType);
      if (!refinedText || refinedText.trim().length === 0) {
        throw new Error('Serviciul de AI nu a returnat conținut. Încearcă din nou.');
      }
      const refinedHtml = marked.parse(refinedText || '', { breaks: true }) as string;
      setOriginalForProposal(editedContent);
      let previewHtml = refinedHtml;
      if (selectionRef.current.end > selectionRef.current.start) {
        const { start, end } = selectionRef.current;
        previewHtml = (editedContent.substring(0, start) + refinedHtml + editedContent.substring(end));
      }
      setProposedContent(previewHtml);
      console.log('[Refine] Proposed content prepared', { length: previewHtml.length, hasOriginal: !!editedContent });
      showToast('Propunere generată. Verifică și acceptă modificarea.', 'success');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Rafinarea a eșuat.';
      showToast(msg, 'error');
    } finally {
      setIsProposingChanges(false);
    }
  };

  const handleAcceptChanges = () => {
    if (proposedContent === null) return;

    if (selectedText && selectionRef.current.end > selectionRef.current.start) {
      const { start, end } = selectionRef.current;
      const newContent = editedContent.substring(0, start) + proposedContent + editedContent.substring(end);
      setEditedContent(newContent);
      if (course && course.steps) {
        const currentStep = course.steps[activeStepIndex];
        const key = currentStep.id || `idx-${activeStepIndex}`;
        setLocalRefinements(prev => ({ ...prev, [key]: true }));
      }
    } else {
      setEditedContent(proposedContent);
      if (course && course.steps) {
        const currentStep = course.steps[activeStepIndex];
        const key = currentStep.id || `idx-${activeStepIndex}`;
        setLocalRefinements(prev => ({ ...prev, [key]: true }));
      }
    }

    setProposedContent(null);
    setOriginalForProposal(null);
    setSelectedText('');
    selectionRef.current = { start: 0, end: 0 };
  };

  const handleRejectChanges = () => {
    setProposedContent(null);
    setOriginalForProposal(null);
  };

  const handleSaveChanges = async (andContinue = false) => {
    if (!course || !course.steps) return;
    setIsSaving(true);

    const currentStep = course.steps[activeStepIndex];
    const isCompletingStep = andContinue && !currentStep.is_completed;

    // Convert any blob: URLs to public Storage URLs before saving
    // Process image tokens first, then convert any remaining blob: URLs to public Storage URLs before saving
    const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
    const mdContent = turndown.turndown(editedContent);
    const normalizeExternalImageLinks = (md: string): string => {
      try {
        let out = md;
        out = out.replace(/https?:\/\/unsplash\.com\/photos\/[\S)]+/gi, (m) => {
          const last = (m.split('/').pop() || '').split('?')[0];
          const id = last.includes('-') ? (last.split('-').pop() || last) : last;
          return `https://source.unsplash.com/${id}/1600x900`;
        });
        out = out.replace(/https?:\/\/(?:www\.)?pexels\.com\/photo\/[\w-]*?(\d+)\/?/gi, (_m, id) => {
          const safeId = String(id);
          return `https://images.pexels.com/photos/${safeId}/pexels-photo-${safeId}.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900`;
        });
        out = out.replace(/https?:\/\/(?:www\.)?pixabay\.com\/photos\/[\w-]*?(\d+)\/?/gi, (_m, id) => {
          const safeId = String(id);
          return `https://cdn.pixabay.com/photo/${safeId}_1280.jpg`;
        });
        return out;
      } catch {
        return md;
      }
    };
    const mdNormalized = normalizeExternalImageLinks(mdContent);
    const contentWithProcessedTokens = await processImageTokensForSave(mdNormalized);
    const processedContent = await replaceBlobUrlsWithPublic(contentWithProcessedTokens, user?.id || null, course?.id || null);

    // Pre-save validation
    try {
      const byKey: Record<string, string> = Object.fromEntries((course.steps || []).map(s => [s.title_key, s.id === currentStep.id ? processedContent : (s.content || '')]));
      const items: { ok: boolean; message: string }[] = [];
      let nonLocalizedIssue = false;

      if ((course.language || 'en').toLowerCase() !== 'en') {
        const res = detectNonLocalizedFragments(byKey[currentStep.title_key] || '', course.language || 'ro');
        if (!res.ok) {
          nonLocalizedIssue = true;
          items.push({ ok: false, message: t('validation.nonLocalized', { key: t(currentStep.title_key), hints: res.hints.join(', ') }) });
        } else {
          items.push({ ok: true, message: t('validation.okNonLocalized', { key: t(currentStep.title_key) }) });
        }
      }

      if (byKey['course.livrables.structure'] && byKey['course.livrables.slides']) {
        const cmp = compareModuleTitlesText(byKey['course.livrables.structure'], byKey['course.livrables.slides']);
        items.push({ ok: cmp.ok, message: cmp.ok ? t('validation.modulesMatch') : t('validation.modulesMismatch') });
      }

      if (byKey['course.livrables.structure'] && byKey['course.livrables.participant_workbook']) {
        const a = extractModuleDurations(byKey['course.livrables.structure']);
        const b = extractModuleDurations(byKey['course.livrables.participant_workbook']);
        const ok = a.length === b.length && a.every((d, i) => d === b[i]);
        items.push({ ok, message: ok ? t('validation.durationMatch') : t('validation.durationMismatch') });
      }

      const anyIssue = items.some(i => !i.ok);
      if (anyIssue) {
        showToast(t('validation.titleIssues'), 'info');
        if (isEnabled('validationStrictLocalization') && nonLocalizedIssue) {
          setIsSaving(false);
          return;
        }
      }
    } catch (e) { console.warn('Validation check failed', e); }

    const stepUpdatePayload: { content: string, is_completed?: boolean } = {
      content: processedContent
    };
    if (isCompletingStep) {
      stepUpdatePayload.is_completed = true;
    }

    const { error: stepError } = await supabase
      .from('course_steps')
      .update(stepUpdatePayload)
      .eq('id', currentStep.id);

    if (stepError) {
      console.error("Error updating step:", stepError);
      showToast('Failed to save changes.', 'error');
      setIsSaving(false);
      return;
    }

    // Reflect processed content back into editor as HTML
    const html = marked.parse(processedContent || '', { breaks: true }) as string;
    setEditedContent(html);
    showToast('Changes saved successfully!', 'success');

    const updatedCourseData = await fetchCourseData();
    if (updatedCourseData) {
      setCourse(updatedCourseData);
      // Actualizează progresul cursului în funcție de pașii completați
      const total = (updatedCourseData.steps ?? []).length;
      const done = (updatedCourseData.steps ?? []).filter((s: CourseStep) => s.is_completed).length;
      const progressPct = total > 0 ? Math.round((done / total) * 100) : 0;
      try {
        await supabase
          .from('courses')
          .update({ progress: progressPct })
          .eq('id', updatedCourseData.id);
        // Reflectă progresul și local
        setCourse((prev: Course | null) => prev ? { ...prev, progress: progressPct } : prev);
      } catch (e) {
        console.warn('Progress update failed:', e);
      }
    }

    if (isCompletingStep && activeStepIndex < course.steps.length - 1) {
      setActiveStepIndex((prev: number) => prev + 1);
    }
    setIsSaving(false);
  };

  const handleDownload = async () => {
    if (!course) return;
    try {
      const models = await getSlideModelsForPreview(course);
      const hasCritical = models.some(m => (getPedagogicWarnings(m) || []).some(w => w.startsWith('[CRITICAL]')));
      if (hasCritical) {
        showToast('Există probleme critice în slide-uri. Rezolvă-le în Previzualizare înainte de export.', 'error');
        setShowSlidesPreview(true);
        return;
      }
    } catch (e) { void e; }
    setShowExportModal(true);
  };

  const handleExport = async (format: 'pptx' | 'pdf' | 'zip') => {
    if (!course) return;
    setIsExporting(true);
    try {
      const models = await getSlideModelsForPreview(course);
      const hasCritical = models.some(m => (getPedagogicWarnings(m) || []).some(w => w.startsWith('[CRITICAL]')));
      if (hasCritical) {
        showToast('Există probleme critice în slide-uri. Rezolvă-le în Previzualizare înainte de export.', 'error');
        setShowSlidesPreview(true);
        setIsExporting(false);
        return;
      }
      if (format === 'pptx') {
        await exportCourseAsPptx(course);
      } else if (format === 'pdf') {
        await exportCourseAsPdf(course);
      } else if (format === 'zip') {
        await exportCourseAsZip(course, t);
      }
      setShowExportModal(false);
    } catch (error) {
      console.error('Failed to export course:', error);
      showToast('Exportul a eșuat.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFormat = (formatType: 'bold' | 'italic' | 'underline' | 'strike' | 'code' | 'codeblock' | 'blockquote' | 'hr' | 'h1' | 'h2' | 'ul' | 'ol' | 'link' | 'image' | 'task' | 'table') => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = editedContent.substring(start, end);
    let newContent = editedContent;

    if (formatType === 'bold' || formatType === 'italic' || formatType === 'strike' || formatType === 'code') {
      const syntax = formatType === 'bold' ? '**' : formatType === 'italic' ? '*' : formatType === 'strike' ? '~~' : '`';
      newContent = `${editedContent.substring(0, start)}${syntax}${selected}${syntax}${editedContent.substring(end)}`;
    } else {
      const lineStartIdx = editedContent.lastIndexOf('\n', start - 1) + 1;
      const lineEndIdx = editedContent.indexOf('\n', end);
      const effectiveEnd = lineEndIdx === -1 ? editedContent.length : lineEndIdx;
      const linesText = editedContent.substring(lineStartIdx, effectiveEnd);
      const lines = linesText.split('\n');

      let formatted = '';
      if (formatType === 'h1' || formatType === 'h2') {
        const prefix = formatType === 'h1' ? '# ' : '## ';
        formatted = prefix + lines[0];
        if (lines.length > 1) formatted += '\n' + lines.slice(1).join('\n');
      } else if (formatType === 'ul') {
        formatted = lines.map((line: string) => `* ${line}`).join('\n');
      } else if (formatType === 'ol') {
        formatted = lines.map((line: string, idx: number) => `${idx + 1}. ${line}`).join('\n');
      } else if (formatType === 'task') {
        formatted = lines.map((line: string) => `- [ ] ${line}`).join('\n');
      } else if (formatType === 'blockquote') {
        formatted = lines.map((line: string) => `> ${line}`).join('\n');
      } else if (formatType === 'codeblock') {
        formatted = '```\n' + lines.join('\n') + '\n```';
      } else if (formatType === 'hr') {
        formatted = '---';
      } else if (formatType === 'underline') {
        // Markdown nu are underline nativ; folosim tag HTML
        formatted = `<u>${lines.join('\n')}</u>`;
      }
      newContent = `${editedContent.substring(0, lineStartIdx)}${formatted}${editedContent.substring(effectiveEnd)}`;
    }
    setEditedContent(newContent);
    setTimeout(() => textarea.focus(), 0);
  };

  const handleSubmitLink = () => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = editedContent.substring(start, end);
    const text = selected && selected.length > 0 ? selected : (linkText || 'Link');
    const url = linkUrl.trim();
    let valid = false;
    try { const u = new URL(url); valid = u.protocol.startsWith('http'); } catch { valid = false; }
    setLinkUrlValid(valid);
    if (!url || !valid) { return; }
    const insert = `[${text}](${url})`;
    const newContent = `${editedContent.substring(0, start)}${insert}${editedContent.substring(end)}`;
    setEditedContent(newContent);
    setShowLinkPanel(false);
    setTimeout(() => textarea.focus(), 0);
  };

  const handleSubmitImage = () => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const alt = imageAlt?.trim() || 'Image';
    const url = imageUrl.trim();
    let valid = false;
    try { const u = new URL(url); valid = u.protocol.startsWith('http'); } catch { valid = false; }
    setImageUrlValid(valid);
    if (!url || !valid) { return; }
    const insert = `![${alt}](${url})`;
    const newContent = `${editedContent.substring(0, start)}${insert}${editedContent.substring(end)}`;
    setEditedContent(newContent);
    setShowImagePanel(false);
    setTimeout(() => textarea.focus(), 0);
  };

  const insertImageAtCursor = (url: string, alt: string = 'Image') => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const safeAlt = alt?.trim() || 'Image';
    let insert = '';

    if (url.startsWith('data:') || url.startsWith('blob:')) {
      const id = genImageId();
      setImageMap((prev: Record<string, { previewUrl?: string; publicUrl?: string; alt?: string }>) => ({ ...prev, [id]: { previewUrl: url, alt: safeAlt } }));
      insert = `![${safeAlt}](@img{${id}})`;
    } else {
      insert = `![${safeAlt}](${url})`;
    }
    const newContent = `${editedContent.substring(0, start)}${insert}${editedContent.substring(end)}`;
    setEditedContent(newContent);
    setTimeout(() => textarea.focus(), 0);
  };



  const handleLocalImageChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0] || null;
    setLocalImageError(null);
    setLocalImageFile(null);
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setLocalImageError('Tip de fișier neacceptat. Folosește PNG, JPEG, GIF sau WEBP.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setLocalImageError('Fișier prea mare. Limita este 8MB.');
      return;
    }
    setLocalImageFile(file);
    const doInsert = async () => {
      if (!textareaRef.current) return;
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const alt = imageAlt?.trim() || file.name || 'Image';
      try {
        const dataUrl = await fileToDataURL(file);
        const insert = `![${alt}](${dataUrl})`;
        const newContent = `${editedContent.substring(0, start)}${insert}${editedContent.substring(end)}`;
        setEditedContent(newContent);
        setShowImagePanel(false);
        setTimeout(() => textarea.focus(), 0);
      } catch {
        setLocalImageError('Nu am putut procesa imaginea. Încearcă din nou.');
      }
    };
    doInsert();
  };

  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Eroare la citirea fișierului.'));
      reader.readAsDataURL(file);
    });
  };

  // Removed unused local image insertion helper; insertion is handled in handleLocalImageChange

  // =============================
  // Document Import (Prototype)
  // =============================
  // const handleImportFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
  //   const file = e.target.files?.[0] || null;
  //   setImportFile(file);
  //   setImportError(null);
  // };

  // const processImportDocument = async () => {
  //   if (!importFile || !course || !user) return;
  //   setImporting(true);
  //   setImportError(null);
  //   try {
  //     const arrayBuffer = await importFile.arrayBuffer();
  //     const ext = importFile.name.toLowerCase().split('.').pop() || '';
  //     let contentToLoad = '';

  //     if (ext === 'docx') {
  //       const steps = await parseDocxToSteps(arrayBuffer);
  //       contentToLoad = steps[0]?.content || '';
  //     } else if (ext === 'txt') {
  //       const text = new TextDecoder().decode(new Uint8Array(arrayBuffer));
  //       contentToLoad = text;
  //     } else if (ext === 'pdf') {
  //       const steps = await parsePdfToSteps(arrayBuffer);
  //       contentToLoad = steps[0]?.content || '';
  //     } else {
  //       throw new Error('Format neacceptat. Accept: .docx, .txt, .pdf');
  //     }

  //     if (!contentToLoad) throw new Error('Nu s-a putut extrage conținut din document.');

  //     // Update editor content directly
  //     setEditedContent(contentToLoad);

  //     // Reset file input
  //     setImportFile(null);
  //     if (document.querySelector('input[type="file"]')) {
  //       (document.querySelector('input[type="file"]') as HTMLInputElement).value = '';
  //     }

  //     showToast('Conținutul a fost încărcat în editor. Verifică și salvează.', 'success');

  //   } catch (err: any) {
  //     console.error('Import error:', err);
  //     setImportError(err.message || 'A apărut o eroare la import.');
  //     showToast('Import nereușit.', 'error');
  //   } finally {
  //     setImporting(false);
  //   }
  // };

  // const parseDocxToSteps = async (arrayBuffer: ArrayBuffer): Promise<{ title_key: string; content: string }[]> => {
  //   try {
  //     const mammothLib: any = await import('mammoth');
  //     // Mammoth converts images to base64 by default
  //     const result = await mammothLib.convertToHtml({ arrayBuffer });
  //     const html: string = result.value || '';

  //     // Use TurndownService to preserve images and better formatting
  //     const turndownService = new TurndownService({
  //       headingStyle: 'atx',
  //       codeBlockStyle: 'fenced'
  //     });
  //     // Use GFM plugin for tables
  //     turndownService.use(gfm);
  //     // Keep images
  //     turndownService.keep(['img']);

  //     const md = turndownService.turndown(html);

  //     // Return single step
  //     return [{ title_key: 'course.steps.manual', content: md }];
  //   } catch (e) {
  //     console.warn('DOCX parse fallback:', e);
  //     const text = new TextDecoder().decode(new Uint8Array(arrayBuffer));
  //     return [{ title_key: 'course.steps.manual', content: text }];
  //   }
  // };

  // const parsePdfToSteps = async (arrayBuffer: ArrayBuffer): Promise<{ title_key: string; content: string }[]> => {
  //   try {
  //     const pdfjsLib: any = await import('pdfjs-dist');
  //     // Configure worker for performance
  //     try {
  //       pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  //     } catch (e) { console.warn('PDF worker config warning:', e); }

  //     const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  //     let fullText = '';
  //     for (let i = 1; i <= pdf.numPages; i++) {
  //       const page = await pdf.getPage(i);
  //       const textContent = await page.getTextContent();
  //       const pageText = textContent.items.map((item: any) => item.str).join(' ');
  //       fullText += pageText + '\n\n';
  //     }
  //     return [{ title_key: 'course.steps.manual', content: fullText }];
  //   } catch (err) {
  //     console.error('PDF parse error:', err);
  //     throw new Error('Nu s-a putut procesa fișierul PDF.');
  //   }
  // };
  // const workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
  // if (pdfjsLib?.GlobalWorkerOptions) {
  //   pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
  // }
  // } catch { /* best-effort; continue */ }

  // const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  // const pdf = await loadingTask.promise;

  // let fullContent = '';

  // for (let p = 1; p <= pdf.numPages; p++) {
  //   const page = await pdf.getPage(p);
  //   const textContent = await page.getTextContent();

  //   // Join items with space and clean up excessive whitespace
  //   const pageText = textContent.items.map((i: any) => (i.str || '')).join(' ');
  //   const cleanText = pageText.replace(/\s{2,}/g, ' ').trim();

  //   if (cleanText.length > 0) {
  //     fullContent += `# Slide ${p}\n\n${cleanText}\n\n---\n\n`;
  //   }
  // }

  // return [{ title_key: 'course.steps.slides', content: fullContent }];
  //   } catch (e) {
  // console.warn('PDF parse failed:', e);
  // throw new Error('Nu am potut procesa PDF-ul. Verifică fișierul sau încearcă altul.');
  // }
  // };



  const htmlToSimpleMarkdown = (html: string): string => {
    return html
      .replace(/<h1[^>]*>/gi, '# ').replace(/<\/h1>/gi, '\n\n')
      .replace(/<h2[^>]*>/gi, '## ').replace(/<\/h2>/gi, '\n\n')
      .replace(/<h3[^>]*>/gi, '### ').replace(/<\/h3>/gi, '\n\n')
      .replace(/<p[^>]*>/gi, '').replace(/<\/p>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<ul[^>]*>/gi, '').replace(/<\/ul>/gi, '')
      .replace(/<ol[^>]*>/gi, '').replace(/<\/ol>/gi, '')
      .replace(/<li[^>]*>/gi, '- ').replace(/<\/li>/gi, '\n')
      .replace(/<strong[^>]*>/gi, '**').replace(/<\/strong>/gi, '**')
      .replace(/<b[^>]*>/gi, '**').replace(/<\/b>/gi, '**')
      .replace(/<em[^>]*>/gi, '*').replace(/<\/em>/gi, '*')
      .replace(/<i[^>]*>/gi, '*').replace(/<\/i>/gi, '*')
      .replace(/<[^>]+>/g, '')
      .trim();
  };



  const handleSubmitTable = () => {
    if (!textareaRef.current) return;
    const rows = Math.max(1, Math.min(20, Number(tableRows) || 1));
    const cols = Math.max(1, Math.min(10, Number(tableCols) || 1));
    const header = Array.from({ length: cols }, (_, i) => `Col ${i + 1}`).join(' | ');
    const sep = Array.from({ length: cols }, () => '---').join(' | ');
    const bodyRows = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ' ').join(' | ')).join('\n');
    const tableMd = `${header}\n${sep}\n${bodyRows}\n`;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = `${editedContent.substring(0, start)}${tableMd}${editedContent.substring(end)}`;
    setEditedContent(newContent);
    setShowTablePanel(false);
    setTimeout(() => textarea.focus(), 0);
  };



  const currentStep = course?.steps?.[activeStepIndex];

  // Phase 1.4: Handler for LO Generator completion
  const handleLOComplete = async () => {
    if (!course || !id) return;
    // Refresh course data
    const courseData = await fetchCourseData();
    if (courseData) {
      setCourse(courseData);
      showToast('Learning objectives saved successfully!', 'success');
    }
  };



  // Phase 1.4: Handler for Blueprint generation - UPDATED to use 12-step flow
  const handleGenerateContent = async () => {
    if (!course || !course.blueprint) return;

    // Close blueprint review and open the new 12-step generation modal
    setShowBlueprintReview(false);
    setShowGenerationModal(true);
  };

  const handleBlueprintReady = async (blueprint: CourseBlueprint) => {
    if (!course) return;

    const { error } = await supabase
      .from('courses')
      .update({ blueprint })
      .eq('id', course.id);

    if (error) {
      console.error('Failed to save blueprint:', error);
      showToast('Failed to save course blueprint.', 'error');
      return;
    }

    setCourse(prev => prev ? { ...prev, blueprint } : null);
    showToast('Blueprint created! Welcome to the editor.', 'success');
  };

  if (isLoading || !course) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-primary-500" size={32} /></div>;
  }

  // Phase 1.4: Conditional rendering based on  course state
  if (showLOGenerator) {
    return (
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <div className="border-b bg-white dark:bg-gray-800 p-4 flex items-center gap-4 shadow-sm">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">{course.title} <span className="text-gray-400 font-normal">| Define Learning Objectives</span></h1>
        </div>
        <div className="flex-grow overflow-y-auto p-8">
          <LearningObjectivesGenerator
            course={course}
            onComplete={handleLOComplete}
          />
        </div>
      </div>
    );
  }

  if (showBlueprintReview && course.blueprint) {
    return (
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <div className="border-b bg-white dark:bg-gray-800 p-4 flex items-center gap-4 shadow-sm">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">{course.title} <span className="text-gray-400 font-normal">| Review Blueprint</span></h1>
        </div>
        <div className="flex-grow overflow-y-auto">
          <BlueprintReview
            blueprint={course.blueprint}
            onGenerateContent={handleGenerateContent}
            onRefine={() => setShowBlueprintRefine(true)}
            onEdit={() => setShowBlueprintEdit(true)}
          />
        </div>
        {showBlueprintEdit && (
          <BlueprintEditModal
            isOpen={showBlueprintEdit}
            blueprint={course.blueprint}
            onClose={() => setShowBlueprintEdit(false)}
            onSave={async (bp) => {
              const { error } = await supabase
                .from('courses')
                .update({ blueprint: bp })
                .eq('id', course.id);
              if (error) {
                console.error('Failed to save blueprint:', error);
                showToast('Failed to save updated blueprint.', 'error');
                return;
              }
              setCourse(prev => prev ? { ...prev, blueprint: bp } : null);
              showToast('Blueprint updated successfully.', 'success');
            }}
          />
        )}
        {showBlueprintRefine && (
          <BlueprintRefineModal
            isOpen={showBlueprintRefine}
            course={course}
            original={course.blueprint}
            onClose={() => setShowBlueprintRefine(false)}
            onAccept={async (bp) => {
              const { error } = await supabase
                .from('courses')
                .update({ blueprint: bp })
                .eq('id', course.id);
              if (error) {
                console.error('Failed to save refined blueprint:', error);
                showToast('Failed to save refined blueprint.', 'error');
                return;
              }
              setCourse(prev => prev ? { ...prev, blueprint: bp } : null);
              setShowBlueprintRefine(false);
              showToast('Blueprint refined and saved.', 'success');
            }}
          />
        )}
      </div>
    );
  }

  if (!course.blueprint) {
    return (
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <div className="border-b bg-white dark:bg-gray-800 p-4 flex items-center gap-4 shadow-sm">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">{course.title} <span className="text-gray-400 font-normal">| Onboarding</span></h1>
        </div>
        <div className="flex-grow overflow-hidden">
          <div className="p-4 flex items-center gap-2">
            <button
              onClick={() => setShowUploadBlueprint(false)}
              className={`px-3 py-2 rounded-md text-sm font-medium border ${!showUploadBlueprint ? 'bg-primary-50 border-primary-300 text-primary-700 dark:bg-primary-900/20 dark:border-primary-700' : 'border-gray-200 dark:border-gray-700'}`}
            >Chat Onboarding</button>
            <button
              onClick={() => setShowUploadBlueprint(true)}
              className={`px-3 py-2 rounded-md text-sm font-medium border ${showUploadBlueprint ? 'bg-primary-50 border-primary-300 text-primary-700 dark:bg-primary-900/20 dark:border-primary-700' : 'border-gray-200 dark:border-gray-700'}`}
            >Analizează material</button>
          </div>
          {!showUploadBlueprint ? (
            <OnboardingChat course={course} onBlueprintReady={handleBlueprintReady} />
          ) : (
            <UploadBlueprintModal
              isOpen={true}
              onClose={() => setShowUploadBlueprint(false)}
              course={course}
              onBlueprintReady={handleBlueprintReady}
            />
          )}
        </div>
      </div>
    );
  }

  if (showGenerationModal) {
    return (
      <div className="relative h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="animate-spin text-primary-500" size={32} />
          <span className="ml-2 text-gray-500">Generating course content...</span>
        </div>
        <GenerationProgressModal
          isOpen={true}
          onClose={() => {
            setShowGenerationModal(false);
            // If we closed without generating steps, go back to blueprint
            if ((course.steps || []).length === 0) {
              setShowBlueprintReview(true);
            }
          }}
          course={course}
          onComplete={handleGenerationComplete}
        />
      </div>
    );
  }

  if (!currentStep) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-primary-500" size={32} /> <span className="ml-2">Preparing workspace...</span></div>;
  }

  const isLastStep = activeStepIndex === ((course.steps?.length ?? 0) - 1);
  const isCourseComplete = (course.steps ?? []).every((s: CourseStep) => s.is_completed);
  const isBusy = isGenerating || isProposingChanges;
  const canEdit = !isBusy;
  const canGenerate = canEdit && !currentStep.is_completed;
  const canRefine = canEdit && !!editedContent && !!selectedText.trim();


  return (
    <div className="course-workspace-container flex flex-col lg:flex-row overflow-x-hidden">
      {isHelpModalOpen && <HelpModal onClose={handleCloseHelpModal} />}
      {proposedContent !== null && (
        <ReviewChangesModal
          originalContent={originalForProposal ?? editedContent}
          proposedContent={proposedContent}
          onAccept={handleAcceptChanges}
          onReject={handleRejectChanges}
        />
      )}
      {showImageStudio && (
        <ImageStudioModal
          onClose={() => setShowImageStudio(false)}
          onInsert={(url, alt) => insertImageAtCursor(url, alt)}
        />
      )}

      {/* Sidebar */}
      <aside className="hidden lg:block w-1/4 max-w-sm p-6 bg-white dark:bg-gray-800/50 border-r dark:border-gray-700 overflow-y-auto sticky top-[var(--sidebar-offset,60px)] h-[calc(100vh-var(--sidebar-offset,60px))]">
        <div className="flex items-center justify-between mb-2 gap-3">
          <h2 className="text-xl font-bold truncate">{course.title}</h2>
          <button
            onClick={() => setIsHelpModalOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700"
            title={t('course.helpModal.open')}
          >
            {t('course.helpModal.open')}
          </button>
        </div>
        {userCourses.length > 0 && (
          <div className="mb-4">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Schimbă cursul</label>
            <select
              value={course.id}
              onChange={(e) => {
                const nextId = e.target.value;
                window.location.hash = `#/course/${nextId}`;
              }}
              className="w-full px-3 py-2 text-sm rounded border dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              {userCourses.map((c: { id: string; title: string }) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('course.workspace.title')}</p>
        {/* Legacy Import Removed - Replaced by FileManager */}

        {/* Knowledge Base / Reference Materials */}
        <div className="mb-6">
          <FileManager 
            courseId={course.id}
            onUseFile={(file) => {
              setStagingFile({
                  url: file.file_url,
                  type: file.file_type,
                  name: file.filename
              });
              setShowImportModal(true);
            }}
          />
        </div>

        <nav>
          <ul>
            {(course.steps ?? []).map((step: CourseStep, index: number) => (
              <li key={step.id || `${index}-${step.title_key}`}>
                <button
                  onClick={() => setActiveStepIndex(index)}
                  disabled={index > 0 && !((course.steps ?? [])[index - 1]?.is_completed)}
                  className={`w-full text-left p-3 my-1 rounded-lg flex items-center gap-3 transition-colors ${activeStepIndex === index
                    ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
                    : 'border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/20 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                >
                  {step.is_completed ? <CheckCircle className="text-green-500" size={20} /> : <Circle className="text-gray-400" size={20} />}
                  <span className="font-medium">{t(step.title_key)}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-6 lg:p-10 pb-24 sm:pb-10">
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div id="main-scroll-container" className="flex-1 overflow-y-auto relative scroll-container">
            <div className="editor-header-sticky p-4 sm:p-3 border-b dark:border-gray-700 flex justify-between items-center">
              <button
                onClick={() => window.location.href = '/#/dashboard'}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mr-2"
                title="Înapoi la cursurile mele"
                aria-label="Înapoi la dashboard"
              >
                <ArrowLeft size={18} />
              </button>
              <button className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setIsSidebarOpen(true)} aria-label="Deschide pașii">
                <ListTodo size={18} />
              </button>
              <div className="flex-1 flex items-center justify-between gap-3">
                <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
                  {t(currentStep.title_key)}
                  {(localRefinements[(currentStep.id || `idx-${activeStepIndex}`)]) && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Editare locală</span>
                  )}
                </h1>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveStepIndex(i => Math.max(0, i - 1))}
                    disabled={activeStepIndex === 0}
                    className="px-3 py-2 rounded-md text-sm font-medium border hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                    title="Înapoi"
                    aria-label="Pas anterior"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setActiveStepIndex(i => Math.min((course?.steps?.length || 1) - 1, i + 1))}
                    disabled={activeStepIndex >= ((course?.steps?.length || 1) - 1)}
                    className="px-3 py-2 rounded-md text-sm font-medium border hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                    title="Înainte"
                    aria-label="Pas următor"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>

            <div className="editor-tabs-sticky px-4 bg-white dark:bg-gray-800 h-[48px] flex items-center border-b border-gray-200 dark:border-gray-700 mb-0 !mb-0 pb-0 !pb-0">
              <nav className="flex space-x-4 h-full" aria-label="Tabs">
                <button onClick={() => setActiveTab('editor')} className={`whitespace-nowrap px-1 border-b-2 font-medium text-sm h-full flex items-center ${activeTab === 'editor' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'}`}>{t('course.editor.tab.editor')}</button>
                <button onClick={() => setActiveTab('preview')} className={`whitespace-nowrap px-1 border-b-2 font-medium text-sm h-full flex items-center ${activeTab === 'preview' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'}`}>{t('course.editor.tab.preview')}</button>
              </nav>
            </div>

            <div className="editor-wrapper-container flex-1 flex flex-col min-h-0 mt-0 !mt-0 pt-0 !pt-0">
              {isBusy && (
                <div className="absolute inset-1 bg-gray-100/50 dark:bg-gray-900/50 flex items-center justify-center z-20 rounded-2xl shadow-lg">
                  <div className="text-center p-6 bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-lg backdrop-blur-sm">
                    <Loader2 className="animate-spin text-primary-500 mx-auto" size={40} />
                    <p className="mt-3 text-lg font-semibold">{isGenerating ? t('course.generating') : t('course.refine.button')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('course.generating.waitMessage')}</p>
                  </div>
                </div>
              )}
              {activeTab === 'editor' ? (
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 relative min-h-0 pb-40 sm:pb-28">
                    <TinyEditor
                      key={`${currentStep.id}-${activeTab}`}
                      value={editedContent}
                      refreshSignal={editorRefreshTick}
                      onChange={setEditedContent}
                      onSelectionChange={(text) => {
                        setSelectedText(text);
                        const html = editedContent || '';
                        const trimmed = (text || '').trim();
                        if (trimmed.length === 0) {
                          selectionRef.current = { start: 0, end: 0 };
                          return;
                        }
                        const idx = html.indexOf(trimmed);
                        if (idx >= 0) {
                          selectionRef.current = { start: idx, end: idx + trimmed.length };
                        } else {
                          selectionRef.current = { start: 0, end: 0 };
                        }
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-h-0 pb-40 sm:pb-28">
                  {currentStep.title_key === 'course.steps.manual' || currentStep.title_key === 'course.steps.cheat_sheets' ? (
                    (() => {
                      const isHtml = looksLikeHtml(editedContent);
                      const html = isHtml ? (editedContent || '') : marked.parse(resolveTokensForPreview(editedContent || ''));
                      return <div className="p-4 sm:p-5 prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
                    })()
                  ) : looksLikeHtml(editedContent) ? (
                    <div className="p-4 sm:p-5 prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: editedContent }} />
                  ) : (
                    <div className="p-4 sm:p-5">
                      <MarkdownPreview content={resolveTokensForPreview(editedContent)} />
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
          <div id="workspace-actions" className="editor-actions-sticky hidden sm:flex p-6 border-t dark:border-gray-700 justify-between items-center">
            <div className="flex gap-2 flex-wrap">
              {isEnabled('editorGenerateButtonEnabled') && (
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-primary-500 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 disabled:opacity-50"
                >
                  <Sparkles size={16} />
                  {t('course.generate')}
                </button>
              )}

              {isEnabled('editorRefineButtonEnabled') && (
                // INTENȚIONAT: Ascundem „Rafinează cu AI” în editor (desktop)
                <div ref={aiActionsDesktopRef} className="relative">
                  <button
                    onClick={() => setIsAiActionsOpen((prev: boolean) => !prev)}
                    disabled={!canRefine}
                    className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!selectedText.trim() ? 'Select text first to refine it' : t('course.refine.tooltip')}
                  >
                    <Wand size={16} />
                    {t('course.refine.button')}
                  </button>
                  {isAiActionsOpen && (
                    <div className="absolute bottom-full mb-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-30">
                      <button onClick={() => handleAiAction('simplify')} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3">
                        <Pilcrow size={16} /> {t('course.refine.simplify')}
                      </button>
                      <button onClick={() => handleAiAction('expand')} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3">
                        <Combine size={16} /> {t('course.refine.expand')}
                      </button>
                      <button onClick={() => handleAiAction('example')} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3">
                        <Lightbulb size={16} /> {t('course.refine.example')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {isCourseComplete && (
                <button
                  onClick={handleDownload}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                >
                  {isExporting ? <Loader2 className="animate-spin" size={16} /> : <DownloadCloud size={16} />}
                  {t('export.title') || 'Exportă materialele'}
                </button>
              )}
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-ink-700 dark:text-white bg-white dark:bg-gray-700 border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                title="Importă document în acest pas"
              >
                <Upload size={16} /> Importă
              </button>
              <button
                onClick={() => setShowSlidesPreview(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-ink-700 dark:text-white bg-white dark:bg-gray-700 border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                title="Previzualizează slide-urile"
              >
                <Pilcrow size={16} /> Preview Slides
              </button>
            </div>
            <div className="flex gap-2">
              {currentStep.is_completed && hasUnsavedChanges && (
                <button
                  onClick={() => handleSaveChanges(false)}
                  disabled={isBusy || isSaving}
                  className="px-6 py-2 rounded-md text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  {t('course.saveChanges')}
                </button>
              )}
              {lastUndoSnapshot && lastUndoSnapshot.stepId === currentStep.id && (
                <button
                  onClick={async () => {
                    if (!course) return;
                    setIsSaving(true);
                    const { error } = await supabase.from('course_steps').update({ content: lastUndoSnapshot.content }).eq('id', currentStep.id);
                    if (error) {
                      showToast('Nu s-a putut anula importul.', 'error');
                      setIsSaving(false);
                      return;
                    }
                    // Refresh
                    const updatedCourseData = await fetchCourseData();
                    if (updatedCourseData) {
                      setCourse(updatedCourseData);
                      const updatedStep = (updatedCourseData.steps || []).find((s: CourseStep) => s.id === currentStep.id);
                      if (updatedStep) {
                         const html = marked.parse(updatedStep.content || '', { breaks: true }) as string;
                         setEditedContent(html);
                      }
                    }
                    setLastUndoSnapshot(null);
                    setIsSaving(false);
                    showToast('Import anulat. Conținut restaurat.', 'success');
                  }}
                  className="px-4 py-2 rounded-md text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 flex items-center gap-2"
                >
                  <Replace size={14} className="rotate-180" /> Anulează Import
                </button>
              )}
              {!currentStep.is_completed && (
                <button
                  onClick={() => handleSaveChanges(true)}
                  disabled={isBusy || isSaving || !editedContent}
                  className="px-6 py-2 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400"
                >
                  {isSaving && <Loader2 className="animate-spin inline-block mr-2" size={16} />}
                  {isLastStep ? t('course.saveAndContinue').replace(' & Continue', '') : t('course.saveAndContinue')}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        isExporting={isExporting}
        course={course}
      />
      {showImportModal && (
        <ImportStagingModal
          isOpen={showImportModal}
          onClose={() => {
              setShowImportModal(false);
              setStagingFile(null);
          }}
          step={currentStep}
          initialFileUrl={stagingFile?.url}
          initialFileType={stagingFile?.type}
          initialFileName={stagingFile?.name}
          onApplied={async (oldContent: string) => {
            const updatedCourseData = await fetchCourseData();
            if (updatedCourseData) {
              setCourse(updatedCourseData);
              const updatedStep = (updatedCourseData.steps || []).find((s: CourseStep) => s.id === currentStep.id);
              if (updatedStep) {
                const html = marked.parse(updatedStep.content || '', { breaks: true }) as string;
                setEditedContent(html);
              }
            }
            setLastUndoSnapshot({ stepId: currentStep.id, content: oldContent });
            showToast('Import aplicat. Poți anula modificarea folosind butonul roșu de sus.', 'success');
          }}
        />
      )}
      {showSlidesPreview && course && (
        <SlidesPreviewModal
          isOpen={showSlidesPreview}
          onClose={() => setShowSlidesPreview(false)}
          course={course}
          onApplySuggestion={(s: string, targetTitle?: string) => {
            const appendAtEnd = (text: string) => {
              const next = `${editedContent}${editedContent.endsWith('\n') ? '' : '\n\n'}${text}`;
              setEditedContent(next);
              setShowSlidesPreview(false);
              setActiveTab('editor');
              setTimeout(() => textareaRef.current?.focus(), 0);
              showToast('Sugestie aplicată în editor.', 'success');
            };
            const insertAtCursor = (text: string) => {
              const textarea = textareaRef.current;
              if (!textarea) { appendAtEnd(text); return; }
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const next = `${editedContent.substring(0, start)}${text}${editedContent.substring(end)}`;
              setEditedContent(next);
              setShowSlidesPreview(false);
              setActiveTab('editor');
              setTimeout(() => textarea.focus(), 0);
              showToast('Sugestie aplicată în editor.', 'success');
            };
            const insertIntoSectionByTitle = (text: string, title?: string) => {
              if (!title) { insertAtCursor(text); return; }
              const content = editedContent || '';
              const lines = content.split('\n');
              let offset = 0;
              let startOffset: number | null = null;
              let endOffset: number | null = null;
              const norm = (s: string) => s.toLowerCase().replace(/^slide\s*\d+\s*:\s*/i, '').trim();
              const target = norm(title);
              for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const trimmed = line.trim();
                const isHeading = /^#{1,6}\s+/.test(trimmed);
                const isBoldTitle = trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length > 4;
                const lineTitle = isHeading ? trimmed.replace(/^#{1,6}\s+/, '') : (isBoldTitle ? trimmed.slice(2, -2) : '');
                if ((isHeading || isBoldTitle) && norm(lineTitle).includes(target)) {
                  startOffset = offset;
                  for (let j = i + 1, off = offset + line.length + 1; j < lines.length; j++) {
                    const ln = lines[j];
                    const t2 = ln.trim();
                    const isH = /^#{1,6}\s+/.test(t2) || (t2.startsWith('**') && t2.endsWith('**') && t2.length > 4);
                    if (isH) { endOffset = off; break; }
                    off += ln.length + 1;
                  }
                  if (endOffset === null) endOffset = content.length;
                  break;
                }
                offset += line.length + 1;
              }
              if (startOffset === null || endOffset === null) { insertAtCursor(text); return; }
              const next = `${content.substring(0, endOffset)}${content.endsWith('\n') ? '' : '\n'}${text}\n${content.substring(endOffset)}`;
              setEditedContent(next);
              setShowSlidesPreview(false);
              setActiveTab('editor');
              setTimeout(() => textareaRef.current?.focus(), 0);
              showToast('Sugestie aplicată în secțiunea slide-ului.', 'success');
            };
            const modifySelectionLines = (transform: (lines: string[]) => string[]) => {
              const textarea = textareaRef.current;
              if (!textarea) { appendAtEnd(transform([]).join('\n')); return; }
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const lineStartIdx = editedContent.lastIndexOf('\n', start - 1) + 1;
              const lineEndIdx = editedContent.indexOf('\n', end);
              const effectiveEnd = lineEndIdx === -1 ? editedContent.length : lineEndIdx;
              const linesText = editedContent.substring(lineStartIdx, effectiveEnd);
              const lines = linesText.split('\n');
              const nextLines = transform(lines);
              const next = `${editedContent.substring(0, lineStartIdx)}${nextLines.join('\n')}${editedContent.substring(effectiveEnd)}`;
              setEditedContent(next);
              setShowSlidesPreview(false);
              setActiveTab('editor');
              setTimeout(() => textarea.focus(), 0);
              showToast('Sugestie aplicată în editor.', 'success');
            };
            const sLower = s.toLowerCase();
            if (sLower.includes('pași')) {
              insertIntoSectionByTitle('- Pas 1: ...\n- Pas 2: ...\n- Pas 3: ...\n', targetTitle);
              return;
            }
            if (sLower.includes('verbe de aplicare')) {
              insertIntoSectionByTitle('- Verbe de aplicare: aplică, utilizează, implementează\n', targetTitle);
              return;
            }
            if (sLower.includes('imagine')) {
              setShowSlidesPreview(false);
              setActiveTab('editor');
              setShowImageStudio(true);
              return;
            }
            if (sLower.includes('context') && sLower.includes('problemă') && sLower.includes('soluție') && sLower.includes('rezultat')) {
              insertIntoSectionByTitle('- Context: ...\n- Problemă: ...\n- Soluție: ...\n- Rezultat: ...\n', targetTitle);
              return;
            }
            if (sLower.includes('concluzii') || sLower.includes('criterii de evaluare')) {
              insertIntoSectionByTitle('- Concluzii: ...\n- Criterii de evaluare: ...\n', targetTitle);
              return;
            }
            if (sLower.includes('conținut prea dens') || sLower.includes('reduce numărul de bullets') || sLower.includes('reduce bullets')) {
              modifySelectionLines((lines) => {
                const bullets = lines.filter(l => l.trim().startsWith('-') || l.trim().startsWith('*') || /^\d+\.\s/.test(l));
                if (bullets.length === 0) return lines;
                const kept = bullets.slice(0, 4);
                const others = lines.filter(l => !(l.trim().startsWith('-') || l.trim().startsWith('*') || /^\d+\.\s/.test(l)));
                return [...kept, ...others];
              });
              return;
            }
            if (sLower.includes('titlu prea lung') || sLower.includes('scurtează titlul')) {
              modifySelectionLines((lines) => lines.map(l => l.startsWith('#') ? (l.length > 60 ? (l.slice(0, 57) + '…') : l) : l));
              return;
            }
            if (sLower.includes('bullets prea lungi') || sLower.includes('scurtează formulările')) {
              modifySelectionLines((lines) => lines.map(l => {
                if (l.trim().startsWith('-') || l.trim().startsWith('*') || /^\d+\.\s/.test(l)) {
                  return l.length > 110 ? (l.slice(0, 107) + '…') : l;
                }
                return l;
              }));
              return;
            }
            // Fallback: append suggestion text if no rule matched
            appendAtEnd(`- ${s}`);
          }}
        />
      )}
      {/* Sticky mobile actions bar */}
      <div id="mobile-actions-bar" className="mobile-actions-sticky sm:hidden border-t dark:border-gray-700 shadow-lg safe-area-bottom">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex gap-2 flex-1">
            {isEnabled('editorGenerateButtonEnabled') && (
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border border-primary-500 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 disabled:opacity-50"
              >
                <Sparkles size={16} />
                {t('course.generate')}
              </button>
            )}
            {isEnabled('editorRefineButtonEnabled') && (
              // INTENȚIONAT: Ascundem „Rafinează cu AI” în editor (mobil)
              <div ref={aiActionsMobileRef} className="relative flex-1">
                <button
                  onClick={() => setIsAiActionsOpen((prev: boolean) => !prev)}
                  disabled={!canRefine}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!selectedText.trim() ? 'Select text first to refine it' : t('course.refine.tooltip')}
                >
                  <Wand size={16} />
                  {t('course.refine.button')}
                </button>
                {isAiActionsOpen && (
                  <div className="absolute bottom-full mb-2 left-0 right-0 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50">
                    <button onClick={() => handleAiAction('simplify')} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3">
                      <Pilcrow size={16} /> {t('course.refine.simplify')}
                    </button>
                    <button onClick={() => handleAiAction('expand')} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3">
                      <Combine size={16} /> {t('course.refine.expand')}
                    </button>
                    <button onClick={() => handleAiAction('example')} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3">
                      <Lightbulb size={16} /> {t('course.refine.example')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            {isCourseComplete ? (
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
              >
                {isDownloading ? <Loader2 className="animate-spin" size={16} /> : <DownloadCloud size={16} />}
                {t(isDownloading ? 'course.download.preparing' : 'course.download.button')}
              </button>
            ) : currentStep.is_completed && hasUnsavedChanges ? (
              <button
                onClick={() => handleSaveChanges(false)}
                disabled={isBusy || isSaving}
                className="px-4 py-2 rounded-md text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                {t('course.saveChanges')}
              </button>
            ) : !currentStep.is_completed ? (
              <button
                onClick={() => handleSaveChanges(true)}
                disabled={isBusy || isSaving || !editedContent}
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400"
              >
                {isSaving && <Loader2 className="animate-spin inline-block mr-2" size={16} />}
                <span className="hide-tiny">{isLastStep ? t('course.save') : t('course.saveAndContinue')}</span>
                <span className="show-tiny">{t('course.save')}</span>
              </button>
            ) : null}
          </div>
        </div>
        <div className="pb-[env(safe-area-inset-bottom)]" />
      </div>
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[200] lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-5/6 max-w-xs bg-white dark:bg-gray-800 shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { window.location.href = '/#/dashboard'; }}
                  className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Înapoi la cursurile mele"
                  aria-label="Înapoi la dashboard"
                >
                  <ArrowLeft size={18} />
                </button>
                <h2 className="text-lg font-semibold truncate">{course?.title}</h2>
              </div>
              <button className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Închide" onClick={() => setIsSidebarOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1" style={{ willChange: 'scroll-position' }}>
              {userCourses.length > 0 && (
                <div className="mb-4">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Schimbă cursul</label>
                  <select
                    value={course?.id}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      window.location.hash = `#/course/${nextId}`;
                    }}
                    className="w-full px-3 py-2 text-sm rounded border dark:border-gray-700 bg-white dark:bg-gray-900"
                  >
                    {userCourses.map((c: { id: string; title: string }) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Legacy Import Removed - Replaced by FileManager */}

              {/* Knowledge Base / Reference Materials (Mobile) */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">Resurse</h3>
                  <button
                    onClick={() => setIsHelpModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700"
                    title={t('course.helpModal.open')}
                  >
                    {t('course.helpModal.open')}
                  </button>
                </div>
                <FileManager 
                    courseId={course.id} 
                    onUseFile={(file) => {
                        setStagingFile({
                            url: file.file_url,
                            type: file.file_type,
                            name: file.filename
                        });
                        setShowImportModal(true);
                        setIsSidebarOpen(false); // Close sidebar on mobile if open
                    }}
                />
              </div>

              <nav>
                <ul>
                  {(course?.steps ?? []).map((step: CourseStep, index: number) => (
                    <li key={step.id || `${index}-${step.title_key}`}>
                      <button
                        onClick={() => { setActiveStepIndex(index); setIsSidebarOpen(false); }}
                        disabled={index > 0 && !((course?.steps ?? [])[index - 1]?.is_completed)}
                        className={`w-full text-left p-4 my-1 rounded-lg flex items-center gap-3 transition-colors ${activeStepIndex === index
                          ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
                          : 'border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/20 disabled:opacity-50 disabled:cursor-not-allowed'
                          }`}
                      >
                        {step.is_completed ? <CheckCircle className="text-green-500" size={20} /> : <Circle className="text-gray-400" size={20} />}
                        <span className="font-medium">{t(step.title_key)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      )}

      {course && (
        <GenerationProgressModal
          isOpen={showGenerationModal}
          onClose={() => setShowGenerationModal(false)}
          course={course}
          onComplete={handleGenerationComplete}
        />
      )}
    </div>
  );
};

export default CourseWorkspacePage;
