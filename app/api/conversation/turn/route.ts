import { z } from 'zod';
import { AppError, identity, locked, putAudio, putRecord, quota, route, sameOrigin } from '@/lib/server';
import { getSession, renderedTurn, settle, view } from '@/lib/conversation';
import { scripts } from '@/lib/scripts';
import { TURNS_PER_CHAPTER } from '@/lib/story';
import { speech } from '@/lib/speech';
export const maxDuration=120;
export async function POST(req:Request) {return route(async()=>{
  const started=performance.now();
  const timing:string[]=[];
  let mark=started;
  const stage=(name:string)=>{const now=performance.now();timing.push(`${name};dur=${(now-mark).toFixed(1)}`);mark=now;};
  sameOrigin(req); const owner=await identity();
  if(Number(req.headers.get('content-length'))>3600000) throw new AppError(413,'录音太大，请控制在 45 秒以内');
  const form=await req.formData();
  const id=z.uuid().parse(form.get('sessionId'));const index=z.coerce.number().int().min(0).max(TURNS_PER_CHAPTER-1).parse(form.get('index'));
  const duration=z.coerce.number().min(1).max(46).parse(form.get('duration'));
  const audio=form.get('audio');
  if(!(audio instanceof File)||audio.size<256||audio.size>3500000||!/^audio\/(webm|mp4|ogg|wav)(;|$)/.test(audio.type)) throw new AppError(400,'请提交 1–45 秒的有效录音');
  const bytes=new Uint8Array(await audio.arrayBuffer());
  const magic=Buffer.from(bytes.slice(0,12));
  if(!(magic.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]))||magic.toString('ascii',4,8)==='ftyp'||['OggS','RIFF'].includes(magic.toString('ascii',0,4)))) throw new AppError(400,'无法识别录音格式，请换用 Safari 或 Chrome 重试');
  return locked(owner+'/session/'+id,async()=>{
    const s=await getSession(owner,id);
    stage('session');
    if(index<s.index||s.completed) {
      const result=await locked(owner+'/progress',()=>settle(owner,s,index));
      return Response.json({...view(s,result.progress),feedback:result.feedback});
    }
    if(index!==s.index) throw new AppError(409,'对话进度已更新，请重新进入章节');
    await quota(owner);
    stage('quota');
    const audioKey=owner+'/'+id+'/'+index;
    // The user's recording advances a fixed script; no recognition or LLM call.
    const nextTurn=renderedTurn(s,index+1);
    // Both operations are authorized by this turn. Wait for both even on failure
    // before releasing the session lease, so a retry cannot race an old upload.
    const [upload,generated]=await Promise.allSettled([
      putAudio(audioKey,bytes,audio.type),
      speech(nextTurn.line,'role',nextTurn.personalized?owner:undefined)
    ]);
    if(upload.status==='rejected')throw upload.reason;
    if(generated.status==='rejected')throw generated.reason;
    const next=generated.value;
    stage('audio_prepare');
    s.recordings.push({key:audioKey,duration});s.index++;s.audioKey=next.key;s.audioKeys.push(next.key);s.completed=s.index===scripts[s.chapterId].length-1;
    await putRecord(owner+'/sessions/'+id,s);
    const result=await locked(owner+'/progress',()=>settle(owner,s,index));
    stage('persist');
    return Response.json({...view(s,result.progress),feedback:result.feedback},{headers:{'Server-Timing':timing.join(', ')}});
  });
});}
