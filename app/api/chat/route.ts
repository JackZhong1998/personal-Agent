import {z} from 'zod';
import {getRecord,identity,jsonBody,locked,putRecord,quota,AppError,route,sameOrigin} from '@/lib/server';
import {chatReply,homeChatKey,type HomeMessage} from '@/lib/home-chat';
import {recordActivity,prepareRelationship} from '@/lib/learning/relationship';
import {localDay} from '@/lib/story';
import {readLearning,saveLearning,learningKey} from '@/lib/learning/server';
import {learningSummary} from '@/lib/learning/progress';
import {lessons} from '@/lib/learning/content';
async function rememberActivity(owner:string,createdAt:string,cached=false){await locked(learningKey(owner),async()=>{const p=await readLearning(owner);const day=localDay('Asia/Shanghai',new Date(createdAt));if(cached)prepareRelationship(p,undefined,[day]);else recordActivity(p,day);await saveLearning(owner,p);});}
export const maxDuration=120;
export const dynamic='force-dynamic';
export async function GET(){return route(async()=>{const owner=await identity();return Response.json({messages:await getRecord<HomeMessage[]>(homeChatKey(owner))||[],ready:!!process.env.OPENROUTER_API_KEY},{headers:{'Cache-Control':'private, no-store'}});});}
export async function POST(req:Request){return route(async()=>{
 sameOrigin(req);const owner=await identity();const {id,message}=z.object({id:z.uuid(),message:z.string().trim().min(1).max(1000)}).parse(await jsonBody(req));
 return locked(homeChatKey(owner),async()=>{
  const messages=await getRecord<HomeMessage[]>(homeChatKey(owner))||[],existing=messages.find(m=>m.id===id);if(existing){await rememberActivity(owner,existing.createdAt,true);return Response.json({message:existing,cached:true});}
  if(!process.env.OPENROUTER_API_KEY)throw new AppError(503,'日常对话服务还没有连接好，你可以先进入美国旅行。');await quota(owner);const [profile,learning]=await Promise.all([getRecord<{displayName:string}>(owner+'/profile'),readLearning(owner)]);const summary=learningSummary(learning);
  const reply=await chatReply(messages,message,profile?.displayName||'',{completed:summary.completed,words:summary.words,nextChapter:(lessons.find(l=>!learning.runs[l.id]?.completedDay)||lessons[0]).title});const saved={id,user:message,...reply,createdAt:new Date().toISOString()};
  await putRecord(homeChatKey(owner),[...messages,saved].slice(-40));await rememberActivity(owner,saved.createdAt);return Response.json({message:saved,cached:false});
 });
});}
