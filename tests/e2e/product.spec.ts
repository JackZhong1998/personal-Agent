import {test,expect,type Page} from '@playwright/test';
import {lessons,lessonSteps,wordQuestion,listeningQuestions} from '../../lib/learning/content';
import {readingPages} from '../../lib/learning/reading';
const first=lessons[0];
const wav=Buffer.alloc(44+3200);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVE',8);wav.write('fmt ',12);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(16000,24);wav.writeUInt32LE(32000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(3200,40);
async function name(page:Page){await page.getByPlaceholder('你的名字或昵称').fill('Jamie');await page.getByRole('checkbox').check();await page.getByRole('button',{name:'就这样叫我',exact:true}).click();}
async function fits(page:Page){
 const layout=await page.locator('.frame-content').evaluate((el)=>({scroll:el.scrollHeight,height:el.clientHeight}));expect(layout.scroll).toBeLessThanOrEqual(layout.height+2);
 const button=page.locator('.learning-dock .primary-button').last();await expect(button).toBeVisible();const rect=await button.boundingBox();expect(rect!.y+rect!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
}
test('home is a chat stream with one scene card, two Rosie images and no generation on browsing',async({page},info)=>{
 let generated=0;page.on('request',r=>{if(r.method()==='POST'&&/\/api\/(chat|learn\/audio)/.test(r.url()))generated++;});
 await page.goto('/');await expect(page.getByRole('heading',{name:'Rosie',exact:true})).toBeVisible();await expect(page.locator('.chat-home img')).toHaveCount(2);await name(page);
 await expect(page.getByRole('button',{name:'点击说话',exact:true})).toBeVisible();await expect(page.locator('.home-chat-feed .home-travel-entry')).toBeVisible();await page.screenshot({path:`test-results/chat-home-${info.project.name}.png`,fullPage:true});
 await page.locator('.home-travel-entry').click();await expect(page).toHaveURL(/\/travel$/);await expect(page.locator('.course-day')).toHaveCount(7);await expect(page.locator('.course-day').nth(1)).toBeDisabled();expect(generated).toBe(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('chapter has a guide, uninterrupted rewards, three listening questions and paginated reading with a fixed action',async({page},info)=>{
 test.setTimeout(150000);await page.emulateMedia({reducedMotion:'reduce'});if(info.project.name==='mobile')await page.setViewportSize({width:390,height:664});const played:{chapterId:string;cursor:number;target:string}[]=[];
 await page.route('**/lesson-test.wav',r=>r.fulfill({contentType:'audio/wav',body:wav}));await page.route('**/api/learn/audio',r=>{played.push(r.request().postDataJSON());return r.fulfill({json:{audioUrl:'/lesson-test.wav',cached:played.length>1,saved:true}});});
 await page.goto('/travel');await name(page);await page.getByRole('button',{name:'开始今日章节',exact:true}).click();await expect(page.getByRole('dialog',{name:'旅行章节：'+first.title})).toBeVisible();
 const steps=lessonSteps(first);let quizCount=0;
 for(let cursor=0;cursor<steps.length;cursor++){
  const step=steps[cursor],scene=first.scenes[step.scene];await expect(page.locator('.learning-toolbar>small')).toHaveText(`${cursor+1} / ${steps.length}`);
  if(step.kind==='intro'){await expect(page.locator('.learning-guide')).toContainText('2 钻石');await fits(page);await page.getByRole('button',{name:'了解了，出发',exact:true}).click();await page.getByRole('button',{name:'开始学单词',exact:true}).click();continue;}
  if(step.kind==='word'){await expect(page.locator('.word-meaning')).toHaveText(scene.words[step.word].zh);await fits(page);if(cursor===1)await page.screenshot({path:`test-results/focused-word-${info.project.name}.png`});await page.getByRole('button',{name:'继续',exact:true}).click();continue;}
  if(step.kind==='speak'){
   await fits(page);await page.getByRole('button',{name:'我要回应',exact:true}).click();await expect(page.locator('.reply-script p')).toHaveText(scene.reply);await expect(page.locator('.reply-script small')).toHaveText(scene.replyZh);await fits(page);
   const skip=await page.request.post('/api/learn',{headers:{Origin:'http://127.0.0.1:3000'},data:{action:'advance',chapterId:first.id,cursor}});expect(skip.status()).toBe(400);
   await page.getByRole('button',{name:'开始朗读',exact:true}).click();await page.waitForTimeout(1150);await page.getByRole('button',{name:/说完了/}).click();await expect(page.locator('.recording-preview')).toBeVisible();await page.getByRole('button',{name:'发送给Rosie',exact:true}).click();
  }else if(step.kind==='listen'){
   await expect(page.locator('.reading-manuscript')).toHaveCount(0);await page.getByRole('button',{name:'听Rosie讲故事',exact:true}).click();await expect(page.locator('.audio-save-note')).toContainText('已保存');
   await page.getByRole('button',{name:'文稿 · 2 钻石',exact:true}).click();await expect(page.locator('.transcript')).toContainText(scene.passage);await page.getByRole('button',{name:'关闭文稿'}).click();
   for(const [index,q] of listeningQuestions(scene).entries()){
    await expect(page.locator('.listening-question-count')).toHaveText(`${index+1} / 3`);await fits(page);await page.locator('.learning-choices>button').nth(q.answer).click();await page.getByRole('button',{name:'确认答案',exact:true}).click();
   }
  }else if(step.kind==='read'){
   const pages=readingPages(scene);await page.getByRole('button',{name:'查看中文',exact:true}).click();await page.getByRole('button',{name:'边听边读',exact:true}).click();await expect(page.locator('.audio-save-note')).toContainText('读取已保存音频');
   for(const [i,p] of pages.entries()){await expect(page.locator('.reading-manuscript .story-passage')).toHaveText(p.en);await expect(page.locator('.reading-manuscript .story-translation')).toHaveText(p.zh);await fits(page);if(i===0)await page.screenshot({path:`test-results/focused-read-${info.project.name}.png`});await page.getByRole('button',{name:'下一段',exact:true}).click();}
   await page.locator('.learning-choices>button').nth(scene.reading.answer).click();await page.getByRole('button',{name:'确认答案',exact:true}).click();
  }else{
   const q=wordQuestion(scene,'word' in step?step.word:0);
   if(quizCount++===0){await page.locator('.learning-choices>button').nth((q.answer+1)%3).click();await page.getByRole('button',{name:'确认答案',exact:true}).click();await expect(page.locator('.answer-retry')).toBeVisible();}
   await page.locator('.learning-choices>button').nth(q.answer).click();await page.getByRole('button',{name:'确认答案',exact:true}).click();
  }
  await expect(page.locator('.learning-feedback')).toHaveCount(0);
 }
 await expect(page.getByRole('heading',{name:'今天的旅程，完成了。'})).toBeVisible();await page.getByRole('button',{name:'返回章节',exact:true}).click();await expect(page.getByText('今日任务已完成',{exact:true})).toBeVisible();await expect(page.locator('.course-day').nth(1)).toBeEnabled();
 const saved=await(await page.request.get('/api/learn')).json();expect(saved.progress.earned).toHaveLength(20);expect(saved.progress.diamonds).toBe(16);expect(saved.progress.xp).toBe(250);expect(saved.progress.affection).toBe(5);expect(Object.keys(saved.progress.runs.arrival.recordings)).toHaveLength(2);expect(played).toHaveLength(4);
 await page.reload();await expect(page.getByText('今日任务已完成',{exact:true})).toBeVisible();await page.locator('.course-day').first().click();await page.getByRole('button',{name:'了解了，出发',exact:true}).click();await page.getByRole('button',{name:'开始学单词',exact:true}).click();await expect(page.locator('.word-meaning')).toHaveText(first.scenes[0].words[0].zh);
 const reviewed=await(await page.request.get('/api/learn')).json();expect(reviewed.progress.diamonds).toBe(saved.progress.diamonds);expect(reviewed.progress.xp).toBe(saved.progress.xp);
});
test('home voice sends the chat contract and renders bilingual reply before saved speech',async({page},info)=>{
 let chats=0,audios=0;
 await page.addInitScript(()=>{class TestRecognition{lang='';continuous=false;interimResults=false;onresult:((e:unknown)=>void)|null=null;onend:(()=>void)|null=null;onerror=null;start(){setTimeout(()=>{this.onresult?.({resultIndex:0,results:[{0:{transcript:'I want to visit New York.'},isFinal:true}]});this.onend?.();},50);}stop(){this.onend?.();}abort(){}}Object.assign(window,{SpeechRecognition:TestRecognition});});
 await page.route('**/home-test.wav',r=>r.fulfill({contentType:'audio/wav',body:wav}));await page.route('**/api/chat',r=>{if(r.request().method()==='GET')return r.fulfill({json:{messages:[],ready:true}});chats++;const b=r.request().postDataJSON();expect(b.message).toBe('I want to visit New York.');return r.fulfill({json:{message:{id:b.id,user:b.message,english:"Then let's start with one little adventure. What would you like to see first?",chinese:'那我们就从一段小冒险开始。你最想先去哪里？',createdAt:new Date().toISOString()}}});});await page.route('**/api/chat/audio',r=>{audios++;return r.fulfill({json:{audioUrl:'/home-test.wav',cached:false,saved:true}});});
 await page.goto('/');await name(page);expect(chats).toBe(0);expect(audios).toBe(0);await page.getByRole('button',{name:'点击说话',exact:true}).click();await expect(page.locator('.voice-draft p')).toHaveText('I want to visit New York.');await page.getByRole('button',{name:'发送',exact:true}).click();await expect(page.locator('.home-exchange .home-rosie-line small')).toHaveText('那我们就从一段小冒险开始。你最想先去哪里？');await expect.poll(()=>audios).toBe(1);expect(chats).toBe(1);await page.screenshot({path:`test-results/rosie-chat-${info.project.name}.png`});
});

test('every scene keeps words, bilingual reading and spoken reply above the action on a short phone screen',async({page},info)=>{
 test.skip(info.project.name!=='mobile');test.setTimeout(150000);await page.setViewportSize({width:390,height:600});await page.emulateMedia({reducedMotion:'reduce'});
 const {emptyLearning}=await import('../../lib/learning/progress');let fixture=emptyLearning();fixture.companionId='rosie';
 await page.route('**/api/learn',r=>r.fulfill({json:{progress:fixture,displayName:'Jamie'}}));
 for(const lesson of lessons){
  const steps=lessonSteps(lesson);
  for(let scene=0;scene<lesson.scenes.length;scene++){
   for(const kind of ['word','read','speak'] as const){
    const cursor=steps.findIndex(s=>s.scene===scene&&s.kind===kind);fixture=emptyLearning();fixture.companionId='rosie';
    for(const previous of lessons.slice(0,lesson.day-1))fixture.runs[previous.id]={cursor:47,recordings:{},completedDay:'2026-10-18'};
    fixture.runs[lesson.id]={cursor,recordings:{}};
    await page.goto('/travel');await page.locator('.course-day').nth(lesson.day-1).click();await expect(page.locator('.learning-toolbar>small')).toHaveText(`${cursor+1} / 47`);
    if(kind==='read'){
     await page.getByRole('button',{name:'查看中文',exact:true}).click();
     for(const _p of readingPages(lesson.scenes[scene])){await fits(page);await page.getByRole('button',{name:'下一段',exact:true}).click();}
    }else if(kind==='speak'){await fits(page);await page.getByRole('button',{name:'我要回应',exact:true}).click();await fits(page);}else await fits(page);
   }
  }
 }
});
