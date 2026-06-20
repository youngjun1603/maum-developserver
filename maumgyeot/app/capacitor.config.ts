import type { CapacitorConfig } from '@capacitor/cli';

// 마음곁 안드로이드 래퍼 (방식1: 라이브 URL 래핑 — 내용은 maumgyeot.com을 그대로 띄움)
// 웹을 바꿔도 앱 재빌드 불필요. 네이티브 설정/플러그인 변경 시에만 `npx cap sync android` + 재빌드.
const config: CapacitorConfig = {
  appId: 'com.maumgyeot.app',   // ⚠️ Play에서 한 번 정하면 변경 불가
  appName: '마음곁',
  webDir: 'capacitor-www',      // 최소 fallback(거의 안 쓰임 — 실제 내용은 server.url)
  server: {
    url: 'https://maumgyeot.com',
    cleartext: false,
    // 같은 출처(maumgyeot.com)만 앱 내에서 탐색. 마음수달 교차링크는 외부 브라우저로 열림(의도).
    allowNavigation: ['maumgyeot.com'],
  },
};

export default config;
