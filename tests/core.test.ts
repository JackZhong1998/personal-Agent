import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {chapters,localDay,relationship,reward,type Completion} from '../lib/story';
import {scripts} from '../lib/scripts';
import {AppError,getAudio,getRecord,locked,putAudio,putRecord,sameOrigin} from '../lib/server';
import {speech} from '../lib/speech';

let data:string;
before(async()=>{data=await mkdtemp(path.join(tmpdir(),'between-test-'));process.env.DATA_DIR=data;});
after(async()=>{await rm(data,{recursive:true,force:true});delete process.env.DATA_DIR;});
test('all chapters contain four authored interactions and a closing line',()=>{
  assert.equal(chapters.length,12);
  for(const c of chapters){const script=scripts[c.id];assert.equal(script.length,5);for(const t of script.slice(0,-1)){assert.equal(t.suggestions.length,2);assert.ok(t.line.length>20);assert.ok(t.cue);}assert.equal(script.at(-1)!.suggestions.length,0);}
});
test('daily rewards are capped, duplicates earn nothing, skipped days never subtract',()=>{
  const done:Completion[]=[];const day='2026-10-16';
  for(const c of chapters.slice(0,3)){done.push(reward(done,c.id,day)!);}
  assert.deepEqual(done.map(c=>[c.familiarity,c.affection]),[[10,6],[10,6],[0,0]]);
  assert.equal(reward(done,chapters[0].id,'2026-10-17'),null);
  done.push(reward(done,chapters[3].id,'2026-10-20')!);
  assert.equal(relationship(done).familiarity,30);assert.equal(relationship(done).stage.label,'渐渐熟悉');
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
