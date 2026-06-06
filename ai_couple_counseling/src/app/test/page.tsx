"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { testConfigs } from "@/data/tests";
import { calcMbti, calcAttachment, calcLoveLang, mbtiDescriptions, attachmentDescriptions, loveLangDescriptions } from "@/lib/scoring";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
import { CheckCircle2, ChevronLeft, Share2 } from "lucide-react";
import Link from "next/link";

type Phase = "select" | "quiz" | "result";

export default function TestPage() {
  const [phase, setPhase] = useState<Phase>("select");
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [result, setResult] = useState<string | null>(null);

  const config = testConfigs.find((t) => t.id === selectedTest);

  function startTest(id: string) {
    setSelectedTest(id);
    setAnswers([]);
    setCurrentQ(0);
    setResult(null);
    setPhase("quiz");
  }

  function handleAnswer(value: string) {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);
    if (config && currentQ + 1 >= config.questions.length) {
      let r = "";
      if (config.id === "mbti") r = calcMbti(newAnswers);
      if (config.id === "attachment") r = calcAttachment(newAnswers);
      if (config.id === "love-language") r = calcLoveLang(newAnswers);
      setResult(r);
      setPhase("result");
      // 로컬스토리지에 저장
      const stored = JSON.parse(localStorage.getItem("maumkyeol_results") || "{}");
      stored[config.id] = r;
      localStorage.setItem("maumkyeol_results", JSON.stringify(stored));
    } else {
      setCurrentQ((q) => q + 1);
    }
  }

  function getResultInfo() {
    if (!result || !config) return null;
    if (config.id === "mbti") return mbtiDescriptions[result];
    if (config.id === "attachment") return attachmentDescriptions[result];
    if (config.id === "love-language") return loveLangDescriptions[result];
    return null;
  }

  return (
    <main className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {phase === "select" && (
            <motion.div key="select" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-gradient mb-3">심리 검사</h1>
                <p className="text-[#6B7280]">나를 알아야 상대를 이해할 수 있어요</p>
              </div>
              <div className="space-y-4">
                {testConfigs.map((test) => {
                  const stored = typeof window !== "undefined"
                    ? JSON.parse(localStorage.getItem("maumkyeol_results") || "{}")
                    : {};
                  const done = stored[test.id];
                  return (
                    <Card key={test.id} hover className="cursor-pointer" onClick={() => startTest(test.id)}>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl gradient-card flex items-center justify-center text-3xl flex-shrink-0">
                          {test.emoji}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-[#2D2D2D]">{test.title}</h3>
                            {done && <CheckCircle2 className="w-4 h-4 text-[#E8789A]" />}
                          </div>
                          <p className="text-sm text-[#6B7280] mt-0.5">{test.description}</p>
                          <p className="text-xs text-[#9B8EF0] mt-1">{test.duration} • {test.questions.length}문항</p>
                          {done && (
                            <p className="text-xs text-[#E8789A] mt-1 font-medium">완료: {done.toUpperCase()}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
              <div className="mt-8 text-center">
                <Link href="/couple">
                  <Button variant="outline">커플 궁합 분석하러 가기 →</Button>
                </Link>
              </div>
            </motion.div>
          )}

          {phase === "quiz" && config && (
            <motion.div key="quiz" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="flex items-center gap-3 mb-8">
                <button onClick={() => setPhase("select")} className="p-2 rounded-xl hover:bg-[#FFF0F5] text-[#6B7280]">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <p className="text-sm text-[#6B7280] mb-2">{config.title}</p>
                  <ProgressBar value={currentQ} max={config.questions.length} />
                </div>
                <span className="text-sm font-medium text-[#E8789A]">{currentQ + 1}/{config.questions.length}</span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQ}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="mb-6">
                    <p className="text-lg font-semibold text-[#2D2D2D] leading-relaxed">
                      {config.questions[currentQ].text}
                    </p>
                  </Card>
                  <div className="space-y-3">
                    {config.questions[currentQ].options.map((opt) => (
                      <motion.button
                        key={opt.value}
                        onClick={() => handleAnswer(opt.value)}
                        className="w-full text-left p-4 rounded-2xl border-2 border-[#F0D6DE] bg-white hover:border-[#E8789A] hover:bg-[#FFF0F5] transition-all font-medium text-[#2D2D2D]"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {opt.label}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}

          {phase === "result" && result && config && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center mb-8">
                <motion.div
                  className="text-7xl mb-4"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  {getResultInfo()?.emoji}
                </motion.div>
                <div className="inline-block gradient-primary text-white text-2xl font-bold px-6 py-3 rounded-2xl mb-3">
                  {config.id === "mbti" ? result.toUpperCase() : getResultInfo()?.title}
                </div>
                <h2 className="text-xl font-bold text-[#2D2D2D]">{getResultInfo()?.title}</h2>
              </div>

              <Card className="mb-4">
                <h3 className="font-bold text-[#2D2D2D] mb-2">성격 설명</h3>
                <p className="text-[#6B7280] leading-relaxed">{getResultInfo()?.desc}</p>
              </Card>

              <Card className="mb-8" gradient>
                <h3 className="font-bold text-[#2D2D2D] mb-2">
                  {config.id === "mbti" ? "💑 연애 스타일" :
                    config.id === "attachment" ? "💡 관계 조언" : "💌 사랑 표현법"}
                </h3>
                <p className="text-[#6B7280] leading-relaxed">
                  {config.id === "mbti" ? (mbtiDescriptions[result] as { love: string })?.love :
                    config.id === "attachment" ? (attachmentDescriptions[result] as { advice: string })?.advice :
                      (loveLangDescriptions[result] as { give: string })?.give}
                </p>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => { setPhase("select"); }}>
                  다른 검사하기
                </Button>
                <Button className="flex-1" onClick={() => {
                  const text = `나의 ${config.title} 결과: ${getResultInfo()?.title} ${getResultInfo()?.emoji}\n마음결에서 확인해보세요!`;
                  navigator.clipboard?.writeText(text);
                }}>
                  <Share2 className="w-4 h-4 mr-2" />
                  결과 공유
                </Button>
              </div>

              <div className="mt-4 text-center">
                <Link href="/couple">
                  <Button variant="ghost" className="w-full">커플 궁합 분석하러 가기 →</Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
