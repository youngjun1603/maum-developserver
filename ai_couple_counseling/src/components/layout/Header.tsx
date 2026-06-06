"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, MessageCircleHeart, Brain, FileText, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/test", label: "심리검사", icon: Brain },
  { href: "/couple", label: "커플 분석", icon: Heart },
  { href: "/coaching", label: "AI 코칭", icon: MessageCircleHeart },
  { href: "/kakaotalk", label: "카톡 분석", icon: FileText },
];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#F0D6DE]">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 gradient-primary rounded-xl flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-gradient">마음결</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                pathname === href
                  ? "bg-[#FFF0F5] text-[#E8789A]"
                  : "text-[#6B7280] hover:bg-[#FFF5F7] hover:text-[#E8789A]"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        <button
          className="md:hidden p-2 rounded-xl text-[#6B7280] hover:bg-[#FFF5F7]"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-[#F0D6DE] px-4 pb-4"
          >
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 rounded-xl mt-1 text-sm font-medium transition-all",
                  pathname === href
                    ? "bg-[#FFF0F5] text-[#E8789A]"
                    : "text-[#6B7280] hover:bg-[#FFF5F7]"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
