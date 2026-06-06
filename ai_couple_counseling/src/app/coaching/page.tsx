"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Send, Bot, User, Sparkles, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const quickPrompts = [
  "연인이 자꾸 차갑게 대하는데 왜 그런 걸까요?",
  "싸우고 나서 먼저 연락하기가 너무 어려워요",
  "상대방이 스킨십을 피하는 것 같아 속상해요",
  "연인이 제 감정을 이해 못 하는 것 같아요",
  "자꾸 같은 문제로 싸우는데 어떻게 해야 할까요?",
];

export default function CoachingPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userContext, setUserContext] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("maumkyeol_results") || "{}");
    const parts: string[] = [];
    if (stored.mbti) parts.push(`MBTI: ${stored.mbti}`);
    if (stored.attachment) {
      const labels: Record<string, string> = { secure: "안정형", anxious: "불안형", avoidant: "회피형", disorganized: "혼란형" };
      parts.push(`애착유형: ${labels[stored.attachment] || stored.attachment}`);
    }
    if (stored["love-language"]) {
      const labels: Record<string, string> = { words: "인정하는 말", touch: "스킨십", gifts: "선물", time: "함께하는 시간" };
      parts.push(`사랑의 언어: ${labels[stored["love-language"]] || stored["love-language"]}`);
    }
    if (parts.length) setUserContext(parts.join(", "));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(content: string) {
    if (!content.trim() || loading) return;

    const userMsg: Message = { role: "user", content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages([...newMessages, assistantMsg]);

    try {
      const res = await fetch("/api/coaching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, context: userContext }),
      });

      if (!res.ok) throw new Error("API 오류");
      if (!res.body) throw new Error("응답 없음");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setMessages([...newMessages, { role: "assistant", content: fullText }]);
      }
    } catch {
      setMessages([...newMessages, {
        role: "assistant",
        content: "죄송해요, 일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요 🙏",
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <main className="min-h-screen pt-20 pb-4 px-4">
      <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-5rem)]">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gradient">AI 관계 코치</h1>
            <p className="text-sm text-[#6B7280]">
              {userContext ? `${userContext} · 개인화 코칭 중` : "고민을 편하게 털어놓으세요"}
            </p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="p-2 rounded-xl text-[#6B7280] hover:bg-[#FFF0F5] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide pb-4">
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="mb-4 text-center" gradient>
                <div className="text-4xl mb-3">🤝</div>
                <h3 className="font-bold text-[#2D2D2D] mb-1">안녕하세요! 마음결 AI 코치예요</h3>
                <p className="text-sm text-[#6B7280]">
                  연애, 관계, 감정에 대한 고민을 편하게 이야기해주세요.<br />
                  판단 없이 함께 생각해드릴게요 💗
                </p>
              </Card>

              <p className="text-xs text-[#6B7280] mb-3 font-medium">자주 묻는 고민들</p>
              <div className="space-y-2">
                {quickPrompts.map((p, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => sendMessage(p)}
                    className="w-full text-left p-3 rounded-2xl border border-[#F0D6DE] bg-white text-sm text-[#2D2D2D] hover:bg-[#FFF0F5] hover:border-[#E8789A] transition-all"
                  >
                    {p}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                    msg.role === "user" ? "bg-[#9B8EF0]" : "gradient-primary"
                  )}>
                    {msg.role === "user"
                      ? <User className="w-4 h-4 text-white" />
                      : <Bot className="w-4 h-4 text-white" />}
                  </div>
                  <div className={cn(
                    "max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-[#9B8EF0] text-white rounded-tr-sm"
                      : "bg-white card-shadow text-[#2D2D2D] rounded-tl-sm"
                  )}>
                    {msg.role === "assistant" && msg.content === "" && loading ? (
                      <div className="flex gap-1 items-center py-1">
                        {[0, 1, 2].map((j) => (
                          <motion.div
                            key={j}
                            className="w-2 h-2 rounded-full bg-[#E8789A]"
                            animate={{ scale: [1, 1.4, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: j * 0.2 }}
                          />
                        ))}
                      </div>
                    ) : msg.role === "assistant" ? (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    ) : msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div ref={messagesEndRef} />
        </div>

        <div className="flex-shrink-0 pt-3 border-t border-[#F0D6DE]">
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="고민을 입력하세요... (Enter로 전송)"
              rows={1}
              className="flex-1 p-3 rounded-2xl border-2 border-[#F0D6DE] bg-white text-sm text-[#2D2D2D] resize-none focus:outline-none focus:border-[#E8789A] transition-colors placeholder:text-[#C0A8B0] max-h-32 overflow-y-auto"
              style={{ minHeight: "48px" }}
            />
            <motion.button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center text-white disabled:opacity-50 flex-shrink-0"
              whileTap={{ scale: 0.95 }}
            >
              {loading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </motion.button>
          </div>
          <p className="text-xs text-[#C0A8B0] text-center mt-2">
            이 서비스는 심리 코칭 목적이며 의료 상담이 아닙니다
          </p>
        </div>
      </div>
    </main>
  );
}
