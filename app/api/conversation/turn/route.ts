import { z } from 'zod';
import { AppError, identity, locked, putAudio, putRecord, quota, route, sameOrigin } from '@/lib/server';
import { complete, getSession, view } from '@/lib/conversation';
import { scripts } from '@/lib/scripts';
import { speech } from '@/lib/speech';
export const maxDuration=120;
export async function POST(req:Request) {return route(async()=>{
  sameOrigin(req); const owner=await identity();
  if(Number(req.headers.get('content-length'))>3600000) throw new AppError(413,'录音太大，请控制在 45 秒以内');
  const form=await req.formData();
  const id=z.uuid().parse(form.get('sessionId'));const index=z.coerce.number().int().min(0).max(4).parse(form.get('index'));
  const duration=z.coerce.number().min(1).max(46).parse(form.get('duration'));
  const audio=form.get('audio');
  if(!(audio instanceof File)||audio.size<256||audio.size>3500000||!/^audio\/(webm|mp4|ogg|wav)(;|$)/.test(audio.type)) throw new AppError(400,'请提交 1–45 秒的有效录音');
  const bytes=new Uint8Array(await audio.arrayBuffer());
  const magic=Buffer.from(bytes.slice(0,12));
  if(!(magic.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]))||magic.toString('ascii',4,8)==='ftyp'||['OggS','RIFF'].includes(magic.toString('ascii',0,4)))) throw new AppError(400,'无法识别录音格式，请换用 Safari 或 Chrome 重试');
  return locked(owner+'/session/'+id,async()=>{
    const s=await getSession(owner,id);
    if(index<s.index||s.completed) {
      if(s.completed) await locked(owner+'/progress',()=>complete(owner,s));
      return Response.json(view(s));
    }
    if(index!==s.index) throw new AppError(409,'对话进度已更新，请重新进入章节');
    await quota(owner);
    const audioKey=owner+'/'+id+'/'+index;
    await putAudio(audioKey,bytes,audio.type);
    // The user's recording advances a fixed script; no recognition or LLM call.
    const next=await speech(scripts[s.chapterId][index+1].line,'role');
    s.recordings.push({key:audioKey,duration});s.index++;s.audioKey=next.key;s.audioKeys.push(next.key);s.completed=s.index===scripts[s.chapterId].length-1;
    await putRecord(owner+'/sessions/'+id,s);
    let result;
    if(s.completed) result=await locked(owner+'/progress',()=>complete(owner,s));
    return Response.json({...view(s),...result});
  });
});}
