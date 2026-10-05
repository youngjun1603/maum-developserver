# 안드로이드 앱 + 인앱결제 플레이북 (Capacitor + RevenueCat + Google Play)

> 웹 서비스를 **Capacitor로 안드로이드 앱화**하고 **RevenueCat로 구독 인앱결제**를 붙여 **Google Play**에 올리기까지, 실제로 막혔던 지점과 해결책을 정리한 재사용 가이드. 다른 프로젝트에도 그대로 적용 가능. (작성: 마음결 프로젝트 경험 기반, 2026-06)

---

## 0. 큰 그림 / 순서

```
[웹앱 배포(프로덕션 URL)]
  → ① Capacitor로 안드로이드 래핑 (방식1: 라이브 URL 래핑)
  → ② 네이티브 필수 fix (allowNavigation, textZoom, 이메일 로그인)
  → ③ 릴리스 서명 + .aab 빌드
  → ④ Play Console: 앱 생성 + 내부테스트 업로드 + 사업자 판매자 계정
  → ⑤ RevenueCat: goog_ 키 + 서비스계정 + 상품 + Offering
  → ⑥ 라이선스 테스터로 실결제 검증 → 프로덕션 게시
```

**핵심 의존성(시간이 걸리는 관문, 미리 신청해두기):**
- Google Play **개발자 계정** 등록($25, 신원확인에 며칠)
- **사업자/개인 판매자(Payments) 계정** 승인 — 구독상품 생성의 전제, 사업자는 1~2일 가능
- 서비스계정 **권한 전파** — 최대 36시간 (특히 subscriptions API)

---

## 1. Capacitor 안드로이드 래핑 (방식1: 라이브 URL)

가장 빠른 방법 = **이미 배포된 웹사이트를 WebView로 띄우기**. 앱은 껍데기, 내용은 라이브 사이트.

```ts
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: "app.yourapp",          // ⚠️ 한 번 정하면 Play에서 변경 불가
  appName: "앱이름",
  webDir: "capacitor-www",       // 최소 fallback 페이지(거의 안 쓰임)
  server: {
    url: "https://your-prod-domain.com",  // 라이브 사이트
    cleartext: false,
    allowNavigation: [            // ⚠️ 아래 2절 참고 — 빼면 인증이 외부 브라우저로 튕김
      "your-prod-domain.com",
      "*.clerk.accounts.dev", "*.accounts.dev",   // 인증 제공자 도메인
      "challenges.cloudflare.com", "accounts.google.com",
    ],
  },
};
```

- **장점**: 웹 바꾸면 앱은 재빌드 불필요(라이브 사이트 로드). 네이티브 설정/플러그인 바꿀 때만 `npx cap sync android` + 재빌드.
- **단점**: **온라인 전용**(인터넷 없으면 `ERR_NAME_NOT_RESOLVED`). 오프라인 필요하면 이 방식 X.

**환경 변수(Windows):**
```
ANDROID_HOME = %LOCALAPPDATA%\Android\Sdk   (setx로 영구 등록)
JAVA_HOME    = C:\Program Files\Android\Android Studio\jbr   (JDK 21)
adb          = %ANDROID_HOME%\platform-tools\adb.exe
```

**빌드/설치:**
```bash
# 디버그 APK (개발용, 사이드로드)
./android/gradlew.bat -p android assembleDebug
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell monkey -p app.yourapp -c android.intent.category.LAUNCHER 1
```

---

## 2. 네이티브 필수 Fix (안 하면 반드시 터지는 것들)

이건 직접 디버깅으로 알아낸 것들. WebView 래핑 앱의 공통 함정.

### (1) 인증 핸드셰이크가 외부 Chrome으로 튕김
- 증상: 로그인 누르면 앱이 **외부 Chrome 브라우저로 빠져나감**(앱 컨텍스트 이탈, `isNativePlatform()`이 false로 읽힘).
- 원인: 인증 제공자(Clerk 등)의 OAuth/핸드셰이크 리다이렉트 도메인이 `allowNavigation`에 없음.
- 해결: `capacitor.config.ts`의 `server.allowNavigation`에 인증 관련 모든 도메인 추가(위 1절 예시).

