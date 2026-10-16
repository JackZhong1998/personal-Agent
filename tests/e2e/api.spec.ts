import {test,expect} from '@playwright/test';
import {createHmac,randomUUID,createHash} from 'node:crypto';
import {mkdir,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {scripts,SCRIPT_VERSION} from '../../lib/scripts';

test('real API saves four recordings, completes once, resumes, and isolates anonymous users',async({request,baseURL})=>{
  // Seed a legitimate cached script to exercise real server persistence without
  // any upstream synthesis. These bytes are test fixtures, never paid output.
  const owner=randomUUID(),id=randomUUID();const root=process.env.BETWEEN_E2E_DATA_DIR!;
  async function record(key:string,payload:unknown){const p=path.join(root,'records',key+'.json');await mkdir(path.dirname(p),{recursive:true});await writeFile(p,JSON.stringify(payload));}
  const audioKeys=scripts['first-coffee'].map(t=>'public/'+createHash('sha256').update(JSON.stringify({text:t.line,kind:'role',model:'sonic-3.6',voice:'afb402ce-7a39-49cf-acb5-3ff42e4e224f',version:'2026-08-14',format:'mp3-44100-128000'})).digest('hex')+'.mp3');
  const sig=createHmac('sha256','between-local-development-only').update(owner).digest('hex');
  const headers={Origin:baseURL!,Cookie:`between_session=${owner}.${sig}`};
  const audio=Buffer.alloc(900);Buffer.from([0x1a,0x45,0xdf,0xa3]).copy(audio);
  try{
    for(const key of audioKeys){await record('audio-meta/'+key,{mime:'audio/mpeg',size:100});const p=path.join(root,'audio',key);await mkdir(path.dirname(p),{recursive:true});await writeFile(p,Buffer.alloc(100));}
    await record(owner+'/sessions/'+id,{id,chapterId:'first-coffee',index:0,version:SCRIPT_VERSION,audioKey:audioKeys[0],audioKeys:[audioKeys[0]],recordings:[],createdAt:new Date().toISOString(),completed:false});
    await record(owner+'/active/first-coffee',id);
    const start=await request.post('/api/conversation/start',{headers,data:{chapterId:'first-coffee'}});expect(start.status()).toBe(200);expect((await start.json()).index).toBe(0);
    const forbidden=await request.post('/api/conversation/start',{headers:{...headers,Origin:'https://other.example'},data:{chapterId:'first-coffee'}});expect(forbidden.status()).toBe(403);
    const locked=await request.post('/api/conversation/start',{headers,data:{chapterId:'walk-home'}});expect(locked.status()).toBe(403);
    const skipped=await request.post('/api/conversation/turn',{headers,multipart:{sessionId:id,index:'2',duration:'2',audio:{name:'recording.webm',mimeType:'audio/webm',buffer:audio}}});expect(skipped.status()).toBe(409);
    for(let i=0;i<4;i++){
      const r=await request.post('/api/conversation/turn',{headers,multipart:{sessionId:id,index:String(i),duration:'2',audio:{name:'recording.webm',mimeType:'audio/webm',buffer:audio}}});
      expect(r.status()).toBe(200);const body=await r.json();expect(body.index).toBe(i+1);expect(body.recordings).toHaveLength(i+1);expect(body).not.toHaveProperty('line');
    }
    const duplicate=await request.post('/api/conversation/turn',{headers,multipart:{sessionId:id,index:'3',duration:'2',audio:{name:'recording.webm',mimeType:'audio/webm',buffer:audio}}});expect(duplicate.status()).toBe(200);
    const progress=await (await request.get('/api/progress',{headers})).json();expect(progress.completions).toHaveLength(1);expect(progress.completions[0].familiarity).toBe(10);
    const resumed=await (await request.post('/api/conversation/start',{headers,data:{chapterId:'first-coffee'}})).json();expect(resumed.completed).toBe(true);expect(resumed.roleAudios).toHaveLength(5);
    const own=await request.get('/api/audio?key='+encodeURIComponent(owner+'/'+id+'/0'),{headers});expect(own.status()).toBe(200);expect((await own.body()).length).toBe(900);
    const other=randomUUID();const otherSig=createHmac('sha256','between-local-development-only').update(other).digest('hex');
    const cross=await request.get('/api/audio?key='+encodeURIComponent(owner+'/'+id+'/0'),{headers:{Cookie:`between_session=${other}.${otherSig}`}});expect(cross.status()).toBe(404);
  }finally{
    await rm(path.join(root,'records',owner),{recursive:true,force:true});await rm(path.join(root,'audio',owner),{recursive:true,force:true});
    // Remove only the deterministic fixture files created by this test.
    for(const key of audioKeys){await rm(path.join(root,'records','audio-meta',key+'.json'),{force:true});await rm(path.join(root,'audio',key),{force:true});}
    await rm(path.join(root,'records','audio-meta',owner),{recursive:true,force:true});
  }
});
