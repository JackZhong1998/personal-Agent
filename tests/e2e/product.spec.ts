import {test,expect} from '@playwright/test';
import {chapters,emptyProgress,interactionReward,relationship,reward,type Progress} from '../../lib/story';
import {scripts} from '../../lib/scripts';
const first=chapters[0];
test('browse the ROSÉ story without synthesis and explain locked chapters',async({page},info)=>{
 const generated:string[]=[];page.on('request',r=>{if(['/api/guide','/api/conversation/start','/api/conversation/turn'].some(p=>r.url().includes(p)))generated.push(r.url());});
 await page.goto('/');await expect(page.getByRole('heading',{name:'今天，也想听见你的声音'})).toBeVisible();await expect(page.locator('.hero-pill')).toContainText('ROSÉ');
 await page.getByRole('button',{name:chapters[1].title+'，未解锁'}).click();await expect(page.getByRole('status')).toContainText('上一章');
 const nav=page.getByRole('navigation',{name:info.project.name==='mobile'?'移动端导航':'主导航',exact:true});
 await nav.getByRole('button',{name:'我们的故事'}).click();await expect(page.locator('.chapter-card')).toHaveCount(12);
 await nav.getByRole('button',{name:'回忆收藏'}).click();await expect(page.getByRole('heading',{name:'第一段回忆，等你来收藏'})).toBeVisible();
 await nav.getByRole('button',{name:'关系旅程'}).click();await expect(page.getByText('关系阶段不等于对你的情感评价。',{exact:false})).toBeVisible();
 expect(generated).toHaveLength(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('a name is mandatory, saved on the server, and never substituted by a generic nickname',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'开启第一章',exact:true}).click();
 const start=page.getByRole('button',{name:'准备好认识 ROSÉ 了'});await page.getByRole('checkbox').check();await expect(start).toBeDisabled();
 await page.getByPlaceholder('你的名字，或希望她叫你的昵称').fill('Jamie');await start.click();
 await expect(page.getByRole('dialog',{name:first.title})).toBeVisible();
 expect(await page.evaluate(async()=>{const r=await fetch('/api/profile');return(await r.json()).displayName;})).toBe('Jamie');
 await page.getByRole('button',{name:'进入语音章节'}).click();await expect(page.locator('.error-message')).toContainText('CARTESIA_API_KEY');
 await expect(page.getByRole('textbox')).toHaveCount(0);await page.getByRole('button',{name:'关闭',exact:true}).click();await expect(page.getByRole('heading',{name:'你好，Jamie'})).toBeVisible();
});
test('twenty voice interactions show names, Chinese translations, pictures and animated rewards',async({page},info)=>{
 test.setTimeout(150000);
 let index=0,guideCalls=0,translationCalls=0;const id='11111111-1111-4111-8111-111111111111';const p:Progress=emptyProgress();
 const wav=Buffer.alloc(44+3200);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVE',8);wav.write('fmt ',12);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(16000,24);wav.writeUInt32LE(32000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(3200,40);
 const session=()=>({id,chapterId:first.id,displayName:'Jamie',index,total:20,audioUrl:'/test-audio.wav?turn='+index,completed:index===20,cue:scripts[first.id][index].cue,suggestions:scripts[first.id][index].suggestions,messages:Array.from({length:index+1},(_,i)=>({index:i,audioUrl:'/test-audio.wav?turn='+i,image:scripts[first.id][i].image})),recordings:Array.from({length:index},()=>({audioUrl:'/test-audio.wav',duration:2})),progress:p,relationship:relationship(p),feedback:null});
 await page.route('**/api/status',r=>r.fulfill({json:{roleVoice:true,guideVoice:true,storage:'local',session:true}}));
 await page.route('**/test-audio.wav*',r=>r.fulfill({contentType:'audio/wav',body:wav}));
 await page.route('**/api/conversation/start',r=>{expect(r.request().postDataJSON().displayName).toBe('Jamie');return r.fulfill({json:session()});});
 await page.route('**/api/conversation/turn',async r=>{
  expect(r.request().postDataBuffer()?.length).toBeGreaterThan(300);const credit=interactionReward(p.interactions,id,first.id,index,'2026-10-16')!;p.interactions.push(credit);index++;
  if(index===20)p.completions.push(reward(p.completions,first.id,'2026-10-16')!);
  await r.fulfill({json:{...session(),feedback:{...credit,message:'这一句，让你们又靠近了一点',dailyBonus:index===20?10:0,milestone:null}}});
 });
 await page.route('**/api/guide',async r=>{guideCalls++;expect(r.request().postDataJSON().sessionId).toBe(id);await r.fulfill({json:{audioUrl:'/test-audio.wav'}});});
 await page.route('**/api/conversation/translation?**',async r=>{translationCalls++;await r.fulfill({json:{translation:'Jamie，这个小小的片刻，想和你一起收藏。'}});});
 await page.goto('/');await page.getByRole('button',{name:'开启第一章',exact:true}).click();await page.getByPlaceholder('你的名字，或希望她叫你的昵称').fill('Jamie');await page.getByRole('checkbox').check();await page.getByRole('button',{name:'准备好认识 ROSÉ 了'}).click();await page.getByRole('button',{name:'进入语音章节'}).click();
 await expect(page.getByRole('dialog',{name:'语音章节：'+first.title})).toBeVisible();expect(guideCalls).toBe(0);expect(translationCalls).toBe(0);
 await page.getByRole('button',{name:'查看第 1 段中文',exact:true}).click();await expect(page.locator('.translation-bubble')).toContainText('Jamie');expect(translationCalls).toBe(1);expect(guideCalls).toBe(0);
 await page.getByRole('button',{name:'打开表达提示'}).click();await page.getByRole('button',{name:'听推荐表达 1 的读音'}).click();await expect.poll(()=>guideCalls).toBe(1);
 for(let i=0;i<20;i++){
  const record=page.getByRole('button',{name:'开始录音',exact:true});await expect(record).toBeEnabled();await record.click();await expect(page.getByRole('button',{name:'结束录音并发送'})).toBeVisible();await page.waitForTimeout(1150);await page.getByRole('button',{name:'结束录音并发送'}).click();
  await expect.poll(()=>index).toBe(i+1);await expect(page.locator('.live-stat').first().locator('b')).toHaveText(String((i+1)*2));await expect(page.locator('.reward-burst')).toBeVisible();
  if(i===5){
   const image=page.locator('.chat-photo').first();await expect(image).toBeVisible();expect(await image.locator('img').evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBe(true);
   await image.click();await expect(page.getByRole('dialog',{name:'场景图片预览'})).toBeVisible();await page.getByRole('button',{name:'关闭图片预览'}).click();
   await page.screenshot({path:`test-results/voice-${info.project.name}.png`,fullPage:false});
  }
 }
 await expect(page.getByRole('heading',{name:'二十次回应，把故事聊成了我们。'})).toBeVisible();await expect(page.getByRole('textbox')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.getByRole('button',{name:'收好这段回忆'}).click();await expect(page.getByRole('heading',{name:'你好，Jamie'})).toBeVisible();
});
test('dashboard visual checkpoint',async({page},info)=>{await page.goto('/');await expect(page.locator('.hero-card')).toBeVisible();await page.screenshot({path:`test-results/home-${info.project.name}.png`,fullPage:true});});
