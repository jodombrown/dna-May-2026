-- DNA CONTRIBUTE Phase 3 Dev Seed (real seed-user UUIDs)
drop table if exists seed_users_temp;
create temp table seed_users_temp (
  slot integer primary key,
  user_id uuid not null
);

insert into seed_users_temp (slot, user_id) values
  (1,  '64bc0bd2-f461-4821-a4a8-ae1754d28cea'),
  (2,  'bc9a6146-0921-4f95-a7c0-4d5acbff8de2'),
  (3,  'a179ce65-dd6a-45b6-8918-e752697d09bd'),
  (4,  'db39565f-3978-477d-917e-dbe89adf01e9'),
  (5,  '5550e10c-c0cd-48c2-bbb7-bc015e187ad1'),
  (6,  '25843b23-dc43-45d5-abbc-db7524e199c9'),
  (7,  '70c65c24-1702-4139-853e-2f729c6a5b58'),
  (8,  '5f4c49ae-5f68-4293-87c7-67f8a28042e7'),
  (9,  '528580d4-c60a-4d87-9b8c-0dbc6d2ab516'),
  (10, '67f80037-d093-4a58-a981-5dda412fa82f'),
  (11, '73d24ea3-ecd2-40ed-9621-edd28ee613e4'),
  (12, '3e369047-7ee4-4219-9566-5890e3fac839'),
  (13, 'df75eaf7-dd60-4198-a3da-ee4a49f664cd'),
  (14, 'c4162637-5c8c-4654-a21f-088a86fc4cb1'),
  (15, '0d5d84e5-2860-4fa3-8501-9bf4a51b458a'),
  (16, 'f12e0ece-eddc-4f83-8119-0766084e5725'),
  (17, '718ddaf5-ad65-44cc-9998-7e8f538f757f'),
  (18, '487ce226-d040-4bbc-864a-0d2676661e94');

delete from room_curations
  where viewer_user_id in (select user_id from seed_users_temp)
     or subject_user_id in (select user_id from seed_users_temp);

delete from need_declarations
  where user_id in (select user_id from seed_users_temp);

delete from currency_stances
  where user_id in (select user_id from seed_users_temp);

delete from contribution_manifests
  where user_id in (select user_id from seed_users_temp);

insert into contribution_manifests (user_id, headline, is_published, last_reviewed_at)
select
  st.user_id,
  m.headline,
  true,
  now() - (random() * interval '14 days')
from seed_users_temp st
join (values
  (1,  'I show up for the diaspora as a regulatory strategist for biotech founders building between West Africa and the US.'),
  (2,  'I show up for the diaspora by opening doors to East African agritech investors and lending FDA experience.'),
  (3,  'I show up for the diaspora as a quiet host for visiting founders and a connector across the diaspora finance world.'),
  (4,  'I show up for the diaspora as a fintech operator with payments experience across Naira, Cedi, and USD corridors.'),
  (5,  'I show up for the diaspora as a clinician-researcher building health-equity infrastructure across the diaspora.'),
  (6,  'I show up for the diaspora as a public-sector advisor on diaspora investment policy with cabinet-level network access.'),
  (7,  'I show up for the diaspora as an early-stage product leader who has shipped across consumer fintech and health.'),
  (8,  'I show up for the diaspora by building learning infrastructure for second-generation diaspora youth.'),
  (9,  'I show up for the diaspora as a media strategist who has helped diaspora founders land tier-one press.'),
  (10, 'I show up for the diaspora as a climate-tech engineer working on grid resilience across Sub-Saharan Africa.'),
  (11, 'I show up for the diaspora as a sourdough baker hosting visiting diaspora artists at my studio in Brooklyn.'),
  (12, 'I show up for the diaspora as a legal counsel for diaspora founders incorporating across multiple jurisdictions.'),
  (13, 'I show up for the diaspora as a designer who has built brand systems for half a dozen diaspora-owned ventures.'),
  (14, 'I show up for the diaspora as a community organizer who runs a 2,000-person diaspora mutual-aid network in Houston.'),
  (15, 'I show up for the diaspora as a venture investor with two funds focused on African and diaspora founders.'),
  (16, 'I show up for the diaspora as an academic researcher publishing on diaspora capital flows back to the continent.'),
  (17, 'I show up for the diaspora as a logistics operator who has run cross-Atlantic shipping for diaspora businesses.'),
  (18, 'I show up for the diaspora as a chef who hosts pop-ups for visiting diaspora founders and creators in London.')
) as m(slot, headline) on m.slot = st.slot;

