
import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'search'
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = 'default', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base
          "flex w-full bg-background text-foreground ring-offset-background transition-[border-color,box-shadow] duration-150",
          "placeholder:text-dna-gray400",
          "focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-dna-focus",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          // Invalid state highlight (driven by aria-invalid="true")
          "aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-destructive/30",
          // Size: 16px on mobile to prevent iOS zoom
          "h-11 px-4 text-base md:text-[15px]",
          // Variant styles
          variant === 'default' && [
            "rounded-dna-md border-[1.5px] border-dna-stone",
          ],
          variant === 'search' && [
            "rounded-full border-none bg-dna-sand",
            "focus-visible:border-[1.5px] focus-visible:border-primary focus-visible:bg-background",
            "pl-10", // space for search icon
          ],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
