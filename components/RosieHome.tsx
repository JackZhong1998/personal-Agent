'use client';
import Link from 'next/link';
import Image from 'next/image';
import {useCallback,useEffect,useRef,useState} from 'react';
import {ArrowRight,Mic,Pause,Plane,ChevronDown,Plus,Square,Volume2} from 'lucide-react';
import {useLearningState} from './useLearningState';
import {useJourneyAudio} from './useJourneyAudio';
import {CharacterDrawer} from './CharacterDrawer';
import {learningSummary} from '@/lib/learning/progress';
import {COMPANION} from '@/lib/learning/content';
import type {HomeMessage} from '@/lib/home-chat';
type Recognizer={lang:string;interimResults:boolean;continuous:boolean;onresult:((e:{resultIndex:number;results:ArrayLike<{0:{transcript:string};isFinal:boolean}>})=>void)|null;onend:(()=>void)|null;onerror:((e:{error:string})=>void)|null;start:()=>void;stop:()=>void;abort:()=>void};
export function RosieHome(){
 const learning=useLearningState(),audio=useJourneyAudio();
 const [messages,setMessages]=useState<HomeMessage[]>([]),[listening,setListening]=useState(false),[draft,setDraft]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[drawerOpen,setDrawerOpen]=useState(false),[editProfile,setEditProfile]=useState(false);
 const drawerTrigger=useRef<HTMLButtonElement>(null),previousDrawer=useRef(false);
 useEffect(()=>{if(previousDrawer.current&&!drawerOpen)drawerTrigger.current?.focus();previousDrawer.current=drawerOpen;},[drawerOpen]);
 const closeDrawer=useCallback(()=>setDrawerOpen(false),[]);
 useEffect(()=>{const bodyOverflow=document.body.style.overflow,htmlOverflow=document.documentElement.style.overflow;document.body.style.overflow='hidden';document.documentElement.style.overflow='hidden';return()=>{document.body.style.overflow=bodyOverflow;document.documentElement.style.overflow=htmlOverflow;};},[]);
 const recognition=useRef<Recognizer|null>(null),requestId=useRef(''),alive=useRef(true),feed=useRef<HTMLDivElement>(null);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;recognition.current?.abort();};},[]);
 useEffect(()=>{if(!learning.loaded)return;let cancelled=false;void fetch('/api/chat',{cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||'对话暂时未同步');if(!cancelled){setMessages(d.messages);}}).catch(e=>{if(!cancelled)setError(e.message);});return()=>{cancelled=true;};},[learning.loaded]);
 useEffect(()=>{feed.current?.scrollTo({top:feed.current.scrollHeight,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});},[messages.length,draft,busy]);
 function listen(){
  if(!learning.progress.companionId){setEditProfile(true);setDrawerOpen(true);return;}
  audio.clear();setError('');setDraft('');requestId.current='';
  const w=window as unknown as {SpeechRecognition?:new()=>Recognizer;webkitSpeechRecognition?:new()=>Recognizer},Ctor=w.SpeechRecognition||w.webkitSpeechRecognition;
  if(!Ctor){setError('此浏览器不支持语音识别，请用 Safari 或 Chrome 打开。');return;}
  const r=new Ctor();recognition.current?.abort();recognition.current=r;r.lang='en-US';r.continuous=false;r.interimResults=true;
  r.onresult=e=>{if(alive.current&&recognition.current===r)setDraft(Array.from(e.results).map(result=>result[0].transcript).join(' ').slice(0,1000));};
  r.onerror=e=>{if(alive.current&&recognition.current===r){setListening(false);setError(e.error==='not-allowed'?'请允许浏览器使用麦克风。':e.error==='no-speech'?'没有听清，再说一次吧。':'语音识别暂时不可用，请重试。');}};
  r.onend=()=>{if(alive.current&&recognition.current===r)setListening(false);};try{r.start();setListening(true);}catch{setError('麦克风暂时无法启动，请重试。');}
 }
 async function send(){
  if(!draft.trim()||busy)return;setBusy(true);setError('');recognition.current?.stop();requestId.current||=crypto.randomUUID();
  try{const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:requestId.current,message:draft.trim()})});const d=await r.json();if(!r.ok)throw new Error(d.error||'暂时未收到回应');if(alive.current){setMessages(a=>a.some(m=>m.id===d.message.id)?a:[...a,d.message]);setDraft('');requestId.current='';void audio.play({target:'chat',messageId:d.message.id});}}
  catch(e){if(alive.current)setError((e as Error).message);}finally{if(alive.current)setBusy(false);}
 }
 const summary=learningSummary(learning.progress);
 return <div className="rosie-home chat-home">
 <header className="chat-header" inert={drawerOpen}><button className="chat-identity" ref={drawerTrigger} aria-label="选择角色" aria-expanded={drawerOpen} aria-haspopup="dialog" onClick={()=>{setEditProfile(false);setDrawerOpen(true);}}><Image src="/rosie/rosie-rimowa.jpg" alt="" width={40} height={40}/><h1>Rosé</h1><ChevronDown size={15}/></button><Link className="icon-button add-scene" href="/scenes/new" aria-label="新增场景"><Plus size={23}/></Link></header>
 <main className="chat-main" inert={drawerOpen}><div className="home-chat-feed" ref={feed} aria-label="与 Rosé 的日常对话">
 <div className="scene-cards"><Link className="home-travel-entry" href="/travel"><span className="travel-entry-icon"><Plane size={21}/></span><span><h2>一起去美国</h2><p>英语旅行 · {summary.completed}/7 章</p></span><ArrowRight size={18}/></Link></div>
 <article className="home-rosie-line"><p lang="en">{COMPANION.intro}</p><small lang="zh-CN">嗨，我是 Rosé。我们可以一起慢慢经历每一段小冒险。准备好看看今天会带来什么了吗？</small><button className="chat-audio-button" disabled={audio.busy} onClick={()=>void audio.play({target:'preview'})} aria-label="听 Rosé 打招呼"><Volume2 size={16}/></button></article>
 {messages.map(m=><div className="home-exchange" key={m.id}><article className="home-user-line"><p>{m.user}</p></article><article className="home-rosie-line"><p lang="en">{m.english}</p><small lang="zh-CN">{m.chinese}</small><button className="chat-audio-button" disabled={audio.busy} onClick={()=>void audio.play({target:'chat',messageId:m.id})} aria-label="重听 Rosé 的回应"><Volume2 size={16}/></button></article></div>)}
 {busy&&<p className="home-thinking" role="status"><span className="spinner"/>正在回复…</p>}
 </div></main>
 <div className="chat-bottom" inert={drawerOpen}><div className="chat-composer-inner">
 {draft&&<div className="voice-draft"><p>{draft}</p>{!listening&&<div><button className="text-button" onClick={listen} disabled={busy}>重新说</button><button className="primary-button" onClick={()=>void send()} disabled={busy}>{busy?'发送中…':'发送'}<ArrowRight size={15}/></button></div>}</div>}
 {(error||learning.error||audio.error)&&<p className="error-message" role="alert">{error||learning.error||audio.error}{learning.error&&<button onClick={()=>void learning.load()}>重新同步</button>}</p>}
 {<div className="home-voice-controls"><button className={'home-mic '+(listening?'listening':'')} disabled={busy||!learning.loaded} onClick={()=>listening?recognition.current?.stop():listen()}>{listening?<Square size={18}/>:<Mic size={21}/>}<span>{listening?'结束录音':'点击说话'}</span></button>{audio.playing&&<button className="icon-button" onClick={audio.stop} aria-label="暂停 Rosé 的语音"><Pause size={18}/></button>}</div>}
 </div></div>
 {drawerOpen&&<CharacterDrawer name={learning.name} registered={!!learning.progress.companionId} initialEditing={editProfile} onSave={learning.choose} onClose={closeDrawer}/>}
 </div>;
}
