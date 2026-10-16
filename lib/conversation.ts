import { z } from 'zod';
import { chapters, localDay, reward, type Completion } from './story';
import { scripts, SCRIPT_VERSION } from './scripts';
import { AppError, getRecord, putRecord } from './server';
export type Session = {
  id:string; chapterId:string; index:number; version:string; audioKey:string; audioKeys:string[];
  recordings:{key:string;duration:number}[]; createdAt:string; completed:boolean;
};
export type Progress = { completions:Completion[]; timeZone:string };
export async function progress(owner:string):Promise<Progress> {
  return await getRecord<Progress>(owner+'/progress')||{completions:[],timeZone:'Asia/Shanghai'};
}
export async function checkChapter(owner:string,id:string) {
  const index=chapters.findIndex(c=>c.id===id);
  if(index<0) throw new AppError(404,'没有找到这个章节');
  const p=await progress(owner);
  if(index>0 && !p.completions.some(c=>c.chapterId===chapters[index-1].id)) throw new AppError(403,'先完成上一章，再一起走向下一章吧');
  return p;
}
export async function getSession(owner:string,id:string) {
  if(!z.uuid().safeParse(id).success) throw new AppError(400,'无效的对话');
  const s=await getRecord<Session>(owner+'/sessions/'+id);
  if(!s) throw new AppError(404,'找不到这次对话，请重新进入章节');
  if(s.version!==SCRIPT_VERSION) throw new AppError(409,'章节内容已更新，请重新开始本章');
  return s;
}
export function view(s:Session) {
  const t=scripts[s.chapterId][s.index];
  // Role transcripts are stored on the server; dialogue UI gets audio only.
  return {id:s.id,chapterId:s.chapterId,index:s.index,total:scripts[s.chapterId].length-1,audioUrl:'/api/audio?key='+encodeURIComponent(s.audioKey),roleAudios:s.audioKeys.map(key=>'/api/audio?key='+encodeURIComponent(key)),completed:s.completed,cue:t.cue,suggestions:t.suggestions,recordings:s.recordings.map(r=>({audioUrl:'/api/audio?key='+encodeURIComponent(r.key),duration:r.duration}))};
}
export async function complete(owner:string,s:Session) {
  const p=await progress(owner);
  const earned=reward(p.completions,s.chapterId,localDay(p.timeZone));
  if(earned) {p.completions.push(earned);await putRecord(owner+'/progress',p);}
  return {earned,progress:p};
}