### (2) 웹 글자가 폰 글꼴배율 때문에 너무 크게 보임
- 증상: 폰 "글꼴 크게" 설정(font_scale 1.7 등)이 WebView 텍스트를 키워 레이아웃 깨짐.
- 해결: `MainActivity`에서 텍스트 줌 고정.
```java
// android/app/src/main/java/.../MainActivity.java
@Override
public void onStart() {
  super.onStart();
  getBridge().getWebView().getSettings().setTextZoom(100); // 폰 배율 무시
}
```

### (3) Google 소셜 로그인이 WebView에서 차단됨
- 증상: 구글 로그인 시 **"disallowed_useragent"** (Google 정책: WebView에서 OAuth 금지).
- 해결: **앱에서는 이메일 로그인을 사용**. 출시 시 인증 제공자에서 구글 로그인 옵션을 앱용으로 숨기는 것 고려. (이건 우회 불가 — Google 정책)

---

## 3. 릴리스 서명 + .aab

Play 업로드는 **서명된 `.aab`**(Android App Bundle) 필요.

```bash
# 1. 업로드 키스토어 생성 (1회)
keytool -genkey -v -keystore ~/yourapp-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias yourapp
```

```properties
# android/keystore.properties  (⚠️ .gitignore 필수! 절대 커밋 금지)
storeFile=C:/Users/You/yourapp-release.jks
storePassword=...
keyAlias=yourapp
keyPassword=...
```

```gradle
// android/app/build.gradle — keystore.properties 있을 때만 릴리스 서명 적용(조건부)
def ksFile = rootProject.file("keystore.properties")
if (ksFile.exists()) {
  def ks = new Properties(); ks.load(new FileInputStream(ksFile))
  signingConfigs { release { storeFile file(ks['storeFile']); storePassword ks['storePassword']; keyAlias ks['keyAlias']; keyPassword ks['keyPassword'] } }
  buildTypes { release { signingConfig signingConfigs.release } }
}
```

```bash
./android/gradlew.bat -p android bundleRelease
# → android/app/build/outputs/bundle/release/app-release.aab
```

> ⚠️⚠️ **키스토어(.jks)를 잃어버리면 그 앱을 영원히 업데이트할 수 없습니다.** 반드시 백업(비밀번호 포함). `*.jks` / `*.keystore` / `keystore.properties` 전부 gitignore.
>
> 앱 업데이트 시: `android/app/build.gradle`의 `versionCode` 증가 → 재빌드.

---

## 4. Google Play Console

### (1) 앱 생성
- play.google.com/console → **앱 만들기** → 이름 / 기본언어 / 앱 / **무료**(구독은 인앱 별도) / 선언 체크.
- 패키지 이름 = `capacitor.config.ts`의 `appId`와 **정확히 일치**해야 함. **변경 불가.**

### (2) .aab 업로드 (내부 테스트)
- **테스트 및 출시 → 테스트 → 내부 테스트 → 새 버전 만들기**.
- "Play 앱 서명" 안내 → **동의**(Google이 자동 재서명, 우리 `.jks`는 "업로드 키"로 등록).
- `.aab` 업로드 → 저장 및 출시.
- 💡 **구독상품 생성·결제 테스트에는 .aab가 한 트랙에 올라가 있어야** 함. 앱 검토 전(`unreviewed`)이어도 구독 생성은 가능.

### (3) 판매자(Payments) 계정 — 구독의 전제조건
- **수익 창출 → 제품 → 정기 결제**에서 "판매자 계정 설정" 경고가 뜨면 → 먼저 **결제 프로필 생성**(개인/사업자, 정산 계좌, 세금정보).
- **승인 전엔 구독상품을 못 만듦.** 사업자 신원확인은 보통 1~2일. → 미리 신청.

### (4) 구독상품 생성
- **수익 창출 → 제품 → 정기 결제 → 구독 만들기.**
- 제품 ID(예: `premium_monthly`) — **변경 불가, 정확히**.
- **기본 요금제(Base plan)** 추가: ID(예: `monthly`) / 자동 갱신 / 결제주기 / 가격 / **활성화(Activate)**.
- 무료체험은 앱 자체 로직(리버스 트라이얼)으로 처리한다면 Google 무료체험은 불필요.

