import { createPortal } from "react-dom"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  // Portaled to document.body: <Toaster /> sits nested in the app tree, and a
  // fixed element inside an ancestor stacking context can never paint over a
  // body-level portal (Sheet/Dialog), no matter its z-index. As a body-level
  // sibling of those portals, the viewport's z-[99999] actually competes.
  if (typeof document === "undefined") return null

  return createPortal(
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>,
    document.body
  )
}
