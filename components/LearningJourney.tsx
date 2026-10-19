'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,BookOpen,Check,Diamond,Headphones,Heart,Mic,Pause,Play,Volume2,X} from 'lucide-react';
import {lessonSteps,materialBlocks,phaseNames,wordQuestion,listeningQuestions,type Lesson} from '@/lib/learning/content';
import {readingPages} from '@/lib/learning/reading';
import {type LearningProgress,learningSummary} from '@/lib/learning/progress';
import {JourneyRecorder} from './JourneyRecorder';
import {useJourneyAudio,type AudioRequest} from './useJourneyAudio';
type Gain={diamonds:number;xp:number;familiarity:number;affection:number};
export function LearningJourney({lesson,progress,onProgress,onClose}:{lesson:Lesson;progress:LearningProgress;onProgress:(p:LearningProgress)=>void;onClose:()=>void}){
 const steps=lessonSteps(lesson),run=progress.runs[lesson.id];
 const [cursor,setCursor]=useState(run.completedDay?0:run.cursor),[review]=useState(!!run.completedDay),[selected,setSelected]=useState<number|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[wrong,setWrong]=useState(''),[translated,setTranslated]=useState(false),[audioTarget,setAudioTarget]=useState<AudioRequest['target']>('material');
 const [introPage,setIntroPage]=useState(0),[readPart,setReadPart]=useState(0),[speakPart,setSpeakPart]=useState(false),[hintOpen,setHintOpen]=useState(false),[reviewQuestion,setReviewQuestion]=useState(0),[reward,setReward]=useState<{id:number;gain:Gain}|null>(null);
 const audio=useJourneyAudio(),room=useRef<HTMLDivElement>(null),rewardId=useRef(0);
 useEffect(()=>{const previous=document.activeElement as HTMLElement,overflow=document.body.style.overflow;document.body.style.overflow='hidden';room.current?.focus();const trap=(e:KeyboardEvent)=>{if(e.key!=='Tab')return;const scope=room.current?.querySelector('.transcript-sheet')||room.current;const nodes=scope?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],summary');if(!nodes?.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===room.current)){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}};document.addEventListener('keydown',trap);return()=>{document.body.style.overflow=overflow;previous?.focus();document.removeEventListener('keydown',trap);};},[]);
 useEffect(()=>{audio.clear();setSelected(null);setWrong('');setError('');setTranslated(false);setReadPart(0);setSpeakPart(false);setHintOpen(false);setReviewQuestion(0);room.current?.querySelector('.frame-content')?.scrollTo(0,0);},[cursor,audio.clear]);
 useEffect(()=>{if(!hintOpen)return;const previous=document.activeElement as HTMLElement;room.current?.querySelector<HTMLButtonElement>('.transcript-sheet button')?.focus();const close=(e:KeyboardEvent)=>{if(e.key==='Escape')setHintOpen(false);};document.addEventListener('keydown',close);return()=>{previous?.focus();document.removeEventListener('keydown',close);};},[hintOpen]);
 useEffect(()=>{if(!reward)return;const timer=setTimeout(()=>setReward(null),1400);return()=>clearTimeout(timer);},[reward]);
 const step=steps[cursor],scene=step?lesson.scenes[step.scene]:lesson.scenes.at(-1)!;
 const phase=step?.kind==='quiz'?'word':step?.kind;
 const listenIndex=review?reviewQuestion:(run.listening?.[String(cursor)]||0),questions=listeningQuestions(scene);
 const q=step?.kind==='quiz'?wordQuestion(scene,step.word):step?.kind==='listen'?questions[listenIndex]:step?.kind==='read'?scene.reading:null;
 const word=step&&(step.kind==='word'||step.kind==='quiz')?scene.words[step.word]:null;
 const pages=readingPages(scene),page=pages[readPart],readingQuestion=step?.kind==='read'&&readPart>=pages.length;
 const hintUnlocked=progress.hints.includes(lesson.id+':'+cursor),finished=!step,summary=learningSummary(progress);
 async function action(body:unknown){setError('');setBusy(true);try{const r=await fetch('/api/learn',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw new Error(data.error||'保存失败，请重试');onProgress(data.progress);return data;}catch(e){setError((e as Error).message);return null;}finally{setBusy(false);}}
 function settle(data:{progress:LearningProgress;correct:boolean;duplicate?:boolean;gain:Gain}){
  if(!data.correct){setWrong(q?.explanation||'再听一次，再选一次。');setSelected(null);return;}
  setWrong('');setSelected(null);
  if(!data.duplicate&&Object.values(data.gain).some(v=>v>0))setReward({id:++rewardId.current,gain:data.gain});
  setCursor(data.progress.runs[lesson.id].cursor);
 }
 async function advance(){
  if(step?.kind==='intro'&&introPage===0){setIntroPage(1);return;}
  if(step?.kind==='speak'&&!speakPart){setSpeakPart(true);return;}
  if(step?.kind==='read'&&!readingQuestion){setReadPart(p=>p+1);return;}
  audio.stop();
  if(review){if(step.kind==='listen'&&reviewQuestion<questions.length-1){setReviewQuestion(v=>v+1);setSelected(null);}else setCursor(v=>v+1);return;}
  const data=await action({action:'advance',chapterId:lesson.id,cursor,answer:selected??undefined,...(step.kind==='listen'?{question:listenIndex}:{})});if(data)settle(data);
 }
 async function upload(blob:Blob,duration:number){
  setError('');setBusy(true);audio.stop();try{const form=new FormData();form.set('chapterId',lesson.id);form.set('cursor',String(cursor));form.set('duration',String(duration));form.set('audio',blob,'reply.'+(blob.type.includes('mp4')?'m4a':'webm'));const r=await fetch('/api/learn/recording',{method:'POST',body:form});const data=await r.json();if(!r.ok)throw new Error(data.error||'录音保存失败');onProgress(data.progress);settle(data);}catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 function audioButton(target:AudioRequest['target'],label:string){return <button className="lesson-audio" disabled={audio.busy||busy} onClick={()=>{setAudioTarget(target);void audio.play({chapterId:lesson.id,cursor,target});}}>{audio.busy?<span className="spinner"/>:<Volume2 size={17}/>}<span>{label}</span></button>;}
 const showChoices=!!q&&(step.kind!=='read'||readingQuestion);
 return <div className={'learning-room focused-learning phase-'+phase} role="dialog" aria-modal="true" aria-label={`旅行章节：${lesson.title}`} tabIndex={-1} ref={room}>
 <header className="learning-header"><button className="icon-button" onClick={onClose} disabled={busy} aria-label="保存并离开旅程"><ArrowLeft size={20}/></button><div className="learning-title"><strong>{lesson.title}</strong><span>第 {lesson.day} 章</span></div><div className={'learning-wallet '+(reward?'wallet-flash':'')} key={reward?.id||0}><Diamond size={15}/><b>{progress.diamonds}</b><Heart size={15}/><b>{progress.affection}</b>{reward&&<span className="wallet-gain" role="status">{reward.gain.diamonds>0&&`◇ +${reward.gain.diamonds} `}{reward.gain.diamonds===0&&reward.gain.affection===0&&'✓ '}{reward.gain.affection>0&&`♡ +${reward.gain.affection}`}</span>}</div></header>
 <div className="learning-progress" role="progressbar" aria-label="本章进度" aria-valuenow={Math.min(cursor,steps.length)} aria-valuemin={0} aria-valuemax={steps.length}><i style={{width:`${cursor/steps.length*100}%`}}/></div>
 {finished?<div className="journey-finished"><div className="finish-symbol"><Check size={30}/></div><h1>{review?'回看完成':'今天的旅程，完成了。'}</h1><div className="finish-stats"><span><b>{lesson.scenes.reduce((n,s)=>n+s.words.length,0)}</b>个新词</span><span><b>6</b>道听力</span><span><b>{summary.streak}</b>天连续</span></div><button className="primary-button" onClick={onClose}>返回章节<ArrowRight size={17}/></button></div>:<>
 <div className="learning-toolbar"><div className="learning-phases">{[{id:'word',label:'单词',icon:BookOpen},{id:'listen',label:'听力',icon:Headphones},{id:'read',label:'阅读',icon:BookOpen},{id:'speak',label:'开口',icon:Mic}].map(p=><span key={p.id} className={phase===p.id?'active':''}><p.icon size={12}/>{p.label}</span>)}</div><small>{cursor+1} / {steps.length}</small></div>
 <div className="journey-frame" key={cursor}><section className="frame-content" aria-label={phaseNames[step.kind]}>
 <div className="frame-step"><span>{phaseNames[step.kind]}</span><small>{cursor+1} / {steps.length}</small></div>
 {step.kind==='intro'&&(introPage===0?<div className="learning-guide"><h1>学习流程</h1><ol><li><b>01</b><span>学单词<small>每 5 个词一组，答对 1 词得 1 钻石</small></span></li><li><b>02</b><span>听故事<small>每段 3 题，可重听；2 钻石解锁双语文稿</small></span></li><li><b>03</b><span>边听边读<small>同一份故事，一段一段看懂</small></span></li><li><b>04</b><span>开口回应<small>照着双语提示说，和 Rosé 继续旅行</small></span></li></ol><p><Heart size={14}/>每日完成首章 +5 心动，连续学习再加成。</p></div>:<><h1>{lesson.title}</h1><p className="story-passage" lang="en">{lesson.intro}</p><p className="story-translation">{lesson.introZh}</p>{audioButton('material','听Rosé说')}</>)}
 {step.kind==='word'&&word&&<><h1 className="vocab-word" lang="en">{word.en}</h1><p className="word-ipa">{word.ipa}</p><h2 className="word-meaning">{word.zh}</h2>{audioButton('material','听单词和例句')}<div className="example-card"><p lang="en">{word.example}</p><small>{word.exampleZh}</small></div></>}
 {step.kind==='quiz'&&word&&<><h1 className="vocab-word" lang="en">{word.en}</h1><p className="stage-prompt">这个词是什么意思？</p>{audioButton('material','再听一次')}</>}
 {step.kind==='listen'&&<><div className="listening-heading"><h1>{scene.title}</h1><span className="listening-question-count">{listenIndex+1} / {questions.length}</span></div>{audioButton('material','听Rosé讲故事')}<h3 className="question-prompt">{q?.prompt}</h3><button className="hint-spend" disabled={busy} onClick={async()=>{audio.stop();if(review||hintUnlocked){setHintOpen(true);return;}const d=await action({action:'hint',chapterId:lesson.id,cursor});if(d)setHintOpen(true);}}><Diamond size={13}/>{hintUnlocked||review?'查看文稿':'文稿 · 2 钻石'}</button></>}
 {step.kind==='read'&&<>{!readingQuestion&&page?<><div className="reading-page-heading"><span>{page.kind==='rosie'?'ROSÉ':'场景'}</span><small>{readPart+1} / {pages.length}</small></div><div className={'reading-manuscript '+(page.kind==='rosie'?'rosie-script-line':'narration-script-line')}><p className="story-passage" lang="en">{page.en}</p>{translated&&<p className="story-translation">{page.zh}</p>}</div></>:<h3 className="question-prompt">{q?.prompt}</h3>}<div className="reading-tools">{audioButton('material','边听边读')}<button className="text-button" onClick={()=>setTranslated(!translated)}>{translated?'收起中文':'查看中文'}</button>{readPart>0&&<button className="text-button" onClick={()=>setReadPart(v=>v-1)}>上一段</button>}</div></>}
 {step.kind==='speak'&&<><h1>{speakPart?'你的回应':'Rosé 说'}</h1>{!speakPart?<div className="companion-line"><span>Rosé</span><p lang="en">{scene.message}</p><small>{scene.messageZh}</small>{audioButton('material','听她说')}</div>:<div className="reply-script"><span>你的回应</span><p lang="en">{scene.reply}</p><small>{scene.replyZh}</small>{audioButton('reply','听读音提示')}</div>}{review&&speakPart&&run.recordings[String(cursor)]&&<button className="text-button" onClick={()=>void audio.playRecording('/api/audio?key='+encodeURIComponent(run.recordings[String(cursor)].key))}>播放我的录音<Play size={14}/></button>}</>}
 {showChoices&&<div className="learning-choices">{q!.options.map((option,i)=><button key={option} disabled={busy} className={selected===i?'selected':''} aria-pressed={selected===i} onClick={()=>{setSelected(i);setWrong('');}}><span>{String.fromCharCode(65+i)}</span>{option}</button>)}</div>}
 {wrong&&<p className="answer-retry" role="status">{wrong}</p>}
 </section></div>
 <footer className="learning-dock">
 {(error||audio.error)&&<div className="error-message" role="alert">{error||audio.error}{audio.error&&((step.kind==='word'||step.kind==='quiz'||(step.kind==='speak'&&audioTarget==='reply'))&&<button onClick={()=>audio.systemRead(step.kind==='speak'?scene.reply:word!.en+'. '+word!.example)}>系统朗读 · 不保存音频</button>)}</div>}
 {audio.note&&<p className="audio-save-note" role="status">{audio.note}{audio.playing&&<button onClick={audio.stop} aria-label="暂停学习语音"><Pause size={13}/></button>}</p>}
 {step.kind==='speak'&&speakPart&&!review?<JourneyRecorder key={cursor} busy={busy||audio.busy} onCapture={audio.clear} onSubmit={upload}/>:<button className="primary-button full" disabled={busy||(showChoices&&selected===null)} onClick={()=>void advance()}>{busy?<span className="spinner"/>:step.kind==='intro'?(introPage===0?'了解了，出发':'开始学单词'):step.kind==='word'?'继续':step.kind==='read'&&!readingQuestion?'下一段':step.kind==='speak'?(speakPart?'下一幕':'我要回应'):'确认答案'}<ArrowRight size={17}/></button>}
 </footer>
 </>}
 {hintOpen&&<div className="transcript-overlay"><div role="dialog" aria-modal="true" aria-label="听力文稿" className="transcript-sheet"><header><strong>听力文稿</strong><button className="icon-button" aria-label="关闭文稿" onClick={()=>setHintOpen(false)}><X size={18}/></button></header><div className="transcript">{materialBlocks(scene).map((b,i)=><div key={i}><p lang="en">{b.en}</p><p className="story-translation">{b.zh}</p></div>)}</div></div></div>}
 </div>;
}
