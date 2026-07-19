// ============================================================
// counseling_admin.jsx  —  상담 플랫폼 어드민 대시보드
// 3단계: 센터 관리 · 상담사 관리 · 예약 관리 · 정산 · 온보딩
// ============================================================

const aApi = {
  _h() { const s=localStorage.getItem('admin_secret'); return s?{'Authorization':'Bearer '+s,'Content-Type':'application/json'}:{'Content-Type':'application/json'}; },
  async stats()       { return (await fetch('/api/admin/counseling/stats',{headers:this._h()})).json(); },
  async centers()     { return (await fetch('/api/admin/counseling/centers',{headers:this._h()})).json(); },
  async centerStatus(id,status,reason) { return (await fetch(`/api/admin/counseling/centers/${id}/status`,{method:'PATCH',headers:this._h(),body:JSON.stringify({status,rejected_reason:reason})})).json(); },
  async counselors()  { return (await fetch('/api/admin/counseling/counselors',{headers:this._h()})).json(); },
  async patchCounselor(id,body) { return (await fetch(`/api/admin/counseling/counselors/${id}`,{method:'PATCH',headers:this._h(),body:JSON.stringify(body)})).json(); },
  async appointments(status,page=1) { return (await fetch(`/api/admin/counseling/appointments?status=${status}&page=${page}`,{headers:this._h()})).json(); },
  async completeAppt(id) { return (await fetch(`/api/admin/counseling/appointments/${id}/complete`,{method:'PATCH',headers:this._h()})).json(); },
  async settlements() { return (await fetch('/api/admin/counseling/settlements',{headers:this._h()})).json(); },
  async createSettlement(b) { return (await fetch('/api/admin/counseling/settlements',{method:'POST',headers:this._h(),body:JSON.stringify(b)})).json(); },
  async processSettlement(id,note) { return (await fetch(`/api/admin/counseling/settlements/${id}/process`,{method:'PATCH',headers:this._h(),body:JSON.stringify({note})})).json(); },
  async onboarding()  { return (await fetch('/api/admin/counseling/onboarding',{headers:this._h()})).json(); },
  async reviewOnboarding(id,status,note) { return (await fetch(`/api/admin/counseling/onboarding/${id}`,{method:'PATCH',headers:this._h(),body:JSON.stringify({status,admin_note:note})})).json(); },
  async globalStats() { return (await fetch('/api/admin/stats',{headers:this._h()})).json(); },
  async dailyStats(days=14) { return (await fetch(`/api/admin/stats/daily?days=${days}`,{headers:this._h()})).json(); },
  async testStats()  { return (await fetch('/api/admin/stats/tests',{headers:this._h()})).json(); },
  async users(page=1,search='') { return (await fetch(`/api/admin/users?page=${page}&limit=20&search=${encodeURIComponent(search)}`,{headers:this._h()})).json(); },
  async grantCredits(id,amount,reason) { return (await fetch(`/api/admin/users/${id}/credits`,{method:'POST',headers:this._h(),body:JSON.stringify({amount,reason})})).json(); },
  async deleteUser(id) { return (await fetch(`/api/admin/users/${id}`,{method:'DELETE',headers:this._h()})).json(); },
  async errorLogs(service='',limit=50) { return (await fetch(`/api/admin/error-logs?service=${encodeURIComponent(service)}&limit=${limit}`,{headers:this._h()})).json(); },
  async clearErrorLogs() { return (await fetch('/api/admin/error-logs',{method:'DELETE',headers:this._h()})).json(); },
  async reviews(page=1) { return (await fetch(`/api/admin/counseling/reviews?page=${page}`,{headers:this._h()})).json(); },
  async toggleReview(id,hidden) { return (await fetch(`/api/admin/counseling/reviews/${id}/visibility`,{method:'PATCH',headers:this._h(),body:JSON.stringify({hidden})})).json(); },

  // ── 센터 CRUD ───────────────────────────────────────────────
  async createCenter(body)     { return (await fetch('/api/admin/counseling/centers',{method:'POST',headers:this._h(),body:JSON.stringify(body)})).json(); },
  async updateCenter(id,body)  { return (await fetch(`/api/admin/counseling/centers/${id}`,{method:'PUT',headers:this._h(),body:JSON.stringify(body)})).json(); },
  async deleteCenter(id)       { return (await fetch(`/api/admin/counseling/centers/${id}`,{method:'DELETE',headers:this._h()})).json(); },

  // ── 상담사 CRUD + 스케줄 ────────────────────────────────────
  async createCounselor(body)      { return (await fetch('/api/admin/counseling/counselors',{method:'POST',headers:this._h(),body:JSON.stringify(body)})).json(); },
  async updateCounselor(id,body)   { return (await fetch(`/api/admin/counseling/counselors/${id}`,{method:'PUT',headers:this._h(),body:JSON.stringify(body)})).json(); },
  async deleteCounselor(id)        { return (await fetch(`/api/admin/counseling/counselors/${id}`,{method:'DELETE',headers:this._h()})).json(); },
  async getSchedules(id)           { return (await fetch(`/api/admin/counseling/counselors/${id}/schedules`,{headers:this._h()})).json(); },
  async saveSchedules(id,schedules){ return (await fetch(`/api/admin/counseling/counselors/${id}/schedules`,{method:'POST',headers:this._h(),body:JSON.stringify({schedules})})).json(); },
  // ── 파트너 채널 관리 ─────────────────────────────────────────
  async partners()                    { return (await fetch('/api/admin/partners',{headers:this._h()})).json(); },
  async createPartner(body)           { return (await fetch('/api/admin/partners',{method:'POST',headers:this._h(),body:JSON.stringify(body)})).json(); },
  async updatePartner(code,body)      { return (await fetch(`/api/admin/partners/${code}`,{method:'PATCH',headers:this._h(),body:JSON.stringify(body)})).json(); },
  async partnerStats(code,from,to)    { return (await fetch(`/api/admin/partner-stats?code=${code}&from=${from}&to=${to}`,{headers:this._h()})).json(); },
  async partnerSettlement(code,month) { return (await fetch(`/api/admin/partner-settlement?code=${code}&month=${month}`,{headers:this._h()})).json(); },
  async partnerCommissions(code,from,to,status){ return (await fetch(`/api/admin/partner-commissions?code=${code}&from=${from}&to=${to}${status?`&status=${status}`:''}`,{headers:this._h()})).json(); },
  async settlePartner(body){ return (await fetch('/api/admin/partner-commissions/settle',{method:'POST',headers:this._h(),body:JSON.stringify(body)})).json(); },
};

