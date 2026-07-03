import { useState } from 'react';
import { format } from 'date-fns';
import {
  Download,
  File as FileIcon,
  FileArchive,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatBytes, type SpaceFile } from '@/hooks/collaborate/useSpaceFiles';

function iconFor(fileType: string | null): LucideIcon {
  if (!fileType) return FileIcon;
  if (fileType.startsWith('image/')) return FileImage;
  if (fileType.startsWith('video/')) return FileVideo;
  if (fileType.startsWith('audio/')) return FileAudio;
  if (fileType.includes('zip') || fileType.includes('compressed') || fileType.includes('tar')) {
    return FileArchive;
  }
  if (fileType.startsWith('text/') || fileType.includes('pdf') || fileType.includes('document')) {
    return FileText;
  }
  return FileIcon;
}

interface FileRowProps {
  file: SpaceFile;
  uploaderName: string;
  /** Signed preview URL for image files (private bucket), when available. */
  thumbnailUrl?: string;
  deleting: boolean;
  onOpen: (file: SpaceFile) => void;
  onDelete: (file: SpaceFile) => void;
}

export function FileRow({
  file,
  uploaderName,
  thumbnailUrl,
  deleting,
  onOpen,
  onDelete,
}: FileRowProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const Icon = iconFor(file.file_type);

  return (
    <div className="flex items-center gap-3 p-3">
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt=""
          className="h-10 w-10 shrink-0 rounded-md border border-border object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </div>
      )}
      <button
        type="button"
        onClick={() => onOpen(file)}
        className="min-w-0 flex-1 text-left"
        title={`Download ${file.file_name}`}
      >
        <p className="truncate text-sm font-medium text-foreground hover:underline">
          {file.file_name}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {formatBytes(file.file_size)} · {uploaderName} ·{' '}
          {format(new Date(file.created_at), 'MMM d, yyyy')}
        </p>
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Download ${file.file_name}`}
        onClick={() => onOpen(file)}
      >
        <Download className="h-4 w-4" aria-hidden="true" />
      </Button>
      {/* Shown to every member; RLS limits deletion to the uploader or a
          space lead, and the hook toasts a permission message on zero rows. */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Delete ${file.file_name}`}
        disabled={deleting}
        className="text-destructive hover:text-destructive"
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </Button>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this file?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{file.file_name}&rdquo; will be removed for everyone in the space. This
              can&rsquo;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onDelete(file)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
