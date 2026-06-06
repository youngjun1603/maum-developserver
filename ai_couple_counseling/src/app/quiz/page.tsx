"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { quizQuestions, quizTypes, calcQuizType, type QuizTypeKey } from "@/data/coupleQuiz";
import { Share2, RotateCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";

const KEYS: QuizTypeKey[] = ["A", "B", "C", "D"];

export default function QuizPage() {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<QuizTypeKey[]>([]);
  const [result, setResult] = useState<QuizTypeKey | null>(null);

  function handleAnswer(idx: number) {
    const next = [...answers, KEYS[idx]];
    setAnswers(next);
    if (next.length >= quizQuestions.length) {
      setResult(calcQuizType(next));
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
    const t = quizTypes[result];
    const text = `💕 나의 커플 스타일은 "${t.emoji} ${t.name}"\n\n${t.desc}\n\n나도 테스트해봐요!`;
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: "나의 커플 스타일", text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).catch(() => {});
    }
  }

  const curQ = quizQuestions[step];
  const t = result ? quizTypes[result] : null;
  const progress = step >= 0 ? ((step + 1) / quizQuestions.length) * 100 : 0;

  return (
    <main className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-xl mx-auto">
        {/* 인트로 */}
        {step === -1 && !result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h1 className="text-3xl font-bold text-gradient mb-3">우리 커플 스타일은?</h1>
            <p className="text-[#6B7280] leading-relaxed mb-8">
              10문항으로 알아보는 나의 커플 스타일.<br />
              파트너와 함께 해보고 비교해보세요! 무료예요.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              {Object.values(quizTypes).map((qt) => (
                <div key={qt.name} className="px-4 py-2 rounded-full bg-white card-shadow text-sm text-[#2D2D2D]">
                  {qt.emoji} {qt.name}
                </div>
              ))}
            </div>
            <Button size="lg" className="w-full" onClick={() => setStep(0)}>
              시작하기 →
            </Button>
          </motion.div>
        )}

        {/* 문항 */}
        {step >= 0 && !result && curQ && (
          <div>
            <div className="mb-6">
              <div className="h-1.5 rounded-full bg-[#FCEBD2] overflow-hidden mb-2">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #FFCB7D, #FFB347)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <div className="text-xs text-[#6B7280] text-right">{step + 1} / {quizQuestions.length}</div>
            </div>
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-xl font-bold text-[#2D2D2D] text-center leading-snug mb-7 px-2">
                Q{step + 1}. {curQ.q}
              </h2>
              <div className="flex flex-col gap-3">
                {curQ.opts.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    className="p-4 rounded-2xl border-2 border-[#FCE3BD] bg-white text-left text-sm font-medium text-[#2D2D2D] hover:border-[#FFB347] hover:bg-[#FFF8EE] transition-all"
                  >
                    <span className="font-bold text-[#FFB347] mr-2">{KEYS[i]}.</span>
                    {opt}
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
              <div className="text-xs font-bold tracking-widest text-[#FFB347] mb-1">나의 커플 스타일</div>
              <h1 className="text-2xl font-bold text-[#2D2D2D] mb-6">{t.name}</h1>

              <div className="flex flex-col gap-3 text-left mb-6">
                <div className="p-4 rounded-2xl border border-[#FCE3BD] bg-[#FFFBF0]">
                  <div className="text-xs font-bold text-[#FFB347] mb-1.5">💡 나의 연애 스타일</div>
                  <div className="text-sm text-[#2D2D2D] leading-relaxed">{t.desc}</div>
                </div>
                <Card gradient className="!p-4">
                  <div className="text-xs font-bold text-[#E8789A] mb-1">💌 파트너와의 성장 팁</div>
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
