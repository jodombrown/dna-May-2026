-- Lock down roadmap_sponsors.contact_email at the column level.
REVOKE SELECT (contact_email) ON public.roadmap_sponsors FROM anon, authenticated;
GRANT SELECT (contact_email) ON public.roadmap_sponsors TO service_role;

-- Lock down sponsors.contact_email and contact_name at the column level.
REVOKE SELECT (contact_email, contact_name) ON public.sponsors FROM anon, authenticated;
GRANT SELECT (contact_email, contact_name) ON public.sponsors TO service_role;