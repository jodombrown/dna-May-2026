DROP POLICY IF EXISTS "release_features_admin_insert" ON public.release_features;
CREATE POLICY "release_features_admin_insert" ON public.release_features
  FOR INSERT TO public
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "release_features_admin_update" ON public.release_features;
CREATE POLICY "release_features_admin_update" ON public.release_features
  FOR UPDATE TO public
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "release_features_admin_delete" ON public.release_features;
CREATE POLICY "release_features_admin_delete" ON public.release_features
  FOR DELETE TO public
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.prevent_non_admin_profile_privilege_updates()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF COALESCE(NEW.is_admin, false) IS DISTINCT FROM COALESCE(OLD.is_admin, false)
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can change privileged profile fields';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_profile_protected_field_changes()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.role() = 'authenticated'
     AND auth.uid() = OLD.id
     AND NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    RAISE EXCEPTION 'You cannot change protected profile fields'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$function$;

ALTER TABLE public.profiles DROP COLUMN IF EXISTS roles;