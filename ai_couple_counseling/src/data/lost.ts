// LOST 행동유형 검사 — 마음풀(app.jsx)에서 이식 (60문항 · 6축 · 16유형)
// typeCode 4글자 = EI(에너지) + TF(의사결정) + PJ(행동) + RC(관계)
export interface LostQuestion {
  num: number;
  content: string;
  axis: "E" | "D" | "S" | "N" | "R" | "T";
  rev: boolean;
}

export const lostQuestions: LostQuestion[] = [
  // 축 1. 에너지 방향
  { num: 1, content: "낯선 사람들과 쉽게 어울리며 에너지를 얻는다", axis: "E", rev: false },
  { num: 2, content: "혼자 조용히 지내면 오히려 마음이 편안하다", axis: "E", rev: true },
  { num: 3, content: "파티나 모임에 가면 활기가 생긴다", axis: "E", rev: false },
  { num: 4, content: "큰 모임보다 친한 친구 몇 명과 시간 보내는 것을 선호한다", axis: "E", rev: true },
  { num: 5, content: "새로운 사람과 대화하면 금방 친해지는 편이다", axis: "E", rev: false },
  { num: 6, content: "사람들 앞에서 이야기할 때 긴장한다", axis: "E", rev: true },
  { num: 7, content: "친목 모임에서 주도적으로 행동하는 편이다", axis: "E", rev: false },
  { num: 8, content: "오랜만에 만난 친한 친구보다 혼자 쉬는 것이 더 좋다", axis: "E", rev: true },
  { num: 9, content: "낯선 환경에서 처음 만난 사람들과 빨리 친해진다", axis: "E", rev: false },
  { num: 10, content: "혼자만의 시간이 부족하면 금방 지친다", axis: "E", rev: true },
  // 축 2. 의사결정 방식
  { num: 11, content: "결정을 내릴 때 감정보다 사실과 논리를 우선한다", axis: "D", rev: false },
  { num: 12, content: "데이터와 사실을 기반으로 결정을 내리는 편이다", axis: "D", rev: false },
  { num: 13, content: "중요한 결정을 할 때 주변 사람들의 감정도 함께 고려한다", axis: "D", rev: true },
  { num: 14, content: "감정이나 분위기에 따라 내 판단이 크게 달라지는 편이다", axis: "D", rev: true },
  { num: 15, content: "문제를 분석할 때 감정보다 이성이 앞선다", axis: "D", rev: false },
  { num: 16, content: "의사결정에서 타인의 기분과 조화를 이루려 한다", axis: "D", rev: true },
  { num: 17, content: "논리적 설명이 없으면 중요한 결정을 믿기 어렵다", axis: "D", rev: false },
  { num: 18, content: "다른 사람이 우울해 보이면 내 기분도 영향을 받는다", axis: "D", rev: true },
  { num: 19, content: "객관적인 데이터가 없으면 결정을 내리기 어렵다", axis: "D", rev: false },
  { num: 20, content: "나를 화나게 한 사람을 쉽게 용서해 주지 못한다", axis: "D", rev: false },
  // 축 3. 행동 속도
  { num: 21, content: "급한 일이 생기면 즉시 행동하는 편이다", axis: "S", rev: false },
  { num: 22, content: "충분히 계획하지 않으면 불안해서 실행하기 어렵다", axis: "S", rev: true },
  { num: 23, content: "일을 할 때 신속함보다 꼼꼼함이 더 중요하다고 생각한다", axis: "S", rev: true },
  { num: 24, content: "일을 처리할 때 즉흥적으로 진행하는 것을 좋아한다", axis: "S", rev: false },
  { num: 25, content: "계획대로 움직이는 것보다 빠르게 결정을 바꾸는 편이다", axis: "S", rev: false },
  { num: 26, content: "시간이 허락할 때는 깊이 고민한 뒤 행동한다", axis: "S", rev: true },
  { num: 27, content: "마감이 임박하면 효율보다 속도를 중시한다", axis: "S", rev: false },
  { num: 28, content: "충동적으로 결정하면 나중에 후회할 때가 많다", axis: "S", rev: true },
  { num: 29, content: "빠른 실행은 중요하지만 실수가 생길까 걱정된다", axis: "S", rev: true },
  { num: 30, content: "상황에 따라 행동 방식을 즉시 바꾸는 편이다", axis: "S", rev: false },
  // 축 4. 안정성
  { num: 31, content: "변화는 나를 설레게 한다", axis: "N", rev: false },
  { num: 32, content: "익숙한 환경이 안전하다고 느낀다", axis: "N", rev: true },
  { num: 33, content: "새로운 도전이 주는 자극을 즐긴다", axis: "N", rev: false },
  { num: 34, content: "안정적인 일과를 벗어나면 불안감이 크다", axis: "N", rev: true },
  { num: 35, content: "새로운 프로젝트보다 익숙한 일에 집중하는 편이다", axis: "N", rev: true },
  { num: 36, content: "변화를 맞이할 때 흥미를 느낀다", axis: "N", rev: false },
  { num: 37, content: "예측 가능한 환경에서 일하는 것이 편안하다", axis: "N", rev: true },
  { num: 38, content: "일상의 틀에서 벗어나 새로운 방식을 시도한다", axis: "N", rev: false },
  { num: 39, content: "새로운 아이디어가 떠오르면 신나지만 걱정도 된다", axis: "N", rev: false },
  { num: 40, content: "일상의 변화가 크면 긴장한다", axis: "N", rev: true },
  // 축 5. 관계 민감도
  { num: 41, content: "팀의 목표를 위해 다른 사람과 협력하는 것을 중요하게 생각한다", axis: "R", rev: false },
  { num: 42, content: "내 생각을 고집하기보다 주변 의견에 따라 결정을 바꾸기도 한다", axis: "R", rev: false },
  { num: 43, content: "혼자 일하는 것보다 팀워크가 잘 맞는 일을 좋아한다", axis: "R", rev: false },
  { num: 44, content: "중요한 결정은 주로 나 혼자 판단으로 한다", axis: "R", rev: true },
  { num: 45, content: "동료나 친구와의 조화를 위해 양보하는 경우가 많다", axis: "R", rev: false },
  { num: 46, content: "자신의 의견보다 팀의 목표를 우선한다", axis: "R", rev: false },
  { num: 47, content: "반드시 다른 사람의 도움 없이 처리하고 싶어 하는 편이다", axis: "R", rev: true },
  { num: 48, content: "친밀한 관계를 맺는 것이 나에게 큰 의미가 있다", axis: "R", rev: false },
  { num: 49, content: "혼자 있을 때 오히려 더 생산적이라고 느낀다", axis: "R", rev: false },
  { num: 50, content: "다른 사람의 기분을 금방 파악하는 편이다", axis: "R", rev: false },
  // 축 6. 스트레스 반응
  { num: 51, content: "문제가 생기면 즉시 피하거나 회피하려고 한다", axis: "T", rev: true },
  { num: 52, content: "어려운 일이 생기면 바로 대응하면서 해결책을 찾는다", axis: "T", rev: false },
  { num: 53, content: "스트레스를 받으면 쉬어야만 진정될 수 있다고 느낀다", axis: "T", rev: true },
  { num: 54, content: "위기 상황에서 침착하게 문제를 해결하려 노력한다", axis: "T", rev: false },
  { num: 55, content: "갈등 상황은 피해야 한다고 생각한다", axis: "T", rev: true },
  { num: 56, content: "문제가 생기면 적극적으로 빠르게 해결하려 한다", axis: "T", rev: false },
  { num: 57, content: "스트레스를 받으면 상황을 회피하고 싶어진다", axis: "T", rev: true },
  { num: 58, content: "곤란한 상황에서도 당면 과제에 집중하는 편이다", axis: "T", rev: false },
  { num: 59, content: "문제 상황에서 주변 사람에게 도움 청하는 것을 꺼린다", axis: "T", rev: true },
  { num: 60, content: "긴장되는 상황에서도 먼저 해결책을 모색한다", axis: "T", rev: false },
];

