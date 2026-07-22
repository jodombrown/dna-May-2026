/**
 * DNA | CONNECT — Diaspora Density Map route entry.
 *
 * Thin wrapper mounted at /dna/connect/map. The full implementation lives in
 * src/components/maps/DiasporaDensityMap.tsx; keeping page-level layout
 * utilities out of src/pages satisfies the design-system page gate.
 */
import DiasporaDensityMapView from '@/components/maps/DiasporaDensityMap';

export default function DiasporaDensityMapRoute() {
  return <DiasporaDensityMapView />;
}
