/**
 * OptimizedImage - Phase 2A guardrail wrapper for non-avatar <img> usage.
 *
 * Forces three things every raw <img> tends to forget:
 *   1. Supabase Storage transform sizing via `imageSize`
 *   2. Explicit width/height to prevent CLS
 *   3. `decoding="async"` + lazy loading (unless `priority`)
 *
 * Use for: event/space/opportunity covers, story heroes, inline thumbs,
 * link previews. For user avatars keep using <Avatar><AvatarImage/></Avatar>
 * (which is now transform-aware on its own).
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import { withImageTransform, type ImageSize } from "@/lib/images";

export interface OptimizedImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "loading" | "decoding"> {
  /** Supabase Storage transform preset. Defaults to 'cover-card' (480px). */
  imageSize?: ImageSize;
  /** Above-the-fold hero — disables lazy loading and bumps fetchpriority. */
  priority?: boolean;
  /** Required to prevent CLS. Use the slot size, not the source size. */
  width: number;
  height: number;
}

export const OptimizedImage = React.forwardRef<HTMLImageElement, OptimizedImageProps>(
  (
    { src, imageSize = "cover-card", priority = false, className, alt = "", ...props },
    ref
  ) => {
    const transformed = typeof src === "string" ? withImageTransform(src, imageSize) : src;
    return (
      <img
        ref={ref}
        src={transformed}
        alt={alt}
        decoding="async"
        loading={priority ? "eager" : "lazy"}
        // @ts-expect-error fetchpriority is valid HTML, React types lag
        fetchpriority={priority ? "high" : "auto"}
        className={cn(className)}
        {...props}
      />
    );
  }
);
OptimizedImage.displayName = "OptimizedImage";
