// Continent -> ISO 3166-1 alpha-2 country code mapping.
// Curated against the UN M49 / ISO country/continent groupings.
// Used by PlaceDeclarationStep to filter the country dropdown by continent.

export type ContinentCode = 'AF' | 'AS' | 'EU' | 'NA' | 'SA' | 'OC';

export const CONTINENTS: { code: ContinentCode; name: string }[] = [
  { code: 'AF', name: 'Africa' },
  { code: 'AS', name: 'Asia' },
  { code: 'EU', name: 'Europe' },
  { code: 'NA', name: 'North America' },
  { code: 'SA', name: 'South America' },
  { code: 'OC', name: 'Oceania' },
];

export const CONTINENT_COUNTRIES: Record<ContinentCode, string[]> = {
  AF: [
    'DZ','AO','BJ','BW','BF','BI','CM','CV','CF','TD','KM','CG','CD','CI','DJ','EG','GQ','ER','SZ','ET',
    'GA','GM','GH','GN','GW','KE','LS','LR','LY','MG','MW','ML','MR','MU','MA','MZ','NA','NE','NG','RW',
    'ST','SN','SC','SL','SO','ZA','SS','SD','TZ','TG','TN','UG','EH','ZM','ZW',
  ],
  AS: [
    'AF','AM','AZ','BH','BD','BT','BN','KH','CN','CY','GE','HK','IN','ID','IR','IQ','IL','JP','JO','KZ',
    'KW','KG','LA','LB','MO','MY','MV','MN','MM','NP','KP','OM','PK','PS','PH','QA','SA','SG','KR','LK',
    'SY','TW','TJ','TH','TL','TR','TM','AE','UZ','VN','YE',
  ],
  EU: [
    'AL','AD','AT','BY','BE','BA','BG','HR','CZ','DK','EE','FI','FR','DE','GR','HU','IS','IE','IT','XK',
    'LV','LI','LT','LU','MT','MD','MC','ME','NL','MK','NO','PL','PT','RO','RU','SM','RS','SK','SI','ES',
    'SE','CH','UA','GB','VA',
  ],
  NA: [
    'AG','BS','BB','BZ','CA','CR','CU','DM','DO','SV','GD','GT','HT','HN','JM','MX','NI','PA','KN','LC',
    'VC','TT','US',
  ],
  SA: [
    'AR','BO','BR','CL','CO','EC','GY','PY','PE','SR','UY','VE',
  ],
  OC: [
    'AU','FJ','KI','MH','FM','NR','NZ','PW','PG','WS','SB','TO','TV','VU',
  ],
};
