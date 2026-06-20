# 마음곁 안드로이드 앱 (Capacitor 래퍼 + AdMob 광고형)

> 루트 `../../ANDROID_APP_PLAYBOOK.md`의 **마음곁 적용본**.
> 방식: **라이브 URL 래핑**(maumgyeot.com을 WebView로 띄움). 결제 없음 = **광고형(AdMob)**.
> 빌드는 로컬(Android Studio/SDK)에서. 이 폴더는 **설정·네이티브 템플릿·절차**만 담는다.

appId: **`com.maumgyeot.app`** (⚠️ Play 등록 후 변경 불가) · 프로덕션 URL: **https://maumgyeot.com**

---

## 0. 이미 끝난 것 (서버 측 — 워커에 반영됨)
- ✅ **개인정보처리방침**: https://maumgyeot.com/privacy
- ✅ **계정 삭제(회원 탈퇴)**: https://maumgyeot.com/account-deletion + 앱 홈 하단 링크 + `DELETE /api/account`(도메인 데이터 + 공용 계정 삭제)
- ✅ 이메일 로그인(소셜 OAuth 없음 → WebView OAuth 차단 이슈 없음)
- ✅ 커스텀 도메인(maumgyeot.com) — 래핑 대상 준비됨

## 1. 사전 준비(시간 걸리는 관문 — 미리 신청)
- Google Play **개발자 계정**($25, 신원확인 며칠). **조직(Organization) 계정**이면 7절 "비공개 테스트 12명·14일" 면제(단 D-U-N-S 필요). 개인 계정이면 그 관문 적용.
- 광고형은 **판매자(Payments) 계정 불필요**(인앱결제 안 함). 대신 **AdMob 계정 + 정산 정보** 필요.
- 환경변수(Windows):
  ```
  setx ANDROID_HOME %LOCALAPPDATA%\Android\Sdk
  setx JAVA_HOME "C:\Program Files\Android\Android Studio\jbr"
  ```

## 2. 래핑 생성
```bash
cd maumgyeot/app
npm install
npx cap add android
```
그 다음 **네이티브 fix 적용**:
1. `native-templates/MainActivity.java` → `android/app/src/main/java/com/maumgyeot/app/MainActivity.java` 교체(textZoom + 카메라 권한 주석).
2. `native-templates/AndroidManifest-additions.xml`의 권한·AdMob meta-data를 `android/app/src/main/AndroidManifest.xml`에 병합.
3. `npx cap sync android`

## 3. 카메라/마이크(영상 통역 핵심) 확인
- 매니페스트 `CAMERA`·`RECORD_AUDIO` 필수(2절에서 추가됨).
- 앱 첫 실행 시 **런타임 권한 팝업**이 떠야 함. 카메라가 안 열리면 MainActivity의 주석된 `onPermissionRequest` 오버라이드를 활성화.
- 디버그 설치 후 영상 통역 화면에서 카메라 미리보기·촬영이 되는지 실기 확인:
  ```bash
  ./android/gradlew.bat -p android assembleDebug
  adb install -r android/app/build/outputs/apk/debug/app-debug.apk
  ```

## 4. AdMob (광고형 수익화)
- ✅ **웹 배너 훅은 이미 연동됨** — `maumgyeot/public/index.html` 끝의 `initBannerAd()`. Capacitor 네이티브에서만 하단 적응형 배너 표시(웹 브라우저에선 no-op), 배너 높이만큼 `body.has-ad` 패딩으로 콘텐츠 가림 방지. 현재 **Google 테스트 배너 ID + `isTesting:true`** 라 빌드만 하면 바로 테스트 광고가 뜸.
- 남은 일(실 ID 발급 후, 두 군데만 교체):
  1. **AdMob 콘솔**(apps.admob.com)에서 앱 등록(패키지 `com.maumgyeot.app`) → **앱 ID**(`ca-app-pub-…~…`)·**배너 단위 ID** 발급.
  2. `AndroidManifest.xml` meta-data의 **테스트 App ID → 실제 앱 ID** 교체.
  3. `public/index.html`의 `const ADMOB = { banner: '…', testing: true }` → **실제 배너 단위 ID + `testing:false`** 로 교체 후 워커 배포(`wrangler deploy`).
