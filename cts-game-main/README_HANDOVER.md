# ⚠️ 이 폴더는 CTS(예수님마음) 소속입니다

이 폴더(`cts-game-main/`, 워커 `lightoflife-game`)는 **CTS 서비스의 일부**이지만,
지금은 **마음풀 레포(`maum-developserver`) 안에** 들어 있습니다. CTS 본체(`cts-maum-main`)는
별도 레포(`github.com/youngjun1603/lightoflife-cts`)에 있습니다.

## CTS를 다른 담당자에게 넘길 때

`lightoflife-cts` 레포만 넘기면 **이 폴더가 통째로 누락됩니다.**
반드시 이 폴더를 함께 export해서 전달하세요.

인수인계 전체 명세(범위·인프라·시크릿·체크리스트)는 **`cts-maum-main/HANDOVER.md`** 를 보세요.

## 이 워커 요약

- 워커: `lightoflife-game` → `lightoflife-game.limyj007.workers.dev`
- DB/KV: `lightoflife-db` / KV `75bddd6d…` — **CTS 본체와 공유**, 마음풀과는 완전 별개
- cron(주간 리포트 메일)은 `wrangler.toml`에서 **비활성**(무료 플랜 cron 5개 제한)
- 배포: `npm run build:jsx && npx wrangler deploy` (포그라운드)
