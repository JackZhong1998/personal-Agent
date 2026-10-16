import {z} from 'zod';
import {displayNameSchema} from '@/lib/conversation';
import {getRecord,identity,jsonBody,putRecord,route,sameOrigin} from '@/lib/server';
export const dynamic='force-dynamic';
export async function GET(){return route(async()=>{
 return Response.json(await getRecord(await identity()+'/profile')||{displayName:''},{headers:{'Cache-Control':'private, no-store'}});
});}
export async function POST(req:Request){return route(async()=>{
 sameOrigin(req);const owner=await identity();
 const profile=z.object({displayName:displayNameSchema}).parse(await jsonBody(req));
 await putRecord(owner+'/profile',profile);return Response.json(profile);
});}
