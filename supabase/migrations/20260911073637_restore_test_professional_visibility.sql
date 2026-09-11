-- The original demonstrator batch was loaded together on 2026-07-21 before
-- email verification existed. It contains exactly ten approved, active
-- profiles. Retain the verification requirement for every other profile.
DO $$
DECLARE
  affected_count integer;
BEGIN
  SELECT count(*)
    INTO affected_count
  FROM public.professionals
  WHERE created_at >= timestamp '2026-07-21 13:32:00'
    AND created_at < timestamp '2026-07-21 13:33:00'
    AND status = 'approved'
    AND is_active = true
    AND email_verified = false;

  IF affected_count <> 10 THEN
    RAISE EXCEPTION 'Expected 10 legacy demonstrator profiles, found %', affected_count;
  END IF;

  UPDATE public.professionals
  SET email_verified = true,
      email_verification_token_hash = NULL
  WHERE created_at >= timestamp '2026-07-21 13:32:00'
    AND created_at < timestamp '2026-07-21 13:33:00'
    AND status = 'approved'
    AND is_active = true
    AND email_verified = false;
END $$;
