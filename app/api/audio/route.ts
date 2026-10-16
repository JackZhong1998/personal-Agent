import { AppError, getAudio, identity, route } from '@/lib/server';
export const dynamic='force-dynamic';
export async function GET(req:Request) {return route(async()=>{
  const owner=await identity(); const key=new URL(req.url).searchParams.get('key')||'';
  if(!key.startsWith('public/')&&!key.startsWith(owner+'/')) throw new AppError(404,'没有找到这段语音');
  const started=performance.now();
  const {bytes,mime}=await getAudio(key);
  return new Response(new Uint8Array(bytes),{headers:{'Content-Type':mime,'Cache-Control':'private, max-age=86400','Content-Length':String(bytes.length),'Server-Timing':`audio_storage;dur=${(performance.now()-started).toFixed(1)}`}});
});}
