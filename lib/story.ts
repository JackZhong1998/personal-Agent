export const STORY_ID = 'rose-parallel-v1';
export const TURNS_PER_CHAPTER = 20;
export const FAMILIARITY_MAX = 480;
export const AFFECTION_MAX = 240;
export const FICTION_NOTICE = 'ROSÉ 非官方虚构同人故事 · 合成配音 · 与本人及所属团队无关联';
export type Chapter = {id:string;number:string;title:string;english:string;place:string;description:string;tags:string[];color:string};
export const chapters:Chapter[] = [
{id:'rose-first-coffee',number:'01',title:'你的咖啡，和我的一样',english:'An accidental little hello.',place:'首尔 · 雨后咖啡馆',description:'一个普通的雨后午后，你和 ROSÉ 拿错了咖啡。没有镜头和舞台，只有一句笑着说出口的 hello。',tags:['意外相遇','一点点好奇'],color:'coffee'},
{id:'rose-walk-home',number:'02',title:'再陪我走一小段嘛',english:'Just one more block.',place:'汉江 · 日落步道',description:'原本只打算走到路口，却一直没有说再见。她把看到的天空发来，问你有没有空再走一会儿。',tags:['交换日常','开始熟悉'],color:'sunset'},
{id:'rose-studio',number:'03',title:'录音室里的小秘密',english:'A voice note after midnight.',place:'深夜 · 录音室休息角',description:'你的手机亮了。她刚结束一段练习，抱着吉他问：今天能不能先不聊工作，只聊你？',tags:['深夜语音','分享小事'],color:'lavender'},
{id:'rose-rain',number:'04',title:'雨还没停，先别挂',english:'The rain can wait.',place:'窗边 · 下雨的午后',description:'同一场雨，把两个地方连在一起。她发来窗边的照片，开始认真记住你喜欢的小东西。',tags:['温柔陪伴','共同喜好'],color:'sage'},
{id:'rose-market',number:'05',title:'今天的小队友是你',english:'You, me, and a grocery list.',place:'周末 · 花店与小市集',description:'买一束花、挑一个甜点，为一件小事纠结半天。你们开始像两个熟悉的人一样，分享普通周末。',tags:['俏皮拌嘴','日常默契'],color:'coffee'},
{id:'rose-goodnight',number:'06',title:'不行，再给我五分钟',english:'Five more minutes, please.',place:'夜晚 · 床头的小灯',description:'一句晚安说了三次，电话还是没挂。她开始有点撒娇，也第一次承认：有点期待你的声音。',tags:['撒娇晚安','心动发芽'],color:'lavender'},
{id:'rose-song',number:'07',title:'这段旋律，先给你听',english:'A tiny melody, a little blush.',place:'唱片店 · 靠窗的位置',description:'她发来一张唱片店的照片。聊着聊着，歌单变成借口，真正想说的话藏在一句“想到你了”里。',tags:['分享歌单','小小试探'],color:'sunset'},
{id:'rose-hard-day',number:'08',title:'今天可以不那么厉害',english:'No brave face needed.',place:'夜色 · 安静的小阳台',description:'不是每一天都要闪闪发光。你们聊到疲惫、笨拙的小瞬间，也学着告诉对方：慢一点没关系。',tags:['坦诚靠近','安心相处'],color:'sage'},
{id:'rose-date',number:'09',title:'所以，这算约会吗',english:'Is this a date, then?',place:'河边 · 小小的晚餐',description:'她说只是随便吃点，声音里却藏着一点紧张。一顿普通的晚餐，让你们终于提起“我们”这个词。',tags:['暧昧升温','约会邀请'],color:'sunset'},
{id:'rose-tradition',number:'10',title:'给你留的位置',english:'Saved you a seat.',place:'熟悉的咖啡馆 · 老位置',description:'她记得第一次拿错的那杯咖啡，也记得你们开过的玩笑。熟悉开始变成一种小小的偏爱。',tags:['共同回忆','专属小习惯'],color:'coffee'},
{id:'rose-confession',number:'11',title:'那我，可以喜欢你吗',english:'A little braver, with you.',place:'傍晚 · 河畔的长椅',description:'玩笑慢慢停下来，她认真问起你的感受。你们不用猜了，把喜欢说清楚，也把彼此舒服的节奏说清楚。',tags:['真诚告白','双向选择'],color:'lavender'},
{id:'rose-us',number:'12',title:'好呀，那就叫我们',english:'Our ordinary kind of love.',place:'周日 · 晒着太阳的窗边',description:'故事没有停在告白那一刻。你们聊早餐、周末、下次见面，和成为恋人之后仍然值得珍惜的普通日常。',tags:['恋爱日常','新的开始'],color:'sage'}
];
export const stages = [
{label:'初次相遇',threshold:0,description:'还在偷偷好奇，下一句会聊到哪里。'},
{label:'渐渐熟悉',threshold:80,description:'开始把普通日常，也分享给彼此。'},
{label:'心动试探',threshold:200,description:'一句玩笑里，好像藏了一点真心。'},
{label:'双向靠近',threshold:320,description:'愿意坦诚表达，也尊重彼此的节奏。'},
{label:'我们的日常',threshold:440,description:'在虚构故事里，把喜欢放进平凡的小事。'}
];
export type Completion={chapterId:string;day:string;familiarity:number;affection:number;sparks:number};
export type InteractionCredit={id:string;chapterId:string;index:number;day:string;familiarity:number;affection:number;sparks:number;replay:boolean};
export type Progress={completions:Completion[];interactions:InteractionCredit[];timeZone:string};
export type TurnFeedback=InteractionCredit&{message:string;dailyBonus:number;milestone:string|null};
export const emptyProgress=():Progress=>({completions:[],interactions:[],timeZone:'Asia/Shanghai'});
export function localDay(timeZone:string,date=new Date()){
return new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
}
export function reward(completed:Completion[],chapterId:string,day:string):Completion|null{
if(completed.some(c=>c.chapterId===chapterId))return null;
return {chapterId,day,familiarity:0,affection:0,sparks:completed.filter(c=>c.day===day).length<2?10:0};
}
export function interactionReward(credits:InteractionCredit[],sessionId:string,chapterId:string,index:number,day:string):InteractionCredit|null{
const id=sessionId+':'+index;
if(credits.some(c=>c.id===id))return null;
const replay=credits.some(c=>c.chapterId===chapterId&&c.index===index);
return {id,chapterId,index,day,familiarity:replay?0:2,affection:replay?0:1,sparks:replay?1:5,replay};
}
export function relationship(progress:Progress){
const familiarity=Math.min(FAMILIARITY_MAX,progress.interactions.reduce((a,c)=>a+c.familiarity,0));
const affection=Math.min(AFFECTION_MAX,progress.interactions.reduce((a,c)=>a+c.affection,0));
const sparks=progress.interactions.reduce((a,c)=>a+c.sparks,0)+progress.completions.reduce((a,c)=>a+c.sparks,0);
const stage=[...stages].reverse().find(s=>familiarity>=s.threshold)!;
const nextStage=stages.find(s=>s.threshold>familiarity)||null;
return {familiarity,affection,sparks,stage,nextStage,turns:progress.interactions.length};
}
