// MBTI 결과 계산
export function calcMbti(answers: string[]): string {
  const counts: Record<string, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  answers.forEach((a) => { if (a in counts) counts[a]++; });
  return (
    (counts.E >= counts.I ? "E" : "I") +
    (counts.S >= counts.N ? "S" : "N") +
    (counts.T >= counts.F ? "T" : "F") +
    (counts.J >= counts.P ? "J" : "P")
  );
}

// 애착유형 결과 계산
export function calcAttachment(answers: string[]): string {
  const counts: Record<string, number> = { secure: 0, anxious: 0, avoidant: 0, disorganized: 0 };
  answers.forEach((a) => { if (a in counts) counts[a]++; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

// 사랑의 언어 결과 계산
export function calcLoveLang(answers: string[]): string {
  const counts: Record<string, number> = { words: 0, touch: 0, gifts: 0, time: 0 };
  answers.forEach((a) => { if (a in counts) counts[a]++; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

// MBTI 설명
export const mbtiDescriptions: Record<string, { title: string; desc: string; love: string; emoji: string }> = {
  INTJ: { emoji: "🔮", title: "전략가형", desc: "독립적이고 분석적인 당신. 완벽을 추구합니다.", love: "깊은 신뢰 관계를 천천히 쌓아가는 편. 말보다 행동으로 사랑을 표현합니다." },
  INTP: { emoji: "🧩", title: "논리술사형", desc: "지적 탐구를 즐기는 호기심 많은 사색가.", love: "감정 표현이 서툴지만 연인에게 깊이 헌신합니다." },
  ENTJ: { emoji: "👑", title: "통솔자형", desc: "강한 리더십과 추진력을 가진 타고난 지도자.", love: "연애에서도 주도적으로 계획하고 이끌어 나갑니다." },
  ENTP: { emoji: "💡", title: "발명가형", desc: "창의적이고 도전적인 아이디어를 좋아하는 토론가.", love: "지적 자극을 주고받는 연애를 선호합니다." },
  INFJ: { emoji: "🌙", title: "옹호자형", desc: "깊은 통찰력과 강한 이상을 가진 신비로운 사람.", love: "영혼의 단짝을 찾는 낭만주의자. 깊은 감정적 연결을 원합니다." },
  INFP: { emoji: "🌸", title: "중재자형", desc: "이상주의적이고 창의적인 몽상가.", love: "진정한 감정 교류를 원하며 연인을 깊이 이해하려 합니다." },
  ENFJ: { emoji: "🌟", title: "선도자형", desc: "카리스마 넘치고 공감능력이 뛰어난 리더.", love: "헌신적으로 연인을 돌보며 관계 성장에 투자합니다." },
  ENFP: { emoji: "✨", title: "활동가형", desc: "열정적이고 창의적인 자유로운 영혼.", love: "설레는 감정과 깊은 연결을 동시에 원하는 낭만파입니다." },
  ISTJ: { emoji: "🏛️", title: "현실주의자형", desc: "책임감이 강하고 신뢰할 수 있는 사람.", love: "안정적인 연애를 선호하며 약속을 철저히 지킵니다." },
  ISFJ: { emoji: "🛡️", title: "수호자형", desc: "배려심이 깊고 헌신적인 보호자.", love: "연인의 필요를 먼저 챙기는 헌신적인 파트너입니다." },
  ESTJ: { emoji: "📋", title: "경영자형", desc: "체계적이고 결단력 있는 관리자.", love: "안정적인 미래를 함께 만들어 가는 것을 중요시합니다." },
  ESFJ: { emoji: "🤝", title: "집정관형", desc: "사교적이고 배려심 깊은 사람들의 연결고리.", love: "따뜻한 분위기를 만들며 연인을 적극 챙깁니다." },
  ISTP: { emoji: "🔧", title: "장인형", desc: "실용적이고 관찰력이 뛰어난 문제 해결사.", love: "말보다 행동으로 사랑을 표현하는 조용한 파트너." },
  ISFP: { emoji: "🎨", title: "모험가형", desc: "감수성이 풍부하고 유연한 예술가 기질.", love: "현재의 순간을 즐기며 진심 어린 감정을 나눕니다." },
  ESTP: { emoji: "⚡", title: "사업가형", desc: "에너지 넘치고 즉흥적인 행동파.", love: "활동적이고 재미있는 연애를 좋아합니다." },
  ESFP: { emoji: "🎉", title: "연예인형", desc: "즉흥적이고 활발한 분위기 메이커.", love: "함께하는 모든 순간을 특별하게 만드는 파트너입니다." },
};

// 애착유형 설명
export const attachmentDescriptions: Record<string, { title: string; desc: string; advice: string; emoji: string }> = {
  secure: {
    emoji: "🌿",
    title: "안정형",
    desc: "자신과 연인을 신뢰하며 건강한 관계를 맺습니다. 감정 표현이 자연스럽고 갈등도 건설적으로 해결합니다.",
    advice: "현재의 건강한 패턴을 유지하세요. 연인에게도 안전 기지가 되어줄 수 있습니다.",
  },
  anxious: {
    emoji: "🌊",
    title: "불안형",
    desc: "연인에게 강하게 의존하며 거부당할까 봐 두려워합니다. 확인과 안심이 필요한 편입니다.",
    advice: "자기 자신에 대한 신뢰를 키우세요. 연인이 자리를 비워도 괜찮다는 것을 연습해 보세요.",
  },
  avoidant: {
    emoji: "🏔️",
    title: "회피형",
    desc: "친밀감이 불편하며 독립성을 매우 중시합니다. 감정 표현이나 의존을 약함으로 느끼기도 합니다.",
    advice: "감정을 나누는 것이 약함이 아님을 기억하세요. 연인에게 조금씩 마음을 열어보세요.",
  },
  disorganized: {
    emoji: "🌀",
    title: "혼란형",
    desc: "친밀감을 원하면서도 두려워하는 복잡한 감정을 가지고 있습니다. 관계에서 예측 불가능한 패턴이 나타날 수 있습니다.",
    advice: "전문 상담을 통해 내면의 패턴을 이해하면 큰 도움이 됩니다. 자기 자신을 따뜻하게 대해주세요.",
  },
};

// 사랑의 언어 설명
export const loveLangDescriptions: Record<string, { title: string; desc: string; give: string; emoji: string }> = {
  words: {
    emoji: "💬",
    title: "인정하는 말",
    desc: "사랑한다는 말, 칭찬, 격려의 말이 가장 큰 힘이 됩니다.",
    give: "연인에게 매일 다정한 말 한마디를 건네보세요. '오늘도 수고했어', '네가 있어서 행복해'처럼요.",
  },
  touch: {
    emoji: "🤗",
    title: "스킨십",
    desc: "포옹, 손잡기, 가벼운 터치가 사랑을 가장 직접적으로 느끼게 합니다.",
    give: "연인과 함께할 때 자연스러운 스킨십으로 마음을 전하세요.",
  },
  gifts: {
    emoji: "🎁",
    title: "선물",
    desc: "물질적 선물이 아닌 '나를 생각했다'는 의미에 감동받습니다.",
    give: "연인이 좋아하는 것, 필요한 것을 기억해뒀다가 뜻밖의 순간에 선물해 보세요.",
  },
  time: {
    emoji: "⏰",
    title: "함께하는 시간",
    desc: "온전히 집중하는 quality time이 가장 큰 사랑의 표현입니다.",
    give: "연인과 함께할 때 스마트폰을 내려놓고 온전히 그 순간에 집중해보세요.",
  },
};

// 커플 궁합 점수 계산
export function calcCompatibility(
  mbti1: string, mbti2: string,
  attach1: string, attach2: string,
  love1: string, love2: string
): {
  total: number;
  mbtiScore: number;
  attachScore: number;
  loveScore: number;
  strengths: string[];
  challenges: string[];
} {
  // MBTI 궁합 점수 (30점 만점)
  const mbtiCompat: Record<string, string[]> = {
    INTJ: ["ENFP", "ENTP", "INFJ", "INTJ"],
    INFJ: ["ENTP", "ENFP", "INFJ", "INTJ"],
    ENFP: ["INTJ", "INFJ", "ENFP", "ENTP"],
    ENTP: ["INFJ", "INTJ", "ENTP", "ENFP"],
    ISTJ: ["ESFP", "ESTP", "ISTJ", "ISFJ"],
    ISFJ: ["ESFP", "ESTP", "ISFJ", "ISTJ"],
    ESFP: ["ISTJ", "ISFJ", "ESFP", "ESTP"],
    ESTP: ["ISTJ", "ISFJ", "ESTP", "ESFP"],
    INFP: ["ENFJ", "ENTJ", "INFP", "ENFP"],
    ENFJ: ["INFP", "ISFP", "ENFJ", "INFJ"],
    ISFP: ["ENFJ", "ENTJ", "ISFP", "INFP"],
    ENTJ: ["INFP", "ISFP", "ENTJ", "INTJ"],
    INTP: ["ESTJ", "ENTJ", "INTP", "ENTP"],
    ESTJ: ["INTP", "ISTP", "ESTJ", "ESFJ"],
    ISTP: ["ESTJ", "ESFJ", "ISTP", "ESTP"],
    ESFJ: ["ISTP", "ISFP", "ESFJ", "ISFJ"],
  };
  const mbtiScore = mbtiCompat[mbti1]?.includes(mbti2) ? 28 : 18;

  // 애착유형 궁합 (35점 만점)
  const attachPairs: Record<string, Record<string, number>> = {
    secure: { secure: 35, anxious: 28, avoidant: 25, disorganized: 22 },
    anxious: { secure: 28, anxious: 20, avoidant: 15, disorganized: 18 },
    avoidant: { secure: 25, anxious: 15, avoidant: 22, disorganized: 16 },
    disorganized: { secure: 22, anxious: 18, avoidant: 16, disorganized: 15 },
  };
  const attachScore = attachPairs[attach1]?.[attach2] ?? 20;

  // 사랑의 언어 궁합 (35점 만점)
  const lovePairs: Record<string, Record<string, number>> = {
    words: { words: 35, touch: 28, gifts: 26, time: 30 },
    touch: { words: 28, touch: 35, gifts: 25, time: 30 },
    gifts: { words: 26, touch: 25, gifts: 35, time: 28 },
    time: { words: 30, touch: 30, gifts: 28, time: 35 },
  };
  const loveScore = lovePairs[love1]?.[love2] ?? 25;

  const total = Math.min(100, mbtiScore + attachScore + loveScore);

  const strengths: string[] = [];
  const challenges: string[] = [];

  if (mbtiScore >= 25) strengths.push("성격 궁합이 잘 맞아 자연스러운 교감이 가능해요");
  else challenges.push("서로 다른 성격을 이해하는 노력이 필요해요");

  if (attachScore >= 28) strengths.push("안정적인 애착 관계로 신뢰 기반이 탄탄해요");
  else if (attachScore < 20) challenges.push("애착 패턴의 차이로 갈등이 생길 수 있어요");

  if (loveScore >= 30) strengths.push("사랑 표현 방식이 비슷해 서로 만족감이 높아요");
  else challenges.push("서로의 사랑 표현 방식에 대한 이해가 필요해요");

  if (total >= 80) strengths.push("전체적으로 높은 호환성을 보여요");
  if (total < 60) challenges.push("차이를 극복하려는 의지가 관계의 핵심이 될 거예요");

  return { total, mbtiScore, attachScore, loveScore, strengths, challenges };
}
