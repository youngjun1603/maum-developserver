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
  ],
  dog: [
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
    { code: 'lethargy', label: '식욕·기력 저하·통증 회피 자세', group: '자세', meanings: ['몸 불편'], health: true },
  ],
};

export function signalsToLines(species: 'cat' | 'dog', codes: string[]): { lines: string; hasHealth: boolean; hasAmbiguous: boolean } {
  const lib = BEHAVIOR[species] || [];
  const picked = lib.filter((s) => codes.includes(s.code));
  const lines = picked.map((s) => `- ${s.label}${s.ambiguous ? '(⚠️다의적)' : ''} : ${s.meanings.join(' / ')}`).join('\n');
  return { lines, hasHealth: picked.some((s) => s.health), hasAmbiguous: picked.some((s) => s.ambiguous) };
}
