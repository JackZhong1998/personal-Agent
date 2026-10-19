import {test,expect,type Page} from '@playwright/test';
import {lessons,lessonSteps,wordQuestion,listeningQuestions} from '../../lib/learning/content';
import {phraseTokens,readingPages} from '../../lib/learning/reading';
const first=lessons[0];
const wav=Buffer.alloc(44+3200);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVE',8);wav.write('fmt ',12);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(16000,24);wav.writeUInt32LE(32000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(3200,40);
async function name(page:Page){if(await page.locator('.chat-home,.character-home').count()){await page.getByRole('button',{name:'选择角色',exact:true}).click();await page.getByRole('button',{name:'修改我的称呼',exact:true}).click();}await page.getByPlaceholder('你的名字或昵称').fill('Jamie');await page.getByRole('checkbox').check();await page.getByRole('button',{name:'就这样叫我',exact:true}).click();}
async function fits(page:Page){
 const button=page.locator('.learning-dock .primary-button').last();await expect(button).toBeVisible();const rect=await button.boundingBox();expect(rect!.y+rect!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
}
test('home shows one transparent character in a white room, scene and chat without generating speech',async({page},info)=>{
 let generated=0;page.on('request',r=>{if(r.method()==='POST'&&/\/api\/(chat|learn\/audio)/.test(r.url()))generated++;});
 await page.goto('/');await expect(page.getByRole('heading',{name:'Rosé',exact:true})).toBeVisible();await expect(page.locator('.room-background')).toBeVisible();await expect(page.locator('.room-figure img')).toBeVisible();await expect(page.locator('.room-figure img')).toHaveAttribute('src',/rosie-secondary/);await expect(page.locator('.showcase-tools')).toHaveCount(0);for(const selector of ['.room-figure img','.collage-polaroid img','.collage-guitar img'])await expect.poll(()=>page.locator(selector).evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth>0)).toBe(true);
 await expect(page.locator('.showcase-scene-card')).toBeVisible();await expect(page.getByRole('link',{name:'进入对话',exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);await page.screenshot({path:`test-results/showcase-${info.project.name}.png`,animations:'disabled'});expect(generated).toBe(0);
 await page.getByRole('link',{name:'进入对话',exact:true}).click();await expect(page).toHaveURL(/\/chat$/);await name(page);await page.getByRole('link',{name:'返回角色展示',exact:true}).click();await page.locator('.showcase-scene-card').click();await expect(page).toHaveURL(/\/travel$/);await expect(page.locator('.course-day')).toHaveCount(7);
});
test('chapter supports all listening questions, page-sized audio, sentence ordering and two recordings',async({page},info)=>{
 test.setTimeout(180000);await page.emulateMedia({reducedMotion:'reduce'});if(info.project.name==='mobile')await page.setViewportSize({width:390,height:664});const played:{chapterId:string;cursor:number;target:string;part?:number}[]=[];
 await page.route('**/lesson-test.wav',r=>r.fulfill({contentType:'audio/wav',body:wav}));await page.route('**/api/learn/audio',r=>{played.push(r.request().postDataJSON());return r.fulfill({json:{audioUrl:'/lesson-test.wav',cached:played.length>1,saved:true}});});
 await page.goto('/travel');await name(page);await page.getByRole('button',{name:'开始今日章节',exact:true}).click();await expect(page.getByRole('dialog',{name:'旅行章节：'+first.title})).toBeVisible();const steps=lessonSteps(first);let quizCount=0;
 for(let cursor=0;cursor<steps.length;cursor++){
  const step=steps[cursor],scene=first.scenes[step.scene];await expect(page.locator('.learning-toolbar>small')).toHaveText(`${cursor+1} / ${steps.length}`);
  if(step.kind==='intro'){await expect(page.locator('.learning-guide')).toContainText('答错扣 1 钻石');await fits(page);await page.getByRole('button',{name:'了解了，出发',exact:true}).click();await page.getByRole('button',{name:'开始学单词',exact:true}).click();continue;}
  if(step.kind==='word'){await expect(page.locator('.word-meaning')).toHaveText(scene.words[step.word].zh);await expect.poll(()=>played.some(p=>p.cursor===cursor)).toBe(true);await fits(page);if(cursor===1){const play=await page.locator('.learning-dock .lesson-audio').boundingBox(),confirm=await page.locator('.learning-primary-action>.primary-button').boundingBox();expect(Math.abs(play!.y-confirm!.y)).toBeLessThan(2);expect(play!.x).toBeLessThan(confirm!.x);await page.screenshot({path:`test-results/focused-word-${info.project.name}.png`});}await page.getByRole('button',{name:'继续',exact:true}).click();continue;}
  if(step.kind==='speak'){
   await expect(page.locator('.companion-line p')).toHaveText(scene.message);await page.getByRole('button',{name:'显示中文 · 2 钻石'}).click();await expect(page.locator('.companion-line small')).toHaveText(scene.messageZh);
   await page.getByRole('button',{name:'我要回应',exact:true}).click();await expect(page.locator('.reply-script p')).toHaveText(scene.reply);await expect(page.locator('.reply-script small')).toHaveText(scene.replyZh);await fits(page);
   const skip=await page.request.post('/api/learn',{headers:{Origin:'http://127.0.0.1:3000'},data:{action:'advance',chapterId:first.id,cursor}});expect(skip.status()).toBe(400);
   for(let take=0;take<2;take++){await page.getByRole('button',{name:'开始朗读',exact:true}).click();await page.waitForTimeout(1150);await page.getByRole('button',{name:/说完了/}).click();await expect(page.locator('.recording-preview')).toBeVisible();await page.getByRole('button',{name:'发送给Rosé',exact:true}).click();if(take===0)await expect(page.locator('.reply-script>span')).toContainText('第二次');}
  }else if(step.kind==='listen'){
   await expect(page.locator('.listening-item')).toHaveCount(3);await expect.poll(()=>played.some(p=>p.cursor===cursor)).toBe(true);await expect(page.locator('.audio-save-note')).toContainText('已保存');await expect(page.getByRole('slider',{name:'拖动语音位置'})).toBeVisible();await page.getByRole('button',{name:'0.8×'}).click();await expect(page.getByRole('button',{name:'0.8×'})).toHaveClass(/active/);
   await page.getByRole('button',{name:'文稿 · 2 钻石',exact:true}).click();await expect(page.locator('.transcript')).toContainText(scene.passage);await page.getByRole('button',{name:'关闭文稿'}).click();
   for(const [index,q] of listeningQuestions(scene).entries())await page.locator('.listening-item').nth(index).locator('.learning-choices>button').nth(q.answer).click();await fits(page);await page.getByRole('button',{name:'确认答案',exact:true}).click();
  }else if(step.kind==='read'){
   const pages=readingPages(scene);for(const [i,p] of pages.entries()){
    await expect(page.locator('.reading-manuscript .story-translation')).toHaveCount(0);await expect(page.locator('.reading-manuscript .story-passage')).toHaveCount(0);
    await expect.poll(()=>played.some(p=>p.cursor===cursor&&p.part===i)).toBe(true);await expect(page.getByRole('slider',{name:'拖动语音位置'})).toBeVisible();await page.getByRole('button',{name:'0.5×'}).click();
    for(const language of ['zh','en'] as const){if(language==='en')await expect(page.locator('.reading-manuscript .story-translation')).toHaveText(p.zh);const phrases=phraseTokens(p[language],language);for(let id=0;id<phrases.length;id++)await page.locator(`.word-bank button[data-word-id="${id}"]`).click();await fits(page);if(i===0&&language==='en')await page.screenshot({path:`test-results/focused-read-${info.project.name}.png`});await page.getByRole('button',{name:'确认拼句',exact:true}).click();}
   }
  }else{
   const q=wordQuestion(scene,'word' in step?step.word:0);
   if(quizCount++===0){await page.locator('.learning-choices>button').nth((q.answer+1)%3).click();await page.getByRole('button',{name:'确认答案',exact:true}).click();await expect(page.locator('.answer-retry')).toContainText('钻石已为 0');}
   await page.locator('.learning-choices>button').nth(q.answer).click();await page.getByRole('button',{name:'确认答案',exact:true}).click();
  }
 }
 await expect(page.getByRole('heading',{name:'今天的旅程，完成了。'})).toBeVisible();await page.getByRole('button',{name:'返回章节',exact:true}).click();await expect(page.getByText('今日任务已完成',{exact:true})).toBeVisible();const saved=await(await page.request.get('/api/learn')).json();expect(saved.progress.earned).toHaveLength(20);expect(saved.progress.diamonds).toBe(12);expect(saved.progress.xp).toBe(250);expect(saved.progress.affection).toBe(5);expect(Object.keys(saved.progress.runs.arrival.recordings)).toHaveLength(2);expect(Object.keys(saved.progress.runs.arrival.speaking)).toHaveLength(2);expect(played.filter(x=>x.part!==undefined).length).toBe(readingPages(first.scenes[0]).length+readingPages(first.scenes[1]).length);
});
test('home voice sends the chat contract and renders bilingual reply before saved speech',async({page},info)=>{
 let chats=0,audios=0;
 await page.addInitScript(()=>{class TestRecognition{lang='';continuous=false;interimResults=false;onresult:((e:unknown)=>void)|null=null;onend:(()=>void)|null=null;onerror=null;start(){setTimeout(()=>{this.onresult?.({resultIndex:0,results:[{0:{transcript:'I want to visit New York.'},isFinal:true}]});this.onend?.();},50);}stop(){this.onend?.();}abort(){}}Object.assign(window,{SpeechRecognition:TestRecognition});});
 await page.route('**/home-test.wav',r=>r.fulfill({contentType:'audio/wav',body:wav}));await page.route('**/api/chat',r=>{if(r.request().method()==='GET')return r.fulfill({json:{messages:[],ready:true}});chats++;const b=r.request().postDataJSON();expect(b.message).toBe('I want to visit New York.');return r.fulfill({json:{message:{id:b.id,user:b.message,english:"Then let's start with one little adventure. What would you like to see first?",chinese:'那我们就从一段小冒险开始。你最想先去哪里？',createdAt:new Date().toISOString()}}});});await page.route('**/api/chat/audio',r=>{audios++;return r.fulfill({json:{audioUrl:'/home-test.wav',cached:false,saved:true}});});
 await page.goto('/chat');await name(page);expect(chats).toBe(0);expect(audios).toBe(0);await page.getByRole('button',{name:'点击说话',exact:true}).click();await expect(page.locator('.voice-draft p')).toHaveText('I want to visit New York.');await page.getByRole('button',{name:'发送',exact:true}).click();await expect(page.locator('.home-exchange .home-rosie-line small')).toHaveText('那我们就从一段小冒险开始。你最想先去哪里？');await expect.poll(()=>audios).toBe(1);expect(chats).toBe(1);await page.screenshot({path:`test-results/rosie-chat-${info.project.name}.png`});
});

test('every scene keeps words, bilingual reading and spoken reply above the action on a short phone screen',async({page},info)=>{
 test.skip(info.project.name!=='mobile');test.setTimeout(150000);await page.route('**/api/learn/audio',r=>r.fulfill({json:{audioUrl:'/lesson-test.wav',cached:true,saved:true}}));await page.route('**/lesson-test.wav',r=>r.fulfill({contentType:'audio/wav',body:wav}));await page.setViewportSize({width:390,height:600});await page.emulateMedia({reducedMotion:'reduce'});
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
    if(kind==='read'){await expect(page.getByText('听英文 · 拼中文')).toBeVisible();await fits(page);}else if(kind==='speak'){await fits(page);await page.getByRole('button',{name:'我要回应',exact:true}).click();await fits(page);}else await fits(page);
   }
  }
 }
});

