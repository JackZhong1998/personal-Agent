import { z } from 'zod';
import { AppError, identity, jsonBody, quota, route, sameOrigin } from '@/lib/server';
import { getSession } from '@/lib/conversation';
import { TURNS_PER_CHAPTER } from '@/lib/story';
import { scripts } from '@/lib/scripts';
import { speech } from '@/lib/speech';
export const maxDuration=120;
export async function POST(req:Request) {return route(async()=>{
  sameOrigin(req); const owner=await identity();
  const {sessionId,index,suggestion}=z.object({sessionId:z.uuid(),index:z.number().int().min(0).max(TURNS_PER_CHAPTER-1),suggestion:z.number().int().min(0).max(1)}).parse(await jsonBody(req));
  const session=await getSession(owner,sessionId);
  if(index>session.index)throw new AppError(403,'先聊到这里，再听这句提示吧');
  const text=scripts[session.chapterId]?.[index]?.suggestions[suggestion];
  if(!text) throw new AppError(404,'没有这条推荐表达');
  await quota(owner); const audio=await speech(text,'guide');
  return Response.json({audioUrl:'/api/audio?key='+encodeURIComponent(audio.key),cached:audio.cached});
});}
