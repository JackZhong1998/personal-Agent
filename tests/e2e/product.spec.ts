import {test,expect,type Page} from '@playwright/test';
import {lessons,lessonSteps,wordQuestion,materialBlocks} from '../../lib/learning/content';
const first=lessons[0];
const wav=Buffer.alloc(44+3200);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVE',8);wav.write('fmt ',12);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(16000,24);wav.writeUInt32LE(32000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(3200,40);
async function name(page:Page){await page.getByPlaceholder('你的名字或昵称').fill('Jamie');await page.getByRole('checkbox').check();await page.getByRole('button',{name:'就这样叫我',exact:true}).click();}
test('two-page Rosie home and travel catalog load real-source photo metadata without generating speech or chat',async({page},info)=>{
 let generated=0;page.on('request',r=>{if(r.method()==='POST'&&/\/api\/(chat|learn\/audio)/.test(r.url()))generated++;});
 await page.goto('/');await expect(page.locator('.portrait-caption h1')).toContainText('Rosie');await expect(page.locator('.rosie-photo img')).toBeVisible();await expect.poll(()=>page.locator('.rosie-photo img').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);await page.getByRole('button',{name:'切换 Rosie 照片 2'}).click();await expect(page.locator('.rosie-photo img')).toHaveAttribute('src','/rosie/rosie-detail.jpg');await name(page);
 await expect(page.getByRole('button',{name:'按一下，聊一会儿'})).toBeVisible();await page.locator('.home-travel-entry').click();await expect(page).toHaveURL(/\/travel$/);await expect(page.getByRole('heading',{name:/和 Rosie，\s*一起去美国/ })).toBeVisible();await expect(page.locator('.course-day')).toHaveCount(7);await expect(page.locator('.course-day').nth(1)).toBeDisabled();expect(generated).toBe(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`test-results/travel-${info.project.name}.png`,fullPage:true});
});
test('a complete travel chapter cycles through twenty words, the same listening and reading story, and two saved spoken replies',async({page},info)=>{
 test.setTimeout(150000);await page.emulateMedia({reducedMotion:'reduce'});const played:{chapterId:string;cursor:number;target:string}[]=[];
 await page.route('**/lesson-test.wav',r=>r.fulfill({contentType:'audio/wav',body:wav}));
 await page.route('**/api/learn/audio',r=>{played.push(r.request().postDataJSON());return r.fulfill({json:{audioUrl:'/lesson-test.wav',cached:played.length>1,saved:true}});});
 await page.goto('/travel');await name(page);await page.getByRole('button',{name:'开始今日章节',exact:true}).click();const room=page.getByRole('dialog',{name:'旅行章节：'+first.title});await expect(room).toBeVisible();let quizCount=0;
 const steps=lessonSteps(first);
 for(let cursor=0;cursor<steps.length;cursor++){
  const step=steps[cursor],scene=first.scenes[step.scene];await expect(page.locator('.frame-step small')).toHaveText(`${cursor+1} / ${steps.length}`);
  if(step.kind==='intro'){await page.getByRole('button',{name:'一起出发',exact:true}).click();continue;}
  if(step.kind==='word'){await expect(page.locator('.word-meaning')).toHaveText(scene.words[step.word].zh);await page.getByRole('button',{name:'记住了，继续',exact:true}).click();continue;}
  if(step.kind==='speak'){
   await expect(page.locator('.reply-script p')).toHaveText(scene.reply);await expect(page.locator('.reply-script small')).toHaveText(scene.replyZh);
   const skip=await page.request.post('/api/learn',{headers:{Origin:'http://127.0.0.1:3000'},data:{action:'advance',chapterId:first.id,cursor}});expect(skip.status()).toBe(400);
   await page.getByRole('button',{name:'开始朗读',exact:true}).click();await page.waitForTimeout(1150);await page.getByRole('button',{name:/说完了/}).click();await expect(page.locator('.recording-preview')).toBeVisible();await page.getByRole('button',{name:'发送给Rosie',exact:true}).click();
  }else{
   const q=step.kind==='quiz'?wordQuestion(scene,step.word):step.kind==='listen'?scene.listening:scene.reading;
   if(step.kind==='quiz'&&quizCount++===0){await page.locator('.learning-choices>button').nth((q.answer+1)%3).click();await page.getByRole('button',{name:'确认答案',exact:true}).click();await expect(page.locator('.learning-feedback.retry')).toBeVisible();await page.getByRole('button',{name:'再试一次',exact:true}).click();}
   if(step.kind==='listen'){
    await expect(page.locator('.reading-manuscript')).toHaveCount(0);await expect(page.getByText(scene.passage,{exact:true})).toHaveCount(0);
    await page.getByRole('button',{name:'听Rosie讲故事',exact:true}).click();await expect(page.getByText('音频已保存',{exact:true}).or(page.getByText('读取已保存音频',{exact:true}))).toBeVisible();
    await page.getByRole('button',{name:'用 2 钻石查看文稿'}).click();await expect(page.locator('.transcript')).toContainText(scene.passage);
   }
   if(step.kind==='read'){
    await expect(page.locator('.narration-script-line .story-passage')).toHaveText(scene.passage);await expect(page.locator('.rosie-script-line')).toHaveCount(2);await page.getByRole('button',{name:'查看中文',exact:true}).click();await expect(page.locator('.narration-script-line .story-translation')).toHaveText(scene.translation);
    await page.getByRole('button',{name:'边听边读',exact:true}).click();await expect(page.getByText('读取已保存音频',{exact:true})).toBeVisible();
    if(step.scene===0)await page.screenshot({path:`test-results/reading-${info.project.name}.png`,fullPage:false});
   }
   await page.locator('.learning-choices>button').nth(q.answer).click();await page.getByRole('button',{name:'确认答案',exact:true}).click();
  }
  await expect(page.locator('.learning-feedback.correct')).toBeVisible();await page.getByRole('button',{name:cursor===steps.length-1?'收好今天的旅程':'继续旅程',exact:true}).click();
 }
 await expect(page.getByRole('heading',{name:'今天的旅程，完成了。'})).toBeVisible();await page.getByRole('button',{name:'回到旅程地图',exact:true}).click();await expect(page.getByText('今日任务已完成',{exact:true})).toBeVisible();await expect(page.locator('.course-day').nth(1)).toBeEnabled();
 const saved=await(await page.request.get('/api/learn')).json();expect(saved.progress.earned).toHaveLength(20);expect(saved.progress.diamonds).toBe(16);expect(saved.progress.xp).toBe(250);expect(saved.progress.affection).toBe(5);expect(Object.keys(saved.progress.runs.arrival.recordings)).toHaveLength(2);expect(played).toHaveLength(4);
 await page.reload();await expect(page.getByText('今日任务已完成',{exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('home voice input sends a real chat request contract and displays bilingual reply before requesting saved speech',async({page},info)=>{
 let chats=0,audios=0;
 await page.addInitScript(()=>{class TestRecognition{lang='';continuous=false;interimResults=false;onresult:((e:unknown)=>void)|null=null;onend:(()=>void)|null=null;onerror=null;start(){setTimeout(()=>{this.onresult?.({resultIndex:0,results:[{0:{transcript:'I want to visit New York.'},isFinal:true}]});this.onend?.();},50);}stop(){this.onend?.();}abort(){}}Object.assign(window,{SpeechRecognition:TestRecognition});});
 await page.route('**/home-test.wav',r=>r.fulfill({contentType:'audio/wav',body:wav}));
 await page.route('**/api/chat',r=>{if(r.request().method()==='GET')return r.fulfill({json:{messages:[],ready:true}});chats++;const b=r.request().postDataJSON();expect(b.message).toBe('I want to visit New York.');return r.fulfill({json:{message:{id:b.id,user:b.message,english:"Then let's start with one little adventure. What would you like to see first?",chinese:'那我们就从一段小冒险开始。你最想先去哪里？',createdAt:new Date().toISOString()}}});});
 await page.route('**/api/chat/audio',r=>{audios++;return r.fulfill({json:{audioUrl:'/home-test.wav',cached:false,saved:true}});});
 await page.goto('/');await name(page);expect(chats).toBe(0);expect(audios).toBe(0);await page.getByRole('button',{name:'按一下，聊一会儿',exact:true}).click();await expect(page.locator('.voice-draft p')).toHaveText('I want to visit New York.');await page.getByRole('button',{name:'发送',exact:true}).click();await expect(page.locator('.home-exchange .home-rosie-line small')).toHaveText('那我们就从一段小冒险开始。你最想先去哪里？');await expect.poll(()=>audios).toBe(1);expect(chats).toBe(1);await page.screenshot({path:`test-results/rosie-home-${info.project.name}.png`,fullPage:true});
});
