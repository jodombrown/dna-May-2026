/**
 * DNA | CONNECT — Diaspora Density Map (implementation)
 *
 * A public, consent-safe view of where the diaspora is concentrated. Mounted at
 * /dna/connect/map via the thin page wrapper
 * src/pages/dna/connect/DiasporaDensityMap.tsx, inside the standard BaseLayout
 * shell (BD110). The implementation lives under src/components so it can own
 * its page-level layout (Container / max-width / padding) — the design-system
 * gate bans those utilities only in src/pages.
 *
 * DATA — D049 guardrail (do not violate):
 *   This surface reads ONLY `rpc_diaspora_density_public`. It must NEVER call
 *   `rpc_diaspora_density_admin`, and must NEVER plot individual members. The
 *   returned counts are already floored and consent-gated server-side; do not
 *   enrich, join, or cross-reference them here.
 *
 * RENDER — Mapbox GL JS loaded at runtime from the official CDN (no npm
 * dependency; see src/lib/mapbox/loadMapbox.ts). One circle per place, radius
 * scaled by member_count, with a "<place>: <n> members" popup.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Globe2, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  loadMapbox,
  getMapboxToken,
  type MapboxMap,
  type MapboxPopup,
} from '@/lib/mapbox/loadMapbox';
import { tokenColor } from '@/lib/mapbox/tokenColor';
import { logger } from '@/lib/logger';

interface DensityRow {
  place_id: string;
  place_name: string;
  level: string;
  country_code: string;
  lat: number;
  lng: number;
  member_count: number;
}

const MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';
const SOURCE_ID = 'diaspora-density';
const LAYER_ID = 'diaspora-density-circles';
const DEFAULT_CENTER: [number, number] = [10, 20];
const DEFAULT_ZOOM = 1.4;

/** Circle radius (px) as a gentle function of member_count. */
function radiusForCount(count: number): number {
  return Math.max(10, Math.min(48, 8 + Math.sqrt(Math.max(count, 0)) * 6));
}

function membersLabel(count: number): string {
  return `${count} member${count === 1 ? '' : 's'}`;
}

function toFeatureCollection(rows: DensityRow[]) {
  return {
    type: 'FeatureCollection',
    features: rows
      .filter((r) => r.lat != null && r.lng != null)
      .map((r) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [r.lng, r.lat] },
        properties: {
          place_name: r.place_name,
          member_count: r.member_count,
          radius: radiusForCount(r.member_count),
        },
      })),
  };
}

