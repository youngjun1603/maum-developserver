import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { region, mood, duration, budget } = await req.json();

    if (!region || !mood || !duration || !budget) {
      return new Response(JSON.stringify({ error: "지역, 분위기, 시간, 예산을 모두 선택해주세요." }), { status: 400 });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "API 키가 설정되지 않았습니다" }), { status: 500 });
    }

    const prompt = `당신은 커플 데이트 플래너입니다. 아래 조건에 맞는 데이트 코스를 추천해주세요.

[조건]
- 지역: ${region}
- 분위기: ${mood}
- 소요 시간: ${duration}
- 예산: ${budget}

[작성 형식 — 반드시 이 형식으로만 작성]
📍 추천 장소
1. [장소명] — 한줄 설명 (소요시간)
2. [장소명] — 한줄 설명 (소요시간)
3. [장소명] — 한줄 설명 (소요시간)

🗺️ 추천 동선
장소1 → 장소2 → 장소3 흐름 설명 (2줄 이내)

✨ 오늘의 데이트 포인트
이 코스의 특별한 점 한 가지 (2줄 이내)

💬 함께 나눌 대화 주제
대화 제안 한 가지

전체 300자 이내로 간결하게 작성하세요.`;

    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const course = msg.content.find((b) => b.type === "text")?.text ?? "";
    return new Response(JSON.stringify({ course, region, mood, duration, budget }), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (err) {
    console.error("Date course API error:", err);
    return new Response(JSON.stringify({ error: "데이트 코스 추천 중 일시적인 오류가 발생했습니다" }), { status: 500 });
  }
}
