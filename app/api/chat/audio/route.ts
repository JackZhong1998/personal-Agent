import {z} from 'zod';
import {AppError,getRecord,identity,jsonBody,quota,route,sameOrigin} from '@/lib/server';
import {homeChatKey,type HomeMessage} from '@/lib/home-chat';
import {speech} from '@/lib/speech';
export const maxDuration=120;
export async function POST(req:Request){return route(async()=>{
 sameOrigin(req);const owner=await identity(),{messageId}=z.object({messageId:z.uuid()}).parse(await jsonBody(req));const history=await getRecord<HomeMessage[]>(homeChatKey(owner));const message=history?.find(m=>m.id===messageId);if(!message)throw new AppError(404,'没有找到这条对话');
 await quota(owner);const audio=await speech(message.english,'role',owner);return Response.json({audioUrl:'/api/audio?key='+encodeURIComponent(audio.key),cached:audio.cached,saved:true});
});}
