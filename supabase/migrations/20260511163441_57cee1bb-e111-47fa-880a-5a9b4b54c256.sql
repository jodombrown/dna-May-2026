
-- =========================================================
-- USER BLOCKS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_blocks_self_check CHECK (blocker_id <> blocked_id),
  CONSTRAINT user_blocks_unique UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON public.user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON public.user_blocks(blocked_id);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own blocks"
  ON public.user_blocks FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can insert their own blocks"
  ON public.user_blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks"
  ON public.user_blocks FOR DELETE
  USING (auth.uid() = blocker_id);

-- Helper - is there a block in either direction between two users
CREATE OR REPLACE FUNCTION public.is_blocked_between(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = _a AND blocked_id = _b)
       OR (blocker_id = _b AND blocked_id = _a)
  );
$$;

-- =========================================================
-- USER REPORTS
-- =========================================================
DO $$ BEGIN
  CREATE TYPE public.user_report_status AS ENUM ('open', 'reviewing', 'resolved', 'dismissed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.user_report_reason AS ENUM (
    'spam', 'harassment', 'impersonation', 'inappropriate_content', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  message_id uuid,
  conversation_id uuid,
  reason public.user_report_reason NOT NULL,
  details text,
  status public.user_report_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_reports_self_check CHECK (reporter_id <> target_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_reports_reporter ON public.user_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_target ON public.user_reports(target_user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON public.user_reports(status);

ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own reports"
  ON public.user_reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Admins read all reports"
  ON public.user_reports FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can submit reports"
  ON public.user_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can update reports"
  ON public.user_reports FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- DISAPPEARING MESSAGES (conversations)
-- =========================================================
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS disappearing_seconds integer;

-- =========================================================
-- MESSAGE RATE LOG
-- =========================================================
CREATE TABLE IF NOT EXISTS public.message_rate_log (
  id bigserial PRIMARY KEY,
  sender_id uuid NOT NULL,
  conversation_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_message_rate_log_sender_time
  ON public.message_rate_log(sender_id, created_at DESC);

ALTER TABLE public.message_rate_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own rate log"
  ON public.message_rate_log FOR SELECT
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can insert their own rate log"
  ON public.message_rate_log FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- =========================================================
-- MESSAGE-BLOCK GUARD TRIGGER
-- =========================================================
CREATE OR REPLACE FUNCTION public.enforce_message_not_blocked()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  other_id uuid;
BEGIN
  SELECT CASE
           WHEN c.user_a = NEW.sender_id THEN c.user_b
           WHEN c.user_b = NEW.sender_id THEN c.user_a
           ELSE NULL
         END
    INTO other_id
  FROM public.conversations c
  WHERE c.id = NEW.conversation_id;

  IF other_id IS NOT NULL AND public.is_blocked_between(NEW.sender_id, other_id) THEN
    RAISE EXCEPTION 'BLOCKED_RELATIONSHIP'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_message_not_blocked ON public.messages;
CREATE TRIGGER trg_enforce_message_not_blocked
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_message_not_blocked();

-- =========================================================
-- updated_at trigger for user_reports
-- =========================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_user_reports ON public.user_reports;
CREATE TRIGGER trg_touch_user_reports
  BEFORE UPDATE ON public.user_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();
