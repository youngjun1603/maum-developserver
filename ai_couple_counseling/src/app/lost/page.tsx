"use client";
import { useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  lostQuestions,
  lostTypes,
  calcLost,
  lostAxisMeta,
  calcLostCouple,
  type LostResult,
} from "@/data/lost";
import { Share2, RotateCcw, Sparkles, Users, Heart } from "lucide-react";
import Link from "next/link";

const LIKERT = [
  { v: 1, label: "전혀\n아니다" },
  { v: 2, label: "아니다" },
  { v: 3, label: "보통" },
  { v: 4, label: "그렇다" },
  { v: 5, label: "매우\n그렇다" },
];
const PER_PAGE = 10;
const PAGES = Math.ceil(lostQuestions.length / PER_PAGE);
const STORAGE_KEY = "maumkyeol_lost";

type Phase = "intro" | "test" | "result" | "couple";

// localStorage에 저장된 이전 결과를 캐시된 스냅샷으로 읽기 (useSyncExternalStore용)
let _cacheRaw: string | null | undefined;
let _cacheVal: LostResult | null = null;
function getSavedSnapshot(): LostResult | null {
  const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
  if (raw !== _cacheRaw) {
    _cacheRaw = raw;
    try {
      const parsed = raw ? (JSON.parse(raw) as LostResult) : null;
      _cacheVal = parsed?.typeCode ? parsed : null;
    } catch {
      _cacheVal = null;
    }
  }
  return _cacheVal;
}
const subscribeSaved = () => () => {};