test('only messages scroll while the white header, draft and voice composer remain fixed',async({page},info)=>{
 if(info.project.name==='mobile')await page.setViewportSize({width:390,height:664});
 await page.addInitScript(()=>{class Recognition{lang='';continuous=false;interimResults=false;onresult:((e:unknown)=>void)|null=null;onend:(()=>void)|null=null;onerror=null;start(){this.onresult?.({resultIndex:0,results:[{0:{transcript:'I would like to practice my English today.'},isFinal:true}]});this.onend?.();}stop(){this.onend?.();}abort(){}}Object.assign(window,{SpeechRecognition:Recognition});});
 await page.route('**/api/chat',r=>r.fulfill({json:{ready:true,messages:Array.from({length:30},(_,i)=>({id:String(i),user:'Tell me about New York.',english:'We can explore the city together, one little moment at a time.',chinese:'我们可以一起慢慢探索这座城市。',createdAt:new Date().toISOString()}))}}));
 await page.goto('/chat');await name(page);await expect(page.locator('.home-exchange')).toHaveCount(30);await expect(page.locator('.home-rosie-line>span')).toHaveCount(0);await expect(page.getByRole('combobox')).toHaveCount(0);expect(await page.locator('.chat-home').evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(255, 255, 255)');
 await page.getByRole('button',{name:'点击说话',exact:true}).click();await expect(page.locator('.voice-draft p')).toHaveText('I would like to practice my English today.');
 const header=await page.locator('.chat-header').boundingBox(),composer=await page.locator('.chat-bottom').boundingBox();
 await page.locator('.home-chat-feed').evaluate(el=>el.scrollTop=0);await page.locator('.home-chat-feed').hover();await page.mouse.wheel(0,500);await expect.poll(()=>page.locator('.home-chat-feed').evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
 expect(await page.locator('.chat-header').boundingBox()).toEqual(header);expect(await page.locator('.chat-bottom').boundingBox()).toEqual(composer);expect(composer!.y+composer!.height).toBeLessThanOrEqual(page.viewportSize()!.height+1);
 await page.evaluate(()=>window.scrollTo(0,1000));expect(await page.evaluate(()=>scrollY)).toBe(0);expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);
 await page.screenshot({path:`test-results/white-chat-${info.project.name}.png`});
});

test('character drawer edits identity and links to static character, explore and scene pages',async({page},info)=>{
 let providers=0;page.on('request',r=>{if(r.method()==='POST'&&/\/api\/(chat|learn\/audio)/.test(r.url()))providers++;});
 await page.goto('/');await name(page);await page.getByRole('button',{name:'选择角色',exact:true}).click();const drawer=page.getByRole('dialog',{name:'角色列表',exact:true});await expect(drawer).toBeVisible();await expect(drawer.locator('.character-row')).toHaveCount(4);await expect(drawer.getByRole('button',{name:'修改我的称呼'})).toHaveText('Jamie');
 await drawer.getByRole('button',{name:'修改我的称呼'}).click();await drawer.getByPlaceholder('你的名字或昵称').fill('Jackie');await drawer.getByRole('button',{name:'保存',exact:true}).click();await expect(drawer).toHaveCount(0);
 await page.getByRole('button',{name:'选择角色',exact:true}).click();await expect(page.getByRole('button',{name:'修改我的称呼'})).toHaveText('Jackie');await expect(drawer).toHaveCSS('transform','none');await page.screenshot({path:`test-results/character-drawer-${info.project.name}.png`});await page.keyboard.press('Escape');await expect(drawer).toHaveCount(0);await expect(page.getByRole('button',{name:'选择角色',exact:true})).toBeFocused();
 await page.getByRole('link',{name:'新增场景',exact:true}).click();await expect(page).toHaveURL(/\/scenes\/new$/);await expect(page.getByRole('heading',{name:'新增场景',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'创建场景'})).toBeDisabled();await page.getByRole('link',{name:'返回首页',exact:true}).click();
 await page.getByRole('button',{name:'选择角色',exact:true}).click();await page.getByRole('link',{name:'新增',exact:true}).click();await expect(page).toHaveURL(/\/characters\/new$/);await expect(page.getByRole('button',{name:'创建角色'})).toBeDisabled();await page.getByRole('link',{name:'返回首页',exact:true}).click();
 await page.getByRole('button',{name:'选择角色',exact:true}).click();await page.getByRole('link',{name:'探索',exact:true}).click();await expect(page.locator('.explore-character')).toHaveCount(4);await page.getByRole('link',{name:'Jisoo 预览'}).click();await expect(page.getByRole('heading',{name:'Jisoo',exact:true})).toBeVisible();await expect(page.getByText('尚未开放',{exact:true})).toBeVisible();expect(providers).toBe(0);
 await page.goto('/');await page.getByRole('button',{name:'选择角色',exact:true}).click();await expect(page.getByRole('button',{name:'修改我的称呼'})).toHaveText('Jackie');
});

test('homepage relationship counters link to concise rules and preserve fixed viewport',async({page})=>{
 const {emptyLearning}=await import('../../lib/learning/progress');const fixture=emptyLearning();fixture.activeDays=['2026-10-12','2026-10-15','2026-10-19'];fixture.affection=12;
 await page.route('**/api/learn',r=>r.fulfill({json:{progress:fixture,displayName:'Jamie'}}));
 await page.goto('/');const days=page.getByRole('link',{name:'查看相识天数规则'}),heart=page.getByRole('link',{name:'查看心动值规则'});await expect(days).toContainText('3');await expect(heart).toHaveText('12');expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);
 await days.click();await expect(page).toHaveURL(/\/relationship#days$/);await expect(page.getByRole('heading',{name:'相识天数',exact:true})).toBeVisible();await expect(page.locator('#affection')).toContainText('漏学一天');await page.getByRole('link',{name:'返回首页',exact:true}).click();await heart.click();await expect(page).toHaveURL(/\/relationship#affection$/);await expect(page.getByRole('heading',{name:'心动值',exact:true})).toBeVisible();
});
