// 행동 사전 시드 (docs/maumgyeot-behavior-library.md 기반). 종 완전 분리. ambiguous=다의적(⚠️), health=건강 관련.
export interface BehaviorSignal { code: string; label: string; group: string; meanings: string[]; ambiguous?: boolean; health?: boolean; }

export const BEHAVIOR: Record<'cat' | 'dog', BehaviorSignal[]> = {
  cat: [
    { code: 'purr', label: '골골거림', group: '발성', meanings: ['만족·편안', '애착', '(드물게) 통증·불안 시 자가진정'], ambiguous: true },
    { code: 'meow_short', label: '짧게 야옹', group: '발성', meanings: ['인사', '관심·요구'] },
    { code: 'meow_long', label: '길게/반복 우는 소리', group: '발성', meanings: ['요구(밥·문)', '불만'], health: true },
    { code: 'hiss', label: '하악질/낮은 그르렁', group: '발성', meanings: ['위협·두려움', '거리 요청(접근 멈춰)'] },
    { code: 'tail_up', label: '꼬리 수직(끝 까딱)', group: '꼬리', meanings: ['반가움·우호'] },
    { code: 'tail_puff', label: '꼬리 부풀림', group: '꼬리', meanings: ['놀람·공포·방어'] },
    { code: 'tail_flick', label: '꼬리 빠르게 좌우 탁탁', group: '꼬리', meanings: ['짜증·각성↑', '멈춤 신호(개의 흔들기와 반대)'], ambiguous: true },
    { code: 'ears_back', label: '귀 납작(비행기 귀)', group: '귀·눈', meanings: ['두려움·공격 직전'] },
    { code: 'slow_blink', label: '느린 눈깜빡임', group: '귀·눈', meanings: ['신뢰·애정("고양이 키스")'] },
    { code: 'pupil_wide', label: '동공 확대(밝은데도)', group: '귀·눈', meanings: ['흥분·놀이', '공포·각성'], ambiguous: true },
    { code: 'bunting', label: '머리·몸 부비기', group: '몸짓', meanings: ['친밀·안심(영역표시)'] },
    { code: 'knead', label: '꾹꾹이(앞발 누르기)', group: '몸짓', meanings: ['안정·애착'] },
    { code: 'belly', label: '배 보이기', group: '몸짓', meanings: ['편안·신뢰', '(만지면 방어일 수도)'], ambiguous: true },
    { code: 'overgroom', label: '과한 그루밍/특정부위 집착', group: '몸짓', meanings: ['스트레스', '가려움·불편'], health: true },
    { code: 'hide_appetite', label: '숨기·식욕저하·화장실 밖 배변', group: '몸짓', meanings: ['스트레스', '몸 불편'], health: true },
    { code: 'trill', label: '짧은 트릴/짹짹', group: '발성', meanings: ['우호적 인사', '따라와(안내)'] },
    { code: 'chatter', label: '캭캭(이빨 떨며)', group: '발성', meanings: ['사냥 흥분', '닿지 못하는 좌절'] },
    { code: 'yowl', label: '크게 울부짖음(특히 밤)', group: '발성', meanings: ['영역·발정', '불안·외로움'], health: true },
    { code: 'growl_cat', label: '낮게 그르렁 위협', group: '발성', meanings: ['경고·위협(거리 요청)'] },
    { code: 'tail_wrap', label: '꼬리로 몸/사람 감싸기', group: '꼬리', meanings: ['친밀·안정'] },
    { code: 'tail_question', label: '꼬리 끝 물음표처럼 굽음', group: '꼬리', meanings: ['호기심·장난기·우호'] },
    { code: 'tail_tuck_cat', label: '꼬리 몸 아래로 말아넣음', group: '꼬리', meanings: ['두려움·복종'] },
    { code: 'ears_swivel', label: '귀 쫑긋·좌우로 회전', group: '귀·눈', meanings: ['소리에 집중·경계'] },
    { code: 'squint', label: '눈 가늘게 뜨고 편안', group: '귀·눈', meanings: ['이완·편안'] },
    { code: 'loaf', label: '식빵 자세(발 집어넣고 웅크림)', group: '몸짓', meanings: ['편안·안정', '(아플 때 웅크림과 구분 필요)'], ambiguous: true, health: true },
    { code: 'scratch_post', label: '기둥·가구 발톱 긁기', group: '몸짓', meanings: ['영역표시·스트레칭·기분전환(정상)'] },
    { code: 'spray_mark', label: '수직면에 소량 분사(마킹)', group: '몸짓', meanings: ['영역표시', '스트레스·불안'], health: true },
  ],
  dog: [
    { code: 'growl', label: '으르렁거림', group: '발성', meanings: ['경고·불편(거리 요청)', '(놀이 중엔 흥분)'], ambiguous: true },
    { code: 'bark_repeat', label: '반복적으로 짖음', group: '발성', meanings: ['경계·요구', '불안·흥분'] },
    { code: 'whine', label: '낑낑거림', group: '발성', meanings: ['요구·관심', '불안·통증'], health: true },
    { code: 'tail_wag', label: '꼬리 흔들기', group: '꼬리', meanings: ['흥분·각성(긍정/부정 모두)', '높이·속도·몸 전체로 판단'], ambiguous: true },
    { code: 'tail_low', label: '꼬리 낮게/다리 사이', group: '꼬리', meanings: ['불안·두려움·복종'] },
    { code: 'tail_stiff', label: '꼬리 수평·뻣뻣', group: '꼬리', meanings: ['경계·집중'] },
    { code: 'pant_relaxed', label: '편한 헐떡임', group: '입·귀', meanings: ['이완·만족', '(더위·운동 후와 구분)'] },
    { code: 'mouth_tight', label: '입 꾹 다물고 경직', group: '입·귀', meanings: ['긴장·스트레스'] },
    { code: 'calming', label: '입술 핥기·하품·고개돌림', group: '입·귀', meanings: ['진정 시도·불편(카밍시그널)'] },
    { code: 'whale_eye', label: '흰자 보임(화이트아이)', group: '입·귀', meanings: ['스트레스·불편'] },
    { code: 'play_bow', label: '플레이 바우(엉덩이↑)', group: '자세', meanings: ['놀자! 초대'] },
    { code: 'crouch', label: '몸 낮추기·웅크림', group: '자세', meanings: ['두려움·복종'] },
    { code: 'hackles', label: '털 곤두섬(hackles)', group: '자세', meanings: ['각성↑(공포/흥분/경계)'], ambiguous: true },
    { code: 'belly_up', label: '배 보이고 뒹굴기', group: '자세', meanings: ['편안·복종', '(만져달라는 뜻 아닐 수도)'], ambiguous: true },
    { code: 'paw_lift', label: '앞발 들어 올리기', group: '자세', meanings: ['관심·요청', '불확실·주저'] },
    { code: 'zoomies', label: '우다다(갑자기 질주)', group: '자세', meanings: ['흥분·에너지 발산(놀이)'] },
    { code: 'lethargy', label: '식욕·기력 저하·통증 회피 자세', group: '자세', meanings: ['몸 불편'], health: true },
    { code: 'howl', label: '하울링(길게 우우)', group: '발성', meanings: ['소통·반응', '외로움·분리불안'], health: true },
    { code: 'sigh_groan', label: '한숨·끙 소리', group: '발성', meanings: ['이완·만족', '실망·지루함(맥락)'], ambiguous: true },
    { code: 'teeth_bare', label: '이빨 드러내고 주름', group: '입·귀', meanings: ['강한 경고(거리 두기)'] },
    { code: 'ears_forward', label: '귀 앞으로 쫑긋', group: '입·귀', meanings: ['관심·집중·경계'] },
    { code: 'ears_pinned', label: '귀 뒤로 납작', group: '입·귀', meanings: ['두려움·유화'] },
    { code: 'tail_helicopter', label: '꼬리 원을 그리며 휘휘', group: '꼬리', meanings: ['매우 반가움(우호)'] },
    { code: 'freeze', label: '갑자기 멈춤·온몸 경직', group: '자세', meanings: ['강한 긴장·갈등', '물기 직전 신호일 수 있음(주의)'], ambiguous: true },
    { code: 'lean_in', label: '사람에게 몸 기대기', group: '자세', meanings: ['애착·안심 요청'] },
    { code: 'shake_off', label: '물기 없는데 몸 털기', group: '자세', meanings: ['긴장 해소·상황 전환'] },
    { code: 'pacing', label: '안절부절 서성임', group: '자세', meanings: ['불안·기대', '각성↑'], ambiguous: true },
    { code: 'cower_tremble', label: '웅크리고 몸 떨기', group: '자세', meanings: ['공포·심한 불안'], health: true },
    { code: 'scoot', label: '엉덩이 바닥에 끌기', group: '자세', meanings: ['항문 주변 불편·가려움'], health: true },
  ],
};

export function signalsToLines(species: 'cat' | 'dog', codes: string[]): { lines: string; hasHealth: boolean; hasAmbiguous: boolean } {
  const lib = BEHAVIOR[species] || [];
  const picked = lib.filter((s) => codes.includes(s.code));
  const lines = picked.map((s) => `- ${s.label}${s.ambiguous ? '(⚠️다의적)' : ''} : ${s.meanings.join(' / ')}`).join('\n');
  return { lines, hasHealth: picked.some((s) => s.health), hasAmbiguous: picked.some((s) => s.ambiguous) };
}
