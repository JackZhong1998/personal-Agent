'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight,Check,Diamond,Mic,Pause,Plane,Play,Settings2,Square,Volume2,X} from 'lucide-react';
import {useLearningState} from './useLearningState';
import {useJourneyAudio} from './useJourneyAudio';
import {NameSetup} from './NameSetup';
import {RosiePhoto} from './RosiePhoto';
import {RosieCredits} from './RosieCredits';
import {learningSummary} from '@/lib/learning/progress';
import {COMPANION,lessons} from '@/lib/learning/content';
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
 const summary=learningSummary(learning.progress),next=lessons.find(l=>!learning.progress.runs[l.id]?.completedDay)||lessons[0];
 return <div className="rosie-home"><header className="rosie-nav"><Link href="/" className="rosie-wordmark">between<span> / rosie</span></Link><div><Link className="text-button" href="/travel">美国旅行<ArrowRight size={14}/></Link><button className="icon-button" aria-label="设置我的称呼" onClick={()=>setSettings(!settings)}><Settings2 size={18}/></button></div></header>
 <main className="rosie-home-main"><section className="rosie-introduction"><div className="rosie-portrait-wrap"><RosiePhoto/><div className="portrait-caption"><span>YOUR VOICE COMPANION</span><h1>Hi, I'm<br/><em>Rosie.</em></h1><p>陪你聊日常，也陪你一起成长。</p></div><span className="portrait-footnote">非官方 AI 角色演绎 · 合成配音</span></div><div className="home-today"><span><i/> {summary.todayComplete?'今天，也一起往前了一点':'今天的小旅程，等你一起'}</span><div><Diamond size={13}/>{learning.progress.diamonds}<span>·</span>{summary.streak} 天同行</div></div></section>
 <section className="rosie-home-space"><div className="home-conversation-heading"><span className="eyebrow">A LITTLE SPACE FOR US</span><span>{learning.name?`FOR ${learning.name.toUpperCase()}`:'FOR YOU'}</span></div>
 {(!learning.progress.companionId||settings)&&learning.loaded?<div className="home-welcome"><h2>{settings?'让我记住你的称呼。':'在开始之前，认识一下你。'}</h2><NameSetup initial={learning.name} onSave={async name=>{await learning.choose(name);setSettings(false);}}/>{settings&&<button className="text-button" onClick={()=>setSettings(false)}>取消</button>}</div>:<>
 <div className="home-chat-feed" ref={feed} aria-label="与 Rosie 的日常对话"><article className="home-rosie-line"><span>ROSIE</span><p lang="en">{COMPANION.intro}</p><small lang="zh-CN">嗨，我是 Rosie。我们可以一起慢慢经历每一段小冒险。准备好看看今天会带来什么了吗？</small><button className="chat-audio-button" disabled={audio.busy} onClick={()=>void audio.play({target:'preview'})} aria-label="听 Rosie 打招呼"><Volume2 size={16}/></button></article>
 {messages.map(m=><div className="home-exchange" key={m.id}><article className="home-user-line"><span>{learning.name||'YOU'}</span><p>{m.user}</p></article><article className="home-rosie-line"><span>ROSIE</span><p lang="en">{m.english}</p><small lang="zh-CN">{m.chinese}</small><button className="chat-audio-button" disabled={audio.busy} onClick={()=>void audio.play({target:'chat',messageId:m.id})} aria-label="重听 Rosie 的回应"><Volume2 size={16}/></button></article></div>)}
 {busy&&<p className="home-thinking" role="status"><span className="spinner"/>Rosie 正在想怎么回应你…</p>}
 {draft&&<div className="voice-draft"><span>你刚刚说</span><p>{draft}</p>{!listening&&<div><button className="text-button" onClick={listen} disabled={busy}>重新说</button><button className="primary-button" onClick={()=>void send()} disabled={busy}>{busy?'发送中…':'发送'}<ArrowRight size={15}/></button></div>}</div>}
 </div>
 <div className="home-voice-controls"><button className={'home-mic '+(listening?'listening':'')} disabled={busy||!learning.loaded} onClick={()=>listening?recognition.current?.stop():listen()}>{listening?<Square size={18}/>:<Mic size={21}/>}<span>{listening?'说完了，点这里':'按一下，聊一会儿'}</span></button><select aria-label="口语识别语言" value={language} onChange={e=>setLanguage(e.target.value)} disabled={listening||busy}><option value="en-US">EN</option><option value="zh-CN">中文</option></select>{audio.playing&&<button className="icon-button" onClick={audio.stop} aria-label="暂停 Rosie 的语音"><Pause size={18}/></button>}</div>
 </>}
 {(error||learning.error||audio.error)&&<p className="error-message" role="alert">{error||learning.error||audio.error}{learning.error&&<button onClick={()=>void learning.load()}>重新同步</button>}</p>}
 {audio.note&&<p className="audio-save-note">{audio.note}</p>}
 {ready===false&&learning.progress.companionId&&<p className="home-service-note">日常对话服务待连接，旅行学习已可进入。</p>}
 <Link className="home-travel-entry" href="/travel"><span className="travel-entry-icon"><Plane size={22}/></span><span><small>OUR NEXT LITTLE ADVENTURE</small><h2>和 Rosie 去美国</h2><p>{summary.completed}/7 章 · {next.title}</p></span><ArrowRight size={23}/></Link>
 </section></main><footer className="rosie-footer"><span>ROSIE × YOU / LITTLE BY LITTLE</span><details><summary>关于角色与照片</summary><p>这是以 ROSÉ 公开形象为灵感的非官方 AI 演绎，与本人及所属团队无关联。学习剧情为虚构，音频为合成配音。</p><p>日常聊天由 AI 生成；美国旅行使用预写学习材料。浏览器语音识别用于将你的口语转成对话输入。</p><p>公开活动照片：TV10 / CC BY 3.0。原图来源和许可见照片上的来源入口；照片不代表本人参与或背书。</p><RosieCredits/></details></footer></div>;
}
