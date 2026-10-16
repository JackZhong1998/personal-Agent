'use client';
import {Fragment,useCallback,useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,AudioLines,Check,ChevronDown,Heart,Headphones,ImageIcon,Languages,Maximize2,Mic,Pause,Play,Send,Sparkles,Square,Star,Volume2,X} from 'lucide-react';
import {chapters,FAMILIARITY_MAX,AFFECTION_MAX,type Progress,type TurnFeedback} from '@/lib/story';
import type {ConversationView,SceneImage} from '@/lib/client-types';
import {Scene,Portrait} from './Scene';
async function jsonRequest<T>(url:string,body?:unknown):Promise<T>{
 const response=await fetch(url,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{cache:'no-store'});
 const data=await response.json();if(!response.ok)throw new Error(data.error||'暂时没能完成，请重试');return data;
}
function Wave({active=false}:{active?:boolean}){return <span className={'voice-wave '+(active?'is-playing':'')} aria-hidden="true">{Array.from({length:27},(_,i)=><i key={i} style={{height:[9,18,25,14,32,21,12,28,19][i%9],animationDelay:`${i*.06}s`}}/>)}</span>;}
export function VoiceRoom({session:s,onSession,onClose,onProgress}:{session:ConversationView;onSession:(s:ConversationView)=>void;onClose:()=>void;onProgress:(p:Progress)=>void}){
 const chapter=chapters.find(c=>c.id===s.chapterId)!;
 const [playing,setPlaying]=useState<string|null>(null),[recording,setRecording]=useState(false),[seconds,setSeconds]=useState(0),[busy,setBusy]=useState(false);
 const [hints,setHints]=useState(false),[error,setError]=useState(''),[guideBusy,setGuideBusy]=useState<number|null>(null);
 const [pending,setPending]=useState<{blob:Blob;duration:number}|null>(null);
 const [translations,setTranslations]=useState<Record<number,string>>({}),[visibleTranslations,setVisibleTranslations]=useState<number[]>([]),[translationBusy,setTranslationBusy]=useState<number|null>(null);
 const [photo,setPhoto]=useState<SceneImage|null>(null),[celebration,setCelebration]=useState<TurnFeedback|null>(null);
 const room=useRef<HTMLDivElement>(null),feed=useRef<HTMLDivElement>(null),player=useRef<HTMLAudioElement|null>(null),recorder=useRef<MediaRecorder|null>(null),stream=useRef<MediaStream|null>(null);
 const photoTrigger=useRef<HTMLButtonElement|null>(null);
 const timer=useRef<ReturnType<typeof setInterval>|null>(null),context=useRef<AudioContext|null>(null),frame=useRef(0),alive=useRef(true),cancel=useRef(false),played=useRef('');
 const cleanupCapture=useCallback(()=>{if(timer.current)clearInterval(timer.current);timer.current=null;cancelAnimationFrame(frame.current);stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;void context.current?.close().catch(()=>{});context.current=null;},[]);
 const playAudio=useCallback(async(url:string,key:string)=>{
  setError('');if(player.current){player.current.pause();player.current.src='';}
  const p=new Audio(url);player.current=p;setPlaying(key);
  p.onended=()=>{if(alive.current&&player.current===p)setPlaying(null);};
  p.onerror=()=>{if(alive.current&&player.current===p){setPlaying(null);setError('这段声音没能播放，请再点一次播放按钮。');}};
  try{await p.play();}catch{if(alive.current&&player.current===p){setPlaying(null);setError('浏览器需要你点一下播放按钮，才能听见这段声音。');}}
 },[]);
 function pause(){player.current?.pause();setPlaying(null);}
 useEffect(()=>{if(played.current!==s.audioUrl){played.current=s.audioUrl;void playAudio(s.audioUrl,'role:'+s.index);}},[s.audioUrl,s.index,playAudio]);
 useEffect(()=>{const el=feed.current;if(el)el.scrollTop=el.scrollHeight;},[s.index]);
 useEffect(()=>{if(!celebration)return;const t=setTimeout(()=>setCelebration(null),4200);return()=>clearTimeout(t);},[celebration]);
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
  setError('');setPending(null);
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
 async function guide(i:number){setGuideBusy(i);setError('');try{const result=await jsonRequest<{audioUrl:string}>('/api/guide',{sessionId:s.id,index:s.index,suggestion:i});if(alive.current)await playAudio(result.audioUrl,'guide:'+i);}catch(e){if(alive.current)setError((e as Error).message);}finally{if(alive.current)setGuideBusy(null);}}
 async function translate(index:number){
  if(visibleTranslations.includes(index)){setVisibleTranslations(a=>a.filter(i=>i!==index));return;}
  if(translations[index]){setVisibleTranslations(a=>[...a,index]);return;}
  setTranslationBusy(index);setError('');
  try{const data=await jsonRequest<{translation:string}>(`/api/conversation/translation?sessionId=${s.id}&index=${index}`);if(alive.current){setTranslations(a=>({...a,[index]:data.translation}));setVisibleTranslations(a=>[...a,index]);}}
  catch(e){if(alive.current)setError((e as Error).message);}finally{if(alive.current)setTranslationBusy(null);}
 }
 const rel=s.relationship;const nextThreshold=rel.nextStage?.threshold||FAMILIARITY_MAX;
 return <div className="voice-room rose-room" ref={room} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`语音章节：${chapter.title}`}>
  <header className="rose-room-header"><button className="room-back" onClick={onClose} disabled={busy} aria-label="暂时离开对话"><ArrowLeft size={20}/><span>我们的故事</span></button><div className="chat-contact"><Portrait/><span><strong>ROSÉ <span>♡</span></strong><small>非官方虚构同人角色 · 合成配音</small></span></div><span className="chat-episode">CHAPTER {chapter.number}<b>{s.index} / {s.total}</b></span></header>
  <div className="live-relationship" aria-label="当前关系数值"><span className="live-stage"><Heart size={14}/>{rel.stage.label}</span><div className="live-stat"><span>熟悉</span><b key={'f'+rel.familiarity}>{rel.familiarity}</b><small>/{FAMILIARITY_MAX}</small><div><i style={{width:`${rel.familiarity/FAMILIARITY_MAX*100}%`}}/></div></div><div className="live-stat heart-stat"><span>心动</span><b key={'a'+rel.affection}>{rel.affection}</b><small>/{AFFECTION_MAX}</small><div><i style={{width:`${rel.affection/AFFECTION_MAX*100}%`}}/></div></div><span className="live-sparks"><Star size={14}/><b key={rel.sparks}>{rel.sparks}</b><small>星光</small></span></div>
  <div className="rose-chat-layout"><aside className="rose-story-aside"><div className="rose-aside-art"><Scene variant={chapter.color}/><span>PARALLEL NOTES / {chapter.number}</span></div><p className="eyebrow">A LITTLE CLOSER WITH ROSÉ</p><h1>{chapter.title}</h1><p className="rose-aside-english">{chapter.english}</p><p>{chapter.description}</p><div className="rose-aside-pair"><Portrait/><span>ROSÉ <i>×</i> {s.displayName}<small>20 轮语音 · 3 张场景插画 · 随时继续</small></span></div><div className="rose-next-stage"><span>下一次靠近</span><strong>{rel.nextStage?.label||'把日常继续写下去'}</strong><div><i style={{width:`${Math.min(100,rel.familiarity/nextThreshold*100)}%`}}/></div><p>{rel.nextStage?`还差 ${rel.nextStage.threshold-rel.familiarity} 熟悉度`:'这一季的心动旅程已经点亮'}</p></div><small className="rose-fiction-note">虚构剧情、合成配音与场景插画。与 ROSÉ 本人、BLACKPINK 及所属团队无关联。</small></aside>
  <section className={'rose-chat-main '+(celebration?'has-reward':'')} aria-label="与 ROSÉ 的语音聊天"><div className="chat-scene-heading"><span><span className="live-dot"/> {chapter.place}</span><span>For {s.displayName} ♡</span></div>
   <div className="chat-feed" ref={feed} aria-label="对话记录"><div className="chat-date-divider"><span>你们的第 {chapter.number} 个小章节</span></div><p className="chat-disclosure">非官方虚构剧情 · 她的语音可点开中文</p>
   {s.messages.map(message=>{const i=message.index,voiceKey='role:'+i,own=s.recordings[i],credit=s.progress.interactions.find(c=>c.id===s.id+':'+i);return <Fragment key={i}>
    <article className="chat-message from-rose"><Portrait/><div className="chat-message-content"><small>ROSÉ <span>· {i===s.total?'这一章的晚安':`语音 ${i+1}`}</span></small><div className="voice-message-row"><button className={'voice-message '+(playing===voiceKey?'playing':'')} aria-label={`${playing===voiceKey?'暂停':'播放'} ROSÉ 第 ${i+1} 段语音`} disabled={recording||busy} onClick={()=>playing===voiceKey?pause():void playAudio(message.audioUrl,voiceKey)}>{playing===voiceKey?<Pause size={18}/>:<Play size={18}/>}<Wave active={playing===voiceKey}/><AudioLines size={14}/></button></div><button className="translation-toggle" disabled={translationBusy!==null} aria-expanded={visibleTranslations.includes(i)} onClick={()=>void translate(i)}><Languages size={12}/>{translationBusy===i?'正在打开…':visibleTranslations.includes(i)?'收起中文':`查看第 ${i+1} 段中文`}<ChevronDown size={11}/></button>{visibleTranslations.includes(i)&&<div className="translation-bubble" lang="zh-CN">{translations[i]}</div>}
     {message.image&&<button className="chat-photo" onClick={e=>{photoTrigger.current=e.currentTarget;setPhoto(message.image!);}} aria-label={`打开 ROSÉ 分享的场景图片 ${i+1}`}><img src={message.image.src} alt={message.image.alt} loading="lazy" width="600" height="440"/><span><ImageIcon size={12}/>{message.image.caption}<Maximize2 size={12}/></span><small>剧情场景插画</small></button>}
    </div></article>
    {own&&<article className="chat-message from-you"><div className="chat-message-content"><small>{s.displayName} <span>· 已送达</span></small><button className="voice-message own-message" aria-label={`播放我的第 ${i+1} 条录音`} disabled={recording||busy} onClick={()=>playing==='user:'+i?pause():void playAudio(own.audioUrl,'user:'+i)}>{playing==='user:'+i?<Pause size={16}/>:<Play size={16}/>}<Wave active={playing==='user:'+i}/><span>{Math.ceil(own.duration)}″</span><Check size={13}/></button>{credit&&<div className="message-credit">{credit.familiarity>0&&<span>熟悉 +{credit.familiarity}</span>}{credit.affection>0&&<span>心动 +{credit.affection}</span>}<span><Star size={10}/> +{credit.sparks}</span></div>}</div><span className="you-avatar">{s.displayName.slice(0,1)}</span></article>}
   </Fragment>;})}
   {busy&&<div className="rose-typing"><Portrait/><span><i/><i/><i/></span><small>保存你的声音，准备下一条语音…</small></div>}
   {s.completed&&<div className="story-complete-card"><span><Heart size={23}/></span><p>CHAPTER {chapter.number} COMPLETE</p><h2>二十次回应，把故事聊成了我们。</h2><div><strong>20<small>次互动</small></strong><strong>{s.progress.interactions.filter(c=>c.id.startsWith(s.id+':')).reduce((a,c)=>a+c.sparks,0)}<small>收藏星光</small></strong></div><p>语音和成长已保存，随时回来重听这段日常。</p><button className="primary-button" onClick={onClose}>收好这段回忆 <ArrowRight size={16}/></button></div>}
   </div>
   <div className="chat-composer">
   {error&&<div className="error-message" role="alert">{error}{pending&&!busy&&<button onClick={()=>void send(pending.blob,pending.duration)}>重试发送这条录音 <Send size={12}/></button>}</div>}
   {!s.completed&&<>{hints&&<div className="rose-hints"><div><span><Sparkles size={13}/> 卡壳的时候，可以这样回</span><button onClick={()=>setHints(false)} aria-label="收起表达提示"><X size={16}/></button></div>{s.suggestions.map((text,i)=><div className="hint-line" key={text}><p>{text}</p><button disabled={guideBusy!==null||recording||busy} onClick={()=>void guide(i)} aria-label={`听推荐表达 ${i+1} 的读音`}>{guideBusy===i?<span className="spinner"/>:<Volume2 size={17}/>}</button></div>)}<small>只是灵感，用你自己的话说就好。读音按需生成。</small></div>}<div className="composer-context"><span>{s.cue}</span><b>{s.index+1}<small> / {s.total}</small></b></div><div className="composer-controls"><button className={'composer-hint-button '+(hints?'active':'')} disabled={recording||busy} aria-label="打开表达提示" onClick={()=>setHints(!hints)}><Sparkles size={21}/><span>怎么回</span></button><button className={'rose-record '+(recording?'is-recording':'')} disabled={busy||playing!==null||guideBusy!==null} onClick={()=>recording?(recorder.current?.state==='recording'&&recorder.current.stop()):void startRecording()} aria-label={recording?'结束录音并发送':'开始录音'}>{busy?<span className="spinner"/>:recording?<Square size={21} fill="currentColor"/>:<Mic size={23}/>}<span>{busy?'正在保存…':recording?`说完点这里发送 · ${seconds}″`:playing?'先听她说完，再回应':'点一下，把声音发给她'}</span></button><button className="composer-hint-button" disabled={recording||busy} onClick={()=>playing?pause():void playAudio(s.audioUrl,'role:'+s.index)} aria-label={playing?'暂停当前播放':'重听最新语音'}>{playing?<Pause size={21}/>:<Headphones size={21}/>}<span>{playing?'暂停':'重听'}</span></button></div><p className="composer-footnote">{recording?'1–45 秒 · 结束后直接发送并推进下一句':'固定剧情 · 录完即推进 · 每一次互动，都有一点星光'}</p></>}
   {s.completed&&<button className="completed-return" onClick={onClose}>回到我们的故事 <ArrowRight size={16}/></button>}
   </div>
  </section></div>
  {celebration&&<div className="reward-burst" key={celebration.id} role="status" aria-live="polite"><div className="reward-rays">{Array.from({length:12},(_,i)=><span key={i} style={{'--particle':i} as React.CSSProperties}>{i%2?<Star size={13}/>:<Heart size={12}/>}</span>)}</div><span className="reward-emblem"><Heart size={25} fill="currentColor"/></span><small>{celebration.milestone?'RELATIONSHIP LEVEL UP':'A LITTLE CLOSER'}</small><h3>{celebration.milestone?`关系升级 · ${celebration.milestone}`:celebration.message}</h3><div>{celebration.familiarity>0&&<span>熟悉度 <b>+{celebration.familiarity}</b></span>}{celebration.affection>0&&<span>心动值 <b>+{celebration.affection}</b></span>}<span>星光 <b>+{celebration.sparks+celebration.dailyBonus}</b></span></div>{celebration.dailyBonus>0&&<p>章节完成 · 额外 +{celebration.dailyBonus} 星光</p>}</div>}
  {photo&&<div className="photo-lightbox" role="dialog" aria-modal="true" aria-label="场景图片预览" onClick={()=>setPhoto(null)}><button autoFocus aria-label="关闭图片预览" onClick={()=>setPhoto(null)}><X size={24}/></button><figure onClick={e=>e.stopPropagation()}><img src={photo.src} alt={photo.alt}/><figcaption>{photo.caption}<small>虚构剧情场景插画 · 不代表本人拍摄或私聊</small></figcaption></figure></div>}
 </div>;
}
