import {z} from 'zod';
import {AppError,getRecord,identity,jsonBody,quota,route,sameOrigin} from '@/lib/server';
import {speech} from '@/lib/speech';
import {COMPANION,lessonSteps,materialText} from '@/lib/learning/content';
import {requireUnlocked} from '@/lib/learning/progress';
import {readLearning} from '@/lib/learning/server';
export const maxDuration=120;
export async function POST(req:Request){return route(async()=>{
 sameOrigin(req);const owner=await identity();const b=z.object({chapterId:z.string().max(50).optional(),cursor:z.number().int().min(0).max(100).optional(),target:z.enum(['preview','material','reply'])}).parse(await jsonBody(req));
 let text:string,kind:'role'|'guide'='role',privateOwner:string|undefined;
 if(b.target==='preview'){text=COMPANION.intro;}else{
  if(!b.chapterId||b.cursor===undefined)throw new AppError(400,'缺少章节信息');
  const p=await readLearning(owner),lesson=requireUnlocked(p,b.chapterId),run=p.runs[b.chapterId];
  if(!run||b.cursor>run.cursor)throw new AppError(403,'先走到这里，再听这一段');
  const step=lessonSteps(lesson)[b.cursor];if(!step)throw new AppError(404,'没有这段语音');
  const scene=lesson.scenes[step.scene];
  if(b.target==='reply'){
   if(step.kind!=='speak')throw new AppError(400,'这一阶段没有口语回应');text=scene.reply;kind='guide';
  }else if(step.kind==='intro'){
   const profile=await getRecord<{displayName:string}>(owner+'/profile');text=(profile?.displayName?profile.displayName+', ':'')+lesson.intro;privateOwner=profile?.displayName?owner:undefined;
  }else if(step.kind==='word'||step.kind==='quiz'){const w=scene.words[step.word];text=w.en+'. '+w.example;kind='guide';}
  else text=step.kind==='speak'?scene.message:materialText(scene);
 }
 await quota(owner);const audio=await speech(text,kind,privateOwner);
 return Response.json({audioUrl:'/api/audio?key='+encodeURIComponent(audio.key),cached:audio.cached,saved:true,kind});
});}
