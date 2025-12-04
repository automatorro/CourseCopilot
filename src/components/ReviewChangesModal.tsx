import React, { useMemo, useState } from 'react';
import { useTranslation } from '../contexts/I18nContext';
import { X, Check, GitPullRequestArrow } from 'lucide-react';

interface ReviewChangesModalProps {
  originalContent: string;
  proposedContent: string;
  onAccept: () => void;
  onReject: () => void;
}

const ReviewChangesModal: React.FC<ReviewChangesModalProps> = ({
  originalContent,
  proposedContent,
  onAccept,
  onReject,
}) => {
  const { t } = useTranslation();
  const [view, setView] = useState<'render' | 'text' | 'diff'>('render');
  const toText = (s: string) => (s || '').replace(/<[^>]+>/g, '').trim();

  const diffTokens = useMemo(() => {
    const a = toText(originalContent);
    const b = toText(proposedContent);
    const aWords = a.split(/(\s+)/);
    const bWords = b.split(/(\s+)/);
    const n = aWords.length;
    const m = bWords.length;
    const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        if (aWords[i] === bWords[j]) dp[i][j] = dp[i + 1][j + 1] + 1; else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    const result: Array<{ type: 'equal' | 'del' | 'add'; text: string }> = [];
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (aWords[i] === bWords[j]) {
        result.push({ type: 'equal', text: aWords[i] });
        i++; j++;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        result.push({ type: 'del', text: aWords[i] });
        i++;
      } else {
        result.push({ type: 'add', text: bWords[j] });
        j++;
      }
    }
    while (i < n) { result.push({ type: 'del', text: aWords[i++] }); }
    while (j < m) { result.push({ type: 'add', text: bWords[j++] }); }
    return result;
  }, [originalContent, proposedContent]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex items-center justify-center p-4 animate-fade-in-up" style={{ animationDuration: '0.3s' }}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col transform transition-all">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <GitPullRequestArrow className="text-primary-600 dark:text-primary-400" size={24} />
            <h2 className="text-xl font-bold">{t('course.reviewModal.title')}</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-md border dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => setView('render')}
                className={`px-3 py-1 text-sm ${view === 'render' ? 'bg-primary-600 text-white' : 'bg-transparent'} hover:bg-primary-600 hover:text-white`}
              >
                {t('course.reviewModal.tab.preview')}
              </button>
              <button
                onClick={() => setView('text')}
                className={`px-3 py-1 text-sm ${view === 'text' ? 'bg-primary-600 text-white' : 'bg-transparent'} hover:bg-primary-600 hover:text-white`}
              >
                {t('course.reviewModal.tab.text')}
              </button>
              <button
                onClick={() => setView('diff')}
                className={`px-3 py-1 text-sm ${view === 'diff' ? 'bg-primary-600 text-white' : 'bg-transparent'} hover:bg-primary-600 hover:text-white`}
              >
                {t('course.reviewModal.tab.diff')}
              </button>
            </div>
            <button onClick={onReject} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content Comparison */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-hidden">
          {/* Original Content */}
          <div className="flex flex-col border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">{t('course.reviewModal.original')}</h3>
            </div>
            {view === 'render' ? (
              <div className="flex-1 overflow-auto p-4 prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: originalContent }} />
            ) : view === 'text' ? (
              <textarea readOnly value={toText(originalContent)} className="flex-1 w-full p-4 text-sm bg-transparent border-none focus:ring-0 resize-none font-mono" />
            ) : (
              <div className="flex-1 overflow-auto p-4 text-sm font-mono">
                <div>
                  {diffTokens.map((tok, idx) => (
                    <span key={idx} className={
                      tok.type === 'equal' ? '' : tok.type === 'del' ? 'bg-red-100 text-red-800 line-through' : 'bg-green-100 text-green-800'
                    }>{tok.text}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Proposed Content */}
          <div className="flex flex-col border border-primary-300 dark:border-primary-700 rounded-lg overflow-hidden ring-1 ring-primary-500">
            <div className="p-3 bg-primary-50 dark:bg-primary-900/50 border-b border-primary-200 dark:border-primary-800">
              <h3 className="font-semibold text-primary-800 dark:text-primary-200">{t('course.reviewModal.proposed')}</h3>
            </div>
            {view === 'render' ? (
              <div className="flex-1 overflow-auto p-4 prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: proposedContent }} />
            ) : view === 'text' ? (
              <textarea readOnly value={toText(proposedContent)} className="flex-1 w-full p-4 text-sm bg-transparent border-none focus:ring-0 resize-none font-mono" />
            ) : (
              <div className="flex-1 overflow-auto p-4 text-sm font-mono">
                <div>
                  {diffTokens.map((tok, idx) => (
                    tok.type === 'equal'
                      ? <span key={idx} className="opacity-50">{tok.text}</span>
                      : tok.type === 'add'
                        ? <span key={idx} className="bg-green-100 text-green-800">{tok.text}</span>
                        : null
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 p-4 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onReject}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {t('course.reviewModal.reject')}
          </button>
          <button
            onClick={onAccept}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 flex items-center gap-2"
          >
            <Check size={18} />
            {t('course.reviewModal.accept')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewChangesModal;
