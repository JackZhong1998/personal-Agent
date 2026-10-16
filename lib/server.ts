import { cookies } from 'next/headers';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

export class AppError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const production = () => process.env.NODE_ENV === 'production';
const configuredStore = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
const root = () => process.env.DATA_DIR || path.join(process.cwd(), '.data');
const safeKey = (key: string) => {
  if (!/^[a-zA-Z0-9_./-]+$/.test(key) || key.includes('..') || key.startsWith('/')) throw new AppError(400, '无效的资源地址');
  return key;
};
export function required(name: string) {
  const value = process.env[name];
  if (!value) throw new AppError(503, `服务尚未配置：${name}。请在服务端环境设置中填写。`);
  return value;
}
export function requireStorage() {
  if (production() && !configuredStore()) throw new AppError(503, '线上语音存储尚未配置，请先连接 Supabase。');
}
export async function db(route: string, init: RequestInit = {}, missingMessage?:string) {
  const response = await fetch(`${required('SUPABASE_URL').replace(/\/$/, '')}${route}`, {
    ...init, cache: 'no-store', signal: AbortSignal.timeout(15000),
    headers: { apikey: required('SUPABASE_SERVICE_ROLE_KEY'), Authorization: `Bearer ${required('SUPABASE_SERVICE_ROLE_KEY')}`, ...init.headers }
  });
  if(response.status===404&&missingMessage)throw new AppError(404,missingMessage);
  if (!response.ok) throw new AppError(503, `数据库或存储不可用（${response.status}），请检查 Supabase 初始化与权限。`);
  return response;
}
export async function getRecord<T>(key: string): Promise<T | null> {
  safeKey(key); requireStorage();
  if (configuredStore()) {
    const r = await db(`/rest/v1/between_records?key=eq.${encodeURIComponent(key)}&select=payload`);
    return (await r.json())[0]?.payload ?? null;
  }
  try { return JSON.parse(await readFile(path.join(root(), 'records', key+'.json'), 'utf8')); }
  catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null; throw e; }
}
export async function putRecord(key: string, payload: unknown) {
  safeKey(key); requireStorage();
  if (configuredStore()) {
    await db('/rest/v1/between_records?on_conflict=key', { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({key,payload}) });
  } else {
    const target = path.join(root(), 'records', key+'.json');
    await mkdir(path.dirname(target), {recursive:true});
    const temp = target+'.'+randomUUID()+'.tmp';
    await writeFile(temp, JSON.stringify(payload)); await rename(temp,target);
  }
}
export async function putAudio(key: string, bytes: Uint8Array, mime: string) {
  safeKey(key); requireStorage();
  if (configuredStore()) {
    await db('/storage/v1/object/between-audio/'+key, {method:'POST',headers:{'Content-Type':mime, 'x-upsert':'true'}, body: Buffer.from(bytes)});
  } else {
    const target=path.join(root(), 'audio',key); await mkdir(path.dirname(target),{recursive:true}); await writeFile(target,bytes);
  }
  await putRecord('audio-meta/'+key,{mime, size:bytes.length});
}
export async function getAudio(key: string) {
  safeKey(key);
  requireStorage();
  if(configuredStore()) {
    // Storage already returns the MIME type. Avoid a separate database read
    // before every playback; the audio route checks ownership before this call.
    const response=await db('/storage/v1/object/authenticated/between-audio/'+key,{},'这段语音还没有生成');
    return {bytes:Buffer.from(await response.arrayBuffer()),mime:response.headers.get('content-type')||'audio/mpeg'};
  }
  const meta = await getRecord<{mime:string}>('audio-meta/'+key);
  if (!meta) throw new AppError(404,'这段语音还没有生成');
  const bytes = await readFile(path.join(root(),'audio',key));
  return {bytes,mime:meta.mime};
}
export async function identity() {
  const jar = await cookies();
  const secret = production() ? required('SESSION_SECRET') : (process.env.SESSION_SECRET || 'between-local-development-only');
  if(production()&&secret.length<32) throw new AppError(503,'SESSION_SECRET 需要至少 32 个字符，请在服务端安全配置。');
  const sign = (id:string) => createHmac('sha256',secret).update(id).digest('hex');
  const cookie=jar.get('between_session')?.value;
  if(cookie) {
    const [id,sig] = cookie.split('.'); const expected=sign(id);
    if(z.uuid().safeParse(id).success && sig?.length===expected.length && timingSafeEqual(Buffer.from(sig),Buffer.from(expected))) return id;
  }
  const id=randomUUID();
  jar.set('between_session', `${id}.${sign(id)}`, {httpOnly:true,sameSite:'strict',secure:production(),path:'/',maxAge:31536000});
  return id;
}
export function sameOrigin(req: Request) {
  const origin=req.headers.get('origin');
  // Next's internal URL may normalize 127.0.0.1 to localhost in development.
  // Match the browser's Origin to the actual HTTP Host, never a client-supplied
  // forwarded host. SameSite=strict is an additional cookie boundary.
  const host=req.headers.get('host')||new URL(req.url).host;
  let valid=false;
  try{const u=new URL(origin||'');valid=u.origin===origin&&u.host===host&&['http:','https:'].includes(u.protocol);}catch{}
  if (!valid) throw new AppError(403, '请从本站页面操作');
}
export async function jsonBody(req: Request) {
  if (Number(req.headers.get('content-length')) > 12000) throw new AppError(413,'请求内容过大');
  const body=await req.text(); if(body.length>12000) throw new AppError(413,'请求内容过大');
  try { return JSON.parse(body); } catch {throw new AppError(400,'请求格式不正确');}
}
const locks=new Set<string>();
export async function locked<T>(key:string, fn:()=>Promise<T>):Promise<T> {
  const token=randomUUID();
  if(configuredStore()) {
    const result=await db('/rest/v1/rpc/between_acquire_lease',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lease_key:key,lease_token:token})});
    if(!await result.json()) throw new AppError(409,'正在保存上一条内容，请稍后重试');
  } else {
    if(locks.has(key)) throw new AppError(409,'正在保存上一条内容，请稍后重试'); locks.add(key);
  }
  try{return await fn();} finally {
    if(configuredStore()) await db(`/rest/v1/between_leases?key=eq.${encodeURIComponent(key)}&token=eq.${token}`,{method:'DELETE'}).catch(()=>{});
    else locks.delete(key);
  }
}
export async function quota(owner:string) {
  return locked('quota-'+owner,async()=>{
    const key=owner+'/quota/'+new Date().toISOString().slice(0,10);
    const used=(await getRecord<number>(key))||0;
    if(used>=240) throw new AppError(429,'今天的语音调用已达上限，明天再继续吧。');
    await putRecord(key,used+1);
  });
}
export async function route(fn:()=>Promise<Response>) {
  try { return await fn(); }
  catch(e) {
    if(e instanceof AppError) return Response.json({error:e.message},{status:e.status});
    if(e instanceof z.ZodError) return Response.json({error:'请求参数不正确'},{status:400});
    // Provider bodies, credentials and recordings never enter logs.
    console.error('between request failed:', e instanceof Error ? e.name : 'UnknownError');
    return Response.json({error:'暂时没能完成，请稍后重试。录音不会自动重发。'},{status:500});
  }
}
