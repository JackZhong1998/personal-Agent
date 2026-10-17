'use client';
import {Fragment,useCallback,useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Check,Headphones,Maximize2,Mic,Pause,Play,Send,Square,Volume2,X,MessageCircle} from 'lucide-react';
import {chapters,type Progress,type TurnFeedback} from '@/lib/story';
import type {ConversationView,SceneImage} from '@/lib/client-types';

async function jsonRequest<T>(url:string,body?:unknown):Promise<T>{
 const response=await fetch(url,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{cache:'no-store'});
 const data=await response.json();if(!response.ok)throw new Error(data.error||'暂时没能完成，请重试');return data;
}
function Wave({active=false}:{active?:boolean}){return <span className={'voice-wave '+(active?'is-playing':'')} aria-hidden="true">{Array.from({length:16},(_,i)=><i key={i} style={{height:[9,18,25,14,32,21,12,28,19][i%9],animationDelay:`${i*.06}s`}}/>)}</span>;}
export function VoiceRoom({session:s,onSession,onClose,onProgress}:{session:ConversationView;onSession:(s:ConversationView)=>void;onClose:()=>void;onProgress:(p:Progress)=>void}){
 const chapter=chapters.find(c=>c.id===s.chapterId)!;
 const [playing,setPlaying]=useState<string|null>(null),[recording,setRecording]=useState(false),[seconds,setSeconds]=useState(0),[busy,setBusy]=useState(false);
 const [hints,setHints]=useState(false),[error,setError]=useState(''),[guideBusy,setGuideBusy]=useState<number|null>(null);
 const [failedGuide,setFailedGuide]=useState<number|null>(null),[systemNote,setSystemNote]=useState('');
 const utterance=useRef<SpeechSynthesisUtterance|null>(null);
 const [pending,setPending]=useState<{blob:Blob;duration:number}|null>(null);
 const [pendingUrl,setPendingUrl]=useState(''),[waitSeconds,setWaitSeconds]=useState(0);
 const guideCache=useRef(new Map<string,string>());
 const [photo,setPhoto]=useState<SceneImage|null>(null),[celebration,setCelebration]=useState<TurnFeedback|null>(null);
 const room=useRef<HTMLDivElement>(null),feed=useRef<HTMLDivElement>(null),player=useRef<HTMLAudioElement|null>(null),recorder=useRef<MediaRecorder|null>(null),stream=useRef<MediaStream|null>(null);
 const photoTrigger=useRef<HTMLButtonElement|null>(null);
 const timer=useRef<ReturnType<typeof setInterval>|null>(null),context=useRef<AudioContext|null>(null),frame=useRef(0),alive=useRef(true),cancel=useRef(false),played=useRef('');
 const cleanupCapture=useCallback(()=>{if(timer.current)clearInterval(timer.current);timer.current=null;cancelAnimationFrame(frame.current);stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;void context.current?.close().catch(()=>{});context.current=null;},[]);
 const playAudio=useCallback(async(url:string,key:string)=>{
  utterance.current=null;if('speechSynthesis' in window)window.speechSynthesis.cancel();
  setError('');if(player.current){player.current.pause();player.current.src='';}
  const p=new Audio(url);player.current=p;setPlaying(key);
  p.onended=()=>{if(alive.current&&player.current===p)setPlaying(null);};
  p.onerror=()=>{if(alive.current&&player.current===p){setPlaying(null);setError('这段声音没能播放，请再点一次播放按钮。');}};
  try{await p.play();}catch{if(alive.current&&player.current===p){setPlaying(null);setError('浏览器需要你点一下播放按钮，才能听见这段声音。');}}
 },[]);
 function pause(){utterance.current=null;if('speechSynthesis' in window)window.speechSynthesis.cancel();player.current?.pause();setPlaying(null);}
 useEffect(()=>{setFailedGuide(null);setSystemNote('');},[s.index]);
 useEffect(()=>()=>{utterance.current=null;if('speechSynthesis' in window)window.speechSynthesis.cancel();},[]);
 useEffect(()=>{if(played.current!==s.audioUrl){played.current=s.audioUrl;void playAudio(s.audioUrl,'role:'+s.index);}},[s.audioUrl,s.index,playAudio]);
 useEffect(()=>{const el=feed.current;if(el)el.scrollTop=el.scrollHeight;},[s.index,pendingUrl,busy]);
 useEffect(()=>{if(!celebration)return;const t=setTimeout(()=>setCelebration(null),2200);return()=>clearTimeout(t);},[celebration]);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;cancel.current=true;played.current='';if(recorder.current?.state==='recording')recorder.current.stop();cleanupCapture();if(player.current){player.current.pause();player.current.src='';}};},[cleanupCapture]);
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement,overflow=document.body.style.overflow;document.body.style.overflow='hidden';room.current?.focus();
  const trap=(e:KeyboardEvent)=>{if(e.key!=='Tab')return;const lightbox=room.current?.querySelector<HTMLButtonElement>('.photo-lightbox>button');if(lightbox){e.preventDefault();lightbox.focus();return;}const nodes=room.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href]');if(!nodes?.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===room.current)){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}};
  document.addEventListener('keydown',trap);return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',trap);previous?.focus();};
 },[]);
 useEffect(()=>{if(!photo)photoTrigger.current?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&photo)setPhoto(null);};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);},[photo]);
 useEffect(()=>{const hidden=()=>{if(document.hidden&&recorder.current?.state==='recording'){cancel.current=true;recorder.current.stop();setRecording(false);setError('离开页面时已停止录音，这条尚未发送。回来后再重新录制吧。');}};document.addEventListener('visibilitychange',hidden);return()=>document.removeEventListener('visibilitychange',hidden);},[]);
 async function send(blob:Blob,duration:number){
  setBusy(true);setError('');setPending({blob,duration});
  try{
   const form=new FormData();form.set('sessionId',s.id);form.set('index',String(s.index));form.set('duration',String(Math.min(45,duration)));form.set('audio',blob,'recording.'+(blob.type.includes('mp4')?'m4a':blob.type.includes('ogg')?'ogg':'webm'));
   const response=await fetch('/api/conversation/turn',{method:'POST',body:form});const result=await response.json();if(!response.ok)throw new Error(result.error||'没能保存，请重试');
   if(alive.current){setPending(null);onSession(result);onProgress(result.progress);setHints(false);if(result.feedback)setCelebration(result.feedback);}
  }catch(e){if(alive.current)setError((e as Error).message);}finally{if(alive.current)setBusy(false);}
 }
 async function startRecording(){
  pause();setError('');setPending(null);
  if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){setError('当前浏览器不支持录音，请使用 HTTPS 下的 Safari 或 Chrome。');return;}
  setBusy(true);
  try{
   const media=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});
   if(!alive.current){media.getTracks().forEach(t=>t.stop());return;}stream.current=media;
   const mime=['audio/webm;codecs=opus','audio/mp4','audio/webm','audio/ogg;codecs=opus'].find(m=>MediaRecorder.isTypeSupported(m));if(!mime)throw new Error('当前浏览器的录音格式不受支持，请换用 Safari 或 Chrome。');
   const rec=new MediaRecorder(media,{mimeType:mime,audioBitsPerSecond:64000});recorder.current=rec;const chunks:Blob[]=[];const started=Date.now();let maxRms=0;cancel.current=false;
   const ctx=new AudioContext();context.current=ctx;await ctx.resume();const source=ctx.createMediaStreamSource(media),analyser=ctx.createAnalyser();analyser.fftSize=1024;source.connect(analyser);const data=new Float32Array(analyser.fftSize);
   function measure(){analyser.getFloatTimeDomainData(data);maxRms=Math.max(maxRms,Math.sqrt(data.reduce((a,v)=>a+v*v,0)/data.length));frame.current=requestAnimationFrame(measure);}measure();
   rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
   rec.onstop=()=>{const duration=(Date.now()-started)/1000;cleanupCapture();if(!alive.current||cancel.current)return;setRecording(false);const blob=new Blob(chunks,{type:mime});if(duration<1||maxRms<.008){setError('还没清楚听见你的声音。靠近麦克风，说满一秒后再发送吧。');return;}void send(blob,duration);};
   rec.onerror=()=>{cancel.current=true;cleanupCapture();setRecording(false);setError('录音中断了，请重新录制。');};
   rec.start(250);setRecording(true);setSeconds(0);timer.current=setInterval(()=>{const elapsed=Math.floor((Date.now()-started)/1000);setSeconds(elapsed);if(elapsed>=45&&rec.state==='recording')rec.stop();},250);
  }catch(e){cleanupCapture();setError((e as Error).name==='NotAllowedError'?'请在浏览器设置中允许本站使用麦克风，然后再试一次。':(e as Error).message||'无法打开麦克风');}finally{if(alive.current)setBusy(false);}
 }
 useEffect(()=>{if(!pending){setPendingUrl('');return;}const url=URL.createObjectURL(pending.blob);setPendingUrl(url);return()=>URL.revokeObjectURL(url);},[pending]);
 useEffect(()=>{if(!busy){setWaitSeconds(0);return;}const start=Date.now();const tick=setInterval(()=>setWaitSeconds(Math.floor((Date.now()-start)/1000)),1000);return()=>clearInterval(tick);},[busy]);
 async function guide(i:number){
  const key=s.index+':'+i;setGuideBusy(i);setError('');setFailedGuide(null);setSystemNote('');
  try{let url=guideCache.current.get(key);if(!url){const result=await jsonRequest<{audioUrl:string}>('/api/guide',{sessionId:s.id,index:s.index,suggestion:i});url=result.audioUrl;guideCache.current.set(key,url);}if(alive.current)await playAudio(url,'guide:'+i);}
  catch(e){if(alive.current){setError((e as Error).message);setFailedGuide(i);}}finally{if(alive.current)setGuideBusy(null);}
 }
 function systemGuide(i:number){
  pause();setError('');setSystemNote('');
  if(!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined'){setError('当前浏览器不支持系统朗读，请重试读音服务。');return;}
  const u=new SpeechSynthesisUtterance(s.suggestions[i]);u.lang='en-US';u.rate=.9;
  const voices=window.speechSynthesis.getVoices();u.voice=voices.find(v=>v.lang.toLowerCase()==='en-us'&&v.localService)||voices.find(v=>/^en[-_]/i.test(v.lang))||null;
  utterance.current=u;setPlaying('system:'+i);setFailedGuide(null);setSystemNote('系统朗读 · 未保存音频');
  u.onend=()=>{if(alive.current&&utterance.current===u){utterance.current=null;setPlaying(null);}};
  u.onerror=()=>{if(alive.current&&utterance.current===u){utterance.current=null;setPlaying(null);setSystemNote('');setFailedGuide(i);setError('系统朗读未能播放，请重试或检查手机的英文语音设置。');}};
  window.speechSynthesis.speak(u);
 }
 const rel=s.relationship;
 return <div className="voice-room" ref={room} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`语音章节：${chapter.title}`}>
  <header className="room-header"><button className="icon-button" onClick={onClose} disabled={busy||recording} aria-label="暂时离开对话"><ArrowLeft size={21}/></button><div className="chat-contact"><strong>ROSÉ</strong><span>{chapter.title}</span></div><span className="chat-episode">{Math.min(s.index+1,s.total)} / {s.total}</span></header>
  <div className="live-relationship" aria-label="当前关系数值"><span className="live-stage">{rel.stage.label}</span><div className="live-stat"><span>熟悉</span><b key={'f'+rel.familiarity}>{rel.familiarity}</b></div><div className="live-stat"><span>心动</span><b key={'a'+rel.affection}>{rel.affection}</b></div><div className="live-stat"><span>星光</span><b key={'s'+rel.sparks}>{rel.sparks}</b></div></div>
  <section className="chat-panel" aria-label="与 ROSÉ 的语音聊天"><div className="chat-feed" ref={feed} aria-label="对话记录"><p className="chat-disclosure">非官方虚构故事 · 合成配音</p>
   {s.messages.map(message=>{const i=message.index,voiceKey='role:'+i,own=s.recordings[i];return <Fragment key={i}>
    <article className="chat-message from-rose"><span className="contact-avatar" aria-hidden="true">R</span><div className="chat-message-content"><small>ROSÉ</small><div className="message-bubble"><button className={'voice-message '+(playing===voiceKey?'playing':'')} aria-label={`${playing===voiceKey?'暂停':'播放'} ROSÉ 第 ${i+1} 段语音`} disabled={recording||busy} onClick={()=>playing===voiceKey?pause():void playAudio(message.audioUrl,voiceKey)}>{playing===voiceKey?<Pause size={17}/>:<Play size={17}/>}<Wave active={playing===voiceKey}/><span>语音 {i+1}</span></button><p className="message-english" lang="en">{message.line}</p><p className="message-chinese" lang="zh-CN">{message.translation}</p></div>
    {message.image&&<button className="chat-photo" onClick={e=>{photoTrigger.current=e.currentTarget;setPhoto(message.image!);}} aria-label={`打开 ROSÉ 分享的场景图片 ${i+1}`}><img src={message.image.src} alt={message.image.alt} loading="lazy" width="600" height="440"/><span>场景插画<Maximize2 size={13}/></span></button>}
    </div></article>
    {own&&<article className="chat-message from-you"><div className="chat-message-content"><small>{s.displayName}</small><button className="voice-message own-message" aria-label={`播放我的第 ${i+1} 条录音`} disabled={recording||busy} onClick={()=>playing==='user:'+i?pause():void playAudio(own.audioUrl,'user:'+i)}>{playing==='user:'+i?<Pause size={16}/>:<Play size={16}/>}<Wave active={playing==='user:'+i}/><span>{Math.ceil(own.duration)}″</span><Check size={13}/></button></div></article>}
   </Fragment>;})}
   {pending&&<article className="chat-message from-you pending-message"><div className="chat-message-content"><small>{s.displayName} · {busy?'发送中':'待重试'}</small><button className="voice-message own-message" aria-label="播放待发送录音" disabled={busy||!pendingUrl} onClick={()=>void playAudio(pendingUrl,'pending')}><Play size={16}/><Wave/><span>{Math.ceil(pending.duration)}″</span></button></div></article>}
   {busy&&<div className="reply-status" role="status"><span className="spinner"/>正在回复{waitSeconds>0&&<span> · {waitSeconds} 秒</span>}</div>}
   {s.completed&&<div className="story-complete-card"><Check size={26}/><h2>本章已完成</h2><p>20 次互动 · 进度已保存</p><button className="primary-button" onClick={onClose}>返回故事<ArrowRight size={16}/></button></div>}
   </div>
   <div className="chat-composer">
    {error&&<div className="error-message" role="alert">{error}{failedGuide!==null&&<div className="guide-recovery"><button disabled={guideBusy!==null||recording||busy} onClick={()=>void guide(failedGuide)}>重试读音</button><button disabled={recording||busy} onClick={()=>systemGuide(failedGuide)}>系统朗读</button></div>}{pending&&!busy&&<button onClick={()=>void send(pending.blob,pending.duration)}>重试发送<Send size={14}/></button>}</div>}
    {systemNote&&<p className="system-voice-note" role="status">{systemNote}</p>}
    {!s.completed&&<>
     {hints&&<section className="reply-hints" aria-label="推荐回复"><header><strong>可以这样说</strong><button className="icon-button" onClick={()=>setHints(false)} aria-label="收起表达提示"><X size={17}/></button></header>{s.suggestions.map((text,i)=><div className="hint-line" key={text}><div><p lang="en">{text}</p><p className="hint-chinese" lang="zh-CN">{s.suggestionTranslations[i]}</p></div><button disabled={guideBusy!==null||recording||busy} onClick={()=>void guide(i)} aria-label={`听推荐表达 ${i+1} 的读音`}>{guideBusy===i?<span className="spinner"/>:<Volume2 size={19}/>}</button></div>)}</section>}
     <div className="composer-controls"><button className={'composer-hint-button '+(hints?'active':'')} disabled={recording||busy} aria-label="打开表达提示" aria-expanded={hints} onClick={()=>setHints(!hints)}><MessageCircle size={20}/><span>提示</span></button><button className={'record-button '+(recording?'recording':'')} disabled={busy||guideBusy!==null} onClick={()=>recording?(recorder.current?.state==='recording'&&recorder.current.stop()):void startRecording()} aria-label={recording?'结束录音并发送':'开始录音'}>{busy?<span className="spinner"/>:recording?<Square size={19} fill="currentColor"/>:<Mic size={21}/>}<span>{busy?'正在回复…':recording?`发送 · ${seconds}″`:'点击说话'}</span></button><button className="composer-hint-button" disabled={recording||busy} onClick={()=>playing?pause():void playAudio(s.audioUrl,'role:'+s.index)} aria-label={playing?'暂停当前播放':'重听最新语音'}>{playing?<Pause size={20}/>:<Headphones size={20}/>}<span>{playing?'暂停':'重听'}</span></button></div>
    </>}
    {s.completed&&<button className="completed-return" onClick={onClose}>返回故事<ArrowRight size={16}/></button>}
   </div>
  </section>
  {celebration&&<div className="reward-burst" key={celebration.id} role="status" aria-live="polite">{celebration.milestone&&<strong>{celebration.milestone}</strong>}<span>熟悉 <b>+{celebration.familiarity}</b></span><span>心动 <b>+{celebration.affection}</b></span><span>星光 <b>+{celebration.sparks+celebration.dailyBonus}</b></span></div>}
  {photo&&<div className="photo-lightbox" role="dialog" aria-modal="true" aria-label="场景图片预览" onClick={()=>setPhoto(null)}><button autoFocus className="icon-button" aria-label="关闭图片预览" onClick={()=>setPhoto(null)}><X size={24}/></button><figure onClick={e=>e.stopPropagation()}><img src={photo.src} alt={photo.alt}/><figcaption>虚构场景插画</figcaption></figure></div>}
 </div>;
}
