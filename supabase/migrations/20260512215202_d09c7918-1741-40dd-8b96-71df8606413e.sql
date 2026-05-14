DELETE FROM room_curations
WHERE viewer_user_id = '64bc0bd2-f461-4821-a4a8-ae1754d28cea'
  AND curation_date = (now() at time zone 'utc')::date;

-- Re-curate by simulating the SECURITY DEFINER body inline (auth.uid() unavailable in migration context).
-- Insert their_stance_my_need
INSERT INTO room_curations (
  viewer_user_id, subject_user_id, kind, currency,
  subject_stance_id, viewer_need_id,
  score, reasoning, reasoning_source, curation_date
)
SELECT DISTINCT ON (s.user_id, n.id)
  '64bc0bd2-f461-4821-a4a8-ae1754d28cea'::uuid,
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
    'their_stance_my_need', s.currency, s.title, null, null, n.title,
    array(select unnest(s.tags) intersect select unnest(n.tags))
  ),
  'sql',
  (now() at time zone 'utc')::date
FROM need_declarations n
JOIN currency_stances s ON s.currency = n.currency
JOIN contribution_manifests m ON m.id = s.manifest_id AND m.is_published = true
WHERE n.user_id = '64bc0bd2-f461-4821-a4a8-ae1754d28cea'
  AND n.status = 'open'
  AND s.user_id != '64bc0bd2-f461-4821-a4a8-ae1754d28cea'
  AND s.is_archived = false
  AND s.visibility = 'public'
ORDER BY s.user_id, n.id, (
  0.3
  + coalesce(tag_overlap_count(s.tags, n.tags), 0) * 0.25
  + greatest(0, 0.2 - (extract(epoch from (now() - n.published_at)) / 86400.0 / 30.0) * 0.2)
) DESC
LIMIT 5
ON CONFLICT (viewer_user_id, subject_user_id, kind, curation_date) DO NOTHING;

-- their_need_my_stance
INSERT INTO room_curations (
  viewer_user_id, subject_user_id, kind, currency,
  viewer_stance_id, subject_need_id,
  score, reasoning, reasoning_source, curation_date
)
SELECT DISTINCT ON (n.user_id, s.id)
  '64bc0bd2-f461-4821-a4a8-ae1754d28cea'::uuid,
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
    'their_need_my_stance', n.currency, null, n.title, s.title, null,
    array(select unnest(s.tags) intersect select unnest(n.tags))
  ),
  'sql',
  (now() at time zone 'utc')::date
FROM currency_stances s
JOIN contribution_manifests m ON m.id = s.manifest_id AND m.user_id = '64bc0bd2-f461-4821-a4a8-ae1754d28cea'
JOIN need_declarations n ON n.currency = s.currency
WHERE s.user_id = '64bc0bd2-f461-4821-a4a8-ae1754d28cea'
  AND s.is_archived = false
  AND n.user_id != '64bc0bd2-f461-4821-a4a8-ae1754d28cea'
  AND n.status = 'open'
  AND n.visibility = 'public'
ORDER BY n.user_id, s.id, (
  0.3
  + coalesce(tag_overlap_count(s.tags, n.tags), 0) * 0.25
  + greatest(0, 0.2 - (extract(epoch from (now() - n.published_at)) / 86400.0 / 30.0) * 0.2)
) DESC
LIMIT 5
ON CONFLICT (viewer_user_id, subject_user_id, kind, curation_date) DO NOTHING;

-- tag_affinity
INSERT INTO room_curations (
  viewer_user_id, subject_user_id, kind, currency,
  subject_stance_id, viewer_stance_id,
  score, reasoning, reasoning_source, curation_date
)
SELECT DISTINCT ON (subj.user_id)
  '64bc0bd2-f461-4821-a4a8-ae1754d28cea'::uuid,
  subj.user_id,
  'tag_affinity'::match_kind,
  subj.currency,
  subj.id,
  mine.id,
  least(0.5, coalesce(tag_overlap_count(mine.tags, subj.tags), 0) * 0.15),
  compute_reasoning_string(
    'tag_affinity', subj.currency, subj.title, null, mine.title, null,
    array(select unnest(mine.tags) intersect select unnest(subj.tags))
  ),
  'sql',
  (now() at time zone 'utc')::date
FROM currency_stances mine
JOIN contribution_manifests mm ON mm.id = mine.manifest_id AND mm.user_id = '64bc0bd2-f461-4821-a4a8-ae1754d28cea'
JOIN currency_stances subj ON tag_overlap_count(mine.tags, subj.tags) >= 1
JOIN contribution_manifests sm ON sm.id = subj.manifest_id AND sm.is_published = true
WHERE mine.user_id = '64bc0bd2-f461-4821-a4a8-ae1754d28cea'
  AND mine.is_archived = false
  AND subj.user_id != '64bc0bd2-f461-4821-a4a8-ae1754d28cea'
  AND subj.is_archived = false
  AND subj.visibility = 'public'
  AND NOT EXISTS (
    SELECT 1 FROM room_curations rc
    WHERE rc.viewer_user_id = '64bc0bd2-f461-4821-a4a8-ae1754d28cea'
      AND rc.subject_user_id = subj.user_id
      AND rc.curation_date = (now() at time zone 'utc')::date
  )
ORDER BY subj.user_id, tag_overlap_count(mine.tags, subj.tags) DESC
LIMIT 5
ON CONFLICT (viewer_user_id, subject_user_id, kind, curation_date) DO NOTHING;