export interface LostTypeInfo {
  icon: string;
  name: string;
  desc: string;
  traits: string[];
  strengths: string[];
  love: string;
  stress: string;
  match: string[];
  conflict: string[];
}

export const lostTypes: Record<string, LostTypeInfo> = {
  ETPR: { icon: "🦁", name: "실행 리더", desc: "빠른 실행력과 관계 중심으로 팀을 이끄는 카리스마형 리더입니다.", traits: ["추진력", "사교성", "결단력", "팀십"], strengths: ["빠른 의사결정과 실행", "사람들을 동기부여하는 능력", "목표 달성 집중력"], love: "적극적으로 표현하고 파트너를 이끌려는 경향이 있습니다.", stress: "압박을 받으면 더욱 강하게 밀어붙이거나 지시적이 됩니다.", match: ["IFJR", "EFJR"], conflict: ["IFJC", "IFPC"] },
  ETPC: { icon: "🦅", name: "개척자", desc: "논리와 속도로 새로운 길을 여는 독립적인 혁신가입니다.", traits: ["혁신", "독립성", "속도", "논리"], strengths: ["새로운 방식으로 문제를 해결", "빠른 판단과 실행", "자기 동기부여"], love: "자유를 중시하며 서로 독립적인 관계를 선호합니다.", stress: "압박 시 혼자 해결하려 하거나 상황을 회피합니다.", match: ["IFJC", "ETJR"], conflict: ["IFJR", "EFPR"] },
  ETJR: { icon: "🦊", name: "전략 조율가", desc: "사람과 시스템을 연결하여 체계적으로 목표를 달성하는 유형입니다.", traits: ["전략적", "체계적", "사교적", "신중함"], strengths: ["장기 계획 수립과 실행", "팀 합의 형성", "구조화된 소통"], love: "안정적이고 계획적인 관계를 지향합니다.", stress: "계획이 어긋날 때 통제를 강화하려는 경향이 있습니다.", match: ["IFPR", "EFPR"], conflict: ["ETPC", "IFPC"] },
  ETJC: { icon: "🏗️", name: "시스템 구축자", desc: "효율적인 구조와 시스템을 설계하는 논리적인 외향가입니다.", traits: ["체계성", "논리", "외향성", "독립성"], strengths: ["복잡한 시스템 설계", "효율성 최적화", "외부 발표와 소통"], love: "감정보다 실용적인 관점에서 관계를 바라봅니다.", stress: "문제를 시스템 오류로 인식하고 재설계하려 합니다.", match: ["IFPC", "ITPR"], conflict: ["EFPR", "IFJR"] },
  EFPR: { icon: "🌟", name: "관계 활력가", desc: "에너지와 감성으로 주변을 밝히는 외향적 관계 중심 유형입니다.", traits: ["에너지", "공감", "사교성", "자발성"], strengths: ["분위기를 밝게 만드는 능력", "빠른 공감과 지지", "네트워크 형성"], love: "적극적으로 감정을 표현하고 함께하는 시간을 소중히 합니다.", stress: "스트레스를 사람들과 이야기하며 해소하려 합니다.", match: ["ITJR", "ETJR"], conflict: ["ITJC", "ETJC"] },
  EFPC: { icon: "🎨", name: "창의 표현가", desc: "자유로운 감성과 창의성으로 독자적인 세계를 만들어가는 유형입니다.", traits: ["창의성", "자유", "감성", "즉흥성"], strengths: ["독창적인 아이디어 생성", "예술적·감성적 표현", "유연한 적응력"], love: "파트너에게 창의적이고 감성적인 방식으로 사랑을 표현합니다.", stress: "압박 시 예술적 활동이나 혼자만의 시간으로 회복합니다.", match: ["ITJC", "ETJC"], conflict: ["ITJR", "ETJR"] },
  EFJR: { icon: "🌿", name: "협력 추진자", desc: "따뜻한 마음으로 팀을 이끌고 협력을 통해 목표를 이루는 유형입니다.", traits: ["협력", "따뜻함", "추진력", "신뢰"], strengths: ["팀 화합과 동기부여", "공감 기반 리더십", "계획적 협업"], love: "헌신적이고 따뜻한 파트너로 관계에 에너지를 쏟습니다.", stress: "내면 갈등을 숨기다가 감정이 폭발하는 패턴이 있습니다.", match: ["ETPR", "ITJR"], conflict: ["ITJC", "ETPC"] },
  EFJC: { icon: "🕊️", name: "소통 전략가", desc: "감성과 전략을 결합하여 다리 역할을 하는 조율사입니다.", traits: ["소통", "공감", "계획", "독립성"], strengths: ["대화와 협상 능력", "감성적 이해와 전략적 사고", "중재 역할"], love: "파트너의 말을 잘 듣고 감성적으로 지지합니다.", stress: "스트레스 시 대화를 통해 문제를 풀어가려 합니다.", match: ["ETPC", "ITJR"], conflict: ["ITPR", "ETPR"] },
  ITPR: { icon: "🦉", name: "분석 지원가", desc: "냉철한 분석과 빠른 판단으로 팀을 뒤에서 지원하는 유형입니다.", traits: ["분석력", "신속함", "지원", "내향성"], strengths: ["빠른 데이터 분석", "조용하지만 효율적인 실행", "상황 판단력"], love: "말보다 행동으로 사랑을 표현하는 편입니다.", stress: "혼자 분석하고 해결책을 찾으며 회복합니다.", match: ["ETJC", "EFJR"], conflict: ["EFPR", "IFPC"] },
  ITPC: { icon: "⚡", name: "독자 혁신가", desc: "혼자 빠르게 새로운 해법을 만들어내는 독립적 혁신 유형입니다.", traits: ["혁신", "독립성", "분석", "속도"], strengths: ["독창적 문제 해결", "빠른 독립적 실행", "기술적 숙련도"], love: "파트너에게 지적 자극을 주고받는 관계를 선호합니다.", stress: "혼자만의 공간을 찾아 분석·해결에 집중합니다.", match: ["ETJR", "EFJR"], conflict: ["EFPC", "IFJR"] },
  ITJR: { icon: "🏔️", name: "정밀 계획가", desc: "체계적인 계획과 관계 지향으로 안정적인 성과를 내는 유형입니다.", traits: ["정밀성", "계획성", "신뢰성", "관계지향"], strengths: ["빈틈없는 계획 수립", "신뢰할 수 있는 실행", "장기적 관계 유지"], love: "깊고 안정적인 관계를 선호하며 신뢰를 쌓아갑니다.", stress: "계획이 흔들릴 때 더 많이 준비하고 확인합니다.", match: ["EFPR", "EFJR"], conflict: ["EFPC", "ETPC"] },
  ITJC: { icon: "🔬", name: "완벽 탐구자", desc: "깊이 있는 분석과 완벽함 추구로 전문성을 쌓는 독립적 내향형입니다.", traits: ["완벽주의", "탐구심", "독립성", "집중력"], strengths: ["깊은 전문 지식", "꼼꼼한 오류 검토", "독립적 연구 능력"], love: "소수와 깊고 의미있는 관계를 지향합니다.", stress: "더 많이 파고들며 완벽한 해답을 찾으려 합니다.", match: ["EFPC", "ETJC"], conflict: ["EFPR", "ETPR"] },
  IFPR: { icon: "🌸", name: "공감 실행가", desc: "따뜻한 마음으로 빠르게 사람을 돕는 내향적 관계 지향 유형입니다.", traits: ["공감", "자발성", "돌봄", "민감성"], strengths: ["타인 감정에 빠르게 반응", "자연스러운 지지와 돌봄", "진실된 공감 능력"], love: "파트너의 감정 변화에 섬세하게 반응하며 헌신합니다.", stress: "타인 걱정으로 자신을 잊고 소진되는 패턴이 있습니다.", match: ["ETJR", "EFJR"], conflict: ["ETPC", "ITPC"] },
  IFPC: { icon: "🦋", name: "자유 탐색자", desc: "감성과 자유를 따르며 자신만의 길을 탐색하는 내향적 유형입니다.", traits: ["자유", "감성", "탐색", "자발성"], strengths: ["깊은 감수성과 예술적 감각", "유연한 적응", "자기만의 독창적 관점"], love: "깊은 감성적 연결을 원하지만 혼자만의 시간도 필요합니다.", stress: "자신만의 공간으로 물러나 감정을 정리합니다.", match: ["ETJC", "EFJC"], conflict: ["ETJR", "ITJR"] },
  IFJR: { icon: "🌙", name: "신중 지지자", desc: "조용하지만 깊이 있게 타인을 지지하는 신뢰의 내향형입니다.", traits: ["신중함", "지지", "신뢰", "공감"], strengths: ["깊은 신뢰 관계 형성", "조용한 헌신과 지속성", "타인의 필요를 잘 파악"], love: "말보다 행동으로 사랑을 보여주는 조용한 헌신자입니다.", stress: "혼자 감내하다가 돌연 감정적으로 무너지는 패턴이 있습니다.", match: ["ETPR", "EFPR"], conflict: ["ETPC", "ITPC"] },
  IFJC: { icon: "🌌", name: "성찰 독자", desc: "깊은 내면 세계를 탐구하며 조용히 자신만의 가치를 추구하는 유형입니다.", traits: ["성찰", "독립성", "깊이", "가치지향"], strengths: ["깊은 자기 이해", "진정성 있는 관계", "독자적인 사고와 통찰"], love: "진정성 있는 깊은 연결을 원하며 가치관 공유를 중시합니다.", stress: "깊은 성찰과 혼자만의 시간으로 에너지를 회복합니다.", match: ["ETPC", "EFPC"], conflict: ["ETPR", "ITPR"] },
};

