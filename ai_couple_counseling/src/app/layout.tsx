import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "마음결 — AI 관계 코치",
  description: "심리검사 + 커플 궁합 분석 + AI 코칭을 하나로. 한국형 AI 관계 코칭 플랫폼",
  keywords: "MBTI 궁합, 애착유형, 커플 상담, AI 관계 코칭, 카톡 분석",
  openGraph: {
    title: "마음결 — AI 관계 코치",
    description: "우리 관계를 이해해주는 AI",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen gradient-warm">
        <Header />
        {children}
      </body>
    </html>
  );
}
