import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

/**
 * DNA Avatar Sizes (from Design System PRD):
 * xs: 24px — inline mentions, small lists
 * sm: 32px — compact lists, reactions
 * md: 44px — feed cards, notifications, messages (default)
 * lg: 64px — profile cards, search results
 * xl: 96px — profile page (mobile)
 * xxl: 120px — profile page (desktop)
 */
const avatarSizeClasses = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-base",
  xl: "h-24 w-24 text-xl",
  xxl: "h-[120px] w-[120px] text-2xl",
} as const

type AvatarSize = keyof typeof avatarSizeClasses

interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  size?: AvatarSize
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, size = "md", ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex shrink-0 overflow-hidden rounded-full",
      avatarSizeClasses[size],
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-dna-emerald-subtle text-dna-emerald-dark font-semibold",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

/** Online indicator dot overlay */
const AvatarOnlineIndicator: React.FC<{ size?: AvatarSize }> = ({ size = "md" }) => {
  const dotSizes: Record<AvatarSize, string> = {
    xs: "h-1.5 w-1.5",
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3",
    xl: "h-3.5 w-3.5",
    xxl: "h-4 w-4",
  }
  return (
    <span
      className={cn(
        "absolute bottom-0 right-0 rounded-full bg-green-500 border-2 border-white",
        dotSizes[size]
      )}
    />
  )
}

/** Stacked avatar group with "+N" remainder */
interface AvatarGroupProps {
  avatars: { src?: string; fallback: string }[]
  max?: number
  size?: AvatarSize
  className?: string
}

const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 3,
  size = "sm",
  className,
}) => {
  const displayed = avatars.slice(0, max)
  const remainder = avatars.length - max

  return (
    <div className={cn("flex items-center -space-x-2", className)}>
      {displayed.map((avatar, i) => (
        <Avatar key={i} size={size} className="border-2 border-white">
          {avatar.src && <AvatarImage src={avatar.src} />}
          <AvatarFallback>{avatar.fallback}</AvatarFallback>
        </Avatar>
      ))}
      {remainder > 0 && (
        <div
          className={cn(
            "flex items-center justify-center rounded-full border-2 border-white bg-dna-stone text-dna-gray600 font-semibold",
            avatarSizeClasses[size],
            "text-[11px]"
          )}
        >
          +{remainder}
        </div>
      )}
    </div>
  )
}

export { Avatar, AvatarImage, AvatarFallback, AvatarOnlineIndicator, AvatarGroup }
export type { AvatarSize }
