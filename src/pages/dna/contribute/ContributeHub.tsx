import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ManifestRenderer } from '@/components/contribute/manifest/ManifestRenderer';
import { NeedEditor } from '@/components/contribute/needs/NeedEditor';
import { ContributeMobileHeader, type ContributeTab } from '@/components/contribute/ContributeMobileHeader';
import { RoomHub } from '@/components/contribute/room/RoomHub';
import { MOBILE_HEADER_Z } from '@/lib/mobileHeaderSpacing';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useMobile } from '@/hooks/useMobile';
import { cn } from '@/lib/utils';

export function ContributeHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isMobile } = useMobile();
  const { isScrollingDown, isAtTop } = useScrollDirection(30);
  const topBarVisible = !(isMobile && isScrollingDown && !isAtTop);

  const [activeTab, setActiveTab] = useState<ContributeTab>('manifest');
  const [composerSignal, setComposerSignal] = useState(0);

  const manifestRef = useRef<HTMLDivElement>(null);
  const needsRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (tab: ContributeTab) => {
    setActiveTab(tab);
    if (tab === 'manifest') {
      manifestRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (tab === 'needs') {
      needsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (tab === 'mine') {
      navigate('/dna/contribute/my');
    } else if (tab === 'impact') {
      navigate('/dna/contribute/impact');
    }
  };

  const handleComposerClick = () => {
    if (!user) return;
    setComposerSignal((n) => n + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile chrome - top bar hides on scroll, tabs stay fixed (matches Connect/Feed) */}
      <div className={cn('md:hidden sticky top-0', MOBILE_HEADER_Z)}>
        <ContributeMobileHeader
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onComposerClick={handleComposerClick}
          isRow1Visible={topBarVisible}
        />
      </div>


      <main className="max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-8">
        {user ? (
          <>
            <div ref={manifestRef} className="scroll-mt-32">
              <ManifestRenderer targetUserId={user.id} viewerUserId={user.id} />
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/dna/contribute/manifest')}
                >
                  Open Manifest editor
                </Button>
              </div>
            </div>

            <div className="border-t pt-8">
              <RoomHub
                onOpenManifestEditor={() => navigate('/dna/contribute/manifest')}
                onOpenStanceEditor={() => navigate('/dna/contribute/manifest')}
              />
            </div>

            <div ref={needsRef} className="border-t pt-8 scroll-mt-32">
              <NeedEditor externalOpenSignal={composerSignal} />
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Sign in to author your Manifest.</p>
        )}
      </main>
    </div>
  );
}

export default ContributeHub;
