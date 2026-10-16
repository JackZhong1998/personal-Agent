import { z } from 'zod';
import { AppError, identity, jsonBody, quota, route, sameOrigin } from '@/lib/server';
import { checkChapter } from '@/lib/conversation';
import { scripts } from '@/lib/scripts';
import { speech } from '@/lib/speech';
export const maxDuration=120;
export async function POST(req:Request) {return route(async()=>{
  sameOrigin(req); const owner=await identity();
  const {chapterId,index,suggestion}=z.object({chapterId:z.string().max(80),index:z.number().int().min(0).max(3),suggestion:z.number().int().min(0).max(1)}).parse(await jsonBody(req));
  await checkChapter(owner,chapterId);
  const text=scripts[chapterId]?.[index]?.suggestions[suggestion];
  if(!text) throw new AppError(404,'没有这条推荐表达');
  await quota(owner); const audio=await speech(text,'guide');
  return Response.json({audioUrl:'/api/audio?key='+encodeURIComponent(audio.key),cached:audio.cached});
});}
