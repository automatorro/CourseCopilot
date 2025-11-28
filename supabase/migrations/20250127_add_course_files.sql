-- Phase 3: Add course_files table for knowledge base
-- This allows users to upload reference materials that can be used during content generation

CREATE TABLE IF NOT EXISTS course_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'pdf', 'docx', 'txt', 'pptx'
  file_size INTEGER NOT NULL, -- in bytes
  extracted_text TEXT, -- Full text content extracted from file
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_course_files_course_id ON course_files(course_id);
CREATE INDEX IF NOT EXISTS idx_course_files_user_id ON course_files(user_id);

-- Enable Row Level Security
ALTER TABLE course_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access files for their own courses
CREATE POLICY "Users can view their own course files"
  ON course_files FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can upload files to their own courses"
  ON course_files FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own course files"
  ON course_files FOR DELETE
  USING (user_id = auth.uid());

-- Storage bucket for course files (run this in Supabase Dashboard > Storage)
-- Bucket name: 'course-files'
-- Public: false
-- File size limit: 25MB
-- Allowed MIME types: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain, application/vnd.openxmlformats-officedocument.presentationml.presentation
