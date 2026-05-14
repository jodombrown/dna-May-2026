# DNA Clickability Report

Generated: 2026-05-08T20:57:15.072Z
Files scanned: 942
Potential issues: 1644

> Heuristic scan. False positives expected. Use this as a triage list,
> not a hard gate. Each entry is a stat-like element with no nearby
> button/link/onClick handler.

| File | Line | Snippet |
| --- | ---: | --- |
| `src/pages/dna/Feed.tsx` | 72 | `// Increment session count for DIA cadence engine` |
| `src/pages/dna/Feed.tsx` | 357 | `<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FeedTab)}>` |
| `src/pages/dna/FeedStoryDetail.tsx` | 245 | `<span>{galleryUrls.length} photo{galleryUrls.length !== 1 ? 's' : ''}</span>` |
| `src/pages/dna/FeedStoryDetail.tsx` | 262 | `Photo {idx + 1} of {galleryUrls.length}` |
| `src/pages/dna/HashtagFeed.tsx` | 188 | `postCount={hashtag?.usage_count \|\| posts?.length \|\| 0}` |
| `src/pages/dna/Messages.tsx` | 117 | `<div className="min-h-screen bg-background pb-bottom-nav" style={{ paddingTop: 'var(--total-header-height, 56px)' }}>` |
| `src/pages/dna/Notifications.tsx` | 77 | `<span className="ml-2 text-xs">({notifications.length})</span>` |
| `src/pages/dna/Notifications.tsx` | 83 | `<span className="ml-2 text-xs">({unreadNotifications.length})</span>` |
| `src/pages/dna/PublicProfile.tsx` | 473 | `{mutualConnections.length} Mutual Connection{mutualConnections.length !== 1 ? 's' : ''}` |
| `src/pages/dna/Username.tsx` | 311 | `{isOwnProfile && <TabsTrigger value="activity">Activity</TabsTrigger>}` |
| `src/pages/dna/Username.tsx` | 395 | `{contributions.length} contribution{contributions.length !== 1 && 's'}` |
| `src/pages/dna/connect/Connect.tsx` | 158 | `// Mobile view - use Outlet for child routes to prevent hook count issues` |
| `src/pages/dna/connect/Discover.tsx` | 31 | `setMobileActiveFilterCount: (count: number) => void;` |
| `src/pages/dna/connect/Discover.tsx` | 95 | `// Count active filters` |
| `src/pages/dna/connect/Discover.tsx` | 97 | `let count = 0;` |
| `src/pages/dna/connect/Discover.tsx` | 98 | `if (filters.country_of_origin) count++;` |
| `src/pages/dna/connect/Discover.tsx` | 99 | `if (filters.current_country) count++;` |
| `src/pages/dna/connect/Discover.tsx` | 100 | `if (filters.focus_areas?.length) count += filters.focus_areas.length;` |
| `src/pages/dna/connect/Discover.tsx` | 101 | `if (filters.regional_expertise?.length) count += filters.regional_expertise.length;` |
| `src/pages/dna/connect/Discover.tsx` | 102 | `if (filters.industries?.length) count += filters.industries.length;` |
| `src/pages/dna/connect/Discover.tsx` | 103 | `if (filters.skills?.length) count += filters.skills.length;` |
| `src/pages/dna/connect/Discover.tsx` | 104 | `return count;` |
| `src/pages/dna/connect/Discover.tsx` | 107 | `// Sync filter count to parent for mobile header` |
| `src/pages/dna/connect/Discover.tsx` | 214 | `trackEvent('connect_discovery_filter_applied', { filter_count: Object.keys(newFilters).length });` |
| `src/pages/dna/connect/Discover.tsx` | 240 | `onChange={(value) => setDesktopSearchQuery(value)}` |
| `src/pages/dna/connect/Discover.tsx` | 242 | `isLoading={loading && members.length > 0}` |
| `src/pages/dna/connect/Discover.tsx` | 266 | `<MemberCardSkeletonGrid count={4} />` |
| `src/pages/dna/connect/Network.tsx` | 202 | `Requests {requests.length > 0 && <span className="ml-1 bg-dna-copper text-white rounded-full px-2 py-0.5 text-xs">{requests.length}</span>}` |
| `src/pages/dna/connect/Network.tsx` | 206 | `Sent {sentRequests.length > 0 && <span className="ml-1 bg-amber-500 text-white rounded-full px-2 py-0.5 text-xs">{sentRequests.length}</span>}` |
| `src/pages/dna/connect/Network.tsx` | 257 | `{connections.length} connection{connections.length !== 1 ? 's' : ''}` |
| `src/pages/dna/connect/Network.tsx` | 279 | `onChange={(e) => setSearchQuery(e.target.value)}` |
| `src/pages/dna/convene/ConveneDiscovery.tsx` | 173 | `event_attendees(count)` |
| `src/pages/dna/convene/ConveneDiscovery.tsx` | 261 | `(event.event_attendees as Array<{ count: number }> \| undefined)?.[0]` |
| `src/pages/dna/convene/ConveneDiscovery.tsx` | 262 | `?.count \|\| 0,` |
| `src/pages/dna/convene/ConveneDiscovery.tsx` | 514 | `<div className="hidden lg:block sticky space-y-6" style={{ top: 'var(--total-header-height, 80px)' }}>` |
| `src/pages/dna/convene/EventCheckIn.tsx` | 328 | `onChange={(e) => setSearchQuery(e.target.value)}` |
| `src/pages/dna/convene/EventDetail.tsx` | 79 | `{ value: 'spam', label: 'Spam' },` |
| `src/pages/dna/convene/EventDetail.tsx` | 80 | `{ value: 'inappropriate_content', label: 'Inappropriate Content' },` |
| `src/pages/dna/convene/EventDetail.tsx` | 81 | `{ value: 'misleading_information', label: 'Misleading Information' },` |
| `src/pages/dna/convene/EventDetail.tsx` | 82 | `{ value: 'harassment', label: 'Harassment' },` |
| `src/pages/dna/convene/EventDetail.tsx` | 83 | `{ value: 'other', label: 'Other' },` |
| `src/pages/dna/convene/EventDetail.tsx` | 250 | `// Fetch total registration count` |
| `src/pages/dna/convene/EventDetail.tsx` | 252 | `queryKey: ['event-registration-count', id],` |
| `src/pages/dna/convene/EventDetail.tsx` | 254 | `const { count, error } = await supabase` |
| `src/pages/dna/convene/EventDetail.tsx` | 256 | `.select('id', { count: 'exact' })` |
| `src/pages/dna/convene/EventDetail.tsx` | 261 | `return count \|\| 0;` |
| `src/pages/dna/convene/EventDetail.tsx` | 359 | `queryClient.invalidateQueries({ queryKey: ['event-registration-count', id] });` |
| `src/pages/dna/convene/EventDetail.tsx` | 823 | `{REPORT_REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}` |
| `src/pages/dna/convene/EventDetail.tsx` | 829 | `<Textarea id="report-details" placeholder="Provide any additional context..." value={reportDetails} onChange={e => setReportDetails(e.target.value)} rows={4} />` |
| `src/pages/dna/convene/EventsIndex.tsx` | 153 | `onChange={(e) => setSearchTerm(e.target.value)}` |
| `src/pages/dna/convene/EventsIndex.tsx` | 260 | `{events.length} event{events.length !== 1 ? 's' : ''} found` |
| `src/pages/dna/convene/GroupEventsPage.tsx` | 159 | `<TabsTrigger value="upcoming">Upcoming ({upcomingEvents.length})</TabsTrigger>` |
| `src/pages/dna/convene/GroupEventsPage.tsx` | 160 | `<TabsTrigger value="past">Past ({pastEvents.length})</TabsTrigger>` |
| `src/pages/dna/convene/GroupsBrowse.tsx` | 136 | `onChange={(e) => setSearchQuery(e.target.value)}` |
| `src/pages/dna/convene/MyEvents.tsx` | 50 | `.select('*, event_attendees(count)')` |
| `src/pages/dna/convene/MyEvents.tsx` | 76 | `.select('*, event_attendees(count)')` |
| `src/pages/dna/convene/MyEvents.tsx` | 141 | `? ((lastPastEvent.event_attendees as Array<{ count: number }>)?.[0]?.count ?? 0)` |
| `src/pages/dna/convene/MyEvents.tsx` | 203 | `<TabsTrigger value="hosting">Hosting ({hostingEvents.length})</TabsTrigger>` |
| `src/pages/dna/convene/MyEvents.tsx` | 204 | `<TabsTrigger value="attending">Attending ({attendingEvents.length})</TabsTrigger>` |
| `src/pages/dna/convene/MyEvents.tsx` | 264 | `Upcoming ({upcomingHosting.length})` |
| `src/pages/dna/convene/MyEvents.tsx` | 320 | `Upcoming ({upcomingAttending.length})` |
| `src/pages/dna/convey/ConveyDiscovery.tsx` | 49 | `// Published stories count - only real stories (post_type='story' AND non-null story_type)` |
| `src/pages/dna/convey/ConveyDiscovery.tsx` | 50 | `const { count: publishedCount } = await supabase` |
| `src/pages/dna/convey/ConveyDiscovery.tsx` | 52 | `.select('id', { count: 'exact' })` |
| `src/pages/dna/convey/ConveyDiscovery.tsx` | 61 | `const { count: myCount } = await supabase` |
| `src/pages/dna/convey/ConveyDiscovery.tsx` | 63 | `.select('id', { count: 'exact' })` |
| `src/pages/dna/settings/AccountSettings.tsx` | 222 | `onChange={(e) => setNewEmail(e.target.value)}` |
| `src/pages/dna/settings/AccountSettings.tsx` | 253 | `onChange={(e) => setCurrentPassword(e.target.value)}` |
| `src/pages/dna/settings/AccountSettings.tsx` | 267 | `onChange={(e) => setNewPassword(e.target.value)}` |
| `src/pages/dna/settings/AccountSettings.tsx` | 282 | `onChange={(e) => setConfirmPassword(e.target.value)}` |
| `src/pages/dna/settings/AccountSettings.tsx` | 341 | `onChange={(e) => setDeleteConfirmation(e.target.value)}` |
| `src/pages/dna/settings/BlockedUsersSettings.tsx` | 136 | `<CardTitle>Blocked Users ({blockedUsers?.length \|\| 0})</CardTitle>` |
| `src/pages/dna/settings/MyHashtagsSettings.tsx` | 112 | `onChange={(e) => setNewTag(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}` |
| `src/pages/dna/settings/MyHashtagsSettings.tsx` | 122 | `onChange={(e) => setNewDescription(e.target.value)}` |
| `src/pages/dna/settings/MyHashtagsSettings.tsx` | 147 | `<TabsTrigger value="active">Active ({activeHashtags.length})</TabsTrigger>` |
| `src/pages/dna/settings/MyHashtagsSettings.tsx` | 148 | `<TabsTrigger value="archived">Archived ({archivedHashtags.length})</TabsTrigger>` |
| `src/pages/dna/settings/MyReportsSettings.tsx` | 151 | `<CardTitle>Your Reports ({reports?.length \|\| 0})</CardTitle>` |
| `src/pages/dna/settings/NotificationSettings.tsx` | 13 | `{ value: 'America/New_York', label: 'Eastern Time (US)' },` |
| `src/pages/dna/settings/NotificationSettings.tsx` | 14 | `{ value: 'America/Chicago', label: 'Central Time (US)' },` |
| `src/pages/dna/settings/NotificationSettings.tsx` | 15 | `{ value: 'America/Denver', label: 'Mountain Time (US)' },` |
| `src/pages/dna/settings/NotificationSettings.tsx` | 16 | `{ value: 'America/Los_Angeles', label: 'Pacific Time (US)' },` |
| `src/pages/dna/settings/NotificationSettings.tsx` | 17 | `{ value: 'Europe/London', label: 'London (UK)' },` |
| `src/pages/dna/settings/NotificationSettings.tsx` | 18 | `{ value: 'Europe/Paris', label: 'Paris (France)' },` |
| `src/pages/dna/settings/NotificationSettings.tsx` | 19 | `{ value: 'Europe/Berlin', label: 'Berlin (Germany)' },` |
| `src/pages/dna/settings/NotificationSettings.tsx` | 20 | `{ value: 'Africa/Lagos', label: 'Lagos (Nigeria)' },` |
| `src/pages/dna/settings/NotificationSettings.tsx` | 21 | `{ value: 'Africa/Nairobi', label: 'Nairobi (Kenya)' },` |
| `src/pages/dna/settings/NotificationSettings.tsx` | 22 | `{ value: 'Africa/Johannesburg', label: 'Johannesburg (South Africa)' },` |
| `src/pages/dna/settings/NotificationSettings.tsx` | 23 | `{ value: 'Africa/Cairo', label: 'Cairo (Egypt)' },` |
| `src/pages/dna/settings/NotificationSettings.tsx` | 24 | `{ value: 'Africa/Accra', label: 'Accra (Ghana)' },` |
| `src/pages/dna/settings/NotificationSettings.tsx` | 25 | `{ value: 'Africa/Addis_Ababa', label: 'Addis Ababa (Ethiopia)' },` |
| `src/pages/dna/settings/NotificationSettings.tsx` | 26 | `{ value: 'Asia/Dubai', label: 'Dubai (UAE)' },` |
| `src/pages/dna/settings/NotificationSettings.tsx` | 27 | `{ value: 'Asia/Singapore', label: 'Singapore' },` |
| `src/pages/dna/settings/NotificationSettings.tsx` | 28 | `{ value: 'Australia/Sydney', label: 'Sydney (Australia)' },` |
| `src/pages/dna/settings/NotificationSettings.tsx` | 32 | `{ value: 'high', label: 'High - Real-time notifications' },` |
| `src/pages/dna/settings/NotificationSettings.tsx` | 33 | `{ value: 'normal', label: 'Normal - Regular frequency' },` |
| `src/pages/dna/settings/NotificationSettings.tsx` | 34 | `{ value: 'low', label: 'Low - Batched updates' },` |
| `src/pages/dna/settings/NotificationSettings.tsx` | 35 | `{ value: 'never', label: 'Never - No email notifications' },` |
| `src/pages/dna/settings/NotificationSettings.tsx` | 53 | `updatePreferences({ [field]: value });` |
| `src/pages/dna/settings/NotificationSettings.tsx` | 178 | `onValueChange={(value) => handleUpdate('notification_frequency', value)}` |
| `src/pages/dna/settings/NotificationSettings.tsx` | 185 | `<SelectItem key={option.value} value={option.value}>` |
| `src/pages/dna/settings/NotificationSettings.tsx` | 221 | `onChange={(e) => handleUpdate('quiet_hours_start', e.target.value \|\| null)}` |
| `src/pages/dna/settings/NotificationSettings.tsx` | 230 | `onChange={(e) => handleUpdate('quiet_hours_end', e.target.value \|\| null)}` |
| `src/pages/dna/settings/NotificationSettings.tsx` | 254 | `onValueChange={(value) => handleUpdate('timezone', value)}` |
| `src/pages/dna/settings/NotificationSettings.tsx` | 261 | `<SelectItem key={tz.value} value={tz.value}>` |
| `src/pages/dna/settings/PreferencesSettings.tsx` | 86 | `const newPrefs = { ...preferences, [field]: value };` |
| `src/pages/dna/settings/PreferencesSettings.tsx` | 124 | `onValueChange={(value: 'comfortable' \| 'compact') => handleUpdate('display_density', value)}` |
| `src/pages/dna/settings/PrivacySettings.tsx` | 457 | `{/* Connection Count */}` |
| `src/pages/dna/settings/PrivacySettings.tsx` | 460 | `<Label htmlFor="vis_connections" className="font-normal">Connection count</Label>` |
| `src/pages/dna/settings/PrivacySettings.tsx` | 470 | `{/* Event Count */}` |
| `src/pages/dna/settings/PrivacySettings.tsx` | 473 | `<Label htmlFor="vis_events" className="font-normal">Events attended count</Label>` |
| `src/components/AmbassadorSignupDialog.tsx` | 168 | `onChange={(e) => handleInputChange('firstName', e.target.value)}` |
| `src/components/AmbassadorSignupDialog.tsx` | 182 | `onChange={(e) => handleInputChange('lastName', e.target.value)}` |
| `src/components/AmbassadorSignupDialog.tsx` | 198 | `onChange={(e) => handleInputChange('email', e.target.value)}` |
| `src/components/AmbassadorSignupDialog.tsx` | 214 | `onChange={(e) => handleInputChange('organization', e.target.value)}` |
| `src/components/AmbassadorSignupDialog.tsx` | 223 | `onChange={(value) => handleInputChange('currentLocation', value)}` |
| `src/components/AmbassadorSignupDialog.tsx` | 238 | `onChange={(e) => handleInputChange('connectionToAfrica', e.target.value)}` |
| `src/components/AmbassadorSignupDialog.tsx` | 252 | `onChange={(e) => handleInputChange('linkedin', e.target.value)}` |
| `src/components/AmbassadorSignupDialog.tsx` | 265 | `onChange={(e) => handleInputChange('experience', e.target.value)}` |
| `src/components/AmbassadorSignupDialog.tsx` | 279 | `onChange={(e) => handleInputChange('motivation', e.target.value)}` |
| `src/components/AmbassadorSignupDialog.tsx` | 293 | `onChange={(e) => handleInputChange('skills', e.target.value)}` |
| `src/components/AmbassadorSignupDialog.tsx` | 307 | `onChange={(e) => handleInputChange('availability', e.target.value)}` |
| `src/components/FeedbackPanel.tsx` | 209 | `onChange={(e) => handleInputChange('firstName', e.target.value)}` |
| `src/components/FeedbackPanel.tsx` | 223 | `onChange={(e) => handleInputChange('lastName', e.target.value)}` |
| `src/components/FeedbackPanel.tsx` | 239 | `onChange={(e) => handleInputChange('email', e.target.value)}` |
| `src/components/FeedbackPanel.tsx` | 254 | `onChange={(e) => handleInputChange('linkedin', e.target.value)}` |
| `src/components/FeedbackPanel.tsx` | 267 | `onChange={(e) => handleInputChange('recommendations', e.target.value)}` |
| `src/components/FeedbackPanel.tsx` | 272 | `{formData.recommendations.length}/1000 characters` |
| `src/components/JoinBetaDialog.tsx` | 113 | `onChange={(e) => setFormData({ ...formData, name: e.target.value })}` |
| `src/components/JoinBetaDialog.tsx` | 127 | `onChange={(e) => setFormData({ ...formData, email: e.target.value })}` |
| `src/components/JoinBetaDialog.tsx` | 140 | `onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}` |
| `src/components/JoinBetaDialog.tsx` | 152 | `onChange={(e) => setFormData({ ...formData, interest: e.target.value })}` |
| `src/components/MainPageFeedbackPanel.tsx` | 176 | `onChange={(e) => handleInputChange('firstName', e.target.value)}` |
| `src/components/MainPageFeedbackPanel.tsx` | 190 | `onChange={(e) => handleInputChange('lastName', e.target.value)}` |
| `src/components/MainPageFeedbackPanel.tsx` | 206 | `onChange={(e) => handleInputChange('email', e.target.value)}` |
| `src/components/MainPageFeedbackPanel.tsx` | 222 | `onChange={(e) => handleInputChange('organization', e.target.value)}` |
| `src/components/MainPageFeedbackPanel.tsx` | 231 | `onChange={(value) => handleInputChange('currentLocation', value)}` |
| `src/components/MainPageFeedbackPanel.tsx` | 246 | `onChange={(e) => handleInputChange('connectionToAfrica', e.target.value)}` |
| `src/components/MainPageFeedbackPanel.tsx` | 260 | `onChange={(e) => handleInputChange('linkedin', e.target.value)}` |
| `src/components/MainPageFeedbackPanel.tsx` | 273 | `onChange={(e) => handleInputChange('overallExperience', e.target.value)}` |
| `src/components/MainPageFeedbackPanel.tsx` | 287 | `onChange={(e) => handleInputChange('mostValuableFeature', e.target.value)}` |
| `src/components/MainPageFeedbackPanel.tsx` | 301 | `onChange={(e) => handleInputChange('improvementAreas', e.target.value)}` |
| `src/components/MainPageFeedbackPanel.tsx` | 315 | `onChange={(e) => handleInputChange('suggestions', e.target.value)}` |
| `src/components/MainPageFeedbackPanel.tsx` | 320 | `{formData.suggestions.length}/1000 characters` |
| `src/components/RequestDemoDialog.tsx` | 37 | `const { name, value } = e.target;` |
| `src/components/RequestDemoDialog.tsx` | 38 | `setFormData((prev) => ({ ...prev, [name]: value }));` |
| `src/components/StayNotifiedPanel/NotificationForm.tsx` | 100 | `onChange={(e) => setFormData({ ...formData, name: e.target.value })}` |
| `src/components/StayNotifiedPanel/NotificationForm.tsx` | 115 | `onChange={(e) => setFormData({ ...formData, email: e.target.value })}` |
| `src/components/StayNotifiedPanel/NotificationForm.tsx` | 130 | `onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}` |
| `src/components/StayNotifiedPanel/NotificationForm.tsx` | 143 | `onChange={(e) => setFormData({ ...formData, message: e.target.value })}` |
| `src/components/UnifiedHeader.tsx` | 52 | `// useUnreadNotificationCount removed — UnifiedNotificationBell handles its own count` |
| `src/components/UnifiedHeader.tsx` | 94 | `// Unread notification count now handled by UnifiedNotificationBell internally` |
| `src/components/UnifiedHeader.tsx` | 96 | `// Query unread message count` |
| `src/components/_archived/admin_legacy/CommunityModeration.tsx` | 177 | `<p className="text-2xl font-bold text-blue-600">{communities.length}</p>` |
| `src/components/_archived/admin_legacy/CommunityModeration.tsx` | 183 | `<p className="text-2xl font-bold text-yellow-600">{pendingCommunities.length}</p>` |
| `src/components/_archived/admin_legacy/CommunityModeration.tsx` | 189 | `<p className="text-2xl font-bold text-green-600">{activeCommunities.length}</p>` |
| `src/components/_archived/admin_legacy/CommunityModeration.tsx` | 196 | `{communities.filter(c => c.is_featured).length}` |
| `src/components/_archived/admin_legacy/CommunityModeration.tsx` | 208 | `Pending Review ({pendingCommunities.length})` |
| `src/components/_archived/admin_legacy/CommunityModeration.tsx` | 316 | `onChange={(e) => setModeratorNotes(e.target.value)}` |
| `src/components/_archived/admin_legacy/FeatureTogglesPanel.tsx` | 191 | `onChange={(e) => setNewFlag(prev => ({ ...prev, feature_key: e.target.value }))}` |
| `src/components/_archived/admin_legacy/FeatureTogglesPanel.tsx` | 213 | `onChange={(e) => setNewFlag(prev => ({ ...prev, notes: e.target.value }))}` |
| `src/components/_archived/admin_legacy/InviteSystemOverview.tsx` | 197 | `<p className="text-2xl font-bold text-blue-600">{stats.total}</p>` |
| `src/components/_archived/admin_legacy/InviteSystemOverview.tsx` | 203 | `<p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>` |
| `src/components/_archived/admin_legacy/InviteSystemOverview.tsx` | 209 | `<p className="text-2xl font-bold text-green-600">{stats.used}</p>` |
| `src/components/_archived/admin_legacy/InviteSystemOverview.tsx` | 215 | `<p className="text-2xl font-bold text-red-600">{stats.expired}</p>` |
| `src/components/_archived/admin_legacy/InviteSystemOverview.tsx` | 240 | `onChange={(e) => setNewInviteEmail(e.target.value)}` |
| `src/components/_archived/admin_legacy/LeaderboardsByRegion.tsx` | 73 | `{ value: 'all', label: 'All Regions' },` |
| `src/components/_archived/admin_legacy/LeaderboardsByRegion.tsx` | 74 | `{ value: 'Nigeria', label: 'Nigeria' },` |
| `src/components/_archived/admin_legacy/LeaderboardsByRegion.tsx` | 75 | `{ value: 'Ghana', label: 'Ghana' },` |
| `src/components/_archived/admin_legacy/LeaderboardsByRegion.tsx` | 76 | `{ value: 'Kenya', label: 'Kenya' },` |
| `src/components/_archived/admin_legacy/LeaderboardsByRegion.tsx` | 77 | `{ value: 'South Africa', label: 'South Africa' },` |
| `src/components/_archived/admin_legacy/LeaderboardsByRegion.tsx` | 78 | `{ value: 'United States', label: 'United States' },` |
| `src/components/_archived/admin_legacy/LeaderboardsByRegion.tsx` | 79 | `{ value: 'United Kingdom', label: 'United Kingdom' },` |
| `src/components/_archived/admin_legacy/LeaderboardsByRegion.tsx` | 80 | `{ value: 'Canada', label: 'Canada' },` |
| `src/components/_archived/admin_legacy/LeaderboardsByRegion.tsx` | 84 | `{ value: 'all', label: 'All Sectors' },` |
| `src/components/_archived/admin_legacy/LeaderboardsByRegion.tsx` | 85 | `{ value: 'Technology', label: 'Technology' },` |
| `src/components/_archived/admin_legacy/LeaderboardsByRegion.tsx` | 86 | `{ value: 'Finance', label: 'Finance' },` |
| `src/components/_archived/admin_legacy/LeaderboardsByRegion.tsx` | 87 | `{ value: 'Healthcare', label: 'Healthcare' },` |
| `src/components/_archived/admin_legacy/LeaderboardsByRegion.tsx` | 88 | `{ value: 'Education', label: 'Education' },` |
| `src/components/_archived/admin_legacy/LeaderboardsByRegion.tsx` | 89 | `{ value: 'Agriculture', label: 'Agriculture' },` |
| `src/components/_archived/admin_legacy/LeaderboardsByRegion.tsx` | 90 | `{ value: 'Energy', label: 'Energy' },` |
| `src/components/_archived/admin_legacy/LeaderboardsByRegion.tsx` | 94 | `{ value: 'total', label: 'Total Score' },` |
| `src/components/_archived/admin_legacy/LeaderboardsByRegion.tsx` | 95 | `{ value: 'connect', label: 'Connect Score' },` |
| `src/components/_archived/admin_legacy/LeaderboardsByRegion.tsx` | 96 | `{ value: 'collaborate', label: 'Collaborate Score' },` |
| `src/components/_archived/admin_legacy/LeaderboardsByRegion.tsx` | 97 | `{ value: 'contribute', label: 'Contribute Score' },` |
| `src/components/_archived/admin_legacy/LeaderboardsByRegion.tsx` | 114 | `<SelectItem key={type.value} value={type.value}>` |
| `src/components/_archived/admin_legacy/LeaderboardsByRegion.tsx` | 127 | `<SelectItem key={region.value} value={region.value}>` |
| `src/components/_archived/admin_legacy/LeaderboardsByRegion.tsx` | 140 | `<SelectItem key={sector.value} value={sector.value}>` |
| `src/components/_archived/admin_legacy/LeaderboardsByRegion.tsx` | 222 | `<p className="text-2xl font-bold text-dna-forest">{leaderboardData.length}</p>` |
| `src/components/_archived/admin_legacy/LeaderboardsByRegion.tsx` | 230 | `{leaderboardData.length > 0 ? leaderboardData[0]?.score.toLocaleString() : '0'}` |
| `src/components/_archived/admin_legacy/analytics/ReferralFunnel.tsx` | 66 | `const referrerCounts: { [key: string]: { count: number; name: string } } = {};` |
| `src/components/_archived/admin_legacy/analytics/ReferralFunnel.tsx` | 72 | `referrerCounts[id] = { count: 0, name: profile.full_name \|\| 'Unknown' };` |
| `src/components/_archived/admin_legacy/analytics/ReferralFunnel.tsx` | 74 | `referrerCounts[id].count++;` |
| `src/components/_archived/admin_legacy/analytics/ReferralFunnel.tsx` | 79 | `.sort(([,a], [,b]) => b.count - a.count)[0];` |
| `src/components/_archived/admin_legacy/analytics/ReferralFunnel.tsx` | 87 | `top_referrer_count: topReferrerEntry ? topReferrerEntry[1].count : 0,` |
| `src/components/_archived/admin_legacy/analytics/ReferralFunnel.tsx` | 118 | `.sort(([,a], [,b]) => b.count - a.count)` |
| `src/components/_archived/admin_legacy/analytics/ReferralFunnel.tsx` | 124 | `? (data.count / referrerInvitesSent) * 100` |
| `src/components/_archived/admin_legacy/analytics/ReferralFunnel.tsx` | 129 | `referral_count: data.count,` |
| `src/components/_archived/admin_legacy/analytics/ReferralFunnel.tsx` | 216 | `<Tooltip formatter={(value: any) => [value, 'Count']} />` |
| `src/components/_archived/admin_legacy/analytics/ReferralFunnel.tsx` | 276 | `{stage.value}` |
| `src/components/_archived/admin_legacy/analytics/SignalFunnelAnalytics.tsx` | 20 | `count: number;` |
| `src/components/_archived/admin_legacy/analytics/SignalFunnelAnalytics.tsx` | 112 | `const count = signalList.length;` |
| `src/components/_archived/admin_legacy/analytics/SignalFunnelAnalytics.tsx` | 113 | `const sent = count;` |
| `src/components/_archived/admin_legacy/analytics/SignalFunnelAnalytics.tsx` | 119 | `count,` |
| `src/components/_archived/admin_legacy/analytics/SignalFunnelAnalytics.tsx` | 212 | `<Tooltip formatter={(value: any) => [value, 'Count']} />` |
| `src/components/_archived/admin_legacy/analytics/SignalFunnelAnalytics.tsx` | 238 | `<Bar dataKey="count" fill="hsl(var(--dna-forest))" name="total signals" />` |
| `src/components/_archived/admin_legacy/analytics/SignalFunnelAnalytics.tsx` | 266 | `<td className="py-2 px-4">{type.count}</td>` |
| `src/components/_archived/admin_legacy/analytics/SignalFunnelAnalytics.tsx` | 303 | `{stage.value}` |
| `src/components/_archived/admin_legacy/analytics/UserGrowthChart.tsx` | 47 | `const dailyData: { [key: string]: { total: number; referral: number } } = {};` |
| `src/components/_archived/admin_legacy/analytics/UserGrowthChart.tsx` | 52 | `dailyData[date] = { total: 0, referral: 0 };` |
| `src/components/_archived/admin_legacy/analytics/UserGrowthChart.tsx` | 164 | `tickFormatter={(value) => new Date(value).toLocaleDateString()}` |
| `src/components/_archived/admin_legacy/analytics/UserGrowthChart.tsx` | 168 | `labelFormatter={(value) => new Date(value).toLocaleDateString()}` |
| `src/components/_archived/admin_legacy/analytics/UserGrowthChart.tsx` | 169 | `formatter={(value: any, name: string) => [value, name.replace('_', ' ')]}` |
| `src/components/_archived/admin_legacy/analytics/UserGrowthChart.tsx` | 200 | `tickFormatter={(value) => new Date(value).toLocaleDateString()}` |
| `src/components/_archived/admin_legacy/analytics/UserGrowthChart.tsx` | 204 | `labelFormatter={(value) => new Date(value).toLocaleDateString()}` |
| `src/components/_archived/admin_legacy/analytics/UserGrowthChart.tsx` | 205 | `formatter={(value: any, name: string) => [value, name.replace('_', ' ')]}` |
| `src/components/_archived/community/CommunityCard.tsx` | 78 | `+{community.tags.length - 3} more` |
| `src/components/_archived/connect/ConnectSearchFilters.tsx` | 93 | `onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}` |
| `src/components/_archived/connect/ConnectSearchFilters.tsx` | 127 | `<Select value={filters.location} onValueChange={(value) => onFiltersChange({ ...filters, location: value })}>` |
| `src/components/_archived/connect/ConnectSearchFilters.tsx` | 148 | `<Select value={filters.profession} onValueChange={(value) => onFiltersChange({ ...filters, profession: value })}>` |
| `src/components/_archived/connect/ConnectStats.tsx` | 44 | `{stats.map((stat, index) => (` |
| `src/components/_archived/connect/ConnectStats.tsx` | 48 | `<div className={`w-10 h-10 ${stat.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>` |
| `src/components/_archived/connect/ConnectStats.tsx` | 49 | `<stat.icon className={`w-5 h-5 ${stat.color}`} />` |
| `src/components/_archived/connect/ConnectStats.tsx` | 52 | `<div className={`text-xl sm:text-2xl font-bold ${stat.color}`}>` |
| `src/components/_archived/connect/ConnectStats.tsx` | 53 | `{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}` |
| `src/components/_archived/connect/ConnectStats.tsx` | 56 | `{stat.label}` |
| `src/components/_archived/connect/DiscoverFilters.tsx` | 87 | `onFilterChange({ ...filters, [key]: updated.length > 0 ? updated : undefined });` |
| `src/components/_archived/connect/DiscoverFilters.tsx` | 125 | `onFilterChange({ ...filters, country_of_origin: value \|\| undefined })` |
| `src/components/_archived/connect/DiscoverFilters.tsx` | 146 | `onFilterChange({ ...filters, current_country: value \|\| undefined })` |
| `src/components/_archived/connect/NetworkingTabs.tsx` | 37 | `onChange={(e) => setSearchTerm(e.target.value)}` |
| `src/components/_archived/connect/tabs/CommunitiesTab.tsx` | 142 | `Showing {communities.length} communities {searchTerm && `matching "${searchTerm}"`}` |
| `src/components/_archived/connect/tabs/EventsTab.tsx` | 101 | `count: '145 Events',` |
| `src/components/_archived/connect/tabs/EventsTab.tsx` | 109 | `count: '89 Events',` |
| `src/components/_archived/connect/tabs/EventsTab.tsx` | 117 | `count: '67 Events',` |
| `src/components/_archived/connect/tabs/EventsTab.tsx` | 125 | `count: '45 Events',` |
| `src/components/_archived/connect/tabs/EventsTab.tsx` | 133 | `count: '78 Events',` |
| `src/components/_archived/connect/tabs/EventsTab.tsx` | 141 | `count: '34 Events',` |
| `src/components/_archived/connect/tabs/EventsTab.tsx` | 149 | `{ city: 'Lagos', count: 23, flag: '🇳🇬', color: 'bg-green-600' },` |
| `src/components/_archived/connect/tabs/EventsTab.tsx` | 150 | `{ city: 'Nairobi', count: 18, flag: '🇰🇪', color: 'bg-red-600' },` |
| `src/components/_archived/connect/tabs/EventsTab.tsx` | 151 | `{ city: 'Cape Town', count: 15, flag: '🇿🇦', color: 'bg-blue-600' },` |
| `src/components/_archived/connect/tabs/EventsTab.tsx` | 152 | `{ city: 'Accra', count: 12, flag: '🇬🇭', color: 'bg-yellow-600' },` |
| `src/components/_archived/connect/tabs/EventsTab.tsx` | 153 | `{ city: 'London', count: 45, flag: '🇬🇧', color: 'bg-blue-800' },` |
| `src/components/_archived/connect/tabs/EventsTab.tsx` | 154 | `{ city: 'New York', count: 38, flag: '🇺🇸', color: 'bg-red-700' }` |
| `src/components/_archived/connect/tabs/EventsTab.tsx` | 178 | `Popular Events ({popularEvents.length})` |
| `src/components/_archived/connect/tabs/EventsTab.tsx` | 280 | `<p className="text-xs text-gray-500 mt-1">{category.count}</p>` |
| `src/components/_archived/connect/tabs/EventsTab.tsx` | 374 | `<p className="text-xs text-gray-500 mt-1">{location.count} Events</p>` |
| `src/components/_archived/connect/tabs/OrganizationsTab.tsx` | 51 | `Showing {organizations.length} organizations {searchTerm && `matching "${searchTerm}"`}` |
| `src/components/_archived/connect/tabs/ProfessionalListItem.tsx` | 230 | `onChange={(e) => setConnectionMessage(e.target.value)}` |
| `src/components/_archived/connect/tabs/ProfessionalsTab.tsx` | 73 | `professionalsCount={transformedProfiles?.length \|\| 0}` |
| `src/components/_archived/convene_legacy/ConveneContextWidgets.tsx` | 60 | `// Count recent events attended` |
| `src/components/_archived/convene_legacy/ConveneContextWidgets.tsx` | 64 | `const { data: recentAttendance, count } = await supabase` |
| `src/components/_archived/convene_legacy/ConveneContextWidgets.tsx` | 66 | `.select('*', { count: 'exact' })` |
| `src/components/_archived/convene_legacy/ConveneContextWidgets.tsx` | 71 | `// Count active connections` |
| `src/components/_archived/convene_legacy/ConveneContextWidgets.tsx` | 72 | `const { count: connectionCount } = await supabase` |
| `src/components/_archived/convene_legacy/ConveneContextWidgets.tsx` | 74 | `.select('*', { count: 'exact' })` |
| `src/components/_archived/convene_legacy/ConveneContextWidgets.tsx` | 79 | `eventsThisMonth: count \|\| 0,` |
| `src/components/_archived/convene_legacy/CreateEventModal.tsx` | 314 | `onChange={(e) => setFormData({ ...formData, title: e.target.value })}` |
| `src/components/_archived/convene_legacy/CreateEventModal.tsx` | 325 | `onChange={(e) => setFormData({ ...formData, description: e.target.value })}` |
| `src/components/_archived/convene_legacy/CreateEventModal.tsx` | 336 | `onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}` |
| `src/components/_archived/convene_legacy/CreateEventModal.tsx` | 361 | `onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}` |
| `src/components/_archived/convene_legacy/CreateEventModal.tsx` | 375 | `onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}` |
| `src/components/_archived/convene_legacy/CreateEventModal.tsx` | 400 | `onChange={(e) => setFormData({ ...formData, location: e.target.value })}` |
| `src/components/_archived/convene_legacy/CreateEventModal.tsx` | 417 | `onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}` |
| `src/components/_archived/convene_legacy/CreateLeadSection.tsx` | 20 | `const { count: eventCount } = await supabase` |
| `src/components/_archived/convene_legacy/CreateLeadSection.tsx` | 22 | `.select('id', { count: 'exact' })` |
| `src/components/_archived/convene_legacy/CreateLeadSection.tsx` | 26 | `const { count: hostingCount } = await supabase` |
| `src/components/_archived/convene_legacy/CreateLeadSection.tsx` | 28 | `.select('id', { count: 'exact' })` |
| `src/components/_archived/convene_legacy/CreateLeadSection.tsx` | 33 | `const { count: groupCount } = await supabase` |
| `src/components/_archived/convene_legacy/CreateLeadSection.tsx` | 35 | `.select('id', { count: 'exact' })` |
| `src/components/_archived/convene_legacy/EventsNearYouSection.tsx` | 35 | `event_attendees(count)` |
| `src/components/_archived/convene_legacy/WelcomeStrip.tsx` | 45 | `.select('id', { count: 'exact' })` |
| `src/components/_archived/convene_legacy/WelcomeStrip.tsx` | 52 | `.select('id', { count: 'exact' })` |
| `src/components/_archived/convene_legacy/WelcomeStrip.tsx` | 57 | `.select('id', { count: 'exact' })` |
| `src/components/_archived/convene_legacy/WelcomeStrip.tsx` | 60 | `const eventsCount = (hostingRes.count \|\| 0) + (attendingRes.count \|\| 0);` |
| `src/components/_archived/convene_legacy/WelcomeStrip.tsx` | 61 | `const groupsCount = groupsRes.count \|\| 0;` |
| `src/components/_archived/dashboard/DashboardAnalyticsColumn.tsx` | 88 | `.select('id', { count: 'exact' })` |
| `src/components/_archived/dashboard/DashboardAnalyticsColumn.tsx` | 100 | `totalConnections: connectionsCount.count \|\| 0,` |
| `src/components/_archived/dashboard/DashboardAnalyticsColumn.tsx` | 207 | `<p className="text-2xl font-bold">{profileViewsData?.length \|\| 0}</p>` |
| `src/components/_archived/dashboard/DashboardAnalyticsColumn.tsx` | 217 | `<p className="text-2xl font-bold">{connectionsData?.length \|\| 0}</p>` |
| `src/components/_archived/dashboard/DashboardAnalyticsColumn.tsx` | 227 | `<p className="text-2xl font-bold">{messagesData?.length \|\| 0}</p>` |
| `src/components/_archived/dashboard/DashboardDiscoverColumn.tsx` | 87 | `onChange={(e) => setSearchQuery(e.target.value)}` |
| `src/components/_archived/dashboard/DashboardDiscoverColumn.tsx` | 105 | `{/* Results Count */}` |
| `src/components/_archived/dashboard/DashboardDiscoverColumn.tsx` | 107 | `{members?.length \|\| 0} members found` |
| `src/components/_archived/dashboard/DashboardEventsColumn.tsx` | 126 | `onChange={(e) => setSearchQuery(e.target.value)}` |
| `src/components/_archived/dashboard/DashboardGroupsColumn.tsx` | 126 | `onChange={(e) => setSearchQuery(e.target.value)}` |
| `src/components/_archived/dashboard/DashboardLeftColumn.tsx` | 25 | `// Fetch real connection count` |
| `src/components/_archived/dashboard/DashboardLeftColumn.tsx` | 27 | `queryKey: ['connection-count', profile?.id],` |
| `src/components/_archived/dashboard/DashboardLeftColumn.tsx` | 30 | `const { count, error } = await supabase` |
| `src/components/_archived/dashboard/DashboardLeftColumn.tsx` | 32 | `.select('id', { count: 'exact' })` |
| `src/components/_archived/dashboard/DashboardLeftColumn.tsx` | 38 | `return count \|\| 0;` |
| `src/components/_archived/dashboard/DashboardLeftColumn.tsx` | 43 | `// Fetch real collaboration space count (as contributions proxy)` |
| `src/components/_archived/dashboard/DashboardLeftColumn.tsx` | 45 | `queryKey: ['collaboration-count', profile?.id],` |
| `src/components/_archived/dashboard/DashboardLeftColumn.tsx` | 48 | `const { count, error } = await supabase` |
| `src/components/_archived/dashboard/DashboardLeftColumn.tsx` | 50 | `.select('id', { count: 'exact' })` |
| `src/components/_archived/dashboard/DashboardLeftColumn.tsx` | 56 | `return count \|\| 0;` |
| `src/components/_archived/dashboard/DashboardMessagesColumn.tsx` | 219 | `onChange={(e) => setSearchQuery(e.target.value)}` |
| `src/components/_archived/dashboard/DashboardNetworkColumn.tsx` | 110 | `{connections?.length ? ` (${connections.length})` : ''}` |
| `src/components/_archived/dashboard/DashboardNetworkColumn.tsx` | 115 | `{pendingRequests?.length ? ` (${pendingRequests.length})` : ''}` |
| `src/components/_archived/dashboard/DashboardNotificationsColumn.tsx` | 104 | `<span className="ml-2 text-xs">({notifications.length})</span>` |
| `src/components/_archived/dashboard/DashboardNotificationsColumn.tsx` | 110 | `<span className="ml-2 text-xs">({unreadNotifications.length})</span>` |
| `src/components/_archived/dashboard/RevenueStreams.tsx` | 55 | `<Cell key={`cell-${index}`} fill={DNA_COLORS[index % DNA_COLORS.length]} />` |
| `src/components/_archived/dashboard/RevenueStreams.tsx` | 60 | `formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name]}` |
| `src/components/_archived/dashboard/TargetMetrics.tsx` | 29 | `dataKey="metric"` |
| `src/components/_archived/dashboard/TargetMetrics.tsx` | 50 | `{platformData.target_metrics.map((metric, index) => {` |
| `src/components/_archived/dashboard/TargetMetrics.tsx` | 51 | `const progress = (metric.current / metric.target) * 100;` |
| `src/components/_archived/dashboard/TargetMetrics.tsx` | 52 | `const isPercentageMetric = metric.metric.includes('%');` |
| `src/components/_archived/dashboard/TargetMetrics.tsx` | 57 | `<span className="font-medium text-dna-forest">{metric.metric}</span>` |
| `src/components/_archived/dashboard/TargetMetrics.tsx` | 58 | `<span className="text-sm text-gray-600">{metric.timeframe}</span>` |
| `src/components/_archived/dashboard/TargetMetrics.tsx` | 63 | `Current: {metric.current.toLocaleString()}{isPercentageMetric ? '%' : ''}` |
| `src/components/_archived/dashboard/TargetMetrics.tsx` | 66 | `Target: {metric.target.toLocaleString()}{isPercentageMetric ? '%' : ''}` |
| `src/components/_archived/dashboard/UserJourney.tsx` | 8 | `count: {` |
| `src/components/_archived/dashboard/UserJourney.tsx` | 9 | `label: "Action Count",` |
| `src/components/_archived/dashboard/UserJourney.tsx` | 31 | `<Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />` |
| `src/components/_archived/discover/MatchScoreBadge.tsx` | 135 | `const allReasons: { icon: typeof Target; label: string; value?: string }[] = [];` |
| `src/components/_archived/events_legacy/CreateEventForm.tsx` | 184 | `{field.value?.length \|\| 0}/200 characters` |
| `src/components/_archived/events_legacy/CreateEventForm.tsx` | 205 | `{field.value?.length \|\| 0} characters (minimum 50)` |
| `src/components/_archived/events_legacy/CreateEventForm.tsx` | 218 | `<Select onValueChange={field.onChange} defaultValue={field.value}>` |
| `src/components/_archived/events_legacy/CreateEventForm.tsx` | 309 | `<Select onValueChange={field.onChange} defaultValue={field.value}>` |
| `src/components/_archived/events_legacy/CreateEventForm.tsx` | 515 | `onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : NaN)}` |
| `src/components/_archived/events_legacy/CreateEventForm.tsx` | 537 | `<Switch checked={field.value} onCheckedChange={field.onChange} />` |
| `src/components/_archived/events_legacy/CreateEventForm.tsx` | 555 | `<Switch checked={field.value} onCheckedChange={field.onChange} />` |
| `src/components/_archived/events_legacy/CreateEventForm.tsx` | 573 | `<Switch checked={field.value} onCheckedChange={field.onChange} />` |
| `src/components/_archived/events_legacy/EventSocialProof.tsx` | 32 | `if (connectionIds.length === 0) return { friendsAttending: [], count: 0 };` |
| `src/components/_archived/events_legacy/EventSocialProof.tsx` | 42 | `if (!attendees \|\| attendees.length === 0) return { friendsAttending: [], count: 0 };` |
| `src/components/_archived/events_legacy/EventSocialProof.tsx` | 52 | `count: profiles?.length \|\| 0` |
| `src/components/_archived/events_legacy/EventSocialProof.tsx` | 58 | `if (!socialProof \|\| socialProof.count === 0) return null;` |
| `src/components/_archived/events_legacy/EventSocialProof.tsx` | 64 | `{socialProof.count} friend{socialProof.count !== 1 ? 's' : ''} attending` |
| `src/components/_archived/events_legacy/EventSocialProof.tsx` | 81 | `{socialProof.count > 1 && ` and ${socialProof.count - 1} other${socialProof.count > 2 ? 's' : ''}`}` |
| `src/components/_archived/events_legacy/EventSocialProof.tsx` | 82 | `{' '}you know {socialProof.count === 1 ? 'is' : 'are'} attending` |
| `src/components/_archived/events_legacy/manage/BlastsTab.tsx` | 112 | `{ value: 'all', label: 'All Registrants' },` |
| `src/components/_archived/events_legacy/manage/BlastsTab.tsx` | 113 | `{ value: 'confirmed', label: 'Confirmed (Going)' },` |
| `src/components/_archived/events_legacy/manage/BlastsTab.tsx` | 114 | `{ value: 'pending', label: 'Pending Approval' },` |
| `src/components/_archived/events_legacy/manage/BlastsTab.tsx` | 115 | `{ value: 'waitlist', label: 'Waitlist Only' },` |
| `src/components/_archived/events_legacy/manage/BlastsTab.tsx` | 169 | `onChange={(e) => setSubject(e.target.value)}` |
| `src/components/_archived/events_legacy/manage/BlastsTab.tsx` | 181 | `key={option.value}` |
| `src/components/_archived/events_legacy/manage/BlastsTab.tsx` | 209 | `onChange={(e) => setBody(e.target.value)}` |
| `src/components/_archived/events_legacy/manage/BlastsTab.tsx` | 280 | `onChange={(e) => setScheduledFor(e.target.value)}` |
| `src/components/_archived/events_legacy/manage/GuestsTab.tsx` | 201 | `<p className="text-2xl font-bold text-primary">{guests.length}</p>` |
| `src/components/_archived/events_legacy/manage/GuestsTab.tsx` | 210 | `{guests.filter(g => g.status === 'going').length}` |
| `src/components/_archived/events_legacy/manage/GuestsTab.tsx` | 220 | `{guests.filter(g => g.status === 'pending').length}` |
| `src/components/_archived/events_legacy/manage/GuestsTab.tsx` | 230 | `{guests.filter(g => g.status === 'waitlist').length}` |
| `src/components/_archived/events_legacy/manage/GuestsTab.tsx` | 263 | `onChange={(e) => setSearchTerm(e.target.value)}` |
| `src/components/_archived/events_legacy/manage/GuestsTab.tsx` | 305 | `checked={selectedGuests.size === filteredGuests.length && filteredGuests.length > 0}` |
| `src/components/_archived/events_legacy/manage/InsightsTab.tsx` | 72 | `<div className="text-3xl font-bold">{regs.length}</div>` |
| `src/components/_archived/events_legacy/manage/RegistrationQuestionsTab.tsx` | 102 | `<Input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. What brings you to this event?" />` |
| `src/components/_archived/messaging_legacy/AdvancedMessageComposer.tsx` | 163 | `value={value}` |
| `src/components/_archived/messaging_legacy/AdvancedMessageComposer.tsx` | 164 | `onChange={(e) => onChange(e.target.value)}` |
| `src/components/_archived/messaging_legacy/AdvancedMessageComposer.tsx` | 172 | `{/* Character Count */}` |
| `src/components/_archived/messaging_legacy/AdvancedMessageComposer.tsx` | 174 | `{value.length}/1000` |
| `src/components/_archived/messaging_legacy/MessageThreadPanel.tsx` | 137 | `onChange={(e) => onMessageInputChange(e.target.value)}` |
| `src/components/_archived/messaging_legacy/ReportMessageDialog.tsx` | 28 | `const reportReasons: { value: ReportReason; label: string; description: string }[] = [` |
| `src/components/_archived/messaging_legacy/ReportMessageDialog.tsx` | 130 | `onValueChange={(value) => setReason(value as ReportReason)}` |
| `src/components/_archived/messaging_legacy/ReportMessageDialog.tsx` | 134 | `<div key={r.value} className="flex items-start space-x-3">` |
| `src/components/_archived/messaging_legacy/ReportMessageDialog.tsx` | 135 | `<RadioGroupItem value={r.value} id={r.value} className="mt-1" />` |
| `src/components/_archived/messaging_legacy/ReportMessageDialog.tsx` | 137 | `<Label htmlFor={r.value} className="font-medium cursor-pointer">` |
| `src/components/_archived/messaging_legacy/ReportMessageDialog.tsx` | 152 | `onChange={(e) => setDescription(e.target.value)}` |
| `src/components/_archived/messaging_legacy/inbox/InboxHeader.tsx` | 53 | `onChange={(e) => onSearchChange(e.target.value)}` |
| `src/components/_archived/misc/CollaborationsQuickStats.tsx` | 41 | `{statItems.map((stat, index) => (` |
| `src/components/_archived/misc/CollaborationsQuickStats.tsx` | 46 | `{stat.icon}` |
| `src/components/_archived/misc/CollaborationsQuickStats.tsx` | 50 | `<p className="text-2xl font-bold text-gray-900">{stat.value}</p>` |
| `src/components/_archived/misc/CollaborationsQuickStats.tsx` | 51 | `<p className="text-sm font-medium text-gray-700 mt-1">{stat.label}</p>` |
| `src/components/_archived/misc/CollaborationsQuickStats.tsx` | 52 | `<p className="text-xs text-gray-500 mt-1">{stat.description}</p>` |
| `src/components/_archived/misc/ConnectionActionsMenu.tsx` | 182 | `onChange={(e) => setBlockReason(e.target.value)}` |
| `src/components/_archived/misc/CreateCommunityDialog.tsx` | 113 | `onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}` |
| `src/components/_archived/misc/CreateCommunityDialog.tsx` | 123 | `onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}` |
| `src/components/_archived/misc/CreateCommunityDialog.tsx` | 143 | `onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}` |
| `src/components/_archived/misc/CreateCommunityDialog.tsx` | 154 | `onChange={(e) => setFormData(prev => ({ ...prev, purpose_goals: e.target.value }))}` |
| `src/components/_archived/misc/CreateCommunityDialog.tsx` | 165 | `onChange={(e) => setTagInput(e.target.value)}` |
| `src/components/_archived/misc/CreateCommunityDialog.tsx` | 194 | `onChange={(e) => setFormData(prev => ({ ...prev, cover_image_url: e.target.value }))}` |
| `src/components/_archived/misc/DiscoveryFilters.tsx` | 140 | `onChange={(e) => onFilterChange({ ...filters, countryOfOrigin: e.target.value })}` |
| `src/components/_archived/misc/DiscoveryFilters.tsx` | 151 | `onChange={(e) => onFilterChange({ ...filters, locationCountry: e.target.value })}` |
| `src/components/_archived/misc/FeedResearchForm.tsx` | 171 | `onValueChange={(value) => setFormData(prev => ({ ...prev, valueRating: value }))}` |
| `src/components/_archived/misc/FeedResearchForm.tsx` | 213 | `onValueChange={(value) => setFormData(prev => ({ ...prev, postFrequency: value }))}` |
| `src/components/_archived/misc/FeedResearchForm.tsx` | 231 | `onValueChange={(value) => setFormData(prev => ({ ...prev, checkFrequency: value }))}` |
| `src/components/_archived/misc/FeedResearchForm.tsx` | 265 | `onChange={(e) => setFormData(prev => ({ ...prev, contentToShareOther: e.target.value }))}` |
| `src/components/_archived/misc/FeedResearchForm.tsx` | 291 | `onChange={(e) => setFormData(prev => ({ ...prev, contentToSeeOther: e.target.value }))}` |
| `src/components/_archived/misc/FeedResearchForm.tsx` | 348 | `onChange={(e) => setFormData(prev => ({ ...prev, concernsOther: e.target.value }))}` |
| `src/components/_archived/misc/FeedResearchForm.tsx` | 361 | `onChange={(e) => setFormData(prev => ({ ...prev, differentiationIdea: e.target.value }))}` |
| `src/components/_archived/misc/FeedResearchForm.tsx` | 367 | `<p className="text-sm text-gray-500 mt-1">{formData.differentiationIdea.length}/500</p>` |
| `src/components/_archived/misc/FeedResearchForm.tsx` | 376 | `onChange={(e) => setFormData(prev => ({ ...prev, dreamFeature: e.target.value }))}` |
| `src/components/_archived/misc/FeedResearchForm.tsx` | 382 | `<p className="text-sm text-gray-500 mt-1">{formData.dreamFeature.length}/300</p>` |
| `src/components/_archived/misc/FeedResearchForm.tsx` | 391 | `onChange={(e) => setFormData(prev => ({ ...prev, useCase: e.target.value }))}` |
| `src/components/_archived/misc/FeedResearchForm.tsx` | 397 | `<p className="text-sm text-gray-500 mt-1">{formData.useCase.length}/200</p>` |
| `src/components/_archived/misc/FeedResearchForm.tsx` | 418 | `onChange={(e) => setFormData(prev => ({ ...prev, earlyAccessEmail: e.target.value }))}` |
| `src/components/_archived/misc/MyContributionsWidget.tsx` | 20 | `const { count: paymentsCount } = await supabase` |
| `src/components/_archived/misc/MyContributionsWidget.tsx` | 22 | `.select('id', { count: 'exact' })` |
| `src/components/_archived/misc/MyContributionsWidget.tsx` | 25 | `const { count: spacesCount } = await supabase` |
| `src/components/_archived/misc/MyContributionsWidget.tsx` | 27 | `.select('id', { count: 'exact' })` |
| `src/components/_archived/misc/MyContributionsWidget.tsx` | 31 | `const { count: eventsCount } = await supabase` |
| `src/components/_archived/misc/MyContributionsWidget.tsx` | 33 | `.select('id', { count: 'exact' })` |
| `src/components/_archived/misc/MyContributionsWidget.tsx` | 111 | `<p className="text-2xl font-bold">{stats.totalPayments}</p>` |
| `src/components/_archived/misc/MyContributionsWidget.tsx` | 126 | `<p className="text-2xl font-bold">{stats.activeSpaces}</p>` |
| `src/components/_archived/misc/MyContributionsWidget.tsx` | 141 | `<p className="text-2xl font-bold">{stats.eventsAttended}</p>` |
| `src/components/_archived/misc/PasswordResetForm.tsx` | 116 | `onChange={(e) => setEmail(e.target.value)}` |
| `src/components/_archived/misc/PostAnalyticsPanel.tsx` | 21 | `top_viewer_industries: Array<{ industry: string; count: number }>;` |
| `src/components/_archived/misc/PostAnalyticsPanel.tsx` | 22 | `top_viewer_regions: Array<{ region: string; count: number }>;` |
| `src/components/_archived/misc/PostAnalyticsPanel.tsx` | 122 | `{Object.entries(analytics.reaction_breakdown).slice(0, 5).map(([emoji, count]) => (` |
| `src/components/_archived/misc/PostAnalyticsPanel.tsx` | 123 | `<span key={emoji} className="text-sm" title={`${emoji} ${count}`}>` |
| `src/components/_archived/misc/PostAnalyticsPanel.tsx` | 195 | `{item.industry} ({item.count})` |
| `src/components/_archived/misc/PostAnalyticsPanel.tsx` | 211 | `{item.region} ({item.count})` |
| `src/components/_archived/misc/ProfessionalNetworkWidget.tsx` | 129 | `<div className="text-2xl font-bold text-dna-copper">{connectionStats.total}</div>` |
| `src/components/_archived/misc/SearchBar.tsx` | 36 | `onChange={(e) => setSearchTerm(e.target.value)}` |
| `src/components/_archived/misc/SimpleEmailForm.tsx` | 108 | `const { name, value } = e.target;` |
| `src/components/_archived/misc/SimpleEmailForm.tsx` | 109 | `setFormData(prev => ({ ...prev, [name]: value }));` |
| `src/components/_archived/mobile/MobileMessagingView.tsx` | 210 | `onChange={(e) => setMessageText(e.target.value)}` |
| `src/components/_archived/navigation/DNAPillarNavigation.tsx` | 116 | `return stats.feed.postsCount > 0 ? `${stats.feed.postsCount} posts` : 'No posts yet';` |
| `src/components/_archived/navigation/DNAPillarNavigation.tsx` | 119 | `? `${stats.connect.connectionsCount} connections • ${stats.connect.pendingRequests} pending`` |
| `src/components/_archived/navigation/DNAPillarNavigation.tsx` | 120 | `: `${stats.connect.connectionsCount} connections`;` |
| `src/components/_archived/navigation/DNAPillarNavigation.tsx` | 122 | `return `${stats.collaborate.activeProjects} projects • ${stats.collaborate.upcomingEvents} events`;` |
| `src/components/_archived/navigation/DNAPillarNavigation.tsx` | 124 | `return `${stats.contribute.opportunitiesCount} opportunities • ${stats.contribute.myContributions} applied`;` |
| `src/components/_archived/onboarding/MinimalProfileStep.tsx` | 117 | `onChange={(e) => updateData({ first_name: e.target.value })}` |
| `src/components/_archived/onboarding/MinimalProfileStep.tsx` | 126 | `onChange={(e) => updateData({ last_name: e.target.value })}` |
| `src/components/_archived/onboarding/MinimalProfileStep.tsx` | 137 | `onChange={(value) => updateData({ current_country: value })}` |
| `src/components/_archived/onboarding/OnboardingBar.tsx` | 111 | `<Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" aria-label="First name" className="w-full" />` |
| `src/components/_archived/onboarding/OnboardingBar.tsx` | 112 | `<Input value={middleInitial} onChange={(e) => setMiddleInitial(e.target.value.slice(0,1).toUpperCase())} placeholder="M" aria-label="Middle initial" className="` |
| `src/components/_archived/onboarding/OnboardingBar.tsx` | 113 | `<Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" aria-label="Last name" className="w-full" />` |
| `src/components/_archived/onboarding/WelcomeWizard.tsx` | 188 | `{intent.modules.length} modules` |
| `src/components/_archived/onboarding/steps/GoalsBioStep.tsx` | 27 | `onChange={(e) => updateData({ linkedin_url: e.target.value })}` |
| `src/components/_archived/onboarding/steps/GoalsBioStep.tsx` | 40 | `onChange={(e) => updateData({ twitter_url: e.target.value })}` |
| `src/components/_archived/onboarding/steps/GoalsBioStep.tsx` | 53 | `onChange={(e) => updateData({ website_url: e.target.value })}` |
| `src/components/_archived/onboarding/steps/IntentStep.tsx` | 149 | `Selected to give: {whatToGive.length} • Selected to receive: {whatToReceive.length}` |
| `src/components/_archived/onboarding/steps/PersonalizedStep.tsx` | 39 | `updateData({ [field]: value });` |
| `src/components/_archived/onboarding/steps/PersonalizedStep.tsx` | 125 | `onChange={(e) => handleInputChange('venture_name', e.target.value)}` |
| `src/components/_archived/onboarding/steps/PillarsStep.tsx` | 108 | `Selected: {selectedPillars.length} pillar{selectedPillars.length > 1 ? 's' : ''}` |
| `src/components/_archived/onboarding/steps/RecommendationsStep.tsx` | 249 | `{selectedItems.length} selection{selectedItems.length > 1 ? 's' : ''} saved` |
| `src/components/_archived/profile/CommunityIntroduction.tsx` | 210 | `<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>` |
| `src/components/_archived/profile/CommunityIntroduction.tsx` | 234 | `onChange={(e) => setIntroText(e.target.value)}` |
| `src/components/_archived/profile/CommunityIntroduction.tsx` | 239 | `{introText.length}/500 characters` |
| `src/components/_archived/profile/CompleteFieldsModal.tsx` | 70 | `<Input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="What do you do?" />` |
| `src/components/_archived/profile/CompleteFieldsModal.tsx` | 76 | `<Input id="current_city" value={currentCity} onChange={(e) => setCurrentCity(e.target.value)} placeholder="City" />` |
| `src/components/_archived/profile/CompleteFieldsModal.tsx` | 92 | `<Input id="avatar_url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />` |
| `src/components/_archived/profile/CompleteFieldsModal.tsx` | 98 | `<Input id="website_url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://your-site.com" />` |
| `src/components/_archived/profile/CompleteFieldsModal.tsx` | 104 | `<Input id="skills" value={skillsText} onChange={(e) => setSkillsText(e.target.value)} placeholder="e.g. Product, Fundraising, Policy" />` |
| `src/components/_archived/profile/CompleteFieldsModal.tsx` | 110 | `<Input id="interests" value={interestsText} onChange={(e) => setInterestsText(e.target.value)} placeholder="e.g. Climate, Fintech, Education" />` |
| `src/components/_archived/profile/CompleteFieldsModal.tsx` | 116 | `<Input id="organization" value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Your company or org" />` |
| `src/components/_archived/profile/DNAQuickStatsCard.tsx` | 45 | `{stats.map((stat, index) => {` |
| `src/components/_archived/profile/DNAQuickStatsCard.tsx` | 46 | `const IconComponent = stat.icon;` |
| `src/components/_archived/profile/DNAQuickStatsCard.tsx` | 50 | `<div className="text-2xl font-bold text-dna-forest">{stat.value}</div>` |
| `src/components/_archived/profile/DNAQuickStatsCard.tsx` | 51 | `<div className="text-xs text-gray-600">{stat.description}</div>` |
| `src/components/_archived/profile/ProfileOverview.tsx` | 129 | `+{skillsList.length - 5} more` |
| `src/components/_archived/profile/ProfileOverview.tsx` | 146 | `+{interestsList.length - 4} more` |
| `src/components/_archived/profile/SocialProofBadge.tsx` | 7 | `count: number;` |
| `src/components/_archived/profile/SocialProofBadge.tsx` | 13 | `count,` |
| `src/components/_archived/profile/SocialProofBadge.tsx` | 16 | `if (count === 0) return null;` |
| `src/components/_archived/profile/SocialProofBadge.tsx` | 21 | `label: count === 1 ? 'mutual connection' : 'mutual connections',` |
| `src/components/_archived/profile/SocialProofBadge.tsx` | 26 | `label: count === 1 ? 'person you know attending' : 'people you know attending',` |
| `src/components/_archived/profile/SocialProofBadge.tsx` | 31 | `label: count === 1 ? 'view this month' : 'views this month',` |
| `src/components/_archived/profile/SocialProofBadge.tsx` | 42 | `<span className="font-medium">{count}</span> {label}` |
| `src/components/_archived/profile/UsernameInput.tsx` | 68 | `value={value}` |
| `src/components/_archived/profile/form/AdditionalInfoSection.tsx` | 31 | `onChange={(e) => onInputChange('innovation_pathways', e.target.value)}` |
| `src/components/_archived/profile/form/AdditionalInfoSection.tsx` | 42 | `onChange={(e) => onInputChange('achievements', e.target.value)}` |
| `src/components/_archived/profile/form/AdditionalInfoSection.tsx` | 53 | `onChange={(e) => onInputChange('certifications', e.target.value)}` |
| `src/components/_archived/profile/form/BasicInfoFields.tsx` | 47 | `onChange={(e) => onFieldChange('full_name', e.target.value)}` |
| `src/components/_archived/profile/form/BasicInfoFields.tsx` | 63 | `onChange={(e) => onFieldChange('profession', e.target.value)}` |
| `src/components/_archived/profile/form/BasicInfoFields.tsx` | 77 | `onChange={(e) => onFieldChange('company', e.target.value)}` |
| `src/components/_archived/profile/form/BasicInfoFields.tsx` | 134 | `onChange={(e) => onFieldChange('bio', e.target.value)}` |
| `src/components/_archived/profile/form/CommunityImpactSection.tsx` | 33 | `onChange={(e) => onInputChange('community_involvement', e.target.value)}` |
| `src/components/_archived/profile/form/CommunityImpactSection.tsx` | 44 | `onChange={(e) => onInputChange('giving_back_initiatives', e.target.value)}` |
| `src/components/_archived/profile/form/CommunityImpactSection.tsx` | 55 | `onChange={(e) => onInputChange('home_country_projects', e.target.value)}` |
| `src/components/_archived/profile/form/CommunityImpactSection.tsx` | 66 | `onChange={(e) => onInputChange('volunteer_experience', e.target.value)}` |
| `src/components/_archived/profile/form/ContactFields.tsx` | 28 | `onChange={(e) => onFieldChange('linkedin_url', e.target.value)}` |
| `src/components/_archived/profile/form/ContactLinksSection.tsx` | 30 | `onChange={(e) => onInputChange('linkedin_url', e.target.value)}` |
| `src/components/_archived/profile/form/ContactLinksSection.tsx` | 39 | `onChange={(e) => onInputChange('website_url', e.target.value)}` |
| `src/components/_archived/profile/form/CulturalBackgroundSection.tsx` | 45 | `onChange={(e) => onInputChange('country_of_origin', e.target.value)}` |
| `src/components/_archived/profile/form/CulturalBackgroundSection.tsx` | 54 | `onChange={(e) => onInputChange('current_country', e.target.value)}` |
| `src/components/_archived/profile/form/CulturalBackgroundSection.tsx` | 67 | `onChange={(e) => onInputChange('years_in_diaspora', e.target.value)}` |
| `src/components/_archived/profile/form/CulturalBackgroundSection.tsx` | 76 | `onChange={(e) => onInputChange('languages', e.target.value)}` |
| `src/components/_archived/profile/form/EducationSection.tsx` | 76 | `edu.id === id ? { ...edu, [field]: value } : edu` |
| `src/components/_archived/profile/form/EducationSection.tsx` | 147 | `onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}` |
| `src/components/_archived/profile/form/EducationSection.tsx` | 158 | `onValueChange={(value) => updateEducation(edu.id, 'degree', value)}` |
| `src/components/_archived/profile/form/EducationSection.tsx` | 181 | `onChange={(e) => updateEducation(edu.id, 'field_of_study', e.target.value)}` |
| `src/components/_archived/profile/form/EducationSection.tsx` | 193 | `onValueChange={(value) => updateEducation(edu.id, 'start_year', value)}` |
| `src/components/_archived/profile/form/EducationSection.tsx` | 214 | `onValueChange={(value) => updateEducation(edu.id, 'end_year', value)}` |
| `src/components/_archived/profile/form/EducationSection.tsx` | 238 | `onChange={(e) => updateEducation(edu.id, 'description', e.target.value)}` |
| `src/components/_archived/profile/form/ProfessionalInfoSection.tsx` | 86 | `onChange={(e) => onInputChange('professional_role', e.target.value)}` |
| `src/components/_archived/profile/form/ProfessionalInfoSection.tsx` | 100 | `onChange={(e) => onInputChange('organization', e.target.value)}` |
| `src/components/_archived/profile/form/ProfessionalInfoSection.tsx` | 116 | `onChange={(e) => onInputChange('industry', e.target.value)}` |
| `src/components/_archived/profile/form/ProfessionalInfoSection.tsx` | 130 | `onChange={(e) => onInputChange('years_experience', parseInt(e.target.value) \|\| 0)}` |
| `src/components/_archived/profile/form/ProfessionalInfoSection.tsx` | 144 | `onChange={(e) => onInputChange('education', e.target.value)}` |
| `src/components/_archived/profile/form/ProfessionalInfoSection.tsx` | 157 | `onChange={(e) => onInputChange('certifications', e.target.value)}` |
| `src/components/_archived/profile/form/ProfessionalInfoSection.tsx` | 186 | `onChange={(e) => setNewSkillOffered(e.target.value)}` |
| `src/components/_archived/profile/form/ProfessionalInfoSection.tsx` | 224 | `onChange={(e) => setNewSkillNeeded(e.target.value)}` |
| `src/components/_archived/profile/form/ProfessionalInfoSection.tsx` | 271 | `onChange={(e) => onInputChange('achievements', e.target.value)}` |
| `src/components/_archived/profile/form/ProfileFormSections.tsx` | 53 | `onChange={(e) => updateHelperField(helperFieldName, e.target.value)}` |
| `src/components/_archived/profile/form/ProfileFormSections.tsx` | 95 | `onChange={(e) => updateFormField('full_name', e.target.value)}` |
| `src/components/_archived/profile/form/ProfileFormSections.tsx` | 104 | `onChange={(e) => updateFormField('headline', e.target.value)}` |
| `src/components/_archived/profile/form/ProfileFormSections.tsx` | 115 | `onChange={(e) => updateFormField('bio', e.target.value)}` |
| `src/components/_archived/profile/form/ProfileFormSections.tsx` | 127 | `onChange={(e) => updateFormField('location', e.target.value)}` |
| `src/components/_archived/profile/form/ProfileFormSections.tsx` | 136 | `onChange={(e) => updateFormField('country_of_origin', e.target.value)}` |
| `src/components/_archived/profile/form/ProfileFormSections.tsx` | 152 | `onChange={(e) => updateFormField('profession', e.target.value)}` |
| `src/components/_archived/profile/form/ProfileFormSections.tsx` | 161 | `onChange={(e) => updateFormField('industry', e.target.value)}` |
| `src/components/_archived/profile/form/ProfileFormSections.tsx` | 174 | `onChange={(e) => updateFormField('years_experience', parseInt(e.target.value) \|\| 0)}` |
| `src/components/_archived/profile/form/ProfileFormSections.tsx` | 181 | `onValueChange={(value) => updateFormField('education_level', value)}` |
| `src/components/_archived/profile/form/ProfileFormSections.tsx` | 234 | `onChange={(e) => updateFormField('linkedin_url', e.target.value)}` |
| `src/components/_archived/profile/form/ProfileFormSections.tsx` | 243 | `onChange={(e) => updateFormField('twitter_url', e.target.value)}` |
| `src/components/_archived/profile/form/ProfileFormSections.tsx` | 253 | `onChange={(e) => updateFormField('website_url', e.target.value)}` |
| `src/components/_archived/profile/tabs/ActivityTabContent.tsx` | 25 | `Recent Posts ({userPosts.length})` |
| `src/components/_archived/profile/tabs/ActivityTabContent.tsx` | 51 | `Communities ({userCommunities.length})` |
| `src/components/_archived/profile/tabs/ActivityTabContent.tsx` | 74 | `Events ({userEvents.length})` |
| `src/components/_archived/saved/SavedItemFilters.tsx` | 39 | `{ value: 'all', label: 'All Time' },` |
| `src/components/_archived/saved/SavedItemFilters.tsx` | 40 | `{ value: 'week', label: 'Past Week' },` |
| `src/components/_archived/saved/SavedItemFilters.tsx` | 41 | `{ value: 'month', label: 'Past Month' },` |
| `src/components/_archived/saved/SavedItemFilters.tsx` | 42 | `{ value: 'quarter', label: 'Past 3 Months' },` |
| `src/components/_archived/saved/SavedItemFilters.tsx` | 43 | `{ value: 'year', label: 'Past Year' }` |
| `src/components/_archived/saved/SavedItemFilters.tsx` | 47 | `{ value: 'date_saved', label: 'Date Saved' },` |
| `src/components/_archived/saved/SavedItemFilters.tsx` | 48 | `{ value: 'date_created', label: 'Date Created' },` |
| `src/components/_archived/saved/SavedItemFilters.tsx` | 49 | `{ value: 'title', label: 'Alphabetical' },` |
| `src/components/_archived/saved/SavedItemFilters.tsx` | 50 | `{ value: 'type', label: 'Content Type' }` |
| `src/components/_archived/saved/SavedItemFilters.tsx` | 74 | `onChange={(e) => onSearchChange(e.target.value)}` |
| `src/components/_archived/saved/SavedItemFilters.tsx` | 107 | `<SelectItem key={option.value} value={option.value}>` |
| `src/components/_archived/saved/SavedItemFilters.tsx` | 123 | `<SelectItem key={option.value} value={option.value}>` |
| `src/components/_archived/search/SearchAutocomplete.tsx` | 26 | `count?: number;` |
| `src/components/_archived/search/SearchAutocomplete.tsx` | 281 | `value={value}` |
| `src/components/_archived/search/SearchAutocomplete.tsx` | 351 | `{suggestion.count && (` |
| `src/components/_archived/search/SearchAutocomplete.tsx` | 353 | `{suggestion.count}` |
| `src/components/_archived/social-feed_legacy/PillarFilter.tsx` | 11 | `{ value: 'feed', label: 'All Posts', description: 'View all posts across pillars' },` |
| `src/components/_archived/social-feed_legacy/PillarFilter.tsx` | 12 | `{ value: 'connect', label: 'Connect', description: 'Networking and community building' },` |
| `src/components/_archived/social-feed_legacy/PillarFilter.tsx` | 13 | `{ value: 'collaborate', label: 'Collaborate', description: 'Partnership and project opportunities' },` |
| `src/components/_archived/social-feed_legacy/PillarFilter.tsx` | 14 | `{ value: 'contribute', label: 'Contribute', description: 'Give back and make impact' },` |
| `src/components/_archived/social-feed_legacy/comments/CommentComposer.tsx` | 76 | `onChange={(e) => setContent(e.target.value)}` |
| `src/components/_archived/social-feed_orphaned/PostComposer.tsx` | 369 | `{isAdmin && <SelectItem value="spotlight">Spotlight</SelectItem>}` |
| `src/components/_archived/social-feed_orphaned/PostComposer.tsx` | 407 | `{isAdmin && <SelectItem value="spotlight">Spotlight</SelectItem>}` |
| `src/components/_archived/social-feed_orphaned/PostComposer.tsx` | 466 | `onChange={(e) => updatePollOption(i, e.target.value)}` |
| `src/components/_archived/social-feed_orphaned/PostComposer.tsx` | 477 | `<Input type="datetime-local" value={pollExpiresAt ?? ''} onChange={(e) => setPollExpiresAt(e.target.value \|\| null)} className="max-w-xs" />` |
| `src/components/_archived/social-feed_orphaned/PostComposer.tsx` | 488 | `<Input value={opportunityType} onChange={(e) => setOpportunityType(e.target.value)} placeholder="e.g., Grant, Job, RFP" />` |
| `src/components/_archived/social-feed_orphaned/PostComposer.tsx` | 492 | `<Input type="url" value={opportunityLink} onChange={(e) => setOpportunityLink(e.target.value)} placeholder="https://..." />` |
| `src/components/_archived/ui_orphaned/CountrySelect.tsx` | 14 | `export default function CountrySelect({ value, onChange }: CountrySelectProps) {` |
| `src/components/_archived/ui_orphaned/stat-card.tsx` | 8 | `* Dashboard stat tile with icon, value, label, and optional trend.` |
| `src/components/_archived/ui_orphaned/stat-card.tsx` | 17 | `*     trend={{ value: 12, direction: "up" }}` |
| `src/components/_archived/ui_orphaned/stat-card.tsx` | 47 | `/** Stat label */` |
| `src/components/_archived/ui_orphaned/stat-card.tsx` | 63 | `{ label, value, icon, module, trend, compact = false, className, ...props },` |
| `src/components/_archived/ui_orphaned/stat-card.tsx` | 90 | `{value}` |
| `src/components/_archived/ui_orphaned/stat-card.tsx` | 125 | `{trend.value}%` |
| `src/components/admin/AdminDashboardLayout.tsx` | 287 | `// Get badge count for specific items` |
| `src/components/admin/ContributionModerationQueue.tsx` | 144 | `<h3 className="text-lg font-semibold">Pending Review ({pendingRequests.length})</h3>` |
| `src/components/admin/ContributionModerationQueue.tsx` | 236 | `onChange={(e) => setReviewNotes(e.target.value)}` |
| `src/components/admin/ContributionModerationQueue.tsx` | 280 | `<h3 className="text-lg font-semibold">Recently Processed ({processedRequests.length})</h3>` |
| `src/components/admin/EngagementDashboard.tsx` | 48 | `{ stage: 'Signup', count: 100, percentage: 100 },` |
| `src/components/admin/EngagementDashboard.tsx` | 49 | `{ stage: 'Onboarding Complete', count: 73, percentage: 73 },` |
| `src/components/admin/EngagementDashboard.tsx` | 50 | `{ stage: '3-Day Return', count: 45, percentage: 61 },` |
| `src/components/admin/EngagementDashboard.tsx` | 51 | `{ stage: '7-Day Active', count: 32, percentage: 44 },` |
| `src/components/admin/EngagementDashboard.tsx` | 52 | `{ stage: 'Engaged User', count: 25, percentage: 34 }` |
| `src/components/admin/EngagementDashboard.tsx` | 78 | `// Get onboarded users count (users who completed onboarding in last 30 days)` |
| `src/components/admin/EngagementDashboard.tsx` | 82 | `const { count: onboardedCount } = await supabase` |
| `src/components/admin/EngagementDashboard.tsx` | 84 | `.select('id', { count: 'exact' })` |
| `src/components/admin/EngagementDashboard.tsx` | 102 | `const { count } = await supabase` |
| `src/components/admin/EngagementDashboard.tsx` | 104 | `.select('id', { count: 'exact' })` |
| `src/components/admin/EngagementDashboard.tsx` | 110 | `if ((count \|\| 0) > 0) returnedAfterReminder++;` |
| `src/components/admin/EngagementDashboard.tsx` | 118 | `const { count: sevenDayActiveCount } = await supabase` |
| `src/components/admin/EngagementDashboard.tsx` | 120 | `.select('id', { count: 'exact' })` |
| `src/components/admin/EngagementDashboard.tsx` | 291 | `<Select value={filters.userType} onValueChange={(value) => setFilters({...filters, userType: value})}>` |
| `src/components/admin/EngagementDashboard.tsx` | 307 | `<Select value={filters.cohort} onValueChange={(value) => setFilters({...filters, cohort: value})}>` |
| `src/components/admin/EngagementDashboard.tsx` | 322 | `<Select value={filters.pillar} onValueChange={(value) => setFilters({...filters, pillar: value})}>` |
| `src/components/admin/EngagementDashboard.tsx` | 337 | `<Select value={filters.dateRange} onValueChange={(value) => setFilters({...filters, dateRange: value})}>` |
| `src/components/admin/EngagementDashboard.tsx` | 365 | `<span className="text-sm text-muted-foreground">{stage.count} users</span>` |
| `src/components/admin/EngagementDashboard.tsx` | 420 | `Showing 20 of {logs.length} logs. Download CSV for complete data.` |
| `src/components/admin/EngagementHeatmap.tsx` | 42 | `{payload[0].value} users active` |
| `src/components/admin/OnboardingFunnel.tsx` | 44 | `{payload[0].payload.count} users ({typeof payload[0].value === 'number' ? payload[0].value.toFixed(1) : '0'}%)` |
| `src/components/admin/OnboardingFunnel.tsx` | 54 | `<Cell key={`cell-${index}`} fill={colors[index % colors.length]} />` |
| `src/components/admin/RetentionMetrics.tsx` | 42 | `Retention: {typeof payload[0].value === 'number' ? payload[0].value.toFixed(1) : '0'}%` |
| `src/components/admin/SignalAnalyticsDashboard.tsx` | 21 | `count: number;` |
| `src/components/admin/SignalAnalyticsDashboard.tsx` | 74 | `count: Math.floor(Math.random() * 50) + 10,` |
| `src/components/admin/SignalAnalyticsDashboard.tsx` | 84 | `const mockDailyData: DailyData[] = Array.from({ length: 7 }, (_, i) => {` |
| `src/components/admin/SignalAnalyticsDashboard.tsx` | 223 | `{type.count} active signals` |
| `src/components/alpha/AlphaFeedbackForm.tsx` | 17 | `const CATEGORIES: Array<{ value: FeedbackCategory; label: string; icon: React.ReactNode }> = [` |
| `src/components/alpha/AlphaFeedbackForm.tsx` | 18 | `{ value: 'bug', label: 'Bug', icon: <Bug className="h-4 w-4" /> },` |
| `src/components/alpha/AlphaFeedbackForm.tsx` | 19 | `{ value: 'feature_idea', label: 'Feature Idea', icon: <Lightbulb className="h-4 w-4" /> },` |
| `src/components/alpha/AlphaFeedbackForm.tsx` | 20 | `{ value: 'confusion', label: 'Confusion', icon: <HelpCircle className="h-4 w-4" /> },` |
| `src/components/alpha/AlphaFeedbackForm.tsx` | 21 | `{ value: 'love', label: 'Love', icon: <Heart className="h-4 w-4" /> },` |
| `src/components/alpha/AlphaFeedbackForm.tsx` | 24 | `const AREAS: Array<{ value: FeedbackArea; label: string }> = [` |
| `src/components/alpha/AlphaFeedbackForm.tsx` | 25 | `{ value: 'feed', label: 'Feed' },` |
| `src/components/alpha/AlphaFeedbackForm.tsx` | 26 | `{ value: 'composer', label: 'Composer' },` |
| `src/components/alpha/AlphaFeedbackForm.tsx` | 27 | `{ value: 'events', label: 'Events' },` |
| `src/components/alpha/AlphaFeedbackForm.tsx` | 28 | `{ value: 'spaces', label: 'Spaces' },` |
| `src/components/alpha/AlphaFeedbackForm.tsx` | 29 | `{ value: 'marketplace', label: 'Marketplace' },` |
| `src/components/alpha/AlphaFeedbackForm.tsx` | 30 | `{ value: 'messages', label: 'Messages' },` |
| `src/components/alpha/AlphaFeedbackForm.tsx` | 31 | `{ value: 'dia', label: 'DIA' },` |
| `src/components/alpha/AlphaFeedbackForm.tsx` | 32 | `{ value: 'navigation', label: 'Navigation' },` |
| `src/components/alpha/AlphaFeedbackForm.tsx` | 33 | `{ value: 'other', label: 'Other' },` |
| `src/components/alpha/AlphaFeedbackForm.tsx` | 190 | `onChange={(e) => setContent(e.target.value)}` |
| `src/components/alpha/AlphaFeedbackForm.tsx` | 202 | `Please write at least 10 characters ({10 - content.trim().length} more needed)` |
| `src/components/analytics/ProfileViewersWidget.tsx` | 20 | `* - View count and last viewed timestamp` |
| `src/components/auth/BetaSignupDialog.tsx` | 43 | `setFormData(prev => ({ ...prev, [field]: value }));` |
| `src/components/auth/BetaSignupDialog.tsx` | 115 | `onChange={(e) => handleInputChange('name', e.target.value)}` |
| `src/components/auth/BetaSignupDialog.tsx` | 126 | `onChange={(e) => handleInputChange('email', e.target.value)}` |
| `src/components/auth/BetaSignupDialog.tsx` | 139 | `onChange={(e) => handleInputChange('company', e.target.value)}` |
| `src/components/auth/BetaSignupDialog.tsx` | 148 | `onChange={(e) => handleInputChange('role', e.target.value)}` |
| `src/components/auth/BetaSignupDialog.tsx` | 156 | `<Select value={formData.experience} onValueChange={(value) => handleInputChange('experience', value)}>` |
| `src/components/auth/BetaSignupDialog.tsx` | 183 | `onChange={(e) => handleInputChange('experienceOther', e.target.value)}` |
| `src/components/auth/BetaSignupDialog.tsx` | 194 | `onChange={(e) => handleInputChange('linkedin_url', e.target.value)}` |
| `src/components/auth/BetaSignupDialog.tsx` | 204 | `onChange={(e) => handleInputChange('motivation', e.target.value)}` |
| `src/components/auth/BetaWaitlist.tsx` | 127 | `onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}` |
| `src/components/auth/BetaWaitlist.tsx` | 142 | `onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}` |
| `src/components/auth/BetaWaitlist.tsx` | 160 | `onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}` |
| `src/components/auth/BetaWaitlist.tsx` | 178 | `onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}` |
| `src/components/auth/BetaWaitlist.tsx` | 194 | `onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}` |
| `src/components/auth/BetaWaitlist.tsx` | 200 | `{formData.message.length}/500 characters` |
| `src/components/composer/ComposerBody.tsx` | 99 | `onChange({ content: value });` |
| `src/components/composer/ComposerBody.tsx` | 132 | `onChange={(e) => handleTextChange(e.target.value)}` |
| `src/components/composer/ComposerBody.tsx` | 205 | `onValueChange={(value: StoryType) => onChange({ storyType: value })}` |
| `src/components/composer/ComposerBody.tsx` | 212 | `<SelectItem key={option.value} value={option.value}>` |
| `src/components/composer/ComposerBody.tsx` | 235 | `onChange={(e) => onChange({ title: e.target.value })}` |
| `src/components/composer/ComposerBody.tsx` | 246 | `onChange={(e) => onChange({ subtitle: e.target.value })}` |
| `src/components/composer/ComposerBody.tsx` | 257 | `onChange({ content: value });` |
| `src/components/composer/ComposerBody.tsx` | 265 | `? `${formData.content.length}/${config.suggestedLength.min} characters (minimum for ${config.label})`` |
| `src/components/composer/ComposerBody.tsx` | 267 | `? `${formData.content.length}/${config.suggestedLength.max} characters (nearing limit)`` |
| `src/components/composer/ComposerBody.tsx` | 268 | `: `${formData.content.length} characters (${config.suggestedLength.min}–${config.suggestedLength.max} recommended)`` |
| `src/components/composer/ComposerBody.tsx` | 331 | `toast({ description: `${newUrls.length} image(s) added to gallery` });` |
| `src/components/composer/ComposerBody.tsx` | 384 | `{isUploading ? 'Uploading...' : `Add Gallery Images (${galleryUrls.length}/10)`}` |
| `src/components/composer/ComposerBody.tsx` | 412 | `{ value: 'in_person', label: 'In Person', icon: '📍', description: 'Physical location' },` |
| `src/components/composer/ComposerBody.tsx` | 413 | `{ value: 'virtual', label: 'Virtual', icon: '💻', description: 'Online meeting' },` |
| `src/components/composer/ComposerBody.tsx` | 414 | `{ value: 'hybrid', label: 'Hybrid', icon: '🌐', description: 'Both options' },` |
| `src/components/composer/ComposerBody.tsx` | 418 | `{ value: 'casual', label: 'Casual' },` |
| `src/components/composer/ComposerBody.tsx` | 419 | `{ value: 'business_casual', label: 'Business Casual' },` |
| `src/components/composer/ComposerBody.tsx` | 420 | `{ value: 'formal', label: 'Formal' },` |
| `src/components/composer/ComposerBody.tsx` | 421 | `{ value: 'traditional', label: 'Traditional' },` |
| `src/components/composer/ComposerBody.tsx` | 422 | `{ value: 'other', label: 'Other' },` |
| `src/components/composer/ComposerBody.tsx` | 432 | `updated[index] = { ...updated[index], [field]: value };` |
| `src/components/composer/ComposerBody.tsx` | 460 | `onChange={(e) => onChange({ title: e.target.value })}` |
| `src/components/composer/ComposerBody.tsx` | 465 | `{(formData.title?.length \|\| 0)}/100 characters` |
| `src/components/composer/ComposerBody.tsx` | 476 | `onChange={(e) => onChange({ subtitle: e.target.value })}` |
| `src/components/composer/ComposerBody.tsx` | 501 | `onChange={(e) => onChange({ eventDate: e.target.value })}` |
| `src/components/composer/ComposerBody.tsx` | 507 | `onChange={(e) => onChange({ eventTime: e.target.value })}` |
| `src/components/composer/ComposerBody.tsx` | 517 | `onChange={(e) => onChange({ eventEndDate: e.target.value })}` |
| `src/components/composer/ComposerBody.tsx` | 523 | `onChange={(e) => onChange({ eventEndTime: e.target.value })}` |
| `src/components/composer/ComposerBody.tsx` | 535 | `onValueChange={(value) => onChange({ timezone: value })}` |
| `src/components/composer/ComposerBody.tsx` | 610 | `onChange={(e) => onChange({ location: e.target.value })}` |
| `src/components/composer/ComposerBody.tsx` | 627 | `onChange={(e) => onChange({ meetingUrl: e.target.value })}` |
| `src/components/composer/ComposerBody.tsx` | 650 | `onChange={(e) => onChange({ content: e.target.value })}` |
| `src/components/composer/ComposerBody.tsx` | 655 | `? `${formData.content.length}/50 characters minimum`` |
| `src/components/composer/ComposerBody.tsx` | 656 | `: `${formData.content.length} characters`` |
| `src/components/composer/ComposerBody.tsx` | 672 | `onChange={(e) => updateAgendaItem(index, 'time', e.target.value)}` |
| `src/components/composer/ComposerBody.tsx` | 678 | `onChange={(e) => updateAgendaItem(index, 'title', e.target.value)}` |
| `src/components/composer/ComposerBody.tsx` | 715 | `onValueChange={(value) => onChange({ dressCode: value })}` |
| `src/components/composer/ComposerBody.tsx` | 722 | `<SelectItem key={option.value} value={option.value}>` |
| `src/components/composer/ComposerBody.tsx` | 735 | `onChange={(e) => onChange({ maxAttendees: e.target.value ? parseInt(e.target.value) : undefined })}` |
| `src/components/composer/ComposerBody.tsx` | 766 | `onChange={(e) => setTagInput(e.target.value)}` |
| `src/components/composer/ComposerBody.tsx` | 940 | `onChange={(e) => onChange({ title: e.target.value })}` |
| `src/components/composer/ComposerBody.tsx` | 946 | `onChange={(e) => onChange({ content: e.target.value })}` |
| `src/components/composer/ComposerModeSelector.tsx` | 5 | `* - Selected chip: filled background with C-module accent color, white text` |
| `src/components/composer/ComposerModeSelector.tsx` | 10 | `* - Auto-scrolls to keep selected chip visible` |
| `src/components/composer/ComposerModeSelector.tsx` | 58 | `(chip) => COMPOSER_MODE_CONFIG[chip.id]?.enabled` |
| `src/components/composer/ComposerModeSelector.tsx` | 61 | `// Auto-scroll to keep active chip + next chip visible` |
| `src/components/composer/ComposerModeSelector.tsx` | 65 | `const chip = activeRef.current;` |
| `src/components/composer/ComposerModeSelector.tsx` | 66 | `// Find the next sibling chip to ensure it's partially visible` |
| `src/components/composer/ComposerModeSelector.tsx` | 67 | `const nextChip = chip.nextElementSibling as HTMLElement \| null;` |
| `src/components/composer/ComposerModeSelector.tsx` | 70 | `: chip.offsetLeft + chip.offsetWidth;` |
| `src/components/composer/ComposerModeSelector.tsx` | 71 | `const chipLeft = chip.offsetLeft;` |
| `src/components/composer/ComposerModeSelector.tsx` | 94 | `{enabledChips.map((chip) => {` |
| `src/components/composer/ComposerModeSelector.tsx` | 95 | `const Icon = chip.icon;` |
| `src/components/composer/ComposerModeSelector.tsx` | 96 | `const handler = MODE_HANDLERS[chip.id];` |
| `src/components/composer/ComposerModeSelector.tsx` | 97 | `const isActive = currentMode === chip.id;` |
| `src/components/composer/ComposerModeSelector.tsx` | 98 | `const disabled = isDisabled(chip.id);` |
| `src/components/composer/ComposerModeSelector.tsx` | 112 | `? `${chip.activeBgClass} text-white shadow-md ring-1 ring-white/20`` |
| `src/components/composer/ComposerOnboarding.tsx` | 12 | `* Desktop: Tooltips appear below each chip on hover/focus.` |
| `src/components/composer/ComposerOnboarding.tsx` | 121 | `{/* Ghost overlay triggers for each chip — designed to layer over the mode selector */}` |
| `src/components/composer/ComposerOnboarding.tsx` | 132 | `{/* Invisible trigger matching chip size */}` |
| `src/components/composer/ComposerSuccessScreen.tsx` | 246 | `<span>{formData.content.length.toLocaleString()} characters</span>` |
| `src/components/connect/CommunityJoinDialog.tsx` | 24 | `{ value: 'join_member', label: 'Join as Member' },` |
| `src/components/connect/CommunityJoinDialog.tsx` | 25 | `{ value: 'follow_updates', label: 'Follow Updates' },` |
| `src/components/connect/CommunityJoinDialog.tsx` | 26 | `{ value: 'collaborate', label: 'Collaborate on Projects' },` |
| `src/components/connect/CommunityJoinDialog.tsx` | 27 | `{ value: 'partnership', label: 'Partnership' },` |
| `src/components/connect/CommunityJoinDialog.tsx` | 28 | `{ value: 'sponsorship', label: 'Sponsorship' },` |
| `src/components/connect/CommunityJoinDialog.tsx` | 29 | `{ value: 'mentor_volunteer', label: 'Mentor / Volunteer' },` |
| `src/components/connect/CommunityJoinDialog.tsx` | 30 | `{ value: 'host_event', label: 'Host an Event' },` |
| `src/components/connect/CommunityJoinDialog.tsx` | 31 | `{ value: 'dm_admins', label: 'DM Admins' },` |
| `src/components/connect/CommunityJoinDialog.tsx` | 79 | `<div key={r.value} className="flex items-center space-x-2 rounded-md border p-2">` |
| `src/components/connect/CommunityJoinDialog.tsx` | 80 | `<RadioGroupItem id={`reason-${r.value}`} value={r.value} />` |
| `src/components/connect/CommunityJoinDialog.tsx` | 81 | `<Label htmlFor={`reason-${r.value}`}>{r.label}</Label>` |
| `src/components/connect/CommunityJoinDialog.tsx` | 93 | `onChange={(e) => setNote(e.target.value)}` |
| `src/components/connect/ConnectLayout.tsx` | 18 | `navigate(`/dna/connect/${value}`);` |
| `src/components/connect/ConnectMobileHeader.tsx` | 26 | `{ value: 'discover' as const, icon: Users, label: 'Members' },` |
| `src/components/connect/ConnectMobileHeader.tsx` | 27 | `{ value: 'network' as const, icon: Network, label: 'Network' },` |
| `src/components/connect/ConnectMobileHeader.tsx` | 28 | `{ value: 'messages' as const, icon: MessageCircle, label: 'Messages' },` |
| `src/components/connect/ConnectMobileHeader.tsx` | 64 | `onChange={(e) => onSearchChange(e.target.value)}` |
| `src/components/connect/ConnectMobileHeader.tsx` | 100 | `{TAB_CONFIG.map(({ value, icon: Icon, label }) => {` |
| `src/components/connect/ConnectTabs.tsx` | 131 | `hasNextEvent={selectedEventIndex < events.length - 1}` |
| `src/components/connect/ConnectionRequestContext.tsx` | 83 | `// 4. Mutual connections count` |
| `src/components/connect/ConnectionRequestContext.tsx` | 85 | `const { data: count } = await supabase.rpc('get_mutual_connection_count', {` |
| `src/components/connect/ConnectionRequestContext.tsx` | 89 | `if (typeof count === 'number' && count > 0) {` |
| `src/components/connect/ConnectionRequestContext.tsx` | 90 | `return `**${count} mutual connection${count > 1 ? 's' : ''}**`;` |
| `src/components/connect/ConnectionRequestModal.tsx` | 88 | `onChange={(e) => setMessage(e.target.value)}` |
| `src/components/connect/ConnectionRequestModal.tsx` | 98 | `{message.length}/{MAX_CHARS} characters` |
| `src/components/connect/DirectMessageDialog.tsx` | 65 | `onChange={(e) => setMessage(e.target.value)}` |
| `src/components/connect/DiscoverFilterSheet.tsx` | 157 | `let count = 0;` |
| `src/components/connect/DiscoverFilterSheet.tsx` | 158 | `if (f.country_of_origin) count++;` |
| `src/components/connect/DiscoverFilterSheet.tsx` | 159 | `if (f.current_country) count++;` |
| `src/components/connect/DiscoverFilterSheet.tsx` | 160 | `if (f.focus_areas?.length) count += f.focus_areas.length;` |
| `src/components/connect/DiscoverFilterSheet.tsx` | 161 | `if (f.regional_expertise?.length) count += f.regional_expertise.length;` |
| `src/components/connect/DiscoverFilterSheet.tsx` | 162 | `if (f.industries?.length) count += f.industries.length;` |
| `src/components/connect/DiscoverFilterSheet.tsx` | 163 | `if (f.skills?.length) count += f.skills.length;` |
| `src/components/connect/DiscoverFilterSheet.tsx` | 164 | `return count;` |
| `src/components/connect/EventCategoriesSection.tsx` | 52 | `<p className="text-sm text-gray-500">{category.count}</p>` |
| `src/components/connect/IntroductionInsightChips.tsx` | 6 | `* Clicking a chip auto-inserts a relevant sentence into the message.` |
| `src/components/connect/IntroductionModal.tsx` | 382 | `{message.length}/{MAX_CHARS}` |
| `src/components/connect/LocalEventsSection.tsx` | 60 | `{/* Event Count with Icon */}` |
| `src/components/connect/LocalEventsSection.tsx` | 63 | `<p className="text-xs font-medium text-gray-700">{location.count} Events</p>` |
| `src/components/connect/MemberCardSkeleton.tsx` | 49 | `count?: number;` |
| `src/components/connect/MemberCardSkeleton.tsx` | 53 | `count = 4,` |
| `src/components/connect/MemberCardSkeleton.tsx` | 57 | `{Array.from({ length: count }).map((_, i) => (` |
| `src/components/connect/PopularEventsSection.tsx` | 30 | `Popular Events ({events.length})` |
| `src/components/connect/ProfessionalCard.tsx` | 148 | `+{professional.skills.length - 3} more` |
| `src/components/connect/ProfessionalProfilePreview.tsx` | 15 | `const InfoRow: React.FC<{ label: string; value?: React.ReactNode } > = ({ label, value }) => {` |
| `src/components/connect/ProfessionalProfilePreview.tsx` | 20 | `<span className="font-medium text-gray-800 text-right ml-4">{value}</span>` |
| `src/components/connect/SearchTypeahead.tsx` | 17 | `count?: number;` |
| `src/components/connect/SearchTypeahead.tsx` | 95 | `// Sector results - aggregate and count` |
| `src/components/connect/SearchTypeahead.tsx` | 113 | `.forEach(([sector, count]) => {` |
| `src/components/connect/SearchTypeahead.tsx` | 118 | `subtitle: `${count} professional${count !== 1 ? 's' : ''}`,` |
| `src/components/connect/SearchTypeahead.tsx` | 119 | `count,` |
| `src/components/connect/SearchTypeahead.tsx` | 125 | `// Location results - aggregate and count` |
| `src/components/connect/SearchTypeahead.tsx` | 138 | `.forEach(([location, count]) => {` |
| `src/components/connect/SearchTypeahead.tsx` | 143 | `subtitle: `${count} member${count !== 1 ? 's' : ''}`,` |
| `src/components/connect/SearchTypeahead.tsx` | 144 | `count,` |
| `src/components/connect/SearchTypeahead.tsx` | 177 | `navigate(`/dna/${result.value}`);` |
| `src/components/connect/SearchTypeahead.tsx` | 310 | `<div className={people.length > 0 ? 'border-t border-border/50' : ''}>` |
| `src/components/connect/SearchTypeahead.tsx` | 333 | `{result.count}` |
| `src/components/connect/SearchTypeahead.tsx` | 342 | `<div className={(people.length > 0 \|\| sectors.length > 0) ? 'border-t border-border/50' : ''}>` |
| `src/components/connect/SearchTypeahead.tsx` | 365 | `{result.count}` |
| `src/components/connect/hub/ConnectMemberCard.tsx` | 63 | `// --- Sector chip ---` |
| `src/components/connect/hub/ConnectMemberCard.tsx` | 192 | `{/* Sector chip */}` |
| `src/components/connect/hub/ConversationsPanel.tsx` | 144 | `// For each participation, count messages after last_read_at` |
| `src/components/connect/hub/ConversationsPanel.tsx` | 149 | `.select('id', { count: 'exact' })` |
| `src/components/connect/hub/ConversationsPanel.tsx` | 157 | `const { count, error: countError } = await query;` |
| `src/components/connect/hub/ConversationsPanel.tsx` | 159 | `logger.warn('ConversationsPanel', 'Failed to count unread:', countError);` |
| `src/components/connect/hub/ConversationsPanel.tsx` | 161 | `unreadCounts.set(p.conversation_id, count \|\| 0);` |
| `src/components/connect/hub/ConversationsPanel.tsx` | 347 | `onChange={(e) => setSearchQuery(e.target.value)}` |
| `src/components/connect/hub/ConversationsPanel.tsx` | 366 | `{conversations.filter((c) => c.unread_count > 0).length}` |
| `src/components/connect/hub/ConversationsPanel.tsx` | 469 | `{connectionRequests.length}` |
| `src/components/connect/hub/DiaInsightCard.tsx` | 60 | `count?: number;` |
| `src/components/connect/hub/DiaInsightCard.tsx` | 231 | `{insight.count && insight.count > 3 && (` |
| `src/components/connect/hub/DiaInsightCard.tsx` | 233 | `+{insight.count - 3}` |
| `src/components/connect/hub/DiaInsightCard.tsx` | 392 | `{insight.count && (` |
| `src/components/connect/hub/DiaInsightCard.tsx` | 394 | `{insight.count} people you know` |
| `src/components/connect/hub/DiscoveryFeed.tsx` | 417 | `onChange={(e) => setSearchQuery(e.target.value)}` |
| `src/components/connect/hub/EnhancedMemberCard.tsx` | 568 | `<span className="text-[10px] text-muted-foreground">+{member.skills.length - 5}</span>` |
| `src/components/connect/hub/FiveCsEngagement.tsx` | 29 | `count: number;` |
| `src/components/connect/hub/FiveCsEngagement.tsx` | 34 | `count: number;` |
| `src/components/connect/hub/FiveCsEngagement.tsx` | 39 | `count: number;` |
| `src/components/connect/hub/FiveCsEngagement.tsx` | 44 | `count: number;` |
| `src/components/connect/hub/FiveCsEngagement.tsx` | 90 | `const { data: stories, count: storyCount } = await supabase` |
| `src/components/connect/hub/FiveCsEngagement.tsx` | 92 | `.select('id', { count: 'exact' })` |
| `src/components/connect/hub/FiveCsEngagement.tsx` | 102 | `count: eventRegs?.length ?? 0,` |
| `src/components/connect/hub/FiveCsEngagement.tsx` | 112 | `count: spaceMemberships?.length ?? 0,` |
| `src/components/connect/hub/FiveCsEngagement.tsx` | 121 | `count: contributions?.length ?? 0,` |
| `src/components/connect/hub/FiveCsEngagement.tsx` | 131 | `count: storyCount ?? 0,` |
| `src/components/connect/hub/FiveCsEngagement.tsx` | 150 | `count: engagement.convene.count,` |
| `src/components/connect/hub/FiveCsEngagement.tsx` | 153 | `? `${engagement.convene.count} upcoming event${engagement.convene.count !== 1 ? 's' : ''}`` |
| `src/components/connect/hub/FiveCsEngagement.tsx` | 161 | `count: engagement.collaborate.count,` |
| `src/components/connect/hub/FiveCsEngagement.tsx` | 164 | `? `Active in ${engagement.collaborate.count} space${engagement.collaborate.count !== 1 ? 's' : ''}`` |
| `src/components/connect/hub/FiveCsEngagement.tsx` | 172 | `count: engagement.contribute.count,` |
| `src/components/connect/hub/FiveCsEngagement.tsx` | 175 | `? `${engagement.contribute.count} active opportunit${engagement.contribute.count !== 1 ? 'ies' : 'y'}`` |
| `src/components/connect/hub/FiveCsEngagement.tsx` | 183 | `count: engagement.convey.count,` |
| `src/components/connect/hub/FiveCsEngagement.tsx` | 186 | `? `${engagement.convey.count} stor${engagement.convey.count !== 1 ? 'ies' : 'y'} this month`` |
| `src/components/connect/hub/FiveCsEngagement.tsx` | 215 | `{!compact && badge.count > 1 && (` |
| `src/components/connect/hub/FiveCsEngagement.tsx` | 216 | `<span className="text-[10px] opacity-70">{badge.count}</span>` |
| `src/components/connect/hub/InlineChat.tsx` | 387 | `onChange={(e) => setMessage(e.target.value)}` |
| `src/components/connect/hub/NetworkHighlights.tsx` | 63 | `.map(([name, count]) => ({ name, count }));` |
| `src/components/connect/hub/NetworkHighlights.tsx` | 68 | `.map(([name, count]) => ({ name, count }));` |
| `src/components/connect/hub/NetworkHighlights.tsx` | 102 | `<span className="ml-1 font-bold text-foreground">({sector.count})</span>` |
| `src/components/connect/hub/NetworkHighlights.tsx` | 120 | `<span className="ml-1 font-bold text-foreground">({loc.count})</span>` |
| `src/components/connect/hub/NetworkPanel.tsx` | 88 | `if (!user) return { total: 0, weeklyChange: 0, pendingRequests: 0 };` |
| `src/components/connect/hub/NetworkPanel.tsx` | 90 | `const { count: totalConnections } = await supabase` |
| `src/components/connect/hub/NetworkPanel.tsx` | 92 | `.select('id', { count: 'exact' })` |
| `src/components/connect/hub/NetworkPanel.tsx` | 98 | `const { count: newThisWeek } = await supabase` |
| `src/components/connect/hub/NetworkPanel.tsx` | 100 | `.select('id', { count: 'exact' })` |
| `src/components/connect/hub/NetworkPanel.tsx` | 105 | `const { count: pendingRequests } = await supabase` |
| `src/components/connect/hub/NetworkPanel.tsx` | 107 | `.select('id', { count: 'exact' })` |
| `src/components/connect/hub/NetworkPanel.tsx` | 118 | `return { total: 0, weeklyChange: 0, pendingRequests: 0 };` |
| `src/components/connect/hub/NetworkPanel.tsx` | 133 | `const { count: profileViews } = await supabase` |
| `src/components/connect/hub/NetworkPanel.tsx` | 135 | `.select('id', { count: 'exact' })` |
| `src/components/connect/hub/NetworkPanel.tsx` | 198 | `{networkStats.total}` |
| `src/components/connect/hub/NetworkPanel.tsx` | 293 | `{filters.regions.length}` |
| `src/components/connect/hub/NetworkPanel.tsx` | 413 | `<Collapsible defaultOpen={!!myIntroductions?.length}>` |
| `src/components/connect/hub/NetworkPanel.tsx` | 419 | `{myIntroductions.length}` |
| `src/components/connect/search/SearchInput.tsx` | 25 | `onChange={(e) => onSearchChange(e.target.value)}` |
| `src/components/connections/MutualConnectionsWidget.tsx` | 5 | `* - inline: Text-only link with count (for connection cards)` |
| `src/components/connections/MutualConnectionsWidget.tsx` | 6 | `* - compact: Avatar stack with count (for profile headers)` |
| `src/components/connections/MutualConnectionsWidget.tsx` | 100 | `// Inline variant - just text with count` |
| `src/components/connections/MutualConnectionsWidget.tsx` | 117 | `count={mutualCount}` |
| `src/components/connections/MutualConnectionsWidget.tsx` | 123 | `// Compact variant - avatar stack with count` |
| `src/components/connections/MutualConnectionsWidget.tsx` | 180 | `count={mutualCount}` |
| `src/components/connections/MutualConnectionsWidget.tsx` | 236 | `count={mutualCount}` |
| `src/components/connections/MutualConnectionsWidget.tsx` | 248 | `count,` |
| `src/components/connections/MutualConnectionsWidget.tsx` | 251 | `count: number;` |
| `src/components/connections/MutualConnectionsWidget.tsx` | 260 | `{count} Mutual Connection{count !== 1 ? 's' : ''}` |
| `src/components/convene/ConveneCategoryChips.tsx` | 38 | `const count = cat.id === 'all'` |
| `src/components/convene/ConveneCategoryChips.tsx` | 57 | `{count > 0 && (` |
| `src/components/convene/ConveneCategoryChips.tsx` | 64 | `{count}` |
| `src/components/convene/ConveneCitiesSection.tsx` | 28 | `count: number;` |
| `src/components/convene/ConveneCitiesSection.tsx` | 77 | `{c.count} event{c.count !== 1 ? 's' : ''}` |
| `src/components/convene/ConveneDIADiscoveryCard.tsx` | 101 | `// Count of unique connections attending events within the next 7 days` |
| `src/components/convene/ConveneEventCard.tsx` | 66 | `event_attendees?: Array<{ count: number }>;` |
| `src/components/convene/ConveneEventCard.tsx` | 108 | `event.attendee_count ?? event.event_attendees?.[0]?.count ?? 0;` |
| `src/components/convene/ConveneEventCard.tsx` | 308 | `{/* Attendee count (non-action mode) */}` |
| `src/components/convene/ConveneEventCard.tsx` | 347 | `{/* Two-layer gradient overlay — bulletproof chip legibility */}` |
| `src/components/convene/ConveneEventCard.tsx` | 351 | `{/* Category chip — top left */}` |
| `src/components/convene/ConveneEventCard.tsx` | 360 | `{/* Urgency chip — top right */}` |
| `src/components/convene/ConveneEventCard.tsx` | 457 | `{/* Left: Organizer or attendee count */}` |
| `src/components/convene/ConveneHeroEvent.tsx` | 31 | `event_attendees?: Array<{ count: number }>;` |
| `src/components/convene/ConveneHeroEvent.tsx` | 43 | `const attendeeCount = event.event_attendees?.[0]?.count ?? 0;` |
| `src/components/convene/ConveneLocationSelector.tsx` | 27 | `count: number;` |
| `src/components/convene/ConveneLocationSelector.tsx` | 82 | `onChange={(e) => setSearch(e.target.value)}` |
| `src/components/convene/ConveneLocationSelector.tsx` | 114 | `{c.count}` |
| `src/components/convene/ConveneMapView.tsx` | 94 | `{/* Event count overlay */}` |
| `src/components/convene/ConveneMapView.tsx` | 97 | `{mappableEvents.length} event{mappableEvents.length !== 1 ? 's' : ''} on map` |
| `src/components/convene/ConveneSearchOverlay.tsx` | 17 | `{ key: 'format', value: 'virtual', label: 'Virtual' },` |
| `src/components/convene/ConveneSearchOverlay.tsx` | 18 | `{ key: 'format', value: 'in_person', label: 'In-Person' },` |
| `src/components/convene/ConveneSearchOverlay.tsx` | 19 | `{ key: 'timeRange', value: 'today', label: 'Today' },` |
| `src/components/convene/ConveneSearchOverlay.tsx` | 20 | `{ key: 'timeRange', value: 'this_week', label: 'This Week' },` |
| `src/components/convene/ConveneSearchOverlay.tsx` | 21 | `{ key: 'timeRange', value: 'this_month', label: 'This Month' },` |
| `src/components/convene/ConveneSearchOverlay.tsx` | 89 | `return { ...prev, [key]: value };` |
| `src/components/convene/ConveneSearchOverlay.tsx` | 115 | `onChange={e => setSearchTerm(e.target.value)}` |
| `src/components/convene/ConveneSearchOverlay.tsx` | 149 | `{chip.label}` |
| `src/components/convene/ConveneSearchOverlay.tsx` | 161 | `{isSearching ? 'Searching...' : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}${searchTerm ? ` for "${searchTerm}"` : ''}`}` |
| `src/components/convene/DiscoveryLane.tsx` | 34 | `event_attendees?: Array<{ count: number }>;` |
| `src/components/convene/EventFormFields.tsx` | 37 | `{ value: 'Africa/Lagos', label: 'Lagos, Nigeria (WAT)' },` |
| `src/components/convene/EventFormFields.tsx` | 38 | `{ value: 'Africa/Nairobi', label: 'Nairobi, Kenya (EAT)' },` |
| `src/components/convene/EventFormFields.tsx` | 39 | `{ value: 'Africa/Johannesburg', label: 'Johannesburg, South Africa (SAST)' },` |
| `src/components/convene/EventFormFields.tsx` | 40 | `{ value: 'Africa/Cairo', label: 'Cairo, Egypt (EET)' },` |
| `src/components/convene/EventFormFields.tsx` | 41 | `{ value: 'Africa/Accra', label: 'Accra, Ghana (GMT)' },` |
| `src/components/convene/EventFormFields.tsx` | 42 | `{ value: 'Africa/Casablanca', label: 'Casablanca, Morocco (WET)' },` |
| `src/components/convene/EventFormFields.tsx` | 43 | `{ value: 'Africa/Addis_Ababa', label: 'Addis Ababa, Ethiopia (EAT)' },` |
| `src/components/convene/EventFormFields.tsx` | 44 | `{ value: 'Africa/Dakar', label: 'Dakar, Senegal (GMT)' },` |
| `src/components/convene/EventFormFields.tsx` | 45 | `{ value: 'Africa/Kigali', label: 'Kigali, Rwanda (CAT)' },` |
| `src/components/convene/EventFormFields.tsx` | 46 | `{ value: 'Africa/Kinshasa', label: 'Kinshasa, DRC (WAT)' },` |
| `src/components/convene/EventFormFields.tsx` | 48 | `{ value: 'America/New_York', label: 'New York (EST/EDT)' },` |
| `src/components/convene/EventFormFields.tsx` | 49 | `{ value: 'America/Chicago', label: 'Chicago (CST/CDT)' },` |
| `src/components/convene/EventFormFields.tsx` | 50 | `{ value: 'America/Denver', label: 'Denver (MST/MDT)' },` |
| `src/components/convene/EventFormFields.tsx` | 51 | `{ value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },` |
| `src/components/convene/EventFormFields.tsx` | 52 | `{ value: 'America/Toronto', label: 'Toronto (EST/EDT)' },` |
| `src/components/convene/EventFormFields.tsx` | 53 | `{ value: 'America/Sao_Paulo', label: 'São Paulo (BRT)' },` |
| `src/components/convene/EventFormFields.tsx` | 54 | `{ value: 'America/Mexico_City', label: 'Mexico City (CST)' },` |
| `src/components/convene/EventFormFields.tsx` | 56 | `{ value: 'Europe/London', label: 'London (GMT/BST)' },` |
| `src/components/convene/EventFormFields.tsx` | 57 | `{ value: 'Europe/Paris', label: 'Paris (CET/CEST)' },` |
| `src/components/convene/EventFormFields.tsx` | 58 | `{ value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },` |
| `src/components/convene/EventFormFields.tsx` | 59 | `{ value: 'Europe/Amsterdam', label: 'Amsterdam (CET/CEST)' },` |
| `src/components/convene/EventFormFields.tsx` | 61 | `{ value: 'Asia/Dubai', label: 'Dubai (GST)' },` |
| `src/components/convene/EventFormFields.tsx` | 62 | `{ value: 'Asia/Singapore', label: 'Singapore (SGT)' },` |
| `src/components/convene/EventFormFields.tsx` | 63 | `{ value: 'Asia/Tokyo', label: 'Tokyo (JST)' },` |
| `src/components/convene/EventFormFields.tsx` | 65 | `{ value: 'America/Jamaica', label: 'Jamaica (EST)' },` |
| `src/components/convene/EventFormFields.tsx` | 66 | `{ value: 'America/Port_of_Spain', label: 'Trinidad & Tobago (AST)' },` |
| `src/components/convene/EventFormFields.tsx` | 67 | `{ value: 'America/Barbados', label: 'Barbados (AST)' },` |
| `src/components/convene/EventFormFields.tsx` | 69 | `{ value: 'UTC', label: 'UTC (Coordinated Universal Time)' },` |
| `src/components/convene/EventFormFields.tsx` | 79 | `{ value: 'in_person', label: 'In Person', icon: '📍', description: 'Physical location' },` |
| `src/components/convene/EventFormFields.tsx` | 80 | `{ value: 'virtual', label: 'Virtual', icon: '💻', description: 'Online meeting' },` |
| `src/components/convene/EventFormFields.tsx` | 81 | `{ value: 'hybrid', label: 'Hybrid', icon: '🌐', description: 'Both options' },` |
| `src/components/convene/EventFormFields.tsx` | 85 | `{ value: 'casual', label: 'Casual' },` |
| `src/components/convene/EventFormFields.tsx` | 86 | `{ value: 'business_casual', label: 'Business Casual' },` |
| `src/components/convene/EventFormFields.tsx` | 87 | `{ value: 'formal', label: 'Formal' },` |
| `src/components/convene/EventFormFields.tsx` | 88 | `{ value: 'traditional', label: 'Traditional' },` |
| `src/components/convene/EventFormFields.tsx` | 89 | `{ value: 'other', label: 'Other' },` |
| `src/components/convene/EventFormFields.tsx` | 100 | `updated[index] = { ...updated[index], [field]: value };` |
| `src/components/convene/EventFormFields.tsx` | 128 | `onChange={(e) => onChange({ title: e.target.value })}` |
| `src/components/convene/EventFormFields.tsx` | 133 | `{(formData.title?.length \|\| 0)}/100 characters` |
| `src/components/convene/EventFormFields.tsx` | 143 | `onChange={(e) => onChange({ subtitle: e.target.value })}` |
| `src/components/convene/EventFormFields.tsx` | 169 | `onChange={(e) => onChange({ eventDate: e.target.value })}` |
| `src/components/convene/EventFormFields.tsx` | 175 | `onChange={(e) => onChange({ eventTime: e.target.value })}` |
| `src/components/convene/EventFormFields.tsx` | 186 | `onChange={(e) => onChange({ eventEndDate: e.target.value })}` |
| `src/components/convene/EventFormFields.tsx` | 192 | `onChange={(e) => onChange({ eventEndTime: e.target.value })}` |
| `src/components/convene/EventFormFields.tsx` | 204 | `onValueChange={(value) => onChange({ timezone: value })}` |
| `src/components/convene/EventFormFields.tsx` | 211 | `<SelectItem key={tz.value} value={tz.value}>` |
| `src/components/convene/EventFormFields.tsx` | 271 | `onChange={(e) => onChange({ meetingUrl: e.target.value })}` |
| `src/components/convene/EventFormFields.tsx` | 293 | `onChange={(e) => onChange({ description: e.target.value })}` |
| `src/components/convene/EventFormFields.tsx` | 298 | `? `${formData.description.length}/50 characters minimum`` |
| `src/components/convene/EventFormFields.tsx` | 299 | `: `${formData.description.length} characters`` |
| `src/components/convene/EventFormFields.tsx` | 314 | `onChange={(e) => updateAgendaItem(index, 'time', e.target.value)}` |
| `src/components/convene/EventFormFields.tsx` | 320 | `onChange={(e) => updateAgendaItem(index, 'title', e.target.value)}` |
| `src/components/convene/EventFormFields.tsx` | 357 | `onValueChange={(value) => onChange({ dressCode: value })}` |
| `src/components/convene/EventFormFields.tsx` | 364 | `<SelectItem key={option.value} value={option.value}>` |
| `src/components/convene/EventFormFields.tsx` | 377 | `onChange={(e) => onChange({ maxAttendees: e.target.value ? parseInt(e.target.value) : undefined })}` |
| `src/components/convene/EventFormFields.tsx` | 408 | `onChange={(e) => setTagInput(e.target.value)}` |
| `src/components/convene/EventOrganizerCard.tsx` | 3 | `* Enhanced organizer section with bio, event count, and follow CTA.` |
| `src/components/convene/EventOrganizerCard.tsx` | 37 | `// Fetch organizer's event count` |
| `src/components/convene/EventOrganizerCard.tsx` | 39 | `queryKey: ['organizer-event-count', organizer.id],` |
| `src/components/convene/EventOrganizerCard.tsx` | 41 | `const { count } = await supabase` |
| `src/components/convene/EventOrganizerCard.tsx` | 43 | `.select('id', { count: 'exact', head: true })` |
| `src/components/convene/EventOrganizerCard.tsx` | 46 | `return count \|\| 0;` |
| `src/components/convene/EventThreadCTA.tsx` | 4 | `* Renders a secondary-style button with participant count badge that navigates` |
| `src/components/convene/EventThreadCTA.tsx` | 30 | `function formatParticipantCount(count: number): string {` |
| `src/components/convene/EventThreadCTA.tsx` | 31 | `if (count > 99) return '99+';` |
| `src/components/convene/EventThreadCTA.tsx` | 32 | `return String(count);` |
| `src/components/convene/HappeningNowSection.tsx` | 28 | `event_attendees(count)` |
| `src/components/convene/HappeningNowSection.tsx` | 60 | `const attendeeCount = (event.event_attendees as Array<{ count: number }>)?.[0]?.count \|\| 0;` |
| `src/components/convene/MyEventCard.tsx` | 29 | `event_attendees?: Array<{ count: number }>;` |
| `src/components/convene/MyEventCard.tsx` | 40 | `const attendeeCount = event.event_attendees?.[0]?.count ?? 0;` |
| `src/components/convene/MyEventsStatsHeader.tsx` | 3 | `* Three metric cards with count-up animation for the hosting tab.` |
| `src/components/convene/MyEventsStatsHeader.tsx` | 16 | `const [count, setCount] = useState(0);` |
| `src/components/convene/MyEventsStatsHeader.tsx` | 41 | `return <span>{count}</span>;` |
| `src/components/convene/analytics/EventAnalyticsCard.tsx` | 16 | `{ name: 'Going', value: rsvp_stats.going, fill: 'hsl(var(--chart-1))' },` |
| `src/components/convene/analytics/EventAnalyticsCard.tsx` | 17 | `{ name: 'Maybe', value: rsvp_stats.maybe, fill: 'hsl(var(--chart-2))' },` |
| `src/components/convene/analytics/EventAnalyticsCard.tsx` | 18 | `{ name: 'Waitlist', value: rsvp_stats.waitlist, fill: 'hsl(var(--chart-3))' },` |
| `src/components/convene/analytics/EventAnalyticsCard.tsx` | 19 | `{ name: 'Not Going', value: rsvp_stats.not_going, fill: 'hsl(var(--chart-4))' },` |
| `src/components/convene/analytics/EventAnalyticsCard.tsx` | 43 | `<span className="text-2xl font-bold">{rsvp_stats.total}</span>` |
| `src/components/convene/analytics/EventAnalyticsCard.tsx` | 115 | `<Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />` |
| `src/components/convene/analytics/OrganizerAnalyticsDashboard.tsx` | 29 | `<div className="text-3xl font-bold">{events_hosted.total}</div>` |
| `src/components/convene/management/analytics/AnalyticsDashboard.tsx` | 41 | `registrationsBySource: { name: string; value: number }[];` |
| `src/components/convene/management/analytics/AnalyticsDashboard.tsx` | 42 | `registrationsByStatus: { name: string; value: number }[];` |
| `src/components/convene/management/analytics/AnalyticsDashboard.tsx` | 43 | `checkInsByHour: { hour: string; count: number }[];` |
| `src/components/convene/management/analytics/AnalyticsDashboard.tsx` | 112 | `.map(([name, value]) => ({ name, value }))` |
| `src/components/convene/management/analytics/AnalyticsDashboard.tsx` | 131 | `.map(([name, value]) => ({ name: statusLabels[name] \|\| name, value }))` |
| `src/components/convene/management/analytics/AnalyticsDashboard.tsx` | 144 | `.map(([hour, count]) => ({` |
| `src/components/convene/management/analytics/AnalyticsDashboard.tsx` | 146 | `count,` |
| `src/components/convene/management/analytics/AnalyticsDashboard.tsx` | 371 | `<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />` |
| `src/components/convene/management/analytics/AnalyticsDashboard.tsx` | 414 | `<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />` |
| `src/components/convene/management/analytics/AnalyticsDashboard.tsx` | 465 | `<Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />` |
| `src/components/convene/management/attendees/AttendeeManagement.tsx` | 381 | `<p className="text-2xl font-bold">{stats.total}</p>` |
| `src/components/convene/management/attendees/AttendeeManagement.tsx` | 387 | `<p className="text-2xl font-bold text-green-600">{stats.going}</p>` |
| `src/components/convene/management/attendees/AttendeeManagement.tsx` | 393 | `<p className="text-2xl font-bold text-amber-600">{stats.pending}</p>` |
| `src/components/convene/management/attendees/AttendeeManagement.tsx` | 399 | `<p className="text-2xl font-bold text-blue-600">{stats.checkedIn}</p>` |
| `src/components/convene/management/attendees/AttendeeManagement.tsx` | 414 | `onChange={(e) => setSearchQuery(e.target.value)}` |
| `src/components/convene/management/attendees/AttendeeManagement.tsx` | 556 | `checked={selectedAttendees.size === filteredAttendees.length && filteredAttendees.length > 0}` |
| `src/components/convene/management/attendees/AttendeeManagement.tsx` | 688 | `onChange={(e) => setNewAttendeeName(e.target.value)}` |
| `src/components/convene/management/attendees/AttendeeManagement.tsx` | 698 | `onChange={(e) => setNewAttendeeEmail(e.target.value)}` |
| `src/components/convene/management/attendees/AttendeeManagement.tsx` | 707 | `onChange={(e) => setNewAttendeeNote(e.target.value)}` |
| `src/components/convene/management/checkin/CheckInDashboard.tsx` | 112 | `return { total, checkedIn };` |
| `src/components/convene/management/checkin/CheckInDashboard.tsx` | 407 | `{stats?.checkedIn \|\| 0} / {stats?.total \|\| 0}` |
| `src/components/convene/management/checkin/CheckInDashboard.tsx` | 568 | `onChange={(e) => setSearchQuery(e.target.value)}` |
| `src/components/convene/management/checkin/CheckInDashboard.tsx` | 715 | `onChange={(e) => setWalkUpName(e.target.value)}` |
| `src/components/convene/management/checkin/CheckInDashboard.tsx` | 726 | `onChange={(e) => setWalkUpEmail(e.target.value)}` |
| `src/components/convene/management/checkin/CheckInDashboard.tsx` | 736 | `onChange={(e) => setWalkUpPhone(e.target.value)}` |
| `src/components/convene/management/checkin/CheckInDashboard.tsx` | 745 | `onChange={(e) => setWalkUpNotes(e.target.value)}` |
| `src/components/convene/management/communications/CommunicationsHub.tsx` | 83 | `{ value: 'all', label: 'All Registered', description: 'Everyone who registered' },` |
| `src/components/convene/management/communications/CommunicationsHub.tsx` | 84 | `{ value: 'going', label: 'Going', description: 'Confirmed attendees' },` |
| `src/components/convene/management/communications/CommunicationsHub.tsx` | 85 | `{ value: 'maybe', label: 'Maybe', description: 'Tentative RSVPs' },` |
| `src/components/convene/management/communications/CommunicationsHub.tsx` | 86 | `{ value: 'not_checked_in', label: 'Not Checked In', description: 'Going but not yet checked in' },` |
| `src/components/convene/management/communications/CommunicationsHub.tsx` | 87 | `{ value: 'checked_in', label: 'Checked In', description: 'Already checked in' },` |
| `src/components/convene/management/communications/CommunicationsHub.tsx` | 88 | `{ value: 'waitlist', label: 'Waitlist', description: 'On the waitlist' },` |
| `src/components/convene/management/communications/CommunicationsHub.tsx` | 270 | `onSuccess: (count) => {` |
| `src/components/convene/management/communications/CommunicationsHub.tsx` | 273 | `description: `Notification sent to ${count} DNA members.`,` |
| `src/components/convene/management/communications/CommunicationsHub.tsx` | 366 | `key={option.value}` |
| `src/components/convene/management/communications/CommunicationsHub.tsx` | 375 | `{segmentCounts[option.value as keyof typeof segmentCounts] \|\| 0}` |
| `src/components/convene/management/communications/CommunicationsHub.tsx` | 392 | `onChange={(e) => setEmailSubject(e.target.value)}` |
| `src/components/convene/management/communications/CommunicationsHub.tsx` | 413 | `onChange={(e) => setEmailBody(e.target.value)}` |
| `src/components/convene/management/communications/CommunicationsHub.tsx` | 475 | `onChange={(e) => setScheduledFor(e.target.value)}` |
| `src/components/convene/management/communications/CommunicationsHub.tsx` | 547 | `<SelectItem key={option.value} value={option.value}>` |
| `src/components/convene/management/communications/CommunicationsHub.tsx` | 548 | `{option.label} ({segmentCounts[option.value as keyof typeof segmentCounts] \|\| 0})` |
| `src/components/convene/management/communications/CommunicationsHub.tsx` | 561 | `onChange={(e) => setNotifTitle(e.target.value.slice(0, 100))}` |
| `src/components/convene/management/communications/CommunicationsHub.tsx` | 566 | `{notifTitle.length}/100` |
| `src/components/convene/management/communications/CommunicationsHub.tsx` | 576 | `onChange={(e) => setNotifBody(e.target.value.slice(0, 500))}` |
| `src/components/convene/management/communications/CommunicationsHub.tsx` | 582 | `{notifBody.length}/500` |
| `src/components/convene/management/settings/EventSettingsPage.tsx` | 244 | `onChange={(e) => setTitle(e.target.value)}` |
| `src/components/convene/management/settings/EventSettingsPage.tsx` | 254 | `onChange={(e) => setDescription(e.target.value)}` |
| `src/components/convene/management/settings/EventSettingsPage.tsx` | 326 | `onChange={(e) => setMaxAttendees(e.target.value ? parseInt(e.target.value) : null)}` |
| `src/components/convene/management/settings/EventSettingsPage.tsx` | 420 | `onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}` |
| `src/components/convene/management/settings/EventSettingsPage.tsx` | 594 | `onChange={(e) => setDeleteConfirmText(e.target.value)}` |
| `src/components/convene/management/team/TeamManager.tsx` | 330 | `key={role.value}` |
| `src/components/convene/management/team/TeamManager.tsx` | 468 | `onChange={(e) => setInviteEmail(e.target.value)}` |
| `src/components/convene/management/team/TeamManager.tsx` | 483 | `<SelectItem key={role.value} value={role.value}>` |
| `src/components/convene/management/team/TeamManager.tsx` | 501 | `onChange={(e) => setInviteMessage(e.target.value)}` |
| `src/components/convene/management/team/TeamManager.tsx` | 541 | `setChangingRole(prev => prev ? { ...prev, newRole: value } : null)` |
| `src/components/convene/management/team/TeamManager.tsx` | 549 | `<SelectItem key={role.value} value={role.value}>` |
| `src/components/convey/ConveyDIADiscoveryCard.tsx` | 108 | `// Count reactions on that post` |
| `src/components/convey/ConveyDIADiscoveryCard.tsx` | 109 | `const { count } = await supabase` |
| `src/components/convey/ConveyDIADiscoveryCard.tsx` | 111 | `.select('id', { count: 'exact', head: true })` |
| `src/components/convey/ConveyDIADiscoveryCard.tsx` | 114 | `return count \|\| 0;` |
| `src/components/convey/ConveyEditorialCards.tsx` | 59 | `reactions: { emoji: string; count: number }[]` |
| `src/components/convey/ConveyEditorialCards.tsx` | 73 | `counts[type] = (counts[type] \|\| 0) + r.count;` |
| `src/components/convey/ConveyEditorialCards.tsx` | 326 | `{(story.content?.length \|\| 0) > 300 && '…'}` |
| `src/components/convey/ConveyEditorialCards.tsx` | 396 | `{/* Response count */}` |
| `src/components/convey/ConveyFeedCard.tsx` | 123 | `+{item.focus_areas.length - 2} more` |
| `src/components/convey/ConveyItemForm.tsx` | 110 | `onValueChange={(value) => setValue('type', value as ConveyItemType)}` |
| `src/components/convey/ConveyItemForm.tsx` | 194 | `onValueChange={(value) => setValue('visibility', value as ConveyItemVisibility)}` |
| `src/components/convey/ConveyItemForm.tsx` | 220 | `onValueChange={(value) => setValue('region', value)}` |
| `src/components/convey/ConveyReactionsBar.tsx` | 73 | `{isSelected && count > 0 && (` |
| `src/components/convey/ConveyReactionsBar.tsx` | 74 | `<span className="font-medium text-dna-forest">{count}</span>` |
| `src/components/convey/ConveyReactionsBar.tsx` | 76 | `{!isSelected && count > 0 && (` |
| `src/components/convey/ConveyReactionsBar.tsx` | 77 | `<span className="text-muted-foreground/60">{count}</span>` |
| `src/components/convey/ConveyStoryCard.tsx` | 29 | `reactions: { emoji: ReactionEmoji; count: number }[];` |
| `src/components/convey/ConveyStoryCard.tsx` | 34 | `const totalReactions = reactions.reduce((a, b) => a + b.count, 0);` |
| `src/components/convey/ConveyStoryCard.tsx` | 57 | `{count > 1 && (` |
| `src/components/convey/ConveyStoryCard.tsx` | 58 | `<span className="text-xs text-muted-foreground">{count}</span>` |
| `src/components/convey/ConveyStoryCard.tsx` | 64 | `+{totalReactions - reactions.slice(0, 3).reduce((a, b) => a + b.count, 0)}` |
| `src/components/convey/ConveyStoryCard.tsx` | 307 | `{!story.title && (story.content?.length \|\| 0) > 100 && '...'}` |
| `src/components/convey/ConveyTrendingSection.tsx` | 97 | `{!story.title && (story.content?.length \|\| 0) > (isHero ? 120 : 60) && '...'}` |
| `src/components/convey/CoverImageEditor.tsx` | 84 | `src={value}` |
| `src/components/convey/RichTextEditor.tsx` | 477 | `{/* Word count & reading time */}` |
| `src/components/convey/RichTextEditor.tsx` | 491 | `value={value}` |
| `src/components/convey/RichTextEditor.tsx` | 520 | `value={value}` |
| `src/components/convey/StorySeriesSelect.tsx` | 76 | `onChange={(e) => setNewSeriesName(e.target.value)}` |
| `src/components/convey/StorySeriesSelect.tsx` | 104 | `value={value \|\| ''}` |
| `src/components/convey/StoryTagsInput.tsx` | 74 | `<span className="text-muted-foreground font-normal">({value.length}/{maxTags})</span>` |
| `src/components/convey/StoryTagsInput.tsx` | 104 | `onChange={(e) => setInputValue(e.target.value)}` |
| `src/components/convey/editor/SlashCommandMenu.tsx` | 59 | `export function SlashCommandMenu({ textareaRef, value, cursorPosition, onInsert, onClose }: SlashCommandMenuProps) {` |
| `src/components/demo/StatBox.tsx` | 6 | `export function StatBox({ value, label }: StatBoxProps) {` |
| `src/components/demo/StatBox.tsx` | 13 | `{value}` |
| `src/components/dia/DIAHubSection.tsx` | 94 | `{cards.length}` |
| `src/components/dia/DiaHashtagChip.tsx` | 32 | `const formatCount = (count: number): string => {` |
| `src/components/dia/DiaHashtagChip.tsx` | 33 | `if (count >= 1000000) {` |
| `src/components/dia/DiaHashtagChip.tsx` | 34 | `return `${(count / 1000000).toFixed(1)}M`;` |
| `src/components/dia/DiaHashtagChip.tsx` | 36 | `if (count >= 1000) {` |
| `src/components/dia/DiaHashtagChip.tsx` | 37 | `return `${(count / 1000).toFixed(1)}k`;` |
| `src/components/dia/DiaHashtagChip.tsx` | 39 | `return count.toString();` |
| `src/components/dia/DiaHistory.tsx` | 125 | `+{uniqueQueries.length - 5} more queries` |
| `src/components/dia/DiaHistory.tsx` | 140 | `{uniqueQueries.length} unique queries` |
| `src/components/dia/DiaProfileCard.tsx` | 173 | `+{skills.length - 3}` |
| `src/components/dia/DiaSearch.tsx` | 664 | `onChange={(e) => setQuery(e.target.value)}` |
| `src/components/dia/DiaSearch.tsx` | 779 | `Show {citations.length - 5} more sources` |
| `src/components/dia/DiaStoryCard.tsx` | 58 | `const formatCount = (count: number): string => {` |
| `src/components/dia/DiaStoryCard.tsx` | 59 | `if (count >= 1000000) {` |
| `src/components/dia/DiaStoryCard.tsx` | 60 | `return `${(count / 1000000).toFixed(1)}M`;` |
| `src/components/dia/DiaStoryCard.tsx` | 62 | `if (count >= 1000) {` |
| `src/components/dia/DiaStoryCard.tsx` | 63 | `return `${(count / 1000).toFixed(1)}k`;` |
| `src/components/dia/DiaStoryCard.tsx` | 65 | `return count.toString();` |
| `src/components/dia/DiaStoryCard.tsx` | 184 | `+{hashtags.length - 4}` |
| `src/components/events/CreateEventDialog.tsx` | 207 | `onChange={(e) => setFormData({ ...formData, title: e.target.value })}` |
| `src/components/events/CreateEventDialog.tsx` | 218 | `onChange={(e) => setFormData({ ...formData, description: e.target.value })}` |
| `src/components/events/CreateEventDialog.tsx` | 223 | `{formData.description.length}/5000` |
| `src/components/events/CreateEventDialog.tsx` | 232 | `onValueChange={(value) => setFormData({ ...formData, event_type: value as EventType })}` |
| `src/components/events/CreateEventDialog.tsx` | 253 | `onValueChange={(value) => setFormData({ ...formData, format: value as EventFormat })}` |
| `src/components/events/CreateEventDialog.tsx` | 277 | `onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}` |
| `src/components/events/CreateEventDialog.tsx` | 287 | `onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}` |
| `src/components/events/CreateEventDialog.tsx` | 300 | `onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}` |
| `src/components/events/CreateEventDialog.tsx` | 319 | `setFormData({ ...formData, location_city: value, location_country: '' });` |
| `src/components/events/CreateEventDialog.tsx` | 336 | `onChange={(e) => setFormData({ ...formData, meeting_url: e.target.value })}` |
| `src/components/events/checkin/Scanner.tsx` | 63 | `<select className="border rounded px-2 py-1 text-sm" value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>` |
| `src/components/feed/CommentDrawer.tsx` | 305 | `onChange={(e) => setNewComment(e.target.value)}` |
| `src/components/feed/CommentSection.tsx` | 68 | `message: `${profile?.full_name \|\| 'Someone'} commented: "${content.slice(0, 100)}${content.length > 100 ? '...' : ''}"`,` |
| `src/components/feed/CommentSection.tsx` | 81 | `queryClient.invalidateQueries({ queryKey: ['post-comments-count', postId] });` |
| `src/components/feed/CommentSection.tsx` | 145 | `// Like count will be fetched in CommentItem, but for sorting we need it here` |
| `src/components/feed/CommentSection.tsx` | 146 | `// For now, sort by created_at for newest, will enhance with like count later` |
| `src/components/feed/CommentSection.tsx` | 213 | `{comments.length} comment{comments.length !== 1 ? 's' : ''}` |
| `src/components/feed/CommentSection.tsx` | 267 | `// Fetch like count` |
| `src/components/feed/CommentSection.tsx` | 269 | `queryKey: ['comment-likes-count', comment.id],` |
| `src/components/feed/CommentSection.tsx` | 271 | `const { count } = await supabase` |
| `src/components/feed/CommentSection.tsx` | 273 | `.select('id', { count: 'exact' })` |
| `src/components/feed/CommentSection.tsx` | 275 | `return count \|\| 0;` |
| `src/components/feed/CommentSection.tsx` | 313 | `queryClient.invalidateQueries({ queryKey: ['comment-likes-count', comment.id] });` |
| `src/components/feed/CreatePost.tsx` | 222 | `Drafts {drafts && drafts.length > 0 && `(${drafts.length})`}` |
| `src/components/feed/EditPostDialog.tsx` | 78 | `onChange={(e) => setContent(e.target.value)}` |
| `src/components/feed/EditPostDialog.tsx` | 90 | `{content.length}/{MAX_CHARS} characters` |
| `src/components/feed/FeedGreeting.tsx` | 25 | `// Get count of new posts from connections since yesterday` |
| `src/components/feed/FeedGreeting.tsx` | 26 | `const { count } = await supabase` |
| `src/components/feed/FeedGreeting.tsx` | 28 | `.select('id', { count: 'exact', head: true })` |
| `src/components/feed/FeedGreeting.tsx` | 31 | `return { newPosts: count \|\| 0 };` |
| `src/components/feed/FeedHeroGreeting.tsx` | 32 | `supabase.from('events').select('id', { count: 'exact', head: true }).gte('start_time', new Date().toISOString()).eq('is_published', true),` |
| `src/components/feed/FeedHeroGreeting.tsx` | 33 | `supabase.from('connections').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo).eq('status', 'accepted'),` |
| `src/components/feed/FeedHeroGreeting.tsx` | 34 | `supabase.from('posts').select('id', { count: 'exact', head: true }).gte('created_at', dayAgo),` |
| `src/components/feed/FeedHeroGreeting.tsx` | 38 | `upcomingEvents: eventsRes.count \|\| 0,` |
| `src/components/feed/FeedHeroGreeting.tsx` | 39 | `newConnections: connectionsRes.count \|\| 0,` |
| `src/components/feed/FeedHeroGreeting.tsx` | 40 | `newPosts: postsRes.count \|\| 0,` |
| `src/components/feed/FeedLeftPanel.tsx` | 32 | `supabase.from('connections').select('id', { count: 'exact', head: true }).or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`).eq('status', 'accepted'),` |
| `src/components/feed/FeedLeftPanel.tsx` | 33 | `supabase.from('event_attendees').select('id', { count: 'exact', head: true }).eq('user_id', user.id),` |
| `src/components/feed/FeedLeftPanel.tsx` | 34 | `supabase.from('collaboration_memberships').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active'),` |
| `src/components/feed/FeedLeftPanel.tsx` | 35 | `supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', user.id),` |
| `src/components/feed/FeedLeftPanel.tsx` | 39 | `connections: connections.count \|\| 0,` |
| `src/components/feed/FeedLeftPanel.tsx` | 40 | `events: events.count \|\| 0,` |
| `src/components/feed/FeedLeftPanel.tsx` | 41 | `spaces: spaces.count \|\| 0,` |
| `src/components/feed/FeedLeftPanel.tsx` | 42 | `stories: posts.count \|\| 0,` |
| `src/components/feed/FeedLeftPanel.tsx` | 57 | `{ icon: Users, count: stats?.connections \|\| 0, label: 'Connections', color: 'text-dna-emerald' },` |
| `src/components/feed/FeedLeftPanel.tsx` | 58 | `{ icon: Calendar, count: stats?.events \|\| 0, label: 'Events', color: 'text-dna-gold' },` |
| `src/components/feed/FeedLeftPanel.tsx` | 59 | `{ icon: Layers, count: stats?.spaces \|\| 0, label: 'Spaces', color: 'text-dna-forest' },` |
| `src/components/feed/FeedLeftPanel.tsx` | 60 | `{ icon: BookOpen, count: stats?.stories \|\| 0, label: 'Posts', color: 'text-dna-convey' },` |
| `src/components/feed/FeedLeftPanel.tsx` | 96 | `{fiveCStats.map((stat) => (` |
| `src/components/feed/FeedLeftPanel.tsx` | 97 | `<div key={stat.label} className="text-center">` |
| `src/components/feed/FeedLeftPanel.tsx` | 98 | `<p className="text-sm font-semibold text-foreground">{stat.count}</p>` |
| `src/components/feed/FeedLeftPanel.tsx` | 99 | `<p className="text-[10px] text-muted-foreground leading-tight">{stat.label}</p>` |
| `src/components/feed/FeedSkeleton.tsx` | 199 | `count?: number;` |
| `src/components/feed/FeedSkeleton.tsx` | 204 | `count = 3,` |
| `src/components/feed/FeedSkeleton.tsx` | 209 | `{Array.from({ length: count }).map((_, i) => {` |
| `src/components/feed/FeedUpcomingEvents.tsx` | 117 | `{/* Header with count badge */}` |
| `src/components/feed/FeedUpcomingEvents.tsx` | 124 | `{events.length}` |
| `src/components/feed/HashtagText.tsx` | 28 | `{part.value}` |
| `src/components/feed/HashtagText.tsx` | 32 | `return <span key={index}>{part.value}</span>;` |
| `src/components/feed/MobileFeedTabs.tsx` | 19 | `const TAB_CONFIG: { value: FeedTab; icon: React.ElementType; label: string }[] = [` |
| `src/components/feed/MobileFeedTabs.tsx` | 20 | `{ value: 'all', icon: Newspaper, label: 'All' },` |
| `src/components/feed/MobileFeedTabs.tsx` | 21 | `{ value: 'for_you', icon: Sparkles, label: 'For You' },` |
| `src/components/feed/MobileFeedTabs.tsx` | 22 | `{ value: 'network', icon: Users, label: 'My Network' },` |
| `src/components/feed/MobileFeedTabs.tsx` | 23 | `{ value: 'my_posts', icon: PenSquare, label: 'Mine' },` |
| `src/components/feed/MobileFeedTabs.tsx` | 24 | `{ value: 'bookmarks', icon: Bookmark, label: 'Saved' },` |
| `src/components/feed/MobileFeedTabs.tsx` | 30 | `{TAB_CONFIG.map(({ value, icon: Icon, label }) => {` |
| `src/components/feed/MobileProfileCompletionBanner.tsx` | 87 | `const particleCount = 40 * (timeLeft / duration); // Reduced particle count` |
| `src/components/feed/NewPostsIndicator.tsx` | 4 | `* Floating pill at top of feed showing new post count.` |
| `src/components/feed/NewPostsIndicator.tsx` | 18 | `count: number;` |
| `src/components/feed/NewPostsIndicator.tsx` | 28 | `count,` |
| `src/components/feed/NewPostsIndicator.tsx` | 50 | `{count} new {count === 1 ? 'post' : 'posts'}` |
| `src/components/feed/PostCard.tsx` | 80 | `// Fetch like count and status` |
| `src/components/feed/PostCard.tsx` | 82 | `queryKey: ['post-likes-count', post.id],` |
| `src/components/feed/PostCard.tsx` | 84 | `const { count } = await supabase` |
| `src/components/feed/PostCard.tsx` | 86 | `.select('id', { count: 'exact' })` |
| `src/components/feed/PostCard.tsx` | 88 | `return count \|\| 0;` |
| `src/components/feed/PostCard.tsx` | 107 | `// Fetch comment count` |
| `src/components/feed/PostCard.tsx` | 109 | `queryKey: ['post-comments-count', post.id],` |
| `src/components/feed/PostCard.tsx` | 111 | `const { count } = await supabase` |
| `src/components/feed/PostCard.tsx` | 113 | `.select('id', { count: 'exact' })` |
| `src/components/feed/PostCard.tsx` | 115 | `return count \|\| 0;` |
| `src/components/feed/PostCard.tsx` | 119 | `// Fetch share count` |
| `src/components/feed/PostCard.tsx` | 121 | `queryKey: ['post-shares-count', post.id],` |
| `src/components/feed/PostCard.tsx` | 123 | `const { count } = await supabase` |
| `src/components/feed/PostCard.tsx` | 125 | `.select('id', { count: 'exact' })` |
| `src/components/feed/PostCard.tsx` | 127 | `return count \|\| 0;` |
| `src/components/feed/PostCard.tsx` | 180 | `queryClient.invalidateQueries({ queryKey: ['post-likes-count', post.id] });` |
| `src/components/feed/PostCard.tsx` | 235 | `queryClient.invalidateQueries({ queryKey: ['post-shares-count', post.id] });` |
| `src/components/feed/PostComments.tsx` | 26 | `onCommentCountChange?: (count: number) => void;` |
| `src/components/feed/PostComments.tsx` | 153 | `{comments.length \|\| initialCount}` |
| `src/components/feed/PostComments.tsx` | 214 | `onChange={(e) => setNewComment(e.target.value)}` |
| `src/components/feed/ReshareDialog.tsx` | 96 | `onChange={(e) => setCommentary(e.target.value)}` |
| `src/components/feed/ReshareDialog.tsx` | 106 | `{commentary.length}/{MAX_CHARS} characters` |
| `src/components/feed/SearchDialog.tsx` | 59 | `onChange={(e) => setQuery(e.target.value)}` |
| `src/components/feed/SearchDialog.tsx` | 86 | `{[filters.postType, filters.dateFrom, filters.dateTo].filter(Boolean).length}` |
| `src/components/feed/SearchDialog.tsx` | 182 | `Found {results.length} result{results.length !== 1 ? 's' : ''}` |
| `src/components/feed/ShareMenu.tsx` | 188 | `onChange={(e) => setCommentary(e.target.value)}` |
| `src/components/feed/ShareMenu.tsx` | 194 | `{commentary.length}/500` |
| `src/components/feed/UniversalFeedInfinite.tsx` | 68 | `queryKey: ['connection-count', viewerId],` |
| `src/components/feed/UniversalFeedInfinite.tsx` | 70 | `const { count, error } = await supabase` |
| `src/components/feed/UniversalFeedInfinite.tsx` | 72 | `.select('id', { count: 'exact' })` |
| `src/components/feed/UniversalFeedInfinite.tsx` | 77 | `return count \|\| 0;` |
| `src/components/feed/UniversalFeedItem.tsx` | 40 | `// count items uniformly across All / For You / Mine.` |
| `src/components/feed/cards/EventCard.tsx` | 268 | `{description.length > 150 && '...'}` |
| `src/components/feed/cards/EventCard.tsx` | 349 | `+{speakers.length - 3} more` |
| `src/components/feed/cards/MemberSpotlightCard.tsx` | 104 | `+{member.sectors.length - 4}` |
| `src/components/feed/cards/StoryCard.tsx` | 156 | `<span>{item.gallery_urls.length} photos</span>` |
| `src/components/feed/dialogs/ReshareDialog.tsx` | 88 | `onChange={(e) => setCommentary(e.target.value)}` |
| `src/components/feed/dialogs/ReshareDialog.tsx` | 93 | `{commentary.length}/500` |
| `src/components/feedback/FeedbackAdminControls.tsx` | 57 | `const STATUS_OPTIONS: { value: FeedbackStatus; label: string; icon: React.ReactNode }[] = [` |
| `src/components/feedback/FeedbackAdminControls.tsx` | 58 | `{ value: 'open', label: 'Open', icon: <CircleDot className="h-4 w-4 text-blue-500" /> },` |
| `src/components/feedback/FeedbackAdminControls.tsx` | 59 | `{ value: 'acknowledged', label: 'Acknowledged', icon: <CircleDot className="h-4 w-4 text-purple-500" /> },` |
| `src/components/feedback/FeedbackAdminControls.tsx` | 60 | `{ value: 'in_progress', label: 'In Progress', icon: <Clock className="h-4 w-4 text-yellow-500" /> },` |
| `src/components/feedback/FeedbackAdminControls.tsx` | 61 | `{ value: 'resolved', label: 'Resolved', icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },` |
| `src/components/feedback/FeedbackAdminControls.tsx` | 62 | `{ value: 'closed', label: 'Closed', icon: <XCircle className="h-4 w-4 text-gray-500" /> },` |
| `src/components/feedback/FeedbackAdminControls.tsx` | 65 | `const CATEGORY_OPTIONS: { value: FeedbackCategory; label: string }[] = [` |
| `src/components/feedback/FeedbackAdminControls.tsx` | 66 | `{ value: 'bug', label: 'Bug' },` |
| `src/components/feedback/FeedbackAdminControls.tsx` | 67 | `{ value: 'feature', label: 'Feature Request' },` |
| `src/components/feedback/FeedbackAdminControls.tsx` | 68 | `{ value: 'ux', label: 'UX Issue' },` |
| `src/components/feedback/FeedbackAdminControls.tsx` | 69 | `{ value: 'general', label: 'General' },` |
| `src/components/feedback/FeedbackAdminControls.tsx` | 70 | `{ value: 'praise', label: 'Praise' },` |
| `src/components/feedback/FeedbackAdminControls.tsx` | 73 | `const PRIORITY_OPTIONS: { value: FeedbackPriority; label: string; icon: React.ReactNode }[] = [` |
| `src/components/feedback/FeedbackAdminControls.tsx` | 74 | `{ value: 'low', label: 'Low', icon: <Flag className="h-4 w-4 text-slate-400" /> },` |
| `src/components/feedback/FeedbackAdminControls.tsx` | 75 | `{ value: 'medium', label: 'Medium', icon: <Flag className="h-4 w-4 text-blue-500" /> },` |
| `src/components/feedback/FeedbackAdminControls.tsx` | 76 | `{ value: 'high', label: 'High', icon: <Flag className="h-4 w-4 text-orange-500" /> },` |
| `src/components/feedback/FeedbackAdminControls.tsx` | 77 | `{ value: 'critical', label: 'Critical', icon: <AlertTriangle className="h-4 w-4 text-red-500" /> },` |
| `src/components/feedback/FeedbackAdminControls.tsx` | 237 | `key={option.value}` |
| `src/components/feedback/FeedbackAdminControls.tsx` | 242 | `className={message.category === option.value ? 'bg-accent' : ''}` |
| `src/components/feedback/FeedbackAnalytics.tsx` | 117 | `{Object.entries(analytics.by_status).map(([status, count]) => (` |
| `src/components/feedback/FeedbackAnalytics.tsx` | 129 | `width: `${analytics.total_messages > 0 ? (count / analytics.total_messages) * 100 : 0}%`,` |
| `src/components/feedback/FeedbackAnalytics.tsx` | 133 | `<span className="text-sm text-muted-foreground w-8 text-right">{count}</span>` |
| `src/components/feedback/FeedbackAnalytics.tsx` | 148 | `{Object.entries(analytics.by_user_tag).map(([tag, count]) => (` |
| `src/components/feedback/FeedbackAnalytics.tsx` | 158 | `width: `${analytics.total_messages > 0 ? (count / analytics.total_messages) * 100 : 0}%`,` |
| `src/components/feedback/FeedbackAnalytics.tsx` | 162 | `<span className="text-sm text-muted-foreground w-8 text-right">{count}</span>` |
| `src/components/feedback/FeedbackAnalytics.tsx` | 192 | `<Badge variant="secondary">{contributor.count} feedbacks</Badge>` |
| `src/components/feedback/FeedbackAnalytics.tsx` | 213 | `const maxCount = Math.max(...analytics.messages_over_time.map(d => d.count));` |
| `src/components/feedback/FeedbackAnalytics.tsx` | 214 | `const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;` |
| `src/components/feedback/FeedbackAnalytics.tsx` | 220 | `title={`${day.date}: ${day.count} feedback${day.count !== 1 ? 's' : ''}`}` |
| `src/components/feedback/FeedbackAnalytics.tsx` | 227 | `<span>{analytics.messages_over_time[analytics.messages_over_time.length - 1]?.date}</span>` |
| `src/components/feedback/FeedbackMediaUpload.tsx` | 48 | `// Check total count` |
| `src/components/feedback/FeedbackMediaUpload.tsx` | 86 | `disabled={disabled \|\| selectedFiles.length >= maxFiles}` |
| `src/components/feedback/FeedbackMessage.tsx` | 116 | `const count = reaction?.count \|\| 0;` |
| `src/components/feedback/FeedbackMessage.tsx` | 134 | `{count > 0 && <span className="font-medium">{count}</span>}` |
| `src/components/feedback/FeedbackTagSelector.tsx` | 15 | `export function FeedbackTagSelector({ value, onChange, disabled }: FeedbackTagSelectorProps) {` |
| `src/components/groups/CreateGroupDialog.tsx` | 171 | `onChange={(e) => handleNameChange(e.target.value)}` |
| `src/components/groups/CreateGroupDialog.tsx` | 187 | `onChange={(e) => setFormData({ ...formData, description: e.target.value })}` |
| `src/components/groups/CreateGroupDialog.tsx` | 198 | `onValueChange={(value) => setFormData({ ...formData, privacy: value as GroupPrivacy })}` |
| `src/components/groups/CreateGroupDialog.tsx` | 230 | `onValueChange={(value) => setFormData({ ...formData, join_policy: value as GroupJoinPolicy })}` |
| `src/components/groups/CreateGroupDialog.tsx` | 263 | `onValueChange={(value) => setFormData({ ...formData, category: value })}` |
| `src/components/groups/CreateGroupDialog.tsx` | 288 | `onChange={(e) => setFormData({ ...formData, location: e.target.value })}` |
| `src/components/groups/GroupJoinRequests.tsx` | 137 | `Pending Join Requests ({requests.length})` |
| `src/components/groups/GroupPostComments.tsx` | 231 | `onChange={(e) => setNewComment(e.target.value)}` |
| `src/components/hashtag/HashtagStatsGrid.tsx` | 14 | `const formatCount = (count: number): string => {` |
| `src/components/hashtag/HashtagStatsGrid.tsx` | 15 | `if (count >= 1000000) {` |
| `src/components/hashtag/HashtagStatsGrid.tsx` | 16 | `return `${(count / 1000000).toFixed(1)}M`;` |
| `src/components/hashtag/HashtagStatsGrid.tsx` | 18 | `if (count >= 1000) {` |
| `src/components/hashtag/HashtagStatsGrid.tsx` | 19 | `return `${(count / 1000).toFixed(1)}K`;` |
| `src/components/hashtag/HashtagStatsGrid.tsx` | 21 | `return count.toLocaleString();` |
| `src/components/hubs/shared/HostApplicationModal.tsx` | 47 | `setFormData(prev => ({ ...prev, [field]: value }));` |
| `src/components/hubs/shared/HostApplicationModal.tsx` | 168 | `onChange={(e) => handleChange('name', e.target.value)}` |
| `src/components/hubs/shared/HostApplicationModal.tsx` | 181 | `onChange={(e) => handleChange('email', e.target.value)}` |
| `src/components/hubs/shared/HostApplicationModal.tsx` | 195 | `onChange={(e) => handleChange('organization', e.target.value)}` |
| `src/components/hubs/shared/HostApplicationModal.tsx` | 206 | `onChange={(e) => handleChange('concept', e.target.value)}` |
| `src/components/hubs/shared/HostApplicationModal.tsx` | 217 | `onValueChange={(value) => handleChange('audienceSize', value)}` |
| `src/components/hubs/shared/HostApplicationModal.tsx` | 238 | `onChange={(e) => handleChange('experience', e.target.value)}` |
| `src/components/hubs/shared/HubDIAPanel.tsx` | 73 | `{visibleRecommendations.length}` |
| `src/components/hubs/shared/HubStatsBar.tsx` | 22 | `function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {` |
| `src/components/hubs/shared/HubStatsBar.tsx` | 57 | `stats.length === 4 ? 'grid-cols-2 md:grid-cols-4' : `grid-cols-2 md:grid-cols-${stats.length}`,` |
| `src/components/hubs/shared/HubStatsBar.tsx` | 61 | `{stats.map((stat, index) => {` |
| `src/components/hubs/shared/HubStatsBar.tsx` | 62 | `const interactive = !!stat.onClick;` |
| `src/components/hubs/shared/HubStatsBar.tsx` | 64 | `const ariaLabel = `${stat.value.toLocaleString()}${stat.suffix ?? ''} ${stat.label}`;` |
| `src/components/hubs/shared/HubStatsBar.tsx` | 70 | `onClick: stat.onClick,` |
| `src/components/hubs/shared/HubStatsBar.tsx` | 84 | `{stat.icon && (` |
| `src/components/hubs/shared/HubStatsBar.tsx` | 85 | `<stat.icon className="w-5 h-5 text-muted-foreground mb-2" />` |
| `src/components/hubs/shared/HubStatsBar.tsx` | 92 | `<AnimatedCounter value={stat.value} />` |
| `src/components/hubs/shared/HubStatsBar.tsx` | 93 | `{stat.suffix && <span className="text-lg">{stat.suffix}</span>}` |
| `src/components/hubs/shared/HubStatsBar.tsx` | 98 | `{stat.label}` |
| `src/components/hubs/shared/NotifyMeModal.tsx` | 173 | `onChange={(e) => setEmail(e.target.value)}` |
| `src/components/hubs/shared/NotifyMeModal.tsx` | 226 | `onChange={(e) => setCity(e.target.value)}` |
| `src/components/identity-hub/HeadlineWizard.tsx` | 186 | `value={value}` |
| `src/components/identity-hub/HeadlineWizard.tsx` | 187 | `onChange={(e) => onChange(e.target.value)}` |
| `src/components/identity-hub/HeadlineWizard.tsx` | 192 | `{value.length}/120 characters` |
| `src/components/identity-hub/ProfileBadges.tsx` | 140 | `{/* Show remaining count if there are hidden badges */}` |
| `src/components/identity-hub/ProfileBadges.tsx` | 143 | `+{badges.filter((b) => b.isDisplayed).length - maxDisplayed} more badges` |
| `src/components/identity-hub/ProfileCompletionChecklist.tsx` | 126 | `View all ({completedItems.length} done, {incompleteItems.length} remaining)` |
| `src/components/location/LocationTypeahead.tsx` | 71 | `onFocus={() => { setFocused(true); if (results.length) setOpen(true); }}` |
| `src/components/messaging/ConversationListPanel.tsx` | 207 | `// Count unread for focused tab` |
| `src/components/messaging/ConversationListPanel.tsx` | 215 | `// Count archived conversations` |
| `src/components/messaging/ConversationListPanel.tsx` | 233 | `description: `${unreadConversations.length} conversation${unreadConversations.length > 1 ? 's' : ''} marked as read`` |
| `src/components/messaging/ConversationListPanel.tsx` | 255 | `title: `Archived ${conversationsToArchive.length} conversation${conversationsToArchive.length > 1 ? 's' : ''}`,` |
| `src/components/messaging/ConversationListPanel.tsx` | 328 | `onChange={(e) => onSearchChange(e.target.value)}` |
| `src/components/messaging/ConversationPicker.tsx` | 110 | `onChange={(e) => setSearch(e.target.value)}` |
| `src/components/messaging/ConversationPicker.tsx` | 184 | `onChange={(e) => setNote(e.target.value)}` |
| `src/components/messaging/CreateGroupDrawer.tsx` | 118 | `onChange={(e) => setGroupName(e.target.value)}` |
| `src/components/messaging/CreateGroupDrawer.tsx` | 130 | `onChange={(e) => setSearchTerm(e.target.value)}` |
| `src/components/messaging/EntitySharePicker.tsx` | 54 | `const TABS: { value: EntityType; label: string; icon: React.ElementType }[] = [` |
| `src/components/messaging/EntitySharePicker.tsx` | 55 | `{ value: 'event', label: 'Events', icon: Calendar },` |
| `src/components/messaging/EntitySharePicker.tsx` | 56 | `{ value: 'space', label: 'Spaces', icon: Users },` |
| `src/components/messaging/EntitySharePicker.tsx` | 57 | `{ value: 'opportunity', label: 'Opportunities', icon: Lightbulb },` |
| `src/components/messaging/EntitySharePicker.tsx` | 58 | `{ value: 'post', label: 'Posts', icon: FileText },` |
| `src/components/messaging/EntitySharePicker.tsx` | 59 | `{ value: 'story', label: 'Stories', icon: BookOpen },` |
| `src/components/messaging/EntitySharePicker.tsx` | 234 | `key={tab.value}` |
| `src/components/messaging/EntitySharePicker.tsx` | 235 | `value={tab.value}` |
| `src/components/messaging/EntitySharePicker.tsx` | 252 | `onChange={(e) => setSearch(e.target.value)}` |
| `src/components/messaging/InboxTabs.tsx` | 31 | `const tabs: { id: InboxTab; label: string; count?: number }[] = [` |
| `src/components/messaging/InboxTabs.tsx` | 32 | `{ id: 'focused', label: 'Focused', count: focusedCount },` |
| `src/components/messaging/InboxTabs.tsx` | 33 | `{ id: 'other', label: 'Other', count: otherCount },` |
| `src/components/messaging/InboxTabs.tsx` | 34 | `{ id: 'requests', label: 'Requests', count: requestsCount },` |
| `src/components/messaging/InboxTabs.tsx` | 35 | `{ id: 'archived', label: 'Archived', count: archivedCount },` |
| `src/components/messaging/InboxTabs.tsx` | 54 | `{tab.count !== undefined && tab.count > 0 && (` |
| `src/components/messaging/InboxTabs.tsx` | 59 | `{tab.count > 99 ? '99+' : tab.count}` |
| `src/components/messaging/InboxTabs.tsx` | 86 | `const tabs: { id: InboxTab; label: string; count?: number }[] = [` |
| `src/components/messaging/InboxTabs.tsx` | 87 | `{ id: 'focused', label: 'All', count: focusedCount },` |
| `src/components/messaging/InboxTabs.tsx` | 88 | `{ id: 'requests', label: 'Requests', count: requestsCount },` |
| `src/components/messaging/InboxTabs.tsx` | 106 | `{tab.count !== undefined && tab.count > 0 && (` |
| `src/components/messaging/InboxTabs.tsx` | 115 | `{tab.count > 99 ? '99+' : tab.count}` |
| `src/components/messaging/MessageComposer.tsx` | 109 | `onChange={(e) => setMessage(e.target.value.slice(0, maxLength))}` |
| `src/components/messaging/MessageRequestBanner.tsx` | 121 | `{previewContent.length > 150 && '...'}` |
| `src/components/messaging/TypingIndicator.tsx` | 18 | `return `${users[0].display_name} and ${users.length - 1} others are typing...`;` |
| `src/components/messaging/group/GroupChatInput.tsx` | 150 | `onChange={(e) => setMessage(e.target.value)}` |
| `src/components/messaging/group/GroupInfoDrawer.tsx` | 116 | `{participants.length} members` |
| `src/components/messaging/group/GroupThreadView.tsx` | 144 | `{participants.length} members` |
| `src/components/messaging/group/MediaLightbox.tsx` | 90 | `{currentIndex + 1} / {images.length}` |
| `src/components/messaging/group/MessageMediaGrid.tsx` | 90 | `<span className="text-white font-semibold text-lg">+{images.length - 4}</span>` |
| `src/components/messaging/inbox/ChatInput.tsx` | 262 | `onChange={(e) => setMessage(e.target.value)}` |
| `src/components/messaging/inbox/ChatThread.tsx` | 176 | `queryClient.invalidateQueries({ queryKey: ['unread-message-count'] });` |
| `src/components/messaging/inbox/MessageReactions.tsx` | 9 | `count: number;` |
| `src/components/messaging/inbox/MessageReactions.tsx` | 91 | `<span className="text-muted-foreground">{reaction.count}</span>` |
| `src/components/mobile/MobileBottomNav.tsx` | 41 | `// Use the RPC count directly - it's the source of truth for unread notifications` |
| `src/components/mobile/MobileSettingsView.tsx` | 159 | `checked={item.value as boolean}` |
| `src/components/mobile/MobileSettingsView.tsx` | 160 | `onCheckedChange={item.onChange as (value: boolean) => void}` |
| `src/components/network/MutualConnections.tsx` | 63 | `{mutualConnections.length} mutual {mutualConnections.length === 1 ? 'connection' : 'connections'}` |
| `src/components/network/NetworkSearch.tsx` | 37 | `onChange={(e) => handleSearch(e.target.value)}` |
| `src/components/notifications/NotificationBell.tsx` | 20 | `// Use the higher of RPC count or list count - ensures we don't show 0 when there are unread` |
| `src/components/notifications/NotificationBell.tsx` | 23 | `// Only show count when greater than 0` |
| `src/components/notifications/NotificationFilterBar.tsx` | 38 | `const count = filter.value !== 'all' ? badgeCounts[filter.value] \|\| 0 : 0;` |
| `src/components/notifications/NotificationFilterBar.tsx` | 56 | `{count > 0 && (` |
| `src/components/notifications/NotificationFilterBar.tsx` | 63 | `{count > 99 ? '99+' : count}` |
| `src/components/notifications/NotificationList.tsx` | 44 | `// Calculate actual unread count from the notifications list` |
| `src/components/notifications/NotificationList.tsx` | 45 | `// This ensures the count shown matches what's displayed, avoiding discrepancies` |
| `src/components/notifications/NotificationList.tsx` | 47 | `// Use the higher of RPC count or list count to ensure we don't miss any` |
| `src/components/notifications/NotificationPreferencesPanel.tsx` | 211 | `{Array.from({ length: 24 }, (_, i) => (` |
| `src/components/notifications/NotificationPreferencesPanel.tsx` | 227 | `{Array.from({ length: 24 }, (_, i) => (` |
| `src/components/notifications/NotificationSystemBell.tsx` | 4 | `* Bell icon with badge count for the navigation bar.` |
| `src/components/notifications/NotificationsDropdown.tsx` | 70 | `queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });` |
| `src/components/notifications/UnifiedNotificationBell.tsx` | 8 | `* Badge shows total unread count from both platform and DIA sources.` |
| `src/components/notifications/UnifiedNotificationFilters.tsx` | 22 | `{ value: 'all', label: 'All', icon: <Bell className="h-3.5 w-3.5" />, color: null },` |
| `src/components/notifications/UnifiedNotificationFilters.tsx` | 23 | `{ value: 'activity', label: 'Activity', icon: <Activity className="h-3.5 w-3.5" />, color: '#4A8D77' },` |
| `src/components/notifications/UnifiedNotificationFilters.tsx` | 24 | `{ value: 'dia', label: 'DIA', icon: <Sparkles className="h-3.5 w-3.5" />, color: '#C4942A' },` |
| `src/components/notifications/UnifiedNotificationFilters.tsx` | 67 | `{count > 0 && (` |
| `src/components/notifications/UnifiedNotificationFilters.tsx` | 76 | `{count > 99 ? '99+' : count}` |
| `src/components/onboarding/FirstTimeWalkthrough.tsx` | 204 | `animate={{ width: `${((currentStep + 1) / walkthroughSteps.length) * 100}%` }}` |
| `src/components/onboarding/FirstTimeWalkthrough.tsx` | 299 | `{/* Step count indicator */}` |
| `src/components/onboarding/FirstTimeWalkthrough.tsx` | 302 | `Step {currentStep + 1} of {walkthroughSteps.length}` |
| `src/components/onboarding/steps/DiasporaOriginStep.tsx` | 50 | `onValueChange={(value) => onUpdate('diaspora_status', value)}` |
| `src/components/onboarding/steps/DiasporaOriginStep.tsx` | 57 | `<SelectItem key={option.value} value={option.value}>` |
| `src/components/onboarding/steps/DiscoveryStep.tsx` | 103 | `onChange={(value) => onUpdate('focus_areas', value)}` |
| `src/components/onboarding/steps/DiscoveryStep.tsx` | 113 | `onChange={(value) => onUpdate('regional_expertise', value)}` |
| `src/components/onboarding/steps/DiscoveryStep.tsx` | 123 | `onChange={(value) => onUpdate('industries', value)}` |
| `src/components/onboarding/steps/IdentityStep.tsx` | 60 | `onChange={(e) => onUpdate('first_name', e.target.value)}` |
| `src/components/onboarding/steps/IdentityStep.tsx` | 74 | `onChange={(e) => onUpdate('last_name', e.target.value)}` |
| `src/components/onboarding/steps/IdentityStep.tsx` | 90 | `onChange={(e) => onUpdate('headline', e.target.value)}` |
| `src/components/onboarding/steps/ProfessionalStep.tsx` | 75 | `onChange={(e) => onUpdate('profession', e.target.value)}` |
| `src/components/onboarding/steps/ProfessionalStep.tsx` | 93 | `onChange={(value) => onUpdate('professional_sectors', value)}` |
| `src/components/onboarding/steps/ProfessionalStep.tsx` | 111 | `onChange={(value) => onUpdate('skills', value)}` |
| `src/components/onboarding/steps/ProfessionalStep.tsx` | 128 | `onValueChange={(value) => onUpdate('years_experience', value)}` |
| `src/components/onboarding/steps/UserTypeStep.tsx` | 126 | `onChange={(e) => onUpdate('organization_name', e.target.value)}` |
| `src/components/onboarding/steps/UserTypeStep.tsx` | 143 | `onChange={(e) => onUpdate('organization_category', e.target.value)}` |
| `src/components/onboarding/steps/UsernameStep.tsx` | 189 | `onChange={(e) => handleInputChange(e.target.value)}` |
| `src/components/posts/CommentItem.tsx` | 158 | `onChange={(e) => setEditContent(e.target.value)}` |
| `src/components/posts/CommentItem.tsx` | 186 | `.filter(([_, count]) => count > 0)` |
| `src/components/posts/EditPostDialog.tsx` | 70 | `onChange={(e) => setContent(e.target.value)}` |
| `src/components/posts/EditPostDialog.tsx` | 76 | `{content.length} characters` |
| `src/components/posts/LikedByModal.tsx` | 42 | `Liked by {likedBy.length} {likedBy.length === 1 ? 'person' : 'people'}` |
| `src/components/posts/PostCard.tsx` | 150 | `// Explicit post_type → badge mapping. Only these values render a chip.` |
| `src/components/posts/PostComments.tsx` | 93 | `onChange={(e) => setNewComment(e.target.value.slice(0, 500))}` |
| `src/components/posts/PostComments.tsx` | 108 | `{newComment.length}/500` |
| `src/components/posts/ReactionSummary.tsx` | 12 | `count: number;` |
| `src/components/posts/ReactionSummary.tsx` | 62 | `{reaction.count}` |
| `src/components/posts/ReactionSummary.tsx` | 79 | `+{reaction.users.length - 5} more` |
| `src/components/posts/ReportDialog.tsx` | 23 | `{ value: 'spam', label: 'Spam or misleading' },` |
| `src/components/posts/ReportDialog.tsx` | 24 | `{ value: 'harassment', label: 'Harassment or bullying' },` |
| `src/components/posts/ReportDialog.tsx` | 25 | `{ value: 'hate_speech', label: 'Hate speech or discrimination' },` |
| `src/components/posts/ReportDialog.tsx` | 26 | `{ value: 'violence', label: 'Violence or threats' },` |
| `src/components/posts/ReportDialog.tsx` | 27 | `{ value: 'inappropriate', label: 'Inappropriate content' },` |
| `src/components/posts/ReportDialog.tsx` | 28 | `{ value: 'misinformation', label: 'False information' },` |
| `src/components/posts/ReportDialog.tsx` | 29 | `{ value: 'other', label: 'Other' },` |
| `src/components/posts/ReportDialog.tsx` | 64 | `<div key={r.value} className="flex items-center space-x-2">` |
| `src/components/posts/ReportDialog.tsx` | 65 | `<RadioGroupItem value={r.value} id={r.value} />` |
| `src/components/posts/ReportDialog.tsx` | 66 | `<Label htmlFor={r.value} className="cursor-pointer">` |
| `src/components/posts/ReportDialog.tsx` | 80 | `onChange={(e) => setDescription(e.target.value)}` |
| `src/components/posts/RepostDialog.tsx` | 83 | `onChange={(e) => setCommentary(e.target.value)}` |
| `src/components/posts/RepostDialog.tsx` | 88 | `{commentary.length}/500` |
| `src/components/posts/ShareDialog.tsx` | 83 | `onChange={(e) => setCommentary(e.target.value)}` |
| `src/components/posts/ShareDialog.tsx` | 88 | `{commentary.length}/500 characters` |
| `src/components/posts/ThreadedComments.tsx` | 130 | `{/* Reply count toggle */}` |
| `src/components/posts/ThreadedComments.tsx` | 141 | `Hide {replies.length} {replies.length === 1 ? 'reply' : 'replies'}` |
| `src/components/posts/ThreadedComments.tsx` | 146 | `View {replies.length} {replies.length === 1 ? 'reply' : 'replies'}` |
| `src/components/posts/ThreadedComments.tsx` | 158 | `onChange={(e) => setNewComment(e.target.value.slice(0, 500))}` |
| `src/components/posts/ThreadedComments.tsx` | 202 | `onChange={(e) => !replyingTo && setNewComment(e.target.value.slice(0, 500))}` |
| `src/components/posts/ThreadedComments.tsx` | 218 | `{newComment.length}/500` |
| `src/components/profile/BannerUploadModal.tsx` | 132 | `let bannerData: { type: 'gradient' \| 'image'; value: string; overlay: boolean } = {` |
| `src/components/profile/HeadlineWizard.tsx` | 120 | `onChange={(e) => onHeadlineChange(e.target.value)}` |
| `src/components/profile/HeadlineWizard.tsx` | 128 | `{headline.length}/150` |
| `src/components/profile/HeadlineWizard.tsx` | 157 | `onChange={(e) => setRole(e.target.value)}` |
| `src/components/profile/HeadlineWizard.tsx` | 180 | `onChange={(e) => setFocus(e.target.value)}` |
| `src/components/profile/HeadlineWizard.tsx` | 208 | `onChange={(e) => setLocationFrom(e.target.value)}` |
| `src/components/profile/HeadlineWizard.tsx` | 216 | `onChange={(e) => setLocationTo(e.target.value)}` |
| `src/components/profile/ImpactRadarChart.tsx` | 54 | `payload: { value: string };` |
| `src/components/profile/ProfileBadges.tsx` | 81 | `{userBadges.length} earned` |
| `src/components/profile/ProfileMissingFields.tsx` | 102 | `+{missingFields.length - maxItems} more fields to complete` |
| `src/components/profile/UsernameManager.tsx` | 153 | `onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}` |
| `src/components/profile/edit/AfricaFocusSection.tsx` | 87 | `onValueChange={(value) => updateFocusArea(index, 'geography', value)}` |
| `src/components/profile/edit/BasicInfoSection.tsx` | 27 | `onChange={(e) => onUpdate('full_name', e.target.value)}` |
| `src/components/profile/edit/BasicInfoSection.tsx` | 42 | `onChange={(e) => onUpdate('headline', e.target.value)}` |
| `src/components/profile/edit/BasicInfoSection.tsx` | 54 | `onChange={(e) => onUpdate('bio', e.target.value)}` |
| `src/components/profile/edit/BasicInfoSection.tsx` | 59 | `{formData.bio?.length \|\| 0}/500 characters` |
| `src/components/profile/edit/BasicInfoSection.tsx` | 70 | `onChange={(e) => onUpdate('current_location', e.target.value)}` |
| `src/components/profile/edit/DiasporaSection.tsx` | 61 | `onValueChange={(value) => onUpdate('diaspora_status', value)}` |
| `src/components/profile/edit/DiasporaSection.tsx` | 69 | `<SelectItem key={option.value} value={option.value}>` |
| `src/components/profile/edit/DiasporaSection.tsx` | 107 | `? `${languages.length} language${languages.length > 1 ? 's' : ''} selected`` |
| `src/components/profile/edit/IntentionsSection.tsx` | 44 | `<div key={option.value} className="flex items-center space-x-2">` |
| `src/components/profile/edit/IntentionsSection.tsx` | 46 | `id={`intention-${option.value}`}` |
| `src/components/profile/edit/IntentionsSection.tsx` | 47 | `checked={selectedIntentions.includes(option.value)}` |
| `src/components/profile/edit/IntentionsSection.tsx` | 48 | `onCheckedChange={() => toggleIntention(option.value)}` |
| `src/components/profile/edit/IntentionsSection.tsx` | 52 | `htmlFor={`intention-${option.value}`}` |
| `src/components/profile/edit/ProfessionalSection.tsx` | 54 | `onChange={(e) => onUpdate('profession', e.target.value)}` |
| `src/components/profile/edit/ProfessionalSection.tsx` | 64 | `onChange={(e) => onUpdate('company', e.target.value)}` |
| `src/components/profile/edit/ProfessionalSection.tsx` | 77 | `onChange={(e) => onUpdate('years_experience', parseInt(e.target.value) \|\| 0)}` |
| `src/components/profile/edit/ProfessionalSection.tsx` | 91 | `onChange={(e) => setNewSkill(e.target.value)}` |
| `src/components/profile/edit/ProfessionalSection.tsx` | 128 | `onChange={(e) => setNewInterest(e.target.value)}` |
| `src/components/profile/edit/SocialLinksSection.tsx` | 58 | `onChange={(e) => onUpdate('linkedin_url', e.target.value)}` |
| `src/components/profile/edit/SocialLinksSection.tsx` | 59 | `onBlur={(e) => handleUrlBlur('linkedin_url', e.target.value)}` |
| `src/components/profile/edit/SocialLinksSection.tsx` | 74 | `onChange={(e) => onUpdate('twitter_url', e.target.value)}` |
| `src/components/profile/edit/SocialLinksSection.tsx` | 75 | `onBlur={(e) => handleUrlBlur('twitter_url', e.target.value)}` |
| `src/components/profile/edit/SocialLinksSection.tsx` | 90 | `onChange={(e) => onUpdate('website_url', e.target.value)}` |
| `src/components/profile/edit/SocialLinksSection.tsx` | 91 | `onBlur={(e) => handleUrlBlur('website_url', e.target.value)}` |
| `src/components/profile/form/ArrayFieldManager.tsx` | 43 | `onChange={(e) => onNewItemChange(e.target.value)}` |
| `src/components/profile/form/BasicInfoSection.tsx` | 41 | `onChange={(e) => onInputChange('full_name', e.target.value)}` |
| `src/components/profile/form/BasicInfoSection.tsx` | 50 | `onChange={(e) => onInputChange('headline', e.target.value)}` |
| `src/components/profile/form/BasicInfoSection.tsx` | 61 | `onChange={(value) => onInputChange('location', value)}` |
| `src/components/profile/form/BasicInfoSection.tsx` | 69 | `onChange={(e) => onInputChange('city', e.target.value)}` |
| `src/components/profile/form/BasicInfoSection.tsx` | 80 | `onChange={(e) => onInputChange('bio', e.target.value)}` |
| `src/components/profile/form/BasicInfoSection.tsx` | 91 | `onChange={(e) => onInputChange('my_dna_statement', e.target.value)}` |
| `src/components/profile/form/LocationAutocomplete.tsx` | 71 | `value={value}` |
| `src/components/profile-edit/ProfileEditBasicInfo.tsx` | 30 | `{ value: 'he/him', label: 'He/Him' },` |
| `src/components/profile-edit/ProfileEditBasicInfo.tsx` | 31 | `{ value: 'she/her', label: 'She/Her' },` |
| `src/components/profile-edit/ProfileEditBasicInfo.tsx` | 32 | `{ value: 'they/them', label: 'They/Them' },` |
| `src/components/profile-edit/ProfileEditBasicInfo.tsx` | 33 | `{ value: 'he/they', label: 'He/They' },` |
| `src/components/profile-edit/ProfileEditBasicInfo.tsx` | 34 | `{ value: 'she/they', label: 'She/They' },` |
| `src/components/profile-edit/ProfileEditBasicInfo.tsx` | 35 | `{ value: 'prefer_not_to_say', label: 'Prefer not to say' },` |
| `src/components/profile-edit/ProfileEditBasicInfo.tsx` | 68 | `onChange={(e) => onFullNameChange(e.target.value)}` |
| `src/components/profile-edit/ProfileEditBasicInfo.tsx` | 85 | `<SelectItem key={option.value} value={option.value}>` |
| `src/components/profile-edit/ProfileEditBasicInfo.tsx` | 111 | `onChange={(e) => onBioChange(e.target.value)}` |
| `src/components/profile-edit/ProfileEditBasicInfo.tsx` | 116 | `<p className={`text-xs ${bio.length > 0 && bio.length < 50 ? 'text-amber-500' : 'text-muted-foreground'}`}>` |
| `src/components/profile-edit/ProfileEditBasicInfo.tsx` | 118 | `? `Add ${50 - bio.length} more characters for a complete bio`` |
| `src/components/profile-edit/ProfileEditBasicInfo.tsx` | 123 | `{bio.length}/2000` |
| `src/components/profile-edit/ProfileEditContact.tsx` | 18 | `{ value: 'platform_message', label: 'DNA Platform Messages', icon: MessageCircle },` |
| `src/components/profile-edit/ProfileEditContact.tsx` | 19 | `{ value: 'email', label: 'Email', icon: Mail },` |
| `src/components/profile-edit/ProfileEditContact.tsx` | 20 | `{ value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },` |
| `src/components/profile-edit/ProfileEditContact.tsx` | 21 | `{ value: 'linkedin', label: 'LinkedIn', icon: Linkedin },` |
| `src/components/profile-edit/ProfileEditContact.tsx` | 25 | `{ value: 'Africa/Lagos', label: 'West Africa (Lagos) - WAT' },` |
| `src/components/profile-edit/ProfileEditContact.tsx` | 26 | `{ value: 'Africa/Nairobi', label: 'East Africa (Nairobi) - EAT' },` |
| `src/components/profile-edit/ProfileEditContact.tsx` | 27 | `{ value: 'Africa/Johannesburg', label: 'South Africa (Johannesburg) - SAST' },` |
| `src/components/profile-edit/ProfileEditContact.tsx` | 28 | `{ value: 'Africa/Cairo', label: 'Egypt (Cairo) - EET' },` |
| `src/components/profile-edit/ProfileEditContact.tsx` | 29 | `{ value: 'Africa/Casablanca', label: 'Morocco (Casablanca) - WET' },` |
| `src/components/profile-edit/ProfileEditContact.tsx` | 30 | `{ value: 'America/New_York', label: 'US Eastern (New York) - EST/EDT' },` |
| `src/components/profile-edit/ProfileEditContact.tsx` | 31 | `{ value: 'America/Chicago', label: 'US Central (Chicago) - CST/CDT' },` |
| `src/components/profile-edit/ProfileEditContact.tsx` | 32 | `{ value: 'America/Denver', label: 'US Mountain (Denver) - MST/MDT' },` |
| `src/components/profile-edit/ProfileEditContact.tsx` | 33 | `{ value: 'America/Los_Angeles', label: 'US Pacific (Los Angeles) - PST/PDT' },` |
| `src/components/profile-edit/ProfileEditContact.tsx` | 34 | `{ value: 'Europe/London', label: 'UK (London) - GMT/BST' },` |
| `src/components/profile-edit/ProfileEditContact.tsx` | 35 | `{ value: 'Europe/Paris', label: 'Central Europe (Paris) - CET/CEST' },` |
| `src/components/profile-edit/ProfileEditContact.tsx` | 36 | `{ value: 'Europe/Berlin', label: 'Germany (Berlin) - CET/CEST' },` |
| `src/components/profile-edit/ProfileEditContact.tsx` | 37 | `{ value: 'Asia/Dubai', label: 'UAE (Dubai) - GST' },` |
| `src/components/profile-edit/ProfileEditContact.tsx` | 38 | `{ value: 'Asia/Singapore', label: 'Singapore - SGT' },` |
| `src/components/profile-edit/ProfileEditContact.tsx` | 39 | `{ value: 'Australia/Sydney', label: 'Australia (Sydney) - AEST/AEDT' },` |
| `src/components/profile-edit/ProfileEditContact.tsx` | 40 | `{ value: 'America/Toronto', label: 'Canada (Toronto) - EST/EDT' },` |
| `src/components/profile-edit/ProfileEditContact.tsx` | 41 | `{ value: 'America/Sao_Paulo', label: 'Brazil (São Paulo) - BRT' },` |
| `src/components/profile-edit/ProfileEditContact.tsx` | 74 | `<SelectItem key={method.value} value={method.value}>` |
| `src/components/profile-edit/ProfileEditContact.tsx` | 95 | `onChange={(e) => onWhatsappChange(e.target.value)}` |
| `src/components/profile-edit/ProfileEditContact.tsx` | 115 | `<SelectItem key={tz.value} value={tz.value}>` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 26 | `{ value: 'platform_message', label: 'DNA Platform Messages', icon: Globe, description: 'Messages within the DNA platform' },` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 27 | `{ value: 'email', label: 'Email', icon: Mail, description: 'Direct email communication' },` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 28 | `{ value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, description: 'WhatsApp messaging' },` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 29 | `{ value: 'linkedin', label: 'LinkedIn', icon: Linkedin, description: 'LinkedIn messages' },` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 33 | `{ value: 'none', label: 'Neither', description: 'Don\'t show any contact number' },` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 34 | `{ value: 'phone', label: 'Phone number', description: 'Show your phone number' },` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 35 | `{ value: 'whatsapp', label: 'WhatsApp number', description: 'Show your WhatsApp number' },` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 39 | `{ value: 'Africa/Lagos', label: 'West Africa (Lagos) - WAT' },` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 40 | `{ value: 'Africa/Nairobi', label: 'East Africa (Nairobi) - EAT' },` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 41 | `{ value: 'Africa/Johannesburg', label: 'South Africa (Johannesburg) - SAST' },` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 42 | `{ value: 'Africa/Cairo', label: 'Egypt (Cairo) - EET' },` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 43 | `{ value: 'Africa/Casablanca', label: 'Morocco (Casablanca) - WET' },` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 44 | `{ value: 'America/New_York', label: 'US Eastern (New York) - EST/EDT' },` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 45 | `{ value: 'America/Chicago', label: 'US Central (Chicago) - CST/CDT' },` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 46 | `{ value: 'America/Denver', label: 'US Mountain (Denver) - MST/MDT' },` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 47 | `{ value: 'America/Los_Angeles', label: 'US Pacific (Los Angeles) - PST/PDT' },` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 48 | `{ value: 'Europe/London', label: 'UK (London) - GMT/BST' },` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 49 | `{ value: 'Europe/Paris', label: 'Central Europe (Paris) - CET/CEST' },` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 50 | `{ value: 'Europe/Berlin', label: 'Germany (Berlin) - CET/CEST' },` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 51 | `{ value: 'Asia/Dubai', label: 'UAE (Dubai) - GST' },` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 52 | `{ value: 'Asia/Singapore', label: 'Singapore - SGT' },` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 53 | `{ value: 'Australia/Sydney', label: 'Australia (Sydney) - AEST/AEDT' },` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 54 | `{ value: 'America/Toronto', label: 'Canada (Toronto) - EST/EDT' },` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 55 | `{ value: 'America/Sao_Paulo', label: 'Brazil (São Paulo) - BRT' },` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 73 | `const digits = value.replace(/\D/g, ''); // Count only digits` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 102 | `<div key={method.value} className="relative">` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 104 | `value={method.value}` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 105 | `id={`contact-${method.value}`}` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 109 | `htmlFor={`contact-${method.value}`}` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 132 | `<div key={option.value} className="relative">` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 134 | `value={option.value}` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 135 | `id={`visibility-${option.value}`}` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 139 | `htmlFor={`visibility-${option.value}`}` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 142 | `{option.value === 'none' && <Globe className="h-5 w-5 text-muted-foreground" />}` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 143 | `{option.value === 'phone' && <Phone className="h-5 w-5 text-muted-foreground" />}` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 144 | `{option.value === 'whatsapp' && <MessageCircle className="h-5 w-5 text-muted-foreground" />}` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 166 | `onChange={(e) => onPhoneNumberChange(e.target.value)}` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 191 | `onChange={(e) => onWhatsappNumberChange(e.target.value)}` |
| `src/components/profile-edit/ProfileEditContactPreferences.tsx` | 217 | `<SelectItem key={tz.value} value={tz.value}>` |
| `src/components/profile-edit/ProfileEditDiaspora.tsx` | 84 | `<SelectItem key={option.value} value={option.value}>` |
| `src/components/profile-edit/ProfileEditDiaspora.tsx` | 136 | `<SelectItem key={option.value} value={option.value}>` |
| `src/components/profile-edit/ProfileEditDiaspora.tsx` | 156 | `<SelectItem key={option.value} value={option.value}>` |
| `src/components/profile-edit/ProfileEditLanguages.tsx` | 105 | `? `${safeLanguages.length} language${safeLanguages.length > 1 ? 's' : ''} selected`` |
| `src/components/profile-edit/ProfileEditOpenTo.tsx` | 12 | `{ value: 'advisory', label: 'Advisory', icon: Lightbulb, description: 'Provide strategic advice and guidance' },` |
| `src/components/profile-edit/ProfileEditOpenTo.tsx` | 13 | `{ value: 'hiring', label: 'Hiring', icon: Briefcase, description: 'Looking to hire talent for your team' },` |
| `src/components/profile-edit/ProfileEditOpenTo.tsx` | 14 | `{ value: 'investing', label: 'Investing', icon: TrendingUp, description: 'Looking to invest in ventures' },` |
| `src/components/profile-edit/ProfileEditOpenTo.tsx` | 15 | `{ value: 'job_seeking', label: 'Job Seeking', icon: Briefcase, description: 'Open to new job opportunities' },` |
| `src/components/profile-edit/ProfileEditOpenTo.tsx` | 16 | `{ value: 'mentoring', label: 'Mentoring', icon: Users, description: 'Guide and support others in their journey' },` |
| `src/components/profile-edit/ProfileEditOpenTo.tsx` | 17 | `{ value: 'partnerships', label: 'Partnerships', icon: Handshake, description: 'Explore business or project partnerships' },` |
| `src/components/profile-edit/ProfileEditOpenTo.tsx` | 18 | `{ value: 'seeking_investment', label: 'Seeking Investment', icon: TrendingUp, description: 'Looking for investment for your venture' },` |
| `src/components/profile-edit/ProfileEditOpenTo.tsx` | 19 | `{ value: 'volunteering', label: 'Volunteering / Pro bono', icon: Heart, description: 'Contribute time and skills for impact' },` |
| `src/components/profile-edit/ProfileEditOpenTo.tsx` | 51 | `key={type.value}` |
| `src/components/profile-edit/ProfileEditOpenTo.tsx` | 52 | `htmlFor={`open-to-${type.value}`}` |
| `src/components/profile-edit/ProfileEditOpenTo.tsx` | 58 | `id={`open-to-${type.value}`}` |
| `src/components/profile-edit/ProfileEditOpenTo.tsx` | 60 | `onCheckedChange={(checked) => handleToggle(type.value, !!checked)}` |
| `src/components/profile-edit/ProfileEditProfessional.tsx` | 90 | `onChange={(e) => onProfessionChange(e.target.value)}` |
| `src/components/profile-edit/ProfileEditProfessional.tsx` | 99 | `onChange={(e) => onCompanyChange(e.target.value)}` |
| `src/components/profile-edit/ProfileEditSocialLinks.tsx` | 57 | `onChange={(e) => onLinkedinChange(e.target.value)}` |
| `src/components/profile-edit/ProfileEditSocialLinks.tsx` | 78 | `onChange={(e) => onTwitterChange(e.target.value)}` |
| `src/components/profile-edit/ProfileEditSocialLinks.tsx` | 99 | `onChange={(e) => onWebsiteChange(e.target.value)}` |
| `src/components/profile-v2/DiasporaFootprint.tsx` | 3 | `* Shows activity counts across the Five C's as icon+count pills.` |
| `src/components/profile-v2/DiasporaFootprint.tsx` | 39 | `.select('id', { count: 'exact', head: true })` |
| `src/components/profile-v2/DiasporaFootprint.tsx` | 42 | `.then(r => r.count ?? 0),` |
| `src/components/profile-v2/DiasporaFootprint.tsx` | 45 | `.select('id', { count: 'exact', head: true })` |
| `src/components/profile-v2/DiasporaFootprint.tsx` | 47 | `.then(r => r.count ?? 0),` |
| `src/components/profile-v2/DiasporaFootprint.tsx` | 50 | `.select('id', { count: 'exact', head: true })` |
| `src/components/profile-v2/DiasporaFootprint.tsx` | 52 | `.then(r => r.count ?? 0),` |
| `src/components/profile-v2/DiasporaFootprint.tsx` | 55 | `.select('id', { count: 'exact', head: true })` |
| `src/components/profile-v2/DiasporaFootprint.tsx` | 57 | `.then(r => r.count ?? 0),` |
| `src/components/profile-v2/DiasporaFootprint.tsx` | 60 | `.select('id', { count: 'exact', head: true })` |
| `src/components/profile-v2/DiasporaFootprint.tsx` | 63 | `.then(r => r.count ?? 0),` |
| `src/components/profile-v2/ProfileV2About.tsx` | 72 | `onChange={(e) => setBioValue(e.target.value)}` |
| `src/components/profile-v2/ProfileV2About.tsx` | 80 | `{bioValue.length}/500` |
| `src/components/profile-v2/ProfileV2Activity.tsx` | 85 | `Spaces ({activity.spaces.length})` |
| `src/components/profile-v2/ProfileV2Activity.tsx` | 119 | `Events ({activity.events.length})` |
| `src/components/profile-v2/ProfileV2Connection.tsx` | 132 | `+{profile.ethnic_heritage.length - 4} more` |
| `src/components/profile-v2/ProfileV2Connection.tsx` | 156 | `+{africanLanguages.length - 5} more` |
| `src/components/profile-v2/ProfileV2Connection.tsx` | 180 | `+{profile.african_causes.length - 4} more` |
| `src/components/profile-v2/ProfileV2Connection.tsx` | 232 | `+{profile.diaspora_networks.length - 4} more` |
| `src/components/profile-v2/ProfileV2Connection.tsx` | 256 | `+{profile.engagement_intentions.length - 4} more` |
| `src/components/profile-v2/ProfileV2Contributions.tsx` | 90 | `onChange={(e) => setNewContribution(e.target.value)}` |
| `src/components/profile-v2/ProfileV2Events.tsx` | 63 | `event_attendees (count)` |
| `src/components/profile-v2/ProfileV2Events.tsx` | 99 | `event_attendees: { count: number }[];` |
| `src/components/profile-v2/ProfileV2Events.tsx` | 124 | `attendee_count: event.event_attendees?.[0]?.count \|\| 0,` |
| `src/components/profile-v2/ProfileV2Events.tsx` | 175 | `event_attendees (count)` |
| `src/components/profile-v2/ProfileV2Events.tsx` | 211 | `event_attendees: { count: number }[];` |
| `src/components/profile-v2/ProfileV2Events.tsx` | 237 | `attendee_count: event.event_attendees?.[0]?.count \|\| 0,` |
| `src/components/profile-v2/ProfileV2Events.tsx` | 338 | `Upcoming ({upcoming.length})` |
| `src/components/profile-v2/ProfileV2Events.tsx` | 355 | `Past ({past.length})` |
| `src/components/profile-v2/ProfileV2Interests.tsx` | 96 | `onChange={(e) => setNewInterest(e.target.value)}` |
| `src/components/profile-v2/ProfileV2Opportunities.tsx` | 127 | `offers:contribution_offers(count)` |
| `src/components/profile-v2/ProfileV2Opportunities.tsx` | 149 | `offers: { count: number }[];` |
| `src/components/profile-v2/ProfileV2Opportunities.tsx` | 159 | `offer_count: item.offers?.[0]?.count \|\| 0,` |
| `src/components/profile-v2/ProfileV2QuickStats.tsx` | 3 | `* Replaces verbose DNA Activity with clickable stat badges` |
| `src/components/profile-v2/ProfileV2QuickStats.tsx` | 22 | `count: number;` |
| `src/components/profile-v2/ProfileV2QuickStats.tsx` | 31 | `count,` |
| `src/components/profile-v2/ProfileV2QuickStats.tsx` | 53 | `{count}` |
| `src/components/profile-v2/ProfileV2QuickStats.tsx` | 97 | `count: activity.connections_count \|\| 0,` |
| `src/components/profile-v2/ProfileV2QuickStats.tsx` | 105 | `count: activity.stories_count \|\| 0,` |
| `src/components/profile-v2/ProfileV2QuickStats.tsx` | 114 | `count: activity.spaces?.length \|\| 0,` |
| `src/components/profile-v2/ProfileV2QuickStats.tsx` | 122 | `count: activity.events_count ?? activity.events?.length ?? 0,` |
| `src/components/profile-v2/ProfileV2QuickStats.tsx` | 134 | `{stats.map((stat) => (` |
| `src/components/profile-v2/ProfileV2QuickStats.tsx` | 136 | `key={stat.label}` |
| `src/components/profile-v2/ProfileV2Skills.tsx` | 90 | `onChange={(e) => setNewSkill(e.target.value)}` |
| `src/components/profile-v2/ProfileV2Spaces.tsx` | 213 | `+{space.focus_areas.length - 3}` |
| `src/components/profile-v2/PublicProfileLandingView.tsx` | 53 | `{lineIndex < arr.length - 1 && <br />}` |
| `src/components/profile-v2/PublicProfileLandingView.tsx` | 273 | `{/* Member Badge with Connection Count */}` |
| `src/components/pulse/PulseDockItem.tsx` | 38 | `const count =` |
| `src/components/pulse/PulseDockItem.tsx` | 39 | `pulseData && 'count' in pulseData` |
| `src/components/pulse/PulseDockItem.tsx` | 40 | `? pulseData.count` |
| `src/components/pulse/PulseDockItem.tsx` | 109 | `{count > 0 && !isActive && (` |
| `src/components/pulse/PulseDockItem.tsx` | 111 | `{Array.from({ length: Math.min(count, 3) }).map((_, i) => (` |
| `src/components/pulse/PulseDockTray.tsx` | 53 | `return { status: 'active', micro_text: 'Ask DIA', count: 0 };` |
| `src/components/pulse/PulseDockTray.tsx` | 56 | `count: pulseNav.messages.unreadCount,` |
| `src/components/pulse/PulseDockTray.tsx` | 65 | `count: pulseNav.notifications.unreadCount,` |
| `src/components/pulse/PulseItem.tsx` | 71 | `const count = data?.count \|\| 0;` |
| `src/components/pulse/PulseItem.tsx` | 76 | `// Calculate activity dots (1-5 based on count)` |
| `src/components/pulse/PulseItem.tsx` | 77 | `const activityLevel = Math.min(Math.max(count, 0), 5);` |
| `src/components/pulse/PulseItem.tsx` | 178 | `{/* Count badge when active */}` |
| `src/components/pulse/PulseItem.tsx` | 179 | `{count > 0 && (` |
| `src/components/pulse/PulseItem.tsx` | 184 | `{count}` |
| `src/components/pulse/PulseTrayItem.tsx` | 44 | `const count = pulseData?.count \|\| 0;` |
| `src/components/pulse/PulseTrayItem.tsx` | 59 | `{count > 0 && (` |
| `src/components/pulse/PulseTrayItem.tsx` | 61 | `{count > 9 ? '9+' : count}` |
| `src/components/releases/NewFeaturePill.tsx` | 3 | `* Header navigation element that shows count of new features (last 30 days)` |
| `src/components/releases/NewFeaturePill.tsx` | 20 | `const { data: count = 0, isLoading } = useFeaturedCount();` |
| `src/components/releases/NewFeaturePill.tsx` | 23 | `if (isLoading \|\| count === 0) return null;` |
| `src/components/releases/NewFeaturePill.tsx` | 52 | `{/* Count badge */}` |
| `src/components/releases/NewFeaturePill.tsx` | 54 | `{count}` |
| `src/components/releases/NewFeaturePill.tsx` | 68 | `const { data: count = 0, isLoading } = useFeaturedCount();` |
| `src/components/releases/NewFeaturePill.tsx` | 70 | `if (isLoading \|\| count === 0) {` |
| `src/components/releases/NewFeaturePill.tsx` | 86 | `aria-label={`${count} new features`}` |
| `src/components/releases/NewFeaturePill.tsx` | 90 | `{/* Count indicator */}` |
| `src/components/releases/NewFeaturePill.tsx` | 91 | `{count > 0 && (` |
| `src/components/releases/NewFeaturePill.tsx` | 102 | `{count > 9 ? '9+' : count}` |
| `src/components/releases/ReleaseCard.tsx` | 143 | `+{release.features.length - 3} more` |
| `src/components/releases/ReleaseFilters.tsx` | 18 | `const FILTER_TABS: { value: ReleaseFilterType; label: string }[] = [` |
| `src/components/releases/ReleaseFilters.tsx` | 19 | `{ value: 'all', label: 'All' },` |
| `src/components/releases/ReleaseFilters.tsx` | 20 | `{ value: 'featured', label: 'New (30d)' },` |
| `src/components/releases/ReleaseFilters.tsx` | 21 | `{ value: 'recent', label: 'Recent (90d)' },` |
| `src/components/releases/ReleaseFilters.tsx` | 22 | `{ value: 'archived', label: 'Archived' },` |
| `src/components/releases/ReleaseFilters.tsx` | 53 | `onFiltersChange({ ...filters, search: value \|\| undefined });` |
| `src/components/releases/ReleaseFilters.tsx` | 77 | `onChange={(e) => handleSearchChange(e.target.value)}` |
| `src/components/right-rail/DiaDailyBrief.tsx` | 108 | `{Array.from({ length: 3 }).map((_, i) => (` |
| `src/components/right-rail/PulseCompass.tsx` | 18 | `const TIME_OPTIONS: { value: PulseTimeRange; label: string }[] = [` |
| `src/components/right-rail/PulseCompass.tsx` | 19 | `{ value: '24h', label: '24h' },` |
| `src/components/right-rail/PulseCompass.tsx` | 20 | `{ value: '7d', label: '7d' },` |
| `src/components/right-rail/PulseCompass.tsx` | 21 | `{ value: '30d', label: '30d' },` |
| `src/components/right-rail/PulseCompass.tsx` | 24 | `const SCOPE_OPTIONS: { value: PulseScope; label: string }[] = [` |
| `src/components/right-rail/PulseCompass.tsx` | 25 | `{ value: 'platform', label: 'Network' },` |
| `src/components/right-rail/PulseCompass.tsx` | 26 | `{ value: 'user', label: 'You' },` |
| `src/components/right-rail/PulseCompass.tsx` | 78 | `const count = byModule.get(m)?.event_count ?? 0;` |
| `src/components/right-rail/PulseCompass.tsx` | 79 | `const normalized = isEmpty ? 0.06 : count / max;` |
| `src/components/right-rail/PulseCompass.tsx` | 192 | `const count = slice?.event_count ?? 0;` |
| `src/components/right-rail/PulseCompass.tsx` | 193 | `const normalized = isEmpty ? 0.06 : Math.max(0.04, count / max);` |
| `src/components/right-rail/PulseCompass.tsx` | 229 | `aria-label={`${visual.label}: ${count} events`}` |
| `src/components/right-rail/PulseCompass.tsx` | 237 | `eventCount={count}` |
| `src/components/right-rail/PulseCompass.tsx` | 261 | `{/* Compact stat strip */}` |
| `src/components/right-rail/PulseCompass.tsx` | 277 | `{compactNumber(count)}` |
| `src/components/right-rail/PulseCompass.tsx` | 324 | `options: { value: T; label: string }[];` |
| `src/components/right-rail/PulseCompass.tsx` | 329 | `function SegmentedToggle<T extends string>({ value, onChange, options, ariaLabel, full }: SegmentedToggleProps<T>) {` |
| `src/components/right-rail/PulseCompass.tsx` | 410 | `<p className="text-base font-semibold">{compactNumber(value)}</p>` |
| `src/components/right-rail/PulseCompass.tsx` | 415 | `{tile(labels.first, firstValue, routes.first)}` |
| `src/components/right-rail/PulseCompass.tsx` | 416 | `{tile(labels.second, secondValue, routes.second)}` |
| `src/components/right-rail/TrendingInDna.tsx` | 14 | `const RANGE_OPTIONS: { value: '24h' \| '7d' \| '30d'; label: string }[] = [` |
| `src/components/right-rail/TrendingInDna.tsx` | 15 | `{ value: '24h', label: '24h' },` |
| `src/components/right-rail/TrendingInDna.tsx` | 16 | `{ value: '7d', label: '7d' },` |
| `src/components/right-rail/TrendingInDna.tsx` | 17 | `{ value: '30d', label: '30d' },` |
| `src/components/right-rail/TrendingInDna.tsx` | 72 | `{Array.from({ length: 5 }).map((_, i) => (` |
| `src/components/safety/BlockUserDialog.tsx` | 53 | `<Textarea id="block-reason" placeholder="Why are you blocking this user?" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />` |
| `src/components/safety/ReportDialog.tsx` | 18 | `{ value: 'harassment', label: 'Harassment' },` |
| `src/components/safety/ReportDialog.tsx` | 19 | `{ value: 'spam', label: 'Spam' },` |
| `src/components/safety/ReportDialog.tsx` | 20 | `{ value: 'inappropriate', label: 'Inappropriate' },` |
| `src/components/safety/ReportDialog.tsx` | 21 | `{ value: 'other', label: 'Other' },` |
| `src/components/safety/ReportDialog.tsx` | 68 | `<SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>` |
| `src/components/safety/ReportDialog.tsx` | 73 | `<Textarea placeholder="Details..." value={reason} onChange={(e) => setReason(e.target.value)} rows={4} />` |
| `src/components/search/AdvancedFilters.tsx` | 72 | `{ value: 'relevance', label: 'Most Relevant' },` |
| `src/components/search/AdvancedFilters.tsx` | 73 | `{ value: 'recent', label: 'Most Recent' },` |
| `src/components/search/AdvancedFilters.tsx` | 74 | `{ value: 'popular', label: 'Most Popular' },` |
| `src/components/search/AdvancedFilters.tsx` | 75 | `{ value: 'alphabetical', label: 'Alphabetical' },` |
| `src/components/search/AdvancedFilters.tsx` | 76 | `{ value: 'engagement', label: 'Most Engaged' }` |
| `src/components/search/AdvancedFilters.tsx` | 88 | `// Count active filters` |
| `src/components/search/AdvancedFilters.tsx` | 90 | `let count = 0;` |
| `src/components/search/AdvancedFilters.tsx` | 91 | `if (filters.location?.country) count++;` |
| `src/components/search/AdvancedFilters.tsx` | 92 | `if (filters.dateRange?.start) count++;` |
| `src/components/search/AdvancedFilters.tsx` | 93 | `if (filters.categories?.length) count++;` |
| `src/components/search/AdvancedFilters.tsx` | 94 | `if (filters.experienceLevel?.length) count++;` |
| `src/components/search/AdvancedFilters.tsx` | 95 | `if (filters.availability?.length) count++;` |
| `src/components/search/AdvancedFilters.tsx` | 96 | `if (filters.languages?.length) count++;` |
| `src/components/search/AdvancedFilters.tsx` | 97 | `setActiveFiltersCount(count);` |
| `src/components/search/AdvancedFilters.tsx` | 223 | `location: { ...filters.location, country: value \|\| undefined }` |
| `src/components/search/AdvancedFilters.tsx` | 247 | `location: { ...filters.location, city: e.target.value \|\| undefined }` |
| `src/components/search/AdvancedFilters.tsx` | 407 | `onValueChange={(value) => updateFilters({ sortBy: value })}` |
| `src/components/search/AdvancedFilters.tsx` | 414 | `<SelectItem key={option.value} value={option.value}>` |
| `src/components/search/AdvancedSearch.tsx` | 82 | `setFilters(prev => ({ ...prev, [key]: value }));` |
| `src/components/search/AdvancedSearch.tsx` | 148 | `onChange={(e) => updateFilter('query', e.target.value)}` |
| `src/components/search/AdvancedSearch.tsx` | 166 | `<Select value={filters.industry} onValueChange={(value) => updateFilter('industry', value)}>` |
| `src/components/search/AdvancedSearch.tsx` | 180 | `<Select value={filters.location} onValueChange={(value) => updateFilter('location', value)}>` |
| `src/components/search/AdvancedSearch.tsx` | 198 | `onValueChange={(value) => updateFilter('experience', value)}` |
| `src/components/search/AdvancedSearch.tsx` | 254 | `<Select value={filters.investorType} onValueChange={(value) => updateFilter('investorType', value)}>` |
| `src/components/search/AdvancedSearch.tsx` | 269 | `<Select value={filters.fundingStage} onValueChange={(value) => updateFilter('fundingStage', value)}>` |
| `src/components/search/SearchFeedbackForm.tsx` | 25 | `const { name, value } = e.target;` |
| `src/components/search/SearchFeedbackForm.tsx` | 26 | `setFormData(prev => ({ ...prev, [name]: value }));` |
| `src/components/search/SearchResults.tsx` | 69 | `professionalsCount={results.professionals.length}` |
| `src/components/search/SearchResults.tsx` | 70 | `communitiesCount={results.communities.length}` |
| `src/components/search/SearchResults.tsx` | 71 | `eventsCount={results.events.length}` |
| `src/components/search/results/ProfessionalsResults.tsx` | 117 | `+{professional.skills.length - 4} more` |
| `src/components/shared/StatLink.tsx` | 25 | `as = 'tile',` |
| `src/components/shared/StatLink.tsx` | 37 | `: as === 'chip'` |
| `src/components/stats/AnimatedStatsSection.tsx` | 5 | `const AnimatedStat = ({ value, suffix, label, description, bgGradient, source, sourceUrl }: {` |
| `src/components/stats/AnimatedStatsSection.tsx` | 14 | `const { count, countRef } = useAnimatedCounter({ end: value, duration: 2500 });` |
| `src/components/stats/AnimatedStatsSection.tsx` | 19 | `{count}{suffix}` |
| `src/components/survey/PageSpecificSurvey.tsx` | 208 | `onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}` |
| `src/components/survey/PageSpecificSurvey.tsx` | 218 | `onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}` |
| `src/components/survey/PageSpecificSurvey.tsx` | 234 | `onChange={(e) => setFormData(prev => ({ ...prev, current_experience: e.target.value }))}` |
| `src/components/survey/PageSpecificSurvey.tsx` | 244 | `onValueChange={(value) => setFormData(prev => ({ ...prev, usage_frequency: value }))}` |
| `src/components/survey/PageSpecificSurvey.tsx` | 281 | `onChange={(e) => setFormData(prev => ({ ...prev, interaction_preferences: e.target.value }))}` |
| `src/components/survey/PageSpecificSurvey.tsx` | 297 | `onChange={(e) => setFormData(prev => ({ ...prev, missing_elements: e.target.value }))}` |
| `src/components/survey/PageSpecificSurvey.tsx` | 308 | `onChange={(e) => setFormData(prev => ({ ...prev, improvement_suggestions: e.target.value }))}` |
| `src/components/survey/PageSpecificSurvey.tsx` | 319 | `onChange={(e) => setFormData(prev => ({ ...prev, additional_comments: e.target.value }))}` |
| `src/components/survey/SurveyDialog.tsx` | 142 | `onValueChange={(value) => setFormData(prev => ({ ...prev, age_group: value }))}` |
| `src/components/survey/SurveyDialog.tsx` | 157 | `onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}` |
| `src/components/survey/SurveyDialog.tsx` | 174 | `onChange={(e) => setFormData(prev => ({ ...prev, current_country: e.target.value }))}` |
| `src/components/survey/SurveyDialog.tsx` | 183 | `onChange={(e) => setFormData(prev => ({ ...prev, country_of_origin: e.target.value }))}` |
| `src/components/survey/SurveyDialog.tsx` | 193 | `onValueChange={(value) => setFormData(prev => ({ ...prev, education: value }))}` |
| `src/components/survey/SurveyDialog.tsx` | 209 | `onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}` |
| `src/components/survey/SurveyDialog.tsx` | 246 | `onValueChange={(value) => setFormData(prev => ({ ...prev, participation_frequency: value }))}` |
| `src/components/survey/SurveyDialog.tsx` | 267 | `onChange={(e) => setFormData(prev => ({ ...prev, challenges: e.target.value }))}` |
| `src/components/survey/SurveyDialog.tsx` | 322 | `disabled={formData.valuable_features.length >= 3 && !formData.valuable_features.includes(feature)}` |
| `src/components/survey/SurveyDialog.tsx` | 335 | `onChange={(e) => setFormData(prev => ({ ...prev, motivation: e.target.value }))}` |
| `src/components/survey/SurveyDialog.tsx` | 346 | `onChange={(e) => setFormData(prev => ({ ...prev, concerns: e.target.value }))}` |
| `src/components/survey/SurveyDialog.tsx` | 374 | `onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}` |
| `src/components/survey/SurveyDialog.tsx` | 383 | `onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}` |
| `src/components/survey/SurveyDialog.tsx` | 394 | `onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}` |
| `src/components/survey/SurveyDialog.tsx` | 406 | `onChange={(e) => setFormData(prev => ({ ...prev, additional_comments: e.target.value }))}` |
| `src/components/ui/SearchableCountrySelect.tsx` | 14 | `export default function SearchableCountrySelect({ value, onChange }: SearchableCountrySelectProps) {` |
| `src/components/ui/TagMultiSelect.tsx` | 142 | `<span className={cn(safeSelected.length === 0 && "text-muted-foreground")}>` |
| `src/components/ui/TagMultiSelect.tsx` | 145 | `: `${safeSelected.length} selected${maxItems ? ` (max ${maxItems})` : ''}`` |
| `src/components/ui/chart.tsx` | 140 | `const key = `${labelKey \|\| item.dataKey \|\| item.name \|\| "value"}`` |
| `src/components/ui/chart.tsx` | 150 | `{labelFormatter(value, payload)}` |
| `src/components/ui/chart.tsx` | 159 | `return <div className={cn("font-medium", labelClassName)}>{value}</div>` |
| `src/components/ui/chart.tsx` | 187 | `const key = `${nameKey \|\| item.name \|\| item.dataKey \|\| "value"}`` |
| `src/components/ui/chart.tsx` | 241 | `{item.value.toLocaleString()}` |
| `src/components/ui/chart.tsx` | 287 | `const key = `${nameKey \|\| item.dataKey \|\| "value"}`` |
| `src/components/ui/chart.tsx` | 292 | `key={item.value}` |
| `src/components/ui/comprehensive-location-input.tsx` | 34 | `value={value}` |
| `src/components/ui/progress.tsx` | 35 | `>(({ className, value, size, variant, ...props }, ref) => (` |
| `src/components/ui/progress.tsx` | 43 | `style={{ transform: `translateX(-${100 - (value \|\| 0)}%)` }}` |
| `src/components/ui/tag.tsx` | 6 | `* DNA Tag / Chip Component (Design System PRD)` |
| `src/components/ui/tag.tsx` | 64 | `count: number` |
| `src/components/ui/tag.tsx` | 69 | `const BadgeCount: React.FC<BadgeCountProps> = ({ count, maxCount = 99, className }) => {` |
| `src/components/ui/tag.tsx` | 70 | `if (count <= 0) return null` |
| `src/components/ui/tag.tsx` | 71 | `const display = count > maxCount ? `${maxCount}+` : String(count)` |
| `src/components/uploader/AvatarUploader.tsx` | 13 | `const AvatarUploader: React.FC<AvatarUploaderProps> = ({ value, onUploaded }) => {` |
| `src/components/uploader/AvatarUploader.tsx` | 73 | `src={value \|\| "/placeholder.svg"}` |
| `src/components/waitlist/WaitlistPopup.tsx` | 174 | `onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}` |
| `src/components/waitlist/WaitlistPopup.tsx` | 190 | `onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}` |
| `src/components/waitlist/WaitlistSlideIn.tsx` | 111 | `onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}` |
| `src/components/waitlist/WaitlistSlideIn.tsx` | 127 | `onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}` |
| `src/components/waitlist/WaitlistSlideIn.tsx` | 138 | `onChange={(value) => setFormData(prev => ({ ...prev, location: value }))}` |
