"use client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  gradient?: boolean;
}

export function Card({ className, hover = false, gradient = false, children, onClick, style }: CardProps) {
  const base = "rounded-3xl p-6 bg-white card-shadow";

  if (hover) {
    return (
      <motion.div
        className={cn(base, gradient && "gradient-card", className)}
        whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(232,120,154,0.2)" }}
        transition={{ duration: 0.2 }}
        onClick={onClick}
        style={style}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={cn(base, gradient && "gradient-card", className)} onClick={onClick} style={style}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-xl font-bold text-[#2D2D2D]", className)}>{children}</h3>;
}

export function CardDescription({ className, children }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-[#6B7280] text-sm mt-1", className)}>{children}</p>;
}
