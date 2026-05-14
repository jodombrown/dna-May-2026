CREATE OR REPLACE FUNCTION public.get_room_for_viewer()
 RETURNS TABLE(curation_id uuid, subject_user_id uuid, kind match_kind, currency contribution_currency, subject_stance_id uuid, subject_stance_title text, subject_need_id uuid, subject_need_title text, subject_need_context text, subject_need_scope need_scope, viewer_stance_id uuid, viewer_stance_title text, viewer_need_id uuid, viewer_need_title text, score numeric, reasoning text, reasoning_source reasoning_source, curation_date date)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_today date := (now() at time zone 'utc')::date;
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'get_room_for_viewer called without authenticated user'
      using errcode = 'insufficient_privilege';
  end if;

  select count(*) into v_count
    from room_curations rc
    where rc.viewer_user_id = v_user_id
      and rc.curation_date = v_today;

  if v_count = 0 then
    perform curate_room_for_user(5);
  end if;

  return query
    select
      rc.id,
      rc.subject_user_id,
      rc.kind,
      rc.currency,
      rc.subject_stance_id,
      ss.title,
      rc.subject_need_id,
      sn.title,
      sn.context,
      sn.scope,
      rc.viewer_stance_id,
      vs.title,
      rc.viewer_need_id,
      vn.title,
      rc.score,
      rc.reasoning,
      rc.reasoning_source,
      rc.curation_date
    from room_curations rc
    left join currency_stances ss on ss.id = rc.subject_stance_id
    left join need_declarations sn on sn.id = rc.subject_need_id
    left join currency_stances vs on vs.id = rc.viewer_stance_id
    left join need_declarations vn on vn.id = rc.viewer_need_id
    where rc.viewer_user_id = v_user_id
      and rc.curation_date = v_today
      and rc.dismissed_at is null
    order by
      case rc.kind
        when 'mutual' then 1
        when 'their_stance_my_need' then 2
        when 'their_need_my_stance' then 3
        when 'tag_affinity' then 4
      end,
      rc.score desc,
      rc.created_at;
end;
$function$;