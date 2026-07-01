// 프론트(React/htm SPA) 렌더 스모크 — 빌드/200이 못 잡는 런타임 undefined 참조를 잡는다.
// 컴파일된 JS의 최상위 컴포넌트(대문자 function)를 실제 호출해 ReferenceError를 검출.
// 사용: node scripts/render_smoke.cjs public/static/compiled/landing.js
// 주의: 거대한 단일 컴포넌트(예: app.js의 PsychologicalTestSystem)는 stub 한계로 오탐 가능 → landing 등 분리형에 유효.
const fs = require('fs');
const file = process.argv[2] || 'public/static/compiled/landing.js';

global.window = { location:{search:'',pathname:'/',hostname:'maumful.com',origin:'https://maumful.com',hash:''}, addEventListener(){},removeEventListener(){},open(){},scrollTo(){}, matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}) };
global.document = { createElement:()=>({style:{},appendChild(){},setAttribute(){}}), addEventListener(){}, getElementById:()=>({}), querySelector:()=>null, head:{appendChild(){}} };
global.localStorage = { getItem:()=>null,setItem(){},removeItem(){} };
global.sessionStorage = { getItem:()=>null,setItem(){},removeItem(){} };
global.fetch = ()=>Promise.resolve({json:()=>Promise.resolve({}),ok:true});
global.navigator = { clipboard:{writeText:()=>Promise.resolve()} };
global.IntersectionObserver = class{observe(){}disconnect(){}unobserve(){}};
global.React = { useState:(v)=>[typeof v==='function'?v():v,()=>{}], useEffect:()=>{}, useRef:(v)=>({current:v??null}), useMemo:(f)=>f(), useCallback:(f)=>f, createElement:()=>({}), Fragment:'F' };
global.htm = { bind:()=> (s,...v)=>({__:1}) };
global.ReactDOM = { createRoot:()=>({render(){},unmount(){}}), render(){} };

let code = fs.readFileSync(file,'utf8');
const names = [...code.matchAll(/function\s+([A-Z]\w*)\s*\(/g)].map(m=>m[1]);
code += "\n;globalThis.__C={};" + names.map(n=>`try{globalThis.__C[${JSON.stringify(n)}]=${n}}catch(e){}`).join(';');
try { (0,eval)(code); } catch(e){ console.log('EVAL_ERROR:', e.message); process.exit(1); }

const props = { setView(){}, isLoggedIn:true, lang:'ko', currentUser:{nickname:'q'}, credits:0, activeView:'', onLangToggle(){}, setMyPageTab(){}, loadTestHistory(){}, setAutoOpenExternal(){}, tl:(a)=>a, token:'t', onLogin(){}, onBack(){}, onDone(){}, data:{} };
let fail = 0;
for (const n of names) {
  const C = globalThis.__C[n];
  if (typeof C !== 'function') continue;
  try { C(props); console.log('✓', n); }
  catch(e){ if (e instanceof ReferenceError) { console.log('✗ '+n+' → ReferenceError: '+e.message); fail++; } else { console.log('· '+n+' (stub 한계: '+e.constructor.name+')'); } }
}
console.log(fail ? `\n❌ ReferenceError ${fail}건 — 스코프/오타 점검 필요` : '\n✅ ReferenceError 없음');
process.exit(fail ? 1 : 0);