export function DiasporaDensityMap() {
  const token = getMapboxToken();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const popupRef = useRef<MapboxPopup | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);

  // D049: ONLY the public RPC. Never the admin variant, never member rows.
  const { data: rows = [], isLoading, isError } = useQuery({
    queryKey: ['diaspora-density-public'],
    queryFn: async (): Promise<DensityRow[]> => {
      // `rpc_diaspora_density_public` is not in the generated types yet; the
      // name is cast (repo convention) so the client accepts it.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await supabase.rpc('rpc_diaspora_density_public' as any);
      if (error) throw error;
      return (data ?? []) as unknown as DensityRow[];
    },
    staleTime: 5 * 60_000,
  });

  const hasData = rows.length > 0;

  const totalMembers = useMemo(
    () => rows.reduce((sum, r) => sum + (r.member_count || 0), 0),
    [rows],
  );

  // ── Initialise the map once (only when we have a token and data) ─────────
  useEffect(() => {
    if (!token || !hasData || !containerRef.current) return;
    let cancelled = false;

    loadMapbox()
      .then((mapboxgl) => {
        if (cancelled || !containerRef.current) return;
        mapboxgl.accessToken = token;
        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: MAP_STYLE,
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          attributionControl: true,
        });
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
        popupRef.current = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 12,
          className: 'diaspora-popup',
        });
        map.once('load', () => {
          if (!cancelled) setMapReady(true);
        });
        mapRef.current = map;
      })
      .catch((err) => {
        logger.warn('DiasporaDensityMap', 'Mapbox failed to load', err);
        if (!cancelled) setMapFailed(true);
      });

    return () => {
      cancelled = true;
      popupRef.current?.remove();
      popupRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [token, hasData]);

  // ── Draw / update the density circles ────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const collection = toFeatureCollection(rows);

    const existing = map.getSource(SOURCE_ID);
    if (existing) {
      existing.setData(collection);
      return;
    }

    map.addSource(SOURCE_ID, { type: 'geojson', data: collection });
    map.addLayer({
      id: LAYER_ID,
      type: 'circle',
      source: SOURCE_ID,
      paint: {
        'circle-radius': ['get', 'radius'],
        'circle-color': tokenColor('--dna-copper'),
        'circle-opacity': 0.7,
        'circle-stroke-width': 2,
        'circle-stroke-color': tokenColor('--card'),
      },
    });

    const showPopup = (ev: {
      lngLat: { lng: number; lat: number };
      features?: Array<{ properties: Record<string, unknown> | null }>;
    }) => {
      const props = ev.features?.[0]?.properties;
      if (!props) return;
      const name = String(props.place_name ?? '');
      const count = Number(props.member_count ?? 0);
      popupRef.current
        ?.setLngLat([ev.lngLat.lng, ev.lngLat.lat])
        .setHTML(
          `<div class="diaspora-popup-body"><span class="text-body font-semibold text-foreground">${escapeHtml(
            name,
          )}: ${membersLabel(count)}</span></div>`,
        )
        .addTo(map);
    };

    map.on('mouseenter', LAYER_ID, (ev) => {
      map.getCanvas().style.cursor = 'pointer';
      showPopup(ev);
    });
    map.on('mousemove', LAYER_ID, showPopup);
    map.on('mouseleave', LAYER_ID, () => {
      map.getCanvas().style.cursor = '';
      popupRef.current?.remove();
    });
    map.on('click', LAYER_ID, showPopup);

    // Frame the data.
    void loadMapbox().then((mapboxgl) => {
      if (mapRef.current !== map) return;
      const points = collection.features.map(
        (f) => f.geometry.coordinates as [number, number],
      );
      if (points.length === 0) return;
      const bounds = new mapboxgl.LngLatBounds();
      points.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds, { padding: 96, maxZoom: 4, duration: 0 });
    });
  }, [mapReady, rows]);

  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 py-8 md:py-10">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <span className="inline-flex items-center gap-1.5 text-micro uppercase text-muted-foreground">
            <Globe2 className="w-3.5 h-3.5" aria-hidden="true" />
            Connect
          </span>
          <h1 className="text-h1 text-foreground">Diaspora Map</h1>
          <p className="text-body text-muted-foreground max-w-2xl">
            Where the African diaspora is gathering on DNA. Counts are aggregated
            and consent-gated — this map shows places, never people.
          </p>
        </header>

        {token && hasData && !isError && (
          <p className="text-meta text-muted-foreground">
            {totalMembers} member{totalMembers === 1 ? '' : 's'} across {rows.length}{' '}
            {rows.length === 1 ? 'place' : 'places'}
          </p>
        )}

        <DensityMapBody
          token={token}
          isLoading={isLoading}
          isError={isError}
          hasData={hasData}
          mapFailed={mapFailed}
          containerRef={containerRef}
        />
      </div>
    </div>
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface DensityMapBodyProps {
  token: string | null;
  isLoading: boolean;
  isError: boolean;
  hasData: boolean;
  mapFailed: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}

function StatePanel({
  icon: Icon,
  children,
}: {
  icon: typeof MapPin;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-map md:h-map-lg rounded-xl border border-border bg-muted/40 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-center px-6">
        <Icon className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
        <p className="text-body text-muted-foreground max-w-sm">{children}</p>
      </div>
    </div>
  );
}

function DensityMapBody({
  token,
  isLoading,
  isError,
  hasData,
  mapFailed,
  containerRef,
}: DensityMapBodyProps) {
  if (!token) {
    return (
      <StatePanel icon={MapPin}>
        Map unavailable: Mapbox token not configured.
      </StatePanel>
    );
  }
  if (mapFailed) {
    return (
      <StatePanel icon={MapPin}>
        The map could not be loaded. Please try again later.
      </StatePanel>
    );
  }
  if (isLoading) {
    return <div className="w-full h-map md:h-map-lg rounded-xl bg-muted animate-pulse" />;
  }
  if (isError) {
    return (
      <StatePanel icon={MapPin}>
        We couldn&apos;t load diaspora density right now. Please try again later.
      </StatePanel>
    );
  }
  if (!hasData) {
    return (
      <StatePanel icon={Globe2}>
        No diaspora density to show yet. As members share where they are, places
        will appear here.
      </StatePanel>
    );
  }
  return (
    <div className="relative w-full h-map md:h-map-lg rounded-xl overflow-hidden border border-border">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

export default DiasporaDensityMap;
