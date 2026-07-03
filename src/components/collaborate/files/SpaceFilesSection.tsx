import { useMemo } from 'react';
import { FolderOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileDropZone } from './FileDropZone';
import { FileRow } from './FileRow';
import { memberName, type RosterMember } from '@/hooks/collaborate/useSpaceRoster';
import {
  SPACE_STORAGE_SOFT_CAP_BYTES,
  formatBytes,
  useSpaceFiles,
} from '@/hooks/collaborate/useSpaceFiles';

interface SpaceFilesSectionProps {
  spaceId: string;
  spaceName: string;
  isMember: boolean;
  roster: RosterMember[];
}

export function SpaceFilesSection({
  spaceId,
  spaceName,
  isMember,
  roster,
}: SpaceFilesSectionProps) {
  const { files, totalBytes, thumbnails, isLoading, uploadFile, deleteFile, openFile } =
    useSpaceFiles(isMember ? spaceId : undefined);

  const nameById = useMemo(
    () => new Map(roster.map((m) => [m.user_id, memberName(m)])),
    [roster],
  );

  // Per-file cap failures toast from the hook; keep going so one oversized
  // file doesn't block the rest of a multi-file drop.
  const handleFiles = async (list: File[]) => {
    for (const file of list) {
      await uploadFile.mutateAsync(file).catch(() => undefined);
    }
  };

  const overSoftCap = totalBytes > SPACE_STORAGE_SOFT_CAP_BYTES;

  return (
    <section className="mt-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-semibold text-foreground">
          Files{isMember ? ` (${files.length})` : ''}
        </h2>
        {isMember && files.length > 0 && (
          <p className="text-xs text-muted-foreground">{formatBytes(totalBytes)} stored</p>
        )}
      </div>

      {!isMember ? (
        <Card className="mt-2 p-8 text-center">
          <h3 className="text-lg font-semibold text-foreground">Members only</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Files shared in {spaceName} are visible to its members. Join the space to see and
            share files.
          </p>
        </Card>
      ) : (
        <div className="mt-2 space-y-3">
          <FileDropZone onFiles={handleFiles} busy={uploadFile.isPending} />

          {overSoftCap && (
            <Card className="border-dna-warning/40 p-4">
              <p className="text-sm text-foreground">
                This space is storing {formatBytes(totalBytes)} — past the 250 MB included with
                the Free plan. Nothing is blocked yet, but consider removing files you no longer
                need.
              </p>
            </Card>
          )}

          {isLoading ? (
            <Skeleton className="h-24 w-full rounded-lg" />
          ) : files.length === 0 ? (
            <Card className="p-8 text-center">
              <FolderOpen
                className="mx-auto h-6 w-6 text-muted-foreground"
                aria-hidden="true"
              />
              <h3 className="mt-3 text-lg font-semibold text-foreground">No files yet</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Share documents, images, and other files with the space. Drop the first one
                above to get started.
              </p>
            </Card>
          ) : (
            <Card className="divide-y divide-border">
              {files.map((file) => (
                <FileRow
                  key={file.id}
                  file={file}
                  uploaderName={nameById.get(file.uploaded_by) ?? 'Member'}
                  thumbnailUrl={thumbnails[file.file_url]}
                  deleting={deleteFile.isPending}
                  onOpen={openFile}
                  onDelete={(f) => deleteFile.mutate(f)}
                />
              ))}
            </Card>
          )}
        </div>
      )}
    </section>
  );
}
