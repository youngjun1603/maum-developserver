"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  label?: string;
}

export default function ProgressBar({ value, max, className, label }: ProgressBarProps) {
  const percent = Math.round((value / max) * 100);

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="flex justify-between text-sm text-[#6B7280] mb-2">
          <span>{label}</span>
          <span>{value} / {max}</span>
        </div>
      )}
      <div className="w-full h-3 bg-[#F0D6DE] rounded-full overflow-hidden">
        <motion.div
          className="h-full gradient-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
