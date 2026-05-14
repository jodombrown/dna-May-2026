/**
 * Release Detail Page
 * Individual release page with deep-dive content
 * Route: /releases/:slug
 */

import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ArrowRight, ExternalLink, AlertCircle } from 'lucide-react';
import { useReleaseWithRelated } from '@/hooks/useReleases';
import {
  ReleaseHero,
  ReleaseMeta,
  FeatureList,
  ReleaseCard,
} from '@/components/releases';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getLifecycleStage } from '@/types/releases';

const ReleaseDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { release, relatedReleases, isLoading, isLoadingRelated, error } = useReleaseWithRelated(slug || '');

  // Handle not found
  if (!isLoading && !release) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Release not found</h1>
          <p className="text-neutral-600 mb-6">
            The release you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button onClick={() => navigate('/releases')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Releases
          </Button>
        </div>
      </div>
    );
  }

  // Handle error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Unable to load release</h1>
          <p className="text-neutral-600 mb-6">
            Please try refreshing the page or check back later.
          </p>
          <Button onClick={() => navigate('/releases')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Releases
          </Button>
        </div>
      </div>
    );
  }

  const lifecycleStage = release
    ? getLifecycleStage(release.release_date, release.status, release.archived_at)
    : 'recent';

  const isArchived = lifecycleStage === 'archived';

  const releaseDate = release
    ? new Date(release.release_date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <>
      {release && (
        <Helmet>
          <title>{release.meta_title || release.title} | DNA Platform</title>
          <meta
            name="description"
            content={release.meta_description || release.subtitle || release.description.slice(0, 160)}
          />
          <meta property="og:title" content={release.title} />
          <meta property="og:description" content={release.subtitle || release.description.slice(0, 160)} />
          <meta property="og:type" content="article" />
          <meta property="article:published_time" content={release.release_date} />
        </Helmet>
      )}

      <div className="min-h-screen bg-white">
        {/* Back Navigation */}
        <div className="bg-neutral-50 border-b border-neutral-200">
          <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              to="/releases"
              className="inline-flex items-center gap-2 py-4 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Releases
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="aspect-video rounded-xl mb-8" />
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/2 mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        )}

        {/* Release Content */}
        {release && (
          <article className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Archived Notice */}
            {isArchived && (
              <Alert className="mb-6 bg-neutral-50 border-neutral-200">
                <AlertCircle className="h-4 w-4 text-neutral-600" />
                <AlertDescription className="text-neutral-700">
                  This feature was released on {releaseDate}. It may have been updated since this announcement.
                </AlertDescription>
              </Alert>
            )}

            {/* Meta Information */}
            <div className="mb-6">
              <ReleaseMeta release={release} />
            </div>

            {/* Hero Media */}
            <div className="relative aspect-video rounded-xl overflow-hidden shadow-lg mb-8">
              <ReleaseHero
                heroType={release.hero_type}
                imageUrl={release.hero_image_url}
                videoUrl={release.hero_video_url}
                category={release.category}
                className="absolute inset-0"
              />
            </div>

            {/* Title & Subtitle */}
            <header className="mb-8">
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
                {release.title}
              </h1>
              {release.subtitle && (
                <p className="text-xl text-neutral-600 italic">
                  {release.subtitle}
                </p>
              )}
            </header>

            {/* Description */}
            <div className="prose prose-lg max-w-none mb-10">
              <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap">
                {release.description}
              </p>
            </div>

            {/* Features List */}
            {release.features && release.features.length > 0 && (
              <FeatureList features={release.features.map((f: any) => typeof f === 'string' ? f : f.feature_text)} className="mb-10" />
            )}

            {/* CTA Button */}
            {release.cta_link && (
              <div className="flex justify-center mb-12">
                <Button asChild size="lg" className="gap-2">
                  <Link to={release.cta_link}>
                    {release.cta_text || 'Try it now'}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            )}

            {/* Media Gallery */}
            {(release as any).media && (release as any).media.length > 0 && (
              <section className="mb-12">
                <h2 className="font-serif text-2xl font-semibold text-neutral-900 mb-6">
                  Gallery
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(release as any).media.map((item: any) => (
                    <div key={item.id} className="rounded-lg overflow-hidden shadow-md">
                      {item.media_type === 'video' ? (
                        <video
                          src={item.url}
                          controls
                          className="w-full"
                          poster={release.hero_image_url || undefined}
                        />
                      ) : (
                        <img
                          src={item.url}
                          alt={item.alt_text || release.title}
                          className="w-full"
                          loading="lazy"
                        />
                      )}
                      {item.caption && (
                        <p className="p-3 text-sm text-neutral-600 bg-neutral-50">
                          {item.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Changelog */}
            {(release as any).changelog && (release as any).changelog.length > 0 && (
              <section className="mb-12">
                <h2 className="font-serif text-2xl font-semibold text-neutral-900 mb-6">
                  Changelog
                </h2>
                <div className="space-y-4">
                  {(release as any).changelog.map((entry: any) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 p-4 rounded-lg bg-neutral-50"
                    >
                      <ChangelogBadge type={entry.change_type} />
                      <div>
                        <p className="text-neutral-700">{entry.description}</p>
                        <p className="text-xs text-neutral-500 mt-1">
                          {new Date(entry.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Divider */}
            <hr className="border-neutral-200 my-12" />

            {/* Related Releases */}
            {relatedReleases.length > 0 && (
              <section>
                <h2 className="font-serif text-2xl font-semibold text-neutral-900 mb-6">
                  Related Releases
                </h2>
                {isLoadingRelated ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-48 rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {relatedReleases.map((related) => (
                      <ReleaseCard
                        key={related.id}
                        release={{
                          ...related,
                          lifecycle_stage: 'recent',
                          features: [],
                        }}
                        variant="compact"
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* View All Releases Link */}
            <div className="mt-12 text-center">
              <Link
                to="/releases"
                className="inline-flex items-center gap-2 text-dna-emerald font-medium hover:underline"
              >
                View all releases
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </article>
        )}
      </div>
    </>
  );
};

/**
 * Changelog Badge Component
 */
const ChangelogBadge: React.FC<{ type: string }> = ({ type }) => {
  const styles: Record<string, { label: string; className: string }> = {
    added: { label: 'Added', className: 'bg-green-100 text-green-700' },
    improved: { label: 'Improved', className: 'bg-blue-100 text-blue-700' },
    fixed: { label: 'Fixed', className: 'bg-orange-100 text-orange-700' },
    removed: { label: 'Removed', className: 'bg-red-100 text-red-700' },
    security: { label: 'Security', className: 'bg-copper-100 text-copper-700' },
  };

  const style = styles[type] || styles.improved;

  return (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${style.className}`}>
      {style.label}
    </span>
  );
};

export default ReleaseDetail;
