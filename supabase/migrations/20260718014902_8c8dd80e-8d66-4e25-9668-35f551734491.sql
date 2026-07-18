
-- Prevent other authenticated users from reading PII columns (email, phone, phone_number, whatsapp_number)
-- via the Data API. Owners access their own PII through SECURITY DEFINER RPCs
-- (get_profile_contact, get_safe_profile_fields), which run as the function owner
-- and bypass column-level GRANTs.
REVOKE SELECT (email, phone, phone_number, whatsapp_number) ON public.profiles FROM authenticated;
REVOKE SELECT (email, phone, phone_number, whatsapp_number) ON public.profiles FROM anon;