export type LostResult = {
  axisAvg: Record<string, number>;
  typeCode: string;
  stressStyle: "직면형" | "회피형";
  stabilityStyle: "변화선호" | "안정선호";
};

// 응답: { [num]: 1~5 }
export function calcLost(responses: Record<number, number>): LostResult {
  const axisScores: Record<string, number> = { E: 0, D: 0, S: 0, N: 0, R: 0, T: 0 };
  const axisCount: Record<string, number> = { E: 0, D: 0, S: 0, N: 0, R: 0, T: 0 };
  lostQuestions.forEach((q) => {
    const r = responses[q.num];
    if (r === undefined) return;
    const score = q.rev ? 6 - r : r;
    axisScores[q.axis] += score;
    axisCount[q.axis] += 1;
  });
  const avg: Record<string, number> = {};
  Object.keys(axisScores).forEach((k) => {
    avg[k] = axisCount[k] > 0 ? axisScores[k] / axisCount[k] : 3;
  });
  const EI = avg.E >= 3.0 ? "E" : "I";
  const TF = avg.D >= 3.0 ? "T" : "F";
  const PJ = avg.S >= 3.0 ? "P" : "J";
  const RC = avg.R >= 3.0 ? "R" : "C";
  return {
    axisAvg: avg,
    typeCode: EI + TF + PJ + RC,
    stressStyle: avg.T >= 3.0 ? "직면형" : "회피형",
    stabilityStyle: avg.N >= 3.0 ? "변화선호" : "안정선호",
  };
}

