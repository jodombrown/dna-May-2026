import { useRef, useState, type DragEvent } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileDropZoneProps {
  onFiles: (files: File[]) => void;
  /** Uploads in flight — the zone stays visible but stops accepting drops. */
  busy?: boolean;
}

export function FileDropZone({ onFiles, busy }: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (busy) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onFiles(files);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length > 0) onFiles(files);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed p-6 text-center transition-colors',
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
          busy && 'cursor-not-allowed opacity-60',
        )}
      >
        <Upload className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-medium text-foreground">
          {busy ? 'Uploading…' : 'Drop files here, or click to browse'}
        </span>
        <span className="text-xs text-muted-foreground">Up to 25 MB per file</span>
      </button>
    </>
  );
}
