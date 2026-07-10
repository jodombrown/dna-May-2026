do $$
begin
  if exists (select 1 from cron.job where jobname = 'adin-nightly-health-daily') then
    perform cron.unschedule('adin-nightly-health-daily');
    raise notice 'unscheduled adin-nightly-health-daily';
  else
    raise notice 'adin-nightly-health-daily not found (already gone)';
  end if;
end $$;