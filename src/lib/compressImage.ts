/**
 * Client-side image compression using canvas.
 * Downscales oversized images to fit within maxDimension and target size.
 * Returns the original file if it's already small enough.
 */
export async function compressImage(
  file: File,
  opts: { maxDimension?: number; maxSizeBytes?: number; quality?: number } = {}
): Promise<File> {
  const maxDimension = opts.maxDimension ?? 1920;
  const maxSizeBytes = opts.maxSizeBytes ?? 5 * 1024 * 1024;
  const initialQuality = opts.quality ?? 0.85;

  // Skip GIFs (animation) and non-images
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return file;
  }

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const { width, height } = bitmap;
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);

  // Already small enough & no resize needed
  if (scale === 1 && file.size <= maxSizeBytes) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close();

  const outType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';

  let quality = initialQuality;
  let blob: Blob | null = await new Promise((res) =>
    canvas.toBlob(res, outType, quality)
  );

  // Iteratively reduce quality if still too big (JPEG only)
  while (blob && blob.size > maxSizeBytes && quality > 0.4 && outType === 'image/jpeg') {
    quality -= 0.1;
    blob = await new Promise((res) => canvas.toBlob(res, outType, quality));
  }

  if (!blob || blob.size >= file.size) return file;

  const ext = outType === 'image/png' ? 'png' : 'jpg';
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
  return new File([blob], `${baseName}.${ext}`, {
    type: outType,
    lastModified: Date.now(),
  });
}
