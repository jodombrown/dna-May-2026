CREATE OR REPLACE FUNCTION public.get_user_cohort(target_user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_profile RECORD;
  cohort_result TEXT;
BEGIN
  SELECT onboarding_completed_at
  INTO user_profile
  FROM public.profiles
  WHERE id = target_user_id;

  IF user_profile IS NULL THEN
    RETURN 'unknown';
  END IF;

  cohort_result := 'general';

  IF user_profile.onboarding_completed_at IS NOT NULL
     AND user_profile.onboarding_completed_at > (now() - INTERVAL '30 days') THEN
    cohort_result := cohort_result || '_new';
  END IF;

  RETURN cohort_result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enqueue_reminders_for_all_users()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  reminder_count INTEGER := 0;
  user_record RECORD;
  user_cohort TEXT;
  days_since_onboarding INTEGER;
  last_reminder_date TIMESTAMP WITH TIME ZONE;
BEGIN
  FOR user_record IN
    SELECT
      p.id as user_id,
      p.onboarding_completed_at,
      p.email,
      p.full_name,
      p.notification_preferences,
      COALESCE(p.last_seen_at, p.onboarding_completed_at) as last_activity
    FROM public.profiles p
    WHERE p.onboarding_completed_at IS NOT NULL
      AND p.onboarding_completed_at < (now() - INTERVAL '2 days')
      AND (p.notification_preferences->>'engagement_reminders')::boolean IS DISTINCT FROM false
  LOOP
    days_since_onboarding := EXTRACT(days FROM (now() - user_record.onboarding_completed_at));
    user_cohort := public.get_user_cohort(user_record.user_id);

    IF days_since_onboarding >= 3 AND days_since_onboarding < 7 THEN
      SELECT MAX(scheduled_at) INTO last_reminder_date
      FROM public.reminder_logs
      WHERE user_id = user_record.user_id
        AND reminder_type = '3_day';

      IF last_reminder_date IS NULL OR last_reminder_date < (now() - INTERVAL '7 days') THEN
        INSERT INTO public.reminder_logs (
          user_id, reminder_type, scheduled_at, delivery_channel,
          cohort, metadata
        ) VALUES (
          user_record.user_id,
          '3_day',
          now() + INTERVAL '10 minutes',
          'email',
          user_cohort,
          jsonb_build_object(
            'user_name', user_record.full_name,
            'days_since_onboarding', days_since_onboarding,
            'last_activity', user_record.last_activity
          )
        );
        reminder_count := reminder_count + 1;
      END IF;
    END IF;

    IF days_since_onboarding >= 7 AND days_since_onboarding < 14 THEN
      SELECT MAX(scheduled_at) INTO last_reminder_date
      FROM public.reminder_logs
      WHERE user_id = user_record.user_id
        AND reminder_type = '7_day';

      IF last_reminder_date IS NULL OR last_reminder_date < (now() - INTERVAL '14 days') THEN
        INSERT INTO public.reminder_logs (
          user_id, reminder_type, scheduled_at, delivery_channel,
          cohort, metadata
        ) VALUES (
          user_record.user_id,
          '7_day',
          now() + INTERVAL '15 minutes',
          'email',
          user_cohort,
          jsonb_build_object(
            'user_name', user_record.full_name,
            'days_since_onboarding', days_since_onboarding,
            'last_activity', user_record.last_activity
          )
        );
        reminder_count := reminder_count + 1;
      END IF;
    END IF;

    IF days_since_onboarding >= 14 THEN
      SELECT MAX(scheduled_at) INTO last_reminder_date
      FROM public.reminder_logs
      WHERE user_id = user_record.user_id
        AND reminder_type = '14_day';

      IF last_reminder_date IS NULL OR last_reminder_date < (now() - INTERVAL '21 days') THEN
        INSERT INTO public.reminder_logs (
          user_id, reminder_type, scheduled_at, delivery_channel,
          cohort, metadata
        ) VALUES (
          user_record.user_id,
          '14_day',
          now() + INTERVAL '20 minutes',
          'email',
          user_cohort,
          jsonb_build_object(
            'user_name', user_record.full_name,
            'days_since_onboarding', days_since_onboarding,
            'last_activity', user_record.last_activity
          )
        );
        reminder_count := reminder_count + 1;
      END IF;
    END IF;
  END LOOP;

  INSERT INTO public.user_engagement_tracking (
    user_id, event_type, event_context
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'reminders_enqueued',
    jsonb_build_object('reminder_count', reminder_count, 'enqueued_at', now())
  );

  RETURN reminder_count;
END;
$function$;