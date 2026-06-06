"use client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const base = "inline-flex items-center justify-center rounded-2xl font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary: "gradient-primary text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
      secondary: "bg-[#9B8EF0] text-white shadow-md hover:bg-[#8577E0] hover:scale-[1.02] active:scale-[0.98]",
      outline: "border-2 border-[#E8789A] text-[#E8789A] hover:bg-[#FFF0F5] active:scale-[0.98]",
      ghost: "text-[#6B7280] hover:bg-[#F9F0F3] active:scale-[0.98]",
    };

    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
    };

    return (
      <motion.button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        whileTap={{ scale: 0.97 }}
        {...(props as Parameters<typeof motion.button>[0])}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
export default Button;