> ⚠️ **흔한 함정 — "변경사항을 저장할 수 없습니다"**: 기본 요금제가 기본적으로 **거의 모든 국가에 판매**되도록 설정되는데, 그 나라들 가격이 비어 "가격을 설정하세요" 오류가 남. **우측 "사용 가능한 국가/지역 관리"에서 판매국을 제한**(예: 한국만)해야 저장됨. 가격 표 위 검색창의 국가명은 **단순 필터**(숨김)일 뿐 — 다른 나라 오류가 숨겨져 있을 수 있으니 필터를 비우고 확인.

---

## 5. RevenueCat 인앱결제 ⭐ (가장 까다로운 부분)

### (1) `test_` 키는 네이티브에서 안 됨 → `goog_` 키 필요
- **Test Store의 `test_` 키는 네이티브 Android SDK에서 거부됨**(`InvalidCredentialsError: Invalid API Key`). BOM/개행 문제가 아님(`.trim()`해도 거부).
- 해결: RevenueCat → **Apps → New app configuration → Google Play**(패키지명 입력) → 그 앱의 **`goog_...` 키** 발급 → 이걸 사용.
- 환경변수에 넣을 때 **앞뒤 공백/개행 제거**(코드에서 `.trim()`로 방어). CLI로 env 넣으면 BOM 섞이므로 **대시보드에서 입력** 권장. `NEXT_PUBLIC_` 변경은 **재배포해야** 빌드에 반영.

### (2) Google 서비스계정 연결 (영수증 검증용)
요즘 Play Console에 "API 액세스" 메뉴가 없음 → **Google Cloud Console에서 직접 생성**:
1. console.cloud.google.com (Play와 **같은 Google 계정**) → 프로젝트 선택(아무 프로젝트나 재활용 가능, 새로 안 만들어도 됨).
2. **API 사용 설정**: `Google Play Android Developer API` + `Google Play Developer Reporting API` (⚠️ **서비스계정이 속한 그 프로젝트에** 켜야 함).
3. **IAM 및 관리자 → 서비스 계정 → 만들기**(역할 없이) → **키(Keys) → 새 키 → JSON** 다운로드.
4. Play Console → **사용자 및 권한 → 새 사용자 초대** → 서비스계정 이메일 입력 → **계정 권한**:
   - ☑️ 재무 데이터·주문·취소설문 보기
   - ☑️ **주문 및 구독 관리** ← subscriptions API에 필수
   - ☑️ 앱 정보 보기
5. RevenueCat의 Google Play 앱 설정 → **Service account credentials JSON** 업로드 → Save.

> ⚠️ **"Credentials need attention" / "subscriptions API" 빨간불**: 설정이 맞아도 **Google 권한 전파에 최대 36시간**. inappproducts/monetization은 먼저 통과되고 **subscriptions API가 가장 늦게** 통과됨. View details 툴팁으로 어느 API가 실패인지 확인 가능. 전파 문제일 뿐이면 **기다리면 자동 초록불**. 이게 빨간불이어도 **상품/Offering 설정·앱의 getOfferings는 진행 가능**(영수증 검증 때만 필요).

### (3) 상품 Import + Entitlement + Offering
- **Product catalog → Products → Import Products**(Google Play에서 자동 감지). 구독은 `상품ID:기본요금제ID` 형식(예: `premium_monthly:monthly`).
- **Entitlements**: 하나 만들고(예: `premium`) 상품 연결. *단, 앱 코드가 entitlement 이름에 의존하는지 확인* — 웹훅으로 자체 DB를 갱신하는 구조면 RC entitlement 이름은 **표시용**일 뿐.
- **Offerings → default**: 패키지에 상품 매핑. **앱 코드의 패키지 선택 로직과 정확히 일치**시켜야 함:
  - 표준 패키지 타입: `$rc_monthly`(MONTHLY), `$rc_annual`(ANNUAL) 등 → 코드가 `packageType`으로 찾음.
  - **커스텀 패키지**: New Package → **Identifier**(Description 아님!)에 정확한 식별자(예: `couple`) → 코드가 `package.identifier === "couple"`로 찾음.

```ts
// 앱 코드(purchases.ts)와 Offering이 일치해야 함 — 예시
function pickPackage(packages, plan) {
  if (plan === "monthly") return packages.find(p => p.packageType === "MONTHLY");
  if (plan === "annual")  return packages.find(p => p.packageType === "ANNUAL");
  return packages.find(p => p.identifier === "couple"); // 커스텀 식별자
}
```

