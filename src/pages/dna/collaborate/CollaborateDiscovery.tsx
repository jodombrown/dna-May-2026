// Legacy discovery entry point. Spaces discovery now lives on SpacesIndex
// (/dna/collaborate/spaces), so anything still reaching this view is
// redirected there rather than shown a placeholder.
import { Navigate } from 'react-router-dom';

export function CollaborateDiscovery() {
  return <Navigate to="/dna/collaborate/spaces" replace />;
}

export default CollaborateDiscovery;
