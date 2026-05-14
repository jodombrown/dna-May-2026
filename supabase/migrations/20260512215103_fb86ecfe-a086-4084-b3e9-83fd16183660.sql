CREATE OR REPLACE FUNCTION public.curate_room_for_user(p_max_per_kind integer DEFAULT 5)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_today date := (now() at time zone 'utc')::date;
  v_inserted integer := 0;
  v_existing integer;
begin
  if v_user_id is null then
    raise exception 'curate_room_for_user called without authenticated user'
      using errcode = 'insufficient_privilege';
  end if;

  select count(*) into v_existing
    from room_curations
    where viewer_user_id = v_user_id
      and curation_date = v_today;

  if v_existing > 0 then
    return v_existing;
  end if;

  -- their_stance_my_need
  insert into room_curations (
    viewer_user_id, subject_user_id, kind, currency,
    subject_stance_id, viewer_need_id,
    score, reasoning, reasoning_source, curation_date
  )
  select distinct on (s.user_id, n.id)
    v_user_id,
    s.user_id,
    'their_stance_my_need'::match_kind,
    s.currency,
    s.id,
    n.id,
    least(1.0, (
      0.3
      + coalesce(tag_overlap_count(s.tags, n.tags), 0) * 0.25
      + greatest(0, 0.2 - (extract(epoch from (now() - n.published_at)) / 86400.0 / 30.0) * 0.2)
    )),
    compute_reasoning_string(
      'their_stance_my_need',
      s.currency,
      s.title,           -- p_subject_stance_title (their stance)
      null,              -- p_subject_need_title
      null,              -- p_viewer_stance_title
      n.title,           -- p_viewer_need_title (viewer's actual need title) ✅ FIXED
      array(select unnest(s.tags) intersect select unnest(n.tags))
    ),
    'sql',
    v_today
  from need_declarations n
  join currency_stances s on s.currency = n.currency
  join contribution_manifests m on m.id = s.manifest_id and m.is_published = true
  where n.user_id = v_user_id
    and n.status = 'open'
    and s.user_id != v_user_id
    and s.is_archived = false
    and s.visibility = 'public'
  order by s.user_id, n.id, (
    0.3
    + coalesce(tag_overlap_count(s.tags, n.tags), 0) * 0.25
    + greatest(0, 0.2 - (extract(epoch from (now() - n.published_at)) / 86400.0 / 30.0) * 0.2)
  ) desc
  limit p_max_per_kind
  on conflict (viewer_user_id, subject_user_id, kind, curation_date) do nothing;

  get diagnostics v_inserted = row_count;

  -- their_need_my_stance (call-site already correct; only scoring changes)
  insert into room_curations (
    viewer_user_id, subject_user_id, kind, currency,
    viewer_stance_id, subject_need_id,
    score, reasoning, reasoning_source, curation_date
  )
  select distinct on (n.user_id, s.id)
    v_user_id,
    n.user_id,
    'their_need_my_stance'::match_kind,
    n.currency,
    s.id,
    n.id,
    least(1.0, (
      0.3
      + coalesce(tag_overlap_count(s.tags, n.tags), 0) * 0.25
      + greatest(0, 0.2 - (extract(epoch from (now() - n.published_at)) / 86400.0 / 30.0) * 0.2)
    )),
    compute_reasoning_string(
      'their_need_my_stance',
      n.currency,
      null,              -- p_subject_stance_title
      n.title,           -- p_subject_need_title (their need) ✓
      s.title,           -- p_viewer_stance_title (your stance) ✓
      null,              -- p_viewer_need_title
      array(select unnest(s.tags) intersect select unnest(n.tags))
    ),
    'sql',
    v_today
  from currency_stances s
  join contribution_manifests m on m.id = s.manifest_id and m.user_id = v_user_id
  join need_declarations n on n.currency = s.currency
  where s.user_id = v_user_id
    and s.is_archived = false
    and n.user_id != v_user_id
    and n.status = 'open'
    and n.visibility = 'public'
  order by n.user_id, s.id, (
    0.3
    + coalesce(tag_overlap_count(s.tags, n.tags), 0) * 0.25
    + greatest(0, 0.2 - (extract(epoch from (now() - n.published_at)) / 86400.0 / 30.0) * 0.2)
  ) desc
  limit p_max_per_kind
  on conflict (viewer_user_id, subject_user_id, kind, curation_date) do nothing;

  -- tag_affinity (unchanged)
  insert into room_curations (
    viewer_user_id, subject_user_id, kind, currency,
    subject_stance_id, viewer_stance_id,
    score, reasoning, reasoning_source, curation_date
  )
  select distinct on (subj.user_id)
    v_user_id,
    subj.user_id,
    'tag_affinity'::match_kind,
    subj.currency,
    subj.id,
    mine.id,
    least(0.5, coalesce(tag_overlap_count(mine.tags, subj.tags), 0) * 0.15),
    compute_reasoning_string(
      'tag_affinity',
      subj.currency,
      subj.title,
      null,
      mine.title,
      null,
      array(select unnest(mine.tags) intersect select unnest(subj.tags))
    ),
    'sql',
    v_today
  from currency_stances mine
  join contribution_manifests mm on mm.id = mine.manifest_id and mm.user_id = v_user_id
  join currency_stances subj on tag_overlap_count(mine.tags, subj.tags) >= 1
  join contribution_manifests sm on sm.id = subj.manifest_id and sm.is_published = true
  where mine.user_id = v_user_id
    and mine.is_archived = false
    and subj.user_id != v_user_id
    and subj.is_archived = false
    and subj.visibility = 'public'
    and not exists (
      select 1 from room_curations rc
      where rc.viewer_user_id = v_user_id
        and rc.subject_user_id = subj.user_id
        and rc.curation_date = v_today
    )
  order by subj.user_id, tag_overlap_count(mine.tags, subj.tags) desc
  limit p_max_per_kind
  on conflict (viewer_user_id, subject_user_id, kind, curation_date) do nothing;

  select count(*) into v_inserted
    from room_curations
    where viewer_user_id = v_user_id
      and curation_date = v_today;

  return v_inserted;
end;
$function$;