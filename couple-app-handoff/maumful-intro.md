# 마음풀 소개 자료 — AI 커플 카운슬링 앱 삽입용 (인수인계)

AI 커플 카운슬링 앱(커플 관계 중심)에 **마음풀(maumful.com, 개인 마음돌봄 플랫폼)** 을 자연스럽게 소개해 방문을 유도하기 위한 자료입니다. 같은 패밀리 서비스로서 "관계 → 나 자신의 마음"으로 연결합니다.

## 0. 핵심
- **링크:** `https://maumful.com/?utm_source=maumcouple&utm_medium=app_intro`
  - UTM 파라미터로 커플 앱發 유입을 마음풀 측에서 측정 가능 (앱 출시 후 효과 확인용). 불필요하면 `https://maumful.com`만 써도 됨.
- **새 탭/외부 브라우저**로 열기 (앱이면 외부 브라우저 또는 인앱 브라우저로).
- **마음풀 브랜드:** 🌿 / 딥그린 `#2D6A4F`·`#40916C` / 슬로건 "나를 이해하는 첫걸음".

## 1. 마음풀이 어떤 서비스인가 (소개 문구 작성 근거)
개인의 마음을 돌보는 B2C 플랫폼:
- **전문 심리검사 12종** (PHQ-9·GAD-7·DASS-21·BIG5·LOST 등)
- **AI 마음 상담** (대화형, 따뜻한 공감 중심)
- **마음 치유 게임 8종** (정원·감사·호흡 등)
- **전문 상담사·인근 상담기관 연결**

> 커플 앱 사용자에게는 "둘의 관계만큼 중요한 건 나 자신의 마음. 마음풀에서 나를 더 깊이 이해하고 돌봐보세요"라는 메시지가 자연스럽습니다.

## 2. 추천 배치 위치
1. **홈 화면 하단** "함께하면 좋은 서비스" 영역 (가장 추천)
2. **검사/결과 화면 끝** — "더 깊은 마음 점검은 마음풀에서" 흐름
3. **설정/더보기 탭** — 패밀리 서비스 안내
4. 푸터의 패밀리 링크 (마음풀↔CTS↔phyweb 상호연결과 동일 패턴)

## 3. 카피 (한국어)
- **브랜드:** 🌿 마음풀 · 나를 이해하는 첫걸음
- **헤드라인:** 관계만큼 소중한, 내 마음 돌봄
- **서브:** 전문 심리검사와 AI 마음 상담으로 나를 더 깊이 이해해보세요.
- **기능 칩:** 🧠 전문 심리검사 12종 / 💬 AI 마음 상담 / 🌱 마음 치유 게임 / 🤝 전문 상담사 연결
- **CTA:** 마음풀 둘러보기 →
- (배너형 짧은 버전) "🌿 내 마음도 돌볼 시간 — 마음풀에서 무료 심리검사 →"

## 4. 카피 (English)
- **Brand:** 🌿 Maumful · Your first step to understanding yourself
- **Headline:** Care for your mind, too
- **Sub:** Understand yourself more deeply with professional assessments and AI mind-care chat.
- **Chips:** 🧠 12 professional assessments / 💬 AI mind-care chat / 🌱 healing games / 🤝 connect with counselors
- **CTA:** Explore Maumful →

## 5. ⚠️ 카피 작성 정책 (반드시 준수)
마음풀·CTS는 의료기관이 아닌 **자기이해·정보제공·돌봄** 서비스입니다. 다음 임상/의료 단정 표현 **금지**:
- ❌ 진단 / 치료 / 처방 / 완치 / 임상 → ✅ 점검 / 검사 / 돌봄 / 이해 / 전문
- 예: "우울증 진단" ❌ → "마음 상태 점검" ✅
- "치료해드려요" ❌ → "마음을 돌봐보세요" ✅
신규 문구 추가 시에도 위 기준을 지켜주세요.

## 6. 드롭인 컴포넌트
`MaumfulIntroCard.tsx` (이 폴더에 함께 있음) — Tailwind + framer-motion 기반. 커플 앱에 그대로 복사해 `<MaumfulIntroCard />`로 사용.
- framer-motion 미사용 시: `motion.a` → `a`로 바꾸고 `initial/whileInView/whileHover/transition/viewport` props 제거.
- 디자인 토큰이 다르면 색만 조정(마음풀 그린 `#2D6A4F`는 브랜드 식별용이라 유지 권장).

### 의존성 없는 버전 (순수 인라인 스타일 — 어떤 스택이든 OK)
```tsx
export default function MaumfulIntroCard() {
  const url = "https://maumful.com/?utm_source=maumcouple&utm_medium=app_intro";
  const features = [
    ["🧠", "전문 심리검사 12종"], ["💬", "AI 마음 상담"],
    ["🌱", "마음 치유 게임"], ["🤝", "전문 상담사 연결"],
  ];
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      style={{ display: "block", textDecoration: "none", borderRadius: 24, padding: 24,
        background: "white", border: "1px solid #DCEDE3", boxShadow: "0 4px 24px rgba(45,106,79,0.08)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 24 }}>🌿</span>
        <span style={{ fontSize: 18, fontWeight: 700, color: "#2D6A4F" }}>마음풀</span>
        <span style={{ fontSize: 12, color: "#9AA5A0", marginLeft: "auto" }}>나를 이해하는 첫걸음</span>
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: "#2D2D2D", lineHeight: 1.35, margin: "0 0 6px" }}>
        관계만큼 소중한, <span style={{ color: "#2D6A4F" }}>내 마음 돌봄</span>
      </h3>
      <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6, margin: "0 0 16px" }}>
        전문 심리검사와 AI 마음 상담으로 나를 더 깊이 이해해보세요.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
        {features.map(([e, l]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14,
            color: "#3D4D45", background: "#F2F9F5", borderRadius: 12, padding: "8px 12px" }}>
            <span>{e}</span>{l}
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", padding: "12px", borderRadius: 16, fontWeight: 600,
        color: "white", background: "linear-gradient(135deg,#2D6A4F,#40916C)" }}>
        마음풀 둘러보기 →
      </div>
    </a>
  );
}
```

## 7. 로고 자료
- 이모지 🌿로 충분(별도 이미지 불필요). 정식 로고 이미지가 필요하면 마음풀 측에 요청.
- 색: 메인 `#2D6A4F`, 보조 `#40916C`, 배경 틴트 `#F2F9F5`.