with manifests as (
  select m.id as manifest_id, m.user_id, st.slot
  from contribution_manifests m
  join seed_users_temp st on st.user_id = m.user_id
)
insert into currency_stances (
  manifest_id, user_id, currency, title, description, tags,
  availability, visibility, display_order
)
select m.manifest_id, m.user_id, s.currency::contribution_currency, s.title, s.description, s.tags::text[],
       s.availability::stance_availability, 'public'::stance_visibility, s.display_order
from manifests m
join (values
  (1, 'expertise', 'FDA regulatory strategy for biotech',
   'Twelve years across pre-IND, IND, and BLA submissions. Strong with first-time founders.',
   array['fda','regulatory','biotech','health','pre-ind','bla'], 'monthly_hours', 0),
  (1, 'network', 'Intros to diaspora biotech investors',
   'Warm path to about a dozen LPs and angels who back diaspora biotech founders.',
   array['biotech','investors','venture','health','diaspora'], 'quarterly', 1),
  (2, 'expertise', 'Agritech go-to-market across East Africa',
   'GTM playbooks for diaspora-led agritech ventures entering Kenya, Uganda, Rwanda.',
   array['agritech','east-africa','gtm','kenya','uganda','rwanda'], 'project_based', 0),
  (2, 'network', 'Warm intros to East African agritech investors',
   'Roughly fifteen named individuals across funds and angels active in the corridor.',
   array['agritech','east-africa','investors','venture','agriculture'], 'quarterly', 1),
  (2, 'expertise', 'FDA-equivalent regulatory across African markets',
   'Adapted FDA experience for KEBS, NDA, FDA-Ghana frameworks.',
   array['regulatory','africa','agritech','health','compliance'], 'monthly_hours', 2),
  (3, 'resources', 'Office space in Accra for visiting founders',
   'Two desks at my office in Osu, available for two to four weeks at a time.',
   array['office','accra','ghana','workspace','hosting'], 'project_based', 0),
  (3, 'network', 'Diaspora finance and family-office connectors',
   'Active connections across diaspora family offices in London, New York, and Lagos.',
   array['finance','family-office','diaspora','capital','lagos','london'], 'monthly_hours', 1),
  (4, 'expertise', 'Payments infrastructure across Naira-Cedi-USD corridors',
   'Built three production payment rails. Strong with FX, compliance, and settlement.',
   array['payments','fintech','naira','cedi','usd','fx','compliance'], 'project_based', 0),
  (4, 'network', 'Diaspora fintech operators and engineers',
   'Roughly thirty senior engineers and operators across diaspora fintech.',
   array['fintech','engineering','operators','diaspora'], 'open_ongoing', 1),
  (5, 'expertise', 'Health equity research design for diaspora populations',
   'Mixed-methods researcher with deep experience in diaspora and immigrant health.',
   array['health','equity','research','diaspora','clinical'], 'monthly_hours', 0),
  (5, 'network', 'NIH and foundation grant connectors',
   'Path to program officers across NIH and major health-equity foundations.',
   array['health','grants','nih','foundation','research'], 'quarterly', 1),
  (6, 'expertise', 'Diaspora investment policy advisory',
   'Cabinet-level access in two West African countries. Eight years advisory experience.',
   array['policy','diaspora','investment','government','west-africa'], 'quarterly', 0),
  (6, 'network', 'Cabinet-level government contacts',
   'Active relationships across ministries of finance and trade in the region.',
   array['government','policy','africa','ministry','diaspora'], 'project_based', 1),
  (7, 'expertise', 'Early-stage product leadership for consumer fintech and health',
   'Zero-to-one product launches across two regulated industries.',
   array['product','fintech','health','consumer','early-stage'], 'monthly_hours', 0),
  (7, 'expertise', 'Hiring and team-building for diaspora founders',
   'Three engineering hires placed at diaspora-led startups in the last twelve months.',
   array['hiring','team','engineering','startup','diaspora'], 'open_ongoing', 1),
  (8, 'expertise', 'Curriculum design for second-generation diaspora youth',
   'Built and launched two learning programs reaching about 600 youth across three cities.',
   array['education','youth','diaspora','curriculum','learning'], 'project_based', 0),
  (8, 'resources', 'Program space in Atlanta for diaspora youth programs',
   'Classroom and workshop space for events of up to forty participants.',
   array['atlanta','space','youth','programs','education'], 'project_based', 1),
  (9, 'expertise', 'Press and media strategy for diaspora founders',
   'Landed tier-one US and African press for half a dozen diaspora-led ventures.',
   array['media','press','pr','diaspora','founders'], 'monthly_hours', 0),
  (9, 'network', 'Tier-one journalist connectors',
   'Active relationships with reporters at major US business and Africa-focused outlets.',
   array['media','journalism','press','diaspora'], 'project_based', 1),
  (10, 'expertise', 'Grid resilience engineering for Sub-Saharan deployments',
   'Five-year track record on hybrid solar-storage systems in West and East Africa.',
   array['climate','grid','energy','africa','engineering','solar'], 'project_based', 0),
  (11, 'resources', 'Brooklyn artist studio space for visiting diaspora artists',
   'Live-work studio in Crown Heights, available for one to three week residencies.',
   array['brooklyn','artist','residency','studio','hosting','new-york'], 'quarterly', 0),
  (11, 'network', 'Brooklyn diaspora arts and culture scene',
   'Connections across galleries, venues, and curators in the Brooklyn diaspora arts world.',
   array['arts','brooklyn','culture','diaspora','new-york'], 'open_ongoing', 1),
  (12, 'expertise', 'Multi-jurisdiction incorporation for diaspora founders',
   'Strong with Delaware, Mauritius, and Lagos formations and the bridges between them.',
   array['legal','incorporation','delaware','mauritius','lagos','founders'], 'monthly_hours', 0),
  (12, 'expertise', 'IP and licensing for cross-border ventures',
   'IP strategy across US, EU, and AfCFTA frameworks.',
   array['legal','ip','licensing','africa','intellectual-property'], 'project_based', 1),
  (13, 'expertise', 'Brand system design for diaspora-owned ventures',
   'Built six brand systems for diaspora consumer ventures from launch through scale.',
   array['design','brand','identity','diaspora','consumer'], 'project_based', 0),
  (13, 'resources', 'Design audit for diaspora founders, two per quarter',
   'I take on two pro-bono design audits per quarter for diaspora founders pre-launch.',
   array['design','audit','branding','diaspora','founders'], 'quarterly', 1),
  (14, 'network', '2,000-person diaspora mutual-aid network in Houston',
   'Active organizer for the largest diaspora mutual-aid network in southeast Texas.',
   array['houston','community','mutual-aid','diaspora','organizing'], 'open_ongoing', 0),
  (14, 'resources', 'Event hosting space in Houston for up to 150 people',
   'Community space available for diaspora events, available with two weeks notice.',
   array['houston','events','space','community','hosting'], 'project_based', 1),
  (15, 'expertise', 'Venture diligence for African and diaspora founders',
   'Two funds, eight years investing exclusively in African and diaspora-led ventures.',
   array['venture','diligence','africa','diaspora','investment','funding'], 'monthly_hours', 0),
  (15, 'network', 'LP and co-investor connectors',
   'Active LP relationships across family offices, DFIs, and venture funds.',
   array['venture','lp','dfi','investment','africa'], 'quarterly', 1),
  (16, 'expertise', 'Diaspora capital flows research',
   'Published researcher on remittance and diaspora investment patterns. Open to advisory.',
   array['research','academia','diaspora','capital','remittance','africa'], 'quarterly', 0),
  (17, 'expertise', 'Cross-Atlantic logistics for diaspora businesses',
   'Run shipping operations across US-West Africa corridor for the past seven years.',
   array['logistics','shipping','africa','diaspora','supply-chain'], 'project_based', 0),
  (17, 'resources', 'Warehouse space in Newark for diaspora supply chains',
   'Pallet positions available for diaspora businesses needing East Coast distribution.',
   array['warehouse','newark','logistics','distribution','supply-chain'], 'project_based', 1),
  (18, 'resources', 'London pop-up dinner hosting for diaspora founders',
   'I host monthly pop-up dinners for visiting diaspora founders and creators.',
   array['london','food','hosting','diaspora','events','dinner'], 'open_ongoing', 0),
  (18, 'network', 'London diaspora founder and creator scene',
   'Active across the London diaspora startup and creative scenes.',
   array['london','founders','creators','diaspora','community'], 'open_ongoing', 1)
) as s(slot, currency, title, description, tags, availability, display_order)
  on s.slot = m.slot;

