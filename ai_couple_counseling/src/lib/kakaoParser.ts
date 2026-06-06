export interface ChatMessage {
  datetime: string;
  sender: string;
  content: string;
}

export interface ParsedChat {
  messages: ChatMessage[];
  senders: string[];
  totalCount: number;
  dateRange: { start: string; end: string };
}

// 카카오톡 내보내기 형식 파싱
// 형식: 2024년 1월 1일 오전 10:30, 홍길동 : 메시지 내용
export function parseKakaoTalk(text: string): ParsedChat {
  const lines = text.split("\n");
  const messages: ChatMessage[] = [];
  const senderSet = new Set<string>();

  // 날짜 구분선 패턴: ---------- 2024년 1월 1일 월요일 ----------
  const dateSeparator = /[-]{2,}\s*\d{4}년\s*\d{1,2}월\s*\d{1,2}일/;

  // 메시지 패턴: 2024년 1월 1일 오전/오후 HH:MM, 이름 : 메시지
  const msgPattern = /^(\d{4}년\s*\d{1,2}월\s*\d{1,2}일\s*(?:오전|오후)\s*\d{1,2}:\d{2}),\s*(.+?)\s*:\s*(.+)$/;

  // 새로운 형식: [이름] [오전/오후 H:MM] 메시지
  const newPattern = /^\[(.+?)\]\s*\[(?:오전|오후)\s*\d{1,2}:\d{2}\]\s*(.+)$/;

  let currentDate = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || dateSeparator.test(trimmed)) {
      const dateMatch = trimmed.match(/(\d{4}년\s*\d{1,2}월\s*\d{1,2}일)/);
      if (dateMatch) currentDate = dateMatch[1];
      continue;
    }

    const match = trimmed.match(msgPattern);
    if (match) {
      const [, datetime, sender, content] = match;
      if (content !== "사진" && content !== "동영상" && content !== "파일" && !content.startsWith("이모티콘")) {
        senderSet.add(sender);
        messages.push({ datetime, sender, content });
      }
      continue;
    }

    const newMatch = trimmed.match(newPattern);
    if (newMatch) {
      const [, sender, content] = newMatch;
      if (content !== "사진" && content !== "동영상" && content !== "파일") {
        senderSet.add(sender);
        messages.push({ datetime: currentDate, sender, content });
      }
    }
  }

  const senders = Array.from(senderSet);
  const dateRange = messages.length
    ? { start: messages[0].datetime, end: messages[messages.length - 1].datetime }
    : { start: "", end: "" };

  return { messages, senders, totalCount: messages.length, dateRange };
}

// 감정 분석 (간단한 키워드 기반)
export function analyzeEmotions(messages: ChatMessage[], sender: string) {
  const senderMsgs = messages.filter((m) => m.sender === sender);
  let positive = 0, negative = 0, neutral = 0;

  const positiveWords = ["좋아", "사랑", "행복", "ㅋㅋ", "ㅎㅎ", "^^", "감사", "고마워", "설레", "기대", "대박", "최고", "귀여", "보고싶"];
  const negativeWords = ["싫어", "화나", "짜증", "힘들", "미안", "속상", "슬퍼", "무서워", "걱정", "불안", "후회", "실망", "상처", "아파"];

  senderMsgs.forEach(({ content }) => {
    const hasPos = positiveWords.some((w) => content.includes(w));
    const hasNeg = negativeWords.some((w) => content.includes(w));
    if (hasPos && !hasNeg) positive++;
    else if (hasNeg && !hasPos) negative++;
    else neutral++;
  });

  return { positive, negative, neutral, total: senderMsgs.length };
}

// 대화 불균형 분석
export function analyzeBalance(messages: ChatMessage[], senders: string[]) {
  const counts: Record<string, number> = {};
  const charCounts: Record<string, number> = {};

  senders.forEach((s) => { counts[s] = 0; charCounts[s] = 0; });
  messages.forEach(({ sender, content }) => {
    if (sender in counts) {
      counts[sender]++;
      charCounts[sender] += content.length;
    }
  });

  return { messageCounts: counts, charCounts };
}

// 대화 요약용 샘플 추출 (최근 50개 + 감정 피크 구간)
export function extractSample(messages: ChatMessage[], maxCount = 60): ChatMessage[] {
  if (messages.length <= maxCount) return messages;
  // 최근 30개 + 앞부분 30개
  const head = messages.slice(0, 30);
  const tail = messages.slice(-30);
  return [...head, ...tail];
}
