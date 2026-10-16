import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {chapters,localDay,relationship,reward,interactionReward,emptyProgress,STORY_ID,type Completion} from '../lib/story';
import {scripts,personalize,SCRIPT_VERSION} from '../lib/scripts';
import {displayNameSchema,settle,progress as readProgress,type Session} from '../lib/conversation';
import {access} from 'node:fs/promises';
import {AppError,getAudio,getRecord,locked,putAudio,putRecord,sameOrigin} from '../lib/server';
import {speech} from '../lib/speech';

let data:string;
before(async()=>{data=await mkdtemp(path.join(tmpdir(),'between-test-'));process.env.DATA_DIR=data;});
after(async()=>{await rm(data,{recursive:true,force:true});delete process.env.DATA_DIR;});
test('all twelve chapters contain twenty authored interactions, translations, names, and three local pictures',async()=>{
  assert.equal(chapters.length,12);
  for(const c of chapters){const script=scripts[c.id];assert.equal(script.length,21);assert.equal(script.filter(t=>t.image).length,3);assert.ok(script.some(t=>t.line.includes('{{name}}')));for(const t of script.slice(0,-1)){assert.equal(t.suggestions.length,2);assert.ok(t.line.length>20);assert.ok(t.cue);assert.ok(t.translation.length>5);if(t.image)await access(path.join(process.cwd(),'public',t.image.src));}assert.equal(script.at(-1)!.suggestions.length,0);}
});
test('daily chapter bonuses stop after two; interaction rewards continue and duplicates never pay twice',()=>{
 const done:Completion[]=[];const day='2026-10-16';
 for(const c of chapters.slice(0,3))done.push(reward(done,c.id,day)!);
 assert.deepEqual(done.map(c=>c.sparks),[10,10,0]);assert.equal(reward(done,chapters[0].id,'2026-10-17'),null);
 const p=emptyProgress();p.completions=done;
 for(let i=0;i<40;i++)p.interactions.push(interactionReward(p.interactions,'session-'+Math.floor(i/20),chapters[Math.floor(i/20)].id,i%20,day)!);
 assert.equal(relationship(p).familiarity,80);assert.equal(relationship(p).affection,40);assert.equal(relationship(p).stage.label,'渐渐熟悉');
 assert.equal(interactionReward(p.interactions,'session-0',chapters[0].id,0,day),null);
 const replay=interactionReward(p.interactions,'another-session',chapters[0].id,0,day)!;assert.deepEqual([replay.familiarity,replay.affection,replay.sparks],[0,0,1]);
});
test('names substitute in both languages, validate safely, and do not mutate authored lines',()=>{
 const t=scripts[chapters[0].id][3];const one=personalize(t,'小林'),two=personalize(t,'Jamie');
 assert.ok(one.line.includes('小林'));assert.ok(one.translation.includes('小林'));assert.ok(two.line.includes('Jamie'));assert.ok(t.line.includes('{{name}}'));
 for(const name of ['', 'x'.repeat(21), '<break/>', 'a\nb'])assert.equal(displayNameSchema.safeParse(name).success,false);
 assert.equal(displayNameSchema.parse('  小林  '),'小林');
});
test('settlement repairs saved turns after a failure and does not grant the reward a second time',async()=>{
 const owner='settlement-user';
 const s:Session={id:'settlement-session',chapterId:chapters[0].id,displayName:'Jamie',index:1,version:SCRIPT_VERSION,audioKey:'test',audioKeys:['test','test2'],recordings:[{key:'recording',duration:2}],createdAt:new Date().toISOString(),completed:false};
 const first=await locked(owner+'/progress',()=>settle(owner,s,0));assert.equal(first.feedback?.familiarity,2);
 const again=await locked(owner+'/progress',()=>settle(owner,s,0));assert.equal(again.feedback,null);assert.equal(again.progress.interactions.length,1);
 assert.equal((await readProgress(owner)).interactions.length,1);assert.ok(await getRecord(owner+'/'+STORY_ID+'/progress'));
 assert.equal(await getRecord(owner+'/progress'),null);
});
test('daily rollover uses the product timezone',()=>{
  assert.equal(localDay('Asia/Shanghai',new Date('2026-10-16T15:59:00Z')),'2026-10-16');
  assert.equal(localDay('Asia/Shanghai',new Date('2026-10-16T16:01:00Z')),'2026-10-17');
});
test('concurrent updates cannot enter the same critical section',async()=>{
  let release!:()=>void;const hold=new Promise<void>(r=>{release=r;});
  const first=locked('same-key',async()=>{await hold;return 1;});
  await assert.rejects(()=>locked('same-key',async()=>2),(e:unknown)=>e instanceof AppError&&e.status===409);
  release();assert.equal(await first,1);assert.equal(await locked('same-key',async()=>3),3);
});
test('local persistence and audio metadata survive independent reads',async()=>{
  await putRecord('test/progress',{completed:['coffee']});assert.deepEqual(await getRecord('test/progress'),{completed:['coffee']});
  await putAudio('test/voice',new Uint8Array([1,2,3]),'audio/webm');const a=await getAudio('test/voice');assert.equal(a.mime,'audio/webm');assert.deepEqual([...a.bytes],[1,2,3]);
  await assert.rejects(()=>getRecord('../outside'));await assert.rejects(()=>getAudio('missing'));
});
test('mutations require a matching Origin',()=>{
  assert.throws(()=>sameOrigin(new Request('https://between.example/api/start',{method:'POST',headers:{Origin:'https://evil.example'}})));
  assert.doesNotThrow(()=>sameOrigin(new Request('https://between.example/api/start',{method:'POST',headers:{Origin:'https://between.example'}})));
});
test('speech is generated once per text, model and voice; cache replays make no provider call',async()=>{
  const original=globalThis.fetch;const oldKey=process.env.CARTESIA_API_KEY;let calls=0;
  process.env.CARTESIA_API_KEY='test-placeholder';
  globalThis.fetch=async(input,init)=>{
    calls++;assert.equal(input,'https://api.cartesia.ai/tts/bytes');const body=JSON.parse(String(init?.body));
    assert.equal(body.model_id,'sonic-3.6');assert.equal(body.voice.id,'afb402ce-7a39-49cf-acb5-3ff42e4e224f');assert.equal(body.transcript,'A test line.');
    return new Response(new Uint8Array(100),{headers:{'Content-Type':'audio/mpeg'}});
  };
  try{const first=await speech('A test line.','role');const again=await speech('A test line.','role');assert.equal(first.cached,false);assert.equal(again.cached,true);assert.equal(first.key,again.key);assert.equal(calls,1);}
  finally{globalThis.fetch=original;if(oldKey===undefined)delete process.env.CARTESIA_API_KEY;else process.env.CARTESIA_API_KEY=oldKey;}
});
test('failed generation is not recorded as a cache hit',async()=>{
  const original=globalThis.fetch;const oldKey=process.env.CARTESIA_API_KEY;process.env.CARTESIA_API_KEY='test-placeholder';let calls=0;
  globalThis.fetch=async()=>{calls++;return new Response('unavailable',{status:503});};
  try{await assert.rejects(()=>speech('A different test line.','role'));await assert.rejects(()=>speech('A different test line.','role'));assert.equal(calls,2);}
  finally{globalThis.fetch=original;if(oldKey===undefined)delete process.env.CARTESIA_API_KEY;else process.env.CARTESIA_API_KEY=oldKey;}
});

test('personalized voice caches are private to their owners',async()=>{
 const original=globalThis.fetch,oldKey=process.env.CARTESIA_API_KEY;process.env.CARTESIA_API_KEY='test-placeholder';let calls=0;
 globalThis.fetch=async()=>{calls++;return new Response(new Uint8Array(100),{headers:{'Content-Type':'audio/mpeg'}});};
 try{const a=await speech('Hey, Jamie.','role','owner-a'),b=await speech('Hey, Jamie.','role','owner-b');assert.ok(a.key.startsWith('owner-a/'));assert.ok(b.key.startsWith('owner-b/'));assert.notEqual(a.key,b.key);assert.equal((await speech('Hey, Jamie.','role','owner-a')).cached,true);assert.equal(calls,2);}
 finally{globalThis.fetch=original;if(oldKey===undefined)delete process.env.CARTESIA_API_KEY;else process.env.CARTESIA_API_KEY=oldKey;}
});
