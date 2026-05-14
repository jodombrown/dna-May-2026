do $$
declare
  i integer;
  v_email text;
begin
  for i in 1..18 loop
    v_email := 'seed-' || lpad(i::text, 2, '0') || '@dnaseed.dev';

    if not exists (select 1 from auth.users where email = v_email) then
      insert into auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_sso_user,
        is_anonymous
      )
      values (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        v_email,
        crypt('seed-user-throwaway-pw', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{}'::jsonb,
        false,
        false
      );
    end if;
  end loop;

  raise notice 'Seed users created or already present.';
end $$;