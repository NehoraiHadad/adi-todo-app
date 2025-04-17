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
import "@/styles/toast-animations.css"

export function Toaster() {
  const { toasts } = useToast()

  // Define icons for each variant
  const getToastIcon = (variant?: string) => {
    switch (variant) {
      case 'success':
        return <span className="text-xl sm:text-2xl mr-1 sm:mr-2 toast-icon">✅</span>;
      case 'destructive':
        return <span className="text-xl sm:text-2xl mr-1 sm:mr-2 toast-icon">❌</span>;
      default:
        return <span className="text-xl sm:text-2xl mr-1 sm:mr-2 toast-icon">ℹ️</span>;
    }
  };

  // Get animation class based on variant
  const getAnimationClass = (variant?: string) => {
    switch (variant) {
      case 'success':
        return 'toast-success';
      case 'destructive':
        return 'toast-error';
      default:
        return 'toast-default';
    }
  };

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast 
            key={id} 
            {...props} 
            variant={variant} 
            className={`${getAnimationClass(variant)} max-w-[90vw] sm:max-w-sm md:max-w-md`}
          >
            <div className="flex items-start">
              {getToastIcon(variant)}
              <div className="grid gap-1">
                {title && <ToastTitle className="text-sm sm:text-md font-bold mb-0 sm:mb-1">{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="text-xs sm:text-sm">{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
} 