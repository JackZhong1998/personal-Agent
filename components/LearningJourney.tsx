'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,BookOpen,Check,Diamond,Headphones,Heart,Mic,Pause,Play,Volume2,X} from 'lucide-react';
import {lessonSteps,materialBlocks,phaseNames,wordQuestion,listeningQuestions,type Lesson} from '@/lib/learning/content';
import {phraseTokens,readingPages,shuffledPhrases,type ReadingLanguage} from '@/lib/learning/reading';
import {type LearningProgress,learningSummary} from '@/lib/learning/progress';
import {JourneyRecorder} from './JourneyRecorder';
import {useJourneyAudio,type AudioRequest} from './useJourneyAudio';
type Gain={diamonds:number;xp:number;familiarity:number;affection:number};
const time=(seconds:number)=>`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
export function LearningJourney({lesson,progress,onProgress,onClose}:{lesson:Lesson;progress:LearningProgress;onProgress:(p:LearningProgress)=>void;onClose:()=>void}){
 const steps=lessonSteps(lesson),run=progress.runs[lesson.id];
 const [cursor,setCursor]=useState(run.completedDay?0:run.cursor),[review]=useState(!!run.completedDay),[selected,setSelected]=useState<number|null>(null),[listenAnswers,setListenAnswers]=useState<(number|null)[]>([null,null,null]),[wordOrder,setWordOrder]=useState<number[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[wrong,setWrong]=useState(''),[audioTarget,setAudioTarget]=useState<AudioRequest['target']>('material');
 const [introPage,setIntroPage]=useState(0),[readPart,setReadPart]=useState(0),[readLanguage,setReadLanguage]=useState<ReadingLanguage>('zh'),[speakPart,setSpeakPart]=useState(false),[translationOpen,setTranslationOpen]=useState(false),[hintOpen,setHintOpen]=useState(false),[reward,setReward]=useState<{id:number;gain:Gain}|null>(null);
 const audio=useJourneyAudio(),room=useRef<HTMLDivElement>(null),rewardId=useRef(0);
 const step=steps[cursor],scene=step?lesson.scenes[step.scene]:lesson.scenes.at(-1)!;
 const phase=step?.kind==='quiz'?'word':step?.kind;
 const questions=listeningQuestions(scene),listenIndex=run.listening?.[String(cursor)]||0;
 const q=step?.kind==='quiz'?wordQuestion(scene,step.word):null;
 const word=step&&(step.kind==='word'||step.kind==='quiz')?scene.words[step.word]:null;
 const pages=readingPages(scene),page=pages[readPart],tokens=page?phraseTokens(page[readLanguage],readLanguage):[],bank=page?shuffledPhrases(page[readLanguage],readLanguage):[];
 const finished=!step,summary=learningSummary(progress),hintUnlocked=progress.hints.includes(lesson.id+':'+cursor),translationUnlocked=progress.translations?.includes(lesson.id+':'+cursor)||false;
 const firstSpeaking=!!run.speaking?.[String(cursor)];
 const autoTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const playCurrent=useRef(audio.play);playCurrent.current=audio.play;
 const savedPart=run.reading?.[String(cursor)]||0;
 useEffect(()=>{if(!step||(step.kind==='intro'&&introPage===0)||(step.kind==='read'&&!review&&readPart!==savedPart))return;const timer=setTimeout(()=>{autoTimer.current=null;void playCurrent.current({chapterId:lesson.id,cursor,target:'material',...(step.kind==='read'?{part:readPart}:{})});},60);autoTimer.current=timer;return()=>{clearTimeout(timer);autoTimer.current=null;};},[lesson.id,cursor,step?.kind,introPage,step?.kind==='read'?readPart:0,readLanguage,savedPart,review]);
 useEffect(()=>{const previous=document.activeElement as HTMLElement,overflow=document.body.style.overflow;document.body.style.overflow='hidden';room.current?.focus();const trap=(e:KeyboardEvent)=>{if(e.key!=='Tab')return;const scope=room.current?.querySelector('.transcript-sheet')||room.current;const nodes=scope?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],summary,input:not(:disabled)');if(!nodes?.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===room.current)){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}};document.addEventListener('keydown',trap);return()=>{document.body.style.overflow=overflow;previous?.focus();document.removeEventListener('keydown',trap);};},[]);
 useEffect(()=>{audio.clear();setSelected(null);setListenAnswers([null,null,null]);setWordOrder([]);setWrong('');setError('');setAudioTarget('material');const part=review?0:(run.reading?.[String(cursor)]||0);setReadPart(part);setReadLanguage(!review&&run.readingChinese?.[String(cursor)]===part?'en':'zh');setSpeakPart(false);setTranslationOpen(false);setHintOpen(false);room.current?.querySelector('.frame-content')?.scrollTo(0,0);},[cursor,audio.clear]);
 useEffect(()=>{if(!hintOpen)return;const previous=document.activeElement as HTMLElement;room.current?.querySelector<HTMLButtonElement>('.transcript-sheet button')?.focus();const close=(e:KeyboardEvent)=>{if(e.key==='Escape')setHintOpen(false);};document.addEventListener('keydown',close);return()=>{previous?.focus();document.removeEventListener('keydown',close);};},[hintOpen]);
 useEffect(()=>{if(!reward)return;const timer=setTimeout(()=>setReward(null),1400);return()=>clearTimeout(timer);},[reward]);
 async function action(body:unknown){setError('');setBusy(true);try{const r=await fetch('/api/learn',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw new Error(data.error||'保存失败，请重试');onProgress(data.progress);return data;}catch(e){setError((e as Error).message);return null;}finally{setBusy(false);}}
 function settle(data:{progress:LearningProgress;correct:boolean;duplicate?:boolean;gain:Gain},explanation='再听一次，再试一次。'){
  if(!data.correct){setWrong(explanation+(data.gain.diamonds<0?' · 钻石 −1':' · 钻石已为 0'));setSelected(null);return false;}
  setWrong('');setSelected(null);
  if(!data.duplicate&&Object.values(data.gain).some(v=>v>0))setReward({id:++rewardId.current,gain:data.gain});
  setCursor(data.progress.runs[lesson.id].cursor);return true;
 }
 async function advance(){
  audio.unlock();
  if(step?.kind==='intro'&&introPage===0){setIntroPage(1);return;}
  if(step?.kind==='speak'&&!speakPart){setSpeakPart(true);return;}
  audio.stop();
  if(review){setCursor(v=>v+1);return;}
  if(step.kind==='listen'){
   if(listenAnswers.some(a=>a===null))return;
   for(let i=listenIndex;i<questions.length;i++){
    const d=await action({action:'advance',chapterId:lesson.id,cursor,question:i,answer:listenAnswers[i]});if(!d)return;
    if(!d.correct){setWrong(`第 ${i+1} 题：${questions[i].explanation} · ${d.gain.diamonds<0?'钻石 −1':'钻石已为 0'}`);return;}
    if(i===questions.length-1)settle(d);
   }return;
  }
  if(step.kind==='read'){
   if(wordOrder.length!==tokens.length)return;
   if(review){setWordOrder([]);if(readLanguage==='zh')setReadLanguage('en');else if(readPart+1<pages.length){setReadPart(v=>v+1);setReadLanguage('zh');audio.clear();}else setCursor(v=>v+1);return;}
   const d=await action({action:'read-part',chapterId:lesson.id,cursor,part:readPart,language:readLanguage,order:wordOrder});if(!d)return;
   if(!d.correct){setWrong('顺序还不对，重听后再试。· '+(d.gain.diamonds<0?'钻石 −1':'钻石已为 0'));setWordOrder([]);return;}
   setWrong('');setWordOrder([]);if(readLanguage==='zh')setReadLanguage('en');else if(d.progress.runs[lesson.id].cursor>cursor)settle(d);else{setReadPart(v=>v+1);setReadLanguage('zh');audio.clear();room.current?.querySelector('.frame-content')?.scrollTo(0,0);}return;
  }
  const d=await action({action:'advance',chapterId:lesson.id,cursor,answer:selected??undefined});if(d)settle(d,q?.explanation);
 }
 async function upload(blob:Blob,duration:number){
  setError('');setBusy(true);audio.stop();try{const form=new FormData();form.set('chapterId',lesson.id);form.set('cursor',String(cursor));form.set('duration',String(duration));form.set('audio',blob,'reply.'+(blob.type.includes('mp4')?'m4a':'webm'));const r=await fetch('/api/learn/recording',{method:'POST',body:form});const data=await r.json();if(!r.ok)throw new Error(data.error||'录音保存失败');onProgress(data.progress);if(data.needsSecond){setWrong('第一次已保存，再说一次。');return;}settle(data);}catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 const request:AudioRequest={chapterId:lesson.id,cursor,target:audioTarget,...(step?.kind==='read'?{part:readPart}:{})};
 function audioControls(){return <div className="learning-audio-controls"><div className="audio-buttons"><button className="lesson-audio" disabled={busy||audio.busy} onClick={()=>{if(autoTimer.current){clearTimeout(autoTimer.current);autoTimer.current=null;}audio.unlock();if(audio.ready){audio.playing?audio.stop():audio.resume();return;}void audio.play(request);}}>{audio.busy?<span className="spinner"/>:audio.playing?<Pause size={17}/>:<Play size={17}/>}<span>{step.kind==='word'||step.kind==='quiz'?'听单词':step.kind==='speak'&&audioTarget==='reply'?'读音提示':'听语音'}</span></button>{step.kind==='speak'&&speakPart&&<button className="audio-switch" onClick={()=>{audio.clear();setAudioTarget(audioTarget==='reply'?'material':'reply');}}>{audioTarget==='reply'?'提问':'读音提示'}</button>}{(step.kind==='listen'||step.kind==='read')&&<div className="audio-rates" role="group" aria-label="播放速度">{[1,.8,.5].map(rate=><button key={rate} className={audio.rate===rate?'active':''} onClick={()=>audio.speed(rate)}>{rate===1?'1×':rate+'×'}</button>)}</div>}</div>{audio.ready&&(step.kind==='listen'||step.kind==='read')&&<label className="audio-timeline"><span>{time(audio.position)}</span><input type="range" aria-label="拖动语音位置" min="0" max={Math.max(audio.duration,.1)} step="0.05" value={Math.min(audio.position,Math.max(audio.duration,.1))} onChange={e=>audio.seek(Number(e.target.value))}/><span>{time(audio.duration)}</span></label>}</div>;}
 const actionDisabled=busy||(step?.kind==='quiz'&&selected===null)||(step?.kind==='listen'&&listenAnswers.some(a=>a===null))||(step?.kind==='read'&&wordOrder.length!==tokens.length);
 return <div className={'learning-room focused-learning phase-'+phase} role="dialog" aria-modal="true" aria-label={`旅行章节：${lesson.title}`} tabIndex={-1} ref={room}>
 <header className="learning-header"><button className="icon-button" onClick={onClose} disabled={busy} aria-label="保存并离开旅程"><ArrowLeft size={20}/></button><div className="learning-title"><strong>{lesson.title}</strong><span>第 {lesson.day} 章</span></div><div className={'learning-wallet '+(reward?'wallet-flash':'')} key={reward?.id||0}><Diamond size={15}/><b>{progress.diamonds}</b><Heart size={15}/><b>{progress.affection}</b>{reward&&<span className="wallet-gain" role="status">{reward.gain.diamonds>0&&`◇ +${reward.gain.diamonds} `}{reward.gain.affection>0&&`♡ +${reward.gain.affection}`}</span>}</div></header>
 <div className="learning-progress" role="progressbar" aria-label="本章进度" aria-valuenow={Math.min(cursor,steps.length)} aria-valuemin={0} aria-valuemax={steps.length}><i style={{width:`${cursor/steps.length*100}%`}}/></div>
 {finished?<div className="journey-finished"><div className="finish-symbol"><Check size={30}/></div><h1>{review?'回看完成':'今天的旅程，完成了。'}</h1><div className="finish-stats"><span><b>{lesson.scenes.reduce((n,s)=>n+s.words.length,0)}</b>个新词</span><span><b>6</b>道听力</span><span><b>{summary.streak}</b>天连续</span></div><button className="primary-button" onClick={onClose}>返回章节<ArrowRight size={17}/></button></div>:<>
 <div className="learning-toolbar"><div className="learning-phases">{[{id:'word',label:'单词',icon:BookOpen},{id:'listen',label:'听力',icon:Headphones},{id:'read',label:'拼句',icon:BookOpen},{id:'speak',label:'开口',icon:Mic}].map(p=><span key={p.id} className={phase===p.id?'active':''}><p.icon size={12}/>{p.label}</span>)}</div><small>{cursor+1} / {steps.length}</small></div>
 <div className="journey-frame" key={cursor}><section className="frame-content" aria-label={phaseNames[step.kind]}>
 {step.kind==='intro'&&(introPage===0?<div className="learning-guide"><h1>学习流程</h1><ol><li><b>01</b><span>学单词<small>答对 1 词得 1 钻石</small></span></li><li><b>02</b><span>听故事<small>同页完成 3 题，可拖动、变速</small></span></li><li><b>03</b><span>听音拼句<small>先拼中文，再拼英文短语</small></span></li><li><b>04</b><span>开口回应<small>听完提问，说两次回应</small></span></li></ol><p><Heart size={14}/>每日完成首章 +5 心动；答错扣 1 钻石，查看翻译扣 2 钻石。</p></div>:<><h1>{lesson.title}</h1><p className="story-passage" lang="en">{lesson.intro}</p><p className="story-translation">{lesson.introZh}</p></>)}
 {step.kind==='word'&&word&&<><h1 className="vocab-word" lang="en">{word.en}</h1><p className="word-ipa">{word.ipa}</p><h2 className="word-meaning">{word.zh}</h2><div className="example-card"><p lang="en">{word.example}</p><small>{word.exampleZh}</small></div></>}
 {step.kind==='quiz'&&word&&<><h1 className="vocab-word" lang="en">{word.en}</h1><p className="stage-prompt">这个词是什么意思？</p><div className="learning-choices">{q!.options.map((option,i)=><button key={option} disabled={busy} className={selected===i?'selected':''} aria-pressed={selected===i} onClick={()=>{setSelected(i);setWrong('');}}><span>{String.fromCharCode(65+i)}</span>{option}</button>)}</div></>}
 {step.kind==='listen'&&<><div className="listening-heading"><h1>{scene.title}</h1><span className="listening-question-count">3 题</span></div><div className="listening-all">{questions.map((question,index)=><div className="listening-item" key={index}><h3 className="question-prompt">{index+1}. {question.prompt}</h3><div className="learning-choices">{question.options.map((option,i)=><button key={option} disabled={busy||index<listenIndex} className={listenAnswers[index]===i?'selected':''} aria-pressed={listenAnswers[index]===i} onClick={()=>{setListenAnswers(v=>v.map((a,n)=>n===index?i:a));setWrong('');}}><span>{String.fromCharCode(65+i)}</span>{option}</button>)}</div></div>)}</div><button className="hint-spend" disabled={busy} onClick={async()=>{audio.stop();if(review||hintUnlocked){setHintOpen(true);return;}const d=await action({action:'hint',chapterId:lesson.id,cursor});if(d)setHintOpen(true);}}><Diamond size={13}/>{hintUnlocked||review?'查看文稿':'文稿 · 2 钻石'}</button></>}
 {step.kind==='read'&&page&&<><div className="reading-page-heading"><span>{readLanguage==='zh'?'听英文 · 拼中文':'看中文 · 拼英文'}</span><small>{readPart+1} / {pages.length} · {readLanguage==='zh'?'1':'2'}/2</small></div><div className="reading-manuscript">{readLanguage==='en'&&<p className="story-translation">{page.zh}</p>}<div className="sentence-slots" aria-label={readLanguage==='zh'?'中文句子拼写':'英文短语拼写'}>{tokens.map((_,i)=><button key={i} className={wordOrder[i]===undefined?'empty':''} onClick={()=>setWordOrder(v=>v.slice(0,i))} aria-label={`第 ${i+1} 个短语${wordOrder[i]===undefined?'空白':tokens[wordOrder[i]]}`}>{wordOrder[i]===undefined?' ':tokens[wordOrder[i]]}</button>)}</div></div><div className="word-bank" aria-label={readLanguage==='zh'?'打乱的中文词组':'打乱的英文短语'}>{bank.map(({word,id})=><button key={id} data-word-id={id} disabled={wordOrder.includes(id)} onClick={()=>{setWordOrder(v=>[...v,id]);setWrong('');}}>{word}</button>)}</div></>}
 {step.kind==='speak'&&<><h1>{speakPart?'你的回应':'Rosé 说'}</h1><div className="companion-line"><p lang="en">{scene.message}</p>{!speakPart&&(translationOpen||translationUnlocked)&&<small>{scene.messageZh}</small>}</div>{!speakPart&&<button className="hint-spend" disabled={busy} onClick={async()=>{if(review||translationUnlocked){setTranslationOpen(true);return;}const d=await action({action:'translation',chapterId:lesson.id,cursor});if(d)setTranslationOpen(true);}}><Diamond size={13}/>{translationUnlocked||review?'显示中文':'显示中文 · 2 钻石'}</button>}{speakPart&&<div className="reply-script"><span>你的回应 · {firstSpeaking?'第二次':'第一次'}</span><p lang="en">{scene.reply}</p><small>{scene.replyZh}</small></div>}{review&&speakPart&&run.recordings[String(cursor)]&&<button className="text-button" onClick={()=>void audio.playRecording('/api/audio?key='+encodeURIComponent(run.recordings[String(cursor)].key))}>播放我的录音<Play size={14}/></button>}</>}
 {wrong&&<p className="answer-retry" role="status">{wrong}</p>}
 </section></div>
 <footer className="learning-dock">
 {(error||audio.error)&&<div className="error-message" role="alert">{error||audio.error}{audio.error&&((step.kind==='word'||step.kind==='quiz'||(step.kind==='speak'&&audioTarget==='reply'))&&<button onClick={()=>audio.systemRead(step.kind==='speak'?scene.reply:word!.en+'. '+word!.example)}>系统朗读 · 不保存音频</button>)}</div>}
 {audio.note&&<p className="audio-save-note" role="status">{audio.note}</p>}
 <div className="learning-footer-layout"><div className="learning-dock-audio">{audioControls()}</div><div className="learning-primary-action">
 {step.kind==='speak'&&speakPart&&!review?<JourneyRecorder key={`${cursor}-${firstSpeaking?'second':'first'}`} busy={busy||audio.busy} onCapture={audio.clear} onSubmit={upload}/>:<button className="primary-button full" disabled={actionDisabled} onClick={()=>void advance()}>{busy?<span className="spinner"/>:step.kind==='intro'?(introPage===0?'了解了，出发':'开始学单词'):step.kind==='word'?'继续':step.kind==='read'?'确认拼句':step.kind==='speak'?(speakPart?'下一幕':'我要回应'):'确认答案'}<ArrowRight size={17}/></button>}
 </div></div>
 </footer>
 </>}
 {hintOpen&&<div className="transcript-overlay"><div role="dialog" aria-modal="true" aria-label="听力文稿" className="transcript-sheet"><header><strong>听力文稿</strong><button className="icon-button" aria-label="关闭文稿" onClick={()=>setHintOpen(false)}><X size={18}/></button></header><div className="transcript">{materialBlocks(scene).map((b,i)=><div key={i}><p lang="en">{b.en}</p><p className="story-translation">{b.zh}</p></div>)}</div></div></div>}
 </div>;
}
