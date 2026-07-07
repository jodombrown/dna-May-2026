import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from "react-router-dom";
import { MESSAGING_ENABLED } from "@/config/featureFlags";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ViewStateProvider } from "@/contexts/ViewStateContext";
import { MessageProvider } from "@/contexts/MessageContext";
import { AccountDrawerProvider } from "@/contexts/AccountDrawerContext";
import { HelmetProvider } from 'react-helmet-async';
import BadgeToastListener from '@/components/notifications/BadgeToastListener';
import BaseLayout from "@/layouts/BaseLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import { usePresenceHeartbeat } from "@/hooks/messaging/usePresenceHeartbeat";
import { ScrollToTop } from "@/components/ScrollToTop";
import React, { Suspense, lazy, useEffect } from "react";
import AfricaSpinner from "@/components/ui/AfricaSpinner";
import { supabase } from "@/integrations/supabase/client";

// Loading fallback for lazy-loaded routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <AfricaSpinner size="lg" showText text="Loading..." />
  </div>
);

// Core pages - eagerly loaded for initial render
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { OnboardingGuard } from "./components/auth/OnboardingGuard";

// Lazy-loaded pages - split into separate chunks
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ResetPasswordComplete = lazy(() => import("./pages/ResetPasswordComplete"));
const EmailChangeComplete = lazy(() => import("./pages/EmailChangeComplete"));
const Reauthenticate = lazy(() => import("./pages/Reauthenticate"));
const InviteAccept = lazy(() => import("./pages/InviteAccept"));
const InviteSignup = lazy(() => import("./pages/InviteSignup"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const DnaMe = lazy(() => import("./pages/dna/Me"));
const MyProfileRedirect = lazy(() => import("./components/routing/MyProfileRedirect"));
const DnaUserDashboard = lazy(() => import("./pages/dna/Username"));
const PublicProfile = lazy(() => import("./pages/dna/PublicProfile"));
const PublicProfilePage = lazy(() => import("./pages/PublicProfilePage"));
const LegacyProfileRedirect = lazy(() => import("./components/routing/LegacyProfileRedirect"));
const LegacyEventRedirect = lazy(() => import("./components/routing/LegacyEventRedirect"));
const PublicPostPage = lazy(() => import("./pages/PublicPostPage"));
const PublicEventPage = lazy(() => import("./pages/PublicEventPage"));
const ProfileV2 = lazy(() => import("./pages/ProfileV2"));
const SavedPostsPage = lazy(() => import("./pages/SavedPostsPage"));
const DnaNetwork = lazy(() => import("./pages/dna/Network"));
const DnaFeed = lazy(() => import("./pages/dna/Feed"));
const HashtagFeed = lazy(() => import("./pages/dna/HashtagFeed"));
const DebugUniversalFeed = lazy(() => import("./pages/dna/DebugUniversalFeed"));
const DnaEvents = lazy(() => import("./pages/dna/Events"));
const DnaMessages = lazy(() => import("./pages/dna/Messages"));
const GroupThreadPage = lazy(() => import("./pages/dna/GroupThread"));
const DnaImpact = lazy(() => import("./pages/dna/Impact"));
const DnaNotifications = lazy(() => import("./pages/dna/Notifications"));
const DnaAnalytics = lazy(() => import("./pages/dna/Analytics"));
const DnaFeedback = lazy(() => import("./pages/dna/feedback/FeedbackPage"));
const Affirm = lazy(() => import("./pages/dna/affirm/Affirm"));
const AttestAffirmation = lazy(() => import("./pages/dna/affirm/AttestAffirmation"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const IconUsageGuide = lazy(() => import("./pages/dna/IconUsageGuide"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const EngagementDashboard = lazy(() => import("./pages/admin/EngagementDashboard"));
const AdminEngagement = lazy(() => import("./pages/admin/AdminEngagement"));
const AdminSignals = lazy(() => import("./pages/admin/AdminSignals"));
const WaitlistManagement = lazy(() => import("./pages/admin/WaitlistManagement"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const PlatformHealth = lazy(() => import("./pages/admin/PlatformHealth"));
const ErrorDashboard = lazy(() => import("./pages/admin/ErrorDashboard"));
const ContentModeration = lazy(() => import("./pages/admin/ContentModeration"));

// New Admin Dashboard Routes
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboardLayout = lazy(() => import("./components/admin/AdminDashboardLayout"));
const AdminDashboardOverview = lazy(() => import("./pages/admin/AdminDashboardOverview"));
const AdminRouteGuard = lazy(() => import("./components/admin/AdminRouteGuard").then(m => ({ default: m.AdminRouteGuard })));

// Static pages  
const About = lazy(() => import("./pages/About"));
const Install = lazy(() => import("./pages/Install"));
const Waitlist = lazy(() => import("./pages/Waitlist"));
const Contact = lazy(() => import("./pages/Contact"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const UserAgreement = lazy(() => import("./pages/UserAgreement"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));

const Convene = lazy(() => import("./pages/Convene"));
// const Roadmap = lazy(() => import("./pages/Roadmap"));
const ConveneCategoryPage = lazy(() => import("./pages/ConveneCategoryPage"));
const FeaturedCalendarsPage = lazy(() => import("./pages/FeaturedCalendarsPage"));
const LocalEventsPage = lazy(() => import("./pages/LocalEventsPage"));
const FactSheetPage = lazy(() => import("./pages/FactSheetPage"));
const PitchDeck = lazy(() => import("./pages/PitchDeck"));
const Manifesto = lazy(() => import("./pages/Manifesto"));
const Demo = lazy(() => import("./pages/Demo"));

// Public marketing pages (Five C's examples)
const ConnectExample = lazy(() => import("./pages/_archived/ConnectExample"));
const CollaborateExample = lazy(() => import("./pages/_archived/CollaborationsExample"));
const ContributeExample = lazy(() => import("./pages/_archived/ContributeExample"));
const ConveyExample = lazy(() => import("./pages/_archived/ConveyExample"));
const DesignSystem = lazy(() => import("./pages/DesignSystem"));
const FeaturesHub = lazy(() => import("./pages/documentation/FeaturesHub"));
const FeatureDetail = lazy(() => import("./pages/documentation/FeatureDetail"));

// Releases & Features pages
const ReleasesIndex = lazy(() => import("./pages/releases/ReleasesIndex"));
const ReleaseDetail = lazy(() => import("./pages/releases/ReleaseDetail"));
const ArchivedFeaturesIndex = lazy(() => import("./pages/features/archived/ArchivedFeaturesIndex"));
const ArchivedFeatureDetail = lazy(() => import("./pages/features/archived/ArchivedFeatureDetail"));

// Convene M1-M3 pages
const ConveneHub = lazy(() => import("./pages/dna/convene/ConveneHub"));
const ComingSoonConvene = lazy(() => import("./pages/dna/convene/ComingSoonConvene"));
const EventsIndex = lazy(() => import("./pages/dna/convene/EventsIndex"));
const EventDetail = lazy(() => import("./pages/dna/convene/EventDetail"));
const Welcome = lazy(() => import("./pages/dna/Welcome"));
const DashboardSettings = lazy(() => import("./pages/dna/DashboardSettings"));
const MyEvents = lazy(() => import("./pages/dna/convene/MyEvents"));
const EventAnalytics = lazy(() => import("./pages/dna/convene/EventAnalytics"));
const OrganizerAnalytics = lazy(() => import("./pages/dna/convene/OrganizerAnalytics"));
const GroupsBrowse = lazy(() => import("./pages/dna/convene/GroupsBrowse"));
const GroupEventsPage = lazy(() => import("./pages/dna/convene/GroupEventsPage"));
const EventCheckIn = lazy(() => import("./pages/dna/convene/EventCheckIn"));

// Event Management Console
const EventManagementLayout = lazy(() => import("./components/convene/management/EventManagementLayout"));
const OverviewDashboard = lazy(() => import("./components/convene/management/overview/OverviewDashboard"));
const AttendeeManagement = lazy(() => import("./components/convene/management/attendees/AttendeeManagement"));
const ManagementCheckInDashboard = lazy(() => import("./components/convene/management/checkin/CheckInDashboard"));
const CommunicationsHub = lazy(() => import("./components/convene/management/communications/CommunicationsHub"));
const ManagementAnalyticsDashboard = lazy(() => import("./components/convene/management/analytics/AnalyticsDashboard"));
const TeamManager = lazy(() => import("./components/convene/management/team/TeamManager"));
const EventSettingsPage = lazy(() => import("./components/convene/management/settings/EventSettingsPage"));

// Collaborate M1-M5 pages
const CollaborateHub = lazy(() => import("./pages/dna/collaborate/CollaborateHub"));
const ComingSoonCollaborate = lazy(() => import("./pages/dna/collaborate/ComingSoonCollaborate"));
const SpacesIndex = lazy(() => import("./pages/dna/collaborate/SpacesIndex"));
const CollaborateSpaceDetail = lazy(() => import("./pages/dna/collaborate/SpaceDetail"));
const SpaceBoard = lazy(() => import("./pages/dna/collaborate/SpaceBoard"));
const CreateSpace = lazy(() => import("./pages/dna/collaborate/CreateSpace"));
const SpaceSettings = lazy(() => import("./pages/dna/collaborate/SpaceSettings"));
const MySpaces = lazy(() => import("./pages/dna/collaborate/MySpaces"));

// Contribute M1-M2 pages
const ContributeHub = lazy(() => import("./pages/dna/contribute/ContributeHub"));
const ComingSoonContribute = lazy(() => import("./pages/dna/contribute/ComingSoonContribute"));
const NeedsIndex = lazy(() => import("./pages/dna/contribute/NeedsIndex"));
const NeedDetail = lazy(() => import("./pages/dna/contribute/NeedDetail"));
const OpportunityDetail = lazy(() => import("./pages/dna/contribute/OpportunityDetail"));
const MyContributions = lazy(() => import("./pages/dna/contribute/MyContributions"));
const FulfillmentTrackerPage = lazy(() => import("./components/contribute/FulfillmentTracker"));
const ImpactDashboardPage = lazy(() => import("./pages/dna/contribute/ImpactDashboard"));
const ManifestEditorPage = lazy(() => import("./pages/dna/contribute/ManifestEditorPage"));
const NeedComposerPage = lazy(() => import("./pages/dna/contribute/NeedComposerPage"));

// Convey M1-M4 pages
const Convey = lazy(() => import("./pages/dna/Convey"));
const ConveyHub = lazy(() => import("./pages/dna/convey/ConveyHub"));
const StoryDetail = lazy(() => import("./pages/dna/convey/StoryDetail"));
const FeedStoryDetail = lazy(() => import("./pages/dna/FeedStoryDetail"));
const CreateStory = lazy(() => import("./pages/dna/convey/CreateStory"));
const ConveyAnalytics = lazy(() => import("./pages/dna/admin/ConveyAnalytics"));
const UserAdminHub = lazy(() => import("./pages/dna/admin/UserAdminHub"));

// Feature pages
const Opportunities = lazy(() => import("./pages/Opportunities"));
const MyApplications = lazy(() => import("./pages/MyApplications"));
const ApplicationsReceived = lazy(() => import("./pages/ApplicationsReceived"));
const DnaDiscover = lazy(() => import("./pages/dna/Discover"));
// Messages pages consolidated - using DnaMessages from ./pages/dna/Messages
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const NotificationSettingsPage = lazy(() => import("./pages/NotificationSettingsPage"));
const ProfileEdit = lazy(() => import("./pages/ProfileEdit"));

// Settings Hub pages
const AccountSettings = lazy(() => import("./pages/dna/settings/AccountSettings"));
const PrivacySettings = lazy(() => import("./pages/dna/settings/PrivacySettings"));
const BlockedUsersSettings = lazy(() => import("./pages/dna/settings/BlockedUsersSettings"));
const MyReportsSettings = lazy(() => import("./pages/dna/settings/MyReportsSettings"));
const NotificationSettings = lazy(() => import("./pages/dna/settings/NotificationSettings"));
const PreferencesSettings = lazy(() => import("./pages/dna/settings/PreferencesSettings"));
const MyHashtagsSettings = lazy(() => import("./pages/dna/settings/MyHashtagsSettings"));
const SettingsRouteShell = lazy(() => import("./pages/dna/settings/SettingsRouteShell"));
const DiaPreferences = lazy(() => import("./pages/DiaPreferences"));
const DiaPage = lazy(() => import("./pages/dna/DiaPage"));
const DiaAdminPage = lazy(() => import("./pages/admin/DiaAdminPage"));
const SpaceManagement = lazy(() => import("./pages/admin/spaces/SpaceManagement"));
const SpaceModeration = lazy(() => import("./pages/admin/spaces/SpaceModeration"));
const CollaborationAnalytics = lazy(() => import("./pages/admin/analytics/CollaborationAnalytics"));
const ContributionManagement = lazy(() => import("./pages/admin/contributions/ContributionManagement"));
const ContributionModeration = lazy(() => import("./pages/admin/contributions/ContributionModeration"));
const ContributionAnalytics = lazy(() => import("./pages/admin/contributions/ContributionAnalytics"));
const NudgeCenter = lazy(() => import("./pages/NudgeCenter"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const EventDetailsPage = lazy(() => import("./pages/EventDetailsPage"));
const EditEventPage = lazy(() => import("./pages/EditEventPage"));
const GroupsPage = lazy(() => import("./pages/GroupsPage"));
const DnaGroups = lazy(() => import("./pages/dna/Groups"));
const GroupDetailsPage = lazy(() => import("./pages/GroupDetailsPage"));
const GroupSettingsPage = lazy(() => import("./pages/GroupSettingsPage"));

// CONNECT M2 - New Connect Hub pages
const Connect = lazy(() => import("./pages/dna/connect/Connect"));
const ConnectLayout = lazy(() => import("./components/connect/ConnectLayout").then(m => ({ default: m.ConnectLayout })));
const ConnectDiscover = lazy(() => import("./pages/dna/connect/Discover"));
const ConnectNetwork = lazy(() => import("./pages/dna/connect/Network"));
// Legacy connect messages pages removed - using canonical /dna/messages route

// Phase pages
const MarketResearchPhase = lazy(() => import("./pages/MarketResearchPhase"));
const PrototypingPhase = lazy(() => import("./pages/PrototypingPhase"));
const CustomerDiscoveryPhase = lazy(() => import("./pages/CustomerDiscoveryPhase"));
const MvpPhase = lazy(() => import("./pages/MvpPhase"));
const BetaValidationPhase = lazy(() => import("./pages/BetaValidationPhase"));
const GoToMarketPhase = lazy(() => import("./pages/GoToMarketPhase"));

// Partner With DNA pages
const PartnerWithDna = lazy(() => import("./pages/PartnerWithDna"));
const PartnerSector = lazy(() => import("./pages/PartnerSector"));
const PartnerModels = lazy(() => import("./pages/PartnerModels"));
const PartnerStart = lazy(() => import("./pages/PartnerStart"));

// Regional Hubs
const RegionHubPage = lazy(() => import("./pages/africa/RegionHubPage"));
const CountryHubPage = lazy(() => import("./pages/africa/CountryHubPage"));


// QueryClient configured in @/lib/queryClient.ts with centralized defaults

// Auth guard component to prevent authenticated users from accessing auth-specific pages only
const AuthGuard = ({ children, redirectAuth = false }: { children: React.ReactNode; redirectAuth?: boolean }) => {
  const { user, profile, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }
  
  // Redirect authenticated users away from auth-only pages (login/signup)
  if (user && redirectAuth) {
    return <Navigate to={profile?.onboarding_completed_at ? "/dna/feed" : "/onboarding"} replace />;
  }
  
  return <>{children}</>;
};

const hasRecoveryMarker = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

  return searchParams.get('type') === 'recovery' || hashParams.get('type') === 'recovery';
};

const RecoveryRedirectListener = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const shouldHandleRecovery = hasRecoveryMarker();
    const timer = shouldHandleRecovery
      ? window.setTimeout(async () => {
        const { data } = await supabase.auth.getSession();

        if (data.session) {
          navigate('/onboarding/reset-password-complete', { replace: true });
        }
      }, 600)
      : undefined;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || (shouldHandleRecovery && event === 'SIGNED_IN')) {
        navigate('/onboarding/reset-password-complete', { replace: true });
      }
    });

    return () => {
      if (timer) {
        clearTimeout(timer);
      }

      subscription.unsubscribe();
    };
  }, [navigate]);

  return null;
};

// Mounts presence heartbeat for the authenticated user (Phase 1 messaging foundation)
const PresenceHeartbeat = () => {
  usePresenceHeartbeat();
  return null;
};

const AppShell = ({ children }: { children: React.ReactNode }) => (
  <AuthGuard>
    {children}
  </AuthGuard>
);

// Legacy /dna/u/:username redirect to canonical /dna/:username
const LegacyUsernameRedirect = () => {
  const { username } = useParams();
  return <Navigate to={`/dna/${username}`} replace />;
};

// Legacy /dna/impact/:id redirect to canonical /dna/contribute/:id
const LegacyImpactIdRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/dna/contribute/${id}`} replace />;
};

// Legacy /dna/space/:slug redirect to canonical /dna/collaborate/spaces/:slug
const LegacySpaceSlugRedirect = () => {
  const { slug } = useParams();
  return <Navigate to={`/dna/collaborate/spaces/${slug}`} replace />;
};

// Legacy /dna/spaces/:id redirect to canonical /dna/collaborate/spaces/:id
// (SpaceDetail resolves a UUID param to the space, then rewrites to the slug URL).
const LegacySpaceIdRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/dna/collaborate/spaces/${id}`} replace />;
};

/** Redirect legacy /dna/convey/post/:id emails to /dna/story/:id */
function ConveyPostRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/dna/story/${id}`} replace />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <RecoveryRedirectListener />
              <AuthProvider>
                <PresenceHeartbeat />
                <AccountDrawerProvider>
                  <ViewStateProvider>
                    <MessageProvider>
                      <BaseLayout>
                        <Suspense fallback={<PageLoader />}>
                          <Routes>
              {/* Legacy /u/:username and /dna/u/:username redirect to canonical profile URL */}
              <Route path="/u/:username" element={<LegacyUsernameRedirect />} />
              <Route path="/dna/u/:username" element={<LegacyUsernameRedirect />} />
              <Route path="/post/:postId" element={<PublicPostPage />} />
              <Route path="/event/:slugOrId" element={<PublicEventPage />} />
              
              {/* Core authentication */}
              <Route path="/" element={<AuthGuard><Index /></AuthGuard>} />
              <Route path="/waitlist" element={<Waitlist />} />
              <Route path="/demo" element={<Demo />} />
              <Route path="/design-system" element={<DesignSystem />} />
              <Route path="/install" element={<Install />} />
              <Route path="/auth" element={<AuthGuard redirectAuth><Auth /></AuthGuard>} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/onboarding/reset-password-complete" element={<ResetPasswordComplete />} />
              <Route path="/reset-password-complete" element={<ResetPasswordComplete />} />
              <Route path="/auth/email-change-complete" element={<EmailChangeComplete />} />
              <Route path="/onboarding/email-change-complete" element={<EmailChangeComplete />} />
              <Route path="/auth/reauthenticate" element={<Reauthenticate />} />
              <Route path="/auth/invite-accept" element={<InviteAccept />} />
              <Route path="/onboarding/invite-accept" element={<InviteAccept />} />
              
              {/* Onboarding & Welcome - NOT wrapped with OnboardingGuard */}
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/dna/welcome" element={<Welcome />} />

              {/* ========== AFFIRMATION ========== */}
              <Route path="/dna/affirm" element={
                <OnboardingGuard>
                  <Affirm />
                </OnboardingGuard>
              } />
              {/* Fixed deep-link contract for witness attestation notifications */}
              <Route path="/dna/affirm/attest/:id" element={
                <OnboardingGuard>
                  <AttestAffirmation />
                </OnboardingGuard>
              } />
              
              {/* User Admin Hub - personal management for all Five C's */}
              <Route path="/dna/admin" element={
                <OnboardingGuard>
                  <UserAdminHub />
                </OnboardingGuard>
              } />
              
              {/* Settings Hub - multiple paths for different sections */}
              <Route path="/dna/settings" element={
                <OnboardingGuard>
                  <Navigate to="/dna/settings/account" replace />
                </OnboardingGuard>
              } />
              <Route path="/dna/settings/account" element={
                <OnboardingGuard>
                  <SettingsRouteShell title="Account"><AccountSettings /></SettingsRouteShell>
                </OnboardingGuard>
              } />
              <Route path="/dna/settings/privacy" element={
                <OnboardingGuard>
                  <SettingsRouteShell title="Privacy"><PrivacySettings /></SettingsRouteShell>
                </OnboardingGuard>
              } />
              <Route path="/dna/settings/blocked" element={
                <OnboardingGuard>
                  <SettingsRouteShell title="Blocked users"><BlockedUsersSettings /></SettingsRouteShell>
                </OnboardingGuard>
              } />
              <Route path="/dna/settings/reports" element={
                <OnboardingGuard>
                  <SettingsRouteShell title="My reports"><MyReportsSettings /></SettingsRouteShell>
                </OnboardingGuard>
              } />
              <Route path="/dna/settings/notifications" element={
                <OnboardingGuard>
                  <SettingsRouteShell title="Notification settings"><NotificationSettings /></SettingsRouteShell>
                </OnboardingGuard>
              } />
              <Route path="/dna/settings/preferences" element={
                <OnboardingGuard>
                  <SettingsRouteShell title="Preferences"><PreferencesSettings /></SettingsRouteShell>
                </OnboardingGuard>
              } />
              <Route path="/dna/settings/hashtags" element={
                <OnboardingGuard>
                  <SettingsRouteShell title="My hashtags"><MyHashtagsSettings /></SettingsRouteShell>
                </OnboardingGuard>
              } />
              {/* Legacy settings routes - redirect to new hub */}
              <Route path="/dna/settings/dashboard" element={<Navigate to="/dna/settings/preferences" replace />} />
              <Route path="/dna/settings/profile" element={<Navigate to="/dna/profile/edit" replace />} />
              
              {/* DNA Dashboard Routes - Protected with OnboardingGuard */}
              <Route path="/fact-sheet" element={<FactSheetPage />} />
              <Route path="/pitch-deck" element={<PitchDeck />} />
              
              {/* Documentation Routes */}
              <Route path="/documentation/features" element={<FeaturesHub />} />
              <Route path="/documentation/features/:slug" element={<FeatureDetail />} />
              <Route path="/documentation/icons" element={<IconUsageGuide />} />
              <Route path="/dna/icons" element={<IconUsageGuide />} />

              {/* ========== RELEASES & FEATURES ========== */}
              <Route path="/releases" element={<ReleasesIndex />} />
              <Route path="/releases/:slug" element={<ReleaseDetail />} />
              <Route path="/features/archived" element={<ArchivedFeaturesIndex />} />
              <Route path="/features/archived/:slug" element={<ArchivedFeatureDetail />} />

              {/* Redirect old /dna/me to user's profile */}
              <Route path="/dna/me" element={<Navigate to="/dna/feed" replace />} />
              {/* /dna/profile redirects to user's own profile using their username */}
              <Route path="/dna/profile" element={
                <Suspense fallback={<PageLoader />}>
                  <MyProfileRedirect />
                </Suspense>
              } />
              <Route path="/dna/:username" element={<ProfileV2 />} />
              {/* Legacy profile ID redirect - looks up username and redirects */}
              <Route path="/dna/profile/:id" element={
                <Suspense fallback={<PageLoader />}>
                  <LegacyProfileRedirect />
                </Suspense>
              } />
              <Route path="/dna/profile/edit" element={
                <OnboardingGuard>
                  <ProfileEdit />
                </OnboardingGuard>
              } />

              {/* ========== CONNECT HUB M2 ========== */}
              <Route path="/dna/connect" element={
                <OnboardingGuard>
                  <Connect />
                </OnboardingGuard>
              }>
                <Route index element={<Navigate to="/dna/connect/discover" replace />} />
                <Route path="discover" element={<ConnectDiscover />} />
                <Route path="network" element={<ConnectNetwork />} />
                {/* Legacy route - now using /dna/messages as canonical */}
                <Route path="messages" element={<Navigate to="/dna/messages" replace />} />
                <Route path="messages/:conversationId" element={<Navigate to="/dna/messages" replace />} />
              </Route>
              
              {/* ========== LEGACY CONNECT & DISCOVER ROUTES - Redirects ========== */}
              <Route path="/dna/discover/members" element={<Navigate to="/dna/connect/discover" replace />} />
              <Route path="/dna/discover" element={<Navigate to="/dna/connect/discover" replace />} />
              <Route path="/dna/discover/feed" element={<Navigate to="/dna/feed" replace />} />
              <Route path="/dna/network" element={<Navigate to="/dna/connect/network" replace />} />
              <Route path="/dna/network/feed" element={<Navigate to="/dna/feed" replace />} />
              <Route path="/dna/connect/feed" element={<Navigate to="/dna/feed" replace />} />
               {/* Feed is the multi-C activity stream home */}
               <Route path="/dna/feed" element={
                 <OnboardingGuard>
                   <DnaFeed />
                 </OnboardingGuard>
               } />
               {/* Debug feed page */}
               <Route path="/dna/debug/feed" element={
                 <OnboardingGuard>
                   <DebugUniversalFeed />
                 </OnboardingGuard>
               } />
               {/* Hashtag feed page */}
               <Route path="/dna/hashtag/:hashtag" element={
                 <OnboardingGuard>
                   <HashtagFeed />
                 </OnboardingGuard>
               } />
               {/* Messages: Canonical routes.
                   BD063 hide-and-freeze: while DM/group messaging is OUT at v0.0
                   (MESSAGING_ENABLED=false), these routes redirect to a safe surface
                   instead of mounting DnaMessages/GroupThreadPage. Route defs + lazy
                   imports stay frozen in the tree so unfreeze is one flag flip. */}
              <Route path="/dna/messages" element={
                MESSAGING_ENABLED ? (
                  <OnboardingGuard>
                    <DnaMessages />
                  </OnboardingGuard>
                ) : <Navigate to="/dna/connect" replace />
              } />
              <Route path="/dna/messages/:conversationId" element={
                MESSAGING_ENABLED ? (
                  <OnboardingGuard>
                    <DnaMessages />
                  </OnboardingGuard>
                ) : <Navigate to="/dna/connect" replace />
              } />
              <Route path="/dna/messages/group/:groupId" element={
                MESSAGING_ENABLED ? (
                  <OnboardingGuard>
                    <GroupThreadPage />
                  </OnboardingGuard>
                ) : <Navigate to="/dna/connect" replace />
              } />
              
              {/* Legacy message routes - redirect to canonical */}
              <Route path="/dna/connect/messages" element={<Navigate to="/dna/messages" replace />} />
              <Route path="/dna/connect/messages/:conversationId" element={<Navigate to="/dna/messages" replace />} />
              <Route path="/discover/members" element={<Navigate to="/dna/connect/discover" replace />} />
              <Route path="/discover" element={<Navigate to="/dna/connect/discover" replace />} />
              
              {/* ========== CONVENE PILLAR M1 ========== */}
              <Route path="/dna/convene" element={
                <OnboardingGuard>
                  <ConveneHub />
                </OnboardingGuard>
              } />
              <Route path="/dna/convene/events" element={
                <OnboardingGuard>
                  <EventsIndex />
                </OnboardingGuard>
              } />
              {/* Event detail is public - no auth required for viewing */}
              <Route path="/dna/convene/events/:id" element={<EventDetail />} />
              {/* Event creation wizard — full 5-step flow */}
              {/* Event creation now handled by Universal Composer */}
              <Route path="/dna/convene/events/:id/edit" element={
                <OnboardingGuard>
                  <EditEventPage />
                </OnboardingGuard>
              } />
              <Route path="/dna/convene/events/:id/analytics" element={
                <OnboardingGuard>
                  <EventAnalytics />
                </OnboardingGuard>
              } />
              <Route path="/dna/convene/events/:id/check-in" element={
                <OnboardingGuard>
                  <EventCheckIn />
                </OnboardingGuard>
              } />

              {/* Event Management Console Routes */}
              <Route path="/dna/convene/events/:eventId/manage" element={
                <OnboardingGuard>
                  <EventManagementLayout />
                </OnboardingGuard>
              }>
                <Route index element={<OverviewDashboard />} />
                <Route path="attendees" element={<AttendeeManagement />} />
                <Route path="check-in" element={<ManagementCheckInDashboard />} />
                <Route path="communications" element={<CommunicationsHub />} />
                <Route path="analytics" element={<ManagementAnalyticsDashboard />} />
                <Route path="team" element={<TeamManager />} />
                <Route path="settings" element={<EventSettingsPage />} />
              </Route>

              <Route path="/dna/convene/my-events" element={
                <OnboardingGuard>
                  <MyEvents />
                </OnboardingGuard>
              } />
              <Route path="/dna/convene/analytics" element={
                <OnboardingGuard>
                  <OrganizerAnalytics />
                </OnboardingGuard>
              } />
              <Route path="/dna/convene/groups" element={
                <OnboardingGuard>
                  <GroupsBrowse />
                </OnboardingGuard>
              } />
              <Route path="/dna/convene/groups/:slug/events" element={<OnboardingGuard><GroupEventsPage /></OnboardingGuard>} />
              <Route path="/dna/convene/groups/:slug" element={
                <OnboardingGuard>
                  <GroupDetailsPage />
                </OnboardingGuard>
              } />
              <Route path="/dna/convene/groups/:slug/settings" element={
                <OnboardingGuard>
                  <GroupSettingsPage />
                </OnboardingGuard>
              } />
              
              {/* ========== COLLABORATE PILLAR M1-M5 ========== */}
              <Route path="/dna/collaborate" element={
                <OnboardingGuard>
                  <CollaborateHub />
                </OnboardingGuard>
              } />
              <Route path="/dna/collaborate/spaces" element={
                <OnboardingGuard>
                  <SpacesIndex />
                </OnboardingGuard>
              } />
              <Route path="/dna/collaborate/spaces/new" element={
                <OnboardingGuard>
                  <CreateSpace />
                </OnboardingGuard>
              } />
              <Route path="/dna/collaborate/spaces/:slug" element={
                <OnboardingGuard>
                  <CollaborateSpaceDetail />
                </OnboardingGuard>
              } />
              <Route path="/dna/collaborate/spaces/:slug/board" element={
                <OnboardingGuard>
                  <SpaceBoard />
                </OnboardingGuard>
              } />
              <Route path="/dna/collaborate/spaces/:slug/settings" element={
                <OnboardingGuard>
                  <SpaceSettings />
                </OnboardingGuard>
              } />
              <Route path="/dna/collaborate/my-spaces" element={
                <OnboardingGuard>
                  <MySpaces />
                </OnboardingGuard>
              } />
              
              {/* ========== CONTRIBUTE PILLAR M1 ========== */}
              <Route path="/dna/contribute" element={
                <OnboardingGuard>
                  <ContributeHub />
                </OnboardingGuard>
              } />
              <Route path="/dna/contribute/manifest" element={
                <OnboardingGuard>
                  <ManifestEditorPage />
                </OnboardingGuard>
              } />
              <Route path="/dna/contribute/my-needs" element={
                <OnboardingGuard>
                  <NeedComposerPage />
                </OnboardingGuard>
              } />
              <Route path="/dna/contribute/needs" element={
                <OnboardingGuard>
                  <NeedsIndex />
                </OnboardingGuard>
              } />
              <Route path="/dna/contribute/needs/:id" element={
                <OnboardingGuard>
                  <OpportunityDetail />
                </OnboardingGuard>
              } />
              <Route path="/dna/contribute/my" element={
                <OnboardingGuard>
                  <MyContributions />
                </OnboardingGuard>
              } />
              <Route path="/dna/contribute/fulfillment/:fulfillmentId" element={
                <OnboardingGuard>
                  <FulfillmentTrackerPage />
                </OnboardingGuard>
              } />
              <Route path="/dna/contribute/impact" element={
                <OnboardingGuard>
                  <ImpactDashboardPage />
                </OnboardingGuard>
              } />
              
              {/* CONVEY M1-M4 - Story Feed, Details, Authoring & Analytics */}
              <Route path="/dna/convey" element={
                <OnboardingGuard>
                  <ConveyHub />
                </OnboardingGuard>
              } />
              <Route path="/dna/convey/new" element={
                <OnboardingGuard>
                  <CreateStory />
                </OnboardingGuard>
              } />
              {/* Feed Stories - slug-based detail view (public, no auth required) */}
              <Route path="/dna/story/:slug" element={<FeedStoryDetail />} />
              {/* Convey Items - legacy slug-based detail view (public, no auth required) */}
              <Route path="/dna/convey/stories/:slug" element={<StoryDetail />} />
              {/* Legacy post detail redirect - for emails already sent with old URL format */}
              <Route path="/dna/convey/post/:id" element={<ConveyPostRedirect />} />
              
              {/* Legacy convene route redirects */}
              <Route path="/dna/events" element={<Navigate to="/dna/convene/events" replace />} />
              <Route path="/events" element={<Navigate to="/dna/convene/events" replace />} />
              <Route path="/events/:id" element={<LegacyEventRedirect />} />
              <Route path="/dna/convene-example" element={<Navigate to="/dna/convene" replace />} />
              
              {/* ========== LEGACY CONTRIBUTE/IMPACT ROUTES ========== */}
              {/* Main /dna/contribute route is defined in CONTRIBUTE PILLAR M1 section above */}
              <Route path="/dna/contribute/:id" element={
                <OnboardingGuard>
                  <OpportunityDetail />
                </OnboardingGuard>
              } />
              {/* Legacy impact routes - redirect to contribute */}
              <Route path="/dna/impact" element={<Navigate to="/dna/contribute" replace />} />
              <Route path="/dna/impact/:id" element={<LegacyImpactIdRedirect />} />
               <Route path="/dna/applications" element={
                <OnboardingGuard>
                  <MyApplications />
                </OnboardingGuard>
              } />
               <Route path="/dna/applications/received" element={
                <OnboardingGuard>
                  <ApplicationsReceived />
                </OnboardingGuard>
              } />
               {/* Legacy /dna/spaces routes now redirect into the canonical
                   /dna/collaborate/spaces surface. */}
               <Route path="/dna/spaces" element={<Navigate to="/dna/collaborate/spaces" replace />} />
               <Route path="/dna/spaces/:id" element={<LegacySpaceIdRedirect />} />
               <Route path="/dna/saved" element={
                 <OnboardingGuard>
                   <SavedPostsPage />
                 </OnboardingGuard>
               } />
               
                {/* ========== LEGACY ROUTES ========== */}
               {/* Legacy space route - redirect to canonical collaborate route */}
               <Route path="/dna/space/:slug" element={<LegacySpaceSlugRedirect />} />
              
              {/* ========== NOTIFICATIONS & NUDGES ========== */}
              <Route path="/dna/notifications" element={
                <OnboardingGuard>
                  <DnaNotifications />
                </OnboardingGuard>
              } />
              <Route path="/dna/nudges" element={
                <OnboardingGuard>
                  <NudgeCenter />
                </OnboardingGuard>
              } />
              <Route path="/dna/preferences" element={
                <OnboardingGuard>
                  <DiaPreferences />
                </OnboardingGuard>
              } />
              <Route path="/dna/dia" element={
                <OnboardingGuard>
                  <DiaPage />
                </OnboardingGuard>
              } />
              {/* Legacy route redirect (ADIN was renamed to DIA) */}
              <Route path="/dna/adin" element={<Navigate to="/dna/dia" replace />} />
              {/* ========== ANALYTICS ========== */}
              <Route path="/dna/analytics" element={
                <OnboardingGuard>
                  <DnaAnalytics />
                </OnboardingGuard>
              } />

              {/* ========== FEEDBACK HUB ========== */}
              <Route path="/dna/feedback" element={
                <OnboardingGuard>
                  <DnaFeedback />
                </OnboardingGuard>
              } />

              <Route path="/app/profile/edit" element={
                <OnboardingGuard>
                  <ProfileEdit />
                </OnboardingGuard>
              } />
              
              {/* ROADMAP — hidden, work-in-progress */}
              {/* <Route path="/roadmap" element={<Roadmap />} /> */}

              {/* Public marketing pages - Five C's examples temporarily disabled pending redesign.
                  All links redirect home so no in-progress page is exposed. */}
              <Route path="/connect" element={<Navigate to="/" replace />} />
              <Route path="/convene" element={<Navigate to="/" replace />} />
              <Route path="/convene/category/:category" element={<Navigate to="/" replace />} />
              <Route path="/convene/featured-calendars" element={<Navigate to="/" replace />} />
              <Route path="/convene/local-events" element={<Navigate to="/" replace />} />
              <Route path="/collaborate" element={<Navigate to="/" replace />} />
              <Route path="/contribute" element={<Navigate to="/" replace />} />
              <Route path="/convey" element={<Navigate to="/" replace />} />

              
              {/* New Admin Portal Routes */}
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/admin" element={
                <Suspense fallback={<PageLoader />}>
                  <AdminRouteGuard>
                    <AdminDashboardLayout />
                  </AdminRouteGuard>
                </Suspense>
              }>
                <Route index element={<AdminDashboardOverview />} />
                <Route path="dashboard" element={<AdminDashboardOverview />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="moderation" element={<ContentModeration />} />
                <Route path="analytics" element={<EngagementDashboard />} />
                <Route path="analytics/engagement" element={<EngagementDashboard />} />
                <Route path="dia" element={<DiaAdminPage />} />
                {/* Legacy admin route redirect (ADIN was renamed to DIA) */}
                <Route path="adin" element={<Navigate to="/admin/dia" replace />} />
                {/* Spaces admin routes */}
                <Route path="spaces" element={<SpaceManagement />} />
                <Route path="spaces/moderation" element={<SpaceModeration />} />
                {/* Collaboration Analytics */}
                <Route path="analytics/collaboration" element={<CollaborationAnalytics />} />
                {/* Contribution admin routes */}
                <Route path="contributions" element={<ContributionManagement />} />
                <Route path="contributions/moderation" element={<ContributionModeration />} />
                {/* Contribution Analytics */}
                <Route path="analytics/contributions" element={<ContributionAnalytics />} />
                {/* Error monitoring */}
                <Route path="errors" element={<ErrorDashboard />} />
              </Route>

              {/* Legacy Admin routes */}
              <Route path="/app/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="waitlist" element={<WaitlistManagement />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="health" element={<PlatformHealth />} />
                <Route path="engagement" element={<EngagementDashboard />} />
                <Route path="signals" element={<AdminSignals />} />
                <Route path="moderation" element={<ContentModeration />} />
                <Route path="convey" element={<ConveyAnalytics />} />
              </Route>

              {/* Static pages */}
              
              {/* Phase pages */}
              <Route path="/phase-1/market-research" element={<MarketResearchPhase />} />
              <Route path="/phase-2/prototyping" element={<PrototypingPhase />} />
              <Route path="/phase-3/customer-discovery" element={<CustomerDiscoveryPhase />} />
              <Route path="/phase-4/mvp" element={<MvpPhase />} />
              <Route path="/phase-5/beta-validation" element={<BetaValidationPhase />} />
              <Route path="/phase-6/go-to-market" element={<GoToMarketPhase />} />
              
              {/* Partner With DNA pages */}
              <Route path="/partner-with-dna" element={<PartnerWithDna />} />
              <Route path="/partner-with-dna/sectors/:slug" element={<PartnerSector />} />
              <Route path="/partner-with-dna/models" element={<PartnerModels />} />
              <Route path="/partner-with-dna/start" element={<PartnerStart />} />

              {/* Regional Hubs */}
              <Route path="/africa/:regionSlug" element={<RegionHubPage />} />
              <Route path="/africa/:regionSlug/:countrySlug" element={<CountryHubPage />} />

              {/* Static pages */}
              <Route path="/manifesto" element={<Manifesto />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<About />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/legal/user-agreement" element={<UserAgreement />} />
              <Route path="/legal/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/legal/terms" element={<TermsOfService />} />
              <Route path="/legal/cookie-policy" element={<CookiePolicy />} />
              
              {/* Authentication flows */}
              <Route path="/invite" element={<InviteSignup />} />
              
              <Route path="*" element={<NotFound />} />
                </Routes>
                  </Suspense>
                <BadgeToastListener />
              </BaseLayout>
                </MessageProvider>
              </ViewStateProvider>
              </AccountDrawerProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
      </HelmetProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;