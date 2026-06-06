import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { mode, input, context } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "API 키 미설정" }), { status: 500 });
    }

    let prompt = "";

    if (mode === "translate") {
      prompt = `다음은 연인이 한 말입니다. 이 말 뒤에 숨어있는 진짜 감정과 의도를 분석해주세요.

상대방의 말: "${input}"
${context ? `맥락: ${context}` : ""}

다음 형식으로 답해주세요:

## 💭 진짜 감정
(이 말 뒤에 숨어있는 진짜 감정을 2~3문장으로)

## 🎯 진짜 원하는 것
(상대방이 진짜 원하는 것은 무엇인지)

## 💬 이렇게 반응해보세요
(상황에 맞는 구체적인 답변 예시 1~2개)

---
판단 없이, 공감적 시각으로 분석해주세요.`;
    } else if (mode === "mediate") {
      prompt = `다음은 커플이 싸운 상황입니다. 두 사람이 화해할 수 있도록 중재해주세요.

싸운 상황: "${input}"
${context ? `추가 정보: ${context}` : ""}

다음 형식으로 답해주세요:

## 💗 두 사람의 감정 이해

**A의 감정**: (상황에서 A가 느꼈을 감정)
**B의 감정**: (상황에서 B가 느꼈을 감정)

## 🔍 갈등의 진짜 원인
(표면적 다툼 뒤에 있는 진짜 이슈)

## 🤝 중재안
(두 사람 모두 납득할 수 있는 중재 방향)

## 💬 화해 대화 시작하기
(먼저 연락할 때 사용할 수 있는 메시지 예시)

---
두 사람 모두의 편에서, 판단 없이 분석해주세요.`;
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const result = response.content[0].type === "text" ? response.content[0].text : "";
    return new Response(JSON.stringify({ result }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Translate API error:", err);
    return new Response(JSON.stringify({ error: "오류가 발생했습니다" }), { status: 500 });
  }
}