const fmtW  = n => Number(n||0).toLocaleString('ko-KR')+'원';
const fmtDtAdmin = iso => { if(!iso)return'-'; const d=new Date(iso); return d.toLocaleString('ko-KR',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}); };
const fmtDate = iso => { if(!iso)return'-'; return new Date(iso).toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric'}); };

function Chip({label,color='gray'}){
  const C={green:{bg:'#D8F3DC',text:'#1A6B3C'},amber:{bg:'#FEF3C7',text:'#B45309'},red:{bg:'#FEF2F2',text:'#991B1B'},blue:{bg:'#EEF0FF',text:'#5B21B6'},gray:{bg:'#F5F5F0',text:'#5A5A5A'}};
  const s=C[color]||C.gray;
  return React.createElement('span',{style:{fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:100,background:s.bg,color:s.text}},label);
}

function StatCard({icon,label,value,sub,color='#2D6A4F'}){
  return(
    <div style={{background:'white',border:'1px solid rgba(0,0,0,.08)',borderRadius:12,padding:'18px 20px'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
        <div style={{width:34,height:34,borderRadius:9,background:color+'1A',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>{icon}</div>
        <span style={{fontSize:12,color:'#9A9A9A',fontWeight:500}}>{label}</span>
      </div>
      <div style={{fontSize:26,fontWeight:700,color:'#1A1A1A',lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:'#9A9A9A',marginTop:4}}>{sub}</div>}
    </div>
  );
}

function Table({cols,rows,renderRow}){
  return(
    <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
        <thead>
          <tr style={{borderBottom:'1.5px solid rgba(0,0,0,.08)'}}>
            {cols.map(c=><th key={c} style={{padding:'10px 12px',textAlign:'left',fontWeight:600,fontSize:12,color:'#9A9A9A',whiteSpace:'nowrap'}}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length===0?<tr><td colSpan={cols.length} style={{padding:'32px 0',textAlign:'center',color:'#9A9A9A'}}>데이터 없음</td></tr>:rows.map((r,i)=>renderRow(r,i))}
        </tbody>
      </table>
    </div>
  );
}

// ── 미니 바 차트 (라이브러리 없이 CSS) ─────────────────────
function MiniBarChart({data,keys,colors,height=60}){
  if(!data||!data.length) return null;
  const maxVal = Math.max(1,...data.map(d=>Math.max(...keys.map(k=>d[k]||0))));
  return(
    <div style={{display:'flex',alignItems:'flex-end',gap:2,height,padding:'4px 0'}}>
      {data.map((d,i)=>(
        <div key={i} style={{flex:1,display:'flex',alignItems:'flex-end',gap:1,height:'100%',position:'relative'}}>
          {keys.map((k,ki)=>(
            <div key={k} title={`${d.date||''} ${k}: ${d[k]||0}`} style={{
              flex:1, borderRadius:'2px 2px 0 0',
              background:colors[ki]||'#999',
              height:`${Math.round(((d[k]||0)/maxVal)*100)}%`,
              minHeight:1, transition:'height .2s',
            }}/>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── 탭: 대시보드 ────────────────────────────────────────────
function AdminOverview(){
  const {useState:useS,useEffect:useE}=React;
  const [stats,setStats]=useS(null);
  const [gStats,setGStats]=useS(null);
  const [daily,setDaily]=useS([]);
  const [testBreakdown,setTestBreakdown]=useS([]);
  const [loading,setLoading]=useS(true);

  useE(()=>{
    Promise.all([aApi.stats(),aApi.globalStats(),aApi.dailyStats(14),aApi.testStats()])
      .then(([s,g,d,t])=>{
        if(s.success)setStats(s.data);
        if(g.success)setGStats(g.data);
        if(d.success){
          const raw=d.data||{};
          const m={};
          const mk=day=>{if(!m[day])m[day]={date:day,signups:0,tests:0,chats:0,charges:0};};
          (raw.signups||[]).forEach(r=>{mk(r.day);m[r.day].signups=r.cnt;});
          (raw.tests||[]).forEach(r=>{mk(r.day);m[r.day].tests=r.cnt;});
          (raw.chats||[]).forEach(r=>{mk(r.day);m[r.day].chats=r.cnt;});
          (raw.revenue||[]).forEach(r=>{mk(r.day);m[r.day].charges=r.cnt;});
          setDaily(Object.values(m).sort((a,b)=>a.date>b.date?1:-1).slice(-14));
        }
        if(t.success)setTestBreakdown(t.data||[]);
      })
      .finally(()=>setLoading(false));
  },[]);

  if(loading)return<div style={{textAlign:'center',padding:'40px',color:'#9A9A9A'}}>로딩 중...</div>;
  if(!stats)return<div style={{textAlign:'center',padding:'40px',color:'#E24B4A'}}>데이터 조회 실패</div>;

  const s=stats;
  const totalTests = testBreakdown.reduce((a,t)=>a+(t.count||0),0)||1;

  return(
    <div>
      <div style={{fontSize:15,fontWeight:700,marginBottom:16,color:'#5A5A5A'}}>상담 플랫폼 현황</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:28}}>
        <StatCard icon="🏥" label="등록 센터" value={`${s.centers?.total||0}개`} sub={`활성 ${s.centers?.active||0} · 심사중 ${s.centers?.pending||0}`} color="#2D6A4F"/>
        <StatCard icon="👥" label="활성 상담사" value={`${s.counselors?.active||0}명`} sub={`전체 ${s.counselors?.total||0}명`} color="#7C3AED"/>
        <StatCard icon="📅" label="이번 달 매출" value={fmtW(s.revenue?.month_revenue)} sub={`누적 ${fmtW(s.revenue?.total_revenue)}`} color="#F59E0B"/>
        <StatCard icon="⭐" label="평균 평점" value={`${parseFloat(s.reviews?.avg_rating||0).toFixed(1)}점`} sub={`리뷰 ${s.reviews?.total||0}건`} color="#EF4444"/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:28}}>
        <StatCard icon="✅" label="확정 예약" value={`${s.appointments?.confirmed||0}건`} color="#3B82F6"/>
        <StatCard icon="🎉" label="완료 상담" value={`${s.appointments?.completed||0}건`} color="#10B981"/>
        <StatCard icon="📋" label="오늘 신규 예약" value={`${s.appointments?.today||0}건`} color="#F97316"/>
        <StatCard icon="📨" label="온보딩 신청" value={`${s.onboarding?.pending||0}건`} sub="검토 대기" color="#EC4899"/>
      </div>

      {gStats&&(
        <>
          <div style={{fontSize:15,fontWeight:700,marginBottom:12,color:'#5A5A5A'}}>심리검사 플랫폼 현황</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24}}>
            <StatCard icon="👤" label="전체 회원" value={`${gStats.users?.total||0}명`} sub={`오늘 신규 ${gStats.users?.new_today||0}명`}/>
            <StatCard icon="🧠" label="검사 수행" value={`${gStats.tests?.total||0}회`} sub={`오늘 ${gStats.tests?.today||0}회`}/>
            <StatCard icon="💬" label="AI 채팅" value={`${gStats.chats?.total||0}회`} sub={`오늘 ${gStats.chats?.today||0}회`}/>
            <StatCard icon="💳" label="이번달 결제" value={fmtW(gStats.charges?.revenue)} sub={`${gStats.charges?.cnt||0}건`}/>
          </div>
        </>
      )}

      {/* 일별 트렌드 차트 */}
      {daily.length>0&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24}}>
          {/* 신규 가입 + 검사 수행 */}
          <div style={{background:'white',border:'1px solid rgba(0,0,0,.08)',borderRadius:12,padding:'18px 20px'}}>
            <div style={{fontSize:13,fontWeight:600,color:'#5A5A5A',marginBottom:4}}>📈 일별 신규가입 / 검사 수행 (최근 14일)</div>
            <div style={{display:'flex',gap:12,marginBottom:8}}>
              <span style={{fontSize:11,color:'#3B82F6',display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:'#3B82F6',display:'inline-block'}}/>가입</span>
              <span style={{fontSize:11,color:'#10B981',display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:'#10B981',display:'inline-block'}}/>검사</span>
            </div>
            <MiniBarChart data={daily} keys={['signups','tests']} colors={['#3B82F6','#10B981']} height={72}/>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
              <span style={{fontSize:10,color:'#C0C0C0'}}>{daily[0]?.date?.slice(5)||''}</span>
              <span style={{fontSize:10,color:'#C0C0C0'}}>{daily[daily.length-1]?.date?.slice(5)||''}</span>
            </div>
          </div>
          {/* AI 채팅 + 결제 건수 */}
          <div style={{background:'white',border:'1px solid rgba(0,0,0,.08)',borderRadius:12,padding:'18px 20px'}}>
            <div style={{fontSize:13,fontWeight:600,color:'#5A5A5A',marginBottom:4}}>💬 일별 AI 채팅 / 결제 건수 (최근 14일)</div>
            <div style={{display:'flex',gap:12,marginBottom:8}}>
              <span style={{fontSize:11,color:'#7C3AED',display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:'#7C3AED',display:'inline-block'}}/>채팅</span>
              <span style={{fontSize:11,color:'#F59E0B',display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:'#F59E0B',display:'inline-block'}}/>결제</span>
            </div>
            <MiniBarChart data={daily} keys={['chats','charges']} colors={['#7C3AED','#F59E0B']} height={72}/>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
              <span style={{fontSize:10,color:'#C0C0C0'}}>{daily[0]?.date?.slice(5)||''}</span>
              <span style={{fontSize:10,color:'#C0C0C0'}}>{daily[daily.length-1]?.date?.slice(5)||''}</span>
            </div>
          </div>
        </div>
      )}

      {/* 검사 유형 분포 */}
      {testBreakdown.length>0&&(
        <div style={{background:'white',border:'1px solid rgba(0,0,0,.08)',borderRadius:12,padding:'18px 20px'}}>
          <div style={{fontSize:13,fontWeight:600,color:'#5A5A5A',marginBottom:14}}>🧠 검사 유형별 수행 현황</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {testBreakdown.sort((a,b)=>(b.count||0)-(a.count||0)).map((t,i)=>{
              const pct=Math.round(((t.count||0)/totalTests)*100);
              const clrs=['#3B82F6','#10B981','#7C3AED','#F59E0B','#EF4444','#EC4899'];
              return(
                <div key={t.test_type||i}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontSize:12,fontWeight:600,color:'#1A1A1A'}}>{t.test_type||'기타'}</span>
                    <span style={{fontSize:12,color:'#9A9A9A'}}>{(t.count||0).toLocaleString()}회 ({pct}%)</span>
                  </div>
                  <div style={{background:'#F0F0EC',borderRadius:100,height:6,overflow:'hidden'}}>
                    <div style={{width:`${pct}%`,height:'100%',borderRadius:100,background:clrs[i%clrs.length],transition:'width .3s'}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 탭: 사용자 관리 ─────────────────────────────────────────
function AdminUsers(){
  const {useState:useS,useEffect:useE}=React;
  const [users,setUsers]=useS([]);
  const [page,setPage]=useS(1);
  const [search,setSearch]=useS('');
  const [searchInput,setSearchInput]=useS('');
  const [total,setTotal]=useS(0);
  const [loading,setLoading]=useS(true);
  const [grantModal,setGrantModal]=useS(null); // {id,email,credits}
  const [grantAmt,setGrantAmt]=useS('');
  const [grantReason,setGrantReason]=useS('');
  const [granting,setGranting]=useS(false);
  const [deleteModal,setDeleteModal]=useS(null); // {id,email}
  const [deleting,setDeleting]=useS(false);

  const load=(p,s)=>{
    setLoading(true);
    aApi.users(p,s).then(r=>{
      if(r.success){setUsers(r.data.users||[]);setTotal(r.data.total||0);}
    }).finally(()=>setLoading(false));
  };
  useE(()=>load(1,''),[]);

  const handleSearch=()=>{setPage(1);setSearch(searchInput);load(1,searchInput);};
  const handlePage=p=>{setPage(p);load(p,search);};

  const handleDelete=async()=>{
    setDeleting(true);
    const r=await aApi.deleteUser(deleteModal.id);
    setDeleting(false);
    if(r.success){setDeleteModal(null);load(page,search);}
    else alert(r.error||'삭제 실패');
  };

  const handleGrant=async()=>{
    if(!grantAmt||isNaN(grantAmt))return;
    setGranting(true);
    const r=await aApi.grantCredits(grantModal.id,parseInt(grantAmt),grantReason);
    setGranting(false);
    if(r.success){
      setGrantModal(null);setGrantAmt('');setGrantReason('');
      load(page,search);
    } else alert(r.error||'오류');
  };

  const totalPages=Math.ceil(total/20)||1;

  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontSize:15,fontWeight:700}}>사용자 관리 (총 {total.toLocaleString()}명)</div>
        <div style={{display:'flex',gap:8}}>
          <input value={searchInput} onChange={e=>setSearchInput(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&handleSearch()}
            placeholder="이메일 검색" style={{padding:'7px 12px',border:'1px solid rgba(0,0,0,.12)',borderRadius:8,fontSize:13,fontFamily:"'Noto Sans KR',sans-serif",outline:'none',width:200}}/>
          <button onClick={handleSearch} style={{padding:'7px 14px',borderRadius:8,border:'none',background:'#2D6A4F',color:'white',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>검색</button>
        </div>
      </div>
      {loading?<div style={{textAlign:'center',padding:'32px',color:'#9A9A9A'}}>로딩 중...</div>:(
        <>
          <Table
            cols={['#','이메일','닉네임','크레딧','가입일','검증','크레딧 지급','삭제']}
            rows={users}
            renderRow={(u,i)=>(
              <tr key={u.id} style={{borderBottom:'1px solid rgba(0,0,0,.05)'}}>
                <td style={{padding:'10px 12px',color:'#9A9A9A',fontSize:12}}>{(page-1)*20+i+1}</td>
                <td style={{padding:'10px 12px',fontWeight:500}}>{u.email}</td>
                <td style={{padding:'10px 12px',color:'#5A5A5A'}}>{u.nickname||'-'}</td>
                <td style={{padding:'10px 12px',fontWeight:600,color:'#2D6A4F'}}>{(u.credits||0).toLocaleString()}cr</td>
                <td style={{padding:'10px 12px',color:'#9A9A9A',fontSize:12,whiteSpace:'nowrap'}}>{fmtDate(u.created_at)}</td>
                <td style={{padding:'10px 12px'}}>
                  <Chip label={u.email_verified?'인증':'미인증'} color={u.email_verified?'green':'amber'}/>
                </td>
                <td style={{padding:'10px 12px'}}>
                  <button onClick={()=>setGrantModal({id:u.id,email:u.email,credits:u.credits})}
                    style={{padding:'5px 12px',borderRadius:7,border:'1px solid #2D6A4F33',background:'white',color:'#2D6A4F',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>
                    + 지급
                  </button>
                </td>
                <td style={{padding:'10px 12px'}}>
                  <button onClick={()=>setDeleteModal({id:u.id,email:u.email})}
                    style={{padding:'5px 10px',borderRadius:7,border:'1px solid #CC000033',background:'white',color:'#CC0000',fontSize:13,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}
                    title="회원 삭제">🗑️</button>
                </td>
              </tr>
            )}
          />
          {/* 페이지네이션 */}
          <div style={{display:'flex',justifyContent:'center',gap:6,marginTop:20}}>
            <button onClick={()=>handlePage(Math.max(1,page-1))} disabled={page===1}
              style={{padding:'6px 12px',borderRadius:7,border:'1px solid rgba(0,0,0,.12)',background:page===1?'#F5F5F0':'white',color:page===1?'#C0C0C0':'#1A1A1A',cursor:page===1?'default':'pointer',fontSize:12,fontFamily:"'Noto Sans KR',sans-serif"}}>← 이전</button>
            <span style={{padding:'6px 12px',fontSize:12,color:'#5A5A5A'}}>{page} / {totalPages}</span>
            <button onClick={()=>handlePage(Math.min(totalPages,page+1))} disabled={page===totalPages}
              style={{padding:'6px 12px',borderRadius:7,border:'1px solid rgba(0,0,0,.12)',background:page===totalPages?'#F5F5F0':'white',color:page===totalPages?'#C0C0C0':'#1A1A1A',cursor:page===totalPages?'default':'pointer',fontSize:12,fontFamily:"'Noto Sans KR',sans-serif"}}>다음 →</button>
          </div>
        </>
      )}

      {/* 회원 삭제 확인 모달 */}
      {deleteModal&&(
        <Modal title="회원 삭제 확인" onClose={()=>setDeleteModal(null)}>
          <div style={{padding:'20px 22px',display:'flex',flexDirection:'column',gap:14}}>
            <div style={{fontSize:13,color:'#5A5A5A',lineHeight:1.7}}>
              <strong style={{color:'#CC0000'}}>{deleteModal.email}</strong> 계정을 삭제하시겠습니까?<br/>
              <span style={{fontSize:12,color:'#9A9A9A'}}>삭제 후 이메일 정보는 익명 처리됩니다. 검사 이력은 통계 용도로 유지됩니다.</span>
            </div>
            <button onClick={handleDelete} disabled={deleting} style={{
              padding:'12px',borderRadius:10,border:'none',background:'#CC0000',color:'white',
              fontWeight:700,fontSize:14,cursor:deleting?'not-allowed':'pointer',
              fontFamily:"'Noto Sans KR',sans-serif",opacity:deleting?0.6:1,
            }}>{deleting?'삭제 중...':'삭제 확인'}</button>
          </div>
        </Modal>
      )}

      {/* 크레딧 지급 모달 */}
      {grantModal&&(
        <Modal title={`크레딧 지급 — ${grantModal.email}`} onClose={()=>setGrantModal(null)}>
          <div style={{padding:'20px 22px',display:'flex',flexDirection:'column',gap:14}}>
            <div style={{fontSize:13,color:'#5A5A5A'}}>현재 크레딧: <strong>{(grantModal.credits||0).toLocaleString()}cr</strong></div>
            <div>
              <label style={{fontSize:12,color:'#9A9A9A',display:'block',marginBottom:4}}>지급 크레딧 (음수 입력 시 차감)</label>
              <input type="number" value={grantAmt} onChange={e=>setGrantAmt(e.target.value)}
                placeholder="예: 10 (지급) 또는 -5 (차감)"
                style={{width:'100%',padding:'10px 12px',border:'1px solid rgba(0,0,0,.12)',borderRadius:8,fontSize:14,fontFamily:"'Noto Sans KR',sans-serif",outline:'none'}}/>
            </div>
            <div>
              <label style={{fontSize:12,color:'#9A9A9A',display:'block',marginBottom:4}}>사유 (선택)</label>
              <input value={grantReason} onChange={e=>setGrantReason(e.target.value)} placeholder="관리자 지급"
                style={{width:'100%',padding:'10px 12px',border:'1px solid rgba(0,0,0,.12)',borderRadius:8,fontSize:13,fontFamily:"'Noto Sans KR',sans-serif",outline:'none'}}/>
            </div>
            <button onClick={handleGrant} disabled={granting} style={{
              padding:'12px',borderRadius:10,border:'none',background:'#2D6A4F',color:'white',
              fontWeight:700,fontSize:14,cursor:granting?'not-allowed':'pointer',
              fontFamily:"'Noto Sans KR',sans-serif",
            }}>{granting?'처리 중...':'크레딧 지급'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── 탭: 온보딩 신청 관리 ────────────────────────────────────
function AdminOnboarding(){
  const {useState:useS,useEffect:useE}=React;
  const [list,setList]=useS([]);
  const [loading,setLoading]=useS(true);
  const [processing,setProcessing]=useS(null);
  const [note,setNote]=useS('');

  const load=()=>{setLoading(true);aApi.onboarding().then(r=>{if(r.success)setList(r.data);}).finally(()=>setLoading(false));};
  useE(()=>load(),[]);

  const handle=async(id,status)=>{
    const reason=status==='rejected'?prompt('반려 사유를 입력하세요:'):'';
    if(status==='rejected'&&!reason)return;
    setProcessing(id);
    const r=await aApi.reviewOnboarding(id,status,reason||note);
    setProcessing(null);
    if(r.success){alert(status==='approved'?'승인되었습니다! 센터가 자동 생성되었습니다.':'처리되었습니다.');load();}
    else alert(r.error||'오류');
  };

  const statusColor={pending:'amber',reviewing:'blue',approved:'green',rejected:'red'};
  const statusLabel={pending:'검토 대기',reviewing:'검토 중',approved:'승인됨',rejected:'반려됨'};

  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontSize:15,fontWeight:700}}>센터 온보딩 신청 ({list.length}건)</div>
        <button onClick={load} style={{background:'none',border:'1px solid rgba(0,0,0,.12)',borderRadius:7,padding:'6px 14px',fontSize:12,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>새로고침</button>
      </div>
      {loading?<div style={{textAlign:'center',padding:'32px',color:'#9A9A9A'}}>로딩 중...</div>:(
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {list.length===0&&<div style={{textAlign:'center',padding:'40px',color:'#9A9A9A'}}>신청 내역이 없습니다</div>}
          {list.map(req=>(
            <div key={req.id} style={{background:'white',border:'1px solid rgba(0,0,0,.08)',borderRadius:12,padding:'18px 20px'}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,flexWrap:'wrap',marginBottom:12}}>
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                    <span style={{fontSize:15,fontWeight:700}}>{req.center_name}</span>
                    <Chip label={statusLabel[req.status]||req.status} color={statusColor[req.status]||'gray'}/>
                  </div>
                  <div style={{fontSize:12,color:'#9A9A9A'}}>신청일: {fmtDtAdmin(req.created_at)}</div>
                </div>
                {req.status==='pending'&&(
                  <div style={{display:'flex',gap:7}}>
                    <button onClick={()=>handle(req.id,'reviewing')} disabled={processing===req.id} style={{padding:'7px 14px',borderRadius:7,border:'1px solid rgba(0,0,0,.12)',background:'white',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>검토 시작</button>
                    <button onClick={()=>handle(req.id,'approved')} disabled={processing===req.id} style={{padding:'7px 14px',borderRadius:7,border:'none',background:'#2D6A4F',color:'white',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>✓ 승인</button>
                    <button onClick={()=>handle(req.id,'rejected')} disabled={processing===req.id} style={{padding:'7px 14px',borderRadius:7,border:'none',background:'#E24B4A',color:'white',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>✕ 반려</button>
                  </div>
                )}
                {req.status==='reviewing'&&(
                  <div style={{display:'flex',gap:7}}>
                    <button onClick={()=>handle(req.id,'approved')} disabled={processing===req.id} style={{padding:'7px 14px',borderRadius:7,border:'none',background:'#2D6A4F',color:'white',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>✓ 승인</button>
                    <button onClick={()=>handle(req.id,'rejected')} disabled={processing===req.id} style={{padding:'7px 14px',borderRadius:7,border:'none',background:'#E24B4A',color:'white',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>✕ 반려</button>
                  </div>
                )}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px 20px',fontSize:13}}>
                {[['담당자',req.contact_name],['이메일',req.contact_email],['전화',req.contact_phone||'-'],['주소',req.address||'-'],['상담사 수',`${req.counselor_count||1}명`],['사업자번호',req.business_reg_num||'-']].map(([l,v])=>(
                  <div key={l} style={{display:'flex',gap:8}}><span style={{color:'#9A9A9A',minWidth:60}}>{l}</span><span style={{fontWeight:500}}>{v}</span></div>
                ))}
              </div>
              {req.description&&<div style={{marginTop:10,padding:'10px 12px',background:'#F9F9F7',borderRadius:8,fontSize:13,color:'#5A5A5A',lineHeight:1.6}}>{req.description}</div>}
              {req.admin_note&&<div style={{marginTop:8,padding:'8px 12px',background:'#FEF3C7',borderRadius:8,fontSize:12,color:'#B45309'}}>어드민 메모: {req.admin_note}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 공통: 모달 래퍼 ────────────────────────────────────────────
function Modal({title,onClose,children,width=560}){
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999,padding:20}}>
      <div style={{background:'white',borderRadius:16,width:'100%',maxWidth:width,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,.2)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'18px 22px',borderBottom:'1px solid rgba(0,0,0,.08)'}}>
          <div style={{fontSize:16,fontWeight:700}}>{title}</div>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:'#9A9A9A',lineHeight:1}}>×</button>
        </div>
        <div style={{padding:'20px 22px'}}>{children}</div>
      </div>
    </div>
  );
}

function Field({label,required,children}){
  return(
    <div style={{marginBottom:14}}>
      <label style={{display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:5}}>
        {label}{required&&<span style={{color:'#E24B4A',marginLeft:2}}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inp = {width:'100%',padding:'9px 12px',border:'1.5px solid rgba(0,0,0,.15)',borderRadius:8,fontSize:13,fontFamily:"'Noto Sans KR',sans-serif",outline:'none',boxSizing:'border-box'};
const btn = (bg,color='white')=>({padding:'9px 18px',border:'none',borderRadius:8,background:bg,color,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"});

// ── 탭: 센터 관리 ────────────────────────────────────────────
function AdminCenters(){
  const {useState:useS,useEffect:useE}=React;
  const [list,setList]=useS([]);
  const [loading,setLoading]=useS(true);
  const [processing,setProcessing]=useS(null);
  const [modal,setModal]=useS(null);   // null | 'create' | {edit:center}
  const [form,setForm]=useS({});
  const [saving,setSaving]=useS(false);
  const [err,setErr]=useS('');

  const load=()=>{setLoading(true);aApi.centers().then(r=>{if(r.success)setList(r.data);}).finally(()=>setLoading(false));};
  useE(()=>load(),[]);

  const openCreate=()=>{
    setForm({logo_emoji:'🏥',name:'',description:'',address:'',specialty_tags:'',contact_email:'',contact_phone:'',commission_rate:10,status:'active'});
    setErr('');setModal('create');
  };
  const openEdit=(c)=>{
    setForm({...c,specialty_tags:Array.isArray(c.specialty_tags)?c.specialty_tags.join(', '):(typeof c.specialty_tags==='string'?JSON.parse(c.specialty_tags||'[]').join(', '):'')});
    setErr('');setModal({edit:c});
  };

  const save=async()=>{
    if(!form.name?.trim()){setErr('센터명은 필수입니다');return;}
    setSaving(true);setErr('');
    const payload={...form,
      specialty_tags:JSON.stringify((form.specialty_tags||'').split(',').map(s=>s.trim()).filter(Boolean)),
      commission_rate:Number(form.commission_rate)||10,
    };
    const r=modal==='create'
      ? await aApi.createCenter(payload)
      : await aApi.updateCenter(modal.edit.id,payload);
    setSaving(false);
    if(r.success){setModal(null);load();}else setErr(r.error||'저장 실패');
  };

  const deleteCenter=async(c)=>{
    if(!confirm(`"${c.name}" 센터를 삭제하시겠습니까?
소속 상담사가 없어야 삭제 가능합니다.`))return;
    setProcessing(c.id);
    const r=await aApi.deleteCenter(c.id);
    setProcessing(null);
    if(r.success)load();else alert(r.error||'삭제 실패');
  };

  const changeStatus=async(id,status)=>{
    const reason=status==='suspended'?prompt('정지 사유:'):'';
    setProcessing(id);
    const r=await aApi.centerStatus(id,status,reason);
    setProcessing(null);
    if(r.success)load();else alert(r.error||'오류');
  };

  const statusColor={active:'green',pending:'amber',suspended:'red'};
  const statusLabel={active:'활성',pending:'심사중',suspended:'정지'};
  const f=(k)=>(v)=>setForm(p=>({...p,[k]:typeof v==='object'?v.target.value:v}));

  return(
    <div>
      {/* 헤더 */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontSize:15,fontWeight:700}}>상담센터 ({list.length}곳)</div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={load} style={{...btn('none','#374151'),border:'1px solid rgba(0,0,0,.12)'}}>새로고침</button>
          <button onClick={openCreate} style={btn('#2D6A4F')}>+ 센터 등록</button>
        </div>
      </div>

      {loading?<div style={{textAlign:'center',padding:'32px',color:'#9A9A9A'}}>로딩 중...</div>:(
        <Table
          cols={['센터','상태','상담사','예약','수수료','등록일','관리']}
          rows={list}
          renderRow={(c,i)=>(
            <tr key={c.id} style={{borderBottom:'1px solid rgba(0,0,0,.05)',background:i%2===0?'white':'#FAFAF8'}}>
              <td style={{padding:'10px 12px'}}>
                <div style={{fontWeight:600}}>{c.logo_emoji} {c.name}</div>
                <div style={{fontSize:11,color:'#9A9A9A'}}>{c.address||'-'}</div>
                <div style={{fontSize:10,color:'#B0B0B0'}}>{c.contact_email||''}</div>
              </td>
              <td style={{padding:'10px 12px'}}><Chip label={statusLabel[c.status]||c.status} color={statusColor[c.status]||'gray'}/></td>
              <td style={{padding:'10px 12px',textAlign:'center'}}>{c.counselor_count||0}명</td>
              <td style={{padding:'10px 12px',textAlign:'center'}}>{c.appt_count||0}건</td>
              <td style={{padding:'10px 12px',textAlign:'center'}}>{c.commission_rate||10}%</td>
              <td style={{padding:'10px 12px',fontSize:11,color:'#9A9A9A'}}>{fmtDate(c.created_at)}</td>
              <td style={{padding:'10px 12px'}}>
                <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                  <button onClick={()=>openEdit(c)} style={{...btn('#EEF2FF','#5B21B6'),padding:'4px 9px',fontSize:11}}>수정</button>
                  {c.status!=='active'&&<button onClick={()=>changeStatus(c.id,'active')} disabled={processing===c.id} style={{...btn('#D8F3DC','#2D6A4F'),padding:'4px 9px',fontSize:11}}>활성화</button>}
                  {c.status==='active'&&<button onClick={()=>changeStatus(c.id,'suspended')} disabled={processing===c.id} style={{...btn('#FEF2F2','#991B1B'),padding:'4px 9px',fontSize:11}}>정지</button>}
                  <button onClick={()=>deleteCenter(c)} disabled={processing===c.id} style={{...btn('#FEF2F2','#991B1B'),padding:'4px 9px',fontSize:11}}>삭제</button>
                </div>
              </td>
            </tr>
          )}
        />
      )}

      {/* 등록/수정 모달 */}
      {modal&&(
        <Modal title={modal==='create'?'상담센터 등록':'상담센터 수정'} onClose={()=>setModal(null)}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
            <Field label="센터명" required>
              <input style={inp} value={form.name||''} onChange={f('name')} placeholder="예) 마음풀 상담센터"/>
            </Field>
            <Field label="로고 이모지">
              <input style={{...inp,width:80}} value={form.logo_emoji||''} onChange={f('logo_emoji')} placeholder="🏥"/>
            </Field>
          </div>
          <Field label="주소">
            <input style={inp} value={form.address||''} onChange={f('address')} placeholder="서울시 강남구 ..."/>
          </Field>
          <Field label="소개">
            <textarea style={{...inp,resize:'vertical',height:70}} value={form.description||''} onChange={f('description')} placeholder="센터 소개 문구"/>
          </Field>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
            <Field label="연락처 이메일">
              <input style={inp} value={form.contact_email||''} onChange={f('contact_email')} placeholder="center@example.com"/>
            </Field>
            <Field label="연락처 전화">
              <input style={inp} value={form.contact_phone||''} onChange={f('contact_phone')} placeholder="02-1234-5678"/>
            </Field>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
            <Field label="전문 분야 (쉼표 구분)">
              <input style={inp} value={form.specialty_tags||''} onChange={f('specialty_tags')} placeholder="우울, 불안, 가족상담"/>
            </Field>
            <Field label="수수료율 (%)">
              <input style={inp} type="number" value={form.commission_rate||10} onChange={f('commission_rate')} min={0} max={100}/>
            </Field>
          </div>
          <Field label="상태">
            <select style={inp} value={form.status||'active'} onChange={f('status')}>
              <option value="active">활성</option>
              <option value="pending">심사중</option>
              <option value="suspended">정지</option>
            </select>
          </Field>
          {err&&<div style={{color:'#E24B4A',fontSize:12,marginBottom:10}}>{err}</div>}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:8}}>
            <button onClick={()=>setModal(null)} style={btn('#F5F5F0','#374151')}>취소</button>
            <button onClick={save} disabled={saving} style={btn('#2D6A4F')}>{saving?'저장 중...':'저장'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── 탭: 상담사 관리 ─────────────────────────────────────────
function AdminCounselors(){
  const {useState:useS,useEffect:useE}=React;
  const [list,setList]=useS([]);
  const [centers,setCenters]=useS([]);
  const [loading,setLoading]=useS(true);
  const [processing,setProcessing]=useS(null);
  const [modal,setModal]=useS(null);       // null | 'create' | {edit:co}
  const [schedModal,setSchedModal]=useS(null); // null | counselorId
  const [form,setForm]=useS({});
  const [schedules,setSchedules]=useS([]);
  const [saving,setSaving]=useS(false);
  const [err,setErr]=useS('');

  const load=()=>{
    setLoading(true);
    Promise.all([aApi.counselors(),aApi.centers()])
      .then(([r,cr])=>{if(r.success)setList(r.data);if(cr.success)setCenters(cr.data);})
      .finally(()=>setLoading(false));
  };
  useE(()=>load(),[]);

  const DAYS=['일','월','화','수','목','금','토'];

  const openCreate=()=>{
    setForm({photo_emoji:'👤',name:'',title:'',bio:'',center_id:'',contact_email:'',
      specialties:'',available_types:'visit',fee_per_session:50000,session_minutes:50,status:'active'});
    setErr('');setModal('create');
  };
  const openEdit=(co)=>{
    setForm({...co,
      specialties:Array.isArray(co.specialties)?co.specialties.join(', '):(typeof co.specialties==='string'?JSON.parse(co.specialties||'[]').join(', '):''),
      available_types:Array.isArray(co.available_types)?co.available_types.join(','):(typeof co.available_types==='string'?JSON.parse(co.available_types||'["visit"]').join(','):'visit'),
    });
    setErr('');setModal({edit:co});
  };

  const openSchedule=async(co)=>{
    setSchedModal(co.id);
    const r=await aApi.getSchedules(co.id);
    if(r.success){
      // 7요일 초기화 후 기존 데이터 덮어쓰기
      const sched=Array.from({length:7},(_,i)=>({day_of_week:i,start_time:'09:00',end_time:'18:00',slot_minutes:50,enabled:false}));
      (r.data||[]).forEach(d=>{ sched[d.day_of_week]={...sched[d.day_of_week],...d,enabled:true}; });
      setSchedules(sched);
    }
  };

  const save=async()=>{
    if(!form.name?.trim()||!form.center_id){setErr('이름과 소속 센터는 필수입니다');return;}
    setSaving(true);setErr('');
    const payload={...form,
      center_id:Number(form.center_id),
      fee_per_session:Number(form.fee_per_session)||50000,
      session_minutes:Number(form.session_minutes)||50,
      specialties:JSON.stringify((form.specialties||'').split(',').map(s=>s.trim()).filter(Boolean)),
      available_types:JSON.stringify((form.available_types||'visit').split(',').map(s=>s.trim()).filter(Boolean)),
    };
    const r=modal==='create'
      ? await aApi.createCounselor(payload)
      : await aApi.updateCounselor(modal.edit.id,payload);
    setSaving(false);
    if(r.success){setModal(null);load();}else setErr(r.error||'저장 실패');
  };

  const saveSchedule=async()=>{
    const enabled=schedules.filter(s=>s.enabled);
    setSaving(true);
    const r=await aApi.saveSchedules(schedModal,enabled);
    setSaving(false);
    if(r.success){setSchedModal(null);}else alert(r.error||'스케줄 저장 실패');
  };

  const deleteCounselor=async(co)=>{
    if(!confirm(`"${co.name}" 상담사를 삭제하시겠습니까?
진행 중인 예약이 없어야 삭제 가능합니다.`))return;
    setProcessing(co.id);
    const r=await aApi.deleteCounselor(co.id);
    setProcessing(null);
    if(r.success)load();else alert(r.error||'삭제 실패');
  };

  const toggleStatus=async(co)=>{
    const r=await aApi.updateCounselor(co.id,{status:co.status==='active'?'inactive':'active'});
    if(r.success)load();else alert(r.error||'오류');
  };

  const f=(k)=>(v)=>setForm(p=>({...p,[k]:typeof v==='object'?v.target.value:v}));
  const fs=(i,k)=>(v)=>setSchedules(prev=>{const n=[...prev];n[i]={...n[i],[k]:typeof v==='object'?v.target.value:v};return n;});

  return(
    <div>
      {/* 헤더 */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontSize:15,fontWeight:700}}>상담사 ({list.length}명)</div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={load} style={{...btn('none','#374151'),border:'1px solid rgba(0,0,0,.12)'}}>새로고침</button>
          <button onClick={openCreate} style={btn('#5B21B6')}>+ 상담사 등록</button>
        </div>
      </div>

      {loading?<div style={{textAlign:'center',padding:'32px',color:'#9A9A9A'}}>로딩 중...</div>:(
        <Table
          cols={['상담사','센터','요금/시간','누적 상담','상태','관리']}
          rows={list}
          renderRow={(co,i)=>(
            <tr key={co.id} style={{borderBottom:'1px solid rgba(0,0,0,.05)',background:i%2===0?'white':'#FAFAF8'}}>
              <td style={{padding:'10px 12px'}}>
                <div style={{fontWeight:600}}>{co.photo_emoji} {co.name}</div>
                <div style={{fontSize:11,color:'#9A9A9A'}}>{co.title}</div>
                <div style={{display:'flex',alignItems:'center',gap:4,marginTop:2}}>
                  <span style={{fontSize:11,color:'#F59E0B'}}>★</span>
                  <span style={{fontSize:11,fontWeight:600}}>{parseFloat(co.avg_rating||0).toFixed(1)}</span>
                  <span style={{fontSize:10,color:'#9A9A9A'}}>({co.review_count||0})</span>
                </div>
              </td>
              <td style={{padding:'10px 12px',fontSize:12}}>
                <div>{co.center_name}</div>
                <Chip label={co.center_status==='active'?'활성':'비활성'} color={co.center_status==='active'?'green':'gray'}/>
              </td>
              <td style={{padding:'10px 12px'}}>
                <div style={{fontWeight:600}}>{(co.fee_per_session||0).toLocaleString('ko-KR')}원</div>
                <div style={{fontSize:11,color:'#9A9A9A'}}>{co.session_minutes}분</div>
              </td>
              <td style={{padding:'10px 12px',textAlign:'center'}}>{co.total_appts||0}건</td>
              <td style={{padding:'10px 12px'}}>
                <Chip label={co.status==='active'?'활성':'비활성'} color={co.status==='active'?'green':'red'}/>
              </td>
              <td style={{padding:'10px 12px'}}>
                <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                  <button onClick={()=>openEdit(co)} style={{...btn('#EEF2FF','#5B21B6'),padding:'4px 9px',fontSize:11}}>수정</button>
                  <button onClick={()=>openSchedule(co)} style={{...btn('#F0FDF4','#2D6A4F'),padding:'4px 9px',fontSize:11}}>스케줄</button>
                  <button onClick={()=>toggleStatus(co)} style={{...btn(co.status==='active'?'#FEF2F2':'#D8F3DC',co.status==='active'?'#991B1B':'#2D6A4F'),padding:'4px 9px',fontSize:11}}>
                    {co.status==='active'?'비활성':'활성화'}
                  </button>
                  <button onClick={()=>deleteCounselor(co)} disabled={processing===co.id} style={{...btn('#FEF2F2','#991B1B'),padding:'4px 9px',fontSize:11}}>삭제</button>
                </div>
              </td>
            </tr>
          )}
        />
      )}

      {/* 상담사 등록/수정 모달 */}
      {modal&&(
        <Modal title={modal==='create'?'상담사 등록':'상담사 정보 수정'} onClose={()=>setModal(null)} width={600}>
          <div style={{display:'grid',gridTemplateColumns:'80px 1fr',gap:'0 16px'}}>
            <Field label="이모지">
              <input style={{...inp,width:72}} value={form.photo_emoji||''} onChange={f('photo_emoji')} placeholder="👤"/>
            </Field>
            <Field label="이름" required>
              <input style={inp} value={form.name||''} onChange={f('name')} placeholder="홍길동"/>
            </Field>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
            <Field label="소속 센터" required>
              <select style={inp} value={form.center_id||''} onChange={f('center_id')}>
                <option value="">센터 선택</option>
                {centers.filter(c=>c.status==='active').map(c=>(
                  <option key={c.id} value={c.id}>{c.logo_emoji} {c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="직함/자격">
              <input style={inp} value={form.title||''} onChange={f('title')} placeholder="임상심리사 1급"/>
            </Field>
          </div>
          <Field label="소개">
            <textarea style={{...inp,resize:'vertical',height:75}} value={form.bio||''} onChange={f('bio')} placeholder="상담사 소개 문구"/>
          </Field>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
            <Field label="전문 분야 (쉼표 구분)">
              <input style={inp} value={form.specialties||''} onChange={f('specialties')} placeholder="우울, 불안, 가족"/>
            </Field>
            <Field label="상담 방식">
              <select style={inp} value={form.available_types||'visit'} onChange={f('available_types')}>
                <option value="visit">방문</option>
                <option value="video">화상</option>
                <option value="phone">전화</option>
                <option value="visit,video">방문+화상</option>
                <option value="visit,video,phone">모두</option>
              </select>
            </Field>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0 12px'}}>
            <Field label="회기 요금 (원)" required>
              <input style={inp} type="number" value={form.fee_per_session||50000} onChange={f('fee_per_session')} min={10000} step={5000}/>
            </Field>
            <Field label="회기 시간 (분)">
              <input style={inp} type="number" value={form.session_minutes||50} onChange={f('session_minutes')} min={20} step={5}/>
            </Field>
            <Field label="상태">
              <select style={inp} value={form.status||'active'} onChange={f('status')}>
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
              </select>
            </Field>
          </div>
          <Field label="연락처 이메일">
            <input style={inp} value={form.contact_email||''} onChange={f('contact_email')} placeholder="counselor@example.com"/>
          </Field>
          {err&&<div style={{color:'#E24B4A',fontSize:12,marginBottom:10}}>{err}</div>}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:8}}>
            <button onClick={()=>setModal(null)} style={btn('#F5F5F0','#374151')}>취소</button>
            <button onClick={save} disabled={saving} style={btn('#5B21B6')}>{saving?'저장 중...':'저장'}</button>
          </div>
        </Modal>
      )}

      {/* 스케줄 관리 모달 */}
      {schedModal&&(
        <Modal title="운영 스케줄 설정" onClose={()=>setSchedModal(null)} width={480}>
          <div style={{fontSize:12,color:'#9A9A9A',marginBottom:12}}>요일별 운영 시간을 설정합니다. 체크된 요일만 저장됩니다.</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {schedules.map((s,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',background:s.enabled?'#F0FDF4':'#FAFAF8',borderRadius:8,border:`1px solid ${s.enabled?'#86EFAC':'rgba(0,0,0,.08)'}`}}>
                <input type="checkbox" checked={s.enabled} onChange={e=>fs(i,'enabled')(e.target.checked)} style={{width:16,height:16,cursor:'pointer'}}/>
                <span style={{width:22,fontWeight:700,fontSize:13,color:s.enabled?'#2D6A4F':'#9A9A9A'}}>{DAYS[i]}</span>
                <input type="time" value={s.start_time||'09:00'} onChange={fs(i,'start_time')} disabled={!s.enabled}
                  style={{...inp,width:100,padding:'5px 8px',opacity:s.enabled?1:0.4}}/>
                <span style={{color:'#9A9A9A',fontSize:12}}>~</span>
                <input type="time" value={s.end_time||'18:00'} onChange={fs(i,'end_time')} disabled={!s.enabled}
                  style={{...inp,width:100,padding:'5px 8px',opacity:s.enabled?1:0.4}}/>
                <select value={s.slot_minutes||50} onChange={fs(i,'slot_minutes')} disabled={!s.enabled}
                  style={{...inp,width:80,padding:'5px 8px',opacity:s.enabled?1:0.4}}>
                  {[30,40,50,60,90,120].map(m=><option key={m} value={m}>{m}분</option>)}
                </select>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}>
            <button onClick={()=>setSchedModal(null)} style={btn('#F5F5F0','#374151')}>취소</button>
            <button onClick={saveSchedule} disabled={saving} style={btn('#2D6A4F')}>{saving?'저장 중...':'스케줄 저장'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── 탭: 예약 관리 ────────────────────────────────────────────
function AdminAppointments(){
  const {useState:useS,useEffect:useE}=React;
  const [list,setList]=useS([]);
  const [loading,setLoading]=useS(true);
  const [filter,setFilter]=useS('');
  const [processing,setProcessing]=useS(null);
  const [noteModal,setNoteModal]=useS(null);
  const [noteSaving,setNoteSaving]=useS(false);

  const load=()=>{setLoading(true);aApi.appointments(filter).then(r=>{if(r.success)setList(r.data);}).finally(()=>setLoading(false));};
  useE(()=>load(),[filter]);

  const complete=async(id)=>{
    if(!confirm('이 예약을 완료 처리하시겠습니까? 수입이 기록됩니다.'))return;
    setProcessing(id);
    const r=await aApi.completeAppt(id);
    setProcessing(null);
    if(r.success){alert(`완료 처리되었습니다.\n지급액: ${fmtW(r.data.net_amount)}`);load();}else alert(r.error||'오류');
  };

  const saveNote=async()=>{
    if(!noteModal)return;
    setNoteSaving(true);
    try{
      const r=await fetch(`/api/admin/counseling/appointments/${noteModal.id}/note`,{
        method:'PATCH',headers:aApi._h(),body:JSON.stringify({counselor_note:noteModal.note})
      });
      const d=await r.json();
      if(d.success){setNoteModal(null);load();}else alert(d.error||'저장 실패');
    }catch{alert('네트워크 오류');}
    setNoteSaving(false);
  };

  const statusColor={pending:'amber',confirmed:'blue',completed:'green',cancelled:'red',no_show:'gray'};
  const statusLabel={pending:'결제대기',confirmed:'확정',completed:'완료',cancelled:'취소',no_show:'노쇼'};
  const typeIcon={video:'📹',phone:'📞',visit:'🏢'};

  const filters=[['','전체'],['confirmed','확정'],['completed','완료'],['pending','대기'],['cancelled','취소']];

  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div style={{fontSize:15,fontWeight:700}}>예약 관리</div>
        <div style={{display:'flex',gap:5}}>
          {filters.map(([v,l])=>(
            <button key={v} onClick={()=>setFilter(v)} style={{padding:'6px 12px',borderRadius:7,border:'1px solid',borderColor:filter===v?'#2D6A4F':'rgba(0,0,0,.10)',background:filter===v?'#D8F3DC':'white',color:filter===v?'#2D6A4F':'#5A5A5A',fontSize:12,fontWeight:filter===v?700:400,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>{l}</button>
          ))}
          <button onClick={load} style={{background:'none',border:'1px solid rgba(0,0,0,.12)',borderRadius:7,padding:'6px 12px',fontSize:12,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>↻</button>
        </div>
      </div>
      {loading?<div style={{textAlign:'center',padding:'32px',color:'#9A9A9A'}}>로딩 중...</div>:(
        <Table
          cols={['예약ID','내담자','상담사','센터','일시','유형','금액','상태','액션']}
          rows={list}
          renderRow={(a,i)=>(
            <tr key={a.id} style={{borderBottom:'1px solid rgba(0,0,0,.05)',background:i%2===0?'white':'#FAFAF8'}}>
              <td style={{padding:'8px 10px',fontSize:11,color:'#9A9A9A'}}>#{a.id}</td>
              <td style={{padding:'8px 10px'}}>
                <div style={{fontSize:12,fontWeight:600}}>{a.user_nickname||a.user_email?.split('@')[0]}</div>
                <div style={{fontSize:10,color:'#9A9A9A'}}>{a.user_email}</div>
              </td>
              <td style={{padding:'8px 10px'}}><div style={{fontSize:12,fontWeight:600}}>{a.photo_emoji} {a.counselor_name}</div></td>
              <td style={{padding:'8px 10px',fontSize:11,color:'#5A5A5A'}}>{a.center_name}</td>
              <td style={{padding:'8px 10px',fontSize:11,whiteSpace:'nowrap'}}>{fmtDtAdmin(a.scheduled_at)}</td>
              <td style={{padding:'8px 10px',fontSize:12}}>{typeIcon[a.session_type]}</td>
              <td style={{padding:'8px 10px',fontWeight:600,fontSize:12,color:'#2D6A4F'}}>{fmtW(a.fee_amount)}</td>
              <td style={{padding:'8px 10px'}}><Chip label={statusLabel[a.status]||a.status} color={statusColor[a.status]||'gray'}/></td>
              <td style={{padding:'8px 10px'}}>
                <div style={{display:'flex',flexDirection:'column',gap:4,alignItems:'flex-end'}}>
                {a.status==='confirmed'&&(
                  <button onClick={()=>complete(a.id)} disabled={processing===a.id} style={{padding:'5px 9px',borderRadius:5,border:'none',background:'#EEF0FF',color:'#5B21B6',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>완료처리</button>
                )}
                {a.video_room_id&&a.status==='confirmed'&&(
                  <button onClick={()=>window.open(`https://meet.jit.si/${a.video_room_id}`,'_blank')} style={{padding:'5px 9px',borderRadius:5,border:'none',background:'#D8F3DC',color:'#2D6A4F',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>📹 화상 입장</button>
                )}
                {a.video_room_id&&<div style={{fontSize:10,color:'#9A9A9A'}}>룸: {a.video_room_id.slice(-8)}</div>}
                {a.status==='confirmed'&&(
                  <button onClick={()=>setNoteModal({id:a.id,note:a.counselor_note||''})}
                    style={{padding:'5px 9px',borderRadius:5,border:'1px solid rgba(0,0,0,.1)',background:'white',color:'#5A5A5A',fontSize:11,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>
                    📝 {a.counselor_note?'노트 수정':'노트 추가'}
                  </button>
                )}
              </div>
              </td>
            </tr>
          )}
        />
      )}

      {noteModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:3000,padding:16}} onClick={e=>{if(e.target===e.currentTarget)setNoteModal(null);}}>
          <div style={{background:'white',borderRadius:16,padding:'24px',width:'100%',maxWidth:440,boxShadow:'0 16px 48px rgba(0,0,0,.18)'}}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:14}}>📝 상담사 노트 · 예약 #{noteModal.id}</div>
            <textarea value={noteModal.note} onChange={e=>setNoteModal(p=>({...p,note:e.target.value}))}
              placeholder="상담 내용, 특이사항, 다음 회기 계획 등을 기록하세요." rows={5}
              style={{width:'100%',padding:'10px 12px',border:'1px solid rgba(0,0,0,.12)',borderRadius:10,fontSize:13,fontFamily:"'Noto Sans KR',sans-serif",outline:'none',resize:'none',lineHeight:1.65,marginBottom:14}}/>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setNoteModal(null)} style={{flex:1,padding:'10px',background:'rgba(0,0,0,.07)',color:'#5A5A5A',border:'none',borderRadius:9,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>취소</button>
              <button onClick={saveNote} disabled={noteSaving} style={{flex:2,padding:'10px',background:'#2D6A4F',color:'white',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>{noteSaving?'저장 중...':'노트 저장'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 탭: 정산 관리 ────────────────────────────────────────────
function AdminSettlements(){
  const {useState:useS,useEffect:useE}=React;
  const [list,setList]=useS([]);
  const [centers,setCenters]=useS([]);
  const [loading,setLoading]=useS(true);
  const [creating,setCreating]=useS(false);
  const [form,setForm]=useS({center_id:'',period_start:'',period_end:''});
  const [processing,setProcessing]=useS(null);

  const load=()=>{
    setLoading(true);
    Promise.all([aApi.settlements(),aApi.centers()])
      .then(([s,c])=>{if(s.success)setList(s.data);if(c.success)setCenters(c.data.filter(cc=>cc.status==='active'));})
      .finally(()=>setLoading(false));
  };
  useE(()=>load(),[]);

  const create=async()=>{
    if(!form.center_id||!form.period_start||!form.period_end){alert('모든 항목 필요');return;}
    const r=await aApi.createSettlement(form);
    if(r.success){alert(`정산 생성 완료\n예약 ${r.data.appt_count}건 · 지급액 ${fmtW(r.data.payout_amt)}`);setCreating(false);setForm({center_id:'',period_start:'',period_end:''});load();}
    else alert(r.error||'오류');
  };

  const process=async(id)=>{
    const note=prompt('처리 메모 (선택):');
    setProcessing(id);
    const r=await aApi.processSettlement(id,note||'');
    setProcessing(null);
    if(r.success)load(); else alert(r.error||'오류');
  };

  const statusColor={pending:'amber',processing:'blue',completed:'green',failed:'red'};
  const statusLabel={pending:'정산 대기',processing:'처리 중',completed:'완료',failed:'실패'};

  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontSize:15,fontWeight:700}}>정산 관리</div>
        <button onClick={()=>setCreating(v=>!v)} style={{background:'#2D6A4F',color:'white',border:'none',borderRadius:8,padding:'8px 16px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>+ 정산 생성</button>
      </div>

      {creating&&(
        <div style={{background:'white',border:'1px solid rgba(0,0,0,.08)',borderRadius:12,padding:'20px',marginBottom:20}}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:14}}>새 정산 생성</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr auto',gap:10,alignItems:'end'}}>
            <div>
              <div style={{fontSize:12,color:'#9A9A9A',marginBottom:5}}>센터 선택</div>
              <select value={form.center_id} onChange={e=>setForm(f=>({...f,center_id:e.target.value}))}
                style={{width:'100%',padding:'9px 10px',border:'1px solid rgba(0,0,0,.12)',borderRadius:7,fontSize:13,fontFamily:"'Noto Sans KR',sans-serif",outline:'none'}}>
                <option value="">선택</option>
                {centers.map(c=><option key={c.id} value={c.id}>{c.logo_emoji} {c.name}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:12,color:'#9A9A9A',marginBottom:5}}>기간 시작</div>
              <input type="date" value={form.period_start} onChange={e=>setForm(f=>({...f,period_start:e.target.value}))} style={{width:'100%',padding:'8px 10px',border:'1px solid rgba(0,0,0,.12)',borderRadius:7,fontSize:13,outline:'none'}}/>
            </div>
            <div>
              <div style={{fontSize:12,color:'#9A9A9A',marginBottom:5}}>기간 종료</div>
              <input type="date" value={form.period_end} onChange={e=>setForm(f=>({...f,period_end:e.target.value}))} style={{width:'100%',padding:'8px 10px',border:'1px solid rgba(0,0,0,.12)',borderRadius:7,fontSize:13,outline:'none'}}/>
            </div>
            <button onClick={create} style={{padding:'9px 18px',background:'#2D6A4F',color:'white',border:'none',borderRadius:7,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif",whiteSpace:'nowrap'}}>생성</button>
          </div>
          <div style={{fontSize:11,color:'#9A9A9A',marginTop:8}}>완료 처리된 예약만 집계됩니다</div>
        </div>
      )}

      {loading?<div style={{textAlign:'center',padding:'32px',color:'#9A9A9A'}}>로딩 중...</div>:(
        <Table
          cols={['센터','정산 기간','예약수','총매출','수수료','지급액','상태','액션']}
          rows={list}
          renderRow={(s,i)=>(
            <tr key={s.id} style={{borderBottom:'1px solid rgba(0,0,0,.05)',background:i%2===0?'white':'#FAFAF8'}}>
              <td style={{padding:'10px 12px',fontWeight:600}}>{s.logo_emoji} {s.center_name}</td>
              <td style={{padding:'10px 12px',fontSize:12,whiteSpace:'nowrap'}}>{fmtDate(s.period_start)} ~ {fmtDate(s.period_end)}</td>
              <td style={{padding:'10px 12px',textAlign:'center'}}>{s.appt_count}건</td>
              <td style={{padding:'10px 12px',fontWeight:600}}>{fmtW(s.total_revenue)}</td>
              <td style={{padding:'10px 12px',color:'#E24B4A'}}>{fmtW(s.commission_amt)}</td>
              <td style={{padding:'10px 12px',fontWeight:700,color:'#2D6A4F'}}>{fmtW(s.payout_amt)}</td>
              <td style={{padding:'10px 12px'}}><Chip label={statusLabel[s.status]||s.status} color={statusColor[s.status]||'gray'}/></td>
              <td style={{padding:'10px 12px'}}>
                {s.status==='pending'&&(
                  <button onClick={()=>process(s.id)} disabled={processing===s.id} style={{padding:'5px 10px',borderRadius:5,border:'none',background:'#EEF0FF',color:'#5B21B6',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>지급 완료</button>
                )}
                {s.processed_at&&<div style={{fontSize:10,color:'#9A9A9A',marginTop:2}}>{fmtDtAdmin(s.processed_at)}</div>}
              </td>
            </tr>
          )}
        />
      )}
    </div>
  );
}

// ── 탭: 리뷰 관리 ───────────────────────────────────────────
function AdminReviews(){
  const {useState:useS,useEffect:useE}=React;
  const [reviews,setReviews]=useS([]);
  const [page,setPage]=useS(1);
  const [total,setTotal]=useS(0);
  const [loading,setLoading]=useS(true);
  const [toggling,setToggling]=useS(null);

  const load=(p)=>{
    setLoading(true);
    aApi.reviews(p).then(r=>{if(r.success){setReviews(r.data||[]);setTotal(r.total||0);}}).finally(()=>setLoading(false));
  };
  useE(()=>load(1),[]);

  const handleToggle=async(id,hidden)=>{
    setToggling(id);
    await aApi.toggleReview(id,hidden);
    setToggling(null);
    load(page);
  };

  const Stars=({r})=><span style={{color:'#F59E0B',fontSize:12}}>{Array.from({length:5},(_,i)=>i<Math.round(r)?'★':'☆').join('')}</span>;
  const totalPages=Math.ceil(total/20)||1;

  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontSize:15,fontWeight:700}}>⭐ 리뷰 관리 (총 {total}건)</div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>{setPage(1);load(1);}} style={{padding:'7px 14px',borderRadius:8,border:'none',background:'#2D6A4F',color:'white',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>새로고침</button>
        </div>
      </div>
      {loading?<div style={{textAlign:'center',padding:'32px',color:'#9A9A9A'}}>로딩 중...</div>:(
        <>
          <Table
            cols={['#','상담사','작성자','별점','내용','등록일','숨김']}
            rows={reviews}
            renderRow={(r,i)=>(
              <tr key={r.id} style={{borderBottom:'1px solid rgba(0,0,0,.05)',background:r.admin_hidden?'#FEF2F2':i%2===0?'white':'#FAFAF8',opacity:r.admin_hidden?.65:1}}>
                <td style={{padding:'10px 12px',color:'#9A9A9A',fontSize:12}}>{(page-1)*20+i+1}</td>
                <td style={{padding:'10px 12px',fontWeight:600,fontSize:13}}>{r.counselor_name}</td>
                <td style={{padding:'10px 12px',fontSize:13,color:'#5A5A5A'}}>{r.reviewer_name}</td>
                <td style={{padding:'10px 12px',whiteSpace:'nowrap'}}><Stars r={r.rating}/><span style={{fontSize:11,marginLeft:3}}>{r.rating}점</span></td>
                <td style={{padding:'10px 12px',fontSize:12,color:'#5A5A5A',maxWidth:240,wordBreak:'break-word'}}>{r.content||<span style={{color:'#C0C0C0'}}>내용 없음</span>}</td>
                <td style={{padding:'10px 12px',fontSize:11,color:'#9A9A9A',whiteSpace:'nowrap'}}>{fmtDate(r.created_at)}</td>
                <td style={{padding:'10px 12px'}}>
                  <button onClick={()=>handleToggle(r.id,!r.admin_hidden)} disabled={toggling===r.id}
                    style={{padding:'5px 10px',borderRadius:6,border:'none',background:r.admin_hidden?'#D8F3DC':'#FEF2F2',color:r.admin_hidden?'#2D6A4F':'#991B1B',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>
                    {toggling===r.id?'...':(r.admin_hidden?'공개':'숨김')}
                  </button>
                </td>
              </tr>
            )}
          />
          <div style={{display:'flex',justifyContent:'center',gap:6,marginTop:20}}>
            <button onClick={()=>{const p=Math.max(1,page-1);setPage(p);load(p);}} disabled={page===1}
              style={{padding:'6px 12px',borderRadius:7,border:'1px solid rgba(0,0,0,.12)',background:page===1?'#F5F5F0':'white',color:page===1?'#C0C0C0':'#1A1A1A',cursor:page===1?'default':'pointer',fontSize:12,fontFamily:"'Noto Sans KR',sans-serif"}}>← 이전</button>
            <span style={{padding:'6px 12px',fontSize:12,color:'#5A5A5A'}}>{page} / {totalPages}</span>
            <button onClick={()=>{const p=Math.min(totalPages,page+1);setPage(p);load(p);}} disabled={page===totalPages}
              style={{padding:'6px 12px',borderRadius:7,border:'1px solid rgba(0,0,0,.12)',background:page===totalPages?'#F5F5F0':'white',color:page===totalPages?'#C0C0C0':'#1A1A1A',cursor:page===totalPages?'default':'pointer',fontSize:12,fontFamily:"'Noto Sans KR',sans-serif"}}>다음 →</button>
          </div>
        </>
      )}
    </div>
  );
}

// ── 탭: 파트너 채널 관리 ─────────────────────────────────────
function AdminPartners(){
  const {useState:useS,useEffect:useE}=React;
  const [partners,setPartners]=useS([]);
  const [loading,setLoading]=useS(true);
  const [selected,setSelected]=useS(null);   // 선택된 파트너 코드
  const [stats,setStats]=useS(null);
  const [settlement,setSettlement]=useS(null);
  const [statsMonth,setStatsMonth]=useS(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;});
  const [showCreate,setShowCreate]=useS(false);
  const [form,setForm]=useS({code:'',name:'',sso_secret:'',revenue_share_rate:'0',welcome_message:'',featured_tests:'',primary_color:'#2D6A4F',contact_email:'',commission_start:'',commission_end:''});
  const [saving,setSaving]=useS(false);
  const [msg,setMsg]=useS('');
  // 정산 원장(제휴코드별 상세 + CSV 다운로드)
  const [ledger,setLedger]=useS(null);
  const iso=(d)=>d.toISOString().slice(0,10);
  const [ledgerFrom,setLedgerFrom]=useS(()=>iso(new Date(Date.now()-30*86400000)));
  const [ledgerTo,setLedgerTo]=useS(()=>iso(new Date()));
  const loadLedger=async(code)=>{ const r=await aApi.partnerCommissions(code||selected,ledgerFrom,ledgerTo); if(r.success)setLedger(r.data); };
  const downloadCsv=()=>{
    if(!ledger||!(ledger.rows||[]).length)return;
    const hdr=['결제ID','일시','회원(마스킹)','상품','결제액','쉐어율','쉐어액','통화','상태'];
    const esc=(v)=>{const s=String(v==null?'':v);return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
    const lines=(ledger.rows||[]).map(r=>[r.charge_id,r.created_at,r.user_email_masked,r.package_key||'',r.charge_amount,r.rate,r.share_amount,r.currency,r.status].map(esc).join(','));
    const csv='﻿'+[hdr.join(','),...lines].join('\n');   // BOM=엑셀 한글 깨짐 방지
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`정산_${selected}_${ledgerFrom}_${ledgerTo}.csv`;a.click();URL.revokeObjectURL(a.href);
  };
  const markSettled=async()=>{
    if(!confirm(`${selected} · ${ledgerFrom}~${ledgerTo}\n이 기간의 미정산 건을 '정산완료'로 표시할까요? (실제 지급은 별도)`))return;
    const ref=prompt('정산 참조(선택, 예: 2026-07 이체)','')||undefined;
    const r=await aApi.settlePartner({code:selected,from:ledgerFrom,to:ledgerTo,ref});
    if(r.success){alert(`${r.settled}건 정산완료 처리`);loadLedger(selected);}
  };

  useE(()=>{ aApi.partners().then(r=>{ if(r.success)setPartners(r.data||[]); }).finally(()=>setLoading(false)); },[]);

  const loadStats=async(code)=>{
    const [from,to]=[`${statsMonth}-01`, new Date(new Date(statsMonth+'-01').getFullYear(), new Date(statsMonth+'-01').getMonth()+1, 0).toISOString().slice(0,10)];
    const [s,se]=await Promise.all([aApi.partnerStats(code,from,to),aApi.partnerSettlement(code,statsMonth)]);
    if(s.success)setStats(s.data);
    if(se.success)setSettlement(se.data);
  };

  const handleSelect=async(code)=>{
    setSelected(code); setStats(null); setSettlement(null);
    await loadStats(code);
  };

  const handleCreate=async()=>{
    setSaving(true);setMsg('');
    const body={...form, revenue_share_rate:Number(form.revenue_share_rate)};
    const r=await aApi.createPartner(body);
    setSaving(false);
    if(r.success){setMsg('파트너 등록 완료');setShowCreate(false);setForm({code:'',name:'',sso_secret:'',revenue_share_rate:'0',welcome_message:'',featured_tests:'',primary_color:'#2D6A4F',contact_email:'',commission_start:'',commission_end:''});aApi.partners().then(r2=>{if(r2.success)setPartners(r2.data||[]);});}
    else setMsg(r.error||'등록 실패');
  };

  const handleToggleActive=async(code,current)=>{
    await aApi.updatePartner(code,{is_active:current?0:1});
    aApi.partners().then(r=>{if(r.success)setPartners(r.data||[]);});
  };

  if(loading)return React.createElement('div',{style:{padding:32,textAlign:'center',color:'#9A9A9A'}},'로딩 중...');

  const selPartner=partners.find(p=>p.code===selected);

  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontSize:15,fontWeight:700}}>🤝 파트너 채널 관리 ({partners.length}개)</div>
        <button onClick={()=>setShowCreate(s=>!s)} style={{padding:'8px 16px',background:'#2D6A4F',color:'white',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',fontSize:13}}>
          {showCreate?'✕ 닫기':'+ 파트너 등록'}
        </button>
      </div>

      {msg&&<div style={{padding:'10px 16px',borderRadius:8,marginBottom:12,background:msg.includes('완료')?'#D8F3DC':'#FEF2F2',color:msg.includes('완료')?'#1A6B3C':'#991B1B',fontSize:13}}>{msg}</div>}

      {showCreate&&(
        <div style={{background:'white',border:'1px solid rgba(0,0,0,.08)',borderRadius:12,padding:20,marginBottom:16}}>
          <div style={{fontWeight:700,marginBottom:12,fontSize:14}}>신규 파트너 등록</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {[['code','파트너 코드 (영문대문자, 예: KAKAO_HEALTH)'],['name','파트너명'],['sso_secret','SSO 시크릿 (없으면 SSO 미지원)'],['revenue_share_rate','수익쉐어율 (0~1, 예: 0.3 · 언제든 변경 가능)'],['commission_start','정산 귀속 시작일 (선택, 예: 2026-07-01 · 비우면 무기한)'],['commission_end','정산 귀속 종료일 (선택)'],['welcome_message','환영 메시지'],['featured_tests','추천 검사 (쉼표구분, 예: PHQ9,BURNOUT)'],['primary_color','브랜드 색상'],['contact_email','정산 담당자 이메일']].map(([k,label])=>(
              <div key={k} style={{gridColumn:['welcome_message','featured_tests','sso_secret'].includes(k)?'1 / -1':'auto'}}>
                <div style={{fontSize:11,color:'#666',marginBottom:4}}>{label}</div>
                <input value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
                  style={{width:'100%',padding:'8px 10px',border:'1px solid #E0E0E0',borderRadius:6,fontSize:13,boxSizing:'border-box'}} />
              </div>
            ))}
          </div>
          <div style={{marginTop:12,display:'flex',gap:8}}>
            <button onClick={handleCreate} disabled={saving||!form.code||!form.name}
              style={{padding:'9px 20px',background:'#2D6A4F',color:'white',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:(saving||!form.code||!form.name)?0.5:1}}>
              {saving?'등록 중...':'등록하기'}
            </button>
          </div>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:16,alignItems:'start'}}>
        {/* 파트너 목록 */}
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {partners.length===0&&<div style={{padding:24,textAlign:'center',color:'#9A9A9A',background:'white',borderRadius:12,border:'1px solid rgba(0,0,0,.08)'}}>등록된 파트너가 없습니다</div>}
          {partners.map(p=>(
            <div key={p.code} onClick={()=>handleSelect(p.code)}
              style={{background:'white',border:`2px solid ${selected===p.code?'#2D6A4F':'rgba(0,0,0,.08)'}`,borderRadius:12,padding:'14px 16px',cursor:'pointer',transition:'border-color .15s'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                <div style={{fontWeight:700,fontSize:13}}>{p.name}</div>
                <Chip label={p.is_active?'활성':'비활성'} color={p.is_active?'green':'gray'}/>
              </div>
              <div style={{fontSize:11,color:'#888',marginBottom:4}}>코드: {p.code}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:4}}>
                <div style={{fontSize:11,color:'#555'}}><span style={{color:'#9A9A9A'}}>유입 </span>{(p.total_users||0).toLocaleString()}명</div>
                <div style={{fontSize:11,color:'#555'}}><span style={{color:'#9A9A9A'}}>결제 </span>{(p.total_charges||0).toLocaleString()}건</div>
                <div style={{fontSize:11,color:'#555'}}><span style={{color:'#9A9A9A'}}>매출 </span>{fmtW(p.total_revenue)}</div>
              </div>
              <div style={{marginTop:8}}>
                <button onClick={e=>{e.stopPropagation();handleToggleActive(p.code,p.is_active);}}
                  style={{fontSize:11,padding:'3px 10px',border:'1px solid #E0E0E0',borderRadius:6,background:'white',cursor:'pointer',color:'#5A5A5A'}}>
                  {p.is_active?'비활성화':'활성화'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 파트너 상세 통계 */}
        {selected&&selPartner?(
          <div style={{background:'white',border:'1px solid rgba(0,0,0,.08)',borderRadius:12,padding:20}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>{selPartner.name}</div>
            <div style={{fontSize:12,color:'#888',marginBottom:16}}>코드: {selected} · 수익쉐어율: {((selPartner.revenue_share_rate||0)*100).toFixed(0)}%</div>

            <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:16}}>
              <input type="month" value={statsMonth} onChange={e=>setStatsMonth(e.target.value)}
                style={{padding:'6px 10px',border:'1px solid #E0E0E0',borderRadius:6,fontSize:13}}/>
              <button onClick={()=>loadStats(selected)}
                style={{padding:'7px 14px',background:'#2D6A4F',color:'white',border:'none',borderRadius:8,fontSize:13,cursor:'pointer'}}>
                조회
              </button>
            </div>

            {stats&&(
              <div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
                  {[
                    {label:'기간 신규유입',value:`${(stats.users?.period||0).toLocaleString()}명`,sub:`누적 ${(stats.users?.total||0).toLocaleString()}명`},
                    {label:'기간 결제',value:`${(stats.charges?.total_charges||0).toLocaleString()}건`,sub:`기간 매출 ${fmtW(stats.charges?.period_revenue)}`},
                    {label:'마음풀 직접결제 매출',value:fmtW(stats.charges?.period_revenue),sub:'파트너 경유 결제만'},
                    {label:'정산 예정액',value:fmtW(stats.settlement?.share_amount),sub:`${((selPartner.revenue_share_rate||0)*100).toFixed(0)}% 쉐어`},
                  ].map(({label,value,sub})=>(
                    <div key={label} style={{background:'#F8F8F5',borderRadius:10,padding:'12px 14px'}}>
                      <div style={{fontSize:11,color:'#888',marginBottom:4}}>{label}</div>
                      <div style={{fontSize:17,fontWeight:700,color:'#2D2D2D'}}>{value}</div>
                      {sub&&<div style={{fontSize:11,color:'#9A9A9A',marginTop:2}}>{sub}</div>}
                    </div>
                  ))}
                </div>

                {/* 일별 유입 차트 */}
                {(stats.daily?.signups||[]).length>0&&(
                  <div style={{marginBottom:16}}>
                    <div style={{fontSize:12,fontWeight:600,marginBottom:8,color:'#5A5A5A'}}>일별 유입 가입자</div>
                    <div style={{display:'flex',gap:4,alignItems:'flex-end',height:60}}>
                      {(stats.daily?.signups||[]).map(d=>{
                        const max=Math.max(...(stats.daily?.signups||[]).map(x=>x.cnt),1);
                        return(
                          <div key={d.day} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                            <div style={{width:'100%',background:'#2D6A4F',borderRadius:3,height:`${Math.max((d.cnt/max)*48,4)}px`}}/>
                            <div style={{fontSize:9,color:'#9A9A9A',transform:'rotate(-45deg)',transformOrigin:'top left',whiteSpace:'nowrap'}}>{d.day.slice(5)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {settlement&&(
              <div style={{background:'#FFF9F0',border:'1px solid #F5DFA0',borderRadius:10,padding:16}}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:10,color:'#92400E'}}>💰 {statsMonth} 정산 내역</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:13}}>
                  <div><span style={{color:'#9A9A9A'}}>신규 유입: </span><strong>{(settlement.new_users||0).toLocaleString()}명</strong></div>
                  <div><span style={{color:'#9A9A9A'}}>결제 전환: </span><strong>{(settlement.paid_users||0).toLocaleString()}명</strong></div>
                  <div><span style={{color:'#9A9A9A'}}>마음풀 직접매출: </span><strong>{fmtW(settlement.total_revenue)}</strong></div>
                  <div><span style={{color:'#9A9A9A'}}>쉐어율: </span><strong>{((settlement.share_rate||0)*100).toFixed(0)}%</strong></div>
                  <div style={{gridColumn:'1/-1',borderTop:'1px solid #F5DFA0',paddingTop:8,marginTop:4}}>
                    <span style={{color:'#92400E',fontWeight:700}}>정산 지급액: </span>
                    <strong style={{fontSize:16,color:'#92400E'}}>{fmtW(settlement.share_amount)}</strong>
                    <span style={{fontSize:11,color:'#9A9A9A',marginLeft:8}}>(마음풀 보유: {fmtW(settlement.maumful_revenue)})</span>
                  </div>
                </div>
              </div>
            )}

            {/* 정산 원장 — 제휴코드별 상세(율 스냅샷) + CSV 다운로드 */}
            <div style={{marginTop:16,borderTop:'1px solid rgba(0,0,0,.08)',paddingTop:16}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10,flexWrap:'wrap',gap:8}}>
                <div style={{fontSize:13,fontWeight:700}}>📒 정산 원장 (기간별 상세)</div>
                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                  <input type="date" value={ledgerFrom} onChange={e=>setLedgerFrom(e.target.value)} style={{padding:'6px 8px',border:'1px solid #E0E0E0',borderRadius:6,fontSize:12}}/>
                  <span style={{color:'#9A9A9A'}}>~</span>
                  <input type="date" value={ledgerTo} onChange={e=>setLedgerTo(e.target.value)} style={{padding:'6px 8px',border:'1px solid #E0E0E0',borderRadius:6,fontSize:12}}/>
                  <button onClick={()=>loadLedger(selected)} style={{padding:'6px 12px',background:'#2D6A4F',color:'white',border:'none',borderRadius:6,fontSize:12,cursor:'pointer'}}>조회</button>
                </div>
              </div>
              {ledger&&(
                <div>
                  <div style={{display:'flex',gap:16,flexWrap:'wrap',fontSize:12,color:'#5A5A5A',marginBottom:10,background:'#F8F8F5',borderRadius:8,padding:'10px 14px'}}>
                    <span>건수 <strong>{(ledger.totals?.cnt||0).toLocaleString()}</strong></span>
                    <span>결제액 <strong>{fmtW(ledger.totals?.revenue)}</strong></span>
                    <span>쉐어 합계 <strong style={{color:'#92400E'}}>{fmtW(ledger.totals?.share)}</strong></span>
                    <span>미정산 <strong style={{color:'#B45309'}}>{fmtW(ledger.totals?.unsettled)}</strong></span>
                  </div>
                  <div style={{display:'flex',gap:8,marginBottom:10}}>
                    <button onClick={downloadCsv} disabled={!(ledger.rows||[]).length} style={{padding:'7px 14px',background:'#1F6FEB',color:'white',border:'none',borderRadius:8,fontSize:12,fontWeight:700,cursor:(ledger.rows||[]).length?'pointer':'default',opacity:(ledger.rows||[]).length?1:0.5}}>⬇ CSV 다운로드</button>
                    <button onClick={markSettled} disabled={!(ledger.totals?.unsettled)} style={{padding:'7px 14px',background:'white',color:'#92400E',border:'1px solid #F5DFA0',borderRadius:8,fontSize:12,fontWeight:700,cursor:(ledger.totals?.unsettled)?'pointer':'default',opacity:(ledger.totals?.unsettled)?1:0.5}}>이 기간 정산완료 처리</button>
                  </div>
                  {(ledger.rows||[]).length===0?(
                    <div style={{padding:20,textAlign:'center',color:'#9A9A9A',fontSize:12}}>해당 기간 적립 내역이 없습니다 (실결제가 쌓이면 표시됩니다)</div>
                  ):(
                    <div style={{overflowX:'auto'}}>
                      <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                        <thead><tr style={{background:'#F0F0ED',textAlign:'left'}}>
                          {['일시','회원','상품','결제액','율','쉐어액','상태'].map(h=><th key={h} style={{padding:'6px 8px',fontWeight:700,color:'#666'}}>{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {(ledger.rows||[]).map(r=>(
                            <tr key={r.charge_id} style={{borderBottom:'1px solid #F0F0F0'}}>
                              <td style={{padding:'6px 8px',color:'#888'}}>{(r.created_at||'').slice(0,10)}</td>
                              <td style={{padding:'6px 8px'}}>{r.user_email_masked}</td>
                              <td style={{padding:'6px 8px'}}>{r.package_key||'-'}</td>
                              <td style={{padding:'6px 8px'}}>{fmtW(r.charge_amount)}</td>
                              <td style={{padding:'6px 8px'}}>{((r.rate||0)*100).toFixed(0)}%</td>
                              <td style={{padding:'6px 8px',fontWeight:700,color:'#92400E'}}>{fmtW(r.share_amount)}</td>
                              <td style={{padding:'6px 8px'}}><span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:100,background:r.status==='settled'?'#D8F3DC':r.status==='reversed'?'#EEE':'#FEF3C7',color:r.status==='settled'?'#1A6B3C':r.status==='reversed'?'#888':'#92400E'}}>{r.status==='settled'?'정산완료':r.status==='reversed'?'환불':'미정산'}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ):(
          <div style={{background:'white',border:'1px solid rgba(0,0,0,.08)',borderRadius:12,padding:32,textAlign:'center',color:'#9A9A9A'}}>
            파트너를 선택하면 상세 통계와 정산 내역을 확인할 수 있습니다
          </div>
        )}
      </div>
    </div>
  );
}

// ── 탭: 오류 로그 ───────────────────────────────────────────
function AdminErrorLogs(){
  const {useState:useS,useEffect:useE}=React;
  const [logs,setLogs]=useS([]);
  const [service,setService]=useS('');
  const [limit,setLimit]=useS(50);
  const [loading,setLoading]=useS(true);
  const [clearing,setClearing]=useS(false);

  const load=()=>{
    setLoading(true);
    aApi.errorLogs(service,limit).then(r=>{if(r.success)setLogs(r.data||[]);}).finally(()=>setLoading(false));
  };
  useE(()=>load(),[service,limit]);

  const handleClear=async()=>{
    if(!confirm('모든 오류 로그를 삭제할까요?'))return;
    setClearing(true);
    await aApi.clearErrorLogs();
    setClearing(false);
    setLogs([]);
  };

  const statusColor=code=>{
    if(!code)return'gray';
    if(code>=500)return'red';
    if(code>=400)return'amber';
    return'blue';
  };

  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:10}}>
        <div style={{fontSize:15,fontWeight:700}}>🔴 오류 로그 ({logs.length}건)</div>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <select value={service} onChange={e=>{setService(e.target.value);}}
            style={{padding:'7px 10px',border:'1px solid rgba(0,0,0,.12)',borderRadius:8,fontSize:13,fontFamily:"'Noto Sans KR',sans-serif",outline:'none',background:'white'}}>
            <option value="">전체 서비스</option>
            <option value="maumful">maumful</option>
            <option value="maumgame">maumgame</option>
            <option value="maumcouple">maumcouple</option>
          </select>
          <select value={limit} onChange={e=>setLimit(Number(e.target.value))}
            style={{padding:'7px 10px',border:'1px solid rgba(0,0,0,.12)',borderRadius:8,fontSize:13,fontFamily:"'Noto Sans KR',sans-serif",outline:'none',background:'white'}}>
            <option value={20}>최근 20건</option>
            <option value={50}>최근 50건</option>
            <option value={100}>최근 100건</option>
          </select>
          <button onClick={load} style={{padding:'7px 14px',borderRadius:8,border:'none',background:'#2D6A4F',color:'white',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>새로고침</button>
          <button onClick={handleClear} disabled={clearing||logs.length===0}
            style={{padding:'7px 14px',borderRadius:8,border:'1px solid #E24B4A',background:'white',color:'#E24B4A',fontWeight:600,fontSize:13,cursor:clearing||logs.length===0?'not-allowed':'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>
            {clearing?'삭제 중...':'전체 삭제'}
          </button>
        </div>
      </div>

      {loading?<div style={{textAlign:'center',padding:'32px',color:'#9A9A9A'}}>로딩 중...</div>:(
        logs.length===0
          ?<div style={{textAlign:'center',padding:'48px',color:'#9A9A9A',background:'white',borderRadius:12,border:'1px solid rgba(0,0,0,.08)'}}>
            ✅ 오류 로그가 없습니다
           </div>
          :<div style={{display:'flex',flexDirection:'column',gap:8}}>
            {logs.map((log,i)=>(
              <div key={log.id||i} style={{background:'white',border:'1px solid rgba(0,0,0,.08)',borderRadius:10,padding:'14px 18px'}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10,flexWrap:'wrap',marginBottom:6}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                    <Chip label={log.status_code||'ERR'} color={statusColor(log.status_code)}/>
                    <Chip label={log.service||'unknown'} color='blue'/>
                    {log.method&&<span style={{fontSize:11,fontWeight:700,color:'#5B21B6',background:'#EEF0FF',padding:'2px 7px',borderRadius:5}}>{log.method}</span>}
                    {log.path&&<code style={{fontSize:12,color:'#1A1A1A',background:'#F5F5F0',padding:'2px 8px',borderRadius:5,wordBreak:'break-all'}}>{log.path}</code>}
                  </div>
                  <span style={{fontSize:11,color:'#9A9A9A',whiteSpace:'nowrap'}}>{fmtDtAdmin(log.created_at)}</span>
                </div>
                {log.message&&<div style={{fontSize:13,color:'#E24B4A',fontWeight:500,marginBottom:log.stack?6:0}}>{log.message}</div>}
                {log.stack&&(
                  <details>
                    <summary style={{fontSize:11,color:'#9A9A9A',cursor:'pointer',userSelect:'none'}}>스택 트레이스 보기</summary>
                    <pre style={{fontSize:11,color:'#5A5A5A',background:'#F9F9F7',borderRadius:6,padding:'10px',marginTop:6,overflowX:'auto',whiteSpace:'pre-wrap',wordBreak:'break-word',maxHeight:200,overflow:'auto'}}>{log.stack}</pre>
                  </details>
                )}
                {log.user_id&&<div style={{fontSize:11,color:'#9A9A9A',marginTop:4}}>user_id: {log.user_id}</div>}
              </div>
            ))}
          </div>
      )}
    </div>
  );
}

// ============================================================
// CounselingAdminPage — 어드민 진입점
// ============================================================
function CounselingAdminPage({setView}){
  const {useState:useS,useEffect:useE}=React;
  const [authed,setAuthed]=useS(()=>!!localStorage.getItem('admin_secret'));
  const [secretInput,setSecretInput]=useS('');
  const [tab,setTab]=useS('overview');
  const [loginErr,setLoginErr]=useS('');

  const login=async()=>{
    if(!secretInput){setLoginErr('어드민 시크릿을 입력하세요');return;}
    localStorage.setItem('admin_secret',secretInput);
    const r=await aApi.stats();
    if(r.success){setAuthed(true);setLoginErr('');}
    else{localStorage.removeItem('admin_secret');setLoginErr('인증 실패: 시크릿을 확인하세요');}
  };

  const logout=()=>{localStorage.removeItem('admin_secret');setAuthed(false);setSecretInput('');};

  const tabs=[
    ['overview','📊 대시보드'],['users','👤 사용자 관리'],['onboarding','📨 온보딩 신청'],
    ['centers','🏥 센터 관리'],['counselors','👥 상담사 관리'],
    ['appointments','📅 예약 관리'],['settlements','💰 정산 관리'],
    ['reviews','⭐ 리뷰 관리'],['partners','🤝 파트너 관리'],['errorlogs','🔴 오류 로그'],
  ];

  if(!authed)return(
    <div style={{minHeight:'100vh',background:'#FAFAF8',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Noto Sans KR',sans-serif",padding:16}}>
      <div style={{background:'white',borderRadius:16,padding:'40px 36px',width:'100%',maxWidth:380,boxShadow:'0 8px 32px rgba(0,0,0,.10)'}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{fontSize:40,marginBottom:10}}>🔐</div>
          <h2 style={{fontSize:22,fontWeight:700,marginBottom:4}}>어드민 로그인</h2>
          <p style={{fontSize:13,color:'#9A9A9A'}}>상담 플랫폼 관리자 전용</p>
        </div>
        {loginErr&&<div style={{background:'#FEF2F2',color:'#991B1B',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:13}}>{loginErr}</div>}
        <input
          type="password" value={secretInput} onChange={e=>setSecretInput(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&login()}
          placeholder="ADMIN_SECRET"
          style={{width:'100%',padding:'12px 14px',border:'1px solid rgba(0,0,0,.12)',borderRadius:10,fontSize:14,fontFamily:"'Noto Sans KR',sans-serif",outline:'none',marginBottom:14}}
        />
        <button onClick={login} style={{width:'100%',padding:'13px 0',background:'#2D6A4F',color:'white',border:'none',borderRadius:10,fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>로그인</button>
        <div style={{textAlign:'center',marginTop:16}}>
          <button onClick={()=>setView('landing')} style={{background:'none',border:'none',color:'#9A9A9A',fontSize:13,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>← 홈으로 돌아가기</button>
        </div>
      </div>
    </div>
  );

  return(
    <div style={{minHeight:'100vh',background:'#F5F5F0',fontFamily:"'Noto Sans KR',sans-serif"}}>
      {/* 어드민 헤더 */}
      <div style={{background:'#1A3D2B',padding:'0 24px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{fontSize:18,fontWeight:700,color:'white'}}>🌿 마음풀 어드민</div>
          <span style={{background:'rgba(255,255,255,.15)',color:'rgba(255,255,255,.8)',fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:100,letterSpacing:'0.5px'}}>COUNSELING</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <button onClick={()=>setView('landing')} style={{background:'rgba(255,255,255,.08)',color:'rgba(255,255,255,.7)',border:'none',borderRadius:7,padding:'6px 14px',fontSize:12,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>← 사이트로</button>
          <button onClick={logout} style={{background:'none',color:'rgba(255,255,255,.5)',border:'1px solid rgba(255,255,255,.2)',borderRadius:7,padding:'6px 14px',fontSize:12,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif"}}>로그아웃</button>
        </div>
      </div>

      <div style={{display:'flex',minHeight:'calc(100vh - 56px)'}}>
        {/* 사이드바 */}
        <div style={{width:200,background:'#1E2D24',padding:'20px 0',flexShrink:0}}>
          {tabs.map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)}
              style={{display:'block',width:'100%',textAlign:'left',padding:'12px 20px',background:tab===id?'rgba(255,255,255,.1)':'none',border:'none',borderLeft:tab===id?'3px solid #52B788':'3px solid transparent',color:tab===id?'white':'rgba(255,255,255,.55)',fontSize:13,fontWeight:tab===id?600:400,cursor:'pointer',fontFamily:"'Noto Sans KR',sans-serif",transition:'all .15s'}}>
              {label}
            </button>
          ))}
        </div>

        {/* 메인 영역 */}
        <div style={{flex:1,padding:'28px 32px',overflow:'auto'}}>
          {tab==='overview'    &&<AdminOverview/>}
          {tab==='users'       &&<AdminUsers/>}
          {tab==='onboarding'  &&<AdminOnboarding/>}
          {tab==='centers'     &&<AdminCenters/>}
          {tab==='counselors'  &&<AdminCounselors/>}
          {tab==='appointments'&&<AdminAppointments/>}
          {tab==='settlements' &&<AdminSettlements/>}
          {tab==='reviews'     &&<AdminReviews/>}
          {tab==='partners'    &&<AdminPartners/>}
          {tab==='errorlogs'   &&<AdminErrorLogs/>}
        </div>
      </div>
    </div>
  );
}
