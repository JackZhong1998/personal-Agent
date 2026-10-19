import {test} from 'node:test';
import assert from 'node:assert/strict';
import {lessons,lessonSteps,wordQuestion,listeningQuestions,materialBlocks,materialText,COMPANION} from '../lib/learning/content';
import {advanceLearning,emptyLearning,learningSummary,startLearning,unlockHint,submitReadingPart,unlockTranslation} from '../lib/learning/progress';
import {AppError} from '../lib/errors';
import {chatReply} from '../lib/home-chat';
import {phraseTokens,readingPages,sentenceTokens,shuffledPhrases} from '../lib/learning/reading';
const chosen=()=>({...emptyLearning(),companionId:COMPANION.id});
test('seven authored travel chapters have 140 words and identical listening/reading material containing narration and Rosie dialogue',()=>{
 assert.equal(lessons.length,7);let count=0;
 for(const lesson of lessons){assert.equal(lesson.scenes.length,2);const steps=lessonSteps(lesson);assert.equal(steps.length,47);assert.deepEqual(steps.slice(1,6).map(s=>s.kind),Array(5).fill('word'));assert.deepEqual(steps.slice(6,11).map(s=>s.kind),Array(5).fill('quiz'));
  for(let i=0;i<2;i++){const scene=lesson.scenes[i];assert.equal(scene.words.length,10);assert.equal(new Set(scene.words.map(w=>w.en)).size,10);count+=scene.words.length;assert.equal(scene.dialogue?.length,2);assert.equal(materialBlocks(scene).length,3);assert.ok(materialText(scene).includes(scene.passage));assert.ok(materialText(scene).includes(scene.message));assert.ok(scene.passage.split(' ').length>=60);assert.ok(scene.replyZh.length>5);for(const w of scene.words){assert.ok(w.ipa&&w.zh&&w.example&&w.exampleZh);}const tail=steps.filter(s=>s.scene===i).slice(-3);assert.deepEqual(tail.map(s=>s.kind),['listen','read','speak']);}
 }assert.equal(count,140);
});
test('wrong answers and future steps never grant rewards; speech cannot be skipped with a JSON completion',()=>{
 const p=chosen(),lesson=lessons[0];startLearning(p,lesson.id);assert.throws(()=>advanceLearning(p,lesson.id,2),e=>e instanceof AppError&&e.status===409);
 for(let cursor=0;cursor<6;cursor++)advanceLearning(p,lesson.id,cursor);
 const q=wordQuestion(lesson.scenes[0],0),wrong=(q.answer+1)%3;const result=advanceLearning(p,lesson.id,6,wrong);assert.equal(result.correct,false);assert.equal(p.runs[lesson.id].cursor,6);assert.equal(p.diamonds,0);
 for(let cursor=6;cursor<23;cursor++){const s=lessonSteps(lesson)[cursor];if(s.kind==='listen'){for(const [i,q] of listeningQuestions(lesson.scenes[s.scene]).entries())advanceLearning(p,lesson.id,cursor,q.answer,undefined,undefined,i);}else if(s.kind==='read'){for(const [part,page] of readingPages(lesson.scenes[s.scene]).entries())for(const language of ['zh','en'] as const)submitReadingPart(p,lesson.id,cursor,part,language,phraseTokens(page[language],language).map((_,i)=>i));}else advanceLearning(p,lesson.id,cursor,s.kind==='quiz'?wordQuestion(lesson.scenes[s.scene],s.word).answer:undefined);}
 assert.throws(()=>advanceLearning(p,lesson.id,23),e=>e instanceof AppError&&e.status===400);assert.equal(p.days.length,0);
});
test('a full chapter settles twenty word rewards, two recordings and daily completion once; hints cost exactly two diamonds',()=>{
 const p=chosen(),lesson=lessons[0];startLearning(p,lesson.id);assert.throws(()=>startLearning(p,lessons[1].id),e=>e instanceof AppError&&e.status===403);
 const steps=lessonSteps(lesson);
 for(let cursor=0;cursor<steps.length;cursor++){
  const s=steps[cursor],scene=lesson.scenes[s.scene];if(s.kind==='listen'){const before=p.diamonds;unlockHint(p,lesson.id,cursor);unlockHint(p,lesson.id,cursor);assert.equal(p.diamonds,before-2);}
  const answer=s.kind==='quiz'?wordQuestion(scene,s.word).answer:s.kind==='listen'?scene.listening.answer:undefined;
  if(s.kind==='listen'){for(const [i,q] of listeningQuestions(scene).entries()){const result=advanceLearning(p,lesson.id,cursor,q.answer,undefined,'2026-10-18',i);assert.equal(result.correct,true);const before=JSON.stringify(p);advanceLearning(p,lesson.id,cursor,q.answer,undefined,'2026-10-18',i);assert.equal(JSON.stringify(p),before);}}else if(s.kind==='read'){for(const [part,page] of readingPages(scene).entries())for(const language of ['zh','en'] as const){const result=submitReadingPart(p,lesson.id,cursor,part,language,phraseTokens(page[language],language).map((_,i)=>i),'2026-10-18');assert.equal(result.correct,true);}}else {if(s.kind==='speak'){const first=advanceLearning(p,lesson.id,cursor,undefined,{key:'private/test/'+cursor+'-1',duration:3},'2026-10-18');assert.equal(first.needsSecond,true);assert.equal(p.runs[lesson.id].cursor,cursor);}const result=advanceLearning(p,lesson.id,cursor,answer,s.kind==='speak'?{key:'private/test/'+cursor+'-2',duration:3}:undefined,'2026-10-18');assert.equal(result.correct,true);}
  const before=JSON.stringify(p),duplicate=advanceLearning(p,lesson.id,cursor,answer);assert.equal(duplicate.duplicate,true);assert.equal(JSON.stringify(p),before);
 }
 assert.equal(p.earned.length,20);assert.equal(p.diamonds,16);assert.equal(p.xp,250);assert.equal(p.familiarity,10);assert.equal(p.affection,5);assert.equal(Object.keys(p.runs[lesson.id].recordings).length,2);assert.deepEqual(p.days,['2026-10-18']);startLearning(p,lessons[1].id);
});
test('daily goal and streak count actual completed calendar days in the product timezone',()=>{
 const p=chosen();p.days=['2026-10-16','2026-10-17'];assert.deepEqual(learningSummary(p,new Date('2026-10-18T03:00:00Z')),{todayComplete:false,streak:2,completed:0,words:0});p.days.push('2026-10-18');assert.equal(learningSummary(p,new Date('2026-10-18T03:00:00Z')).streak,3);assert.equal(learningSummary(p,new Date('2026-10-21T03:00:00Z')).streak,0);
});
test('home chat calls the configured LLM with bounded history and returns validated bilingual content, without speech generation',async()=>{
 const original=globalThis.fetch,oldKey=process.env.OPENROUTER_API_KEY,oldModel=process.env.OPENROUTER_MODEL;process.env.OPENROUTER_API_KEY='local-placeholder';process.env.OPENROUTER_MODEL='deepseek/deepseek-v4-flash';let calls=0;
 globalThis.fetch=async(input,init)=>{calls++;assert.equal(input,'https://openrouter.ai/api/v1/chat/completions');const b=JSON.parse(String(init?.body));assert.equal(b.model,'deepseek/deepseek-v4-flash');assert.ok(b.messages[0].content.includes('fictional'));assert.equal(b.messages.at(-1).content,'I feel a little nervous.');return Response.json({choices:[{message:{content:JSON.stringify({english:"We can take it slowly. I'm here with you.",chinese:'我们可以慢慢来，我在这里陪着你。'})}}]});};
 try{const reply=await chatReply([],'I feel a little nervous.','Jamie');assert.ok(reply.chinese.includes('慢慢'));assert.equal(calls,1);globalThis.fetch=async()=>Response.json({choices:[{message:{content:'not JSON'}}]});await assert.rejects(()=>chatReply([],'Hello','Jamie'),e=>e instanceof AppError&&e.status===502);}
 finally{globalThis.fetch=original;if(oldKey===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=oldKey;if(oldModel===undefined)delete process.env.OPENROUTER_MODEL;else process.env.OPENROUTER_MODEL=oldModel;}
});

test('listening has three authored questions and retries cannot skip or reward the following question',()=>{
 const p=chosen(),lesson=lessons[0];startLearning(p,lesson.id);
 for(let cursor=0;cursor<21;cursor++){const step=lessonSteps(lesson)[cursor];advanceLearning(p,lesson.id,cursor,step.kind==='quiz'?wordQuestion(lesson.scenes[0],step.word).answer:undefined);}
 const qs=listeningQuestions(lesson.scenes[0]);assert.equal(qs.length,3);
 const first=advanceLearning(p,lesson.id,21,qs[0].answer,undefined,undefined,0);assert.equal(first.correct,true);assert.equal(p.runs.arrival.cursor,21);assert.equal(p.runs.arrival.listening?.['21'],1);
 const before=JSON.stringify(p);assert.equal(advanceLearning(p,lesson.id,21,qs[0].answer,undefined,undefined,0).duplicate,true);assert.equal(JSON.stringify(p),before);
 assert.throws(()=>advanceLearning(p,lesson.id,21,qs[2].answer,undefined,undefined,2),e=>e instanceof AppError&&e.status===409);
 assert.equal(advanceLearning(p,lesson.id,21,(qs[1].answer+1)%3,undefined,undefined,1).correct,false);assert.equal(p.diamonds,9);assert.equal(p.runs.arrival.cursor,21);
 advanceLearning(p,lesson.id,21,qs[1].answer,undefined,undefined,1);advanceLearning(p,lesson.id,21,qs[2].answer,undefined,undefined,2);assert.equal(p.runs.arrival.cursor,22);
});

test('reading pages preserve the complete paired bilingual script in every scene',()=>{
 for(const scene of lessons.flatMap(l=>l.scenes)){const pages=readingPages(scene),blocks=materialBlocks(scene);assert.equal(pages.map(p=>p.en).join(' ').replace(/\s+/g,' ').trim(),blocks.map(b=>b.en).join(' ').replace(/\s+/g,' ').trim());assert.equal(pages.map(p=>p.zh).join(''),blocks.map(b=>b.zh).join(''));assert.ok(pages.every(p=>p.en&&p.zh));}
 const hotel=readingPages(lessons[0].scenes[1])[0];assert.ok(hotel.en.includes('reservation'));assert.ok(hotel.zh.includes('预订'));
});
test('phrase choices cover both scripts without crossing sentence or clause boundaries',()=>{
 for(const page of lessons.flatMap(l=>l.scenes).flatMap(readingPages)){
  const en=phraseTokens(page.en,'en'),zh=phraseTokens(page.zh,'zh');assert.deepEqual(en.flatMap(sentenceTokens),sentenceTokens(page.en));assert.equal(zh.join(''),page.zh);assert.ok(en.every(x=>sentenceTokens(x).length<=4));assert.ok(zh.every(x=>Array.from(x).length<=8));
 }
 const hotel=phraseTokens(readingPages(lessons[0].scenes[1])[0].en,'en');assert.ok(hotel.every(x=>!x.includes('Manhattan At')));
});

test('reading checks two phrase rounds in order, saves the first round, and charges wrong answers',()=>{const p=chosen(),lesson=lessons[0];startLearning(p,lesson.id);p.runs[lesson.id].cursor=22;p.diamonds=3;const page=readingPages(lesson.scenes[0])[0],zh=phraseTokens(page.zh,'zh'),en=phraseTokens(page.en,'en');assert.ok(zh.length>1&&en.length>1);assert.ok(shuffledPhrases(page.en,'en').length<page.en.split(/\s+/).length);assert.throws(()=>submitReadingPart(p,lesson.id,22,0,'en',en.map((_,i)=>i)),e=>e instanceof AppError&&e.status===409);const bad=submitReadingPart(p,lesson.id,22,0,'zh',zh.map((_,i)=>zh.length-1-i));assert.equal(bad.correct,false);assert.equal(p.diamonds,2);assert.equal(p.runs[lesson.id].cursor,22);const first=submitReadingPart(p,lesson.id,22,0,'zh',zh.map((_,i)=>i));assert.equal(first.correct,true);assert.equal(p.runs[lesson.id].readingChinese?.['22'],0);assert.equal(submitReadingPart(p,lesson.id,22,0,'zh',zh.map((_,i)=>i)).duplicate,true);const second=submitReadingPart(p,lesson.id,22,0,'en',en.map((_,i)=>i));assert.equal(second.correct,true);assert.equal(p.runs[lesson.id].reading?.['22'],1);});
test('speaker translation charges once and requires sufficient diamonds',()=>{const p=chosen(),lesson=lessons[0];startLearning(p,lesson.id);p.runs[lesson.id].cursor=23;p.diamonds=2;unlockTranslation(p,lesson.id,23);unlockTranslation(p,lesson.id,23);assert.equal(p.diamonds,0);assert.deepEqual(p.translations,['arrival:23']);});
