"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const EnhancedButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          // Enhanced default styling
          variant === "default" && 
            "bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 border-0",
          
          // Enhanced outline styling
          variant === "outline" && 
            "border-2 border-blue-200 text-blue-700 hover:bg-blue-50 font-medium shadow-sm hover:shadow-md transition-all duration-200",
          
          // Enhanced ghost styling
          variant === "ghost" && 
            "hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-medium transition-all duration-200",
          
          // Enhanced destructive styling
          variant === "destructive" && 
            "bg-red-600 hover:bg-red-700 shadow-md hover:shadow-lg transition-all duration-200 border-0",
          
          // Pass through any custom classes
          className
        )}
        {...props}
      />
    );
  }
);

EnhancedButton.displayName = "EnhancedButton";

export { EnhancedButton };