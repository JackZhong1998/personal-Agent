'use client';
import {useEffect,useRef,useState} from 'react';
import {Mic,Square,Play,RotateCcw,Send} from 'lucide-react';
export function JourneyRecorder({onSubmit,onCapture,busy}:{onSubmit:(blob:Blob,duration:number)=>Promise<void>;onCapture:()=>void;busy:boolean}){
 const [opening,setOpening]=useState(false),[recording,setRecording]=useState(false),[seconds,setSeconds]=useState(0),[pending,setPending]=useState<{blob:Blob;duration:number;url:string}|null>(null),[error,setError]=useState('');
 const recorder=useRef<MediaRecorder|null>(null),media=useRef<MediaStream|null>(null),clock=useRef<ReturnType<typeof setInterval>|null>(null),alive=useRef(true),cancelled=useRef(false),player=useRef<HTMLAudioElement|null>(null);
 const clean=()=>{if(clock.current)clearInterval(clock.current);clock.current=null;media.current?.getTracks().forEach(t=>t.stop());media.current=null;};
 useEffect(()=>{alive.current=true;const hidden=()=>{if(document.hidden&&recorder.current?.state==='recording'){cancelled.current=true;recorder.current.stop();clean();setRecording(false);setError('录音已暂停，请回来后重新录制。');}};document.addEventListener('visibilitychange',hidden);return()=>{alive.current=false;cancelled.current=true;if(recorder.current?.state==='recording')recorder.current.stop();clean();player.current?.pause();document.removeEventListener('visibilitychange',hidden);};},[]);
 useEffect(()=>()=>{if(pending)URL.revokeObjectURL(pending.url);},[pending]);
 async function start(){
  if(opening)return;setOpening(true);
  onCapture();player.current?.pause();setPending(null);setError('');
  if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){setError('请用支持录音的 Safari 或 Chrome 打开本站。');setOpening(false);return;}
  try{
   const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});if(!alive.current){stream.getTracks().forEach(t=>t.stop());return;}media.current=stream;
   const mime=['audio/webm;codecs=opus','audio/mp4','audio/webm','audio/ogg;codecs=opus'].find(m=>MediaRecorder.isTypeSupported(m));if(!mime)throw new Error('当前浏览器不支持录音格式');
   const rec=new MediaRecorder(stream,{mimeType:mime,audioBitsPerSecond:64000});recorder.current=rec;const chunks:Blob[]=[];const started=Date.now();cancelled.current=false;
   rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
   rec.onstop=()=>{clean();if(!alive.current||cancelled.current)return;setRecording(false);const duration=(Date.now()-started)/1000,blob=new Blob(chunks,{type:mime});if(duration<1||blob.size<256){setError('请完整说一句，至少录制一秒。');return;}setPending({blob,duration,url:URL.createObjectURL(blob)});};
   rec.onerror=()=>{cancelled.current=true;clean();setRecording(false);setError('录音中断，请重新录制。');};rec.start(250);setRecording(true);setSeconds(0);clock.current=setInterval(()=>{const elapsed=Math.floor((Date.now()-started)/1000);setSeconds(elapsed);if(elapsed>=45&&rec.state==='recording')rec.stop();},250);
  }catch(e){clean();if(alive.current)setError((e as Error).name==='NotAllowedError'?'请允许麦克风权限后重试。':(e as Error).message);}finally{if(alive.current)setOpening(false);}
 }
 return <div className="journey-recorder">{error&&<p className="error-message" role="alert">{error}</p>}{pending?<><div className="recording-preview"><button className="text-button" disabled={busy||opening} onClick={()=>{onCapture();player.current?.pause();player.current=new Audio(pending.url);void player.current.play().catch(()=>setError('录音播放失败，请重试。'));}}><Play size={16}/>听听自己 · {Math.ceil(pending.duration)} 秒</button><button className="text-button" disabled={busy||opening} onClick={()=>void start()}><RotateCcw size={14}/>重录</button></div><button className="primary-button full" disabled={busy||opening} onClick={()=>{player.current?.pause();void onSubmit(pending.blob,pending.duration);}}>{busy?<span className="spinner"/>:<Send size={17}/>}发送给Rosie</button></>:<button className={'primary-button full '+(recording?'is-capturing':'')} disabled={busy||opening} onClick={()=>recording?recorder.current?.stop():void start()}>{recording?<Square size={18}/>:<Mic size={19}/>} {recording?`说完了 · ${seconds} 秒`:'开始朗读'}</button>}</div>;
}