### (4) 웹훅 (서버 ↔ 구독 상태)
- RevenueCat → Integrations → Webhook: URL = `https://your-domain/api/revenuecat/webhook`, Authorization 헤더 = 임의 시크릿(서버에서 `.trim()` 비교), Production+Sandbox 둘 다.
- 서버는 `event.app_user_id`(= 로그인 사용자 ID로 `Purchases.configure({appUserID})` 했을 때)로 사용자 매칭 → `event.type`(INITIAL_PURCHASE/RENEWAL 등)으로 구독 active/expired 갱신.

---

## 6. 실결제 테스트 (놓치기 쉬운 조건)

- ⚠️ **인앱결제는 "Google Play에서 설치한 앱"에서만 작동**. 사이드로드한 debug APK ❌ → **내부테스트 트랙 옵트인 링크로 설치**한 앱 ⭕ (서명·Play Billing 인식 때문).
- **라이선스 테스터** 등록: Play Console **설정 → 라이선스 테스트**에 테스터 Gmail 추가 → **실제 청구 없이** 구매 흐름 테스트.
- 내부테스트 트랙 **테스터 목록**에 그 Gmail 추가 + **옵트인 URL** 공유 → 폰에서 그 계정으로 가입·설치.
- 검증: 페이월에서 구매 → (sandbox) → RevenueCat에 트랜잭션 기록 → 웹훅이 우리 DB를 premium으로 전환되는지 확인.
- **빠른 사전 점검**(사이드로드 APK로도 가능): 앱 재시작 → 페이월 → logcat에서 `getOfferings`가 패키지를 반환하는지(= `ConfigurationError: no Play Store products` 사라졌는지).

```bash
# 결제 로그 보기
adb logcat -d | grep -iE "Purchases|RevenueCat|getOfferings|ConfigurationError|Offering"
```

---

## 7. 프로덕션 출시/등록 (정책 선언 + 스토어 등록정보 + 검토 제출)

정식 출시 전 Play Console에서 **① 앱 콘텐츠 선언 → ② 스토어 등록정보 → ③ 프로덕션 게시** 를 다 채워야 검토 제출이 가능. (대시보드 "앱 설정 완료" 체크리스트가 가이드)

### (1) 앱 콘텐츠 선언 (정책 → 앱 콘텐츠) — 항목별 답
- **개인정보처리방침**: 공개 URL 입력(예: `/privacy` 페이지).
- **앱 액세스 권한**: 로그인 필요한 앱이면 "제한된 부분 있음=예" → **검토자용 테스트 계정(이메일+비번)** 등록 + 기타정보에 로그인 방법 명시. ⚠️ WebView 앱이면 **"Google 로그인은 WebView 정책상 차단, 이메일 로그인 사용"** 을 꼭 적어야 검토자가 헤매지 않음. **이 테스트 계정은 출시 후에도 삭제 금지.**
- **광고**: 외부 광고 SDK 없으면 "아니요". (자사 서비스 크로스프로모션은 광고 아님) 나중에 광고 붙일 때 선언·매니페스트 `AD_ID` 권한·빌드를 함께 변경.
- **콘텐츠 등급(설문)**: 정직하게. 구독 판매 앱은 "**디지털 상품 구매=예**", 단 루트박스/확률형 아이템은 "아니요". 웹뷰 래퍼라도 "웹브라우저/검색엔진 앱?=아니요". 생성형 AI 콘텐츠 제공하면 "온라인 콘텐츠=예".
- **타겟층**: 미성년 포함 시 **만 14세 미만 제외**(국가별 아동 개인정보 동의 회피 — 한국은 만14세 미만 법정대리인 동의 필수). 성인 전용이면 18세 이상 단독이 가장 단순.
- **데이터 보안**: 아래 (2).
- **광고 ID**: 광고/분석 SDK 없으면 "사용 안 함". (Android 13+ 타겟이면 이 선언 필수)
- **건강 앱**: 관계/심리/라이프스타일 앱은 "**건강 기능 없음**". ⚠️ "정신 및 행동 건강"(의료 카테고리)을 잘못 체크하면 의료 앱 정책이 적용돼 출시가 크게 복잡해짐 — 코칭≠의료.
- 정부 앱/금융 기능 등은 해당 없으면 아니요.

