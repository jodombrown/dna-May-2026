
import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-dna-md border-[1.5px] border-dna-stone bg-background px-4 py-3 text-base md:text-[15px] text-foreground ring-offset-background",
          "placeholder:text-dna-gray400",
          "focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-dna-focus",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-[border-color,box-shadow] duration-150",
          // Invalid state highlight (driven by aria-invalid="true")
          "aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-destructive/30",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
