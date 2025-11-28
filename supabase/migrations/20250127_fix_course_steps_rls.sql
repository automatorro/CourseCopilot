-- Fix RLS policies for course_steps
-- This ensures authenticated users can manage steps for their own courses

-- Enable RLS (if not already enabled)
ALTER TABLE course_steps ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Users can manage steps for their own courses" ON course_steps;
DROP POLICY IF EXISTS "Users can view steps for their own courses" ON course_steps;
DROP POLICY IF EXISTS "Users can insert steps for their own courses" ON course_steps;
DROP POLICY IF EXISTS "Users can update steps for their own courses" ON course_steps;
DROP POLICY IF EXISTS "Users can delete steps for their own courses" ON course_steps;

-- Create a comprehensive policy for all actions
CREATE POLICY "Users can manage steps for their own courses"
ON course_steps
FOR ALL
USING (
  course_id IN (
    SELECT id FROM courses WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  course_id IN (
    SELECT id FROM courses WHERE user_id = auth.uid()
  )
);
