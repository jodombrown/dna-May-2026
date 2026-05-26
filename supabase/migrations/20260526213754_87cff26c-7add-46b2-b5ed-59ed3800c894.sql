DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dna_identity_role') THEN
    CREATE TYPE public.dna_identity_role AS ENUM ('returnee', 'anchor', 'ally', 'exploring');
  END IF;
END $$;