// Editorial content only. No LLM generation. Change SCRIPT_VERSION when changing lines.
export const SCRIPT_VERSION = '2026-10-16.1';
export type ScriptTurn = { line: string; cue: string; suggestions: string[] };
const turn = (line: string, cue: string, ...suggestions: string[]): ScriptTurn => ({line, cue, suggestions});
export const scripts: Record<string, ScriptTurn[]> = {
  'first-coffee': [
    turn("Hey, you're welcome to sit here. I'm Alex. What's your name?", '向 Alex 介绍自己', "Hi, I'm Jamie. Nice to meet you.", "Thanks! Is this seat taken?"),
    turn("It's lovely to meet you. This is one of my favorite little places. What do you usually like to drink?", '聊聊你喜欢的饮品', "I usually get an iced latte.", "I'm more of a tea person, actually."),
    turn("I usually go for a flat white. I like having a quiet moment before work. How's your day been so far?", '分享今天的一件小事', "It's been a pretty good day so far.", "A little busy, but this coffee break helps."),
    turn("I work on the design of small bookshops. I love making places feel welcoming. What do you enjoy doing in your free time?", '说说你的兴趣爱好', "I love reading and taking walks.", "I like listening to music after work."),
    turn("I'm glad we shared this table today. Maybe we'll run into each other here again. Enjoy the rest of your day!", '这一章，已经好好说完了')
  ],
  'walk-home': [
    turn("Hey, nice to see you again. I'm heading toward the river. Would you like to walk together for a bit?", '回应一起走走的邀请', "I'd like that. I'm going that way too.", "Sure, I could use a little fresh air."),
    turn("I like this street at sunset. Everything slows down a little. What do you like about your neighborhood?", '描述你住的街区', "There are some lovely little cafés.", "I like how quiet it gets in the evening."),
    turn("There's a little park near my place. I go there when I need to clear my head. How do you relax after a long day?", '分享你的放松方式', "I usually put on some music.", "A short walk always makes me feel better."),
    turn("My ideal evening is a simple dinner and a good book. What would your perfect quiet evening look like?", '描绘一个理想的夜晚', "I'd make dinner and watch a movie.", "I'd call a friend and catch up."),
    turn("Well, this is my turn. Thanks for the company. That walk felt a little shorter with you. See you around!", '把这段黄昏，留在回忆里')
  ],
  'busy-monday': [
    turn("Hey, I've just stepped outside for lunch. How's your Monday going?", '说说今天的状态', "It's been busy, but I'm doing okay.", "A little tired, to be honest."),
    turn("Mine started with a very long meeting. I'm happy to have a little break now. What has been the best part of your day?", '发现今天的小小好消息', "I finished something I'd been putting off.", "Someone at work made me laugh."),
    turn("A customer told me the bookshop felt like home today. That really stayed with me. What makes a good day at work for you?", '表达工作中的满足感', "I like feeling that I've helped someone.", "Getting through my to-do list feels great."),
    turn("I'm going to get something nice for lunch before heading back. What are you looking forward to after work?", '分享下班后的期待', "I'm looking forward to a quiet evening.", "I'm meeting a friend for dinner."),
    turn("That sounds like a good way to finish the day. I hope your afternoon goes smoothly. Talk soon!", '把一点轻松带回日常')
  ],
  'rainy-bookshop': [
    turn("You made it in just before the rain! Come in. There's a quiet corner by the window. Do you like rainy days?", '聊聊你对雨天的感觉', "I do, especially when I'm somewhere cozy.", "Only when I don't have to go outside."),
    turn("I like hearing the rain while I read. Is there a book or a story that has stayed with you?", '分享喜欢的故事', "There's a book I loved when I was younger.", "I really enjoy stories about everyday people."),
    turn("I keep going back to stories about small towns. They remind me of where I grew up. What reminds you of home?", '说说关于家的回忆', "The smell of my favorite food.", "A song my family used to play."),
    turn("I think the rain is slowing down. Before you go, what kind of story would you like to read next?", '表达一个阅读愿望', "Something warm and a little funny.", "I'd love a good recommendation."),
    turn("I'll keep an eye out for one. Thanks for spending a rainy afternoon here. Take your time getting home.", '雨停了，故事留了下来')
  ],
  'weekend-market': [
    turn("This market smells amazing. I'm looking for something to make for dinner. What do you feel like eating?", '聊聊今天想吃什么', "Something simple, maybe pasta.", "I'd love something warm and homemade."),
    turn("Pasta is one of the few things I can make without a recipe. Do you enjoy cooking?", '分享你的做饭习惯', "I'm still learning, but I enjoy it.", "Honestly, I'm better at eating than cooking."),
    turn("These tomatoes look great. I usually add basil and a little olive oil. Is there an ingredient you always like?", '说说你喜欢的食材', "I put garlic in almost everything.", "Fresh herbs make such a difference."),
    turn("I think we have a plan. What would you put on the table for a relaxed weekend dinner?", '一起想象周末晚餐', "A big salad and something nice to drink.", "I'd add a dessert to share."),
    turn("That sounds perfect for a slow weekend. Thanks for helping me choose. I hope you find something delicious too.", '在生活的小事里，更熟悉一点')
  ],
  'late-call': [
    turn("Hey, is now a good time for a short call? I was just winding down for the evening. How are you feeling?", '说说此刻的心情', "I'm feeling pretty relaxed now.", "It's been a long day, but I'm okay."),
    turn("I was thinking about taking a small trip one day. Is there somewhere you've always wanted to visit?", '分享一个旅行愿望', "I'd love to see the ocean somewhere quiet.", "I've always wanted to visit London."),
    turn("I'd like a little place by the sea, with no big plans. Is there something new you'd like to try this year?", '谈谈你的小目标', "I want to feel more confident speaking English.", "I'd like to pick up a new hobby."),
    turn("Small steps count. I've enjoyed our little conversations. What's one nice thing you want to do for yourself tomorrow?", '为明天留一个小期待', "I'll make time for a proper breakfast.", "I'd like to go for a walk."),
    turn("I hope you get to do that. Thanks for the lovely chat. Get some rest, and have a good night.", '好好说晚安，也好好休息')
  ],
  'favorite-song': [
    turn("I heard a song earlier that reminded me of our walk. Does music ever bring back a moment for you?", '分享音乐带来的回忆', "Yes, some songs take me right back.", "There's a song that reminds me of home."),
    turn("I love that a few notes can do that. What kind of music do you put on when you're happy?", '聊聊你的开心歌单', "Usually something upbeat that I can sing along to.", "It depends on the day, really."),
    turn("I tend to choose something soft when I'm working. Do you like sharing songs with people?", '表达分享的想法', "I do. It's a nice way to say how I feel.", "Sometimes a song says it better than I can."),
    turn("I've enjoyed getting to know you. I hope these chats feel comfortable for you too. What pace feels right for you?", '表达你舒服的相处节奏', "I like taking things slowly.", "I'm enjoying getting to know you too."),
    turn("Thanks for telling me. There's no rush. I'm glad we can just enjoy these small moments.", '靠近，也可以从容一点')
  ],
  'not-perfect': [
    turn("Hey, let's take a seat for a minute. You don't have to have the perfect words. How has today been?", '用简单的话表达感受', "It's been a difficult day.", "I'm not quite sure how I feel."),
    turn("Some days are just heavier than others. Would you rather talk about it, or talk about something lighter?", '说出你现在需要什么', "I'd like to talk about it a little.", "Something lighter would be nice."),
    turn("Thanks for telling me what you need. When a day feels like this, what's one small thing that usually helps?", '找到照顾自己的小方法', "A walk and some fresh air help me.", "I usually call someone I trust."),
    turn("That sounds worth making time for. What could make this evening a little easier for you?", '给今晚一个温柔的计划', "I'll keep things simple and rest.", "A warm meal would be a good start."),
    turn("I hope your evening is gentler. Thanks for being honest. Take care of yourself, and reach out to someone close if you need to.", '允许今天不完美')
  ],
  'almost-date': [
    turn("This is a lovely little place. I'm glad we could have dinner. How has your evening been so far?", '自然地开启晚餐聊天', "It's been lovely. I'm glad I'm here.", "A little nervous, but in a good way."),
    turn("I was a little nervous too. I've enjoyed the time we've spent together. What do you enjoy about our conversations?", '说说相处中的感受', "I feel comfortable being myself.", "I like that we can talk about little things."),
    turn("I like that too. I wanted to ask how you see this. Friendship is lovely, and I'm open to something more if you are. What feels right?", '表达你的关系意愿', "I'd like to keep getting to know you slowly.", "I'd prefer to keep things friendly."),
    turn("Thank you for being open with me. We can keep the pace comfortable. What would make our time together feel good for you?", '说出你重视的相处方式', "Being honest with each other matters to me.", "I'd like us to keep things relaxed."),
    turn("I'm glad we could talk about it. Whatever shape this takes, I'm happy we shared this evening.", '真诚表达，比完美措辞更重要')
  ],
  'little-tradition': [
    turn("Our old table is free. It's funny how familiar this place feels now. Do you remember your first visit here?", '回顾初次相遇', "I remember feeling a little shy.", "I didn't expect to have such a nice chat."),
    turn("I remember being happy someone wanted to share the table. Has anything changed for you since then?", '分享你的小小变化', "Speaking English feels a little easier now.", "I'm more comfortable starting a conversation."),
    turn("Those little changes add up. Is there a small routine that makes your week better?", '聊聊让生活更好的习惯', "A slow coffee on the weekend.", "Taking a few minutes to check in with a friend."),
    turn("Maybe a quiet coffee can be our little tradition when it fits our lives. What would you like to do next time?", '提出下一次见面的想法', "We could try a new café.", "I'd love another walk by the river."),
    turn("That sounds like a lovely idea. Here's to small traditions, and leaving room for new things too.", '平凡的日常，也值得记住')
  ],
  'say-it': [
    turn("It's peaceful by the river tonight. Is there anything you've been wanting to say, or something you'd like to talk about?", '给真实感受一点空间', "I've really enjoyed our time together.", "I'd like to tell you how I've been feeling."),
    turn("Thank you for sharing that with me. I value the way we can be honest. What matters most to you in a close connection?", '分享你对亲密关系的看法', "Feeling respected and understood.", "Being able to be myself."),
    turn("I think feeling safe to be yourself matters a lot. How do you like people to show they care?", '表达你喜欢的关心方式', "Remembering the little things.", "Making time to listen, without pressure."),
    turn("That's lovely to know. We can keep being honest about what feels right. What would you like our next chapter to feel like?", '说出你对关系的期待', "Warm and easy, without rushing.", "I'd like to keep building our friendship."),
    turn("I'm glad you told me. There's no perfect line you needed to say. Being yourself was enough.", '认真说出来，就已经很好')
  ],
  'next-chapter': [
    turn("A quiet weekend at last. Thinking back to that first coffee, what has been your favorite moment?", '选一个最喜欢的瞬间', "I loved our walk at sunset.", "The rainy afternoon in the bookshop."),
    turn("Those ordinary moments have been lovely. How does speaking English feel compared with when we first met?", '感受自己的口语变化', "I feel more comfortable trying now.", "I still make mistakes, but I worry less."),
    turn("Trying counts more than getting every word right. What's something you'd like to practice next?", '为下一阶段设一个小目标', "I'd like to tell longer stories.", "I want to express my feelings more clearly."),
    turn("There's a lot more everyday life to talk about. What would be a nice little plan for your weekend?", '把练习带回真实生活', "I'll meet a friend and try a new place.", "I might make time for something I love."),
    turn("That sounds like a lovely next chapter. Thank you for all these conversations. Keep making room for your life, your people, and your own voice.", '第一季完结，新的自信刚刚开始')
  ]
};
