import {test,expect} from '@playwright/test';
import {createHash,createHmac,randomUUID} from 'node:crypto';
import {mkdir,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {lessons,lessonSteps,wordQuestion,listeningQuestions,materialText,COURSE_ID,COMPANION} from '../../lib/learning/content';
import {readingPages} from '../../lib/learning/reading';
import {emptyLearning,startLearning,advanceLearning} from '../../lib/learning/progress';

test('learning audio caches listening material and generates a separate clip for each reading page',async({request,baseURL})=>{
 const root=process.env.BETWEEN_E2E_DATA_DIR!,owner=randomUUID(),headers={Origin:baseURL!,Cookie:`between_session=${owner}.${createHmac('sha256','between-local-development-only').update(owner).digest('hex')}`};
 async function record(key:string,value:unknown){const p=path.join(root,'records',key+'.json');await mkdir(path.dirname(p),{recursive:true});await writeFile(p,JSON.stringify(value));}
 const lesson=lessons[0],p=emptyLearning();p.companionId=COMPANION.id;startLearning(p,lesson.id);
 for(let cursor=0;cursor<21;cursor++){const step=lessonSteps(lesson)[cursor];advanceLearning(p,lesson.id,cursor,step.kind==='quiz'?wordQuestion(lesson.scenes[0],step.word).answer:undefined);}
 const audioKey=(text:string)=>'public/'+createHash('sha256').update(JSON.stringify({text,kind:'role',model:'sonic-3.6',voice:'afb402ce-7a39-49cf-acb5-3ff42e4e224f',version:'2026-08-14',format:'mp3-44100-128000'})).digest('hex')+'.mp3';const key=audioKey(materialText(lesson.scenes[0])),readingKey=audioKey(readingPages(lesson.scenes[0])[0].en);
 try{
  await record(owner+'/learning/'+COURSE_ID,p);await record('audio-meta/'+key,{mime:'audio/mpeg',size:100});await record('audio-meta/'+readingKey,{mime:'audio/mpeg',size:100});const target=path.join(root,'audio',key),readingTarget=path.join(root,'audio',readingKey);await mkdir(path.dirname(target),{recursive:true});await writeFile(target,Buffer.alloc(100));await writeFile(readingTarget,Buffer.alloc(100));
  expect((await request.post('/api/learn/audio',{headers,data:{chapterId:lesson.id,cursor:22,target:'material'}})).status()).toBe(403);
  const listening=await request.post('/api/learn/audio',{headers,data:{chapterId:lesson.id,cursor:21,target:'material'}});expect(listening.status()).toBe(200);const first=await listening.json();expect(first.cached).toBe(true);expect(first.saved).toBe(true);const seek=await request.get(first.audioUrl,{headers:{Cookie:headers.Cookie,Range:'bytes=10-19'}});expect(seek.status()).toBe(206);expect(seek.headers()['content-range']).toBe('bytes 10-19/100');expect((await seek.body()).length).toBe(10);
  for(const [question,q] of listeningQuestions(lesson.scenes[0]).entries()){const advance=await request.post('/api/learn',{headers,data:{action:'advance',chapterId:lesson.id,cursor:21,question,answer:q.answer}});expect(advance.status()).toBe(200);if(question<2)expect((await request.post('/api/learn/audio',{headers,data:{chapterId:lesson.id,cursor:22,target:'material'}})).status()).toBe(403);}
  const reading=await request.post('/api/learn/audio',{headers,data:{chapterId:lesson.id,cursor:22,part:0,target:'material'}});expect(reading.status()).toBe(200);const second=await reading.json();expect(second.audioUrl).not.toBe(first.audioUrl);expect(second.cached).toBe(true);
  expect((await request.post('/api/learn/audio',{headers,data:{chapterId:lessons[1].id,cursor:0,target:'material'}})).status()).toBe(403);
 }finally{await rm(path.join(root,'records',owner),{recursive:true,force:true});await rm(path.join(root,'records','audio-meta',key+'.json'),{force:true});await rm(path.join(root,'records','audio-meta',readingKey+'.json'),{force:true});await rm(path.join(root,'audio',key),{force:true});await rm(path.join(root,'audio',readingKey),{force:true});}
});
test('home chat retries reuse the saved bilingual reply, and other users cannot request its private speech',async({request,baseURL})=>{
 const root=process.env.BETWEEN_E2E_DATA_DIR!,owner=randomUUID(),other=randomUUID(),id=randomUUID();const cookie=(who:string)=>`between_session=${who}.${createHmac('sha256','between-local-development-only').update(who).digest('hex')}`;const headers={Origin:baseURL!,Cookie:cookie(owner)};
 const target=path.join(root,'records',owner,'home','rosie-v1.json');await mkdir(path.dirname(target),{recursive:true});await writeFile(target,JSON.stringify([{id,user:'Hello',english:'Hi, lovely to hear from you.',chinese:'嗨，很高兴听见你的声音。',createdAt:new Date().toISOString()}]));
 try{
  const retry=await request.post('/api/chat',{headers,data:{id,message:'Hello'}});expect(retry.status()).toBe(200);expect((await retry.json()).cached).toBe(true);const mine=await(await request.get('/api/chat',{headers})).json();expect(mine.messages).toHaveLength(1);
  const another=await(await request.get('/api/chat',{headers:{Cookie:cookie(other)}})).json();expect(another.messages).toHaveLength(0);expect((await request.post('/api/chat/audio',{headers:{Origin:baseURL!,Cookie:cookie(other)},data:{messageId:id}})).status()).toBe(404);
 }finally{await rm(path.join(root,'records',owner),{recursive:true,force:true});}
});
