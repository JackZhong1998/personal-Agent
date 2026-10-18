'use client';
import Link from 'next/link';
import {useState} from 'react';
import {ArrowLeft,ArrowRight,Check,Diamond,Flame,Heart,LockKeyhole} from 'lucide-react';
import {lessons,type Lesson} from '@/lib/learning/content';
import {learningSummary} from '@/lib/learning/progress';
import {useLearningState} from './useLearningState';
import {LearningJourney} from './LearningJourney';
import {RosiePhoto} from './RosiePhoto';
import {RosieCredits} from './RosieCredits';
import {NameSetup} from './NameSetup';
export function TravelCourse(){
 const learning=useLearningState(),[active,setActive]=useState<Lesson|null>(null),[busy,setBusy]=useState<string|null>(null),[error,setError]=useState('');
 const summary=learningSummary(learning.progress),next=lessons.find(l=>!learning.progress.runs[l.id]?.completedDay)||lessons[0];
 async function start(lesson:Lesson){setBusy(lesson.id);setError('');try{const r=await fetch('/api/learn',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start',chapterId:lesson.id})});const data=await r.json();if(!r.ok)throw new Error(data.error||'旅程暂未准备好');learning.setProgress(data.progress);setActive(lesson);}catch(e){setError((e as Error).message);}finally{setBusy(null);}}
 return <div className="travel-course"><header className="rosie-nav"><Link href="/" className="text-button"><ArrowLeft size={17}/>首页</Link><span className="rosie-wordmark">Rosé <span>/ 美国旅行</span></span></header><main className="travel-main"><section className="course-poster"><RosiePhoto secondary photoIndex={3}/><div className="course-poster-copy"><h1>和 Rosé，<br/>一起去美国。</h1><div><span>7 天纽约旅程</span><span>140 个词与表达</span></div><button className="primary-button" disabled={!!busy||!learning.loaded||!learning.progress.companionId} onClick={()=>void start(next)}>{busy===next.id?'正在打开…':summary.completed===lessons.length?'回看章节':summary.todayComplete?'下一章':learning.progress.runs[next.id]?.cursor?'继续学习':'开始今日章节'}<ArrowRight size={17}/></button></div></section>
 {!learning.progress.companionId&&learning.loaded&&<section className="travel-name"><NameSetup initial={learning.name} onSave={learning.choose}/></section>}
 {(error||learning.error)&&<div className="error-message" role="alert">{error||learning.error}{learning.error&&<button onClick={()=>void learning.load()}>重新同步</button>}</div>}
 <div className="course-metrics"><span><Flame size={16}/><b>{summary.streak}</b>天同行</span><span><Diamond size={16}/><b>{learning.progress.diamonds}</b>钻石</span><span><Heart size={16}/><b>{learning.progress.affection}</b>心动</span><span><Check size={16}/><b>{summary.completed}/7</b>章</span></div>
 <div className="course-map-heading"><div><h2>章节</h2></div><span className={'daily-check '+(summary.todayComplete?'complete':'')}>{summary.todayComplete?'今日任务已完成':'今日目标 · 完成 1 章'}</span></div>
 <div className="course-map">{lessons.map((lesson,i)=>{const run=learning.progress.runs[lesson.id],unlocked=!!learning.progress.companionId&&(i===0||!!learning.progress.runs[lessons[i-1].id]?.completedDay),done=!!run?.completedDay;return <button className={'course-day '+(done?'done':unlocked?'unlocked':'locked')} key={lesson.id} disabled={!unlocked||!!busy} aria-label={`第 ${lesson.day} 章：${lesson.title}${!unlocked?'，待解锁':''}`} onClick={()=>void start(lesson)}><span className="day-number">{done?<Check size={22}/>:String(lesson.day).padStart(2,'0')}</span><span className="day-text"><small>{lesson.place}</small><h3>{lesson.title}</h3>{done&&<p>已完成</p>}</span>{!unlocked?<LockKeyhole size={16}/>:busy===lesson.id?<span className="spinner"/>:<ArrowRight size={19}/>}</button>;})}</div>

 </main><footer className="rosie-footer"><RosieCredits/></footer>
 {active&&<LearningJourney lesson={active} progress={learning.progress} onProgress={learning.setProgress} onClose={()=>setActive(null)}/>}
 </div>;
}
