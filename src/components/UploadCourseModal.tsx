import React, { useState } from 'react';
import { Upload, X, Loader2, FileText, CheckCircle } from 'lucide-react';
import { createCourseFromUpload } from '../services/uploadCourseService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface UploadCourseModalProps {
    onClose: () => void;
    onUploadComplete: (courseId: string) => void;
}

const UploadCourseModal: React.FC<UploadCourseModalProps> = ({ onClose, onUploadComplete }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [environment, setEnvironment] = useState<'LiveWorkshop' | 'OnlineCourse'>('LiveWorkshop');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            const ext = selectedFile.name.split('.').pop()?.toLowerCase();
            if (ext === 'docx' || ext === 'txt') {
                setFile(selectedFile);
            } else {
                showToast('Please select a .docx or .txt file', 'error');
            }
        }
    };

    const handleUpload = async () => {
        if (!file || !user) return;

        setUploading(true);
        setUploadProgress(10);

        try {
            setUploadProgress(30);
            const result = await createCourseFromUpload(file, environment, user.id);
            setUploadProgress(90);

            if (result.success && result.courseId) {
                setUploadProgress(100);
                showToast('Course created successfully!', 'success');
                setTimeout(() => {
                    onUploadComplete(result.courseId!);
                }, 500);
            } else {
                showToast(result.error || 'Upload failed', 'error');
                setUploading(false);
                setUploadProgress(0);
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            showToast('Upload failed. Please try again.', 'error');
            setUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
                {/* Header */}
                <div className="p-6 border-b dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Create from Existing Material
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Upload your DOCX or TXT file to generate a course
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        disabled={uploading}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Upload File
                        </label>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                            <input
                                type="file"
                                accept=".docx,.txt"
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                                disabled={uploading}
                            />
                            <label
                                htmlFor="file-upload"
                                className="cursor-pointer flex flex-col items-center"
                            >
                                {file ? (
                                    <>
                                        <CheckCircle className="text-green-500 mb-2" size={40} />
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {(file.size / 1024).toFixed(1)} KB
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="text-gray-400 mb-2" size={40} />
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            Click to upload or drag and drop
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            DOCX or TXT (max 25MB)
                                        </p>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Environment Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Course Environment
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setEnvironment('LiveWorkshop')}
                                disabled={uploading}
                                className={`p-4 border-2 rounded-lg transition-all ${environment === 'LiveWorkshop'
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-primary-300'
                                    }`}
                            >
                                <FileText className={environment === 'LiveWorkshop' ? 'text-primary-600' : 'text-gray-400'} size={24} />
                                <p className="text-sm font-medium mt-2">Live Workshop</p>
                                <p className="text-xs text-gray-500 mt-1">Slides & Exercises</p>
                            </button>
                            <button
                                onClick={() => setEnvironment('OnlineCourse')}
                                disabled={uploading}
                                className={`p-4 border-2 rounded-lg transition-all ${environment === 'OnlineCourse'
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-primary-300'
                                    }`}
                            >
                                <FileText className={environment === 'OnlineCourse' ? 'text-primary-600' : 'text-gray-400'} size={24} />
                                <p className="text-sm font-medium mt-2">Online Course</p>
                                <p className="text-xs text-gray-500 mt-1">Videos & Quizzes</p>
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {uploading && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Analyzing content...
                                </span>
                                <span className="text-sm font-medium text-primary-600">
                                    {uploadProgress}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={uploading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="px-6 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="animate-spin" size={16} />
                                Creating Course...
                            </>
                        ) : (
                            <>
                                <Upload size={16} />
                                Create Course
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadCourseModal;
