'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, AudioLines, BookOpen, Check, ChevronRight, CircleHelp, Coffee, Compass, Flame, Heart, Headphones, Leaf, LockKeyhole, MapPin, Mic, MoreHorizontal, Pause, Play, Settings2, ShieldCheck, Sparkles, Sprout, Square, Sun, Volume2, X } from 'lucide-react';
import { chapters, localDay, relationship, stages, emptyProgress, FAMILIARITY_MAX, AFFECTION_MAX, FICTION_NOTICE, type Chapter, type Progress } from '@/lib/story';
import {VoiceRoom} from '@/components/VoiceRoom';
import type {ConversationView as Session} from '@/lib/client-types';
import { Scene, Portrait } from '@/components/Scene';

type Tab='today'|'story'|'memories'|'relationship';
type Profile={name:string;romance:boolean;adult:boolean};
type Status={roleVoice:boolean;guideVoice:boolean;storage:string;session:boolean};

const nav=[{id:'today' as Tab,label:'今日相伴',icon:Sun},{id:'story' as Tab,label:'我们的故事',icon:BookOpen},{id:'memories' as Tab,label:'回忆收藏',icon:Headphones},{id:'relationship' as Tab,label:'关系旅程',icon:Heart}];
async function request<T>(url:string,body?:unknown):Promise<T>{
  const res=await fetch(url,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{cache:'no-store'});
  const data=await res.json(); if(!res.ok)throw new Error(data.error||'连接暂时出了点问题，请重试');return data;
}

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
  const [progress,setProgress]=useState<Progress>(emptyProgress);
  const [status,setStatus]=useState<Status|null>(null);const [selected,setSelected]=useState<Chapter|null>(null);
  const [onboard,setOnboard]=useState(false);const [settings,setSettings]=useState(false);const [about,setAbout]=useState(false);
  const [name,setName]=useState('');const [adult,setAdult]=useState(false);const [romance,setRomance]=useState(true);
  const [session,setSession]=useState<Session|null>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const [toast,setToast]=useState('');const [ready,setReady]=useState(false);
  const refresh=useCallback(()=>request<Progress>('/api/progress').then(setProgress).catch(()=>setToast('进度暂时未能同步，页面仍可浏览。')),[]);
  useEffect(()=>{
    try{const p=localStorage.getItem('between-profile');if(p){const saved=JSON.parse(p);setProfile(saved);setName(saved.name);setRomance(saved.romance);setAdult(saved.adult);}}catch{}
    request<Status>('/api/status').then(setStatus).catch(()=>{});
    try{if(!localStorage.getItem('between-profile'))request<{displayName:string}>('/api/profile').then(p=>{if(p.displayName)setName(p.displayName);}).catch(()=>{});}catch{}
    void refresh();setReady(true);
  },[refresh]);
  useEffect(()=>{if(toast){const t=setTimeout(()=>setToast(''),5500);return()=>clearTimeout(t);}},[toast]);
  const rel=relationship(progress);
  const day=localDay(progress.timeZone);const today=progress.completions.filter(c=>c.day===day);
  const next=chapters.find(c=>!progress.completions.some(x=>x.chapterId===c.id))||chapters[0];
  const index=chapters.indexOf(next);const featured=chapters.slice(index,Math.min(index+2,chapters.length));
  const finished=(id:string)=>progress.completions.some(c=>c.chapterId===id);
  const unlocked=(c:Chapter)=>chapters.indexOf(c)===0||finished(chapters[chapters.indexOf(c)-1].id);
  const openChapter=(c:Chapter)=>{setError('');setSelected(c);if(!profile?.adult)setOnboard(true);};
  const closeSelected=useCallback(()=>{if(!busy)setSelected(null);},[busy]);
  const closeOnboard=useCallback(()=>{setOnboard(false);setSelected(null);},[]);
  const closeSettings=useCallback(()=>setSettings(false),[]);const closeAbout=useCallback(()=>setAbout(false),[]);
  async function saveProfile(closeSettingsAfter=false){
    if(!name.trim()){setError('先告诉她，希望怎么称呼你。');return;}
    setBusy(true);setError('');
    try{
      const result=await request<{displayName:string}>('/api/profile',{displayName:name.trim()});
      const p={name:result.displayName,adult:closeSettingsAfter?profile?.adult||false:adult,romance:true};
      setProfile(p);try{localStorage.setItem('between-profile',JSON.stringify(p));}catch{}
      setOnboard(false);if(closeSettingsAfter){setSettings(false);setToast('称呼已保存，新开的对话会使用这个名字。');}
    }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  async function begin(replay=false){
    if(!selected)return;setBusy(true);setError('');
    try{const s=await request<Session>('/api/conversation/start',{chapterId:selected.id,replay,displayName:profile?.name||name.trim()});setSession(s);setSelected(null);}
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
          <div className="greeting-row"><div><p className="eyebrow"><span/> YOUR DAILY LITTLE CONNECTION</p><h1>{profile?`你好，${profile.name}`:'今天，也想听见你的声音'}<span className="title-spark">✳︎</span></h1><p className="subtitle">一个平行时空的小故事。与 BLACKPINK 的 ROSÉ，从意外相遇到慢慢相恋。</p></div><div className="date-tag"><Sun size={17}/><span>{ready?new Intl.DateTimeFormat('zh-CN',{timeZone:progress.timeZone,month:'long',day:'numeric',weekday:'long'}).format(new Date()):'属于今天的小期待'}</span></div></div>
          <div className="dashboard-grid"><div className="primary-column">
            <section className="hero-card"><div className="hero-art"><Scene/><div className="art-caption"><span className="live-dot"/> A STORY WAITING FOR YOU</div></div><div className="hero-overlay"/><div className="hero-copy"><div className="hero-pill"><Sparkles size={13}/> ROSÉ · 非官方虚构同人故事</div><h2>和 ROSÉ，<br/>从一句 hello 到我们。</h2><p>拿错的咖啡、舍不得挂的晚安。<br/>在每一次声音里，把陌生聊成喜欢。</p><button className="primary-button" onClick={()=>openChapter(next)}>{progress.completions.length?'继续我们的故事':'开启第一章'}<ArrowRight size={17}/></button><span className="hero-footnote"><Headphones size={13}/> 虚构剧情 · 合成配音 · 非本人参与</span></div><span className="hero-number">01 — 12</span></section>
            <div className="section-heading"><div><h2>今天的两个小章节 <span className="little-line"/></h2><p>不赶进度，好好聊完，就是今天的小成就。</p></div><button className="text-button" onClick={()=>setTab('story')}>全部故事 <ArrowRight size={15}/></button></div>
            <div className="chapter-grid">{featured.map((c,i)=><ChapterCard key={c.id} chapter={c} available={unlocked(c)} done={finished(c.id)} onClick={()=>unlocked(c)?openChapter(c):setToast('聊完上一章，就能解锁这一段故事。')} featured={i===0}/>)}</div>
            <div className="gentle-banner"><span className="mini-flower">✳︎</span><div><strong>你的故事，有自己的节奏。</strong><p>每一次回应，都点亮一点熟悉与心动。忙的时候，随时回来继续。</p></div><span className="banner-script">a little, every day.</span></div>
          </div><aside className="right-column">
            <section className="daily-card"><div className="card-heading"><h3>今天的小约定</h3><span className="tiny-icon"><Sun size={17}/></span></div><div className="daily-progress"><div className="progress-ring" style={{'--progress':`${Math.min(100,today.length*50)}%`} as React.CSSProperties}><div><strong>{Math.min(2,today.length)}<small>/ 2</small></strong><span>今日章节</span></div></div><p>{today.length>=2?'今天的小约定，完成啦':'给彼此一点时间'}<small>{today.length>=2?'星光奖励已收好':'每天两章，额外收藏 20 星光'}</small></p></div><div className="daily-rewards"><span><Sprout size={15}/> 每句熟悉度 <b>+2</b></span><span><Heart size={14}/> 每句心动值 <b>+1</b></span></div><div className="daily-divider"/><div className="streak-line"><Flame size={17}/><span>已完成 <strong>{progress.completions.length}</strong> 个故事章节</span><span className="small-pill">慢慢积累</span></div></section>
            <section className="alex-card"><div className="card-heading"><h3>你的故事搭档</h3><span className="small-pill sage">AI 角色</span></div><div className="alex-intro"><Portrait className="avatar-portrait"/><div><h3>ROSÉ <span>♡</span></h3><p>BLACKPINK · 平行时空的她</p><span className="alex-tag">♬ 非官方同人角色 · 合成配音</span></div></div><p className="alex-quote">“Five more minutes?<br/> The tiniest five, I promise.”</p><div className="alex-traits"><span>俏皮温柔</span><span>小小撒娇</span><span>慢慢心动</span></div><button className="alex-link" onClick={()=>setTab('relationship')}>现在的你们 <span>{rel.stage.label}<ChevronRight size={15}/></span></button></section>
            <section className="voice-note"><span className="voice-note-icon"><AudioLines size={21}/></span><div><h3>一条语音，一张小小日常</h3><p>听见她的语音，也收到她分享的场景图片。<br/>听不懂时，点一下就能看中文。</p></div></section>
          </aside></div>
        </>}
        {tab==='story'&&<><PageTitle eyebrow="YOUR STORY, ONE CHAPTER AT A TIME" title="我们的故事" subtitle="十二个虚构生活章节，每章 20 轮。咖啡馆初遇、睡前撒娇、约会与恋爱日常。"/><div className="story-season"><span>SEASON 01</span><h2>从陌生到心动</h2><p>{progress.completions.length} / 12 章 · 每章 20 轮语音互动</p><Scene variant="sunset"/></div><div className="all-chapters">{chapters.map(c=><ChapterCard key={c.id} chapter={c} available={unlocked(c)} done={finished(c.id)} onClick={()=>unlocked(c)?openChapter(c):setToast('先完成上一章，再一起走向下一章吧。')}/>)}</div></>}
        {tab==='memories'&&<><PageTitle eyebrow="SMALL MOMENTS, WORTH KEEPING" title="回忆收藏" subtitle="聊过的故事，留下的声音。属于你的每一次开口，都值得被记住。"/>{progress.completions.length===0?<div className="empty-state"><div className="empty-art"><Headphones size={40}/><span>✧</span></div><h2>第一段回忆，等你来收藏</h2><p>完成一个章节后，它就会留在这里。<br/>你可以重听角色语音，也可以听见自己的进步。</p><button className="primary-button" onClick={()=>{setTab('today');openChapter(chapters[0]);}}>去认识 ROSÉ <ArrowRight size={16}/></button></div>:<div className="memory-list">{progress.completions.map(c=>{const ch=chapters.find(x=>x.id===c.chapterId)!;return <button key={c.chapterId} className="memory-card" onClick={()=>openChapter(ch)}><Scene variant={ch.color}/><span><small>{c.day} · CHAPTER {ch.number}</small><h2>{ch.title}</h2><p>{ch.english}</p></span><Headphones size={24}/><ChevronRight size={18}/></button>;})}</div>}<div className="privacy-note"><ShieldCheck size={17}/><p>无登录版本通过当前浏览器识别你。清除 Cookie 后将无法找回原记录；暂不支持跨设备同步。</p></div></>}
        {tab==='relationship'&&<><PageTitle eyebrow="CLOSER, AT YOUR OWN PACE" title="关系旅程" subtitle="每一句回应，都有一份看得见的心动。这些数值记录虚构剧情参与，不评价真实情感。"/><section className="relationship-hero"><Portrait/><div><span className="eyebrow">YOU & ROSÉ</span><h2>{rel.stage.label}</h2><p>{rel.stage.description}</p><span className="small-pill">{FICTION_NOTICE}</span></div><span className="relationship-flower">✳︎</span></section><div className="stat-grid"><section><Sprout/><h3>熟悉度 <strong>{rel.familiarity}<small>/{FAMILIARITY_MAX}</small></strong></h3><div className="bar"><i style={{width:`${rel.familiarity/FAMILIARITY_MAX*100}%`}}/></div><p>每个新互动 +2 · 已互动 {rel.turns} 次</p></section><section><Heart/><h3>心动值 <strong>{rel.affection}<small>/{AFFECTION_MAX}</small></strong></h3><div className="bar rose"><i style={{width:`${rel.affection/AFFECTION_MAX*100}%`}}/></div><p>每个新互动 +1 · 已收藏 {rel.sparks} 星光</p></section></div><div className="section-heading"><div><h2>每个阶段，都有好风景</h2><p>熟悉度解锁旅程阶段，章节按故事顺序推进。</p></div></div><div className="journey">{stages.map((s,i)=><div key={s.label} className={rel.familiarity>=s.threshold?'reached':''}><span>{rel.familiarity>=s.threshold?<Check size={19}/>:<LockKeyhole size={17}/>}</span><small>0{i+1} · 熟悉度 {s.threshold}</small><h3>{s.label}</h3><p>{s.description}</p></div>)}</div><div className="rules-card"><Sparkles/><div><h3>把陪伴留给生活，也把生活留给自己</h3><p>每句首次回应获得熟悉度 +2、心动值 +1、星光 +5。重复互动获得星光 +1；重复请求和单纯重听不加分。每天前两章首次完成各额外获得 10 星光。中断不扣分，所有结算由服务端保存。固定剧情不识别录音内容；关系阶段不等于对你的情感评价。</p></div></div></>}
        <footer className="page-footer"><span>between. <i>Small talks. Real progress.</i></span><span>ROSÉ 非官方虚构同人 · 合成配音 · 场景图片为插画</span></footer>
      </main>
      <nav className="mobile-nav" aria-label="移动端导航">{nav.map(n=><button key={n.id} className={tab===n.id?'active':''} aria-current={tab===n.id?'page':undefined} onClick={()=>setTab(n.id)}><n.icon size={21}/><span>{n.label}</span></button>)}</nav>
    </div>
    {toast&&<div className="toast" role="status">{toast}<button onClick={()=>setToast('')} aria-label="关闭提示"><X size={15}/></button></div>}
    {onboard&&<Modal title="开始你的声音旅程" onClose={closeOnboard}><div className="onboard-icon"><Sprout size={33}/></div><p className="eyebrow">A NEW LITTLE BEGINNING</p><h2>故事开始前，认识一下你。</h2><p className="modal-description">先告诉 ROSÉ，希望她怎么叫你。这个名字会出现在角色语音和中文翻译里。</p><label className="field-label">她应该怎么称呼你？<input value={name} maxLength={20} onChange={e=>setName(e.target.value)} placeholder="你的名字，或希望她叫你的昵称" autoComplete="nickname"/></label><div className="fiction-card">ROSÉ · 非官方虚构同人故事。所有对话、场景与关系均为创作，使用合成配音，与本人及所属团队无关联。</div><label className="consent"><input type="checkbox" checked={adult} onChange={e=>setAdult(e.target.checked)}/><span>我已满 18 岁，理解这是以 ROSÉ 为角色的虚构同人剧情，并同意录音保存用于对话回放。</span></label><button className="primary-button full" disabled={!adult||!name.trim()||busy} onClick={()=>void saveProfile()}>准备好认识 ROSÉ 了 <ArrowRight size={17}/></button>{error&&<p className="error-message" role="alert">{error}</p>}<p className="microcopy">称呼 1–20 字，可使用中文或英文。录音仅在你点击后开始。</p></Modal>}
    {selected&&!onboard&&<Modal title={selected.title} onClose={closeSelected} wide><div className="chapter-preview"><Scene variant={selected.color}/><div><p className="eyebrow">CHAPTER {selected.number} · {selected.place}</p><h2>{selected.title}</h2><p className="serif-line">{selected.english}</p><p className="modal-description">{selected.description}</p><div className="preview-tags"><span><Mic size={15}/> 20 轮语音互动</span><span><BookOpen size={15}/> 沉浸式同人剧情</span></div><div className="preview-note"><Headphones size={18}/><p>点击开始才生成第一句角色语音。之后每完成一次录音，再进入下一句；已生成的语音会保存复用。</p></div>{status&&!status.roleVoice&&<div className="notice">角色语音尚未配置。页面与章节可浏览，真实对话需先在服务端配置 Cartesia。</div>}{error&&<p role="alert" className="error-message">{error}</p>}<button className="primary-button full" disabled={busy} onClick={()=>begin(false)}>{busy?'准备这次相遇…':finished(selected.id)?'打开这段回忆':'进入语音章节'}{!busy&&<ArrowRight size={16}/>}</button>{finished(selected.id)&&<button disabled={busy} className="text-button centered" onClick={()=>begin(true)}>重温这一章（互动可收集星光）</button>}<p className="microcopy">点开语音可看中文 · 20 轮互动 · 可随时暂停</p></div></div></Modal>}
    {session&&<VoiceRoom session={session} onSession={setSession} onClose={closeRoom} onProgress={setProgress}/>}
    {settings&&<Modal title="个人设置" onClose={closeSettings}><p className="eyebrow">YOUR LITTLE SPACE</p><h2>按你舒服的方式</h2><p className="modal-description">称呼保存到当前匿名用户的服务端记录，不需要账号。</p><label className="field-label">你的昵称<input value={name} maxLength={20} onChange={e=>setName(e.target.value)} placeholder="新朋友"/></label><div className="settings-status"><h3>服务状态</h3><p><span>角色声音</span><b>{status?.roleVoice?'已配置 · 按需生成':'等待配置'}</b></p><p><span>英文提示读音</span><b>{status?.guideVoice?'已配置 edge-tts':'等待配置'}</b></p><p><span>记录保存</span><b>{status?.storage==='supabase'?'Supabase':status?.storage==='local'?'本地开发存储':'等待配置'}</b></p><small>配置状态不代表外部服务连通性已验证。</small></div><div className="notice">称呼会在新开的章节或重新开始的对话中生效。正在进行的章节与历史语音保留原称呼。其余台词为预写剧情，不根据录音内容改写。</div>{error&&<p className="error-message" role="alert">{error}</p>}<button className="primary-button full" disabled={busy||!name.trim()} onClick={()=>void saveProfile(true)}>保存称呼 <Check size={17}/></button><p className="microcopy">暂无登录和支付功能。请保留当前浏览器 Cookie。</p></Modal>}
    {about&&<Modal title="关于 Between" onClose={closeAbout}><div className="onboard-icon"><AudioLines size={32}/></div><p className="eyebrow">SMALL TALKS. REAL PROGRESS.</p><h2>让每一次开口，都更靠近。</h2><p className="modal-description">Between 是以 BLACKPINK 的 ROSÉ 为角色的非官方虚构同人语音故事。相识、暧昧、约会与相恋均为创作，与本人及所属团队无关联。角色使用合成配音，图片为场景插画。</p><div className="about-points"><p><BookOpen/> 十二章预写故事，每章 20 次语音互动。</p><p><Mic/> 你发送语音，她回复语音与场景图片。</p><p><Volume2/> 她的语音可点开中文，你也可以参考英文回应。</p><p><ShieldCheck/> 不分析你的录音，不生成口语评分。</p></div><button className="primary-button full" onClick={closeAbout}>好好说一句 hello <Heart size={17}/></button></Modal>}
  </div>;
}
function PageTitle({eyebrow,title,subtitle}:{eyebrow:string;title:string;subtitle:string}){return <div className="page-title"><p className="eyebrow"><span/>{eyebrow}</p><h1>{title}<span className="title-spark">✳︎</span></h1><p className="subtitle">{subtitle}</p></div>;}
function ChapterCard({chapter:c,available,done,onClick,featured=false}:{chapter:Chapter;available:boolean;done:boolean;onClick:()=>void;featured?:boolean}){
  return <button className={`chapter-card ${!available?'locked':''}`} onClick={onClick} aria-label={`${c.title}，${done?'已完成':available?'可开始':'未解锁'}`}><div className="chapter-art"><Scene variant={c.color}/><span className="chapter-number">CHAPTER {c.number}</span><span className={`chapter-state ${done?'done':''}`}>{done?<><Check size={12}/> 已完成</>:available?<><span className="live-dot"/>{featured?'等待开启':'可开始'}</>:<><LockKeyhole size={11}/> 待解锁</>}</span></div><div className="chapter-body"><span className="chapter-place"><MapPin size={12}/>{c.place}<span>20 轮对话</span></span><h3>{c.title}<span className="round-arrow">{available?<ArrowRight size={15}/>:<LockKeyhole size={13}/>}</span></h3><p>{c.english}</p><div className="chapter-tags">{c.tags.map(t=><span key={t}>{t}</span>)}<span className="chapter-reward"><Sprout size={12}/> 每句 +2</span></div></div></button>;
}
