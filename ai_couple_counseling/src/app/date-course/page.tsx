"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Share2, RotateCcw, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";

const REGIONS = ["서울", "부산", "대구", "인천", "광주", "제주", "경기", "강원"];
const MOODS = [
  { emoji: "🌹", label: "로맨틱", desc: "분위기 있는 레스토랑, 야경, 와인" },
  { emoji: "⚡", label: "활동적", desc: "스포츠, 액티비티, 게임" },
  { emoji: "🌿", label: "힐링", desc: "자연, 카페, 산책, 온천" },
  { emoji: "🎨", label: "문화예술", desc: "전시, 공연, 영화, 미술관" },
];
const DURATIONS = ["반나절 (3~4시간)", "하루 (6~8시간)", "1박 2일"];
const BUDGETS = ["알뜰 (5만원 이하)", "보통 (5~15만원)", "특별 (15만원 이상)"];

export default function DateCoursePage() {
  const [region, setRegion] = useState("");
  const [mood, setMood] = useState("");
  const [duration, setDuration] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState("");
  const [error, setError] = useState("");

  const allSelected = region && mood && duration && budget;

  async function generate() {
    if (!allSelected || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/date-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region, mood, duration, budget }),
      });
      const data = await res.json();
      if (res.ok && data.course) {
        setCourse(data.course);
      } else {
        setError(data.error || "추천 생성에 실패했어요. 다시 시도해주세요.");
      }
    } catch {
      setError("서버 오류가 발생했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  function shareCourse() {
    const text = `💕 오늘의 데이트 코스 추천 (${region}, ${mood})\n\n${course}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: "데이트 코스 추천", text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).catch(() => {});
    }
  }

  return (
    <main className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🗺️</div>
          <h1 className="text-3xl font-bold text-gradient mb-3">AI 데이트 코스 추천</h1>
          <p className="text-[#6B7280]">조건을 선택하면 AI가 딱 맞는 데이트 코스를 추천해드려요</p>
        </div>

        <AnimatePresence mode="wait">
          {!course ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* 지역 */}
              <div className="mb-6">
                <div className="text-sm font-bold text-[#2D2D2D] mb-3">📍 어디서?</div>
                <div className="flex flex-wrap gap-2">
                  {REGIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRegion(r)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        region === r ? "gradient-primary text-white" : "bg-white text-[#2D2D2D] card-shadow"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* 분위기 */}
              <div className="mb-6">
                <div className="text-sm font-bold text-[#2D2D2D] mb-3">✨ 어떤 분위기?</div>
                <div className="flex flex-col gap-2">
                  {MOODS.map((m) => {
                    const key = `${m.emoji} ${m.label}`;
                    return (
                      <button
                        key={m.label}
                        onClick={() => setMood(key)}
                        className={`flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${
                          mood === key ? "border-[#E8789A] bg-[#FFF0F5]" : "border-[#F0D6DE] bg-white"
                        }`}
                      >
                        <span className="text-2xl">{m.emoji}</span>
                        <div>
                          <div className="text-sm font-bold text-[#2D2D2D]">{m.label}</div>
                          <div className="text-xs text-[#6B7280]">{m.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 시간 */}
              <div className="mb-6">
                <div className="text-sm font-bold text-[#2D2D2D] mb-3">⏰ 얼마나?</div>
                <div className="flex flex-col gap-2">
                  {DURATIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`p-3 rounded-2xl border-2 text-left text-sm font-medium transition-all ${
                        duration === d ? "border-[#9B8EF0] bg-[#F0EEFF] text-[#2D2D2D]" : "border-[#F0D6DE] bg-white text-[#2D2D2D]"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* 예산 */}
              <div className="mb-8">
                <div className="text-sm font-bold text-[#2D2D2D] mb-3">💰 예산은?</div>
                <div className="flex gap-2">
                  {BUDGETS.map((b) => (
                    <button
                      key={b}
                      onClick={() => setBudget(b)}
                      className={`flex-1 p-3 rounded-2xl border-2 text-xs font-medium leading-snug transition-all ${
                        budget === b ? "border-[#9B8EF0] bg-[#F0EEFF] text-[#2D2D2D]" : "border-[#F0D6DE] bg-white text-[#2D2D2D]"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-[#FFF0F0] border border-[#FFD0D0] text-sm text-[#D05555] text-center">
                  {error}
                </div>
              )}

              <Button size="lg" className="w-full" disabled={!allSelected || loading} onClick={generate}>
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> 코스 만드는 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" /> 데이트 코스 추천받기
                  </>
                )}
              </Button>
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card gradient>
                <div className="text-sm font-bold text-[#E8789A] mb-3">
                  🗺️ {region} · {mood}
                </div>
                <div className="text-sm text-[#2D2D2D] leading-relaxed whitespace-pre-wrap">{course}</div>
              </Card>
              <div className="flex gap-3 mt-4">
                <Button className="flex-1" onClick={shareCourse}>
                  <Share2 className="w-4 h-4 mr-1.5" /> 공유하기
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setCourse("")}>
                  <RotateCcw className="w-4 h-4 mr-1.5" /> 다시 추천
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Link href="/" className="block text-center mt-6 text-sm text-[#6B7280]">← 홈으로 돌아가기</Link>
      </div>
    </main>
  );
}
