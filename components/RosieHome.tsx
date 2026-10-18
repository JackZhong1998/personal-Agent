'use client';
import Link from 'next/link';
import Image from 'next/image';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight,Mic,Pause,Plane,PencilLine,Square,Volume2} from 'lucide-react';
import {useLearningState} from './useLearningState';
import {useJourneyAudio} from './useJourneyAudio';
import {NameSetup} from './NameSetup';
import {RosieCredits} from './RosieCredits';
import {learningSummary} from '@/lib/learning/progress';
import {COMPANION} from '@/lib/learning/content';
import type {HomeMessage} from '@/lib/home-chat';
type Recognizer={lang:string;interimResults:boolean;continuous:boolean;onresult:((e:{resultIndex:number;results:ArrayLike<{0:{transcript:string};isFinal:boolean}>})=>void)|null;onend:(()=>void)|null;onerror:((e:{error:string})=>void)|null;start:()=>void;stop:()=>void;abort:()=>void};
export function RosieHome(){
 const learning=useLearningState(),audio=useJourneyAudio();
 const [messages,setMessages]=useState<HomeMessage[]>([]),[ready,setReady]=useState<boolean|null>(null),[listening,setListening]=useState(false),[draft,setDraft]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[settings,setSettings]=useState(false),[language,setLanguage]=useState('en-US');
 const recognition=useRef<Recognizer|null>(null),requestId=useRef(''),alive=useRef(true),feed=useRef<HTMLDivElement>(null);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;recognition.current?.abort();};},[]);
 useEffect(()=>{if(!learning.loaded)return;let cancelled=false;void fetch('/api/chat',{cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||'对话暂时未同步');if(!cancelled){setMessages(d.messages);setReady(d.ready);}}).catch(e=>{if(!cancelled)setError(e.message);});return()=>{cancelled=true;};},[learning.loaded]);
 useEffect(()=>{feed.current?.scrollTo({top:feed.current.scrollHeight,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});},[messages.length,draft,busy]);
 function listen(){
  audio.clear();setError('');setDraft('');requestId.current='';
  const w=window as unknown as {SpeechRecognition?:new()=>Recognizer;webkitSpeechRecognition?:new()=>Recognizer},Ctor=w.SpeechRecognition||w.webkitSpeechRecognition;
  if(!Ctor){setError('此浏览器不支持语音识别，请用 Safari 或 Chrome 打开。');return;}
  const r=new Ctor();recognition.current?.abort();recognition.current=r;r.lang=language;r.continuous=false;r.interimResults=true;
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
 <div className="chat-backdrop" aria-hidden="true"><Image src="/rosie/rosie-portrait.jpg" alt="" fill sizes="100vw" priority/><div/></div>
 <header className="chat-header"><div className="chat-identity"><Image src="/rosie/rosie-rimowa.jpg" alt="Rosie 头像" width={44} height={44}/><div><h1>Rosie</h1><small>AI 角色 · 合成配音</small></div></div><button className="text-button" aria-label="修改称呼" onClick={()=>setSettings(!settings)}>{learning.name||'你的称呼'}<PencilLine size={14}/></button></header>
 <main className="chat-main"><div className="home-chat-feed" ref={feed} aria-label="与 Rosie 的日常对话">
 <div className="scene-cards"><Link className="home-travel-entry" href="/travel"><span className="travel-entry-icon"><Plane size={21}/></span><span><h2>一起去美国</h2><p>英语旅行 · {summary.completed}/7 章</p></span><ArrowRight size={18}/></Link></div>
 {(!learning.progress.companionId||settings)&&learning.loaded?<div className="home-welcome"><NameSetup initial={learning.name} onSave={async name=>{await learning.choose(name);setSettings(false);}}/>{settings&&<button className="text-button" onClick={()=>setSettings(false)}>取消</button>}</div>:<>
 <article className="home-rosie-line"><span>ROSIE</span><p lang="en">{COMPANION.intro}</p><small lang="zh-CN">嗨，我是 Rosie。我们可以一起慢慢经历每一段小冒险。准备好看看今天会带来什么了吗？</small><button className="chat-audio-button" disabled={audio.busy} onClick={()=>void audio.play({target:'preview'})} aria-label="听 Rosie 打招呼"><Volume2 size={16}/></button></article>
 {messages.map(m=><div className="home-exchange" key={m.id}><article className="home-user-line"><span>{learning.name||'YOU'}</span><p>{m.user}</p></article><article className="home-rosie-line"><span>ROSIE</span><p lang="en">{m.english}</p><small lang="zh-CN">{m.chinese}</small><button className="chat-audio-button" disabled={audio.busy} onClick={()=>void audio.play({target:'chat',messageId:m.id})} aria-label="重听 Rosie 的回应"><Volume2 size={16}/></button></article></div>)}
 {busy&&<p className="home-thinking" role="status"><span className="spinner"/>正在回复…</p>}
 </>}
 </div></main>
 <div className="chat-bottom"><div className="chat-composer-inner">
 {draft&&<div className="voice-draft"><p>{draft}</p>{!listening&&<div><button className="text-button" onClick={listen} disabled={busy}>重新说</button><button className="primary-button" onClick={()=>void send()} disabled={busy}>{busy?'发送中…':'发送'}<ArrowRight size={15}/></button></div>}</div>}
 {(error||learning.error||audio.error)&&<p className="error-message" role="alert">{error||learning.error||audio.error}{learning.error&&<button onClick={()=>void learning.load()}>重新同步</button>}</p>}
 {ready===false&&learning.progress.companionId&&<p className="home-service-note">对话服务未连接</p>}
 {learning.progress.companionId&&!settings&&<div className="home-voice-controls"><button className={'home-mic '+(listening?'listening':'')} disabled={busy||!learning.loaded} onClick={()=>listening?recognition.current?.stop():listen()}>{listening?<Square size={18}/>:<Mic size={21}/>}<span>{listening?'结束录音':'点击说话'}</span></button><select aria-label="口语识别语言" value={language} onChange={e=>setLanguage(e.target.value)} disabled={listening||busy}><option value="en-US">EN</option><option value="zh-CN">中文</option></select>{audio.playing&&<button className="icon-button" onClick={audio.stop} aria-label="暂停 Rosie 的语音"><Pause size={18}/></button>}</div>}
 <div className="chat-fine-print"><span>{audio.note||'非官方 AI 演绎 · 与 ROSÉ 本人及团队无关联'}</span><RosieCredits/></div>
 </div></div></div>;
}