insert into need_declarations (
  user_id, currency, title, context, scope, tags, visibility,
  status, published_at, expires_at, created_at
)
select st.user_id, n.currency::contribution_currency, n.title, n.context, n.scope::need_scope,
       n.tags::text[], 'public'::stance_visibility, n.status::need_status,
       case when n.status in ('open','matched','fulfilled') then now() - (random() * interval '20 days') else null end,
       case when n.status = 'open' then now() + interval '60 days' else null end,
       now() - (random() * interval '25 days')
from seed_users_temp st
join (values
  (1, 'network', 'Warm intros to East African agritech investors',
   'Building a precision agriculture venture in Kenya. Need help getting in front of the right LPs.',
   'few_hours', array['agritech','east-africa','investors','venture','kenya'], 'open'),
  (1, 'resources', 'Office space in Accra for a 3-week residency',
   'Doing customer development in Ghana for three weeks in the spring. Could use a desk.',
   'short_project', array['office','accra','ghana','workspace','residency'], 'open'),
  (2, 'expertise', 'FDA regulatory advice for our biotech submission',
   'First-time founders pre-IND. Need someone who has been through it.',
   'few_hours', array['fda','regulatory','biotech','pre-ind'], 'open'),
  (3, 'expertise', 'Cross-Atlantic logistics for diaspora supply chain',
   'Setting up distribution in the US for our Accra-based consumer brand. Need a guide.',
   'short_project', array['logistics','shipping','distribution','africa','diaspora'], 'open'),
  (4, 'expertise', 'Diaspora investment policy advisory',
   'Considering a pivot toward diaspora-bond infrastructure. Need someone who knows policy.',
   'one_off', array['policy','diaspora','investment','government'], 'open'),
  (4, 'network', 'Tier-one journalist intros for product launch',
   'Launching a new payments product in March. Looking for press strategy and intros.',
   'few_hours', array['media','press','pr','launch','fintech'], 'draft'),
  (5, 'expertise', 'Curriculum design help for a diaspora youth health-equity program',
   'Building a six-month program for second-generation youth. Need curriculum expertise.',
   'short_project', array['curriculum','youth','health','education','diaspora'], 'open'),
  (6, 'expertise', 'Brand system design for a new policy initiative',
   'Launching a diaspora-investment initiative. Need a real brand from a serious designer.',
   'short_project', array['design','brand','identity','policy','launch'], 'open'),
  (7, 'network', 'Diaspora biotech investors',
   'Advising a friend pre-fundraise. Looking for warm intros to biotech-focused investors.',
   'one_off', array['biotech','investors','venture','health','diaspora'], 'open'),
  (8, 'resources', 'Houston community space for a diaspora youth event',
   'Hosting a one-day workshop for 100 youth in Houston in the fall. Need a venue.',
   'one_off', array['houston','events','space','youth','community'], 'open'),
  (9, 'expertise', 'Multi-jurisdiction incorporation review for our media co',
   'Restructuring across US and Mauritius. Need experienced legal counsel.',
   'one_off', array['legal','incorporation','delaware','mauritius','media'], 'open'),
  (10, 'expertise', 'Venture diligence on our climate-tech round',
   'Closing a seed round. Need someone who knows climate and diaspora to pressure-test our deck.',
   'few_hours', array['venture','diligence','climate','energy','seed'], 'open'),
  (10, 'resources', 'Brooklyn studio for a residency this summer',
   'Doing field research in West Africa, want to host an artist-in-residence in Brooklyn after.',
   'extended', array['brooklyn','residency','artist','studio'], 'open'),
  (11, 'expertise', 'Brand audit for my bakery and residency program',
   'Want to consolidate my bakery and residency into one brand. Need a designer''s eye.',
   'one_off', array['design','brand','audit','branding'], 'open'),
  (12, 'network', 'Diaspora investment policy contacts',
   'Building practice in diaspora-bond legal infrastructure. Need policy-side intros.',
   'few_hours', array['policy','diaspora','investment','government','legal'], 'open'),
  (13, 'expertise', 'Logistics advice for a small-batch product launch',
   'Launching a small physical-product line. First-time founder, need logistics guidance.',
   'few_hours', array['logistics','shipping','distribution','product','launch'], 'open'),
  (14, 'expertise', 'Curriculum help for a diaspora financial-literacy program',
   'Launching a 6-week financial-literacy program for the mutual-aid network. Need curriculum.',
   'short_project', array['curriculum','education','financial-literacy','youth'], 'open'),
  (15, 'expertise', 'Health-equity research design for an LP report',
   'Producing an LP report on health-equity ventures in our portfolio. Need a researcher.',
   'few_hours', array['research','health','equity','diaspora'], 'open'),
  (16, 'network', 'LP and co-investor intros',
   'Spinning out a research-backed venture. Need warm intros to LPs interested in research-led firms.',
   'few_hours', array['venture','lp','dfi','investment','research'], 'open'),
  (17, 'expertise', 'Payments infrastructure for cross-border invoicing',
   'Building out a new payments rail for our shipping invoices across the corridor.',
   'short_project', array['payments','fintech','naira','cedi','usd','invoicing'], 'open'),
  (18, 'network', 'London diaspora investor intros',
   'Raising a small round for a permanent venue. Looking for London-based diaspora capital.',
   'few_hours', array['london','investors','venture','diaspora','restaurant'], 'open'),
  (18, 'expertise', 'IP and licensing for a recipe collection',
   'Publishing a recipe collection. Need IP advice on what is licensable and what is not.',
   'one_off', array['legal','ip','licensing','intellectual-property','publishing'], 'open')
) as n(slot, currency, title, context, scope, tags, status) on n.slot = st.slot;

do $$
declare
  v_manifest_count integer;
  v_stance_count integer;
  v_need_count integer;
begin
  select count(*) into v_manifest_count from contribution_manifests
    where user_id in (select user_id from seed_users_temp);
  select count(*) into v_stance_count from currency_stances
    where user_id in (select user_id from seed_users_temp);
  select count(*) into v_need_count from need_declarations
    where user_id in (select user_id from seed_users_temp);

  raise notice 'Seed complete: % manifests, % stances, % needs',
    v_manifest_count, v_stance_count, v_need_count;
end $$;

drop table seed_users_temp;