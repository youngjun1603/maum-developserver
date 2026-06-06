"use client";
import { useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { dailyQuestions } from "@/data/dailyQuestions";
import { Share2, RefreshCw, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function DailyPage() {
  const [offset, setOffset] = useState(0);
  const [copied, setCopied] = useState(false);

  // 클라이언트에서만 오늘 날짜를 읽어 SSR 하이드레이션 불일치 방지 (서버 스냅샷=0)
  const baseDay = useSyncExternalStore(
    () => () => {},
    () => Math.floor(Date.now() / 86400000),
    () => 0
  );

  const dayIdx = (baseDay + offset) % dailyQuestions.length;
  const q = dailyQuestions[dayIdx];

  function share() {
    const text = `💕 오늘의 커플 대화 질문\n\n"${q}"`;
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: "오늘의 커플 질문", text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <main className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-3">오늘의 대화 질문</h1>
          <p className="text-[#6B7280]">매일 하나씩, 서로를 더 깊이 알아가는 질문이에요</p>
        </div>

        <Card gradient className="text-center">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-1.5 text-[#E8789A] font-bold text-sm">
              <MessageCircle className="w-4 h-4" /> 커플 대화 질문
            </div>
            <span className="text-xs text-[#6B7280] bg-white/70 px-3 py-1 rounded-full">Day {dayIdx + 1}</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={dayIdx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="text-lg font-semibold text-[#2D2D2D] leading-relaxed bg-white/70 rounded-2xl py-6 px-5"
            >
              &ldquo;{q}&rdquo;
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-3 mt-5">
            <Button variant="ghost" className="flex-1 bg-white/70" onClick={() => setOffset((o) => o + 1)}>
              <RefreshCw className="w-4 h-4 mr-1.5" /> 다음 질문
            </Button>
            <Button className="flex-1" onClick={share}>
              <Share2 className="w-4 h-4 mr-1.5" /> {copied ? "복사됨!" : "파트너와 공유"}
            </Button>
          </div>
        </Card>

        <Link href="/" className="block text-center mt-6 text-sm text-[#6B7280]">← 홈으로 돌아가기</Link>
      </div>
    </main>
  );
}
