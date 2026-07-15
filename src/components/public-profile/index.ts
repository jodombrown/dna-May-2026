/**
 * Public Profile Components
 *
 * Components for the public profile page (/dna/:username) when viewed by non-authenticated users.
 */

export { PublicProfileSEO } from './PublicProfileSEO';
export { PublicProfileHero } from './PublicProfileHero';
export { PublicProfileCTA } from './PublicProfileCTA';
export { PublicProfileFooter } from './PublicProfileFooter';
// PublicProfileHeader was intentionally removed. Do not reintroduce a fixed
// "← DNA / Join DNA" chrome bar on public profile pages - it is banned
// platform-wide. Public routes use the site-wide public header instead.
