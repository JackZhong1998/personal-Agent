import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { identity, jsonBody, locked, putRecord, getRecord, quota, route, sameOrigin, required } from '@/lib/server';
import { checkChapter, complete, view, type Session } from '@/lib/conversation';
import { scripts, SCRIPT_VERSION } from '@/lib/scripts';
import { speech } from '@/lib/speech';
export const maxDuration=120;
export async function POST(req:Request) {return route(async()=>{
  sameOrigin(req); const owner=await identity();
  const {chapterId,replay}=z.object({chapterId:z.string().max(80),replay:z.boolean().default(false)}).parse(await jsonBody(req));
  await checkChapter(owner,chapterId);
  return locked(owner+'/start',async()=>{
    const pointer=await getRecord<string>(owner+'/active/'+chapterId);
    if(pointer&&!replay) {
      const s=await getRecord<Session>(owner+'/sessions/'+pointer);
      if(s&&s.version===SCRIPT_VERSION){
        if(s.completed)await locked(owner+'/progress',()=>complete(owner,s));
        return Response.json(view(s));
      }
    }
    required('CARTESIA_API_KEY'); await quota(owner);
    const audio=await speech(scripts[chapterId][0].line,'role');
    const s:Session={id:randomUUID(),chapterId,index:0,version:SCRIPT_VERSION,audioKey:audio.key,audioKeys:[audio.key],recordings:[],createdAt:new Date().toISOString(),completed:false};
    await putRecord(owner+'/sessions/'+s.id,s);await putRecord(owner+'/active/'+chapterId,s.id);
    return Response.json(view(s));
  });
});}
