import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { ParsedChat, analyzeBalance, analyzeEmotions, extractSample } from "@/lib/kakaoParser";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { parsed }: { parsed: ParsedChat } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "API 키 미설정" }), { status: 500 });
    }

    const { messages, senders } = parsed;
    const balance = analyzeBalance(messages, senders);
    const emotionData = senders.map((s) => ({ sender: s, ...analyzeEmotions(messages, s) }));
    const sample = extractSample(messages);

    const sampleText = sample
      .map((m) => `${m.sender}: ${m.content}`)
      .join("\n");

    const prompt = `다음은 커플의 카카오톡 대화 분석 데이터입니다.

=== 대화 통계 ===
총 메시지 수: ${messages.length}개
참여자: ${senders.join(", ")}

=== 발화량 분석 ===
${senders.map((s) => `${s}: ${balance.messageCounts[s]}개 메시지 (${balance.charCounts[s]}자)`).join("\n")}

=== 감정 분석 ===
${emotionData.map((e) => `${e.sender}: 긍정 ${e.positive}개, 부정 ${e.negative}개, 중립 ${e.neutral}개`).join("\n")}

=== 대화 샘플 (일부) ===
${sampleText}

위 데이터를 분석해서 다음 형식으로 답해주세요:

## 💬 대화 패턴 분석

### 📊 소통 균형
(누가 더 많이 이야기하는지, 균형은 어떤지)

### 💗 감정 온도
(각 참여자의 감정 상태와 전체적인 관계 온도)

### ⚠️ 주의 신호
(발견된 갈등 패턴이나 주의해야 할 부분 — 없으면 "특별한 위험 신호 없음")

### 🌟 관계의 강점
(대화에서 발견되는 긍정적인 점)

### 💡 개선 제안
(두 사람이 함께 실천할 수 있는 구체적인 제안 2가지)

---
분석은 따뜻하고 공감적인 톤으로, 판단 없이 서술해주세요.
한쪽을 비판하지 말고 두 사람 모두를 이해하는 시각을 유지해주세요.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const analysis = response.content[0].type === "text" ? response.content[0].text : "";

    return new Response(JSON.stringify({
      analysis,
      stats: { balance, emotionData, totalMessages: messages.length, senders },
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("KakaoTalk analysis error:", err);
    return new Response(JSON.stringify({ error: "분석 중 오류가 발생했습니다" }), { status: 500 });
  }
}
