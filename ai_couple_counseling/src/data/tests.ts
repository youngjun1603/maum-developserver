export type TestType = "mbti" | "attachment" | "love-language";

export interface Question {
  id: number;
  text: string;
  options: { label: string; value: string }[];
}

export interface TestConfig {
  id: TestType;
  title: string;
  description: string;
  emoji: string;
  duration: string;
  questions: Question[];
}

// MBTI 검사 (간소화 20문항)
export const mbtiQuestions: Question[] = [
  {
    id: 1,
    text: "주말에 에너지를 충전하는 방법은?",
    options: [
      { label: "친구들과 만나서 즐거운 시간을 보낸다", value: "E" },
      { label: "혼자 조용히 쉬거나 취미 활동을 한다", value: "I" },
    ],
  },
  {
    id: 2,
    text: "새로운 일을 시작할 때 나는?",
    options: [
      { label: "구체적인 사실과 경험을 바탕으로 접근한다", value: "S" },
      { label: "큰 그림과 가능성을 먼저 떠올린다", value: "N" },
    ],
  },
  {
    id: 3,
    text: "중요한 결정을 내릴 때 주로 의존하는 것은?",
    options: [
      { label: "논리적 분석과 객관적 기준", value: "T" },
      { label: "감정과 사람들에게 미치는 영향", value: "F" },
    ],
  },
  {
    id: 4,
    text: "일상생활에서 나는?",
    options: [
      { label: "계획을 세우고 체계적으로 행동한다", value: "J" },
      { label: "유연하게 상황에 맞춰 행동한다", value: "P" },
    ],
  },
  {
    id: 5,
    text: "파티나 모임에서 나는?",
    options: [
      { label: "많은 사람과 이야기하며 에너지를 얻는다", value: "E" },
      { label: "소수의 친한 사람과 깊은 대화를 선호한다", value: "I" },
    ],
  },
  {
    id: 6,
    text: "정보를 처리할 때 나는?",
    options: [
      { label: "현재 있는 그대로의 사실에 집중한다", value: "S" },
      { label: "의미와 패턴, 미래 가능성을 탐색한다", value: "N" },
    ],
  },
  {
    id: 7,
    text: "친구가 문제를 털어놓을 때 나는?",
    options: [
      { label: "해결책을 찾아 도움을 주려 한다", value: "T" },
      { label: "먼저 공감하고 감정을 들어준다", value: "F" },
    ],
  },
  {
    id: 8,
    text: "여행 계획을 세울 때 나는?",
    options: [
      { label: "상세한 일정표를 미리 준비한다", value: "J" },
      { label: "큰 방향만 정하고 즉흥적으로 즐긴다", value: "P" },
    ],
  },
  {
    id: 9,
    text: "나는 주로 어디서 영감을 얻는가?",
    options: [
      { label: "외부 활동과 사람들과의 교류", value: "E" },
      { label: "내면의 생각과 독립적인 탐구", value: "I" },
    ],
  },
  {
    id: 10,
    text: "복잡한 문제에 직면했을 때 나는?",
    options: [
      { label: "단계적으로 하나씩 해결한다", value: "S" },
      { label: "전체적인 관점에서 창의적 해결책을 찾는다", value: "N" },
    ],
  },
  {
    id: 11,
    text: "의견 충돌이 생겼을 때 나는?",
    options: [
      { label: "논리적으로 옳고 그름을 따진다", value: "T" },
      { label: "관계를 유지하는 것이 더 중요하다", value: "F" },
    ],
  },
  {
    id: 12,
    text: "마감 기한에 대한 나의 태도는?",
    options: [
      { label: "미리 완료해 두는 것이 편하다", value: "J" },
      { label: "마감이 가까워야 집중이 잘 된다", value: "P" },
    ],
  },
];

