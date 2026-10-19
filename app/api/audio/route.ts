import { AppError, getAudio, identity, route } from '@/lib/server';
export const dynamic='force-dynamic';
export async function GET(req:Request) {return route(async()=>{
  const owner=await identity(); const key=new URL(req.url).searchParams.get('key')||'';
  if(!key.startsWith('public/')&&!key.startsWith(owner+'/')) throw new AppError(404,'没有找到这段语音');
  const started=performance.now();
  const {bytes,mime}=await getAudio(key);
  const range=req.headers.get('range'),match=range?.match(/^bytes=(\d*)-(\d*)$/);let start=0,end=bytes.length-1,status=200;
  if(match){if(match[1]){start=Number(match[1]);end=match[2]?Math.min(Number(match[2]),end):end;}else if(match[2])start=Math.max(0,bytes.length-Number(match[2]));if(start>=bytes.length||start>end)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${bytes.length}`}});status=206;}
  return new Response(new Uint8Array(bytes.slice(start,end+1)),{status,headers:{'Content-Type':mime,'Cache-Control':'private, max-age=86400','Content-Length':String(end-start+1),'Accept-Ranges':'bytes',...(status===206?{'Content-Range':`bytes ${start}-${end}/${bytes.length}`}:{ }),'Server-Timing':`audio_storage;dur=${(performance.now()-started).toFixed(1)}`}});
});}
