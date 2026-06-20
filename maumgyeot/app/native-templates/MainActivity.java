// `npx cap add android` 실행 후, 생성된
//   android/app/src/main/java/com/maumgyeot/app/MainActivity.java
// 를 이 내용으로 교체한다.
package com.maumgyeot.app;

import android.os.Bundle;
import android.webkit.PermissionRequest;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onStart() {
    super.onStart();
    // 폰 "글꼴 크게" 설정이 WebView 텍스트를 키워 레이아웃이 깨지는 것 방지
    getBridge().getWebView().getSettings().setTextZoom(100);
  }

  // 영상 통역(getUserMedia) 카메라/마이크 권한:
  // Capacitor 6의 기본 WebChromeClient가 onPermissionRequest를 처리하지만,
  // 기기/롬에 따라 카메라가 안 열리면 아래 onStart 끝에 다음을 추가해 강제 허용한다.
  //
  //   getBridge().getWebView().setWebChromeClient(new com.getcapacitor.BridgeWebChromeClient(getBridge()) {
  //     @Override public void onPermissionRequest(final PermissionRequest request) {
  //       runOnUiThread(() -> request.grant(request.getResources()));
  //     }
  //   });
  //
  // ⚠️ 단, AndroidManifest에 CAMERA·RECORD_AUDIO 권한이 있어야 하고,
  //    앱 첫 실행 시 런타임 권한 팝업이 떠야 한다(권한 거부 시 카메라 동작 안 함).
}
