import {z} from 'zod';
import {AppError,identity,locked,putAudio,route,sameOrigin} from '@/lib/server';
import {lessonSteps} from '@/lib/learning/content';
import {advanceLearning,requireUnlocked} from '@/lib/learning/progress';
import {learningKey,readLearning,saveLearning} from '@/lib/learning/server';
export const maxDuration=120;
export async function POST(req:Request){return route(async()=>{
 sameOrigin(req);const owner=await identity();if(Number(req.headers.get('content-length'))>3600000)throw new AppError(413,'录音请控制在 45 秒以内');
 const form=await req.formData(),id=z.string().max(50).parse(form.get('chapterId')),cursor=z.coerce.number().int().min(0).max(100).parse(form.get('cursor')),duration=z.coerce.number().min(1).max(46).parse(form.get('duration')),file=form.get('audio');
 if(!(file instanceof File)||file.size<256||file.size>3500000||!/^audio\/(webm|mp4|ogg|wav)(;|$)/.test(file.type))throw new AppError(400,'请录制 1–45 秒的语音');
 const bytes=new Uint8Array(await file.arrayBuffer()),magic=Buffer.from(bytes.slice(0,12));
 if(!(magic.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]))||magic.toString('ascii',4,8)==='ftyp'||['OggS','RIFF'].includes(magic.toString('ascii',0,4))))throw new AppError(400,'无法识别录音格式');
 return locked(learningKey(owner),async()=>{
  const p=await readLearning(owner),lesson=requireUnlocked(p,id),run=p.runs[id];if(!run)throw new AppError(409,'请先进入章节');
  if(cursor<run.cursor){if(!run.recordings[String(cursor)])throw new AppError(409,'这一步不是口语录音');return Response.json({progress:p,correct:true,duplicate:true,gain:{diamonds:0,xp:0,familiarity:0,affection:0}});}
  if(cursor!==run.cursor||lessonSteps(lesson)[cursor]?.kind!=='speak')throw new AppError(409,'请先完成当前学习步骤');
  const take=run.speaking?.[String(cursor)]?2:1;const key=owner+'/learning-recordings/'+id+'/'+cursor+'-'+take;await putAudio(key,bytes,file.type);
  const result=advanceLearning(p,id,cursor,undefined,{key,duration});await saveLearning(owner,p);return Response.json(result);
 });
});}
