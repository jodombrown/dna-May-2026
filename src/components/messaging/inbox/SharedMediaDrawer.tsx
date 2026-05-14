import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { messageService } from '@/services/messageService';
import { ResponsiveModal, ResponsiveModalHeader, ResponsiveModalTitle } from '@/components/ui/responsive-modal';
import { Image as ImageIcon, FileText, Mic, Link2 } from 'lucide-react';
import { format } from 'date-fns';

interface SharedMediaDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  otherUserName: string;
}

type Tab = 'media' | 'files' | 'links' | 'voice';

/**
 * Phase 6 - Shared media drawer for 1:1 conversations.
 * Pulls attachments / link previews from the existing messages query.
 */
export const SharedMediaDrawer: React.FC<SharedMediaDrawerProps> = ({
  open,
  onOpenChange,
  conversationId,
  otherUserName,
}) => {
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => messageService.getMessages(conversationId),
    enabled: open,
    staleTime: 30_000,
  });

  const [tab, setTab] = React.useState<Tab>('media');

  const buckets = useMemo(() => {
    const media: typeof messages = [];
    const files: typeof messages = [];
    const voice: typeof messages = [];
    const links: typeof messages = [];
    for (const m of messages) {
      const a = m.payload?.attachment;
      const lp = m.payload?.linkPreview;
      if (a?.type === 'image') media.push(m);
      else if (a?.type === 'voice') voice.push(m);
      else if (a) files.push(m);
      if (lp) links.push(m);
    }
    return { media, files, voice, links };
  }, [messages]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'media', label: 'Media', icon: <ImageIcon className="h-3.5 w-3.5" />, count: buckets.media.length },
    { id: 'files', label: 'Files', icon: <FileText className="h-3.5 w-3.5" />, count: buckets.files.length },
    { id: 'voice', label: 'Voice', icon: <Mic className="h-3.5 w-3.5" />, count: buckets.voice.length },
    { id: 'links', label: 'Links', icon: <Link2 className="h-3.5 w-3.5" />, count: buckets.links.length },
  ];

  const current = buckets[tab];

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalHeader>
        <ResponsiveModalTitle>{`Shared with ${otherUserName}`}</ResponsiveModalTitle>
      </ResponsiveModalHeader>
      <div className="flex flex-col gap-3">
        {/* Tab strip */}
        <div className="flex gap-1 border-b border-border">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.icon}
              {t.label}
              <span className="text-[10px] opacity-60">({t.count})</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {current.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No {tab} shared yet
          </div>
        ) : tab === 'media' ? (
          <div className="grid grid-cols-3 gap-1.5 max-h-[60vh] overflow-y-auto">
            {current.map((m) => {
              const a = m.payload?.attachment;
              if (!a) return null;
              return (
                <a
                  key={m.message_id}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="aspect-square bg-muted rounded-md overflow-hidden hover:opacity-80 transition"
                >
                  {a.type === 'image' ? (
                    <img src={a.url} alt={a.filename || ''} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <video src={a.url} className="w-full h-full object-cover" />
                  )}
                </a>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto">
            {current.map((m) => {
              const a = m.payload?.attachment;
              const lp = m.payload?.linkPreview;
              const url = a?.url ?? lp?.url ?? '#';
              const label = a?.filename ?? lp?.title ?? lp?.url ?? 'Untitled';
              return (
                <a
                  key={m.message_id}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-md hover:bg-muted/60 text-sm"
                >
                  <span className="truncate">{label}</span>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {format(new Date(m.created_at), 'MMM d')}
                  </span>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
};
