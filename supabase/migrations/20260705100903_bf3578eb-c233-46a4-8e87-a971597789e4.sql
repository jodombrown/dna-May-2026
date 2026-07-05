-- roadmap_sponsors.contact_email: admin-only
REVOKE SELECT (contact_email) ON public.roadmap_sponsors FROM anon;
REVOKE SELECT (contact_email) ON public.roadmap_sponsors FROM authenticated;

-- sponsors.contact_email + contact_name: admin-only
REVOKE SELECT (contact_email, contact_name) ON public.sponsors FROM anon;
REVOKE SELECT (contact_email, contact_name) ON public.sponsors FROM authenticated;