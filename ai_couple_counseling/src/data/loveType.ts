// 미니 연애 유형 테스트 — 마음커플(couple_hub.jsx)에서 이식
export type LoveTypeKey = "S" | "R" | "P" | "F";

export interface LoveQuestion {
  q: string;
  opts: { text: string; type: LoveTypeKey }[];
}

export interface LoveTypeInfo {
  emoji: string;
  name: string;
  short: string;
  desc: string;
  strength: string;
  match: string;
  tip: string;
  color: string;
  pale: string;
}

export const loveQuestions: LoveQuestion[] = [
  {
    q: "연애에서 가장 중요하게 여기는 것은?",
    opts: [
      { text: "신뢰와 안정감", type: "S" },
      { text: "설레는 감정과 특별한 순간", type: "R" },
      { text: "함께 성장하는 것", type: "P" },
      { text: "서로의 자유와 독립", type: "F" },
    ],
  },
  {
    q: "파트너가 연락을 늦게 할 때 나는?",
    opts: [
      { text: "크게 신경 쓰지 않는다", type: "S" },
      { text: "걱정되어 먼저 연락한다", type: "P" },
      { text: "나도 바쁘니 괜찮다", type: "F" },
      { text: "서운하지만 예쁜 메시지를 남긴다", type: "R" },
    ],
  },
  {
    q: "이상적인 데이트 스타일은?",
    opts: [
      { text: "분위기 있는 레스토랑과 야경", type: "R" },
      { text: "새로운 액티비티 도전", type: "P" },
      { text: "집에서 편하게 영화 보기", type: "S" },
      { text: "각자 하고 싶은 것 즐기기", type: "F" },
    ],
  },
  {
    q: "서운할 때 나는?",
    opts: [
      { text: "바로 솔직하게 이야기한다", type: "S" },
      { text: "넌지시 표현하고 알아줬으면 한다", type: "R" },
      { text: "감정을 충분히 표현한다", type: "P" },
      { text: "혼자 정리하고 넘어간다", type: "F" },
    ],
  },
  {
    q: "애정 표현 스타일은?",
    opts: [
      { text: "말과 행동으로 적극적으로", type: "P" },
      { text: "특별한 이벤트와 선물", type: "R" },
      { text: "꾸준한 작은 관심과 배려", type: "S" },
      { text: "함께하는 소소한 일상", type: "F" },
    ],
  },
  {
    q: "미래를 생각할 때 나는?",
    opts: [
      { text: "함께 구체적 계획을 세우고 싶다", type: "S" },
      { text: "아름다운 미래 모습을 상상한다", type: "R" },
      { text: "함께 더 나은 사람이 되고 싶다", type: "P" },
      { text: "자연스럽게 흘러가면 좋겠다", type: "F" },
    ],
  },
  {
    q: "연애에서 가장 힘든 것은?",
    opts: [
      { text: "신뢰가 흔들릴 때", type: "S" },
      { text: "설렘이 줄어들 것 같을 때", type: "R" },
      { text: "함께 성장하지 못하는 것 같을 때", type: "P" },
      { text: "나만의 공간이 없을 때", type: "F" },
    ],
  },
];

export const loveTypes: Record<LoveTypeKey, LoveTypeInfo> = {
  S: {
    emoji: "💚",
    name: "안정 신뢰형",
    short: "든든한 버팀목",
    desc: "신뢰와 안정감을 가장 중요하게 여깁니다. 꾸준하고 믿음직한 파트너로, 상대방이 편안하게 의지할 수 있는 관계를 만들어요.",
    strength: "높은 신뢰도 · 꾸준한 헌신 · 솔직한 소통",
    match: "감정 표현이 솔직하고 안정감을 원하는 분과 잘 맞아요.",
    tip: "때로는 작은 이벤트로 설렘도 선물해보세요! 💫",
    color: "#4A9A5A",
    pale: "#EAF5EC",
  },
  R: {
    emoji: "🌹",
    name: "낭만 감성형",
    short: "설렘 제조기",
    desc: "감성적이고 특별한 순간을 사랑합니다. 작은 이벤트와 감동적인 표현으로 연애를 풍성하게 만드는 로맨티스트예요.",
    strength: "풍부한 감수성 · 창의적 표현 · 세심한 배려",
    match: "감동과 설렘을 함께 나눌 수 있는 분과 잘 맞아요.",
    tip: "일상적인 안정감도 연애의 소중한 부분이에요. 🌱",
    color: "#E8789A",
    pale: "#FFF0F5",
  },
  P: {
    emoji: "🔥",
    name: "열정 성장형",
    short: "함께 타오르는 불꽃",
    desc: "강렬하고 진취적인 연애를 원합니다. 파트너와 함께 성장하고 더 나은 사람이 되는 것에 큰 가치를 두는 열정적인 타입이에요.",
    strength: "강한 헌신 · 함께 성장하는 마인드 · 적극적 표현",
    match: "비슷한 열정과 목표를 공유할 수 있는 분과 잘 맞아요.",
    tip: "파트너의 충전 시간도 배려해주세요. 💆",
    color: "#D4634A",
    pale: "#FEF0EC",
  },
  F: {
    emoji: "🌊",
    name: "자유 여유형",
    short: "바람 같은 자유로움",
    desc: "서로의 독립성을 존중하며 여유롭고 자연스러운 관계를 선호합니다. 집착 없이 서로를 믿고 개인 공간을 지켜주는 성숙한 연애를 해요.",
    strength: "서로 존중 · 집착 없는 신뢰 · 개인 공간 배려",
    match: "독립성을 이해하고 여유 있는 연애를 원하는 분과 잘 맞아요.",
    tip: "때로는 더 적극적인 관심 표현도 필요할 수 있어요. 💌",
    color: "#9B8EF0",
    pale: "#F0EEFF",
  },
};

export function calcLoveType(answers: LoveTypeKey[]): LoveTypeKey {
  const counts: Record<LoveTypeKey, number> = { S: 0, R: 0, P: 0, F: 0 };
  answers.forEach((a) => {
    if (a) counts[a] += 1;
  });
  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]) as LoveTypeKey;
}
