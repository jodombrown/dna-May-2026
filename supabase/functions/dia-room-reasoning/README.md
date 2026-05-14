# dia-room-reasoning

Generates DIA-authored reasoning text for Room match curations and writes it
back to `public.room_curations`. SQL reasoning produced by `curate_room_for_user`
remains the fallback; this function asynchronously upgrades rows from
`reasoning_source = 'sql'` to `reasoning_source = 'dia'`.

Invocation: `POST /functions/v1/dia-room-reasoning` with
`{ curation_ids: string[1..50], mode?: 'replace' | 'fill_only' }`. Service-role
tokens process any set; authenticated users are filtered to curations they own.
Per-row LLM failures (length cap, em-dash, deprecated names, first-person AI
reference) leave the row at `reasoning_source = 'sql'` and surface in `failures`.
