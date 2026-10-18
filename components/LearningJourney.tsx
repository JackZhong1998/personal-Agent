'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,BookOpen,Check,Diamond,Headphones,Heart,Mic,Pause,Play,Volume2} from 'lucide-react';
import {lessonSteps,materialBlocks,phaseNames,wordQuestion,type Lesson} from '@/lib/learning/content';
import {type LearningProgress,learningSummary} from '@/lib/learning/progress';
import {RosiePhoto} from './RosiePhoto';
import {JourneyRecorder} from './JourneyRecorder';
import {useJourneyAudio,type AudioRequest} from './useJourneyAudio';
type Gain={diamonds:number;xp:number;familiarity:number;affection:number};
export function LearningJourney({lesson,progress,onProgress,onClose}:{lesson:Lesson;progress:LearningProgress;onProgress:(p:LearningProgress)=>void;onClose:()=>void}){
 const steps=lessonSteps(lesson),run=progress.runs[lesson.id];
 const [cursor,setCursor]=useState(run.completedDay?0:run.cursor),[review]=useState(!!run.completedDay),[selected,setSelected]=useState<number|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[translated,setTranslated]=useState(false),[audioTarget,setAudioTarget]=useState<AudioRequest['target']>('material');
 const [feedback,setFeedback]=useState<{correct:boolean;gain:Gain;next:number;completed:boolean}|null>(null);
 const audio=useJourneyAudio(),room=useRef<HTMLDivElement>(null);
 useEffect(()=>{const previous=document.activeElement as HTMLElement,overflow=document.body.style.overflow;document.body.style.overflow='hidden';room.current?.focus();const trap=(e:KeyboardEvent)=>{if(e.key!=='Tab')return;const nodes=room.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],summary');if(!nodes?.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===room.current)){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}};document.addEventListener('keydown',trap);return()=>{document.body.style.overflow=overflow;previous?.focus();document.removeEventListener('keydown',trap);};},[]);
 useEffect(()=>{audio.clear();setSelected(null);setFeedback(null);setError('');setTranslated(false);room.current?.querySelector('.frame-content')?.scrollTo(0,0);},[cursor,audio.clear]);
 async function action(body:unknown){setError('');setBusy(true);try{const response=await fetch('/api/learn',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw new Error(data.error||'保存失败，请重试');onProgress(data.progress);return data;}catch(e){setError((e as Error).message);return null;}finally{setBusy(false);}}
 function next(){if(review){setCursor(c=>c+1);return;}if(feedback?.correct)setCursor(feedback.next);}
 async function advance(answer?:number){
  audio.stop();if(review){setCursor(c=>c+1);return;}
  const data=await action({action:'advance',chapterId:lesson.id,cursor,answer});if(!data)return;
  if(steps[cursor].kind==='intro'||steps[cursor].kind==='word')setCursor(data.progress.runs[lesson.id].cursor);
  else setFeedback({correct:data.correct,gain:data.gain,next:data.progress.runs[lesson.id].cursor,completed:data.completed});
 }
 async function upload(blob:Blob,duration:number){
  setError('');setBusy(true);audio.stop();
  try{const form=new FormData();form.set('chapterId',lesson.id);form.set('cursor',String(cursor));form.set('duration',String(duration));form.set('audio',blob,'reply.'+(blob.type.includes('mp4')?'m4a':'webm'));const r=await fetch('/api/learn/recording',{method:'POST',body:form});const data=await r.json();if(!r.ok)throw new Error(data.error||'录音保存失败');onProgress(data.progress);setFeedback({correct:true,gain:data.gain,next:data.progress.runs[lesson.id].cursor,completed:data.completed});}catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 const step=steps[cursor],scene=step?lesson.scenes[step.scene]:lesson.scenes.at(-1)!;
 const phase=step?.kind==='quiz'?'word':step?.kind;
 const q=step?.kind==='quiz'?wordQuestion(scene,step.word):step?.kind==='listen'?scene.listening:step?.kind==='read'?scene.reading:null;
 const word=step&&(step.kind==='word'||step.kind==='quiz')?scene.words[step.word]:null;
 const hintUnlocked=progress.hints.includes(lesson.id+':'+cursor);
 function audioButton(target:AudioRequest['target'],label:string){return <button className="lesson-audio" disabled={audio.busy||busy} onClick={()=>{setAudioTarget(target);void audio.play({chapterId:lesson.id,cursor,target});}}>{audio.busy?<span className="spinner"/>:<Volume2 size={18}/>}<span>{label}</span></button>;}
 const finished=!step;
 const summary=learningSummary(progress);const wordCount=lesson.scenes.reduce((a,s)=>a+s.words.length,0);
 return <div className="learning-room" role="dialog" aria-modal="true" aria-label={`旅行章节：${lesson.title}`} tabIndex={-1} ref={room}>
  <header className="learning-header"><button className="icon-button" onClick={onClose} disabled={busy} aria-label="保存并离开旅程"><ArrowLeft size={20}/></button><div className="learning-title"><strong>和Rosie去美国</strong><span>DAY {String(lesson.day).padStart(2,'0')} / {lesson.title}</span></div><div className="learning-wallet"><Diamond size={15}/><b>{progress.diamonds}</b><Heart size={15}/><b>{progress.affection}</b></div></header>
  <div className="learning-progress" role="progressbar" aria-label="本章进度" aria-valuenow={Math.min(cursor,steps.length)} aria-valuemin={0} aria-valuemax={steps.length}><i style={{width:`${cursor/steps.length*100}%`}}/></div>
  <div className="learning-toolbar"><div className="learning-phases">{[{id:'word',label:'单词',icon:BookOpen},{id:'listen',label:'听力',icon:Headphones},{id:'read',label:'阅读',icon:BookOpen},{id:'speak',label:'开口',icon:Mic}].map(p=><span key={p.id} className={phase===p.id?'active':''}><p.icon size={13}/>{p.label}</span>)}</div></div>
  {finished?<div className="journey-finished"><div className="finish-symbol"><Check size={32}/></div><h1>{review?'回看完成':summary.todayComplete?'今天的旅程，完成了。':'本章已完成'}</h1><div className="finish-stats"><span><b>{wordCount}</b>个新词</span><span><b>2</b>次开口</span><span><b>{summary.streak}</b>天连续同行</span></div><div className="finish-check"><Check size={15}/>{summary.todayComplete?'今日章节已完成 · 进度已保存':'进度已保存'}</div><button className="primary-button" onClick={onClose}>回到旅程地图<ArrowRight size={17}/></button></div>:
  <div className="journey-frame" key={cursor}>
   <aside className="frame-visual"><RosiePhoto secondary photoIndex={(lesson.day+step.scene)%6}/><div className="frame-visual-copy"><span>{scene.place}</span><h2>{step.kind==='intro'?lesson.title:scene.title}</h2></div></aside>
   <section className="frame-content" aria-label={phaseNames[step.kind]}><div className="frame-step"><span>{phaseNames[step.kind]}</span><small>{cursor+1} / {steps.length}</small></div>
    {step.kind==='intro'&&<><h1>{lesson.title}</h1><p className="story-passage" lang="en">{lesson.intro}</p><p className="story-translation" lang="zh-CN">{lesson.introZh}</p>{audioButton('material','听Rosie说')}</>}
    {step.kind==='word'&&word&&<><h1 className="vocab-word" lang="en">{word.en}</h1><p className="word-ipa">{word.ipa}</p><h2 className="word-meaning">{word.zh}</h2>{audioButton('material','听单词和例句')}<div className="example-card"><p lang="en">{word.example}</p><small lang="zh-CN">{word.exampleZh}</small></div></>}
    {step.kind==='quiz'&&word&&<><h1 className="vocab-word" lang="en">{word.en}</h1><p className="stage-prompt">这个词是什么意思？</p>{audioButton('material','再听一次')}</>}
    {step.kind==='listen'&&<><h1>{scene.title}</h1>{audioButton('material',audio.playing?'重新听这段故事':'听Rosie讲故事')}<h3 className="question-prompt">{q?.prompt}</h3>{!review&&!hintUnlocked&&<button className="hint-spend" disabled={busy} onClick={()=>void action({action:'hint',chapterId:lesson.id,cursor})}><Diamond size={13}/>用 2 钻石查看文稿</button>}{(hintUnlocked||review)&&<details className="transcript" open><summary>文稿已解锁</summary><p lang="en">{materialBlocks(scene).map(b=>b.en).join(" ")}</p><p className="story-translation">{materialBlocks(scene).map(b=>b.zh).join(" ")}</p></details>}</>}
    {step.kind==='read'&&<><h1>{scene.title}</h1><div className="reading-manuscript">{materialBlocks(scene).map((block,i)=><div key={i} className={block.kind==='rosie'?'rosie-script-line':'narration-script-line'}><span>{block.kind==='rosie'?'ROSIE':'场景'}</span><p className="story-passage" lang="en">{block.en}</p>{translated&&<p className="story-translation">{block.zh}</p>}</div>)}</div><div className="reading-tools">{audioButton('material','边听边读')}<button className="text-button" onClick={()=>setTranslated(!translated)}>{translated?'收起中文':'查看中文'}</button></div><h3 className="question-prompt" lang="en">{q?.prompt}</h3></>}
    {step.kind==='speak'&&<><h1>回应 Rosie</h1><div className="companion-line"><span>Rosie</span><p lang="en">{scene.message}</p><small lang="zh-CN">{scene.messageZh}</small>{audioButton('material','听她说')}</div><div className="reply-script"><span>你的回应</span><p lang="en">{scene.reply}</p><small lang="zh-CN">{scene.replyZh}</small>{audioButton('reply','听读音提示')}</div>{!feedback&&!review&&<JourneyRecorder key={cursor} busy={busy||audio.busy} onCapture={()=>{audio.clear();}} onSubmit={upload}/>} {review&&run.recordings[String(cursor)]&&<button className="text-button" onClick={()=>{void audio.playRecording('/api/audio?key='+encodeURIComponent(run.recordings[String(cursor)].key));}}>播放我的录音<Play size={15}/></button>}</>}
    {q&&!feedback&&<div className="learning-choices">{q.options.map((option,i)=><button key={option} disabled={busy} className={selected===i?'selected':''} aria-pressed={selected===i} onClick={()=>setSelected(i)}><span>{String.fromCharCode(65+i)}</span>{option}</button>)}</div>}
    {(error||audio.error)&&<div className="error-message" role="alert">{error||audio.error}{audio.error&&((step.kind==='word'||step.kind==='quiz'||(step.kind==='speak'&&audioTarget==='reply'))&&<button onClick={()=>audio.systemRead(step.kind==='speak'?scene.reply:word!.en+'. '+word!.example)}>系统朗读 · 不保存音频</button>)}</div>}
    {audio.note&&<p className="audio-save-note" role="status">{audio.note}{audio.playing&&<button onClick={audio.stop} aria-label="暂停学习语音"><Pause size={13}/></button>}</p>}
    {feedback&&<div className={'learning-feedback '+(feedback.correct?'correct':'retry')} role="status"><strong>{feedback.correct?(step.kind==='speak'?'录音已保存':'回答正确'):'再试一次'}</strong>{feedback.correct?<div>{feedback.gain.diamonds>0&&<span><Diamond size={15}/>+{feedback.gain.diamonds}</span>}{feedback.gain.xp>0&&<span>XP +{feedback.gain.xp}</span>}{feedback.gain.familiarity>0&&<span>熟悉 +{feedback.gain.familiarity}</span>}{feedback.gain.affection>0&&<span>心动 +{feedback.gain.affection}</span>}</div>:null}{feedback.correct&&q&&<p>{q.explanation}</p>}</div>}
    <div className="frame-actions">{feedback?<button className="primary-button full" onClick={()=>feedback.correct?next():(setFeedback(null),setSelected(null))}>{feedback.correct?(feedback.completed?'收好今天的旅程':'继续旅程'):'再试一次'}<ArrowRight size={17}/></button>:step.kind==='speak'?(review&&<button className="primary-button full" onClick={next}>下一幕<ArrowRight size={17}/></button>):<button className="primary-button full" disabled={busy||(!!q&&selected===null)} onClick={()=>void advance(selected??undefined)}>{busy?<span className="spinner"/>:step.kind==='intro'?'一起出发':step.kind==='word'?'记住了，继续':review?'下一幕':'确认答案'}<ArrowRight size={17}/></button>}</div>
   </section>
  </div>}
 </div>;
}
