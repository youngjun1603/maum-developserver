"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Languages, Swords, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Mode = "translate" | "mediate";

const examples = {
  translate: ["아 그냥 됐어", "나 괜찮아", "네가 알아서 해", "왜 이제 연락해", "어 그래 잘됐네"],
  mediate: [
    "연인이 약속 시간에 매번 늦어서 크게 싸웠어요",
    "상대방이 친구들과 있을 때 연락을 잘 안 해서 싸웠어요",
    "가치관 차이로 진지한 갈등이 생겼어요",
  ],
};

export default function ToolsPage() {
  const [mode, setMode] = useState<Mode>("translate");
  const [input, setInput] = useState("");
  const [context, setContext] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!input.trim() || loading) return;
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, input, context }),
      });
      const data = await res.json();
      setResult(data.result || data.error);
    } catch {
      setResult("오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-3">관계 도구</h1>
          <p className="text-[#6B7280]">감정 번역기와 싸움 중재 AI를 사용해보세요</p>
        </div>

        <div className="flex gap-3 mb-6">
          {[
            { id: "translate" as Mode, label: "감정 번역기", icon: Languages, emoji: "🔍" },
            { id: "mediate" as Mode, label: "싸움 중재 AI", icon: Swords, emoji: "🤝" },
          ].map(({ id, label, emoji }) => (
            <button
              key={id}
              onClick={() => { setMode(id); setInput(""); setResult(""); setContext(""); }}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all font-semibold text-sm flex items-center justify-center gap-2 ${
                mode === id
                  ? "border-[#E8789A] bg-[#FFF0F5] text-[#E8789A]"
                  : "border-[#F0D6DE] bg-white text-[#6B7280] hover:bg-[#FFF5F7]"
              }`}
            >
              <span>{emoji}</span> {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={mode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mb-4">
              {mode === "translate" ? (
                <>
                  <h3 className="font-bold text-[#2D2D2D] mb-1">🔍 감정 번역기</h3>
                  <p className="text-sm text-[#6B7280] mb-4">
                    연인이 한 말의 진짜 감정과 의도를 분석해드려요
                  </p>
                  <div className="mb-3">
                    <label className="text-sm font-medium text-[#6B7280] block mb-2">상대방이 한 말</label>
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="예: '아 그냥 됐어' 또는 '나 괜찮아'"
                      rows={3}
                      className="w-full p-3 rounded-xl border-2 border-[#F0D6DE] text-[#2D2D2D] text-sm resize-none focus:outline-none focus:border-[#E8789A] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#6B7280] block mb-2">상황 맥락 (선택)</label>
                    <input
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      placeholder="예: 약속 취소 후, 싸운 직후 등"
                      className="w-full p-3 rounded-xl border-2 border-[#F0D6DE] text-[#2D2D2D] text-sm focus:outline-none focus:border-[#E8789A] transition-colors"
                    />
                  </div>
                </>
              ) : (
                <>
                  <h3 className="font-bold text-[#2D2D2D] mb-1">🤝 싸움 중재 AI</h3>
                  <p className="text-sm text-[#6B7280] mb-4">
                    싸운 상황을 설명하면 두 사람 모두를 위한 중재안을 드려요
                  </p>
                  <div>
                    <label className="text-sm font-medium text-[#6B7280] block mb-2">싸운 상황 설명</label>
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="어떤 일로 싸웠는지 편하게 설명해주세요"
                      rows={5}
                      className="w-full p-3 rounded-xl border-2 border-[#F0D6DE] text-[#2D2D2D] text-sm resize-none focus:outline-none focus:border-[#E8789A] transition-colors"
                    />
                  </div>
                </>
              )}

              <div className="mt-3">
                <p className="text-xs text-[#6B7280] mb-2">예시 바로 사용</p>
                <div className="flex flex-wrap gap-2">
                  {examples[mode].map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(ex)}
                      className="text-xs px-3 py-1.5 rounded-xl bg-[#FFF0F5] text-[#E8789A] hover:bg-[#F5D6E0] transition-colors"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            <Button className="w-full mb-6" size="lg" disabled={!input.trim() || loading} onClick={run}>
              {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : mode === "translate" ? "🔍 감정 분석하기" : "🤝 중재안 받기"}
            </Button>

            <AnimatePresence>
              {result && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card gradient>
                    <div className="prose prose-sm max-w-none text-[#2D2D2D]">
                      <ReactMarkdown>{result}</ReactMarkdown>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button variant="outline" size="sm" onClick={() => { setInput(""); setResult(""); }}>
                        초기화
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
