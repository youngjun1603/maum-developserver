"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { loveQuestions, loveTypes, calcLoveType, type LoveTypeKey } from "@/data/loveType";
import { Share2, RotateCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoveTypePage() {
  const [step, setStep] = useState(-1); // -1 = 인트로
  const [answers, setAnswers] = useState<LoveTypeKey[]>([]);
  const [result, setResult] = useState<LoveTypeKey | null>(null);

  function handleAnswer(type: LoveTypeKey) {
    const next = [...answers, type];
    setAnswers(next);
    if (next.length >= loveQuestions.length) {
      setResult(calcLoveType(next));
    } else {
      setStep((s) => s + 1);
    }
  }

  function reset() {
    setStep(-1);
    setAnswers([]);
    setResult(null);
  }

  function shareResult() {
    if (!result) return;
    const t = loveTypes[result];
    const text = `💕 나의 연애 유형은 "${t.emoji} ${t.name}"\n\n${t.short} — ${t.desc.slice(0, 50)}...\n\n나도 테스트해봐요!`;
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: "나의 연애 유형", text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).catch(() => {});
    }
  }

  const currentQ = loveQuestions[step];
  const t = result ? loveTypes[result] : null;
  const progress = step >= 0 ? ((step + 1) / loveQuestions.length) * 100 : 0;

  return (
    <main className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-xl mx-auto">
        {/* 인트로 */}
        {step === -1 && !result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="text-6xl mb-4">💝</div>
            <h1 className="text-3xl font-bold text-gradient mb-3">나의 연애 유형은?</h1>
            <p className="text-[#6B7280] leading-relaxed mb-8">
              7가지 질문으로 알아보는 나의 연애 스타일.<br />
              무료로 바로 시작할 수 있어요!
            </p>
            <div className="flex flex-col gap-3 mb-8 text-left">
              {Object.values(loveTypes).map((lt) => (
                <div
                  key={lt.name}
                  className="flex items-center gap-3 p-3 rounded-2xl border"
                  style={{ background: lt.pale, borderColor: `${lt.color}33` }}
                >
                  <span className="text-2xl">{lt.emoji}</span>
                  <div>
                    <div className="text-sm font-bold" style={{ color: lt.color }}>{lt.name}</div>
                    <div className="text-xs text-[#6B7280]">{lt.short}</div>
                  </div>
                </div>
              ))}
            </div>
            <Button size="lg" className="w-full" onClick={() => setStep(0)}>
              시작하기 →
            </Button>
          </motion.div>
        )}

        {/* 문항 */}
        {step >= 0 && !result && currentQ && (
          <div>
            <div className="mb-6">
              <div className="h-1.5 rounded-full bg-[#F0E0E8] overflow-hidden mb-2">
                <motion.div
                  className="h-full rounded-full gradient-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <div className="text-xs text-[#6B7280] text-right">{step + 1} / {loveQuestions.length}</div>
            </div>
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-xl font-bold text-[#2D2D2D] text-center leading-snug mb-7 px-2">
                Q{step + 1}. {currentQ.q}
              </h2>
              <div className="flex flex-col gap-3">
                {currentQ.opts.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(opt.type)}
                    className="p-4 rounded-2xl border-2 border-[#F0D6DE] bg-white text-left text-sm font-medium text-[#2D2D2D] hover:border-[#E8789A] hover:bg-[#FFF0F5] transition-all"
                  >
                    {opt.text}
                  </button>
                ))}
              </div>
            </motion.div>
            {step > 0 && (
              <button
                onClick={() => { setStep((s) => s - 1); setAnswers((a) => a.slice(0, -1)); }}
                className="mt-5 text-sm text-[#6B7280] inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> 이전 질문
              </button>
            )}
          </div>
        )}

        {/* 결과 */}
        <AnimatePresence>
          {result && t && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className="text-7xl mb-3">{t.emoji}</div>
              <div className="text-xs font-bold tracking-widest mb-1" style={{ color: t.color }}>나의 연애 유형</div>
              <h1 className="text-2xl font-bold text-[#2D2D2D] mb-3">{t.name}</h1>
              <div
                className="inline-block mb-6 px-4 py-1 rounded-full text-sm font-bold"
                style={{ background: `${t.color}18`, color: t.color }}
              >
                {t.short}
              </div>

              <div className="flex flex-col gap-3 text-left mb-6">
                <div className="p-4 rounded-2xl border" style={{ background: t.pale, borderColor: `${t.color}22` }}>
                  <div className="text-xs font-bold mb-1.5" style={{ color: t.color }}>💡 연애 성향</div>
                  <div className="text-sm text-[#2D2D2D] leading-relaxed">{t.desc}</div>
                </div>
                <Card className="!p-4">
                  <div className="text-xs font-bold text-[#6B7280] mb-1">✨ 강점</div>
                  <div className="text-sm text-[#2D2D2D]">{t.strength}</div>
                </Card>
                <Card className="!p-4">
                  <div className="text-xs font-bold text-[#6B7280] mb-1">💑 잘 맞는 유형</div>
                  <div className="text-sm text-[#2D2D2D]">{t.match}</div>
                </Card>
                <Card gradient className="!p-4">
                  <div className="text-xs font-bold text-[#E8789A] mb-1">💌 성장 팁</div>
                  <div className="text-sm text-[#2D2D2D]">{t.tip}</div>
                </Card>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1" onClick={shareResult}>
                  <Share2 className="w-4 h-4 mr-1.5" /> 결과 공유
                </Button>
                <Button variant="outline" className="flex-1" onClick={reset}>
                  <RotateCcw className="w-4 h-4 mr-1.5" /> 다시 하기
                </Button>
              </div>
              <Link href="/" className="block mt-3 text-sm text-[#6B7280]">← 홈으로 돌아가기</Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
