"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { parseKakaoTalk, ParsedChat } from "@/lib/kakaoParser";
import ReactMarkdown from "react-markdown";

type Phase = "upload" | "analyzing" | "result";

export default function KakaoTalkPage() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [parsed, setParsed] = useState<ParsedChat | null>(null);
  const [analysis, setAnalysis] = useState<string>("");
  const [stats, setStats] = useState<{ balance: { messageCounts: Record<string, number>; charCounts: Record<string, number> }; emotionData: { sender: string; positive: number; negative: number; neutral: number; total: number }[]; totalMessages: number; senders: string[] } | null>(null);
  const [error, setError] = useState<string>("");
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    if (!file.name.endsWith(".txt")) {
      setError("카카오톡 내보내기 .txt 파일을 업로드해주세요");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseKakaoTalk(text);
      if (result.totalCount < 5) {
        setError("대화 내용이 너무 적거나 파일 형식이 맞지 않아요. 카카오톡에서 '대화 내보내기'한 .txt 파일을 사용해주세요.");
        return;
      }
      setParsed(result);
      setError("");
    };
    reader.readAsText(file, "utf-8");
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  async function analyze() {
    if (!parsed) return;
    setPhase("analyzing");
    try {
      const res = await fetch("/api/kakaotalk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parsed }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAnalysis(data.analysis);
      setStats(data.stats);
      setPhase("result");
    } catch {
      setError("분석 중 오류가 발생했습니다. API 키를 확인해주세요.");
      setPhase("upload");
    }
  }

  return (
    <main className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-3">카톡 대화 분석</h1>
          <p className="text-[#6B7280]">대화 패턴을 AI가 분석해 관계 인사이트를 드려요</p>
        </div>

        <AnimatePresence mode="wait">
          {phase === "upload" && (
            <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="mb-4">
                <h3 className="font-bold text-[#2D2D2D] mb-3">📱 카카오톡 대화 내보내기 방법</h3>
                <ol className="space-y-2 text-sm text-[#6B7280]">
                  <li className="flex gap-2"><span className="text-[#E8789A] font-bold">1.</span>카카오톡 앱에서 대화방 열기</li>
                  <li className="flex gap-2"><span className="text-[#E8789A] font-bold">2.</span>우측 상단 메뉴(≡) → 대화 내보내기</li>
                  <li className="flex gap-2"><span className="text-[#E8789A] font-bold">3.</span>.txt 파일로 저장 후 업로드</li>
                </ol>
              </Card>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer mb-4 ${
                  dragging ? "border-[#E8789A] bg-[#FFF0F5]" : parsed ? "border-[#E8789A] bg-[#FFF0F5]" : "border-[#F0D6DE] bg-white"
                }`}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".txt"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />

                {parsed ? (
                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                    <CheckCircle2 className="w-12 h-12 text-[#E8789A] mx-auto mb-3" />
                    <p className="font-bold text-[#2D2D2D]">파일 업로드 완료!</p>
                    <p className="text-sm text-[#6B7280] mt-1">
                      총 {parsed.totalCount.toLocaleString()}개 메시지 · 참여자: {parsed.senders.join(", ")}
                    </p>
                    <p className="text-xs text-[#9B8EF0] mt-1">{parsed.dateRange.start} ~ {parsed.dateRange.end}</p>
                  </motion.div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-[#C0A8B0] mx-auto mb-3" />
                    <p className="font-semibold text-[#6B7280]">클릭하거나 파일을 드래그해주세요</p>
                    <p className="text-xs text-[#C0A8B0] mt-1">.txt 파일만 지원</p>
                  </>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-xl p-3 mb-4">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <Card className="mb-4 gradient-card">
                <div className="flex items-start gap-3">
                  <div className="text-lg">🔒</div>
                  <div>
                    <p className="font-medium text-[#2D2D2D] text-sm">개인정보 보호 안내</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      업로드된 대화 내용은 분석 후 즉시 삭제되며, 서버에 저장되지 않습니다.
                    </p>
                  </div>
                </div>
              </Card>

              <Button className="w-full" size="lg" disabled={!parsed} onClick={analyze}>
                <FileText className="w-5 h-5 mr-2" />
                AI 대화 분석 시작
              </Button>
            </motion.div>
          )}

          {phase === "analyzing" && (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <motion.div
                className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </motion.div>
              <h3 className="text-xl font-bold text-[#2D2D2D] mb-2">대화를 분석하고 있어요</h3>
              <p className="text-[#6B7280]">감정 패턴과 대화 흐름을 파악 중...</p>
              <p className="text-sm text-[#C0A8B0] mt-2">약 10~20초 소요됩니다</p>
            </motion.div>
          )}

          {phase === "result" && stats && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <Card>
                <h3 className="font-bold text-[#2D2D2D] mb-4">📊 대화 통계</h3>
                <div className="space-y-3">
                  {stats.senders.map((sender) => {
                    const count = stats.balance.messageCounts[sender] || 0;
                    const total = stats.totalMessages;
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    const emotion = stats.emotionData.find((e) => e.sender === sender);
                    return (
                      <div key={sender}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-[#2D2D2D]">{sender}</span>
                          <span className="text-[#6B7280]">{count}개 ({pct}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-[#F0D6DE] rounded-full overflow-hidden">
                          <motion.div
                            className="h-full gradient-primary rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                        {emotion && (
                          <div className="flex gap-3 mt-1.5 text-xs">
                            <span className="text-green-600">😊 긍정 {emotion.positive}</span>
                            <span className="text-red-400">😔 부정 {emotion.negative}</span>
                            <span className="text-[#6B7280]">😐 중립 {emotion.neutral}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card gradient>
                <h3 className="font-bold text-[#2D2D2D] mb-4">🤖 AI 분석 리포트</h3>
                <div className="prose prose-sm max-w-none text-[#2D2D2D]">
                  <ReactMarkdown>{analysis}</ReactMarkdown>
                </div>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => { setPhase("upload"); setParsed(null); setAnalysis(""); setStats(null); }}>
                  다시 분석
                </Button>
                <Button className="flex-1" onClick={() => {
                  navigator.clipboard?.writeText(analysis);
                }}>
                  결과 복사
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