### (2) 데이터 보안(Data safety) — 실제 수집만 정확히
- **"데이터를 수집하나요?"=예**(이메일·계정 쓰면). 데이터 유형은 **실제 수집하는 것만** 체크:
  - 개인정보: 이메일 주소, 사용자 ID, (표시 이름 수집 시) 이름.
  - 앱 활동: "기타 사용자 제작 콘텐츠"(검사결과·대화기록 등 저장분).
- ⚠️ **분석/크래시 SDK가 없으면** "앱 정보 및 성능(비정상종료/진단/성능)", "웹 탐색(웹 방문 기록)"은 **체크하지 말 것**(과다신고). 코드에서 `grep -ri "firebase|sentry|analytics|crashlytics"`로 확인.
- **임시(ephemeral) 예외**: 메모리에서 요청 처리 중에만 쓰고 즉시 버리는 데이터(예: 분석 직후 삭제하는 업로드 원문)는 "수집"으로 신고 불필요.
- **공유**: Clerk/Neon/AI API 등 **처리 위탁 업체로 보내는 것은 "공유" 아님**(=수집). 제3자가 자기 목적으로 쓰면 공유.
- 각 데이터: 전송중 암호화=예(HTTPS), 삭제요청 가능=예, 목적=앱 기능/계정 관리/맞춤설정 등 실제만.
- **계정 삭제 URL(필수)**: (3) 참고.
- 계정 생성 방법: 이메일+비번이면 "사용자 이름 및 비밀번호"만.

### (3) 계정 삭제(회원 탈퇴) — 계정 생성 앱은 사실상 필수
Google은 계정 생성 앱에 **계정+데이터 삭제 경로(공개 URL)** 를 요구. 권장 구현(셀프서비스):
- `DELETE /api/account`: 인증된 사용자의 DB 행 삭제(FK `onDelete: cascade`면 사용자 행 하나로 연관 데이터 전부 삭제) + 인증 제공자(Clerk 등) 계정 삭제. **DB→인증 순서로 멱등하게**.
- 공개 페이지 `/account-deletion`: 로그인 시 셀프 탈퇴(2단계 확인), 비로그인 시 안내(검토자가 정책 확인 가능). 이 URL을 데이터 보안에 입력.
- 페이지에 **앱/개발자 이름 + 삭제 절차 + 삭제/보관 데이터 + 보관기간**을 명시해야 요건 충족.

### (4) 스토어 등록정보 (사용자 늘리기 → 스토어 현황)
- 앱 이름(30자) / 간단한 설명(80자) / 자세한 설명(4000자).
- 앱 아이콘 **512×512 PNG**(≤1MB) / 그래픽 이미지 **1024×500** / **휴대전화 스크린샷 2장 이상**(권장 4~8). 스크린샷에 개인정보(실명 등) 노출 없는지 확인.
- 카테고리(라이프스타일 등) / 연락처 이메일(공개됨, 필수) / 웹사이트(선택).

### (5) ⛔ 프로덕션 액세스 — 개인 계정의 비공개 테스트 관문 (가장 큰 함정)
- **2023-11-13 이후 만든 "개인(personal)" 개발자 계정**은 프로덕션 게시 전에 **비공개 테스트(Closed testing)** 를 **테스터 12명 이상 옵트인 + 14일 이상** 완료해야 "프로덕션 액세스 신청"이 활성화됨.
- ⚠️ **내부 테스트(Internal)는 이 요건에 미인정** — 반드시 **비공개 테스트(Closed)** 트랙으로 별도 진행.
- 테스터는 **실제로 앱을 사용**해야 함(Google이 진짜 테스트 활동을 봄). 단순 설치만으론 부족할 수 있음.
- **결제(판매자) 사업자 계정 ≠ 개발자 계정 유형.** 판매자 프로필을 사업자로 해도 개발자 계정이 개인이면 이 요건 적용. **조직(단체) 개발자 계정**이면 면제되나 **D-U-N-S 번호** 인증이 필요(수일 소요 가능).
- 절차: 비공개 테스트 트랙 생성 → `.aab` 게시 → 이메일목록 12명+ → 옵트인 URL 공유 → 14일 → 프로덕션 신청(질문 답변) → 승인 → 프로덕션 게시. **한 번 통과하면 이후 업데이트는 바로 프로덕션 가능.**