// 4글자 코드 각 자리의 의미 (커플 비교용)
export const lostAxisMeta = [
  { idx: 0, label: "에너지 방향", letters: { E: "외향", I: "내향" } as Record<string, string> },
  { idx: 1, label: "의사결정", letters: { T: "이성", F: "감정" } as Record<string, string> },
  { idx: 2, label: "행동 방식", letters: { P: "즉흥", J: "계획" } as Record<string, string> },
  { idx: 3, label: "관계 성향", letters: { R: "협력", C: "독립" } as Record<string, string> },
];

// 같은 글자일 때(강점) / 다른 글자일 때(보완 포인트) 설명
const AXIS_NOTE: Record<number, { both: Record<string, string>; diff: string }> = {
  0: {
    both: {
      E: "둘 다 외향적이라 활발한 데이트와 사교 활동을 함께 즐겨요.",
      I: "둘 다 내향적이라 조용하고 깊은 둘만의 시간을 소중히 해요.",
    },
    diff: "외향·내향이 만나 서로의 에너지를 채워주지만, 활동량과 휴식 리듬을 맞추는 배려가 필요해요.",
  },
  1: {
    both: {
      T: "둘 다 이성적이라 갈등을 논리적으로 빠르게 정리해요.",
      F: "둘 다 감정을 중시해 서로의 마음을 깊이 공감해요.",
    },
    diff: "이성·감정이 만나 균형 잡힌 시야를 갖지만, 한쪽은 논리로 한쪽은 마음으로 듣는다는 걸 기억해야 해요.",
  },
  2: {
    both: {
      P: "둘 다 즉흥적이라 자유롭고 변화 많은 데이트를 즐겨요.",
      J: "둘 다 계획적이라 안정적이고 예측 가능한 관계를 만들어요.",
    },
    diff: "즉흥·계획이 만나 서로를 보완하지만, 약속과 일정 스타일에서 조율이 필요해요.",
  },
  3: {
    both: {
      R: "둘 다 관계 중심이라 늘 함께하며 서로를 살뜰히 챙겨요.",
      C: "둘 다 독립적이라 각자의 공간을 존중하는 성숙한 관계를 만들어요.",
    },
    diff: "협력·독립이 만나 한쪽은 함께를, 한쪽은 자유를 원해요. 거리감의 균형이 중요해요.",
  },
};

