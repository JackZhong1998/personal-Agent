'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Check, CircleHelp, Heart, Headphones, LockKeyhole, Play, Settings2, Sun, X } from 'lucide-react';
import { chapters, localDay, relationship, stages, emptyProgress, FAMILIARITY_MAX, AFFECTION_MAX, type Chapter, type Progress } from '@/lib/story';
import {VoiceRoom} from '@/components/VoiceRoom';
import type {ConversationView as Session} from '@/lib/client-types';

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
    <aside className="sidebar"><a className="brand" href="/">between<span>.</span></a><nav aria-label="主导航">{nav.map(n=><button key={n.id} onClick={()=>setTab(n.id)} className={'nav-item '+(tab===n.id?'active':'')} aria-current={tab===n.id?'page':undefined}><n.icon size={19}/>{n.label}</button>)}</nav><div className="sidebar-bottom"><button onClick={()=>setAbout(true)}><CircleHelp size={18}/>关于</button><button onClick={()=>setSettings(true)}><span className="user-avatar">{profile?.name?.slice(0,1)||'你'}</span>{profile?.name||'个人设置'}<Settings2 size={17}/></button></div></aside>
    <div className="main-shell"><header className="topbar"><span className="breadcrumb">BETWEEN <span>/</span> {nav.find(n=>n.id===tab)?.label}</span><button className="icon-button" onClick={()=>setSettings(true)} aria-label="个人设置"><Settings2 size={19}/></button></header>
    <main>
      {tab==='today'&&<>
        <div className="greeting-row"><div><p className="eyebrow">YOUR DAILY CONNECTION</p><h1>{profile?`你好，${profile.name}`:'今天，聊一会儿。'}</h1></div><span className="date-tag">{ready?new Intl.DateTimeFormat('zh-CN',{timeZone:progress.timeZone,month:'2-digit',day:'2-digit'}).format(new Date()):''}</span></div>
        <section className="hero-card"><div className="hero-copy"><span className="hero-pill">ROSÉ / FICTIONAL STORY</span><h2>{next.title}</h2><p>{next.english}</p><button className="primary-button" onClick={()=>openChapter(next)}>{progress.completions.length?'继续对话':'开启第一章'}<ArrowRight size={18}/></button><small>第 {next.number} 章 · 20 轮语音</small></div><div className="hero-index" aria-hidden="true">{next.number.padStart(2,'0')}<span>ROSÉ × {profile?.name||'YOU'}</span></div></section>
        <div className="overview-grid"><section className="overview-card"><span>今日章节</span><strong>{Math.min(2,today.length)}<small> / 2</small></strong><div className="bar"><i style={{width:`${Math.min(100,today.length*50)}%`}}/></div></section><section className="overview-card"><span>熟悉度</span><strong>{rel.familiarity}<small> / {FAMILIARITY_MAX}</small></strong><span>{rel.stage.label}</span></section><section className="overview-card"><span>心动值</span><strong>{rel.affection}<small> / {AFFECTION_MAX}</small></strong><span>{rel.sparks} 星光</span></section></div>
        <div className="section-heading"><h2>接下来的故事</h2><button className="text-button" onClick={()=>setTab('story')}>全部章节<ArrowRight size={15}/></button></div><div className="chapter-grid">{featured.map(c=><ChapterCard key={c.id} chapter={c} available={unlocked(c)} done={finished(c.id)} onClick={()=>unlocked(c)?openChapter(c):setToast('完成上一章后解锁。')}/>)}</div>
      </>}
      {tab==='story'&&<><PageTitle eyebrow="THE STORY" title="我们的故事" subtitle="12 章 · 每章 20 轮"/><div className="all-chapters">{chapters.map(c=><ChapterCard key={c.id} chapter={c} available={unlocked(c)} done={finished(c.id)} onClick={()=>unlocked(c)?openChapter(c):setToast('完成上一章后解锁。')}/>)}</div></>}
      {tab==='memories'&&<><PageTitle eyebrow="SAVED MOMENTS" title="回忆收藏" subtitle={`${progress.completions.length} 个已完成章节`}/>{!progress.completions.length?<section className="empty-state"><Headphones size={30}/><h2>还没有回忆</h2><p>完成章节后，可在这里重听。</p><button className="primary-button" onClick={()=>openChapter(chapters[0])}>开始对话<ArrowRight size={16}/></button></section>:<div className="memory-list">{progress.completions.map(c=>{const ch=chapters.find(x=>x.id===c.chapterId)!;return <button className="memory-card" key={c.chapterId} onClick={()=>openChapter(ch)}><span className="chapter-ordinal">{ch.number}</span><span><h2>{ch.title}</h2><small>{c.day}</small></span><Play size={18}/></button>;})}</div>}<p className="privacy-note">记录绑定当前浏览器，请保留 Cookie。</p></>}
      {tab==='relationship'&&<><PageTitle eyebrow="YOUR CONNECTION" title="关系旅程" subtitle="虚构故事中的成长记录"/><section className="relationship-hero"><span>你与 ROSÉ</span><h2>{rel.stage.label}</h2><p>{rel.stage.description}</p></section><div className="stat-grid"><section><span>熟悉度</span><strong>{rel.familiarity}<small> / {FAMILIARITY_MAX}</small></strong><div className="bar"><i style={{width:`${rel.familiarity/FAMILIARITY_MAX*100}%`}}/></div></section><section><span>心动值</span><strong>{rel.affection}<small> / {AFFECTION_MAX}</small></strong><div className="bar"><i style={{width:`${rel.affection/AFFECTION_MAX*100}%`}}/></div></section></div><div className="journey">{stages.map((s,i)=><div key={s.label} className={rel.familiarity>=s.threshold?'reached':''}><span>{rel.familiarity>=s.threshold?<Check size={16}/>:<LockKeyhole size={16}/>}</span><small>0{i+1} / {s.threshold}</small><h3>{s.label}</h3></div>)}</div><details className="rules-card"><summary>积分规则</summary><p>首次回应：熟悉 +2、心动 +1、星光 +5。重玩：星光 +1。每天前两章首次完成各奖励 10 星光。重听不加分。</p></details></>}
      <footer className="page-footer"><span>BETWEEN © 2026</span><button onClick={()=>setAbout(true)}>非官方虚构故事 · 合成配音</button></footer>
    </main><nav className="mobile-nav" aria-label="移动端导航">{nav.map(n=><button key={n.id} className={tab===n.id?'active':''} aria-current={tab===n.id?'page':undefined} onClick={()=>setTab(n.id)}><n.icon size={20}/><span>{n.label}</span></button>)}</nav></div>
    {toast&&<div className="toast" role="status">{toast}<button onClick={()=>setToast('')} aria-label="关闭提示"><X size={16}/></button></div>}
    {onboard&&<Modal title="开始你的声音旅程" onClose={closeOnboard}><p className="eyebrow">WELCOME</p><h2>怎么称呼你？</h2><label className="field-label">你的名字<input value={name} maxLength={20} onChange={e=>setName(e.target.value)} placeholder="你的名字，或希望她叫你的昵称" autoComplete="nickname"/></label><p className="fiction-card">ROSÉ 非官方虚构同人故事，使用合成配音，与本人及所属团队无关联。</p><label className="consent"><input type="checkbox" checked={adult} onChange={e=>setAdult(e.target.checked)}/><span>我已满 18 岁，理解这是虚构剧情，同意保存录音用于回放。</span></label><button className="primary-button full" disabled={!adult||!name.trim()||busy} onClick={()=>void saveProfile()}>{busy?'保存中…':'准备好认识 ROSÉ 了'}<ArrowRight size={17}/></button>{error&&<p className="error-message" role="alert">{error}</p>}</Modal>}
    {selected&&!onboard&&<Modal title={selected.title} onClose={closeSelected}><p className="eyebrow">CHAPTER {selected.number} / {selected.place}</p><h2>{selected.title}</h2><p className="modal-description">{selected.english}</p><div className="preview-tags"><span>20 轮语音</span><span>中英双语</span><span>进度自动保存</span></div>{status&&!status.roleVoice&&<div className="notice">角色语音尚未配置。</div>}{error&&<p role="alert" className="error-message">{error}</p>}<button className="primary-button full" disabled={busy} onClick={()=>begin(false)}>{busy?'正在准备语音…':finished(selected.id)?'打开这段回忆':'进入语音章节'}{busy?<span className="spinner"/>:<ArrowRight size={17}/>}</button>{finished(selected.id)&&<button className="text-button centered" disabled={busy} onClick={()=>begin(true)}>重新开始</button>}</Modal>}
    {session&&<VoiceRoom session={session} onSession={setSession} onClose={closeRoom} onProgress={setProgress}/>}
    {settings&&<Modal title="个人设置" onClose={closeSettings}><p className="eyebrow">PROFILE</p><h2>个人设置</h2><label className="field-label">你的昵称<input value={name} maxLength={20} onChange={e=>setName(e.target.value)} placeholder="新朋友"/></label><p className="modal-description">新开的对话会使用这个称呼。</p>{error&&<p className="error-message" role="alert">{error}</p>}<button className="primary-button full" disabled={busy||!name.trim()} onClick={()=>void saveProfile(true)}>保存称呼<Check size={17}/></button><details className="settings-status"><summary>服务状态</summary><p><span>角色语音</span><b>{status?.roleVoice?'已配置':'待配置'}</b></p><p><span>提示读音</span><b>{status?.guideVoice?'已配置':'待配置'}</b></p><p><span>存储</span><b>{status?.storage==='supabase'?'Supabase':'本地'}</b></p></details></Modal>}
    {about&&<Modal title="关于 Between" onClose={closeAbout}><p className="eyebrow">ABOUT</p><h2>Between</h2><p className="modal-description">以 ROSÉ 为角色的非官方虚构同人故事，与本人、BLACKPINK 及所属团队无关联。语音为合成配音，图片为场景插画。</p><p className="modal-description">12 章预写剧情，录完即推进，不分析录音内容。无登录版本的记录绑定当前浏览器。</p><button className="primary-button full" onClick={closeAbout}>知道了<Check size={17}/></button></Modal>}
  </div>;
}
function PageTitle({eyebrow,title,subtitle}:{eyebrow:string;title:string;subtitle:string}){return <div className="page-title"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="subtitle">{subtitle}</p></div>;}
function ChapterCard({chapter:c,available,done,onClick}:{chapter:Chapter;available:boolean;done:boolean;onClick:()=>void}){
 return <button className={'chapter-card '+(!available?'locked':'')} onClick={onClick} aria-label={`${c.title}，${done?'已完成':available?'可开始':'未解锁'}`}><div className="chapter-card-top"><span className="chapter-ordinal">{c.number}</span><span className="chapter-state">{done?'已完成':available?'可开始':'待解锁'}</span></div><h3>{c.title}</h3><p>{c.english}</p><div className="chapter-card-bottom"><span>{c.place} · 20 轮</span>{available?<ArrowRight size={19}/>:<LockKeyhole size={16}/>}</div></button>;
}