### (6) 출시 직전 마무리
- 인증 제공자를 **dev → 프로덕션 인스턴스**로 전환(예: Clerk `pk_test`/`sk_test` → prod 키).
- 채팅/로그에 노출된 **DB 비밀번호 로테이션**.
- 환경변수 prod 값 재배포 반영 확인.

---

## 8. 디버깅 치트시트

| 증상 | 원인 / 해결 |
|---|---|
| 로그인 시 외부 Chrome으로 튕김 | `allowNavigation`에 인증 도메인 추가 |
| 웹 글자가 너무 큼 | `MainActivity.onStart` `setTextZoom(100)` |
| 구글 로그인 `disallowed_useragent` | WebView 제한 — 이메일 로그인 사용 |
| `Invalid API Key`(네이티브) | `test_` 키 사용 중 → `goog_` 키로 교체 |
| 환경변수 키 거부(BOM/개행) | 대시보드에서 입력 + 코드 `.trim()` |
| 구독 저장 "변경사항을 저장할 수 없습니다" | 판매국을 제한(한국만 등), 검색창은 필터일 뿐 |
| RC "Credentials need attention" | 권한 전파 대기(최대 36h), subscriptions API가 가장 느림 |
| 커플/커스텀 플랜 "찾을 수 없음" | Offering 패키지 **Identifier**(=코드값)와 불일치 |
| 인앱결제 안 됨(테스트) | Play 설치본 아님 — 내부테스트로 설치 + 라이선스 테스터 |
| Play에서 앱 "항목을 찾을 수 없습니다"/빈 화면 | **폰 Play 스토어 로그인 계정 ≠ 테스터 계정**. Play 우상단 프로필에서 테스터 Gmail로 전환(이게 가장 흔한 막힘). 또는 테스터 반영 대기 몇 분 |
| `ERR_NAME_NOT_RESOLVED` | 방식1은 온라인 전용 — 네트워크 확인 |
| "프로덕션 신청" 버튼 비활성 | **개인 계정**은 비공개 테스트(Closed) 12명·14일 먼저 필요. 내부테스트는 미인정 |
| 데이터 보안 폼 저장은 됐는데 항목 과다 | 분석/크래시 SDK 없으면 성능·웹탐색 데이터 체크 해제(과다신고) |
| 계정삭제 URL 요구 | `/account-deletion` 공개 페이지 + `DELETE /api/account`(cascade+인증계정 삭제) 구현 |

---

## 9. 체크리스트 (새 프로젝트용)

**빌드·앱**
- [ ] 웹앱 프로덕션 배포 완료
- [ ] Capacitor 추가 + `appId`/`server.url`/`allowNavigation` 설정
- [ ] MainActivity textZoom fix, 이메일 로그인 경로 확보
- [ ] 키스토어 생성 + **백업** + gitignore + 조건부 서명

**Play Console·결제**
- [ ] Google Play 개발자 계정 + **판매자 계정** 신청(미리!) — 개발자 계정 유형(개인/조직) 확인
- [ ] 앱 생성 + `.aab` 내부테스트 업로드
- [ ] 구독상품 생성(판매국 제한!) + 활성화
- [ ] RevenueCat: `goog_` 키 + 서비스계정 JSON + 상품 Import + Offering(코드와 일치)
- [ ] 웹훅 연결 + 서버 구독 갱신 로직
- [ ] 라이선스 테스터 + 내부테스트 설치 → 실결제 검증

**출시·등록**
- [ ] 앱 콘텐츠 선언 전부(앱 액세스=테스트계정/광고/콘텐츠등급/타겟층/데이터보안/광고ID/건강앱)
- [ ] **계정 삭제(회원 탈퇴)** 기능 + 공개 URL → 데이터 보안에 입력
- [ ] 스토어 등록정보(설명·아이콘512·그래픽1024×500·스크린샷2+·카테고리·연락처)
- [ ] **(개인 계정) 비공개 테스트 12명·14일** → 프로덕션 액세스 신청
- [ ] 프로덕션 게시 + 인증 프로바이더 prod 전환 + DB 비밀번호 로테이션