export interface LostCoupleResult {
  score: number;
  label: string;
  emoji: string;
  color: string;
  axisCompare: { label: string; me: string; partner: string; same: boolean }[];
  strengths: string[];
  challenges: string[];
  overall: string;
}

export function calcLostCouple(myCode: string, partnerCode: string): LostCoupleResult {
  const my = lostTypes[myCode];
  let same = 0;
  const axisCompare = lostAxisMeta.map((ax) => {
    const la = myCode[ax.idx];
    const lb = partnerCode[ax.idx];
    const isSame = la === lb;
    if (isSame) same += 1;
    return { label: ax.label, me: ax.letters[la], partner: ax.letters[lb], same: isSame };
  });

  const inMatch = my.match.includes(partnerCode);
  const inConflict = my.conflict.includes(partnerCode);

  let score = 50 + same * 8; // 같은 축 수: 0→50, 4→82
  if (inMatch) score += 12;
  if (inConflict) score -= 12;
  score = Math.min(98, Math.max(42, score));

  const strengths: string[] = [];
  const challenges: string[] = [];
  lostAxisMeta.forEach((ax) => {
    const la = myCode[ax.idx];
    const lb = partnerCode[ax.idx];
    if (la === lb) strengths.push(AXIS_NOTE[ax.idx].both[la]);
    else challenges.push(AXIS_NOTE[ax.idx].diff);
  });

  let label = "도전적인 관계";
  let emoji = "🌱";
  let color = "#6B7280";
  if (score >= 85) { label = "천생연분"; emoji = "💕"; color = "#E8789A"; }
  else if (score >= 70) { label = "잘 맞는 커플"; emoji = "💗"; color = "#9B8EF0"; }
  else if (score >= 55) { label = "노력으로 빛나는 커플"; emoji = "💛"; color = "#FFB347"; }

  let overall: string;
  if (inMatch) overall = "심리유형 궁합상 서로의 강점을 끌어올려 주는 잘 맞는 조합이에요. 지금처럼 서로를 응원해 주세요.";
  else if (inConflict) overall = "서로 부딪힐 수 있는 조합이에요. 하지만 차이를 이해하고 존중하면 오히려 함께 성장하는 관계가 될 수 있어요.";
  else overall = "무난하게 어울리는 조합이에요. 서로 다른 점은 보완하고 닮은 점은 함께 즐기면 더 깊어질 수 있어요.";

  return { score, label, emoji, color, axisCompare, strengths, challenges, overall };
}
