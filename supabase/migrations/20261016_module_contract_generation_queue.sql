BEGIN;

ALTER TABLE public.course_modules
  ADD COLUMN IF NOT EXISTS contract JSONB,
  ADD COLUMN IF NOT EXISTS contract_version INTEGER,
  ADD COLUMN IF NOT EXISTS contract_hash TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.course_modules'::regclass
      AND conname = 'course_modules_contract_metadata_check'
  ) THEN
    ALTER TABLE public.course_modules
      ADD CONSTRAINT course_modules_contract_metadata_check
      CHECK (
        (contract IS NULL AND contract_version IS NULL AND contract_hash IS NULL)
        OR (
          contract IS NOT NULL
          AND contract_version IS NOT NULL
          AND contract_version > 0
          AND contract_hash IS NOT NULL
          AND contract_hash ~ '^[0-9a-f]{64}$'
        )
      );
  END IF;
END;
$$;

COMMENT ON COLUMN public.course_modules.contract IS
  'Validated ModuleContract JSON used as the source for generated learning materials';
COMMENT ON COLUMN public.course_modules.contract_version IS
  'Version of the ModuleContract schema used to create contract';
COMMENT ON COLUMN public.course_modules.contract_hash IS
  'SHA-256 hash of the canonical ModuleContract JSON';

CREATE UNIQUE INDEX IF NOT EXISTS course_modules_id_course_id_key
  ON public.course_modules (id, course_id);

CREATE TABLE IF NOT EXISTS public.generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'done', 'failed')),
  total_units INTEGER NOT NULL DEFAULT 0 CHECK (total_units >= 0),
  completed_units INTEGER NOT NULL DEFAULT 0 CHECK (completed_units >= 0),
  failed_units INTEGER NOT NULL DEFAULT 0 CHECK (failed_units >= 0),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  CONSTRAINT generation_jobs_progress_check
    CHECK (completed_units + failed_units <= total_units),
  CONSTRAINT generation_jobs_id_course_id_key UNIQUE (id, course_id)
);

CREATE TABLE IF NOT EXISTS public.generation_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  course_id UUID NOT NULL,
  module_id UUID,
  unit_type TEXT NOT NULL CHECK (LENGTH(BTRIM(unit_type)) > 0),
  unit_key TEXT NOT NULL CHECK (LENGTH(BTRIM(unit_key)) > 0),
  input_hash TEXT NOT NULL CHECK (input_hash ~ '^[0-9a-f]{64}$'),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'done', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  output JSONB,
  error TEXT,
  lease_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  CONSTRAINT generation_units_job_course_fkey
    FOREIGN KEY (job_id, course_id)
    REFERENCES public.generation_jobs(id, course_id)
    ON DELETE CASCADE,
  CONSTRAINT generation_units_module_course_fkey
    FOREIGN KEY (module_id, course_id)
    REFERENCES public.course_modules(id, course_id)
    ON DELETE CASCADE,
  CONSTRAINT generation_units_job_unit_key_key UNIQUE (job_id, unit_key)
);

CREATE INDEX IF NOT EXISTS generation_jobs_course_created_idx
  ON public.generation_jobs (course_id, created_at DESC);

CREATE INDEX IF NOT EXISTS generation_units_claim_idx
  ON public.generation_units (status, lease_expires_at, created_at)
  WHERE status IN ('pending', 'running');

CREATE INDEX IF NOT EXISTS generation_units_completed_cache_idx
  ON public.generation_units (course_id, input_hash)
  WHERE status = 'done';

CREATE INDEX IF NOT EXISTS generation_units_job_status_idx
  ON public.generation_units (job_id, status);

ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view generation jobs for their own courses"
  ON public.generation_jobs;
CREATE POLICY "Users can view generation jobs for their own courses"
  ON public.generation_jobs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.courses AS course
      WHERE course.id = generation_jobs.course_id
        AND course.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view generation units for their own courses"
  ON public.generation_units;
CREATE POLICY "Users can view generation units for their own courses"
  ON public.generation_units
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.courses AS course
      WHERE course.id = generation_units.course_id
        AND course.user_id = auth.uid()
    )
  );

REVOKE ALL ON TABLE public.generation_jobs FROM anon, authenticated;
REVOKE ALL ON TABLE public.generation_units FROM anon, authenticated;
GRANT SELECT ON TABLE public.generation_jobs TO authenticated;
GRANT SELECT ON TABLE public.generation_units TO authenticated;
GRANT ALL ON TABLE public.generation_jobs TO service_role;
GRANT ALL ON TABLE public.generation_units TO service_role;

COMMENT ON TABLE public.generation_jobs IS
  'Server-owned job tracking for contract-based course generation';
COMMENT ON TABLE public.generation_units IS
  'One row per LLM call; completed rows can be reused by matching course_id and input_hash';
COMMENT ON COLUMN public.generation_units.input_hash IS
  'SHA-256 hash of the canonical unit inputs, including contract, tone, labels, and prompt version';
COMMENT ON COLUMN public.generation_units.lease_expires_at IS
  'Worker lease expiry; expired running units can be reclaimed';

COMMIT;