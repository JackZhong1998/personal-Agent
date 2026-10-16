export type Chapter = {
  id: string; number: string; title: string; english: string; place: string;
  description: string; topic: string; tags: string[]; hints: string[]; color: string;
};
export const chapters: Chapter[] = [
  { id: 'first-coffee', number: '01', title: '一杯咖啡的距离', english: 'A little coffee, a little courage.', place: '街角咖啡馆', description: '最后一张空桌，刚好坐着他。一句简单的问候，也许是一段故事的开始。', topic: 'Meet Alex, a thoughtful 26-year-old bookshop designer, at a neighborhood coffee shop. Introduce yourselves and talk about coffee and small everyday joys.', tags: ['初次见面', '自我介绍'], hints: ["Hi, is this seat taken?", "I'm a little nervous, but it's nice to meet you.", "What's your go-to coffee order?"], color: 'coffee' },
  { id: 'walk-home', number: '02', title: '回家的路，慢一点', english: 'The long way home.', place: '黄昏的街道', description: '咖啡喝完了，但聊天还没有。刚好顺路，那就一起走一段吧。', topic: 'Walk home at sunset after coffee. Exchange details about your neighborhood, hobbies and your ideal quiet evening.', tags: ['生活日常', '兴趣爱好'], hints: ["Do you live around here?", "I love taking walks at sunset.", "What do you like to do after work?"], color: 'sunset' },
  { id: 'busy-monday', number: '03', title: '周一也有好消息', english: 'A small bright spot.', place: '午休的天台', description: '忙碌的工作日，他打来一通电话。今天，有什么值得分享的小事？', topic: 'An encouraging lunch break conversation about work, a small challenge, and one good thing about the day.', tags: ['工作分享', '表达感受'], hints: ["It's been a pretty busy day.", "Something nice happened at work today.", "How was your morning?"], color: 'sage' },
  { id: 'rainy-bookshop', number: '04', title: '雨停之前', english: 'Stay a little longer.', place: '雨天的书店', description: '一场突如其来的雨，把你们留在同一家书店。聊聊那些喜欢的故事。', topic: 'Shelter from rain in Alex’s bookshop. Share favorite books, music, and the memories they bring.', tags: ['共同喜好', '分享回忆'], hints: ["This place feels so cozy.", "Is there a book you'd recommend?", "That reminds me of when I was younger."], color: 'lavender' },
  { id: 'weekend-market', number: '05', title: '周末，和你一起', english: 'Nothing on the list but you.', place: '周末市集', description: '一起挑选晚餐的食材。从口味到习惯，发现更多关于彼此的小事。', topic: 'Browse a weekend market together. Talk about favorite foods and plan a simple dinner.', tags: ['生活习惯', '提出建议'], hints: ["What should we make for dinner?", "I'm not much of a cook, honestly.", "We should try this together."], color: 'coffee' },
  { id: 'late-call', number: '06', title: '晚安，再聊五分钟', english: 'Just five more minutes.', place: '睡前的电话', description: '一天结束了。你们聊起小小的梦想，以及最近藏在心里的期待。', topic: 'A gentle evening call about hopes and goals. Express warmth without dependency or rushing intimacy.', tags: ['内心想法', '表达期待'], hints: ["Can we talk for a few more minutes?", "Something I've always wanted to do is…", "Talking to you makes my day a little better."], color: 'sunset' },
  { id: 'favorite-song', number: '07', title: '这首歌，想给你听', english: 'You came to mind.', place: '独立唱片店', description: '他听见一首歌，突然想到了你。你也有这样的时刻吗？', topic: 'Share a song that reminds you of each other and explore feelings gently. Ask before flirting.', tags: ['音乐与回忆', '表达好感'], hints: ["This song made me think of you.", "What kind of music do you love?", "I like spending time with you."], color: 'lavender' },
  { id: 'not-perfect', number: '08', title: '不完美的一天', english: 'You can be yourself here.', place: '安静的公园', description: '今天不太顺利，也没关系。不用组织完美的语言，就说你真实的感受。', topic: 'Talk about a difficult ordinary day. Listen and offer practical support without acting as a therapist or encouraging emotional dependency.', tags: ['情绪表达', '倾听与支持'], hints: ["Today didn't go the way I hoped.", "Thanks for listening to me.", "I'd rather just take a walk for now."], color: 'sage' },
  { id: 'almost-date', number: '09', title: '这算是约会吗', english: 'Maybe it is.', place: '河畔小餐厅', description: '熟悉的聊天，稍微不一样的气氛。你们开始谈论彼此眼中的这段关系。', topic: 'A dinner that might be a date. Respectfully discuss whether you both want a romantic connection; accept friendship or slower pacing.', tags: ['关系探索', '表达意愿'], hints: ["Can I ask you something?", "I've really enjoyed getting to know you.", "I'd like to take things slowly."], color: 'sunset' },
  { id: 'little-tradition', number: '10', title: '只属于我们的小习惯', english: 'Our little thing.', place: '熟悉的咖啡馆', description: '还是那家咖啡馆，你们已经有了熟悉的座位和只属于彼此的玩笑。', topic: 'Revisit your first coffee shop and establish a small shared ritual. Keep commitments realistic and light.', tags: ['共同回忆', '日常陪伴'], hints: ["Should we make this our little tradition?", "I remember the first time we met here.", "Same time next week?"], color: 'coffee' },
  { id: 'say-it', number: '11', title: '有句话，想告诉你', english: 'A little more than words.', place: '傍晚的河边', description: '有些感受，不必用复杂的词。用你自己的方式，认真说出来。', topic: 'If the user consents, exchange gentle feelings about the relationship; otherwise celebrate friendship. No pressure or explicit content.', tags: ['真诚表达', '关系选择'], hints: ["There's something I'd like to tell you.", "You mean a lot to me.", "I'm happy with where we are."], color: 'lavender' },
  { id: 'next-chapter', number: '12', title: '我们的下一章', english: 'This is just the beginning.', place: '周末的阳台', description: '从陌生到熟悉，那些开口的瞬间，都在把你带向更自信的自己。', topic: 'Reflect on the journey, celebrate the user’s English practice, and imagine a future ordinary day together while encouraging a balanced real life.', tags: ['回顾与计划', '自由表达'], hints: ["I've become more confident speaking English.", "What should we do next weekend?", "I'm glad we got to know each other."], color: 'sage' }
];
export const stages = [
  { label: '初次相遇', threshold: 0, description: '从一句 hello 开始，让好奇心带我们靠近。' },
  { label: '渐渐熟悉', threshold: 20, description: '记住对方的小习惯，日常开始有了分享的对象。' },
  { label: '心动之间', threshold: 50, description: '熟悉里多了一点期待，试着说出真实感受。' },
  { label: '双向喜欢', threshold: 80, description: '在双方愿意的节奏里，认真表达心意。' }
];
export type Completion = { chapterId: string; day: string; familiarity: number; affection: number };
export function localDay(timeZone: string, date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
export function reward(completed: Completion[], chapterId: string, day: string): Completion | null {
  if (completed.some(c => c.chapterId === chapterId)) return null;
  const credited = completed.filter(c => c.day === day && c.familiarity > 0).length;
  return { chapterId, day, familiarity: credited < 2 ? 10 : 0, affection: credited < 2 ? 6 : 0 };
}
export function relationship(completed: Completion[]) {
  const familiarity = Math.min(100, completed.reduce((a,c) => a + c.familiarity,0));
  const affection = Math.min(100, completed.reduce((a,c) => a + c.affection,0));
  const stage = [...stages].reverse().find(s => familiarity >= s.threshold)!;
  return { familiarity, affection, stage };
}
