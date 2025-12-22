
-- Create a new table for course versioning
CREATE TABLE course_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  step_id UUID REFERENCES course_steps(id) ON DELETE CASCADE, -- Optional: if version is step-specific
  version_number INTEGER NOT NULL,
  content TEXT, -- JSON snapshot or raw content
  change_type TEXT, -- 'import', 'manual_edit', 'ai_generation'
  change_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index for faster history lookups
CREATE INDEX idx_course_versions_course_id ON course_versions(course_id);
CREATE INDEX idx_course_versions_step_id ON course_versions(step_id);

-- RLS Policies
ALTER TABLE course_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own course versions"
  ON course_versions FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create versions for their courses"
  ON course_versions FOR INSERT
  WITH CHECK (auth.uid() = created_by);
