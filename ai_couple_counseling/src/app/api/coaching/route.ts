import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `당신은 '마음결'의 AI 관계 코치입니다.

핵심 원칙:
1. 공감 먼저, 분석 나중 — 첫 응답은 반드시 감정 인정으로 시작
2. 판단 제로 — "잘못"이라는 표현 사용 금지. "이해할 수 있어요" 프레임 유지
3. 행동 가능한 제안 — 막연한 위로보다 "오늘 이렇게 말해보세요" 같은 구체적 행동 제시
4. 두 사람 모두의 편 — 한쪽 편들기 없이 관계 전체를 바라봄
5. 한국 문화 이해 — 카톡 중심 소통, 눈치 문화, 간접 화법, 체면 문화 반영

응답 형식:
- 이모지를 적절히 활용해 따뜻한 톤 유지
- 3~5문장 내외로 핵심만 전달
- 마지막에 구체적 행동 제안 1가지 포함
- 전문 심리 용어보다 일상 언어 사용

절대 하지 말아야 할 것:
- 의료/상담 진단 제공
- 한쪽 파트너만 편들기
- 헤어지라거나 계속 만나라는 직접 권유
- 불필요하게 길고 학술적인 답변`;

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "API 키가 설정되지 않았습니다" }), { status: 500 });
    }

    const systemWithContext = context
      ? `${SYSTEM_PROMPT}\n\n사용자 프로필:\n${context}`
      : SYSTEM_PROMPT;

    const stream = await client.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemWithContext,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    console.error("Coaching API error:", err);
    return new Response(JSON.stringify({ error: "AI 코칭 서비스에 일시적인 오류가 발생했습니다" }), { status: 500 });
  }
}
