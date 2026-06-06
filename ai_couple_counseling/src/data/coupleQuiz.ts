// 커플 스타일 퀴즈 — 마음커플(couple_hub.jsx)에서 이식
export type QuizTypeKey = "A" | "B" | "C" | "D";

export interface QuizQuestion {
  q: string;
  opts: string[];
}

export interface QuizTypeInfo {
  emoji: string;
  name: string;
  desc: string;
  tip: string;
}

export const quizQuestions: QuizQuestion[] = [
  { q: "이상적인 주말 보내기는?", opts: ["집에서 넷플릭스/게임", "맛집·카페 투어", "야외 액티비티", "여행·당일치기"] },
  { q: "싸웠을 때 선호하는 해결 방식은?", opts: ["바로 대화로 해결", "혼자 정리 후 대화", "시간이 지나면 해결", "메시지로 먼저 표현"] },
  { q: "파트너에게 받고 싶은 사랑 표현은?", opts: ["스킨십 (포옹, 손잡기)", "따뜻한 말과 칭찬", "깜짝 선물·이벤트", "함께 시간 보내기"] },
  { q: "스트레스 받을 때 파트너에게 원하는 것은?", opts: ["그냥 옆에 있어줘", "적극적으로 공감해줘", "해결책 같이 찾아줘", "재미있게 해줘"] },
  { q: "이상적인 우리의 생활 방식은?", opts: ["거의 모든 걸 함께", "중요한 것만 함께", "각자 생활 존중, 가끔 함께", "상황에 따라 다름"] },
  { q: "10년 후 우리의 모습은?", opts: ["아이와 함께하는 가정", "세계여행하는 자유로운 커플", "각자 꿈 이루는 파트너십", "지금처럼 행복하면 OK"] },
  { q: "더 잘 맞는 데이트 스타일은?", opts: ["꼼꼼하게 계획해서", "즉흥적으로 그날그날", "파트너가 리드", "반반씩 계획"] },
  { q: "선물을 줄 때 나의 방식은?", opts: ["원하는 것 미리 파악", "완전 깜짝 서프라이즈", "함께 골라서", "경험·추억 선물"] },
  { q: "연애에서 가장 중요한 것은?", opts: ["신뢰와 안정감", "설렘과 열정", "함께 성장", "편안함과 자유"] },
  { q: "갈등 상황에서 나는?", opts: ["즉시 솔직하게 말함", "상황 봐가며 결정", "상대 먼저 진정시킴", "피하고 싶어짐"] },
];

export const quizTypes: Record<QuizTypeKey, QuizTypeInfo> = {
  A: {
    emoji: "🏡",
    name: "안정 공존형",
    desc: "함께하는 일상과 안정감을 가장 소중히 여겨요. 편안하고 신뢰 깊은 관계를 만드는 탁월한 파트너예요.",
    tip: "가끔 작은 서프라이즈로 설렘도 만들어보세요!",
  },
  B: {
    emoji: "💬",
    name: "깊은 유대형",
    desc: "진심 어린 소통과 정서적 연결을 중시해요. 파트너의 마음을 깊이 이해하고 공감하는 능력이 뛰어나요.",
    tip: "말보다 행동으로 보여주는 표현도 시도해보세요!",
  },
  C: {
    emoji: "🌱",
    name: "성장 동반형",
    desc: "함께 발전하고 새로운 것을 경험하는 관계를 원해요. 파트너와 함께 더 나은 사람이 되는 것에 큰 보람을 느껴요.",
    tip: "지금 이 순간을 즐기는 여유도 가져보세요!",
  },
  D: {
    emoji: "🌊",
    name: "자유 균형형",
    desc: "서로의 공간과 자유를 존중하는 성숙한 관계를 선호해요. 집착 없이 믿고 맡기는 여유로운 연애를 해요.",
    tip: "가끔은 더 적극적으로 원하는 것을 표현해보세요!",
  },
};

export function calcQuizType(answers: QuizTypeKey[]): QuizTypeKey {
  const counts: Record<QuizTypeKey, number> = { A: 0, B: 0, C: 0, D: 0 };
  answers.forEach((k) => {
    counts[k] += 1;
  });
  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]) as QuizTypeKey;
}
