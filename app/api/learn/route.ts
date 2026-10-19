import {z} from 'zod';
import {getRecord,identity,jsonBody,locked,putRecord,route,sameOrigin,AppError} from '@/lib/server';
import {displayNameSchema} from '@/lib/conversation';
import {prepareRelationship} from '@/lib/learning/relationship';
import {homeChatKey,type HomeMessage} from '@/lib/home-chat';
import {localDay} from '@/lib/story';
import {COMPANION} from '@/lib/learning/content';
import {advanceLearning,startLearning,unlockHint,submitReadingPart,unlockTranslation} from '@/lib/learning/progress';
import {readLearning,saveLearning,learningKey} from '@/lib/learning/server';
export const dynamic='force-dynamic';
export async function GET(){return route(async()=>{const owner=await identity();return locked(learningKey(owner),async()=>{const [progress,profile]=await Promise.all([readLearning(owner),getRecord<{displayName:string}>(owner+'/profile')]);const before=JSON.stringify(progress);const history=progress.activeDays===undefined?await getRecord<HomeMessage[]>(homeChatKey(owner)):null;prepareRelationship(progress,undefined,(history||[]).filter(m=>!Number.isNaN(Date.parse(m.createdAt))).map(m=>localDay('Asia/Shanghai',new Date(m.createdAt))));if(JSON.stringify(progress)!==before)await saveLearning(owner,progress);return Response.json({progress,displayName:profile?.displayName||''},{headers:{'Cache-Control':'private, no-store'}});});});}
export async function POST(req:Request){return route(async()=>{
 sameOrigin(req);const owner=await identity();const b=z.object({action:z.enum(['choose','start','advance','hint','read-part','translation']),chapterId:z.string().max(50).optional(),cursor:z.number().int().min(0).max(100).optional(),question:z.number().int().min(0).max(2).optional(),part:z.number().int().min(0).max(30).optional(),order:z.array(z.number().int().min(0).max(100)).max(100).optional(),answer:z.number().int().min(0).max(2).optional(),displayName:displayNameSchema.optional()}).parse(await jsonBody(req));
 return locked(learningKey(owner),async()=>{
  const p=await readLearning(owner);
  if(b.action==='choose'){
   if(!b.displayName)throw new AppError(400,'先告诉伙伴怎么称呼你');
   await putRecord(owner+'/profile',{displayName:b.displayName});p.companionId=COMPANION.id;await saveLearning(owner,p);return Response.json({progress:p,displayName:b.displayName});
  }
  if(!b.chapterId)throw new AppError(400,'请选择章节');
  if(b.action==='start'){startLearning(p,b.chapterId);await saveLearning(owner,p);return Response.json({progress:p});}
  if(b.cursor===undefined)throw new AppError(400,'缺少当前进度');
  if(b.action==='translation'){unlockTranslation(p,b.chapterId,b.cursor);await saveLearning(owner,p);return Response.json({progress:p});}
  if(b.action==='read-part'){if(b.part===undefined||!b.order)throw new AppError(400,'缺少拼句内容');const result=submitReadingPart(p,b.chapterId,b.cursor,b.part,b.order);if(!result.duplicate)await saveLearning(owner,p);return Response.json(result);}
  if(b.action==='hint'){unlockHint(p,b.chapterId,b.cursor);await saveLearning(owner,p);return Response.json({progress:p});}
  const result=advanceLearning(p,b.chapterId,b.cursor,b.answer,undefined,undefined,b.question);if(!result.duplicate)await saveLearning(owner,p);return Response.json(result);
 });
});}
