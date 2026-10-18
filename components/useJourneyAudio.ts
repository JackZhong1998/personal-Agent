'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
export type AudioRequest={chapterId?:string;cursor?:number;target:'preview'|'material'|'reply'|'chat';messageId?:string};
export function useJourneyAudio(){
 const [busy,setBusy]=useState(false),[playing,setPlaying]=useState(false),[error,setError]=useState(''),[note,setNote]=useState('');
 const cache=useRef(new Map<string,string>()),player=useRef<HTMLAudioElement|null>(null),request=useRef<AbortController|null>(null),alive=useRef(true),system=useRef<SpeechSynthesisUtterance|null>(null);
 const stop=useCallback(()=>{system.current=null;if('speechSynthesis' in window)window.speechSynthesis.cancel();player.current?.pause();setPlaying(false);},[]);
 const clear=useCallback(()=>{request.current?.abort();request.current=null;stop();setBusy(false);setError('');setNote('');},[stop]);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;request.current?.abort();system.current=null;if('speechSynthesis' in window)window.speechSynthesis.cancel();player.current?.pause();};},[]);
 async function play(body:AudioRequest){
  stop();setError('');setNote('');setBusy(true);const controller=new AbortController();request.current?.abort();request.current=controller;
  const key=JSON.stringify(body);
  try{
   let url=cache.current.get(key);
   if(!url){const r=await fetch(body.target==='chat'?'/api/chat/audio':'/api/learn/audio',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal});const data=await r.json();if(!r.ok)throw new Error(data.error||'语音暂时不可用');url=data.audioUrl;cache.current.set(key,url!);if(alive.current)setNote(data.cached?'读取已保存音频':'音频已保存');}else setNote('读取已保存音频');
   if(controller.signal.aborted||!alive.current)return;
   const audio=new Audio(url);player.current=audio;setPlaying(true);
   audio.onended=()=>{if(alive.current&&player.current===audio)setPlaying(false);};
   audio.onerror=()=>{cache.current.delete(key);if(alive.current&&player.current===audio){setPlaying(false);setError('未能播放，请再点一次播放。');}};
   await audio.play();
  }catch(e){if(alive.current&&!controller.signal.aborted){setPlaying(false);setError((e as Error).name==='NotAllowedError'?'语音已准备好，请再点一次播放。':(e as Error).message);}}
  finally{if(alive.current&&request.current===controller)setBusy(false);}
 }
 async function playRecording(url:string){stop();setError('');const audio=new Audio(url);player.current=audio;setPlaying(true);audio.onended=()=>{if(alive.current&&player.current===audio)setPlaying(false);};audio.onerror=()=>{if(alive.current&&player.current===audio){setPlaying(false);setError('录音暂时无法播放');}};try{await audio.play();}catch{setPlaying(false);setError('请再点一次播放录音');}}
 function systemRead(text:string){stop();setError('');if(!('speechSynthesis' in window)){setError('当前浏览器不支持系统朗读');return;}const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.9;u.voice=window.speechSynthesis.getVoices().find(v=>/^en[-_]/i.test(v.lang))||null;system.current=u;setNote('系统朗读 · 不保存音频');setPlaying(true);u.onend=()=>{if(alive.current&&system.current===u)setPlaying(false);};u.onerror=()=>{if(alive.current&&system.current===u){setPlaying(false);setError('系统朗读不可用，请重试读音服务。');}};window.speechSynthesis.speak(u);}
 return {busy,playing,error,note,play,stop,clear,systemRead,playRecording};
}
