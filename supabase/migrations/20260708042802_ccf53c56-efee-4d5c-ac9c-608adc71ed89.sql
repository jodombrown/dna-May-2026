BEGIN;
CREATE SCHEMA IF NOT EXISTS archive;
CREATE TABLE archive.ada_cohorts_20260706  AS SELECT * FROM public.ada_cohorts;
CREATE TABLE archive.ada_policies_20260706 AS SELECT * FROM public.ada_policies;

DROP FUNCTION public.get_user_cohorts(uuid);

DROP TABLE public.ada_experiment_assignments;
DROP TABLE public.ada_cohort_memberships;
DROP TABLE public.ada_experiment_variants;
DROP TABLE public.ada_experiments;
DROP TABLE public.ada_policies;
DROP TABLE public.ada_cohorts;
COMMIT;