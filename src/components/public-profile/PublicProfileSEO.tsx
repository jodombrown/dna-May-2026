/**
 * PublicProfileSEO Component
 *
 * Comprehensive SEO meta tags and structured data for public profile pages.
 * Includes Open Graph, Twitter Cards, and JSON-LD Person schema.
 */

import { Helmet } from 'react-helmet-async';
import { DOMAINS, ROUTES } from '@/config/routes';

interface PublicProfileSEOProps {
  username: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  headline?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  company?: string | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  websiteUrl?: string | null;
  memberSince?: string | null;
}

export const PublicProfileSEO = ({
  username,
  fullName,
  firstName,
  lastName,
  headline,
  bio,
  avatarUrl,
  company,
  linkedinUrl,
  twitterUrl,
  websiteUrl,
  memberSince,
}: PublicProfileSEOProps) => {
  // Derive first/last name if not provided
  const nameParts = fullName.split(' ');
  const derivedFirstName = firstName || nameParts[0] || '';
  const derivedLastName = lastName || nameParts.slice(1).join(' ') || '';

  // Build description (cap at 160 chars total, including ellipsis)
  const description = bio
    ? (bio.length > 160 ? bio.slice(0, 157).trimEnd() + '...' : bio)
    : headline
      ? `${headline} - Connect with ${derivedFirstName} on DNA, the platform mobilizing the Global African Diaspora.`
      : `Connect with ${derivedFirstName} on DNA, the platform mobilizing the Global African Diaspora.`;

  // Canonical URL
  const canonicalUrl = `${DOMAINS.url}${ROUTES.profile.view(username)}`;

  // Default OG image fallback
  const ogImage = avatarUrl || `${DOMAINS.url}/icons/icon-512.png`;

  // Build sameAs array for JSON-LD
  const sameAs: string[] = [];
  if (linkedinUrl) sameAs.push(linkedinUrl);
  if (twitterUrl) sameAs.push(twitterUrl);
  if (websiteUrl) sameAs.push(websiteUrl);

  // JSON-LD structured data for Person schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: fullName,
    url: canonicalUrl,
    image: ogImage,
    jobTitle: headline || undefined,
    description: bio || undefined,
    memberOf: {
      '@type': 'Organization',
      name: 'Diaspora Network of Africa',
      url: DOMAINS.url,
    },
    ...(sameAs.length > 0 && { sameAs }),
  };

  return (
    <Helmet>
      {/* Basic SEO */}
      <title>{fullName} | DNA - Diaspora Network of Africa</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content="index, follow" />
      <meta name="author" content={fullName} />

      {/* Open Graph (Facebook, LinkedIn, etc.) */}
      <meta property="og:type" content="profile" />
      <meta property="og:title" content={`${fullName} | DNA`} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="Diaspora Network of Africa" />
      <meta property="profile:first_name" content={derivedFirstName} />
      <meta property="profile:last_name" content={derivedLastName} />
      <meta property="profile:username" content={username} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:site" content="@DNAplatform" />
      <meta name="twitter:title" content={`${fullName} | DNA`} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
};

export default PublicProfileSEO;
