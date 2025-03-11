"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle, AlertCircle, Info, XCircle } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  // Helper function to get the appropriate icon based on variant
  const getToastIcon = (variant?: string | null) => {
    switch (variant) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "destructive":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-amber-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  // Helper function to get the appropriate class based on variant
  const getToastClass = (variant?: string | null): string => {
    if (variant === "destructive") {
      return "border-red-200 bg-red-50 text-red-900";
    }
    if (variant === "success") {
      return "border-green-200 bg-green-50 text-green-900";
    }
    if (variant === "warning") {
      return "border-amber-200 bg-amber-50 text-amber-900";
    }
    return "border-blue-200 bg-blue-50 text-blue-900";
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast 
            key={id} 
            {...props}
            className={`group ${getToastClass(variant)}`}
          >
            <div className="flex gap-3">
              <div className="mt-1 flex-shrink-0">
                {getToastIcon(variant)}
              </div>
              <div className="grid flex-1 gap-1">
                {title && <ToastTitle className="font-medium">{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="text-sm opacity-90">
                    {description}
                  </ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose className="absolute right-2 top-2 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100" />
          </Toast>
        )
      })}
      <ToastViewport className="p-4 md:p-6" />
    </ToastProvider>
  )
}