- ⚠️ **테스트 중 자기 실광고 클릭 금지**(정책 위반·계정 정지). 반드시 테스트 ID로 검증 후 출시 직전에만 실 ID로.
- ⚠️ 네이티브에 **`@capacitor-community/admob` 플러그인이 설치**돼 있어야 `window.Capacitor.Plugins.AdMob`가 동작(package.json에 포함 → `npm install` + `npx cap sync android`).
- 데이터보안·콘텐츠등급에 **광고 포함=예**, **광고 식별자 수집** 선언(7절).
- (선택) EU/UMP 동의: 한국 단독 출시면 생략 가능, 글로벌 확장 시 UMP 동의 폼 추가.

## 5. 릴리스 서명 + .aab
```bash
keytool -genkey -v -keystore maumgyeot-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias maumgyeot
```
`android/keystore.properties`(⚠️ gitignore됨) 작성 후 `android/app/build.gradle`에 조건부 서명 적용(플레이북 3절). 빌드:
```bash
./android/gradlew.bat -p android bundleRelease   # → app-release.aab
```
> ⚠️ **`.jks` 분실 = 앱 업데이트 영구 불가.** 비밀번호 포함 안전 백업. 업데이트 시 `versionCode` 증가.

## 6. Play Console 업로드(내부 테스트)
- 앱 만들기 → 이름 "마음곁" / 무료 / 패키지 `com.maumgyeot.app`(고정).
- 테스트 → 내부 테스트 → 새 버전 → "Play 앱 서명" 동의 → `.aab` 업로드.

## 7. 콘텐츠 선언·등록정보(광고형 핵심 포인트)
- **개인정보처리방침 URL**: `https://maumgyeot.com/privacy`
- **앱 액세스 권한**: 로그인 필요 → 검토자용 테스트 계정(이메일+비번) 등록. "구글 로그인 없음, 이메일 로그인 사용" 명시. 이 계정 **출시 후 삭제 금지**.
- **광고**: **포함=예**(AdMob).
- **데이터 보안**: 수집=예. 항목 = 이메일·사용자ID·반려동물/관찰 기록(기타 사용자 콘텐츠) + **광고 식별자(AdMob)**. 영상은 "임시 처리(미저장)" → 수집 신고 불필요. 분석/크래시 SDK 없으면 성능·웹탐색 **체크 안 함**.
- **콘텐츠 등급**: 생성형 AI 콘텐츠 제공=예. 디지털 상품 구매=아니요(광고형). 웹브라우저 앱=아니요.
- **타겟층**: 만 13세 미만 대상 아님(성인/일반). ⚠️ AdMob은 아동 대상 앱 제약이 크므로 아동 타겟 금지.
- **건강 앱**: "건강 기능 없음"(반려동물 행동 통역 ≠ 의료/수의 진단). 수의학 용어 미사용 정책과 일치.
- **계정 삭제 URL**: `https://maumgyeot.com/account-deletion`
- **스토어 등록정보**: 아이콘 512×512, 그래픽 1024×500, 폰 스크린샷 2장+, 카테고리(라이프스타일), 연락처 이메일.

## 8. 실광고/실결제 없는 검증 + 출시
- 내부 테스트 옵트인 링크로 설치 → 로그인 → 영상 통역 → (테스트)배너 노출 확인.
- **(개인 계정)** 비공개 테스트(Closed) 트랙 **테스터 12명·14일** 완료 → "프로덕션 액세스" 신청 → 승인 → 프로덕션 게시. (내부 테스트는 이 요건 미인정. 조직 계정이면 면제)
- 출시 직전: AdMob 실 단위 ID 교체, 스크린샷에 개인정보 노출 없는지 확인.

## 9. 체크리스트
- [ ] `npm install` + `npx cap add android` + 네이티브 fix(MainActivity/Manifest) + `cap sync`
- [ ] 카메라/마이크 실기 동작 확인(영상 통역)
- [ ] AdMob 앱·단위 ID 발급 → 매니페스트 교체 + 웹 배너 훅(테스트 ID로 먼저)
- [ ] 키스토어 생성 + **백업** + 조건부 서명 + `.aab`
- [ ] 내부 테스트 업로드 + 검토자 테스트 계정
- [ ] 콘텐츠 선언(광고=예/데이터보안 광고ID/생성형AI/건강없음) + 정책·탈퇴 URL 입력
- [ ] (개인 계정) 비공개 테스트 12명·14일 → 프로덕션
- [ ] AdMob 실 단위 ID 교체 후 게시
