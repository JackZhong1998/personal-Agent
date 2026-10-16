import {test,expect} from '@playwright/test';
test('browse all primary pages without generating audio; locked chapters explain the prerequisite',async({page},info)=>{
  const paid:string[]=[];page.on('request',r=>{if(['/api/guide','/api/conversation/start','/api/conversation/turn'].some(p=>r.url().includes(p)))paid.push(r.url());});
  await page.goto('/');await expect(page.getByRole('heading',{name:'今天，也想听见你的声音'})).toBeVisible();
  await page.getByRole('button',{name:'回家的路，慢一点，未解锁'}).click();await expect(page.getByRole('status')).toContainText('上一章');
  const nav=page.getByRole('navigation',{name:info.project.name==='mobile'?'移动端导航':'主导航',exact:true});
  await nav.getByRole('button',{name:'我们的故事'}).click();await expect(page.locator('.chapter-card')).toHaveCount(12);
  await nav.getByRole('button',{name:'回忆收藏'}).click();await expect(page.getByRole('heading',{name:'第一段回忆，等你来收藏'})).toBeVisible();
  await nav.getByRole('button',{name:'关系旅程'}).click();await expect(page.getByText('关系阶段不等于对你的情感评价。',{exact:false})).toBeVisible();
  expect(paid).toHaveLength(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
test('onboarding, missing configuration and retry remain honest and contain no text chat',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'开启第一章',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'开始你的声音旅程'})).toBeVisible();
  const start=page.getByRole('button',{name:'准备好认识 Alex 了'});await expect(start).toBeDisabled();
  await page.getByPlaceholder('你的昵称').fill('Jamie');await page.getByRole('checkbox').check();await start.click();
  await expect(page.getByRole('dialog',{name:'一杯咖啡的距离'})).toBeVisible();
  await page.getByRole('button',{name:'进入语音章节'}).click();await expect(page.locator('.error-message')).toContainText('CARTESIA_API_KEY');
  await expect(page.getByRole('textbox')).toHaveCount(0);await page.getByRole('button',{name:'关闭',exact:true}).click();
  await expect(page.getByRole('heading',{name:'你好，Jamie'})).toBeVisible();
});
test('scripted voice room advances through four recordings and keeps spoken replies audio-only',async({page},info)=>{
  // Test fixtures only: no external synthesis, speech recognition or LLM call.
  let index=0;let guideCalls=0;
  const wav=Buffer.alloc(44+16000);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVE',8);wav.write('fmt ',12);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(16000,24);wav.writeUInt32LE(32000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(16000,40);
  const session=()=>({id:'11111111-1111-4111-8111-111111111111',chapterId:'first-coffee',index,total:4,audioUrl:'/test-audio.wav?turn='+index,completed:index===4,cue:'向 Alex 介绍自己',suggestions:index<4?["Hi, I'm Jamie. Nice to meet you.","Thanks! Is this seat taken?"]:[],recordings:Array.from({length:index},()=>({audioUrl:'/test-audio.wav',duration:2}))});
  await page.route('**/api/status',r=>r.fulfill({json:{roleVoice:true,guideVoice:true,storage:'local',session:true}}));
  await page.route('**/test-audio.wav*',r=>r.fulfill({contentType:'audio/wav',body:wav}));
  await page.route('**/api/conversation/start',r=>r.fulfill({json:session()}));
  await page.route('**/api/conversation/turn',async r=>{expect(r.request().postDataBuffer()?.length).toBeGreaterThan(300);index++;await r.fulfill({json:session()});});
  await page.route('**/api/guide',async r=>{guideCalls++;await r.fulfill({json:{audioUrl:'/test-audio.wav'}});});
  await page.goto('/');await page.getByRole('button',{name:'开启第一章',exact:true}).click();await page.getByRole('checkbox').check();await page.getByRole('button',{name:'准备好认识 Alex 了'}).click();await page.getByRole('button',{name:'进入语音章节'}).click();
  await expect(page.getByRole('dialog',{name:'语音章节：一杯咖啡的距离'})).toBeVisible();
  expect(guideCalls).toBe(0);
  await page.getByRole('button',{name:'不知道怎么说？看看表达提示'}).click();await page.getByRole('button',{name:'听推荐表达 1 的读音'}).click();await expect.poll(()=>guideCalls).toBe(1);
  for(let i=0;i<4;i++){
    const record=page.getByRole('button',{name:'开始录音',exact:true});await expect(record).toBeEnabled();await record.click();
    await expect(page.getByRole('button',{name:'结束录音并发送'})).toBeVisible();await page.waitForTimeout(1500);await page.getByRole('button',{name:'结束录音并发送'}).click();
    await expect.poll(()=>index).toBe(i+1);
  }
  await expect(page.getByRole('heading',{name:'这一章，好好说完了。'})).toBeVisible();await expect(page.getByRole('textbox')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`test-results/voice-${info.project.name}.png`,fullPage:true});await page.getByRole('button',{name:'收好这段回忆'}).click();
});
test('dashboard visual checkpoint',async({page},info)=>{
  await page.goto('/');await expect(page.locator('.hero-card')).toBeVisible();await page.screenshot({path:`test-results/home-${info.project.name}.png`,fullPage:true});
});
