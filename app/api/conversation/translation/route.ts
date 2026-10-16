import {z} from 'zod';
import {AppError,identity,route} from '@/lib/server';
import {getSession,renderedTurn} from '@/lib/conversation';
export const dynamic='force-dynamic';
export async function GET(req:Request){return route(async()=>{
 const owner=await identity();const url=new URL(req.url);
 const id=z.uuid().parse(url.searchParams.get('sessionId'));
 const index=z.coerce.number().int().min(0).max(20).parse(url.searchParams.get('index'));
 const s=await getSession(owner,id);
 if(index>s.index)throw new AppError(403,'这条语音还没到达');
 return Response.json({translation:renderedTurn(s,index).translation},{headers:{'Cache-Control':'private, no-store'}});
});}
