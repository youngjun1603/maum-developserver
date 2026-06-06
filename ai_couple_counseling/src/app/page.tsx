"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Brain, Heart, MessageCircleHeart, FileText, Sparkles, Shield, Languages, Swords, HeartHandshake, Target, Map, MessageCircle, Compass } from "lucide-react";

const features = [
  {
    href: "/test",
    icon: Brain,
    emoji: "🧠",
    title: "심리 검사",
    desc: "MBTI · 애착유형 · 사랑의 언어",
    color: "#9B8EF0",
    bgColor: "#F0EEFF",
  },
  {
    href: "/couple",
    icon: Heart,
    emoji: "💕",
    title: "커플 궁합 분석",
    desc: "두 사람의 성격 데이터로 관계 점수 측정",
    color: "#E8789A",
    bgColor: "#FFF0F5",
  },
  {
    href: "/coaching",
    icon: MessageCircleHeart,
    emoji: "💬",
    title: "AI 관계 코치",
    desc: "판단 없이 함께하는 대화형 코칭",
    color: "#E8789A",
    bgColor: "#FFF0F5",
  },
  {
    href: "/kakaotalk",
    icon: FileText,
    emoji: "📱",
    title: "카톡 대화 분석",
    desc: "대화 패턴으로 감정 온도 측정",
    color: "#9B8EF0",
    bgColor: "#F0EEFF",
  },
  {
    href: "/coaching/tools",
    icon: Languages,
    emoji: "🔍",
    title: "감정 번역기",
    desc: "'아 그냥 됐어'의 진짜 의미는?",
    color: "#FFB347",
    bgColor: "#FFF8EE",
  },
  {
    href: "/coaching/tools",
    icon: Swords,
    emoji: "🤝",
    title: "싸움 중재 AI",
    desc: "두 사람 모두를 위한 화해 가이드",
    color: "#FFB347",
    bgColor: "#FFF8EE",
  },
  {
    href: "/lost",
    icon: Compass,
    emoji: "🧭",
    title: "LOST 행동유형 검사",
    desc: "60문항 행동유형 + 커플 궁합 분석",
    color: "#9B8EF0",
    bgColor: "#F0EEFF",
  },
  {
    href: "/love-type",
    icon: HeartHandshake,
    emoji: "💝",
    title: "나의 연애 유형",
    desc: "7가지 질문으로 알아보는 연애 스타일",
    color: "#E8789A",
    bgColor: "#FFF0F5",
  },
  {
    href: "/quiz",
    icon: Target,
    emoji: "🎯",
    title: "커플 스타일 퀴즈",
    desc: "파트너와 함께 비교하는 10문항 퀴즈",
    color: "#FFB347",
    bgColor: "#FFF8EE",
  },
  {
    href: "/date-course",
    icon: Map,
    emoji: "🗺️",
    title: "AI 데이트 코스",
    desc: "조건에 딱 맞는 데이트 코스 추천",
    color: "#9B8EF0",
    bgColor: "#F0EEFF",
  },
  {
    href: "/daily",
    icon: MessageCircle,
    emoji: "💬",
    title: "오늘의 대화 질문",
    desc: "매일 하나씩 서로를 알아가는 질문",
    color: "#9B8EF0",
    bgColor: "#F0EEFF",
  },
];

const stats = [
  { value: "3가지", label: "심리 검사" },
  { value: "8가지", label: "분석 도구" },
  { value: "무료", label: "기본 이용" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen pt-20">
      {/* Hero */}
      <section className="px-4 py-16 text-center max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 text-sm text-[#E8789A] font-medium mb-6 card-shadow">
            <Sparkles className="w-4 h-4" />
            한국형 AI 관계 코칭 플랫폼
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-[#2D2D2D] mb-4 leading-tight">
            우리 관계를<br />
            <span className="text-gradient">이해해주는 AI</span>
          </h1>

          <p className="text-lg text-[#6B7280] mb-8 max-w-xl mx-auto leading-relaxed">
            심리 검사부터 커플 궁합, AI 코칭, 카톡 분석까지<br />
            판단 없이 공감하는 관계 코치가 여기 있어요
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/test">
              <Button size="lg">
                <Brain className="w-5 h-5 mr-2" />
                심리 검사 시작
              </Button>
            </Link>
            <Link href="/coaching">
              <Button size="lg" variant="outline">
                AI 코치 대화하기
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* 통계 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center gap-8 mt-12"
        >
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-bold text-gradient">{value}</div>
              <div className="text-sm text-[#6B7280]">{label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-4 pb-16 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl font-bold text-[#2D2D2D]">주요 기능</h2>
          <p className="text-[#6B7280] mt-1">관계의 모든 고민을 한 곳에서</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map(({ href, emoji, title, desc, bgColor }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i + 0.4 }}
            >
              <Link href={href}>
                <Card hover className="h-full">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ backgroundColor: bgColor }}
                    >
                      {emoji}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#2D2D2D]">{title}</h3>
                      <p className="text-sm text-[#6B7280] mt-0.5">{desc}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 pb-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-[#2D2D2D] text-center mb-8">이용 방법</h2>
        <div className="space-y-4">
          {[
            { step: "01", title: "심리 검사", desc: "MBTI, 애착유형, 사랑의 언어 검사를 완료하세요", emoji: "🧠" },
            { step: "02", title: "커플 궁합 분석", desc: "상대방의 결과와 함께 궁합 점수와 관계 리포트를 확인하세요", emoji: "💕" },
            { step: "03", title: "AI 코칭 시작", desc: "개인화된 AI 코치와 관계 고민을 자유롭게 나누세요", emoji: "💬" },
          ].map(({ step, title, desc, emoji }, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i + 0.6 }}
            >
              <Card className="flex items-center gap-4">
                <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {step}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#2D2D2D]">{emoji} {title}</h3>
                  <p className="text-sm text-[#6B7280] mt-0.5">{desc}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section className="px-4 pb-16 max-w-3xl mx-auto">
        <Card gradient className="text-center">
          <Shield className="w-10 h-10 text-[#E8789A] mx-auto mb-3" />
          <h3 className="font-bold text-[#2D2D2D] mb-2">개인정보 보호</h3>
          <p className="text-sm text-[#6B7280] leading-relaxed">
            모든 검사 결과는 브라우저에만 저장됩니다.<br />
            카톡 대화 내용은 분석 즉시 삭제되며 서버에 보관되지 않습니다.<br />
            본 서비스는 심리 교육 목적이며 의료 상담이 아닙니다.
          </p>
        </Card>
      </section>

      {/* CTA */}
      <section className="px-4 pb-24 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h2 className="text-2xl font-bold text-[#2D2D2D] mb-3">
            지금 바로 시작해보세요 💗
          </h2>
          <p className="text-[#6B7280] mb-6">3분으로 시작하는 관계 이해의 첫 걸음</p>
          <Link href="/test">
            <Button size="lg">
              <Sparkles className="w-5 h-5 mr-2" />
              무료로 검사 시작
            </Button>
          </Link>
        </motion.div>
      </section>
    </main>
  );
}
