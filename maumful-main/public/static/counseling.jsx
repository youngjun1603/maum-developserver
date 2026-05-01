// ============================================================
// counseling.jsx  v2 — 상담센터 플랫폼 (2단계: 실결제 연동)
// 토스페이먼츠 SDK + DB 실시간 슬롯 + 마이예약 관리
// ============================================================
const SESSION_TYPES = {
  video: { label: '화상 상담', icon: '📹', desc: '온라인 화상 · 예약 후 링크 자동 발송' },
  phone: { label: '전화 상담', icon: '📞', desc: '전화 통화로 진행' },
  visit: { label: '방문 상담', icon: '🏢', desc: '센터 직접 방문' },
};

// ── API 클라이언트 ──────────────────────────────────────────
const cApi = {
  _auth() { const t=localStorage.getItem('access_token'); return t?{'Authorization':'Bearer '+t}:{}; },
  async centers() { return (await fetch('/api/counseling/centers')).json(); },
  async counselors(centerId=null) {
    const url=centerId?`/api/counseling/counselors?centerId=${centerId}`:'/api/counseling/counselors';
    return (await fetch(url)).json();
  },
  async slots(counselorId,date) { return (await fetch(`/api/counseling/counselors/${counselorId}/slots?date=${date}`)).json(); },
  async prepare(body) {
    return (await fetch('/api/counseling/appointments/prepare',{method:'POST',headers:{'Content-Type':'application/json',...this._auth()},body:JSON.stringify(body)})).json();
  },
  async myAppointments() { return (await fetch('/api/counseling/appointments',{headers:this._auth()})).json(); },
  async cancel(id) { return (await fetch(`/api/counseling/appointments/${id}/cancel`,{method:'PATCH',headers:this._auth()})).json(); },
};

const fmt = n => Number(n).toLocaleString('ko-KR')+'원';
const fmtDt = iso => { if(!iso)return''; const d=new Date(iso); return d.toLocaleString('ko-KR',{month:'long',day:'numeric',weekday:'short',hour:'2-digit',minute:'2-digit'}); };
const toDateStr = d => d.toISOString().slice(0,10);
const parseArr = v => { if(Array.isArray(v))return v; try{return JSON.parse(v);}catch{return[];} };

function Stars({rating,size=13}){
  const full=Math.floor(rating), arr=Array.from({length:5},(_,i)=>i<full?'★':'☆');
  return React.createElement('span',{style:{fontSize:size,color:'#F59E0B',letterSpacing:-1}},arr.join(''));
}
function StatusBadge({status}){
  const m={pending:{bg:'#FEF3C7',color:'#B45309',label:'결제 대기'},confirmed:{bg:'#D8F3DC',color:'#2D6A4F',label:'예약 확정'},completed:{bg:'#EEF0FF',color:'#5B21B6',label:'완료'},cancelled:{bg:'#FEF2F2',color:'#991B1B',label:'취소됨'},no_show:{bg:'#F5F5F0',color:'#9A9A9A',label:'노쇼'}};
  const s=m[status]||{bg:'#F5F5F0',color:'#9A9A9A',label:status};
  return React.createElement('span',{style:{fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:100,background:s.bg,color:s.color}},s.label);
}

// ── CENTER COLOR MAP ────────────────────────────────────────
const CC = {1:{color:'#2D6A4F',bg:'#D8F3DC'},2:{color:'#F59E0B',bg:'#FFFBEB'},3:{color:'#7C3AED',bg:'#F5F3FF'}};
const getCC = id => CC[id]||{color:'#5A5A5A',bg:'#F5F5F0'};

