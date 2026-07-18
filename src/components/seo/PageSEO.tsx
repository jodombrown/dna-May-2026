import { Helmet } from 'react-helmet-async';
import { config } from '@/lib/config';

interface PageSEOProps {
  title: string;
  description: string;
  keywords?: string[];
  canonicalPath?: string;
  ogType?: 'website' | 'article' | 'profile';
  ogImage?: string;
  noIndex?: boolean;
  structuredData?: object;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

/**
 * PageSEO - Reusable SEO component for all pages
 * 
 * Implements:
 * - Title tags (under 60 chars with keyword)
 * - Meta descriptions (under 160 chars)
 * - Open Graph tags
 * - Twitter Card tags
 * - Canonical URLs
 * - JSON-LD structured data
 */
export function PageSEO({
  title,
  description,
  keywords = [],
  canonicalPath,
  ogType = 'website',
  ogImage = '/og-image.png',
  noIndex = false,
  structuredData,
  author,
  publishedTime,
  modifiedTime,
}: PageSEOProps) {
  const fullTitle = title.includes('DNA') ? title : `${title} | DNA`;
  const canonicalUrl = canonicalPath 
    ? `${config.APP_URL}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`
    : undefined;
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${config.APP_URL}${ogImage}`;
  
  // Default diaspora-focused keywords
  const defaultKeywords = [
    'african diaspora',
    'diaspora network',
    'africa development',
    'african professionals',
    'diaspora investment',
  ];
  
  const allKeywords = [...new Set([...keywords, ...defaultKeywords])];

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={allKeywords.join(', ')} />
      {author && <meta name="author" content={author} />}
      
      {/* Robots */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:site_name" content="Diaspora Network of Africa" />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:locale" content="en_US" />
      
      {/* Article-specific OG tags */}
      {ogType === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {ogType === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {ogType === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />
      <meta name="twitter:site" content="@diasporanetwork" />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}

/**
 * Generate Organization structured data
 */
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Diaspora Network of Africa',
    alternateName: 'DNA',
    url: config.APP_URL,
    logo: `${config.APP_URL}/logo.png`,
    description: 'The mobilization infrastructure for the Global African Diaspora\'s return.',
    foundingDate: '2024',
    founder: {
      '@type': 'Person',
      name: 'Jaûne L. Odombrown',
      url: 'https://www.linkedin.com/in/jaunelamarr/',
    },
    sameAs: [
      config.social.linkedin,
      config.social.twitter,
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: config.emails.support,
      contactType: 'customer service',
    },
  };
}

/**
 * Generate WebSite structured data with SearchAction
 */
export function getWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Diaspora Network of Africa',
    alternateName: 'DNA',
    url: config.APP_URL,
    description: 'Connect, collaborate, and contribute to Africa\'s development with the global diaspora community.',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${config.APP_URL}/connect?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate BreadcrumbList structured data
 */
export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${config.APP_URL}${item.url}`,
    })),
  };
}

/**
 * Generate Event structured data
 */
export function getEventSchema(event: {
  name: string;
  description: string;
  /** Omit when dates aren't announced — never emit a placeholder instant. */
  startDate?: string;
  endDate?: string;
  location?: string;
  isVirtual?: boolean;
  image?: string;
  organizer?: string;
  url?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    eventAttendanceMode: event.isVirtual 
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    location: event.isVirtual
      ? {
          '@type': 'VirtualLocation',
          url: event.url || config.APP_URL,
        }
      : {
          '@type': 'Place',
          name: event.location,
        },
    image: event.image,
    organizer: event.organizer
      ? {
          '@type': 'Organization',
          name: event.organizer,
        }
      : undefined,
  };
}

/**
 * Generate Article structured data
 */
export function getArticleSchema(article: {
  headline: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.headline,
    description: article.description,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Diaspora Network of Africa',
      logo: {
        '@type': 'ImageObject',
        url: `${config.APP_URL}/logo.png`,
      },
    },
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    image: article.image,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
  };
}

export default PageSEO;
