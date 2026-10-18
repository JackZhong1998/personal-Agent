import {z} from 'zod';
import {getRecord,identity,jsonBody,locked,putRecord,route,sameOrigin,AppError} from '@/lib/server';
import {displayNameSchema} from '@/lib/conversation';
import {COMPANION} from '@/lib/learning/content';
import {advanceLearning,startLearning,unlockHint} from '@/lib/learning/progress';
import {readLearning,saveLearning,learningKey} from '@/lib/learning/server';
export const dynamic='force-dynamic';
export async function GET(){return route(async()=>{const owner=await identity();const [progress,profile]=await Promise.all([readLearning(owner),getRecord<{displayName:string}>(owner+'/profile')]);return Response.json({progress,displayName:profile?.displayName||''},{headers:{'Cache-Control':'private, no-store'}});});}
export async function POST(req:Request){return route(async()=>{
 sameOrigin(req);const owner=await identity();const b=z.object({action:z.enum(['choose','start','advance','hint']),chapterId:z.string().max(50).optional(),cursor:z.number().int().min(0).max(100).optional(),answer:z.number().int().min(0).max(2).optional(),displayName:displayNameSchema.optional()}).parse(await jsonBody(req));
 return locked(learningKey(owner),async()=>{
  const p=await readLearning(owner);
  if(b.action==='choose'){
   if(!b.displayName)throw new AppError(400,'先告诉伙伴怎么称呼你');
   await putRecord(owner+'/profile',{displayName:b.displayName});p.companionId=COMPANION.id;await saveLearning(owner,p);return Response.json({progress:p,displayName:b.displayName});
  }
  if(!b.chapterId)throw new AppError(400,'请选择章节');
  if(b.action==='start'){startLearning(p,b.chapterId);await saveLearning(owner,p);return Response.json({progress:p});}
  if(b.cursor===undefined)throw new AppError(400,'缺少当前进度');
  if(b.action==='hint'){unlockHint(p,b.chapterId,b.cursor);await saveLearning(owner,p);return Response.json({progress:p});}
  const result=advanceLearning(p,b.chapterId,b.cursor,b.answer);if(result.correct&&!result.duplicate)await saveLearning(owner,p);return Response.json(result);
 });
});}
