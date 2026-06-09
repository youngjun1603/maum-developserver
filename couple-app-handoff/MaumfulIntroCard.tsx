"use client";
// 마음풀(maumful.com) 소개 카드 — AI 커플 카운슬링 앱에 드롭인용
// 의존성: framer-motion(선택), Tailwind. framer-motion이 없으면 motion.a → a 로 바꾸고 initial/animate/whileHover props 제거.
import { motion } from "framer-motion";

// UTM으로 커플 앱發 유입을 측정할 수 있음
const MAUMFUL_URL = "https://maumful.com/?utm_source=maumcouple&utm_medium=app_intro";

const FEATURES = [
  { emoji: "🧠", label: "전문 심리검사 12종" },
  { emoji: "💬", label: "AI 마음 상담" },
  { emoji: "🌱", label: "마음 치유 게임" },
  { emoji: "🤝", label: "전문 상담사 연결" },
];

export default function MaumfulIntroCard() {
  return (
    <motion.a
      href={MAUMFUL_URL}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3 }}
      className="block rounded-3xl p-6 bg-white border border-[#DCEDE3] no-underline"
      style={{ boxShadow: "0 4px 24px rgba(45,106,79,0.08)" }}
    >
      {/* 브랜드 헤더 */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🌿</span>
        <span className="text-lg font-bold text-[#2D6A4F]">마음풀</span>
        <span className="text-xs text-[#9AA5A0] ml-auto">나를 이해하는 첫걸음</span>
      </div>

      {/* 헤드라인 */}
      <h3 className="text-xl font-bold text-[#2D2D2D] leading-snug mb-1.5">
        관계만큼 소중한, <span className="text-[#2D6A4F]">내 마음 돌봄</span>
      </h3>
      <p className="text-sm text-[#6B7280] leading-relaxed mb-4">
        전문 심리검사와 AI 마음 상담으로 나를 더 깊이 이해해보세요.
      </p>

      {/* 기능 칩 */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        {FEATURES.map((f) => (
          <div
            key={f.label}
            className="flex items-center gap-2 text-sm text-[#3D4D45] bg-[#F2F9F5] rounded-xl px-3 py-2"
          >
            <span>{f.emoji}</span>
            {f.label}
          </div>
        ))}
      </div>

      {/* CTA */}
      <div
        className="w-full text-center py-3 rounded-2xl font-semibold text-white"
        style={{ background: "linear-gradient(135deg,#2D6A4F,#40916C)" }}
      >
        마음풀 둘러보기 →
      </div>
    </motion.a>
  );
}
