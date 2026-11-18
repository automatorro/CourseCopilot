BEGIN;

ALTER TABLE public.user_usage
  ADD COLUMN IF NOT EXISTS generation_run_id UUID;

CREATE INDEX IF NOT EXISTS user_usage_generation_run_idx
  ON public.user_usage (user_id, generation_run_id, created_at)
  WHERE generation_run_id IS NOT NULL;

COMMENT ON COLUMN public.user_usage.generation_run_id IS
  'Client-generated ID grouping exact AI token usage for one generation run';

CREATE TABLE IF NOT EXISTS public.ai_generation_cost_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_run_id UUID NOT NULL,
  model TEXT NOT NULL,
  reserved_input_tokens INTEGER NOT NULL CHECK (reserved_input_tokens >= 0),
  reserved_output_tokens INTEGER NOT NULL CHECK (reserved_output_tokens > 0),
  reserved_cost_usd NUMERIC(12, 8) NOT NULL CHECK (reserved_cost_usd > 0),
  actual_cost_usd NUMERIC(12, 8),
  actual_input_tokens INTEGER,
  actual_output_tokens INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  settled_at TIMESTAMPTZ,
  CHECK (
    (settled_at IS NULL AND actual_cost_usd IS NULL) OR
    (settled_at IS NOT NULL AND actual_cost_usd IS NOT NULL)
  )
);

ALTER TABLE public.ai_generation_cost_reservations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS ai_generation_cost_reservations_run_idx
  ON public.ai_generation_cost_reservations (user_id, generation_run_id);

CREATE OR REPLACE FUNCTION public.reserve_generation_ai_cost(
  p_user_id UUID,
  p_generation_run_id UUID,
  p_model TEXT,
  p_estimated_input_tokens INTEGER,
  p_requested_output_tokens INTEGER,
  p_cost_cap_usd NUMERIC DEFAULT 0.50
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_input_tokens INTEGER;
  v_used_cost NUMERIC(12, 8);
  v_input_cost NUMERIC(12, 8);
  v_remaining_cost NUMERIC(12, 8);
  v_output_tokens INTEGER;
  v_reserved_cost NUMERIC(12, 8);
  v_reservation_id UUID;
  v_input_rate NUMERIC := 2.0;
  v_output_rate NUMERIC := 10.0;
BEGIN
  IF p_user_id IS NULL OR p_generation_run_id IS NULL OR p_model NOT LIKE 'claude-%'
     OR p_estimated_input_tokens < 0 OR p_requested_output_tokens < 1
     OR p_cost_cap_usd <= 0 THEN
    RAISE EXCEPTION 'Invalid generation cost reservation parameters';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::TEXT || ':' || p_generation_run_id::TEXT));

  SELECT COALESCE(SUM(
    CASE WHEN settled_at IS NULL THEN reserved_cost_usd ELSE actual_cost_usd END
  ), 0)
  INTO v_used_cost
  FROM public.ai_generation_cost_reservations
  WHERE user_id = p_user_id AND generation_run_id = p_generation_run_id;

  v_input_tokens := CEIL(p_estimated_input_tokens * 1.25 + 256)::INTEGER;
  v_input_cost := v_input_tokens * v_input_rate / 1000000.0;
  v_remaining_cost := p_cost_cap_usd - v_used_cost;

  IF v_input_cost >= v_remaining_cost THEN
    RETURN jsonb_build_object(
      'allowed', FALSE,
      'used_cost_usd', v_used_cost,
      'remaining_cost_usd', GREATEST(v_remaining_cost, 0)
    );
  END IF;

  v_output_tokens := LEAST(
    p_requested_output_tokens,
    FLOOR((v_remaining_cost - v_input_cost) * 1000000.0 / v_output_rate)::INTEGER
  );
  IF v_output_tokens < 256 THEN
    RETURN jsonb_build_object(
      'allowed', FALSE,
      'used_cost_usd', v_used_cost,
      'remaining_cost_usd', GREATEST(v_remaining_cost, 0)
    );
  END IF;

  v_reserved_cost := v_input_cost + v_output_tokens * v_output_rate / 1000000.0;

  INSERT INTO public.ai_generation_cost_reservations (
    user_id, generation_run_id, model, reserved_input_tokens,
    reserved_output_tokens, reserved_cost_usd
  )
  VALUES (
    p_user_id, p_generation_run_id, p_model, v_input_tokens,
    v_output_tokens, v_reserved_cost
  )
  RETURNING id INTO STRICT v_reservation_id;

  RETURN jsonb_build_object(
    'allowed', TRUE,
    'reservation_id', v_reservation_id,
    'max_output_tokens', v_output_tokens,
    'reserved_cost_usd', v_reserved_cost
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.settle_generation_ai_cost(
  p_reservation_id UUID,
  p_user_id UUID,
  p_actual_input_tokens INTEGER,
  p_actual_output_tokens INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actual_cost NUMERIC(12, 8);
BEGIN
  IF p_actual_input_tokens < 0 OR p_actual_output_tokens < 0 THEN
    RAISE EXCEPTION 'Invalid actual token counts';
  END IF;

  v_actual_cost :=
    (p_actual_input_tokens * 2.0 + p_actual_output_tokens * 10.0) / 1000000.0;

  UPDATE public.ai_generation_cost_reservations
  SET actual_input_tokens = p_actual_input_tokens,
      actual_output_tokens = p_actual_output_tokens,
      actual_cost_usd = v_actual_cost,
      settled_at = now()
  WHERE id = p_reservation_id
    AND user_id = p_user_id
    AND settled_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Generation cost reservation not found or already settled';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_generation_ai_cost(UUID, UUID, TEXT, INTEGER, INTEGER, NUMERIC) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.settle_generation_ai_cost(UUID, UUID, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_generation_ai_cost(UUID, UUID, TEXT, INTEGER, INTEGER, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_generation_ai_cost(UUID, UUID, INTEGER, INTEGER) TO service_role;

COMMIT;
