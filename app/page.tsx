'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, AudioLines, BookOpen, Check, ChevronRight, CircleHelp, Coffee, Compass, Flame, Heart, Headphones, Leaf, LockKeyhole, MapPin, Mic, MoreHorizontal, Pause, Play, Settings2, ShieldCheck, Sparkles, Sprout, Square, Sun, Volume2, X } from 'lucide-react';
import { chapters, localDay, relationship, stages, type Chapter, type Completion } from '@/lib/story';
import { Scene, Portrait } from '@/components/Scene';

type Tab='today'|'story'|'memories'|'relationship';
type Profile={name:string;romance:boolean;adult:boolean};
type Status={roleVoice:boolean;guideVoice:boolean;storage:string;session:boolean};
type Progress={completions:Completion[];timeZone:string};
type Session={id:string;chapterId:string;index:number;total:number;audioUrl:string;roleAudios?:string[];completed:boolean;cue:string;suggestions:string[];recordings:{audioUrl:string;duration:number}[]};
const nav=[{id:'today' as Tab,label:'今日相伴',icon:Sun},{id:'story' as Tab,label:'我们的故事',icon:BookOpen},{id:'memories' as Tab,label:'回忆收藏',icon:Headphones},{id:'relationship' as Tab,label:'关系旅程',icon:Heart}];
async function request<T>(url:string,body?:unknown):Promise<T>{
  const res=await fetch(url,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{cache:'no-store'});
  const data=await res.json(); if(!res.ok)throw new Error(data.error||'连接暂时出了点问题，请重试');return data;
}
function Wave({moving=false,small=false}:{moving?:boolean;small?:boolean}) {return <span className={`wave ${moving?'moving':''} ${small?'small':''}`} aria-hidden="true">{Array.from({length:small?17:33},(_,i)=><i key={i} style={{height: `${[9,15,23,12,29,36,18,26,13,33,20][i%11]}px`,animationDelay:`${i*.065}s`}}/>)}</span>;}
function Modal({title,children,onClose,wide=false}:{title:string;children:React.ReactNode;onClose:()=>void;wide?:boolean}){
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement; const prevOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
    ref.current?.focus();
    function key(e:KeyboardEvent){if(e.key==='Escape')onClose();if(e.key==='Tab'){
      const items=ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,[tabindex="0"]'); if(!items?.length)return;
      const first=items[0],last=items[items.length-1];
      if(e.shiftKey&&(document.activeElement===first||document.activeElement===ref.current)){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }}
    document.addEventListener('keydown',key);return()=>{document.body.style.overflow=prevOverflow;document.removeEventListener('keydown',key);previous?.focus();};
  },[onClose]);
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><div className={`modal ${wide?'wide':''}`} ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}><button className="icon-button close" aria-label="关闭" onClick={onClose}><X size={20}/></button>{children}</div></div>;
}
export default function Home(){
  const [tab,setTab]=useState<Tab>('today');const [profile,setProfile]=useState<Profile|null>(null);
  const [progress,setProgress]=useState<Progress>({completions:[],timeZone:'Asia/Shanghai'});
  const [status,setStatus]=useState<Status|null>(null);const [selected,setSelected]=useState<Chapter|null>(null);
  const [onboard,setOnboard]=useState(false);const [settings,setSettings]=useState(false);const [about,setAbout]=useState(false);
  const [name,setName]=useState('');const [adult,setAdult]=useState(false);const [romance,setRomance]=useState(true);
  const [session,setSession]=useState<Session|null>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const [toast,setToast]=useState('');const [ready,setReady]=useState(false);
  const refresh=useCallback(()=>request<Progress>('/api/progress').then(setProgress).catch(()=>setToast('进度暂时未能同步，页面仍可浏览。')),[]);
  useEffect(()=>{
    try{const p=localStorage.getItem('between-profile');if(p){const saved=JSON.parse(p);setProfile(saved);setName(saved.name);setRomance(saved.romance);setAdult(saved.adult);}}catch{}
    request<Status>('/api/status').then(setStatus).catch(()=>{});void refresh();setReady(true);
  },[refresh]);
  useEffect(()=>{if(toast){const t=setTimeout(()=>setToast(''),5500);return()=>clearTimeout(t);}},[toast]);
  const rel=relationship(progress.completions);
  const day=localDay(progress.timeZone);const today=progress.completions.filter(c=>c.day===day);
  const next=chapters.find(c=>!progress.completions.some(x=>x.chapterId===c.id))||chapters[0];
  const index=chapters.indexOf(next);const featured=chapters.slice(index,Math.min(index+2,chapters.length));
  const finished=(id:string)=>progress.completions.some(c=>c.chapterId===id);
  const unlocked=(c:Chapter)=>chapters.indexOf(c)===0||finished(chapters[chapters.indexOf(c)-1].id);
  const openChapter=(c:Chapter)=>{setError('');setSelected(c);if(!profile?.adult)setOnboard(true);};
  const closeSelected=useCallback(()=>{if(!busy)setSelected(null);},[busy]);
  const closeOnboard=useCallback(()=>{setOnboard(false);setSelected(null);},[]);
  const closeSettings=useCallback(()=>setSettings(false),[]);const closeAbout=useCallback(()=>setAbout(false),[]);
  function saveProfile(){
    const p={name:name.trim()||'新朋友',adult,romance};setProfile(p);localStorage.setItem('between-profile',JSON.stringify(p));setOnboard(false);
  }
  async function begin(replay=false){
    if(!selected)return;setBusy(true);setError('');
    try{const s=await request<Session>('/api/conversation/start',{chapterId:selected.id,replay});setSession(s);setSelected(null);}
    catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  const closeRoom=useCallback(()=>{setSession(null);void refresh();},[refresh]);
  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="/" aria-label="Between 之间首页"><span className="brand-icon"><AudioLines size={27}/></span><span>between<span className="brand-dot">.</span><small>之间 · 用声音靠近</small></span></a>
      <div className="sidebar-label">A LITTLE CLOSER, EVERY DAY</div>
      <nav aria-label="主导航">{nav.map(n=><button key={n.id} onClick={()=>setTab(n.id)} className={`nav-item ${tab===n.id?'active':''}`} aria-current={tab===n.id?'page':undefined}><n.icon size={20}/><span>{n.label}</span>{tab===n.id&&<span className="nav-dot"/>}</button>)}</nav>
      <div className="sidebar-note"><Sprout size={26}/><p>不必说得完美，<br/>真诚开口就很好。</p><span>One conversation at a time.</span><div className="note-line"/></div>
      <div className="sidebar-bottom"><button onClick={()=>setAbout(true)}><CircleHelp size={18}/> 关于 Between <ChevronRight size={15}/></button><button onClick={()=>setSettings(true)}><span className="user-avatar">{profile?.name?.slice(0,1)||'你'}</span><span>{profile?.name||'新朋友'}<small>属于你的声音旅程</small></span><Settings2 size={17}/></button></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><span className="breadcrumb">{nav.find(n=>n.id===tab)?.label}<span>/</span><span className="crumb-light">每一次开口，都在靠近</span></span><div className="topbar-right"><span className="quiet-badge"><Leaf size={14}/>慢慢来，比较快</span><button className="icon-button" onClick={()=>setSettings(true)} aria-label="个人设置"><Settings2 size={19}/></button></div></header>
      <main>
        {tab==='today'&&<>
          <div className="greeting-row"><div><p className="eyebrow"><span/> YOUR DAILY LITTLE CONNECTION</p><h1>{profile?`你好，${profile.name}`:'今天，也想听见你的声音'}<span className="title-spark">✳︎</span></h1><p className="subtitle">用一点英语，分享一点生活。和 Alex 一起，把陌生聊成熟悉。</p></div><div className="date-tag"><Sun size={17}/><span>{ready?new Intl.DateTimeFormat('zh-CN',{timeZone:progress.timeZone,month:'long',day:'numeric',weekday:'long'}).format(new Date()):'属于今天的小期待'}</span></div></div>
          <div className="dashboard-grid"><div className="primary-column">
            <section className="hero-card"><div className="hero-art"><Scene/><div className="art-caption"><span className="live-dot"/> A STORY WAITING FOR YOU</div></div><div className="hero-overlay"/><div className="hero-copy"><div className="hero-pill"><Sparkles size={13}/> 第一季 · 从陌生到心动</div><h2>让英语，<br/>成为我们靠近的方式。</h2><p>从街角的一杯咖啡，到睡前的一句晚安。<br/>故事一章章展开，你也一点点更敢开口。</p><button className="primary-button" onClick={()=>openChapter(next)}>{progress.completions.length?'继续我们的故事':'开启第一章'}<ArrowRight size={17}/></button><span className="hero-footnote"><Headphones size={13}/> 戴上耳机，留一点时间给彼此</span></div><span className="hero-number">01 — 12</span></section>
            <div className="section-heading"><div><h2>今天的两个小章节 <span className="little-line"/></h2><p>不赶进度，好好聊完，就是今天的小成就。</p></div><button className="text-button" onClick={()=>setTab('story')}>全部故事 <ArrowRight size={15}/></button></div>
            <div className="chapter-grid">{featured.map((c,i)=><ChapterCard key={c.id} chapter={c} available={unlocked(c)} done={finished(c.id)} onClick={()=>unlocked(c)?openChapter(c):setToast('聊完上一章，就能解锁这一段故事。')} featured={i===0}/>)}</div>
            <div className="gentle-banner"><span className="mini-flower">✳︎</span><div><strong>你的故事，有自己的节奏。</strong><p>每天两章，留住一点进步；忙的时候，也可以明天再来。</p></div><span className="banner-script">a little, every day.</span></div>
          </div><aside className="right-column">
            <section className="daily-card"><div className="card-heading"><h3>今天的小约定</h3><span className="tiny-icon"><Sun size={17}/></span></div><div className="daily-progress"><div className="progress-ring" style={{'--progress':`${Math.min(100,today.length*50)}%`} as React.CSSProperties}><div><strong>{Math.min(2,today.length)}<small>/ 2</small></strong><span>今日章节</span></div></div><p>{today.length>=2?'今天的小约定，完成啦':'给彼此一点时间'}<small>{today.length>=2?'额外章节可自由练习':'两次聊天，让熟悉多一点'}</small></p></div><div className="daily-rewards"><span><Sprout size={15}/> 熟悉度 <b>+20</b></span><span><Heart size={14}/> 心动值 <b>+12</b></span></div><div className="daily-divider"/><div className="streak-line"><Flame size={17}/><span>已完成 <strong>{progress.completions.length}</strong> 个故事章节</span><span className="small-pill">慢慢积累</span></div></section>
            <section className="alex-card"><div className="card-heading"><h3>你的故事搭档</h3><span className="small-pill sage">AI 角色</span></div><div className="alex-intro"><Portrait className="avatar-portrait"/><div><h3>Alex <span>26</span></h3><p>书店设计师 · 温柔的倾听者</p><span className="alex-tag">☕ 咖啡与日常的收藏家</span></div></div><p className="alex-quote">“I think the best conversations<br/> start with something small.”</p><div className="alex-traits"><span>温柔慢热</span><span>善于倾听</span><span>英式日常感</span></div><button className="alex-link" onClick={()=>setTab('relationship')}>现在的你们 <span>{rel.stage.label}<ChevronRight size={15}/></span></button></section>
            <section className="voice-note"><span className="voice-note-icon"><AudioLines size={21}/></span><div><h3>只听声音，也能更靠近</h3><p>没有文字聊天框。<br/>让表达回到声音本来的温度。</p></div></section>
          </aside></div>
        </>}
        {tab==='story'&&<><PageTitle eyebrow="YOUR STORY, ONE CHAPTER AT A TIME" title="我们的故事" subtitle="十二个日常场景，从第一句问候开始。按顺序认识，也可以随时回来重温。"/><div className="story-season"><span>SEASON 01</span><h2>从陌生到心动</h2><p>{progress.completions.length} / 12 章 · 每章四轮口语互动</p><Scene variant="sunset"/></div><div className="all-chapters">{chapters.map(c=><ChapterCard key={c.id} chapter={c} available={unlocked(c)} done={finished(c.id)} onClick={()=>unlocked(c)?openChapter(c):setToast('先完成上一章，再一起走向下一章吧。')}/>)}</div></>}
        {tab==='memories'&&<><PageTitle eyebrow="SMALL MOMENTS, WORTH KEEPING" title="回忆收藏" subtitle="聊过的故事，留下的声音。属于你的每一次开口，都值得被记住。"/>{progress.completions.length===0?<div className="empty-state"><div className="empty-art"><Headphones size={40}/><span>✧</span></div><h2>第一段回忆，等你来收藏</h2><p>完成一个章节后，它就会留在这里。<br/>你可以重听角色语音，也可以听见自己的进步。</p><button className="primary-button" onClick={()=>{setTab('today');openChapter(chapters[0]);}}>去认识 Alex <ArrowRight size={16}/></button></div>:<div className="memory-list">{progress.completions.map(c=>{const ch=chapters.find(x=>x.id===c.chapterId)!;return <button key={c.chapterId} className="memory-card" onClick={()=>openChapter(ch)}><Scene variant={ch.color}/><span><small>{c.day} · CHAPTER {ch.number}</small><h2>{ch.title}</h2><p>{ch.english}</p></span><Headphones size={24}/><ChevronRight size={18}/></button>;})}</div>}<div className="privacy-note"><ShieldCheck size={17}/><p>无登录版本通过当前浏览器识别你。清除 Cookie 后将无法找回原记录；暂不支持跨设备同步。</p></div></>}
        {tab==='relationship'&&<><PageTitle eyebrow="CLOSER, AT YOUR OWN PACE" title="关系旅程" subtitle="熟悉来自相处，心动不必着急。数值记录参与，不决定你必须选择怎样的关系。"/><section className="relationship-hero"><Portrait/><div><span className="eyebrow">YOU & ALEX</span><h2>{rel.stage.label}</h2><p>{rel.stage.description}</p><span className="small-pill">{profile?.romance===false?'友好陪伴 · 按你的节奏':'慢慢心动 · 始终可以选择友谊'}</span></div><span className="relationship-flower">✳︎</span></section><div className="stat-grid"><section><Sprout/><h3>熟悉度 <strong>{rel.familiarity}<small>/100</small></strong></h3><div className="bar"><i style={{width:`${rel.familiarity}%`}}/></div><p>每天前两章，各增加 10 点</p></section><section><Heart/><h3>心动值 <strong>{rel.affection}<small>/100</small></strong></h3><div className="bar rose"><i style={{width:`${rel.affection}%`}}/></div><p>每天前两章，各增加 6 点</p></section></div><div className="section-heading"><div><h2>每个阶段，都有好风景</h2><p>熟悉度解锁旅程阶段，章节按故事顺序推进。</p></div></div><div className="journey">{stages.map((s,i)=><div key={s.label} className={rel.familiarity>=s.threshold?'reached':''}><span>{rel.familiarity>=s.threshold?<Check size={19}/>:<LockKeyhole size={17}/>}</span><small>0{i+1} · 熟悉度 {s.threshold}</small><h3>{s.label}</h3><p>{s.description}</p></div>)}</div><div className="rules-card"><Sparkles/><div><h3>把陪伴留给生活，也把生活留给自己</h3><p>每章四轮录音完成后结算。每天前两章获得成长值；额外章节和重复练习不重复加分。中断可继续，不扣分、不清空成长值。当前为固定剧本练习，不分析录音内容、不做口语评分；关系阶段不等于对你的情感评价。</p></div></div></>}
        <footer className="page-footer"><span>between. <i>Small talks. Real progress.</i></span><span>AI 角色陪伴 · 预写剧情 · 英语口语练习</span></footer>
      </main>
      <nav className="mobile-nav" aria-label="移动端导航">{nav.map(n=><button key={n.id} className={tab===n.id?'active':''} aria-current={tab===n.id?'page':undefined} onClick={()=>setTab(n.id)}><n.icon size={21}/><span>{n.label}</span></button>)}</nav>
    </div>
    {toast&&<div className="toast" role="status">{toast}<button onClick={()=>setToast('')} aria-label="关闭提示"><X size={15}/></button></div>}
    {onboard&&<Modal title="开始你的声音旅程" onClose={closeOnboard}><div className="onboard-icon"><Sprout size={33}/></div><p className="eyebrow">A NEW LITTLE BEGINNING</p><h2>故事开始前，认识一下你。</h2><p className="modal-description">一个称呼，一点期待。不需要注册，就能开始。</p><label className="field-label">希望怎么称呼你？<input value={name} maxLength={20} onChange={e=>setName(e.target.value)} placeholder="你的昵称" autoComplete="nickname"/></label><p className="field-label">想用怎样的节奏相处？</p><div className="choice-row"><button className={!romance?'chosen':''} onClick={()=>setRomance(false)}><Sprout size={19}/><strong>友好陪伴</strong><small>轻松认识，慢慢熟悉</small></button><button className={romance?'chosen':''} onClick={()=>setRomance(true)}><Heart size={19}/><strong>慢慢心动</strong><small>为一点心动留出空间</small></button></div><label className="consent"><input type="checkbox" checked={adult} onChange={e=>setAdult(e.target.checked)}/><span>我已满 18 岁，理解 Alex 是虚构 AI 角色，并同意录音保存用于本次练习回放。</span></label><button className="primary-button full" disabled={!adult} onClick={saveProfile}>准备好认识 Alex 了 <ArrowRight size={17}/></button><p className="microcopy">录音仅在你点击麦克风后开始，可随时退出。</p></Modal>}
    {selected&&!onboard&&<Modal title={selected.title} onClose={closeSelected} wide><div className="chapter-preview"><Scene variant={selected.color}/><div><p className="eyebrow">CHAPTER {selected.number} · {selected.place}</p><h2>{selected.title}</h2><p className="serif-line">{selected.english}</p><p className="modal-description">{selected.description}</p><div className="preview-tags"><span><Mic size={15}/> 四轮语音互动</span><span><BookOpen size={15}/> 固定剧情练习</span></div><div className="preview-note"><Headphones size={18}/><p>点击开始才生成第一句角色语音。之后每完成一次录音，再进入下一句；已生成的语音会保存复用。</p></div>{status&&!status.roleVoice&&<div className="notice">角色语音尚未配置。页面与章节可浏览，真实对话需先在服务端配置 Cartesia。</div>}{error&&<p role="alert" className="error-message">{error}</p>}<button className="primary-button full" disabled={busy} onClick={()=>begin(false)}>{busy?'准备这次相遇…':finished(selected.id)?'打开这段回忆':'进入语音章节'}{!busy&&<ArrowRight size={16}/>}</button>{finished(selected.id)&&<button disabled={busy} className="text-button centered" onClick={()=>begin(true)}>重新练习这一章（不重复加分）</button>}<p className="microcopy">无语音识别 · 无文字聊天 · 可随时暂停</p></div></div></Modal>}
    {session&&<VoiceRoom session={session} onSession={setSession} onClose={closeRoom} onComplete={()=>void refresh()}/>}
    {settings&&<Modal title="个人设置" onClose={closeSettings}><p className="eyebrow">YOUR LITTLE SPACE</p><h2>按你舒服的方式</h2><p className="modal-description">偏好保存在当前浏览器，不需要账号。</p><label className="field-label">你的昵称<input value={name} maxLength={20} onChange={e=>setName(e.target.value)} placeholder="新朋友"/></label><div className="setting-row"><span><strong>为心动留一点空间</strong><small>关闭后，以友好陪伴的方式体验</small></span><button className={`toggle ${romance?'on':''}`} role="switch" aria-checked={romance} aria-label="心动模式" onClick={()=>setRomance(!romance)}><span/></button></div><div className="settings-status"><h3>服务状态</h3><p><span>角色声音</span><b>{status?.roleVoice?'已配置 · 按需生成':'等待配置'}</b></p><p><span>英文提示读音</span><b>{status?.guideVoice?'已配置 edge-tts':'等待配置'}</b></p><p><span>记录保存</span><b>{status?.storage==='supabase'?'Supabase':status?.storage==='local'?'本地开发存储':'等待配置'}</b></p><small>配置状态不代表外部服务连通性已验证。</small></div><div className="notice">当前是预写剧本体验，昵称和关系偏好不改写角色台词。正式内容可按剧本文件替换。</div><button className="primary-button full" onClick={()=>{const p={name:name.trim()||'新朋友',romance,adult:profile?.adult||false};setProfile(p);localStorage.setItem('between-profile',JSON.stringify(p));setSettings(false);setToast('偏好已保存');}}>保存偏好 <Check size={17}/></button><p className="microcopy">暂无登录和支付功能。请保留当前浏览器 Cookie。</p></Modal>}
    {about&&<Modal title="关于 Between" onClose={closeAbout}><div className="onboard-icon"><AudioLines size={32}/></div><p className="eyebrow">SMALL TALKS. REAL PROGRESS.</p><h2>让每一次开口，都更靠近。</h2><p className="modal-description">Between 是一个以英语练习为起点的语音故事产品。你与虚构角色 Alex 在十二个日常场景里逐渐熟悉，用声音完成每一小段互动。</p><div className="about-points"><p><BookOpen/> 所有角色台词提前编写，当前提供示例剧本。</p><p><Mic/> 你只发送语音，角色也只通过语音回应。</p><p><Volume2/> 英文回答提示可按需听读音，不代替你发送。</p><p><ShieldCheck/> 不分析你的录音，不生成口语评分。</p></div><button className="primary-button full" onClick={closeAbout}>好好说一句 hello <Heart size={17}/></button></Modal>}
  </div>;
}
function PageTitle({eyebrow,title,subtitle}:{eyebrow:string;title:string;subtitle:string}){return <div className="page-title"><p className="eyebrow"><span/>{eyebrow}</p><h1>{title}<span className="title-spark">✳︎</span></h1><p className="subtitle">{subtitle}</p></div>;}
function ChapterCard({chapter:c,available,done,onClick,featured=false}:{chapter:Chapter;available:boolean;done:boolean;onClick:()=>void;featured?:boolean}){
  return <button className={`chapter-card ${!available?'locked':''}`} onClick={onClick} aria-label={`${c.title}，${done?'已完成':available?'可开始':'未解锁'}`}><div className="chapter-art"><Scene variant={c.color}/><span className="chapter-number">CHAPTER {c.number}</span><span className={`chapter-state ${done?'done':''}`}>{done?<><Check size={12}/> 已完成</>:available?<><span className="live-dot"/>{featured?'等待开启':'可开始'}</>:<><LockKeyhole size={11}/> 待解锁</>}</span></div><div className="chapter-body"><span className="chapter-place"><MapPin size={12}/>{c.place}<span>4 轮对话</span></span><h3>{c.title}<span className="round-arrow">{available?<ArrowRight size={15}/>:<LockKeyhole size={13}/>}</span></h3><p>{c.english}</p><div className="chapter-tags">{c.tags.map(t=><span key={t}>{t}</span>)}<span className="chapter-reward"><Sprout size={12}/> 首次 +10</span></div></div></button>;
}

function VoiceRoom({session:s,onSession,onClose,onComplete}:{session:Session;onSession:(s:Session)=>void;onClose:()=>void;onComplete:()=>void}){
  const chapter=chapters.find(c=>c.id===s.chapterId)!;
  const [speaking,setSpeaking]=useState(false);const [recording,setRecording]=useState(false);const [seconds,setSeconds]=useState(0);const [busy,setBusy]=useState(false);
  const [hints,setHints]=useState(false);const [error,setError]=useState('');const [guideBusy,setGuideBusy]=useState<number|null>(null);const [userPlaying,setUserPlaying]=useState<number|null>(null);
  const [pending,setPending]=useState<{blob:Blob;duration:number}|null>(null);
  const player=useRef<HTMLAudioElement|null>(null);const recorder=useRef<MediaRecorder|null>(null);const stream=useRef<MediaStream|null>(null);const timer=useRef<ReturnType<typeof setInterval>|null>(null);
  const room=useRef<HTMLDivElement|null>(null);
  const context=useRef<AudioContext|null>(null);const frame=useRef(0);const alive=useRef(true);const cancel=useRef(false);const played=useRef('');
  const cleanupCapture=useCallback(()=>{if(timer.current)clearInterval(timer.current);cancelAnimationFrame(frame.current);stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;void context.current?.close().catch(()=>{});context.current=null;},[]);
  const playAudio=useCallback(async(url:string,user:number|null=null)=>{
    setError('');
    if(player.current){player.current.pause();player.current.src='';}
    const p=new Audio(url);player.current=p;setUserPlaying(user);setSpeaking(true);
    p.onended=()=>{if(alive.current&&player.current===p){setSpeaking(false);setUserPlaying(null);}};
    p.onerror=()=>{if(alive.current&&player.current===p){setSpeaking(false);setUserPlaying(null);setError('没能播放这段语音，请点击重新播放。');}};
    try{await p.play();}catch{if(alive.current&&player.current===p){setSpeaking(false);setUserPlaying(null);setError('点击播放按钮，听听这段声音。');}}
  },[]);
  useEffect(()=>{
    if(played.current!==s.audioUrl){played.current=s.audioUrl;void playAudio(s.audioUrl);}
  },[s.audioUrl,playAudio]);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;cancel.current=true;played.current='';if(recorder.current?.state==='recording')recorder.current.stop();cleanupCapture();if(player.current){player.current.pause();player.current.src='';}};},[cleanupCapture]);
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';room.current?.focus();
    const trap=(e:KeyboardEvent)=>{
      if(e.key!=='Tab')return;
      const nodes=room.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');if(!nodes?.length)return;
      if(e.shiftKey&&(document.activeElement===nodes[0]||document.activeElement===room.current)){e.preventDefault();nodes[nodes.length-1].focus();}
      if(!e.shiftKey&&document.activeElement===nodes[nodes.length-1]){e.preventDefault();nodes[0].focus();}
    };
    document.addEventListener('keydown',trap);return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',trap);previous?.focus();};
  },[]);
  useEffect(()=>{const hidden=()=>{if(document.hidden&&recorder.current?.state==='recording'){cancel.current=true;recorder.current.stop();setRecording(false);setError('离开页面时已停止录音。这条录音未发送，请重新录制。');}};document.addEventListener('visibilitychange',hidden);return()=>document.removeEventListener('visibilitychange',hidden);},[]);
  async function send(blob:Blob,duration:number){
    setBusy(true);setError('');setPending({blob,duration});
    try{
      const form=new FormData();form.set('sessionId',s.id);form.set('index',String(s.index));form.set('duration',String(Math.min(45,duration)));form.set('audio',blob,'recording.'+(blob.type.includes('mp4')?'m4a':blob.type.includes('ogg')?'ogg':'webm'));
      const res=await fetch('/api/conversation/turn',{method:'POST',body:form});const result=await res.json();if(!res.ok)throw new Error(result.error||'没能保存，请重试');
      if(alive.current){setPending(null);onSession(result);setHints(false);if(result.completed)onComplete();}
    }catch(e){if(alive.current)setError((e as Error).message);}finally{if(alive.current)setBusy(false);}
  }
  async function startRecording(){
    setError('');setPending(null);
    if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){setError('当前浏览器不支持录音，请使用 HTTPS 下的 Safari 或 Chrome。');return;}
    setBusy(true);
    try{
      const media=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});
      if(!alive.current){media.getTracks().forEach(t=>t.stop());return;}
      stream.current=media;
      const mime=['audio/webm;codecs=opus','audio/mp4','audio/webm','audio/ogg;codecs=opus'].find(m=>MediaRecorder.isTypeSupported(m));
      if(!mime)throw new Error('当前浏览器的录音格式不受支持，请换用 Safari 或 Chrome。');
      const rec=new MediaRecorder(media,{mimeType:mime,audioBitsPerSecond:64000});recorder.current=rec;const chunks:Blob[]=[];const started=Date.now();let maxRms=0;cancel.current=false;
      const ctx=new AudioContext();context.current=ctx;await ctx.resume();const source=ctx.createMediaStreamSource(media);const analyser=ctx.createAnalyser();analyser.fftSize=1024;source.connect(analyser);const data=new Float32Array(analyser.fftSize);
      function measure(){analyser.getFloatTimeDomainData(data);const rms=Math.sqrt(data.reduce((a,v)=>a+v*v,0)/data.length);maxRms=Math.max(rms,maxRms);frame.current=requestAnimationFrame(measure);}measure();
      rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      rec.onstop=()=>{const duration=(Date.now()-started)/1000;cleanupCapture();if(!alive.current||cancel.current)return;setRecording(false);const blob=new Blob(chunks,{type:mime});if(duration<1||maxRms<.008){setError('还没清楚听见你的声音。请靠近麦克风，说满一秒后再发送。');return;}void send(blob,duration);};
      rec.onerror=()=>{cancel.current=true;cleanupCapture();setRecording(false);setError('录音中断了，请重新录制。');};
      rec.start(250);setRecording(true);setSeconds(0);timer.current=setInterval(()=>{const elapsed=Math.floor((Date.now()-started)/1000);setSeconds(elapsed);if(elapsed>=45&&rec.state==='recording')rec.stop();},250);
    }catch(e){cleanupCapture();setError((e as Error).name==='NotAllowedError'?'麦克风权限未开启。请在浏览器设置中允许本站使用麦克风，再重试。':(e as Error).message||'无法打开麦克风');}finally{if(alive.current)setBusy(false);}
  }
  async function guide(i:number){setGuideBusy(i);setError('');try{const result=await request<{audioUrl:string}>('/api/guide',{chapterId:s.chapterId,index:s.index,suggestion:i});if(alive.current)await playAudio(result.audioUrl);}catch(e){if(alive.current)setError((e as Error).message);}finally{if(alive.current)setGuideBusy(null);}}
  function pause(){player.current?.pause();setSpeaking(false);setUserPlaying(null);}
  return <div className="voice-room" ref={room} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`语音章节：${chapter.title}`}><header className="room-header"><button className="room-back" onClick={onClose} disabled={busy}><ArrowLeft size={20}/><span>暂时离开</span></button><span>CHAPTER {chapter.number} <i>·</i> {chapter.place}</span><span className="room-private"><ShieldCheck size={15}/>声音会被妥善保存</span></header><div className="room-progress">{Array.from({length:s.total},(_,i)=><span key={i} className={i<s.index?'filled':''}/>)}</div><div className="room-layout"><section className="room-scene"><Scene variant={chapter.color}/><div className="room-scene-shade"/><span className="room-scene-label"><MapPin size={15}/>{chapter.place}</span><div className="room-scene-copy"><span>ONE SMALL MOMENT WITH YOU</span><h1>{chapter.title}</h1><p>{chapter.english}</p></div><div className="room-scene-bottom"><Portrait/><span>Alex<small>虚构 AI 角色 · 预写剧情</small></span><span className="small-pill">{speaking?'正在播放':'在这里，听你说'}</span></div></section><section className="conversation-panel"><div className="room-intro"><span className="eyebrow">JUST YOUR VOICE, JUST BE YOURSELF</span><h2>{s.completed?'这一章，好好说完了。':'不用想好每一个词，先开口。'}</h2><p>{s.completed?'谢谢你，给这段故事留下了自己的声音。':'听 Alex 说完，再点一下麦克风回应。'}</p></div><div className="audio-conversation"><div className="role-audio"><Portrait/><div><span>Alex <small>第 {s.index+1} 段语音</small></span><button className="audio-bubble" disabled={recording||busy} aria-label={speaking&&userPlaying===null?'暂停语音':'播放 Alex 的语音'} onClick={()=>speaking&&userPlaying===null?pause():void playAudio(s.audioUrl)}>{speaking&&userPlaying===null?<Pause size={19}/>:<Play size={19}/>}<Wave moving={speaking&&userPlaying===null}/></button><small className="audio-label">角色仅通过声音回应，不显示台词</small></div></div>{s.completed&&s.roleAudios&&<div className="past-role-audio"><span>重听 Alex 的声音</span><div>{s.roleAudios.map((url,i)=><button key={url} onClick={()=>void playAudio(url)} aria-label={`重听 Alex 第 ${i+1} 段语音`}><Play size={12}/>第 {i+1} 段</button>)}</div></div>}{s.recordings.length>0&&<div className="your-recordings"><span>你的声音</span><div>{s.recordings.map((r,i)=><button key={i} aria-label={`播放我的第 ${i+1} 条录音`} disabled={recording||busy} onClick={()=>userPlaying===i&&speaking?pause():void playAudio(r.audioUrl,i)}>{userPlaying===i&&speaking?<Pause size={13}/>:<Play size={13}/>}<span>{Math.ceil(r.duration)}″</span><Check size={12}/></button>)}</div></div>}</div>
          {s.completed?<div className="chapter-complete"><span className="completion-mark"><Check size={24}/></span><h3>四次开口，又更自信了一点。</h3><p>这一章已保存到回忆收藏。<br/>首次完成的成长值已按今日规则结算。</p><button className="primary-button full" onClick={onClose}>收好这段回忆 <ArrowRight size={17}/></button></div>:<><div className="turn-cue"><span>轮到你了 · {s.index+1} / {s.total}</span><h3>{s.cue}</h3></div>{hints&&<div className="hint-panel"><div><span><Sparkles size={14}/> 可以这样开口</span><button onClick={()=>setHints(false)} aria-label="收起提示"><X size={15}/></button></div>{s.suggestions.map((text,i)=><div className="hint-line" key={text}><p>{text}</p><button disabled={guideBusy!==null||recording||busy} onClick={()=>void guide(i)} aria-label={`听推荐表达 ${i+1} 的读音`}>{guideBusy===i?<span className="spinner"/>:<Volume2 size={18}/>}</button></div>)}<small>只是参考，完全可以用自己的话回应。读音点击后生成。</small></div>}<div className="record-zone"><button className={`record-button ${recording?'recording':''}`} aria-label={recording?'结束录音并发送':'开始录音'} disabled={busy||speaking||guideBusy!==null} onClick={()=>recording?(recorder.current?.state==='recording'&&recorder.current.stop()):void startRecording()}>{busy?<span className="spinner"/>:recording?<Square size={24} fill="currentColor"/>:<Mic size={28}/>}</button><strong aria-live="polite">{recording?`正在听你说 · ${seconds}″`:busy?'保存声音，准备下一句…':speaking?'先听完这段声音':'点一下，开始说话'}</strong><p>{recording?'说完再点一下，录音结束后直接进入下一句':'每条 1–45 秒 · 不识别内容，不评价对错'}</p><button className="hint-toggle" disabled={recording||busy} onClick={()=>setHints(!hints)}><Sparkles size={14}/>{hints?'收起表达提示':'不知道怎么说？看看表达提示'}<ArrowDown size={13}/></button></div></>}
          {error&&<div className="error-message" role="alert">{error}{pending&&!busy&&<button className="text-button" onClick={()=>void send(pending.blob,pending.duration)}>重试发送这条录音 <ArrowRight size={14}/></button>}</div>}
          <p className="room-footnote"><LockKeyhole size={12}/> 固定剧本 · 录完即推进 · 已生成语音不重复合成</p>
        </section></div></div>;
}
