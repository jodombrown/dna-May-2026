import { useParams } from 'react-router-dom';
import { useHubData } from '@/hooks/useHubData';
import { useAuth } from '@/contexts/AuthContext';

// Placeholder components - will be built in Session 5
const RegionHero = ({ metadata }: any) => (
  <div className="h-[70vh] min-h-[400px] bg-gradient-to-b from-neutral-800 to-neutral-900 flex items-center justify-center">
    <div className="text-center text-white">
      <h1 className="text-5xl md:text-7xl font-bold mb-4">{metadata?.name?.toUpperCase()}</h1>
      <p className="text-xl italic opacity-90">"{metadata?.tagline}"</p>
    </div>
  </div>
);

const HubMetrics = ({ metrics }: any) => (
  <div className="bg-white py-6">
    <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
      <div><div className="text-3xl font-bold text-emerald-600">{metrics?.members_connected?.toLocaleString()}</div><div className="text-sm text-neutral-500">Members</div></div>
      <div><div className="text-3xl font-bold text-emerald-600">{metrics?.events_hosted?.toLocaleString()}</div><div className="text-sm text-neutral-500">Events</div></div>
      <div><div className="text-3xl font-bold text-emerald-600">{metrics?.projects_active?.toLocaleString()}</div><div className="text-sm text-neutral-500">Projects</div></div>
      <div><div className="text-3xl font-bold text-emerald-600">${(metrics?.contributions_total / 1000000).toFixed(1)}M</div><div className="text-sm text-neutral-500">Contributed</div></div>
    </div>
  </div>
);

const CountryCardGrid = ({ countries, regionSlug }: any) => {
  // Sort countries alphabetically
  const sortedCountries = [...(countries || [])].sort((a: any, b: any) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="bg-neutral-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h3 className="text-lg font-semibold text-neutral-700 mb-4">
          Explore {sortedCountries.length} Countries
        </h3>
        <div className="relative">
          <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-neutral-100">
            {sortedCountries.map((country: any) => (
              <a
                key={country.id}
                href={`/africa/${regionSlug}/${country.slug}`}
                className="flex-shrink-0 w-32 bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow border border-neutral-200"
              >
                <img
                  src={country.flag_url}
                  alt={country.name}
                  className="w-12 h-8 object-cover mx-auto mb-2 rounded shadow-sm"
                />
                <div className="font-semibold text-sm text-neutral-900 truncate">{country.name}</div>
                {country.tagline && (
                  <div className="text-xs text-neutral-500 mt-1 line-clamp-2">{country.tagline}</div>
                )}
              </a>
            ))}
          </div>
          {/* Scroll fade indicators */}
          <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-neutral-50 to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

const MemberCard = ({ member }: any) => {
  const initials = member.display_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const username = member.username || member.display_name?.toLowerCase().replace(/\s+/g, '') || member.id;

  return (
    <a
      href={`/u/${username}`}
      className="bg-white rounded-lg border border-neutral-200 p-5 hover:shadow-lg hover:-translate-y-1 transition-all block"
    >
      <div className="text-center">
        {member.avatar_url ? (
          <img
            src={member.avatar_url}
            alt={member.display_name}
            className="w-16 h-16 rounded-full mx-auto mb-3 object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-emerald-600 flex items-center justify-center text-white font-semibold text-lg">
            {initials}
          </div>
        )}
        <h3 className="font-semibold text-neutral-900">{member.display_name}</h3>
        <p className="text-sm text-neutral-600 line-clamp-2 mt-1">{member.headline}</p>
        {member.location && (
          <p className="text-xs text-neutral-400 mt-1">{member.location}</p>
        )}
        {member.expertise_areas?.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center mt-2">
            {member.expertise_areas.slice(0, 2).map((skill: string, i: number) => (
              <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
};

const FeedSection = ({ type, feed, hubName }: any) => {
  const config: Record<string, { emoji: string; title: string; bgClass: string }> = {
    connect: { emoji: '🔗', title: 'CONNECT IN', bgClass: 'bg-white' },
    convene: { emoji: '📅', title: 'CONVENE IN', bgClass: 'bg-neutral-50' },
    collaborate: { emoji: '🤝', title: 'COLLABORATE IN', bgClass: 'bg-white' },
  };
  const { emoji, title, bgClass } = config[type] || { emoji: '📋', title: type.toUpperCase(), bgClass: 'bg-white' };

  return (
    <section className={`py-12 ${bgClass}`}>
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-emerald-600 mb-6">
          {emoji} {title} {hubName?.toUpperCase()}
        </h2>
        {feed?.items?.length > 0 ? (
          <div className={`grid gap-6 ${type === 'connect' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
            {type === 'connect'
              ? feed.items.map((member: any) => <MemberCard key={member.id} member={member} />)
              : feed.items.map((item: any) => (
                  <div key={item.id} className="bg-white rounded-lg border border-neutral-200 p-5 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-neutral-900">{item.title || item.display_name}</h3>
                    <p className="text-sm text-neutral-600 mt-1">{item.description_short || item.headline}</p>
                  </div>
                ))
            }
          </div>
        ) : (
          <div className="text-center py-12 text-neutral-400">
            No {type} items yet. Be the first to add one!
          </div>
        )}
      </div>
    </section>
  );
};

const HubSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-[70vh] bg-neutral-200" />
    <div className="h-24 bg-neutral-100" />
    <div className="h-64 bg-neutral-50" />
  </div>
);

const HubError = ({ error }: any) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-2">Error Loading Hub</h1>
      <p className="text-neutral-500">{error?.message || 'Something went wrong'}</p>
    </div>
  </div>
);

export default function RegionHubPage() {
  const { regionSlug } = useParams<{ regionSlug: string }>();
  const { user } = useAuth();

  const { data, isLoading, error } = useHubData({
    hubType: 'region',
    hubSlug: regionSlug!,
    userId: user?.id
  });

  if (isLoading) return <HubSkeleton />;
  if (error || !data?.success) return <HubError error={error} />;

  const { metadata, metrics } = data.hub;
  const hubName = metadata?.name || 'Region';

  return (
    <div className="region-hub">
      <RegionHero metadata={metadata} />
      <HubMetrics metrics={metrics} />
      <CountryCardGrid countries={metadata?.countries} regionSlug={regionSlug} />
      <FeedSection type="connect" feed={data.feeds.connect} hubName={hubName} />
      <FeedSection type="convene" feed={data.feeds.convene} hubName={hubName} />
      <FeedSection type="collaborate" feed={data.feeds.collaborate} hubName={hubName} />
    </div>
  );
}