// ============================================================
// BookingModal — 3단계 예약 플로우 (실 토스 SDK)
// ============================================================
function BookingModal({counselor,onClose,onComplete,isLoggedIn,setView}){
  const {useState:useS,useEffect:useE}=React;
  const [step,setStep]=useS(1);
  const [dates,setDates]=useS([]);
  const [selDate,setSelDate]=useS(null);
  const [slots,setSlots]=useS([]);
  const [slotsLoading,setSlotsLoading]=useS(false);
  const [selTime,setSelTime]=useS(null);
  const [selType,setSelType]=useS(null);
  const [memo,setMemo]=useS('');
  const [preparing,setPreparing]=useS(false);
  const [done,setDone]=useS(false);
  const c=counselor;

  useE(()=>{
    const ds=[];
    for(let i=1;i<=21;i++){const d=new Date();d.setDate(d.getDate()+i);if(d.getDay()!==0)ds.push(d);}
    setDates(ds.slice(0,14));
  },[]);

  useE(()=>{
    if(!selDate)return;
    setSlotsLoading(true); setSlots([]); setSelTime(null);
    cApi.slots(c.id,toDateStr(selDate))
      .then(res=>{ if(res.success)setSlots(res.data); else setSlots([]); })
      .catch(()=>{
        const fb=[];
        for(let h=9;h<18;h++){for(let m=0;m<60;m+=(c.minutes>=60?60:50)){if(h*60+m+c.minutes>18*60)break;const t=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;const busy=['09:00','11:00','14:00','16:00'].includes(t);fb.push({time:t,available:!busy});}}
        setSlots(fb);
      })
      .finally(()=>setSlotsLoading(false));
  },[selDate]);

  const handlePay=async()=>{
    if(!isLoggedIn){onClose();setView('memberLogin');return;}
    if(!selDate||!selTime){alert('날짜와 시간을 선택해 주세요.');return;}
    if(!selType){alert('상담 방식을 선택해 주세요.');return;}
    setPreparing(true);
    try{
      const scheduledAt=`${toDateStr(selDate)}T${selTime}:00`;
      const res=await cApi.prepare({counselorId:c.id,scheduledAt,sessionType:selType,userMemo:memo});
      if(!res.success){alert(res.error||'예약 준비 실패');setPreparing(false);return;}
      const d=res.data;
      // 토스 SDK 로드
      if(!window.TossPayments){
        await new Promise((ok,ng)=>{const s=document.createElement('script');s.src='https://js.tosspayments.com/v1/payment';s.onload=ok;s.onerror=ng;document.head.appendChild(s);});
      }
      const tp=window.TossPayments(d.tossClientKey);
      await tp.requestPayment('카드',{amount:d.amount,orderId:d.orderId,orderName:d.orderName,customerName:d.customerName,customerEmail:d.customerEmail,successUrl:d.successUrl,failUrl:d.failUrl});
    }catch(err){
      if(err?.code!=='USER_CANCEL'){console.error(err);alert('결제 중 오류가 발생했습니다.');}
      setPreparing(false);
    }
  };

  // 데모 결제 (TOSS 미설정 환경용)
  const handleDemoPay=async()=>{
    if(!isLoggedIn){onClose();setView('memberLogin');return;}
    setPreparing(true);
    await new Promise(r=>setTimeout(r,1400));
    setPreparing(false); setDone(true);
    const roomId='maumful-'+Math.random().toString(36).slice(2,10);
    setTimeout(()=>onComplete({counselor:c,date:selDate,time:selTime,type:selType,roomId,videoRoomUrl:selType==='video'?`https://meet.jit.si/${roomId}`:null}),600);
  };

  const stepsL=['날짜·시간','상담 유형','결제'];
  const ok1=selDate&&selTime, ok2=!!selType&&c.types&&c.types.length>0;

  if(done)return(
    <div style={{minHeight:280,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,padding:'40px 24px',fontFamily:"'Noto Sans KR',sans-serif",textAlign:'center'}}>
      <div style={{fontSize:52}}>✅</div>
      <h3 style={{fontSize:20,fontWeight:700}}>예약이 완료되었습니다!</h3>
      <p style={{fontSize:14,color:'#5A5A5A',lineHeight:1.7}}>{c.name} 상담사 · {selDate&&selDate.toLocaleDateString('ko-KR',{month:'long',day:'numeric'})} {selTime}</p>
      <div style={{background:'#D8F3DC',borderRadius:10,padding:'9px 18px',fontSize:13,color:'#2D6A4F',fontWeight:600}}>결제 완료 · {fmt(c.fee)}</div>
    </div>
  );


  return(
    <div style={{fontFamily:"'Noto Sans KR',sans-serif"}}>
      {/* 헤더 */}
      <div style={{padding:'16px 20px 0',borderBottom:'1px solid rgba(0,0,0,.07)',paddingBottom:12}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div><div style={{fontSize:15,fontWeight:700}}>{c.emoji} {c.name} 상담사 예약</div><div style={{fontSize:12,color:'#9A9A9A',marginTop:1}}>{c.centerName}</div></div>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#9A9A9A'}}>✕</button>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:0}}>
          {stepsL.map((l,i)=>(
            <React.Fragment key={l}>
              <div style={{display:'flex',alignItems:'center',gap:4}}>
                <div style={{width:19,height:19,borderRadius:'50%',background:step>i+1?'#2D6A4F':step===i+1?'#2D6A4F':'#E5E5E0',color:step>=i+1?'white':'#9A9A9A',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,flexShrink:0}}>
                  {step>i+1?'✓':i+1}
                </div>
                <span style={{fontSize:11,fontWeight:step===i+1?600:400,color:step===i+1?'#1A1A1A':'#9A9A9A'}}>{l}</span>
              </div>
              {i<stepsL.length-1&&<div style={{flex:1,height:1,background:step>i+1?'#2D6A4F':'#E5E5E0',margin:'0 5px'}}/>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 콘텐츠 */}
      <div style={{padding:'16px 20px',maxHeight:420,overflowY:'auto'}}>

        {step===1&&(
          <div>
            <div style={{fontSize:13,fontWeight:600,marginBottom:9}}>날짜 선택</div>
            <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:18}}>
              {dates.map(d=>{
                const lbl=d.toLocaleDateString('ko-KR',{month:'short',day:'numeric',weekday:'short'});
                const sel=selDate&&toDateStr(d)===toDateStr(selDate);
                return(<button key={toDateStr(d)} onClick={()=>setSelDate(d)} style={{padding:'6px 10px',borderRadius:7,border:'1px solid',borderColor:sel?'#2D6A4F':'rgba(0,0,0,.10)',background:sel?'#D8F3DC':'white',color:sel?'#2D6A4F':'#1A1A1A',fontSize:11,fontWeight:sel?700:400,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>{lbl}</button>);
              })}
            </div>
            {selDate&&(
              <>
                <div style={{fontSize:13,fontWeight:600,marginBottom:9}}>시간 선택 {slotsLoading&&<span style={{fontSize:11,color:'#9A9A9A',fontWeight:400,marginLeft:6}}>조회 중...</span>}</div>
                {slots.length===0&&!slotsLoading&&<div style={{fontSize:13,color:'#9A9A9A',padding:'12px 0'}}>이 날짜는 예약 가능한 시간이 없습니다.</div>}
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:5}}>
                  {slots.map(slot=>{
                    const sel=selTime===slot.time;
                    return(<button key={slot.time} onClick={()=>slot.available&&setSelTime(slot.time)} disabled={!slot.available} style={{padding:'8px 0',borderRadius:7,border:'1px solid',borderColor:sel?'#2D6A4F':!slot.available?'#E5E5E0':'rgba(0,0,0,.10)',background:sel?'#D8F3DC':!slot.available?'#F9F9F7':'white',color:sel?'#2D6A4F':!slot.available?'#CACACA':'#1A1A1A',fontSize:12,fontWeight:sel?700:400,cursor:slot.available?'pointer':'not-allowed',fontFamily:"'Noto Sans KR',sans-serif",textDecoration:!slot.available?'line-through':'none'}}>{slot.time}</button>);
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {step===2&&(
          <div>
            <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>상담 유형 선택</div>
            <div style={{display:'flex',flexDirection:'column',gap:7,marginBottom:16}}>
              {(!c.types||c.types.length===0)?(
                <div style={{padding:'16px',background:'#FEF3C7',borderRadius:11,fontSize:13,color:'#B45309',textAlign:'center'}}>
                  이 상담사는 현재 예약 가능한 상담 방식이 없습니다.<br/>센터에 직접 문의해 주세요.
                </div>
              ):c.types.map(type=>{
                const info=SESSION_TYPES[type]||{icon:'📋',label:type,desc:''};
                const sel=selType===type;
                return(<button key={type} onClick={()=>setSelType(type)} style={{display:'flex',alignItems:'center',gap:11,padding:'13px 14px',borderRadius:11,border:'1.5px solid',borderColor:sel?'#2D6A4F':'rgba(0,0,0,.10)',background:sel?'#F0FAF4':'white',cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif",textAlign:'left',transition:'all .15s'}}>
                  <span style={{fontSize:24}}>{info.icon}</span>
                  <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:sel?'#2D6A4F':'#1A1A1A'}}>{info.label}</div><div style={{fontSize:12,color:'#9A9A9A',marginTop:1}}>{info.desc}</div></div>
                  <div style={{width:17,height:17,borderRadius:'50%',border:`2px solid ${sel?'#2D6A4F':'#CACACA'}`,background:sel?'#2D6A4F':'white',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{sel&&<div style={{width:6,height:6,borderRadius:'50%',background:'white'}}/>}</div>
                </button>);
              })}
            </div>
            <div style={{fontSize:13,fontWeight:600,marginBottom:7}}>상담사에게 전달할 내용 (선택)</div>
            <textarea value={memo} onChange={e=>setMemo(e.target.value)} placeholder="상담 신청 이유나 주요 고민을 간단히 적어주세요." rows={3} style={{width:'100%',padding:'10px 12px',borderRadius:9,border:'1px solid rgba(0,0,0,.12)',fontSize:13,resize:'none',fontFamily:"'Noto Sans KR',sans-serif",outline:'none',background:'#FAFAF8',lineHeight:1.6}}/>
          </div>
        )}

        {step===3&&(
          <div>
            <div style={{background:'#F9F9F7',borderRadius:11,padding:'12px 14px',marginBottom:16}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:9}}>예약 정보 확인</div>
              {[{label:'상담사',val:`${c.emoji} ${c.name} · ${c.title}`},{label:'일시',val:`${selDate&&selDate.toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'short'})} ${selTime}`},{label:'소요시간',val:`${c.minutes}분`},{label:'유형',val:`${SESSION_TYPES[selType]?.icon} ${SESSION_TYPES[selType]?.label}`}].map(row=>(
                <div key={row.label} style={{display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:13}}><span style={{color:'#9A9A9A'}}>{row.label}</span><span style={{fontWeight:500}}>{row.val}</span></div>
              ))}
              <div style={{borderTop:'1px solid rgba(0,0,0,.07)',paddingTop:8,marginTop:4,display:'flex',justifyContent:'space-between'}}><span style={{fontSize:14,fontWeight:700}}>결제 금액</span><span style={{fontSize:16,fontWeight:700,color:'#2D6A4F'}}>{fmt(c.fee)}</span></div>
            </div>
            <div style={{background:'#EEF0FF',borderRadius:9,padding:'9px 13px',marginBottom:14,fontSize:12,color:'#5B21B6',lineHeight:1.6}}>ℹ️ 상담 24시간 전까지 취소 시 전액 환불 · 이후 취소 불가</div>
            <div style={{fontSize:11,color:'#9A9A9A',textAlign:'center',lineHeight:1.7}}>[결제하기] 클릭 시 토스페이먼츠 결제창이 열립니다<br/>카드 / 카카오페이 / 네이버페이 / 토스페이 지원</div>
          </div>
        )}
      </div>

      {/* 버튼 */}
      <div style={{padding:'10px 20px 16px',borderTop:'1px solid rgba(0,0,0,.07)',display:'flex',gap:7}}>
        {step>1&&<button onClick={()=>setStep(s=>s-1)} style={{flex:1,padding:'11px 0',borderRadius:9,background:'white',border:'1px solid rgba(0,0,0,.12)',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>← 이전</button>}
        {step<3?(
          <button onClick={()=>setStep(s=>s+1)} disabled={step===1?!ok1:!ok2} style={{flex:2,padding:'11px 0',borderRadius:9,border:'none',background:(step===1?ok1:ok2)?'#2D6A4F':'#E5E5E0',color:(step===1?ok1:ok2)?'white':'#9A9A9A',fontSize:13,fontWeight:700,cursor:(step===1?ok1:ok2)?'pointer':'not-allowed',fontFamily:"'Noto Sans KR',sans-serif"}}>다음 →</button>
        ):(
          <button onClick={handlePay} disabled={preparing} style={{flex:2,padding:'11px 0',borderRadius:9,border:'none',background:preparing?'#9A9A9A':'#2D6A4F',color:'white',fontSize:13,fontWeight:700,cursor:preparing?'not-allowed':'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>
            {preparing?'결제 준비 중...':`${fmt(c.fee)} 결제하기`}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// VideoRoom — Jitsi Meet 화상상담
// ============================================================
function VideoRoom({roomId,counselorName,onLeave}){
  const {useEffect:useE,useRef}=React;
  const containerRef=useRef(null);
  const apiRef=useRef(null);

  useE(()=>{
    const load=()=>{
      if(!containerRef.current)return;
      apiRef.current=new window.JitsiMeetExternalAPI('meet.jit.si',{
        roomName:roomId,parentNode:containerRef.current,width:'100%',height:520,
        userInfo:{displayName:'내담자'},
        configOverwrite:{startWithAudioMuted:false,startWithVideoMuted:false,disableDeepLinking:true,prejoinPageEnabled:false,subject:`마음풀 · ${counselorName} 상담사`},
        interfaceConfigOverwrite:{TOOLBAR_BUTTONS:['microphone','camera','desktop','fullscreen','fodeviceselection','hangup','chat','raisehand','tileview'],SHOW_JITSI_WATERMARK:false,SHOW_WATERMARK_FOR_GUESTS:false,DEFAULT_REMOTE_DISPLAY_NAME:counselorName||'상담사',APP_NAME:'마음풀 상담'},
      });
      apiRef.current.addEventListener('readyToClose',()=>onLeave&&onLeave());
    };
    if(window.JitsiMeetExternalAPI){load();}
    else{const s=document.createElement('script');s.src='https://meet.jit.si/external_api.js';s.onload=load;document.head.appendChild(s);}
    return()=>{try{apiRef.current?.dispose();}catch{}};
  },[roomId]);

  return(
    <div style={{fontFamily:"'Noto Sans KR',sans-serif",minHeight:'100vh',background:'#0D1117'}}>
      <div style={{background:'#161B22',padding:'11px 22px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid rgba(255,255,255,.08)'}}>
        <div style={{display:'flex',alignItems:'center',gap:9}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:'#22C55E'}}/>
          <div><div style={{fontSize:13,fontWeight:600,color:'white'}}>{counselorName} 상담사 · 화상 상담 진행 중</div><div style={{fontSize:11,color:'rgba(255,255,255,.4)',marginTop:1}}>룸: {roomId} · 종단간 암호화</div></div>
        </div>
        <button onClick={onLeave} style={{background:'#DC2626',color:'white',border:'none',borderRadius:7,padding:'7px 14px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>상담 종료</button>
      </div>
      <div ref={containerRef} style={{width:'100%'}}/>
      <div style={{padding:'16px 22px',background:'#0D1117'}}>
        <div style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:11,padding:'14px 18px',display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
          {[{icon:'🔒',title:'종단간 암호화',desc:'Jitsi E2E 암호화'},{icon:'📝',title:'녹화 안내',desc:'동의 없이 녹화 불가'},{icon:'🏠',title:'개인 룸',desc:'예약자만 입장'}].map(i=>(
            <div key={i.title} style={{textAlign:'center'}}><div style={{fontSize:18,marginBottom:3}}>{i.icon}</div><div style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,.7)'}}>{i.title}</div><div style={{fontSize:10,color:'rgba(255,255,255,.35)',marginTop:1}}>{i.desc}</div></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MyAppointments — 마이페이지 예약 내역 탭
// ============================================================
function MyAppointments({setView}){
  const {useState:useS,useEffect:useE}=React;
  const [appts,setAppts]=useS([]);
  const [loading,setLoading]=useS(true);
  const [videoRoom,setVideoRoom]=useS(null);
  const [cancelling,setCancelling]=useS(null);

  const load=async()=>{
    setLoading(true);
    try{const r=await cApi.myAppointments();if(r.success)setAppts(r.data);}catch{}
    setLoading(false);
  };
  useE(()=>{load();},[]);

  const handleCancel=async(id)=>{
    if(!confirm('예약을 취소하시겠습니까?'))return;
    setCancelling(id);
    const r=await cApi.cancel(id);
    setCancelling(null);
    if(r.success){alert(r.data.message);load();}else alert(r.error||'취소 실패');
  };

  if(videoRoom)return<VideoRoom roomId={videoRoom.roomId} counselorName={videoRoom.counselorName} onLeave={()=>setVideoRoom(null)}/>;

  if(loading)return<div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'36px 0',color:'#9A9A9A',fontFamily:"'Noto Sans KR',sans-serif",fontSize:14}}>예약 내역 조회 중...</div>;

  if(appts.length===0)return(
    <div style={{textAlign:'center',padding:'44px 0',fontFamily:"'Noto Sans KR',sans-serif"}}>
      <div style={{fontSize:38,marginBottom:10}}>📅</div>
      <div style={{fontSize:15,fontWeight:600,marginBottom:5}}>예약 내역이 없습니다</div>
      <div style={{fontSize:13,color:'#9A9A9A',marginBottom:18}}>전문 상담사와 상담을 예약해보세요</div>
      <button onClick={()=>setView('counseling')} style={{background:'#2D6A4F',color:'white',border:'none',borderRadius:9,padding:'10px 22px',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>상담사 찾기 →</button>
    </div>
  );

  const upcoming=appts.filter(a=>a.status!=='cancelled'&&new Date(a.scheduled_at)>new Date());
  const past=appts.filter(a=>a.status==='cancelled'||new Date(a.scheduled_at)<=new Date());

  const Card=({a})=>{
    const isUpcoming=new Date(a.scheduled_at)>new Date()&&a.status!=='cancelled';
    const canVideo=a.session_type==='video'&&a.video_room_id&&a.status==='confirmed';
    const canCancel=isUpcoming&&a.status!=='cancelled';
    const canReview=a.status==='completed';
    return(
      <div style={{background:'white',border:'1px solid rgba(0,0,0,.08)',borderRadius:13,padding:'16px 18px',marginBottom:9,opacity:a.status==='cancelled'?.65:1}}>
        <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
          <div style={{fontSize:26,width:40,height:40,background:'#F0FAF4',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{a.photo_emoji||'👤'}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap',marginBottom:3}}><span style={{fontSize:14,fontWeight:700}}>{a.counselor_name}</span><span style={{fontSize:11,color:'#9A9A9A'}}>{a.counselor_title}</span><StatusBadge status={a.status}/></div>
            <div style={{fontSize:13,color:'#5A5A5A',marginBottom:2}}>{a.center_name}</div>
            <div style={{fontSize:13,fontWeight:500}}>{fmtDt(a.scheduled_at)} · {a.duration_min}분</div>
            <div style={{fontSize:12,color:'#9A9A9A',marginTop:1}}>{SESSION_TYPES[a.session_type]?.icon} {SESSION_TYPES[a.session_type]?.label} · {fmt(a.fee_amount)}</div>
          </div>
        </div>
        {(canVideo||canCancel)&&(
          <div style={{display:'flex',gap:7,marginTop:12,paddingTop:10,borderTop:'1px solid rgba(0,0,0,.06)'}}>
            {canVideo&&<button onClick={()=>setVideoRoom({roomId:a.video_room_id,counselorName:a.counselor_name})} style={{flex:1,padding:'9px 0',background:'#2D6A4F',color:'white',border:'none',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>📹 화상 상담 입장</button>}
            {canCancel&&<button onClick={()=>handleCancel(a.id)} disabled={cancelling===a.id} style={{flex:1,padding:'9px 0',background:'white',color:'#9A9A9A',border:'1px solid rgba(0,0,0,.12)',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>{cancelling===a.id?'취소 중...':'예약 취소'}</button>}
            {canReview&&<button onClick={()=>{if(typeof ReviewModal!=='undefined')alert('리뷰 작성: counseling 페이지에서 가능합니다');}} style={{flex:1,padding:'9px 0',background:'#FEF3C7',color:'#B45309',border:'none',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>⭐ 리뷰 작성</button>}
          </div>
        )}
      </div>
    );
  };

  return(
    <div style={{fontFamily:"'Noto Sans KR',sans-serif"}}>
      {upcoming.length>0&&<><div style={{fontSize:13,fontWeight:700,color:'#5A5A5A',marginBottom:9}}>예정된 상담 ({upcoming.length})</div>{upcoming.map(a=><Card key={a.id} a={a}/>)}</>}
      {past.length>0&&<div style={{marginTop:upcoming.length>0?18:0}}><div style={{fontSize:13,fontWeight:700,color:'#9A9A9A',marginBottom:9}}>지난 상담</div>{past.map(a=><Card key={a.id} a={a}/>)}</div>}
    </div>
  );
}

// ============================================================
// OnboardingForm — 센터 제휴 신청 폼
// ============================================================
function OnboardingForm({onClose,isLoggedIn}){
  const {useState:useS}=React;
  const [form,setForm]=useS({center_name:'',contact_name:'',contact_email:'',contact_phone:'',address:'',description:'',counselor_count:'1',website_url:'',business_reg_num:'',specialty_tags:[]});
  const [submitting,setSubmitting]=useS(false);
  const [done,setDone]=useS(false);
  const [err,setErr]=useS('');

  const ALL_TAGS=['우울','불안','가족','부부','트라우마','직장스트레스','번아웃','아동청소년','CBT','PTSD','자존감','대인관계'];

  const toggleTag=t=>setForm(f=>({...f,specialty_tags:f.specialty_tags.includes(t)?f.specialty_tags.filter(x=>x!==t):[...f.specialty_tags,t]}));
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const submit=async()=>{
    if(!form.center_name||!form.contact_name||!form.contact_email){setErr('센터명, 담당자명, 이메일은 필수입니다');return;}
    setSubmitting(true); setErr('');
    try{
      const token=localStorage.getItem('access_token');
      const r=await fetch('/api/counseling/onboarding',{method:'POST',headers:{'Content-Type':'application/json',...(token?{'Authorization':'Bearer '+token}:{})},body:JSON.stringify({...form,specialty_tags:JSON.stringify(form.specialty_tags),counselor_count:parseInt(form.counselor_count)||1})});
      const d=await r.json();
      if(d.success)setDone(true);
      else setErr(d.error||'신청 실패');
    }catch{setErr('네트워크 오류');}
    setSubmitting(false);
  };

  if(done)return(
    <div style={{padding:'40px 32px',textAlign:'center',fontFamily:"'Noto Sans KR',sans-serif"}}>
      <div style={{fontSize:52,marginBottom:16}}>🎉</div>
      <h3 style={{fontSize:20,fontWeight:700,marginBottom:10}}>신청이 완료되었습니다!</h3>
      <p style={{fontSize:14,color:'#5A5A5A',lineHeight:1.8,marginBottom:24}}>검토 후 입력하신 이메일로 연락드리겠습니다.<br/>일반적으로 3~5 영업일 내 처리됩니다.</p>
      <button onClick={onClose} style={{background:'#2D6A4F',color:'white',border:'none',borderRadius:10,padding:'12px 28px',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>확인</button>
    </div>
  );

  return(
    <div style={{fontFamily:"'Noto Sans KR',sans-serif",maxHeight:'85vh',overflowY:'auto'}}>
      <div style={{padding:'20px 24px',borderBottom:'1px solid rgba(0,0,0,.07)',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,background:'white',zIndex:1}}>
        <div><div style={{fontSize:16,fontWeight:700}}>🏥 상담센터 제휴 신청</div><div style={{fontSize:12,color:'#9A9A9A',marginTop:1}}>검토 후 3~5 영업일 내 연락드립니다</div></div>
        <button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#9A9A9A'}}>✕</button>
      </div>

      <div style={{padding:'20px 24px'}}>
        {err&&<div style={{background:'#FEF2F2',color:'#991B1B',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:13}}>{err}</div>}

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
          {[['center_name','센터명 *','마음숲 심리상담센터',false],['contact_name','담당자명 *','홍길동',false],['contact_email','이메일 *','contact@center.kr',false],['contact_phone','전화번호','02-1234-5678',false],['address','센터 주소','서울 강남구 테헤란로 123',false],['website_url','홈페이지','https://center.kr',false],['business_reg_num','사업자등록번호','123-45-67890',false],['counselor_count','상담사 수','',false]].map(([key,label,ph,full])=>(
            <div key={key} style={full?{gridColumn:'1/-1'}:{}}>
              <div style={{fontSize:12,fontWeight:600,marginBottom:5,color:'#5A5A5A'}}>{label}</div>
              <input type={key==='counselor_count'?'number':'text'} value={form[key]} onChange={e=>set(key,e.target.value)} placeholder={ph}
                style={{width:'100%',padding:'9px 12px',border:'1px solid rgba(0,0,0,.12)',borderRadius:8,fontSize:13,fontFamily:"'Noto Sans KR',sans-serif",outline:'none'}}/>
            </div>
          ))}
        </div>

        <div style={{marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:600,marginBottom:8,color:'#5A5A5A'}}>전문 분야</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {ALL_TAGS.map(t=>(
              <button key={t} onClick={()=>toggleTag(t)}
                style={{padding:'5px 12px',borderRadius:100,border:'1px solid',borderColor:form.specialty_tags.includes(t)?'#2D6A4F':'rgba(0,0,0,.10)',background:form.specialty_tags.includes(t)?'#D8F3DC':'white',color:form.specialty_tags.includes(t)?'#2D6A4F':'#5A5A5A',fontSize:12,fontWeight:form.specialty_tags.includes(t)?700:400,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:600,marginBottom:5,color:'#5A5A5A'}}>센터 소개</div>
          <textarea value={form.description} onChange={e=>set('description',e.target.value)} placeholder="센터 특징, 주요 상담 분야, 운영 방식 등을 소개해주세요." rows={4}
            style={{width:'100%',padding:'10px 12px',border:'1px solid rgba(0,0,0,.12)',borderRadius:8,fontSize:13,resize:'none',fontFamily:"'Noto Sans KR',sans-serif",outline:'none',lineHeight:1.6}}/>
        </div>

        <div style={{background:'#F0FAF4',borderRadius:10,padding:'12px 16px',marginBottom:20,fontSize:12,color:'#2D6A4F',lineHeight:1.7}}>
          ✅ 플랫폼 수수료: 상담료의 10% (협의 가능)<br/>
          ✅ 결제 정산: 월 1회 (완료 상담 기준)<br/>
          ✅ 온보딩 지원: 승인 후 상담사 등록 가이드 제공
        </div>

        <button onClick={submit} disabled={submitting}
          style={{width:'100%',padding:'13px 0',background:submitting?'#9A9A9A':'#2D6A4F',color:'white',border:'none',borderRadius:10,fontSize:15,fontWeight:700,cursor:submitting?'not-allowed':'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>
          {submitting?'신청 중...':'제휴 신청하기'}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// ReviewModal — 리뷰 작성 (완료된 예약에서 호출)
// ============================================================
function ReviewModal({appointmentId,counselorName,onClose,onDone}){
  const {useState:useS}=React;
  const [rating,setRating]=useS(0);
  const [hover,setHover]=useS(0);
  const [content,setContent]=useS('');
  const [isAnon,setIsAnon]=useS(false);
  const [submitting,setSubmitting]=useS(false);
  const [err,setErr]=useS('');

  const submit=async()=>{
    if(rating===0){setErr('별점을 선택해주세요');return;}
    setSubmitting(true); setErr('');
    try{
      const token=localStorage.getItem('access_token');
      const r=await fetch('/api/counseling/reviews',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({appointment_id:appointmentId,rating,content,is_anonymous:isAnon})});
      const d=await r.json();
      if(d.success)onDone();
      else setErr(d.error||'오류');
    }catch{setErr('네트워크 오류');}
    setSubmitting(false);
  };

  return(
    <div style={{fontFamily:"'Noto Sans KR',sans-serif",padding:'24px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div><div style={{fontSize:16,fontWeight:700}}>{counselorName} 상담사 리뷰</div><div style={{fontSize:12,color:'#9A9A9A',marginTop:1}}>솔직한 리뷰가 큰 도움이 됩니다</div></div>
        <button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#9A9A9A'}}>✕</button>
      </div>

      <div style={{textAlign:'center',marginBottom:20}}>
        <div style={{fontSize:12,color:'#9A9A9A',marginBottom:8}}>상담은 어떠셨나요?</div>
        <div style={{display:'flex',justifyContent:'center',gap:6}}>
          {[1,2,3,4,5].map(n=>(
            <button key={n} onClick={()=>setRating(n)} onMouseEnter={()=>setHover(n)} onMouseLeave={()=>setHover(0)}
              style={{background:'none',border:'none',fontSize:36,cursor:'pointer',color:(hover||rating)>=n?'#F59E0B':'#E5E5E0',transition:'color .1s'}}>★</button>
          ))}
        </div>
        {rating>0&&<div style={{fontSize:13,color:'#F59E0B',fontWeight:600,marginTop:4}}>{['','별로예요','아쉬워요','보통이에요','좋았어요','최고였어요'][rating]}</div>}
      </div>

      {err&&<div style={{background:'#FEF2F2',color:'#991B1B',borderRadius:8,padding:'8px 12px',marginBottom:12,fontSize:13}}>{err}</div>}

      <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="상담 경험을 자세히 공유해주세요. (선택)" rows={4}
        style={{width:'100%',padding:'10px 12px',border:'1px solid rgba(0,0,0,.12)',borderRadius:8,fontSize:13,resize:'none',fontFamily:"'Noto Sans KR',sans-serif",outline:'none',lineHeight:1.6,marginBottom:14}}/>

      <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'#5A5A5A',marginBottom:18,cursor:'pointer'}}>
        <input type="checkbox" checked={isAnon} onChange={e=>setIsAnon(e.target.checked)} style={{width:15,height:15}}/>
        익명으로 작성
      </label>

      <button onClick={submit} disabled={submitting||rating===0}
        style={{width:'100%',padding:'12px 0',background:submitting||rating===0?'#9A9A9A':'#2D6A4F',color:'white',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:submitting||rating===0?'not-allowed':'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>
        {submitting?'등록 중...':'리뷰 등록하기'}
      </button>
    </div>
  );
}


// ============================================================
// CounselingPage — 메인 페이지
// ============================================================
function CounselingPage({setView,isLoggedIn,currentUser}){
  const {useState:useS,useEffect:useE}=React;
  const [centers,setCenters]=useS([]);
  const [counselors,setCounselors]=useS([]);
  const [dataLoading,setDataLoading]=useS(true);
  const [selectedCenter,setSelectedCenter]=useS(null);
  const [filterTag,setFilterTag]=useS(null);
  const [filterType,setFilterType]=useS(null);
  const [searchQ,setSearchQ]=useS('');
  const [bookingOpen,setBookingOpen]=useS(false);
  const [bookingTarget,setBookingTarget]=useS(null);
  const [completedAppt,setCompletedAppt]=useS(null);
  const [videoRoom,setVideoRoom]=useS(null);
  const [onboardingOpen,setOnboardingOpen]=useS(false);
  const [reviewModal,setReviewModal]=useS(null);
  const [showDemoNotice,setShowDemoNotice]=useS(true);

  const FALLBACK_CENTERS=[
    {id:1,name:'마음숲 심리상담센터',logo_emoji:'🌲',description:'우울·불안·대인관계 전문.',address:'서울 강남구 테헤란로 123',specialty_tags:'["우울","불안","대인관계","자존감"]',status:'pending'},
    {id:2,name:'행복한마음 심리치유센터',logo_emoji:'🌻',description:'가족·부부 상담 전문.',address:'서울 서초구 방배로 456',specialty_tags:'["가족","부부","트라우마","PTSD"]',status:'pending'},
    {id:3,name:'서울 인지행동 상담클리닉',logo_emoji:'🧩',description:'CBT·마음챙김 기반.',address:'서울 마포구 홍대입구로 789',specialty_tags:'["번아웃","강박","공황","CBT"]',status:'pending'},
  ];
  const FALLBACK_COUNSELORS=[
    {id:1,center_id:1,center_name:'마음숲 심리상담센터',name:'김하은',photo_emoji:'👩',title:'상담심리사 1급',bio:'10년간 우울·불안 전문 상담.',specialties:'["우울","불안","자존감"]',fee_per_session:90000,session_minutes:50,available_types:'["video","phone","visit"]',avg_rating:4.9,review_count:127},
    {id:2,center_id:1,center_name:'마음숲 심리상담센터',name:'박준서',photo_emoji:'👨',title:'임상심리사 1급',bio:'직장인 스트레스·번아웃 전문.',specialties:'["직장스트레스","번아웃"]',fee_per_session:80000,session_minutes:50,available_types:'["video","phone"]',avg_rating:4.7,review_count:89},
    {id:3,center_id:2,center_name:'행복한마음 심리치유센터',name:'이수민',photo_emoji:'👩',title:'가족상담사 수퍼바이저',bio:'15년 가족·부부 상담 경험.',specialties:'["가족","부부","이혼"]',fee_per_session:100000,session_minutes:60,available_types:'["video","visit"]',avg_rating:4.8,review_count:203},
    {id:4,center_id:2,center_name:'행복한마음 심리치유센터',name:'최지영',photo_emoji:'👩',title:'아동청소년 상담전문가',bio:'트라우마·PTSD 전문.',specialties:'["트라우마","PTSD","아동청소년"]',fee_per_session:120000,session_minutes:60,available_types:'["video","visit"]',avg_rating:4.9,review_count:156},
    {id:5,center_id:3,center_name:'서울 인지행동 상담클리닉',name:'정민호',photo_emoji:'👨',title:'CBT 전문 상담사',bio:'공황장애·강박장애 전문.',specialties:'["공황","강박","CBT"]',fee_per_session:85000,session_minutes:50,available_types:'["video","phone"]',avg_rating:4.6,review_count:74},
  ];

  useE(()=>{
    setDataLoading(true);
    Promise.all([cApi.centers(),cApi.counselors()])
      .then(([cr,co])=>{if(cr.success)setCenters(cr.data);else setCenters(FALLBACK_CENTERS);if(co.success)setCounselors(co.data);else setCounselors(FALLBACK_COUNSELORS);})
      .catch(()=>{setCenters(FALLBACK_CENTERS);setCounselors(FALLBACK_COUNSELORS);})
      .finally(()=>setDataLoading(false));
  },[]);

  if(videoRoom)return<VideoRoom roomId={videoRoom.roomId} counselorName={videoRoom.counselorName} onLeave={()=>setVideoRoom(null)}/>;

  if(completedAppt){
    const a=completedAppt;
    return(
      <div style={{fontFamily:"'Noto Sans KR',sans-serif",minHeight:'100vh',background:'#FAFAF8'}}>
        <div style={{maxWidth:520,margin:'0 auto',padding:'72px 24px',textAlign:'center'}}>
          <div style={{fontSize:68,marginBottom:18}}>🎉</div>
          <h2 style={{fontSize:24,fontWeight:700,marginBottom:11}}>예약이 완료되었습니다</h2>
          <p style={{fontSize:15,color:'#5A5A5A',lineHeight:1.8,marginBottom:26}}>{a.counselor.name} 상담사와의 상담이 확정되었습니다.<br/>예약 확인 이메일이 발송됩니다.</p>
          <div style={{background:'white',borderRadius:14,padding:'20px 24px',border:'1px solid rgba(0,0,0,.08)',marginBottom:22,textAlign:'left'}}>
            {[{label:'상담사',val:`${a.counselor.emoji} ${a.counselor.name} · ${a.counselor.title}`},{label:'일시',val:a.date?`${a.date.toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'short'})} ${a.time}`:'-'},{label:'유형',val:`${SESSION_TYPES[a.type]?.icon} ${SESSION_TYPES[a.type]?.label}`},{label:'결제금액',val:fmt(a.counselor.fee)}].map(row=>(
              <div key={row.label} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid rgba(0,0,0,.05)',fontSize:14}}><span style={{color:'#9A9A9A'}}>{row.label}</span><span style={{fontWeight:600}}>{row.val}</span></div>
            ))}
          </div>
          {a.type==='video'&&a.videoRoomUrl&&(
            <div style={{background:'#D8F3DC',borderRadius:11,padding:'14px 18px',marginBottom:20}}>
              <div style={{fontSize:14,fontWeight:700,color:'#2D6A4F',marginBottom:5}}>📹 화상 상담 링크 준비 완료</div>
              <div style={{fontSize:12,color:'#2D6A4F',marginBottom:9}}>상담 시간에 아래 버튼을 클릭해 입장하세요</div>
              <button onClick={()=>setVideoRoom({roomId:a.roomId,counselorName:a.counselor.name})} style={{width:'100%',padding:'10px 0',background:'#2D6A4F',color:'white',border:'none',borderRadius:9,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>화상 상담 입장하기 →</button>
            </div>
          )}
          <div style={{display:'flex',gap:9}}>
            <button onClick={()=>setView('landing')} style={{flex:1,padding:'11px 0',background:'white',border:'1px solid rgba(0,0,0,.12)',borderRadius:9,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>홈으로</button>
            <button onClick={()=>{setCompletedAppt(null);}} style={{flex:1,padding:'11px 0',background:'#2D6A4F',color:'white',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>다른 상담사 보기</button>
          </div>
        </div>
      </div>
    );
  }

  const allTags=[...new Set(counselors.flatMap(c=>parseArr(c.specialties)))];
  const filtered=counselors.filter(c=>{
    if(selectedCenter&&c.center_id!==selectedCenter.id)return false;
    if(filterTag&&!parseArr(c.specialties).includes(filterTag))return false;
    if(filterType&&!parseArr(c.available_types).includes(filterType))return false;
    if(searchQ&&!c.name.includes(searchQ)&&!parseArr(c.specialties).some(s=>s.includes(searchQ)))return false;
    return true;
  });

  // 데모 안내 팝업
  const DemoNoticeModal = () => !showDemoNotice ? null : (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:'white',borderRadius:20,padding:'32px 28px',maxWidth:400,width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.25)',textAlign:'center'}}>
        <div style={{fontSize:48,marginBottom:12}}>🏗️</div>
        <h2 style={{fontSize:18,fontWeight:700,color:'#1a1a1a',marginBottom:8,fontFamily:"'Noto Sans KR',sans-serif"}}>
          서비스 준비 중입니다
        </h2>
        <div style={{background:'#FFF8E1',border:'1px solid #FFD54F',borderRadius:12,padding:'12px 16px',marginBottom:16,textAlign:'left'}}>
          <p style={{fontSize:13,color:'#795548',lineHeight:1.7,margin:0,fontFamily:"'Noto Sans KR',sans-serif"}}>
            ⚠️ 현재 표시된 상담센터 및 상담사 정보는 <strong>서비스 개발을 위한 예시 데이터</strong>입니다.<br/><br/>
            실제 운영 중인 기관이 아니며, 예약·결제 기능은 제휴 센터 등록 후 정식 운영될 예정입니다.
          </p>
        </div>
        <p style={{fontSize:12,color:'#9E9E9E',marginBottom:20,fontFamily:"'Noto Sans KR',sans-serif"}}>
          전문 상담이 필요하시면 아래를 이용해 주세요<br/>
          <strong style={{color:'#E53935'}}>자살예방상담전화 ☎ 1393</strong> (24시간 무료)
        </p>
        <button
          onClick={()=>setShowDemoNotice(false)}
          style={{width:'100%',background:'#2D6A4F',color:'white',border:'none',borderRadius:12,padding:'13px 0',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>
          확인했습니다
        </button>
        <p style={{fontSize:11,color:'#BDBDBD',marginTop:10,fontFamily:"'Noto Sans KR',sans-serif"}}>
          제휴 상담센터 등록 문의: support@maumful.com
        </p>
      </div>
    </div>
  );

  return(
    <div style={{fontFamily:"'Noto Sans KR',sans-serif",background:'#FAFAF8',minHeight:'100vh'}}>
      <DemoNoticeModal />
      {/* 헤더 */}
      <div style={{background:'linear-gradient(135deg,#F0FAF4,#FAFAF8)',borderBottom:'1px solid rgba(0,0,0,.07)',padding:'44px 24px 34px'}}>
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          {selectedCenter?(
            <>
              <button onClick={()=>{setSelectedCenter(null);setFilterTag(null);}} style={{background:'none',border:'none',cursor:'pointer',fontSize:13,color:'#2D6A4F',fontFamily:"'Noto Sans KR',sans-serif",marginBottom:9,padding:0,fontWeight:600}}>← 센터 목록으로</button>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <span style={{fontSize:40}}>{selectedCenter.logo_emoji}</span>
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:3}}><h1 style={{fontSize:24,fontWeight:700}}>{selectedCenter.name}</h1><span style={{fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:100,background:'#FEF3C7',color:'#B45309'}}>⏳ 제휴 진행중</span></div>
                  <p style={{fontSize:13,color:'#5A5A5A'}}>{selectedCenter.address}</p>
                </div>
              </div>
            </>
          ):(
            <>
              <div style={{display:'inline-block',background:'#D8F3DC',color:'#2D6A4F',fontSize:12,fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',padding:'4px 12px',borderRadius:100,marginBottom:12}}>Counseling</div>
              <h1 style={{fontSize:32,fontWeight:700,marginBottom:9}}>전문 <span style={{color:'#2D6A4F'}}>상담사</span>와 연결하세요</h1>
              <p style={{fontSize:15,color:'#5A5A5A',maxWidth:460}}>심리검사 결과를 바탕으로 나에게 맞는 상담사를 찾고 간편하게 예약하세요.</p>
            </>
          )}
        </div>
      </div>

      <div style={{maxWidth:1200,margin:'0 auto',padding:'28px 24px'}}>
        {/* 센터 목록 */}
        {!selectedCenter&&!dataLoading&&(
          <div style={{marginBottom:28}}>
            <div style={{fontSize:13,fontWeight:700,color:'#5A5A5A',marginBottom:10}}>제휴 상담센터</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:11}} className="centers-grid">
              {centers.map(center=>{
                const tags=parseArr(center.specialty_tags),cc=getCC(center.id);
                return(
                  <div key={center.id} onClick={()=>setSelectedCenter(center)}
                    style={{background:'white',border:'1px solid rgba(0,0,0,.08)',borderRadius:13,padding:'16px 15px',cursor:'pointer',transition:'all .2s',borderLeft:`4px solid ${cc.color}`}}
                    onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 5px 20px rgba(0,0,0,.08)';e.currentTarget.style.transform='translateY(-2px)';}}
                    onMouseLeave={e=>{e.currentTarget.style.boxShadow='none';e.currentTarget.style.transform='none';}}>
                    <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:6}}><span style={{fontSize:24}}>{center.logo_emoji}</span><div><div style={{fontSize:13,fontWeight:700}}>{center.name}</div><span style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:100,background:'#FEF3C7',color:'#B45309'}}>⏳ 제휴 진행중</span></div></div>
                    <p style={{fontSize:12,color:'#6A6A6A',lineHeight:1.6,marginBottom:7}}>{center.description}</p>
                    <div style={{display:'flex',flexWrap:'wrap',gap:3}}>{tags.slice(0,3).map(t=><span key={t} style={{fontSize:10,padding:'2px 6px',borderRadius:100,background:cc.bg,color:cc.color,fontWeight:600}}>{t}</span>)}{tags.length>3&&<span style={{fontSize:10,color:'#9A9A9A'}}>+{tags.length-3}</span>}</div>
                    <div style={{marginTop:7,fontSize:11,color:'#9A9A9A'}}>상담사 {counselors.filter(c=>c.center_id===center.id).length}명 →</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 검색·필터 */}
        <div style={{display:'flex',gap:7,marginBottom:13,flexWrap:'wrap',alignItems:'center'}}>
          <div style={{flex:1,minWidth:160,position:'relative'}}>
            <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontSize:12,color:'#9A9A9A'}}>🔍</span>
            <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="상담사 이름 또는 전문 분야" style={{width:'100%',padding:'8px 11px 8px 30px',borderRadius:9,border:'1px solid rgba(0,0,0,.12)',fontSize:13,fontFamily:"'Noto Sans KR',sans-serif",outline:'none',background:'white'}}/>
          </div>
          <div style={{display:'flex',gap:4}}>
            {[null,'video','phone','visit'].map(t=>(
              <button key={String(t)} onClick={()=>setFilterType(t)} style={{padding:'7px 11px',borderRadius:7,border:'1px solid',borderColor:filterType===t?'#2D6A4F':'rgba(0,0,0,.10)',background:filterType===t?'#D8F3DC':'white',color:filterType===t?'#2D6A4F':'#5A5A5A',fontSize:12,fontWeight:filterType===t?700:400,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>
                {t===null?'전체':SESSION_TYPES[t]?.icon+' '+SESSION_TYPES[t]?.label}
              </button>
            ))}
          </div>
        </div>
        {/* 태그 */}
        <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:18}}>
          <button onClick={()=>setFilterTag(null)} style={{padding:'3px 10px',borderRadius:100,border:'1px solid',borderColor:!filterTag?'#2D6A4F':'rgba(0,0,0,.10)',background:!filterTag?'#2D6A4F':'white',color:!filterTag?'white':'#5A5A5A',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>전체</button>
          {allTags.map(tag=>(
            <button key={tag} onClick={()=>setFilterTag(tag===filterTag?null:tag)} style={{padding:'3px 10px',borderRadius:100,border:'1px solid',borderColor:filterTag===tag?'#2D6A4F':'rgba(0,0,0,.10)',background:filterTag===tag?'#D8F3DC':'white',color:filterTag===tag?'#2D6A4F':'#5A5A5A',fontSize:11,fontWeight:filterTag===tag?700:400,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>{tag}</button>
          ))}
        </div>
        <div style={{fontSize:12,color:'#9A9A9A',marginBottom:12}}>상담사 <strong style={{color:'#1A1A1A'}}>{filtered.length}명</strong></div>

        {/* 상담사 카드 */}
        {dataLoading?<div style={{textAlign:'center',padding:'36px 0',color:'#9A9A9A'}}>불러오는 중...</div>:filtered.length===0?<div style={{textAlign:'center',padding:'44px 0',color:'#9A9A9A'}}><div style={{fontSize:32,marginBottom:9}}>🔍</div><div style={{fontSize:13}}>검색 결과가 없습니다</div></div>:(
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}} className="counselor-grid">
            {filtered.map(c=>{
              const cc=getCC(c.center_id),specs=parseArr(c.specialties),types=parseArr(c.available_types);
              return(
                <div key={c.id} style={{background:'white',border:'1px solid rgba(0,0,0,.08)',borderRadius:13,padding:'18px 16px 14px',display:'flex',flexDirection:'column',gap:9,transition:'all .2s'}}
                  onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 5px 24px ${cc.color}1A`;e.currentTarget.style.borderColor=cc.color+'44';e.currentTarget.style.transform='translateY(-2px)';}}
                  onMouseLeave={e=>{e.currentTarget.style.boxShadow='none';e.currentTarget.style.borderColor='rgba(0,0,0,.08)';e.currentTarget.style.transform='none';}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                    <div style={{width:44,height:44,borderRadius:12,background:cc.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>{c.photo_emoji}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:5,flexWrap:'wrap'}}><span style={{fontSize:15,fontWeight:700}}>{c.name}</span><span style={{fontSize:9,color:cc.color,background:cc.bg,padding:'2px 6px',borderRadius:100,fontWeight:600}}>{c.title}</span></div>
                      <div style={{fontSize:11,color:'#9A9A9A',marginTop:1}}>{c.center_name}</div>
                      <div style={{display:'flex',alignItems:'center',gap:4,marginTop:2}}><Stars rating={parseFloat(c.avg_rating)||0} size={11}/><span style={{fontSize:11,fontWeight:600}}>{parseFloat(c.avg_rating||0).toFixed(1)}</span><span style={{fontSize:10,color:'#9A9A9A'}}>({c.review_count})</span></div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}><div style={{fontSize:14,fontWeight:700}}>{fmt(c.fee_per_session)}</div><div style={{fontSize:11,color:'#9A9A9A'}}>{c.session_minutes}분</div></div>
                  </div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:3}}>{specs.map(s=><span key={s} style={{fontSize:10,fontWeight:500,padding:'2px 7px',borderRadius:100,background:cc.bg,color:cc.color}}>{s}</span>)}</div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:2}}>
                    <div style={{display:'flex',gap:3}}>{types.map(t=><span key={t} style={{fontSize:10,padding:'2px 6px',borderRadius:4,background:'#F5F5F0',color:'#5A5A5A'}}>{SESSION_TYPES[t]?.icon} {SESSION_TYPES[t]?.label}</span>)}</div>
                    <button onClick={()=>{setBookingTarget({id:c.id,emoji:c.photo_emoji,name:c.name,title:c.title,centerName:c.center_name,centerId:c.center_id,fee:c.fee_per_session,minutes:c.session_minutes,types:parseArr(c.available_types)});setBookingOpen(true);}} style={{background:cc.color,color:'white',border:'none',borderRadius:7,padding:'7px 14px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif",whiteSpace:'nowrap'}}>예약하기</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 제휴 배너 */}
        <div style={{marginTop:36,background:'white',border:'1px dashed rgba(0,0,0,.12)',borderRadius:13,padding:'22px 26px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div><div style={{fontSize:14,fontWeight:700,marginBottom:4}}>상담센터 제휴 신청</div><p style={{fontSize:13,color:'#5A5A5A',lineHeight:1.6}}>귀 센터의 상담사를 마음풀에 등록하고 더 많은 내담자를 만나세요.</p></div>
          <button onClick={()=>setView('memberLogin')} style={{background:'#2D6A4F',color:'white',border:'none',borderRadius:8,padding:'10px 20px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>제휴 신청하기 →</button>
        </div>
      </div>

      {/* 온보딩 신청 모달 */}
      {onboardingOpen&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,padding:16}} onClick={e=>{if(e.target===e.currentTarget)setOnboardingOpen(false);}}>
          <div style={{background:'white',borderRadius:18,width:'100%',maxWidth:560,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 20px 72px rgba(0,0,0,.25)'}}>
            <OnboardingForm onClose={()=>setOnboardingOpen(false)} isLoggedIn={false}/>
          </div>
        </div>
      )}

      {/* 리뷰 모달 */}
      {reviewModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,padding:16}} onClick={e=>{if(e.target===e.currentTarget)setReviewModal(null);}}>
          <div style={{background:'white',borderRadius:18,width:'100%',maxWidth:440,boxShadow:'0 20px 72px rgba(0,0,0,.25)'}}>
            <ReviewModal appointmentId={reviewModal.appointmentId} counselorName={reviewModal.counselorName} onClose={()=>setReviewModal(null)} onDone={()=>{setReviewModal(null);alert('리뷰가 등록되었습니다. 감사합니다!');}}/>
          </div>
        </div>
      )}

      {/* 예약 모달 */}
      {bookingOpen&&bookingTarget&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,padding:16}} onClick={e=>{if(e.target===e.currentTarget)setBookingOpen(false);}}>
          <div style={{background:'white',borderRadius:18,width:'100%',maxWidth:500,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 20px 72px rgba(0,0,0,.25)'}}>
            <BookingModal counselor={bookingTarget} onClose={()=>setBookingOpen(false)} onComplete={a=>{setBookingOpen(false);setCompletedAppt(a);}} isLoggedIn={isLoggedIn} setView={setView}/>
          </div>
        </div>
      )}
    </div>
  );
}
