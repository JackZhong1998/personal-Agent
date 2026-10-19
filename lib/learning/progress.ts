import {lessons,lessonSteps,wordQuestion,listeningQuestions,COURSE_ID,COMPANION} from './content';
import {localDay} from '../story';
import {AppError} from '../errors';
import {recordActivity,dailyHeartReward} from './relationship';
import {readingPages,phraseTokens} from './reading';
export type LearningRun={cursor:number;listening?:Record<string,number>;reading?:Record<string,number>;speaking?:Record<string,{key:string;duration:number}>;recordings:Record<string,{key:string;duration:number}>;completedDay?:string};
export type LearningProgress={version:string;companionId:string|null;active:string|null;runs:Record<string,LearningRun>;diamonds:number;xp:number;familiarity:number;affection:number;earned:string[];hints:string[];translations?:string[];days:string[];activeDays?:string[];heartPolicy?:{startedDay:string;settledThrough:string}};
export const emptyLearning=():LearningProgress=>({version:COURSE_ID,companionId:null,active:null,runs:{},diamonds:0,xp:0,familiarity:0,affection:0,earned:[],hints:[],translations:[],days:[],activeDays:[]});
export function findLesson(id:string){const lesson=lessons.find(l=>l.id===id);if(!lesson)throw new AppError(404,'没有找到这个旅程章节');return lesson;}
export function requireUnlocked(p:LearningProgress,id:string){
 const lesson=findLesson(id),index=lessons.indexOf(lesson);
 if(p.companionId!==COMPANION.id)throw new AppError(403,'请先选择你的声音伙伴');
 if(index>0&&!p.runs[lessons[index-1].id]?.completedDay)throw new AppError(403,'先完成前一章，再出发吧');
 return lesson;
}
export function startLearning(p:LearningProgress,id:string){requireUnlocked(p,id);p.active=id;p.runs[id]??={cursor:0,recordings:{}};return p;}
export function advanceLearning(p:LearningProgress,id:string,cursor:number,answer?:number,recording?:{key:string;duration:number},day=localDay('Asia/Shanghai'),questionIndex=0){
 const lesson=requireUnlocked(p,id),run=p.runs[id];if(!run)throw new AppError(409,'请先进入这一章');
 if(cursor<run.cursor)return {progress:p,correct:true,duplicate:true,gain:{diamonds:0,xp:0,familiarity:0,affection:0},completed:!!run.completedDay};
 if(cursor!==run.cursor)throw new AppError(409,'进度已更新，请重新进入章节');
 const step=lessonSteps(lesson)[cursor];if(!step)throw new AppError(409,'这一章已完成');
 const scene=lesson.scenes[step.scene],listenIndex=run.listening?.[String(cursor)]||0;
 if(step.kind==='listen'&&questionIndex!==listenIndex){
  if(questionIndex<listenIndex)return {progress:p,correct:true,duplicate:true,gain:{diamonds:0,xp:0,familiarity:0,affection:0},completed:false};
  throw new AppError(409,'请按顺序完成听力题目');
 }
 const q=step.kind==='quiz'?wordQuestion(scene,step.word):step.kind==='listen'?listeningQuestions(scene)[listenIndex]:step.kind==='read'?scene.reading:null;
 if(step.kind==='read')throw new AppError(400,'请先完成分段拼句');
 if(step.kind==='speak'&&!recording)throw new AppError(400,'请录下你的回应，再继续');
 recordActivity(p,day);
 if(q&&answer!==q.answer){const before=p.diamonds;p.diamonds=Math.max(0,p.diamonds-1);return {progress:p,correct:false,duplicate:false,gain:{diamonds:p.diamonds-before,xp:0,familiarity:0,affection:0},completed:false};}
 const gain={diamonds:0,xp:0,familiarity:0,affection:0};
 if(step.kind==='quiz'){
  const key=id+':'+step.scene+':'+step.word;
  if(!p.earned.includes(key)){p.earned.push(key);gain.diamonds=1;gain.xp=10;}
 }
 if(step.kind==='listen'){
  run.listening??={};run.listening[String(cursor)]=listenIndex+1;
  gain.xp=listenIndex===listeningQuestions(scene).length-1?1:2;
  if(run.listening[String(cursor)]<listeningQuestions(scene).length){p.xp+=gain.xp;return {progress:p,correct:true,duplicate:false,gain,completed:false};}
 }
 if(step.kind==='speak'){run.speaking??={};if(!run.speaking[String(cursor)]){run.speaking[String(cursor)]=recording!;return {progress:p,correct:true,duplicate:false,gain,completed:false,needsSecond:true};}run.recordings[String(cursor)]=recording!;gain.xp=15;gain.familiarity=3;}
 run.cursor++;
 if(run.cursor===lessonSteps(lesson).length&&!run.completedDay){run.completedDay=day;gain.affection=dailyHeartReward(p,day);if(!p.days.includes(day))p.days.push(day);gain.familiarity+=4;}
 p.diamonds+=gain.diamonds;p.xp+=gain.xp;p.familiarity+=gain.familiarity;p.affection+=gain.affection;
 return {progress:p,correct:true,duplicate:false,gain,completed:!!run.completedDay};
}
export function submitReadingPart(p:LearningProgress,id:string,cursor:number,part:number,order:number[],day=localDay('Asia/Shanghai')){
 const lesson=requireUnlocked(p,id),run=p.runs[id];if(!run||run.cursor!==cursor)throw new AppError(409,'请先完成当前学习步骤');const step=lessonSteps(lesson)[cursor];if(step?.kind!=='read')throw new AppError(400,'现在不在拼句阶段');
 const pages=readingPages(lesson.scenes[step.scene]),current=run.reading?.[String(cursor)]||0;
 if(part<current)return {progress:p,correct:true,duplicate:true,gain:{diamonds:0,xp:0,familiarity:0,affection:0},completed:false};
 if(part!==current||part>=pages.length)throw new AppError(409,'请按顺序完成每段拼句');
 recordActivity(p,day);const tokens=phraseTokens(pages[part].en),correct=order.length===tokens.length&&order.every((n,i)=>n===i);
 if(!correct){const before=p.diamonds;p.diamonds=Math.max(0,p.diamonds-1);return {progress:p,correct:false,duplicate:false,gain:{diamonds:p.diamonds-before,xp:0,familiarity:0,affection:0},completed:false};}
 run.reading??={};run.reading[String(cursor)]=part+1;const gain={diamonds:0,xp:part===pages.length-1?5:0,familiarity:0,affection:0};
 if(part===pages.length-1)run.cursor++;p.xp+=gain.xp;return {progress:p,correct:true,duplicate:false,gain,completed:false};
}
export function unlockTranslation(p:LearningProgress,id:string,cursor:number){const lesson=requireUnlocked(p,id),run=p.runs[id];if(!run||run.cursor!==cursor||lessonSteps(lesson)[cursor]?.kind!=='speak')throw new AppError(409,'当前不能查看翻译');const key=id+':'+cursor;p.translations??=[];if(p.translations.includes(key))return p;if(p.diamonds<2)throw new AppError(400,'需要 2 颗钻石');p.diamonds-=2;p.translations.push(key);return p;}
export function unlockHint(p:LearningProgress,id:string,cursor:number){
 const lesson=requireUnlocked(p,id),run=p.runs[id];
 if(!run||run.cursor!==cursor||lessonSteps(lesson)[cursor]?.kind!=='listen')throw new AppError(409,'现在不在这一段听力中');
 const key=id+':'+cursor;
 if(p.hints.includes(key))return p;
 if(p.diamonds<2)throw new AppError(400,'需要 2 颗钻石，先完成单词挑战吧');
 p.diamonds-=2;p.hints.push(key);return p;
}
export function learningSummary(p:LearningProgress,now=new Date()){
 const today=localDay('Asia/Shanghai',now),days=new Set(p.days);let day=today,streak=0;
 const previous=(d:string)=>{const date=new Date(d+'T12:00:00Z');date.setUTCDate(date.getUTCDate()-1);return date.toISOString().slice(0,10);};
 if(!days.has(day))day=previous(day);
 while(days.has(day)){streak++;day=previous(day);}
 return {todayComplete:days.has(today),streak,completed:lessons.filter(l=>p.runs[l.id]?.completedDay).length,words:p.earned.length};
}
