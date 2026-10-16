import {z} from 'zod';
import {chapters,emptyProgress,interactionReward,localDay,relationship,reward,STORY_ID,type Progress,type TurnFeedback} from './story';
import {personalize,scripts,SCRIPT_VERSION} from './scripts';
import {AppError,getRecord,putRecord} from './server';
export type {Progress} from './story';
export const displayNameSchema=z.string().trim().min(1).max(20).regex(/^[\p{L}\p{N} .’'\-]+$/u,'称呼请使用文字、空格或短横线，最多 20 个字符');
export type Session={id:string;chapterId:string;displayName:string;index:number;version:string;audioKey:string;audioKeys:string[];recordings:{key:string;duration:number}[];createdAt:string;completed:boolean};
export async function progress(owner:string):Promise<Progress>{
 return await getRecord<Progress>(owner+'/'+STORY_ID+'/progress')||emptyProgress();
}
export async function checkChapter(owner:string,id:string){
 const index=chapters.findIndex(c=>c.id===id);if(index<0)throw new AppError(404,'没有找到这个章节');
 const p=await progress(owner);
 if(index>0&&!p.completions.some(c=>c.chapterId===chapters[index-1].id))throw new AppError(403,'先完成上一章，再一起走向下一章吧');
 return p;
}
export async function getSession(owner:string,id:string){
 if(!z.uuid().safeParse(id).success)throw new AppError(400,'无效的对话');
 const s=await getRecord<Session>(owner+'/sessions/'+id);
 if(!s)throw new AppError(404,'找不到这次对话，请重新进入章节');
 if(s.version!==SCRIPT_VERSION)throw new AppError(409,'故事已更新，请重新开始本章。原来的录音仍保留。');
 return s;
}
export function view(s:Session,p:Progress){
 const t=scripts[s.chapterId][s.index];
 const url=(key:string)=>'/api/audio?key='+encodeURIComponent(key);
 return {id:s.id,chapterId:s.chapterId,displayName:s.displayName,index:s.index,total:scripts[s.chapterId].length-1,audioUrl:url(s.audioKey),completed:s.completed,cue:t.cue,suggestions:t.suggestions,
  messages:s.audioKeys.map((key,index)=>({index,audioUrl:url(key),image:scripts[s.chapterId][index].image})),
  recordings:s.recordings.map(r=>({audioUrl:url(r.key),duration:r.duration})),progress:p,relationship:relationship(p)};
}
// Call under the owner's progress lease. Reconcile every persisted turn so a
// failure between saving a recording and granting credit is safe to retry.
export async function settle(owner:string,s:Session,submittedIndex?:number){
 const p=await progress(owner);const before=relationship(p);const day=localDay(p.timeZone);let changed=false;let feedback:TurnFeedback|null=null;
 for(let i=0;i<s.recordings.length;i++){
  const credit=interactionReward(p.interactions,s.id,s.chapterId,i,day);
  if(credit){p.interactions.push(credit);changed=true;if(i===submittedIndex)feedback={...credit,message:credit.replay?'熟悉的声音，又收藏一次':'这一句，让你们又靠近了一点',dailyBonus:0,milestone:null};}
 }
 if(s.completed){const earned=reward(p.completions,s.chapterId,day);if(earned){p.completions.push(earned);changed=true;if(feedback)feedback.dailyBonus=earned.sparks;}}
 const after=relationship(p);
 if(feedback&&before.stage.label!==after.stage.label)feedback.milestone=after.stage.label;
 if(changed)await putRecord(owner+'/'+STORY_ID+'/progress',p);
 return {progress:p,feedback};
}
export function renderedTurn(s:Session,index:number){return personalize(scripts[s.chapterId][index],s.displayName);}
