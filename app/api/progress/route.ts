import { identity, route } from '@/lib/server';
import { progress } from '@/lib/conversation';
export const dynamic='force-dynamic';
export async function GET(){return route(async()=>Response.json(await progress(await identity()),{headers:{'Cache-Control':'no-store'}}));}