// 애착유형 검사 (12문항)
export const attachmentQuestions: Question[] = [
  {
    id: 1,
    text: "연인이 늦게 답장하면 나는?",
    options: [
      { label: "별로 신경 쓰지 않는다. 바쁘겠지", value: "secure" },
      { label: "혹시 나한테 화났나 불안해진다", value: "anxious" },
      { label: "나도 답장을 늦게 한다", value: "avoidant" },
      { label: "불안하지만 아무렇지 않은 척한다", value: "disorganized" },
    ],
  },
  {
    id: 2,
    text: "연인과 가까워질수록 나는?",
    options: [
      { label: "편안하고 행복하다", value: "secure" },
      { label: "더 잘해주고 싶고 더 자주 보고 싶다", value: "anxious" },
      { label: "약간 숨막히는 느낌이 든다", value: "avoidant" },
      { label: "좋으면서도 두렵다", value: "disorganized" },
    ],
  },
  {
    id: 3,
    text: "연인이 나의 부족한 점을 지적할 때",
    options: [
      { label: "귀담아 듣고 개선하려 한다", value: "secure" },
      { label: "사랑받지 못하는 것 같아 상처받는다", value: "anxious" },
      { label: "감정적으로 대응하기 싫어 거리를 둔다", value: "avoidant" },
      { label: "화도 나고 자책도 된다", value: "disorganized" },
    ],
  },
  {
    id: 4,
    text: "연인이 다른 이성과 친하게 지낼 때",
    options: [
      { label: "서로를 신뢰하므로 크게 걱정하지 않는다", value: "secure" },
      { label: "질투가 나고 내가 부족한가 걱정된다", value: "anxious" },
      { label: "큰 관심이 없다", value: "avoidant" },
      { label: "불안하지만 내색하기 싫다", value: "disorganized" },
    ],
  },
  {
    id: 5,
    text: "연인과 싸우고 난 후 나는?",
    options: [
      { label: "냉각 후 먼저 화해를 시도한다", value: "secure" },
      { label: "빨리 화해하고 싶어 계속 연락한다", value: "anxious" },
      { label: "시간이 필요하다며 혼자 있으려 한다", value: "avoidant" },
      { label: "화해하고 싶지만 어떻게 해야 할지 모른다", value: "disorganized" },
    ],
  },
  {
    id: 6,
    text: "연애에서 가장 중요하다고 생각하는 것은?",
    options: [
      { label: "서로에 대한 신뢰와 솔직한 소통", value: "secure" },
      { label: "서로를 향한 강한 감정과 헌신", value: "anxious" },
      { label: "각자의 독립성과 개인 공간", value: "avoidant" },
      { label: "안정감이지만 열정도 놓칠 수 없다", value: "disorganized" },
    ],
  },
];

// 사랑의 언어 검사 (10문항)
export const loveLangQuestions: Question[] = [
  {
    id: 1,
    text: "연인이 나를 사랑한다고 느낄 때는?",
    options: [
      { label: "\"사랑해\", \"보고 싶어\"처럼 말로 표현해 줄 때", value: "words" },
      { label: "갑자기 안아주거나 손을 잡아줄 때", value: "touch" },
      { label: "생일이나 기념일에 선물을 챙겨줄 때", value: "gifts" },
      { label: "내가 힘들 때 곁에 있어줄 때", value: "time" },
    ],
  },
  {
    id: 2,
    text: "내가 힘들 때 연인에게 바라는 것은?",
    options: [
      { label: "\"힘들었겠다\" 공감의 말", value: "words" },
      { label: "조용히 옆에 앉아 손 잡아주기", value: "touch" },
      { label: "좋아하는 음식이나 선물 사다 주기", value: "gifts" },
      { label: "시간 내서 함께 있어주기", value: "time" },
    ],
  },
  {
    id: 3,
    text: "연인이 나를 위해 가장 해줬으면 하는 것은?",
    options: [
      { label: "매일 다정한 메시지 보내주기", value: "words" },
      { label: "자연스럽게 스킨십하기", value: "touch" },
      { label: "깜짝 선물로 깜짝 놀라게 하기", value: "gifts" },
      { label: "내 취미나 관심사에 함께 참여하기", value: "time" },
    ],
  },
  {
    id: 4,
    text: "연인의 어떤 행동이 가장 서운한가?",
    options: [
      { label: "칭찬이나 애정 표현이 없을 때", value: "words" },
      { label: "스킨십을 피할 때", value: "touch" },
      { label: "특별한 날을 잊어버릴 때", value: "gifts" },
      { label: "바쁘다며 시간을 잘 내주지 않을 때", value: "time" },
    ],
  },
  {
    id: 5,
    text: "나는 연인에게 주로 어떻게 사랑을 표현하는가?",
    options: [
      { label: "다정한 말과 문자로 감정을 전한다", value: "words" },
      { label: "자주 안아주고 손을 잡는다", value: "touch" },
      { label: "좋은 것을 보면 선물로 표현한다", value: "gifts" },
      { label: "함께하는 시간을 최대한 만들려 한다", value: "time" },
    ],
  },
];

export const testConfigs: TestConfig[] = [
  {
    id: "mbti",
    title: "MBTI 성격유형 검사",
    description: "나의 성격 유형을 파악하고 연애 스타일을 알아보세요",
    emoji: "🧠",
    duration: "약 5분",
    questions: mbtiQuestions,
  },
  {
    id: "attachment",
    title: "애착유형 검사",
    description: "연애에서 나타나는 나의 애착 패턴을 발견하세요",
    emoji: "💗",
    duration: "약 3분",
    questions: attachmentQuestions,
  },
  {
    id: "love-language",
    title: "사랑의 언어 검사",
    description: "내가 사랑을 받고 표현하는 방식을 알아보세요",
    emoji: "💬",
    duration: "약 3분",
    questions: loveLangQuestions,
  },
];