export default function LostPage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [page, setPage] = useState(0);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [freshResult, setFreshResult] = useState<LostResult | null>(null);

  // 방금 검사한 결과 우선, 없으면 저장된 이전 결과
  const savedResult = useSyncExternalStore(subscribeSaved, getSavedSnapshot, () => null);
  const result = freshResult ?? savedResult;

  const pageQuestions = lostQuestions.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  const pageAnswered = pageQuestions.every((q) => responses[q.num] !== undefined);
  const answeredCount = Object.keys(responses).length;
  const progress = (answeredCount / lostQuestions.length) * 100;

  function pick(num: number, v: number) {
    setResponses((prev) => ({ ...prev, [num]: v }));
  }

  function next() {
    if (page < PAGES - 1) {
      setPage((p) => p + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const r = calcLost(responses);
      setFreshResult(r);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
        _cacheRaw = undefined; // 캐시 무효화
      } catch {}
      setPhase("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function restart() {
    setResponses({});
    setFreshResult(null);
    setPage(0);
    setPhase("test");
  }

  function shareResult() {
    if (!result) return;
    const t = lostTypes[result.typeCode];
    const text = `🧭 나의 LOST 행동유형은 "${t.icon} ${t.name} (${result.typeCode})"\n\n${t.desc}\n\n나도 검사해봐요!`;
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: "나의 LOST 행동유형", text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).catch(() => {});
    }
  }

  const myType = result ? lostTypes[result.typeCode] : null;

  return (
    <main className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-xl mx-auto">
        {/* ── 인트로 ── */}
        {phase === "intro" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="text-6xl mb-4">🧭</div>
            <h1 className="text-3xl font-bold text-gradient mb-3">LOST 행동유형 검사</h1>
            <p className="text-[#6B7280] leading-relaxed mb-2">
              60문항으로 알아보는 나의 행동 운영체계.<br />
              에너지·의사결정·행동·관계 4가지 축으로 16가지 유형 중 나를 찾아요.
            </p>
            <p className="text-sm text-[#9B8EF0] font-medium mb-8">약 8분 소요 · 무료</p>

            {result && myType && (
              <Card gradient className="mb-6 text-left">
                <div className="text-xs text-[#6B7280] mb-1">이전 검사 결과</div>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{myType.icon}</span>
                  <div>
                    <div className="font-bold text-[#2D2D2D]">{myType.name} <span className="text-[#9B8EF0]">{result.typeCode}</span></div>
                    <button onClick={() => setPhase("result")} className="text-xs text-[#E8789A] underline">결과 다시 보기 →</button>
                  </div>
                </div>
              </Card>
            )}

            <Button size="lg" className="w-full" onClick={() => { restart(); }}>
              <Sparkles className="w-5 h-5 mr-2" /> 검사 시작하기
            </Button>
          </motion.div>
        )}

        {/* ── 검사 ── */}
        {phase === "test" && (
          <div>
            <div className="sticky top-16 bg-[#FDFCF7]/90 backdrop-blur-sm py-3 z-10 -mx-4 px-4">
              <div className="h-1.5 rounded-full bg-[#EDE9FB] overflow-hidden mb-1.5">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #B9AEF5, #9B8EF0)" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="text-xs text-[#6B7280] text-right">{answeredCount} / {lostQuestions.length} · {page + 1}부</div>
            </div>

            <div className="flex flex-col gap-4 mt-4">
              {pageQuestions.map((q) => (
                <Card key={q.num} className="!p-4">
                  <div className="text-sm font-medium text-[#2D2D2D] mb-3 leading-snug">
                    <span className="text-[#9B8EF0] font-bold mr-1.5">{q.num}.</span>{q.content}
                  </div>
                  <div className="flex gap-1.5">
                    {LIKERT.map((opt) => (
                      <button
                        key={opt.v}
                        onClick={() => pick(q.num, opt.v)}
                        className={`flex-1 py-2 rounded-xl text-[11px] font-semibold leading-tight whitespace-pre-line transition-all ${
                          responses[q.num] === opt.v
                            ? "gradient-primary text-white"
                            : "bg-[#F5F3FB] text-[#6B7280] hover:bg-[#EDE9FB]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              {page > 0 && (
                <Button variant="outline" className="flex-1" onClick={() => { setPage((p) => p - 1); window.scrollTo({ top: 0 }); }}>
                  이전
                </Button>
              )}
              <Button className="flex-[2]" disabled={!pageAnswered} onClick={next}>
                {page < PAGES - 1 ? "다음" : "결과 보기"}
              </Button>
            </div>
            {!pageAnswered && (
              <p className="text-center text-xs text-[#6B7280] mt-3">이 페이지의 모든 문항에 답해주세요</p>
            )}
          </div>
        )}

        {/* ── 결과 ── */}
        {phase === "result" && result && myType && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="text-7xl mb-3">{myType.icon}</div>
            <div className="text-xs font-bold tracking-widest text-[#9B8EF0] mb-1">나의 LOST 행동유형</div>
            <h1 className="text-2xl font-bold text-[#2D2D2D]">{myType.name}</h1>
            <div className="inline-block my-3 px-4 py-1 rounded-full text-sm font-bold bg-[#F0EEFF] text-[#9B8EF0] tracking-widest">
              {result.typeCode}
            </div>
            <p className="text-sm text-[#6B7280] leading-relaxed mb-6 px-2">{myType.desc}</p>

            {/* 축별 막대 */}
            <Card className="text-left mb-4">
              <div className="text-xs font-bold text-[#6B7280] mb-3">행동 축 분석</div>
              <div className="flex flex-col gap-3">
                {lostAxisMeta.map((ax) => {
                  const letter = result.typeCode[ax.idx];
                  const axisKey = ["E", "D", "S", "R"][ax.idx];
                  const val = result.axisAvg[axisKey] ?? 3;
                  const pct = Math.min(100, Math.max(0, ((val - 1) / 4) * 100));
                  const [highKey, lowKey] = Object.keys(ax.letters); // [E,I] 형태: 높은 점수=highKey
                  const highLabel = ax.letters[highKey];
                  const lowLabel = ax.letters[lowKey];
                  return (
                    <div key={ax.idx}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className={letter === lowKey ? "font-bold text-[#9B8EF0]" : "text-[#6B7280]"}>{lowLabel}</span>
                        <span className="text-[#9B8EF0] font-bold">{ax.label}</span>
                        <span className={letter === highKey ? "font-bold text-[#9B8EF0]" : "text-[#6B7280]"}>{highLabel}</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#EDE9FB] overflow-hidden relative">
                        <div className="absolute top-0 bottom-0 w-0.5 bg-white/70 left-1/2" />
                        <div className="h-full rounded-full gradient-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <div className="flex flex-col gap-3 text-left mb-6">
              <Card className="!p-4">
                <div className="text-xs font-bold text-[#6B7280] mb-2">✨ 강점</div>
                <ul className="space-y-1">
                  {myType.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-[#2D2D2D] flex gap-2"><span className="text-[#9B8EF0]">·</span>{s}</li>
                  ))}
                </ul>
              </Card>
              <Card gradient className="!p-4">
                <div className="text-xs font-bold text-[#E8789A] mb-1">💕 연애 성향</div>
                <div className="text-sm text-[#2D2D2D]">{myType.love}</div>
              </Card>
              <Card className="!p-4">
                <div className="text-xs font-bold text-[#6B7280] mb-1">🌧️ 스트레스 반응 · {result.stressStyle}</div>
                <div className="text-sm text-[#2D2D2D]">{myType.stress}</div>
              </Card>
            </div>

            <Button size="lg" className="w-full mb-3" onClick={() => setPhase("couple")}>
              <Users className="w-5 h-5 mr-2" /> 커플로 분석하기
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={shareResult}>
                <Share2 className="w-4 h-4 mr-1.5" /> 공유
              </Button>
              <Button variant="outline" className="flex-1" onClick={restart}>
                <RotateCcw className="w-4 h-4 mr-1.5" /> 다시 검사
              </Button>
            </div>
            <Link href="/" className="block mt-4 text-sm text-[#6B7280]">← 홈으로 돌아가기</Link>
          </motion.div>
        )}

        {/* ── 커플 분석 ── */}
        {phase === "couple" && result && (
          <CoupleAnalysis myCode={result.typeCode} onBack={() => setPhase("result")} />
        )}
      </div>
    </main>
  );
}

function CoupleAnalysis({ myCode, onBack }: { myCode: string; onBack: () => void }) {
  const [partner, setPartner] = useState("");
  const my = lostTypes[myCode];
  const compat = partner ? calcLostCouple(myCode, partner) : null;
  const partnerType = partner ? lostTypes[partner] : null;
  const codes = Object.keys(lostTypes);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gradient mb-2">LOST 커플 분석</h1>
        <p className="text-sm text-[#6B7280]">상대방의 LOST 유형을 선택하면 궁합을 분석해드려요</p>
      </div>

      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="text-center">
          <div className="text-3xl">{my.icon}</div>
          <div className="text-xs font-bold text-[#2D2D2D] mt-1">나</div>
          <div className="text-[11px] text-[#9B8EF0] font-bold">{myCode}</div>
        </div>
        <Heart className="w-6 h-6 text-[#E8789A]" />
        <div className="text-center">
          <div className="text-3xl">{partnerType ? partnerType.icon : "❓"}</div>
          <div className="text-xs font-bold text-[#2D2D2D] mt-1">상대방</div>
          <div className="text-[11px] text-[#9B8EF0] font-bold">{partner || "—"}</div>
        </div>
      </div>

      <div className="mb-6">
        <label className="text-sm font-medium text-[#6B7280] mb-2 block">상대방의 LOST 유형</label>
        <select
          value={partner}
          onChange={(e) => setPartner(e.target.value)}
          className="w-full p-3 rounded-xl border-2 border-[#F0D6DE] bg-white text-[#2D2D2D] focus:outline-none focus:border-[#E8789A] text-sm"
        >
          <option value="">선택하세요</option>
          {codes.map((c) => (
            <option key={c} value={c}>{lostTypes[c].icon} {lostTypes[c].name} ({c})</option>
          ))}
        </select>
        <p className="text-xs text-[#6B7280] mt-1.5">상대방도 검사 후 자신의 4글자 유형코드를 알려주면 정확해요.</p>
      </div>

      <AnimatePresence>
        {compat && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card className="text-center">
              <div className="text-5xl mb-2">{compat.emoji}</div>
              <div className="text-5xl font-bold mb-1" style={{ color: compat.color }}>{compat.score}점</div>
              <div className="text-lg font-bold text-[#2D2D2D]">{compat.label}</div>
            </Card>

            <Card>
              <div className="text-xs font-bold text-[#6B7280] mb-3">축별 비교</div>
              <div className="flex flex-col gap-2.5">
                {compat.axisCompare.map((ax, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-[#6B7280] w-20 flex-shrink-0">{ax.label}</span>
                    <span className="font-medium text-[#2D2D2D]">{ax.me}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ax.same ? "bg-[#EAF5EC] text-[#4A9A5A]" : "bg-[#FFF4E5] text-[#E89B3A]"}`}>
                      {ax.same ? "같음" : "다름"}
                    </span>
                    <span className="font-medium text-[#2D2D2D]">{ax.partner}</span>
                  </div>
                ))}
              </div>
            </Card>

            {compat.strengths.length > 0 && (
              <Card gradient>
                <div className="font-bold text-[#2D2D2D] mb-2 flex items-center gap-2"><Heart className="w-4 h-4 text-[#E8789A]" /> 우리의 강점</div>
                <ul className="space-y-1.5">
                  {compat.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-[#6B7280] flex gap-2"><span className="text-[#E8789A] mt-0.5">✓</span>{s}</li>
                  ))}
                </ul>
              </Card>
            )}

            {compat.challenges.length > 0 && (
              <Card>
                <div className="font-bold text-[#2D2D2D] mb-2">⚡ 함께 맞춰갈 점</div>
                <ul className="space-y-1.5">
                  {compat.challenges.map((c, i) => (
                    <li key={i} className="text-sm text-[#6B7280] flex gap-2"><span className="text-[#FFB347] mt-0.5">!</span>{c}</li>
                  ))}
                </ul>
              </Card>
            )}

            <Card className="!p-4 bg-[#FFF8EE]">
              <div className="text-sm text-[#2D2D2D] leading-relaxed">{compat.overall}</div>
            </Card>

            <Link href="/coaching">
              <Button className="w-full" size="lg">AI 관계 코칭 받기 →</Button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={onBack} className="block mx-auto mt-6 text-sm text-[#6B7280]">← 내 결과로 돌아가기</button>
    </motion.div>
  );
}
