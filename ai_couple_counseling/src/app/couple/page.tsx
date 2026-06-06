"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { calcCompatibility, mbtiDescriptions, attachmentDescriptions, loveLangDescriptions } from "@/lib/scoring";
import { Heart, AlertCircle, Sparkles } from "lucide-react";
import Link from "next/link";

const mbtiOptions = Object.keys(mbtiDescriptions);
const attachOptions = ["secure", "anxious", "avoidant", "disorganized"];
const attachLabels: Record<string, string> = { secure: "안정형", anxious: "불안형", avoidant: "회피형", disorganized: "혼란형" };
const loveOptions = ["words", "touch", "gifts", "time"];
const loveLangTitles: Record<string, string> = { words: "인정하는 말", touch: "스킨십", gifts: "선물", time: "함께하는 시간" };

interface Profile {
  mbti: string;
  attachment: string;
  loveLang: string;
}

function ProfileForm({ label, value, onChange }: { label: string; value: Profile; onChange: (v: Profile) => void }) {
  return (
    <Card gradient className="flex-1">
      <h3 className="font-bold text-[#2D2D2D] mb-4 text-center">{label}</h3>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-[#6B7280] mb-2 block">MBTI</label>
          <select
            value={value.mbti}
            onChange={(e) => onChange({ ...value, mbti: e.target.value })}
            className="w-full p-3 rounded-xl border-2 border-[#F0D6DE] bg-white text-[#2D2D2D] focus:outline-none focus:border-[#E8789A] text-sm"
          >
            <option value="">선택하세요</option>
            {mbtiOptions.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-[#6B7280] mb-2 block">애착유형</label>
          <select
            value={value.attachment}
            onChange={(e) => onChange({ ...value, attachment: e.target.value })}
            className="w-full p-3 rounded-xl border-2 border-[#F0D6DE] bg-white text-[#2D2D2D] focus:outline-none focus:border-[#E8789A] text-sm"
          >
            <option value="">선택하세요</option>
            {attachOptions.map((a) => <option key={a} value={a}>{attachLabels[a]}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-[#6B7280] mb-2 block">사랑의 언어</label>
          <select
            value={value.loveLang}
            onChange={(e) => onChange({ ...value, loveLang: e.target.value })}
            className="w-full p-3 rounded-xl border-2 border-[#F0D6DE] bg-white text-[#2D2D2D] focus:outline-none focus:border-[#E8789A] text-sm"
          >
            <option value="">선택하세요</option>
            {loveOptions.map((l) => <option key={l} value={l}>{loveLangTitles[l]}</option>)}
          </select>
        </div>
      </div>
    </Card>
  );
}

function ScoreCircle({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? "#E8789A" : score >= 60 ? "#9B8EF0" : "#FFB347";
  return (
    <div className="text-center">
      <div className="relative w-16 h-16 mx-auto mb-2">
        <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
          <circle cx="18" cy="18" r="15" fill="none" stroke="#F0D6DE" strokeWidth="3" />
          <motion.circle
            cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${(score / 100) * 94} 94`}
            strokeLinecap="round"
            initial={{ strokeDasharray: "0 94" }}
            animate={{ strokeDasharray: `${(score / 100) * 94} 94` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
      <p className="text-xs text-[#6B7280]">{label}</p>
    </div>
  );
}

export default function CouplePage() {
  const [p1, setP1] = useState<Profile>({ mbti: "", attachment: "", loveLang: "" });
  const [p2, setP2] = useState<Profile>({ mbti: "", attachment: "", loveLang: "" });
  const [result, setResult] = useState<ReturnType<typeof calcCompatibility> | null>(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("maumkyeol_results") || "{}");
    if (stored.mbti) setP1((p) => ({ ...p, mbti: stored.mbti }));
    if (stored.attachment) setP1((p) => ({ ...p, attachment: stored.attachment }));
    if (stored["love-language"]) setP1((p) => ({ ...p, loveLang: stored["love-language"] }));
  }, []);

  const isReady = p1.mbti && p1.attachment && p1.loveLang && p2.mbti && p2.attachment && p2.loveLang;

  function analyze() {
    if (!isReady) return;
    const r = calcCompatibility(p1.mbti, p2.mbti, p1.attachment, p2.attachment, p1.loveLang, p2.loveLang);
    setResult(r);
  }

  function getScoreLabel(score: number) {
    if (score >= 85) return { label: "천생연분", emoji: "💕", color: "#E8789A" };
    if (score >= 70) return { label: "잘 맞는 편", emoji: "💗", color: "#9B8EF0" };
    if (score >= 55) return { label: "노력이 필요", emoji: "💛", color: "#FFB347" };
    return { label: "도전적인 관계", emoji: "🌱", color: "#6B7280" };
  }

  return (
    <main className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-3">커플 궁합 분석</h1>
          <p className="text-[#6B7280]">두 사람의 성격 데이터로 관계를 분석해드려요</p>
          <Link href="/test" className="text-sm text-[#E8789A] underline mt-1 inline-block">
            검사를 아직 안 하셨나요? →
          </Link>
        </div>

        <div className="flex gap-4 mb-6 flex-col sm:flex-row">
          <ProfileForm label="👤 나" value={p1} onChange={setP1} />
          <ProfileForm label="💑 상대방" value={p2} onChange={setP2} />
        </div>

        {!isReady && (
          <div className="flex items-center gap-2 text-sm text-[#6B7280] bg-[#FFF0F5] rounded-xl p-3 mb-4">
            <AlertCircle className="w-4 h-4 text-[#E8789A] flex-shrink-0" />
            두 사람의 모든 항목을 입력해야 분석이 시작돼요
          </div>
        )}

        <Button className="w-full" size="lg" disabled={!isReady} onClick={analyze}>
          <Sparkles className="w-5 h-5 mr-2" />
          궁합 분석하기
        </Button>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-4">
              {(() => {
                const info = getScoreLabel(result.total);
                return (
                  <Card className="text-center">
                    <p className="text-5xl mb-3">{info.emoji}</p>
                    <div className="text-5xl font-bold mb-1" style={{ color: info.color }}>{result.total}점</div>
                    <p className="text-xl font-bold text-[#2D2D2D]">{info.label}</p>

                    <div className="flex justify-center gap-8 mt-6">
                      <ScoreCircle score={result.mbtiScore} label="성격 궁합" />
                      <ScoreCircle score={result.attachScore} label="애착 궁합" />
                      <ScoreCircle score={result.loveScore} label="사랑 언어" />
                    </div>
                  </Card>
                );
              })()}

              {result.strengths.length > 0 && (
                <Card gradient>
                  <h3 className="font-bold text-[#2D2D2D] mb-3 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-[#E8789A]" /> 우리 커플의 강점
                  </h3>
                  <ul className="space-y-2">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#6B7280]">
                        <span className="text-[#E8789A] mt-0.5">✓</span> {s}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {result.challenges.length > 0 && (
                <Card>
                  <h3 className="font-bold text-[#2D2D2D] mb-3 flex items-center gap-2">
                    <span className="text-yellow-500">⚡</span> 주의해야 할 부분
                  </h3>
                  <ul className="space-y-2">
                    {result.challenges.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#6B7280]">
                        <span className="text-yellow-500 mt-0.5">!</span> {c}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              <div className="mt-2">
                <Link href="/coaching">
                  <Button className="w-full" size="lg">
                    AI 관계 코칭 받기 →
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
