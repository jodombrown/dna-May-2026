/**
 * My Stories route (BD139).
 *
 * Thin wrapper by design. The design-system gate forbids page-level layout
 * values under src/pages, so this file owns no width, no rhythm and no
 * typography — all of that lives in MyStoriesView.
 */

import { MyStoriesView } from '@/components/convey/MyStoriesView';

export function MyStories() {
  return <MyStoriesView />;
}

export default MyStories;
