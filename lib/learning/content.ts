export const COURSE_ID='us-with-rosie-v1';
export const COMPANION={id:'rosie',name:'Rosie',english:'ROSIE',description:'温柔 · 好奇 · 和你一起成长',intro:"Hi, I'm Rosie. We can take this one little adventure at a time. Ready to see where today takes us?"};
export type Word={en:string;ipa:string;zh:string;example:string;exampleZh:string};
export type Question={prompt:string;options:string[];answer:number;explanation:string};
export type Scene={title:string;place:string;image:string;words:Word[];dialogue?:{en:string;zh:string}[];passage:string;translation:string;listening:Question;reading:Question;message:string;messageZh:string;reply:string;replyZh:string};
export type Lesson={id:string;day:number;title:string;english:string;place:string;intro:string;introZh:string;scenes:Scene[]};
const words=(text:string):Word[]=>text.trim().split('\n').map(row=>{const [en,ipa,zh,example,exampleZh]=row.split('|');return {en,ipa,zh,example,exampleZh};});
const question=(prompt:string,correct:string,wrong:string[],explanation:string,position=0):Question=>{const options=[...wrong];options.splice(position,0,correct);return {prompt,options,answer:position,explanation};};
export const lessons:Lesson[]=[
{id:'arrival',day:1,title:'终于，和你抵达纽约',english:'A little courage. A new beginning.',place:'JFK → Manhattan',intro:"We made it. The city is still a little way away, but our adventure has already started. Stay close. We can figure out the first steps together.",introZh:'我们到啦。离市区还有一点距离，但我们的旅程已经开始了。靠近一点，我们一起慢慢来。',scenes:[
{title:'入境大厅的小默契',place:'JFK · Arrivals',image:'airport',words:words(`passport|/ˈpæspɔːrt/|护照|May I see your passport?|可以看一下你的护照吗？
purpose|/ˈpɜːrpəs/|目的|What is the purpose of your visit?|你这次来访的目的是什么？
vacation|/veɪˈkeɪʃən/|假期；度假|We are here on vacation.|我们来这里度假。
luggage|/ˈlʌɡɪdʒ/|行李|Let's collect our luggage.|我们去取行李吧。
arrival|/əˈraɪvəl/|抵达；到达|Follow the signs for arrivals.|沿着到达标志走。`),
passage:"The arrival hall is bright and busy. I walk beside you and check that my passport is still in my bag. An officer asks about the purpose of our visit. We explain that we are on vacation for one week. After a short conversation, we follow the signs to collect our luggage. I spot your suitcase first and grin. Our first little challenge is already behind us.",
translation:'到达大厅明亮又忙碌。我走在你身边，确认护照还在包里。工作人员询问我们来访的目的，我们解释是来度假一周。简短交谈后，我们沿着标志去取行李。我先发现了你的箱子，忍不住笑起来。第一个小挑战，已经一起完成啦。',
listening:question('你们为什么来到美国？','度假一周',['参加工作面试','转机去另一个国家'],'她说：we are on vacation for one week。',1),reading:question('What do we do after speaking to the officer?','Collect our luggage.',['Buy new passports.','Go back to the plane.'],'交谈后，你们沿标志去取行李。',2),message:"You did that so calmly. What should we tell the officer if they ask why we're here?",messageZh:'你刚刚好镇定。如果工作人员问为什么来这里，我们该怎么说？',reply:'We are here on vacation, and we are staying for one week. We are excited to explore New York.',replyZh:'我们来这里度假，会待一周。我们很期待探索纽约。'},
{title:'给窗边留一个位置',place:'Manhattan · Hotel',image:'hotel',words:words(`reservation|/ˌrezərˈveɪʃən/|预订|I have a reservation.|我有预订。
shuttle|/ˈʃʌtəl/|接驳车|Does the shuttle stop near our hotel?|接驳车会在酒店附近停吗？
check in|/tʃek ɪn/|办理入住|We would like to check in.|我们想办理入住。
key card|/kiː kɑːrd/|房卡|Here is your key card.|这是你的房卡。
breakfast|/ˈbrekfəst/|早餐|What time is breakfast?|早餐是几点？`),
passage:"A shuttle takes us into Manhattan. At the hotel, I open the reservation on my phone while you ask to check in. The receptionist gives us a key card and explains that breakfast starts at seven. Upstairs, the room is quiet and the window looks out over a narrow street. I put my bag down and save you the comfortable chair. Tomorrow we can explore. Tonight, arriving is enough.",translation:'接驳车把我们带进曼哈顿。酒店里，我打开手机上的预订信息，你提出办理入住。前台给了我们房卡，告诉我们早餐七点开始。楼上的房间很安静，窗外是一条窄窄的街。我放下包，把舒服的椅子留给你。明天再探索吧，今晚，顺利抵达就够好了。',listening:question('酒店早餐几点开始？','七点',['六点','九点'],'前台说 breakfast starts at seven。'),reading:question('Why do we decide to explore tomorrow?','We want a quiet first evening.',['The hotel has no windows.','We lost the reservation.'],'抵达后的第一晚，你们选择休息，而不是赶行程。',1),message:"Would you help me with the first sentence at the desk? I'll keep the reservation ready.",messageZh:'你来帮我说前台的第一句话好吗？我把预订信息准备好。',reply:'Hello, we have a reservation. We would like to check in, please.',replyZh:'你好，我们有预订。我们想办理入住。'}]},
{id:'morning',day:2,title:'把早晨，走得慢一点',english:'Coffee first. The rest can wait.',place:'Café → Central Park',intro:"Morning. I found a little café around the corner. Let's get something warm, then let the city surprise us. No rushing today.",introZh:'早安。我发现街角有家小咖啡馆。喝点热的，再去看看这座城市今天会带来什么惊喜。不着急。',scenes:[
{title:'两杯咖啡的早晨',place:'Upper West Side · Café',image:'cafe',words:words(`menu|/ˈmenjuː/|菜单|May I see the menu?|可以看看菜单吗？
order|/ˈɔːrdər/|点餐；订单|Are you ready to order?|你准备好点餐了吗？
oat milk|/oʊt mɪlk/|燕麦奶|I'd like oat milk, please.|请给我加燕麦奶。
to go|/tə ɡoʊ/|打包；带走|Is that for here or to go?|在这里吃还是带走？
receipt|/rɪˈsiːt/|小票；收据|Could I have a receipt?|可以给我一张小票吗？`),passage:"The café smells like warm bread. I study the menu while you wait beside the counter. When it is our turn to order, I choose a small coffee with oat milk. You ask for two drinks to go and keep the receipt in your pocket. Outside, the cups warm our hands. I nearly take your drink by mistake, then laugh. We have been in New York for one morning and already have a tiny tradition.",translation:'咖啡馆里飘着热面包的香气。我研究菜单，你在柜台旁等着。轮到点餐时，我选了一小杯加燕麦奶的咖啡。你要了两杯打包，把小票收进口袋。走到外面，杯子暖着我们的手。我差点又拿错你的饮料，忍不住笑了。才在纽约过了一个早晨，我们好像已经有了小小的传统。',listening:question('你们在哪里喝这两杯饮料？','带到店外喝',['坐在店里喝','回机场再喝'],'to go 表示打包带走。',2),reading:question('What does Rosie put in her coffee?','Oat milk.',['Orange juice.','Ice cream.'],'她点的是 a small coffee with oat milk。'),message:"My coffee order is a little specific. Can you help me say it?",messageZh:'我的咖啡要求有点具体，你帮我说一下好吗？',reply:'Could I have a small coffee with oat milk to go, please?',replyZh:'请给我一小杯加燕麦奶的咖啡，打包带走。'},
{title:'在公园，收藏一小段安静',place:'Central Park · Morning',image:'park',words:words(`entrance|/ˈentrəns/|入口|Where is the park entrance?|公园入口在哪里？
path|/pæθ/|小路|Let's follow this path.|我们沿这条小路走吧。
bench|/bentʃ/|长椅|We can sit on that bench.|我们可以坐那张长椅。
lake|/leɪk/|湖|The lake is very quiet.|这片湖很安静。
photo|/ˈfoʊtoʊ/|照片|Could you take a photo of us?|可以帮我们拍张照吗？`),passage:"We find the entrance to Central Park just as the morning light reaches the trees. A winding path leads us toward a small lake. There is an empty bench near the water, so we stop and finish our coffee. A passing visitor offers to take a photo of us. I stand a little closer and try not to look awkward. The city is still around us, but for a minute it feels very far away.",translation:'晨光刚刚照到树梢，我们就找到了中央公园的入口。一条弯弯的小路带我们来到湖边。水边有张空长椅，我们停下来喝完咖啡。一位路过的游客主动提出帮我们拍照。我站得更近一点，努力让自己看起来不那么拘谨。城市依然在身边，但有那么一分钟，它好像很远。',listening:question('你们为什么在湖边停下来？','坐长椅喝完咖啡',['等待机场接驳车','找丢失的房卡'],'你们在水边的长椅坐下，喝完咖啡。',1),reading:question('Who offers to take the photo?','A passing visitor.',['The hotel receptionist.','A café worker.'],'文中说 a passing visitor offers to take a photo。',2),message:"I'd like to keep this little moment. Could you ask someone for a picture?",messageZh:'我想把这一刻留下来。你可以请人帮忙拍张照吗？',reply:'Excuse me, could you take a photo of us by the lake, please?',replyZh:'打扰一下，可以帮我们在湖边拍张照吗？'}]},
{id:'city',day:3,title:'一起读懂这座城市',english:'One stop at a time.',place:'Subway → The Met',intro:"I have a map, a slightly ambitious plan, and you. That feels like a pretty good start. Let's try the subway today.",introZh:'我有一张地图、一个稍微有点雄心的计划，还有你。这已经是很好的开始了。今天试试坐地铁吧。',scenes:[
{title:'下一站，有你就好',place:'Manhattan · Subway',image:'city',words:words(`subway|/ˈsʌbweɪ/|地铁|We can take the subway.|我们可以坐地铁。
platform|/ˈplætfɔːrm/|站台|Which platform do we need?|我们要去哪个站台？
uptown|/ˌʌpˈtaʊn/|往城区北部|Take the uptown train.|坐往城区北部的列车。
transfer|/trænsˈfɜːr/|换乘|Do we need to transfer?|我们需要换乘吗？
stop|/stɑːp/|车站；停靠站|We get off at the next stop.|我们下一站下车。`),passage:"The subway station is louder than I expected. We check the sign for an uptown train and walk down to the platform. I ask whether we need to transfer, but a helpful passenger tells us it is a direct ride. On the train, you count each stop quietly. I hold the map the wrong way around for a moment. When we finally get off, we are both smiling at our very small victory.",translation:'地铁站比我想象的更吵。我们确认往城区北部的列车标志，走下站台。我问需不需要换乘，一位热心乘客告诉我们可以直达。车上，你轻轻数着每一站，我还一度把地图拿反了。终于下车时，我们都在为这个小小的胜利偷偷开心。',listening:question('去目的地需要换乘吗？','不需要，列车直达',['需要换乘两次','必须改坐出租车'],'乘客说 it is a direct ride。'),reading:question('What makes the trip feel like a small victory?','We navigate the subway together.',['We find a lost passport.','We get free museum tickets.'],'你们一起辨认方向、数站并成功到达。',1),message:"Let's double-check before we get on. Would you ask that passenger?",messageZh:'上车前再确认一下吧。你问问那位乘客，好吗？',reply:'Excuse me, is this the uptown train, and do we need to transfer?',replyZh:'打扰一下，这是往城区北部的列车吗？我们需要换乘吗？'},
{title:'让一幅画，留住我们',place:'The Metropolitan Museum of Art',image:'museum',words:words(`admission|/ədˈmɪʃən/|入场；门票|Where can we buy admission tickets?|我们在哪里能买门票？
exhibition|/ˌeksɪˈbɪʃən/|展览|This exhibition looks interesting.|这个展览看起来很有趣。
audio guide|/ˈɔːdioʊ ɡaɪd/|语音导览|Is an audio guide available?|有语音导览吗？
gallery|/ˈɡæləri/|展厅；画廊|The gallery is on the second floor.|展厅在二楼。
painting|/ˈpeɪntɪŋ/|画作|This painting feels peaceful.|这幅画让人很平静。`),passage:"At the museum, we buy admission tickets and ask about the current exhibition. An audio guide is available, so we take one and head toward the gallery. I stop in front of a painting of a quiet room. You notice the small cup on the table before I do. We listen, look, and say very little for a while. Somehow, noticing the same tiny detail feels like another way of getting to know you.",translation:'博物馆里，我们买好门票，询问正在展出的内容。这里有语音导览，我们拿上一份，走向展厅。我在一幅安静房间的画前停下，你比我先发现桌上的小杯子。有一会儿，我们只是听着、看着，没有说太多。能一起注意到同一个小细节，好像也是另一种认识你的方式。',listening:question('你先注意到了画里的什么？','桌上的小杯子',['窗外的列车','门边的行李箱'],'你比Rosie更早注意到桌上的小杯子。',2),reading:question('Why do we take an audio guide?','To listen while exploring the exhibition.',['To book a hotel room.','To find the subway platform.'],'语音导览帮助你们边走边了解展览。'),message:"I want to hear the story behind this painting. Can you ask about the guide?",messageZh:'我想听听这幅画背后的故事。你问问导览好吗？',reply:'Hello, is there an English audio guide for this exhibition? We would like to hear about this painting.',replyZh:'你好，这个展览有英文语音导览吗？我们想听听这幅画的介绍。'}]},
{id:'neighborhood',day:4,title:'那些计划外的小地方',english:'The best turns are sometimes unplanned.',place:'Market → Brooklyn Bridge',intro:"Today, let's leave a little space in the plan. A market, a walk, maybe something we haven't thought of yet. I'm curious what we'll find.",introZh:'今天给计划留一点空白吧。逛个市集，走一走，也许还会发现没想到的东西。我有点期待。',scenes:[
{title:'在市集挑一份小惊喜',place:'Brooklyn · Market',image:'market',words:words(`market|/ˈmɑːrkɪt/|市集|The market opens at ten.|市集十点开门。
sample|/ˈsæmpəl/|试吃；样品|Could I try a sample?|我可以试吃一下吗？
fresh|/freʃ/|新鲜的|These strawberries are fresh.|这些草莓很新鲜。
price|/praɪs/|价格|What is the price of this bag?|这袋多少钱？
cash|/kæʃ/|现金|Do you accept cash?|你们收现金吗？`),passage:"The market is full of voices and bright little stalls. A seller offers us a sample of fresh strawberries. I taste one and immediately want more, which makes you laugh. We ask the price of a small bag and check whether we can pay in cash. A few minutes later, we are sharing the fruit on a sunny street corner. It is a tiny purchase, but it makes the whole morning feel like ours.",translation:'市集里到处是聊天声和明亮的小摊。一位摊主让我们试吃新鲜草莓。我尝了一颗就想再吃，惹得你笑起来。我们问了一小袋的价格，确认可以付现金。几分钟后，我们站在阳光下的街角分享这袋水果。只是小小的一笔消费，却让整个早晨都像属于我们。',listening:question('你们在市集试吃了什么？','新鲜草莓',['燕麦奶咖啡','一碗面条'],'摊主给你们试吃 fresh strawberries。',1),reading:question('What do we check before paying?','The price and whether cash is accepted.',['The subway schedule.','The hotel breakfast time.'],'你们先确认价格和能否用现金付款。',2),message:"These taste like a very good decision. Will you ask how much a little bag costs?",messageZh:'这些草莓说明我们来对了。你问问一小袋多少钱？',reply:'How much is a small bag, and can I pay in cash?',replyZh:'一小袋多少钱？我可以付现金吗？'},
{title:'桥上的风，刚刚好',place:'Brooklyn Bridge · Sunset',image:'bridge',words:words(`bridge|/brɪdʒ/|桥|We can walk across the bridge.|我们可以步行过桥。
pedestrian|/pəˈdestriən/|行人|This path is for pedestrians.|这条路供行人使用。
skyline|/ˈskaɪlaɪn/|城市天际线|The skyline looks beautiful.|城市天际线很美。
sunset|/ˈsʌnset/|日落|Let's stay until sunset.|我们待到日落吧。
breeze|/briːz/|微风|There is a cool breeze.|有一阵凉凉的微风。`),passage:"We reach the bridge just before sunset and find the pedestrian path. The skyline glows on the other side of the water. A cool breeze keeps lifting the corner of my map, so I finally put it away. We don't need it for this part. I ask whether you are in a hurry, already hoping the answer is no. We slow down and let the city change color around us.",translation:'日落前，我们来到桥边，找到了行人步道。对岸的城市天际线泛着光。凉凉的微风一直掀地图的边角，我索性把它收起来。这一段不需要地图。我问你赶不赶时间，心里已经偷偷希望答案是否。我们放慢脚步，让城市在身边一点点变色。',listening:question('Rosie希望你怎么回答她？','不赶时间，可以慢慢走',['必须立刻离开','想赶下一班飞机'],'她问你赶不赶时间，心里期待你说不。'),reading:question('Why does Rosie put the map away?','We can follow the bridge path without it.',['The map belongs to a stranger.','We are going back to the airport.'],'桥上的路很清楚，这一段不需要地图。',1),message:"The light is getting so lovely. Could we stay a little longer?",messageZh:'现在的光越来越好看了。我们能不能再待一小会儿？',reply:'Of course. We can take our time and watch the sunset together.',replyZh:'当然，我们可以慢慢来，一起看日落。'}]},
{id:'rainy-day',day:5,title:'下雨也没关系',english:'A change of plans. Still together.',place:'A rainy street → Pharmacy',intro:"Well, the weather has written us a different plan. That's okay. I've got an umbrella and a very flexible idea of a perfect day.",introZh:'看来天气给我们换了一份计划。没关系，我带了伞，而且对完美的一天，要求很灵活。',scenes:[
{title:'借一把伞，也借一点勇气',place:'Manhattan · Rainy afternoon',image:'rain',words:words(`umbrella|/ʌmˈbrelə/|雨伞|We can share this umbrella.|我们可以共撑这把伞。
direction|/dəˈrekʃən/|方向|Are we going in the right direction?|我们走的方向对吗？
block|/blɑːk/|街区|The café is two blocks away.|咖啡馆在两个街区外。
turn left|/tɜːrn left/|左转|Turn left at the next street.|到下一条街左转。
across from|/əˈkrɔːs frəm/|在……对面|It is across from the bank.|它在银行对面。`),passage:"Rain taps against our umbrella as we stop under a shop sign. I am not sure which direction the café is in, so we ask someone nearby. They tell us to walk two blocks, then turn left. The café is across from a bank. You repeat the directions slowly, and I nod as if I have understood everything perfectly. A minute later, I admit I only remembered the coffee part. Luckily, you were listening.",translation:'我们停在商店招牌下，雨轻轻敲着伞面。我不确定咖啡馆在哪个方向，于是我们问了附近的人。对方告诉我们走两个街区后左转，咖啡馆在银行对面。你慢慢重复了一遍，我假装完全听懂地点头。一分钟后，我承认自己只记住了咖啡。还好，你有认真听。',listening:question('到咖啡馆应该怎么走？','走两个街区后左转',['立刻右转再过桥','坐三站地铁'],'指路的人说 walk two blocks, then turn left。',2),reading:question('Where is the café?','Across from a bank.',['Inside the hotel.','Behind the museum.'],'咖啡馆在银行对面。'),message:"Before we get lost again, could you say the directions one more time?",messageZh:'在我们再次走丢之前，你再说一遍路线好吗？',reply:'Walk two blocks, turn left, and the café is across from the bank.',replyZh:'走两个街区，左转，咖啡馆就在银行对面。'},
{title:'今天，先照顾好自己',place:'Neighborhood · Pharmacy',image:'city',words:words(`pharmacy|/ˈfɑːrməsi/|药房|Is there a pharmacy nearby?|附近有药房吗？
headache|/ˈhedeɪk/|头痛|I have a mild headache.|我有点轻微头痛。
rest|/rest/|休息|You should get some rest.|你应该休息一下。
water|/ˈwɔːtər/|水|Let's drink some water.|我们喝点水吧。
nearby|/ˌnɪrˈbaɪ/|附近的；在附近|There is a quiet place nearby.|附近有个安静的地方。`),passage:"After walking all morning, I notice you have gone quiet. You mention a mild headache, so we look for a pharmacy nearby. A staff member suggests speaking with the pharmacist about suitable options. We also buy some water and find a calm place to rest. The afternoon plan can wait. I would rather sit beside you for a little while than rush through another list of places. Traveling well includes taking care of ourselves.",translation:'走了一上午后，我发现你安静下来。你说有点轻微头痛，于是我们找附近的药房。店员建议向药师咨询合适的选择。我们也买了水，找个安静地方休息。下午的计划可以等等。比起赶着打卡更多地方，我更愿意在你旁边坐一会儿。好好旅行，也包括照顾好自己。',listening:question('你们为什么改变下午的计划？','你有些头痛，需要休息',['药房正在办展览','你们错过了飞机'],'身体有些不舒服，所以先喝水休息。',1),reading:question('Who can advise about suitable pharmacy options?','The pharmacist.',['A subway passenger.','The café menu.'],'文中建议向药师咨询，而不是自行决定药物。',2),message:"No need to be brave about every little thing. Could you tell the staff how you're feeling?",messageZh:'不用每件小事都硬撑着。你跟店员说说现在的感受，好吗？',reply:'I have a mild headache. Could I speak with the pharmacist, please?',replyZh:'我有点轻微头痛，可以和药师聊聊吗？'}]},
{id:'evening',day:6,title:'今晚，多留一点期待',english:'A table for two. A night to keep.',place:'Dinner → Broadway',intro:"I booked us a little evening out. Nothing too fancy. Just good food, a show, and another reason to hear your voice.",introZh:'我给我们安排了一个小小的夜晚。不用很隆重，好吃的饭，一场演出，还有多听听你声音的理由。',scenes:[
{title:'两个人的晚餐',place:'Theater District · Restaurant',image:'dinner',words:words(`table for two|/ˈteɪbəl fər tuː/|双人桌|We'd like a table for two.|我们想要一张双人桌。
recommend|/ˌrekəˈmend/|推荐|What would you recommend?|你推荐什么？
allergy|/ˈælərdʒi/|过敏|Please tell us about any allergy.|如有过敏请告诉我们。
sauce|/sɔːs/|酱汁|Could I have the sauce on the side?|可以把酱汁单独放吗？
bill|/bɪl/|账单|Could we have the bill, please?|可以给我们账单吗？`),passage:"We ask for a table for two near the window. The server asks about any allergy before explaining the menu. I ask what they recommend, and you choose a simple dish with the sauce on the side. We share stories between bites and almost forget the time. When we ask for the bill, I glance at our show tickets. There is still enough time to walk slowly. A good evening does not need to feel hurried.",translation:'我们想要一张靠窗的双人桌。服务员先询问有无过敏，再介绍菜单。我问有什么推荐，你选了一道简单的菜，请对方把酱汁单独放。我们边吃边聊，差点忘记时间。要账单时，我看了眼演出票。还来得及慢慢走过去，美好的夜晚不需要赶路。',listening:question('你对菜品提出了什么要求？','酱汁单独放',['所有食物都打包','不要靠窗的位置'],'你点了 a simple dish with the sauce on the side。'),reading:question('Why do we check the tickets after dinner?','To make sure we have time for the show.',['To change our hotel room.','To find the park entrance.'],'查看票是为了确认演出时间，避免迟到。',1),message:"A window seat would be lovely. Want to ask for us?",messageZh:'窗边的位置会很棒，你替我们问问好吗？',reply:'Hello, could we have a table for two near the window, please?',replyZh:'你好，请问可以给我们安排一张靠窗的双人桌吗？'},
{title:'灯暗下来的那一刻',place:'Broadway · Theater',image:'theater',words:words(`ticket|/ˈtɪkɪt/|票|Here are our tickets.|这是我们的票。
seat|/siːt/|座位|Where is our seat?|我们的座位在哪里？
row|/roʊ/|排|We are in row eight.|我们在第八排。
intermission|/ˌɪntərˈmɪʃən/|中场休息|There is a short intermission.|有一段短暂的中场休息。
performance|/pərˈfɔːrməns/|演出|The performance starts soon.|演出马上开始。`),passage:"At the theater entrance, we show our tickets and ask an usher to help us find our seat. We are in row eight, close enough to see the warm lights above the stage. Before the performance begins, I lean over and whisper that I am glad we came together. During intermission, we compare our favorite moments. We do not understand every word, but we understand enough to laugh, listen, and feel part of the room.",translation:'剧院门口，我们出示票，请引座员帮忙找位置。座位在第八排，可以看见舞台上温暖的灯。演出开始前，我凑过来小声说，很高兴是和你一起来。中场休息时，我们交换各自最喜欢的片段。不必听懂每个词，已经足够让我们跟着笑、认真听，也成为这个夜晚的一部分。',listening:question('你们坐在哪一排？','第八排',['第二排','第十八排'],'旁白说 We are in row eight。',2),reading:question('Do we need to understand every word to enjoy the show?','No. We can still enjoy many moments.',['Yes. Otherwise we must leave.','No. We only read the bill.'],'不必每个词都懂，也能享受演出。'),message:"I can read the row number, but not quite find the seat. Can you ask the usher?",messageZh:'排号我看懂了，但还没找到位置。你帮忙问问引座员？',reply:'Excuse me, we are in row eight. Could you help us find our seats?',replyZh:'打扰一下，我们在第八排，可以帮我们找到座位吗？'}]},
{id:'homeward',day:7,title:'把这段旅程，带回日常',english:'Not the end. Something to take with us.',place:'A little shop → Departure',intro:"One last little adventure before we leave. I think we'll take more home than we packed. A few new words, some courage, and all these ordinary moments.",introZh:'离开前，再来最后一段小冒险吧。我们带回家的，可能比装进行李的更多：一些新词，一点勇气，还有这些普通却珍贵的时刻。',scenes:[
{title:'留一张，写给以后',place:'A neighborhood gift shop',image:'market',words:words(`souvenir|/ˌsuːvəˈnɪr/|纪念品|I'd like a small souvenir.|我想买个小纪念品。
postcard|/ˈpoʊstkɑːrd/|明信片|This postcard shows the bridge.|这张明信片上画着那座桥。
stamp|/stæmp/|邮票|Where can I buy a stamp?|哪里可以买邮票？
address|/əˈdres/|地址|Please write the address here.|请把地址写在这里。
keep|/kiːp/|保留；保存|I'll keep this little memory.|我会留住这个小回忆。`),passage:"In a small shop, I choose a postcard with a picture of the bridge. It is the kind of souvenir that fits inside a book. We ask where to buy a stamp, then sit down to write an address on the back. I add one short sentence about our favorite evening. You do not need to read it yet. We can keep a little surprise for later, when this trip has become a story we tell.",translation:'小店里，我选了一张画着那座桥的明信片。这种纪念品，小到可以夹进一本书。我们问哪里能买邮票，然后坐下来在背面写地址。我加了一句关于最喜欢的那个夜晚的话。你现在先不用看，留一点惊喜给以后吧，等这趟旅行变成我们会讲起的故事。',listening:question('Rosie选了什么纪念品？','一张画着桥的明信片',['一张地铁线路图','一大箱咖啡杯'],'她选择了 a postcard with a picture of the bridge。',1),reading:question('Why does Rosie ask you not to read the sentence yet?','To keep a little surprise for later.',['Because the address is wrong.','Because the shop is closed.'],'她想留一点惊喜给以后。',2),message:"I found the perfect little postcard. Could you ask about a stamp?",messageZh:'我找到刚刚好的小明信片了，你帮我问问邮票？',reply:'Hello, where can I buy a stamp for this postcard, please?',replyZh:'你好，请问哪里可以买到寄这张明信片的邮票？'},
{title:'下一次，也一起出发',place:'JFK · Departure',image:'airport',words:words(`departure|/dɪˈpɑːrtʃər/|出发；离境|Check the departure board.|看一下出发信息屏。
boarding pass|/ˈbɔːrdɪŋ pæs/|登机牌|Here is my boarding pass.|这是我的登机牌。
gate|/ɡeɪt/|登机口|Which gate do we need?|我们要去哪个登机口？
delay|/dɪˈleɪ/|延误|There is a short delay.|有一点延误。
boarding|/ˈbɔːrdɪŋ/|登机|Boarding begins at four.|四点开始登机。`),passage:"We check the departure board and take out each boarding pass. There is a short delay, so we have time to find our gate without rushing. While we wait for boarding, I ask which moment you would keep if you could only choose one. You think for a while. I like that you do not answer immediately. A week ago, we were practicing how to arrive. Now we have a whole little journey to carry home together.",translation:'我们看过出发信息屏，拿出各自的登机牌。航班有一点延误，所以可以不慌不忙地找到登机口。等着登机时，我问你，如果只能留下一个瞬间，你会选哪个。你想了好一会儿。我喜欢你没有立刻回答。一周前，我们还在练习如何抵达，现在已经有了一整段小小的旅程，可以一起带回家。',listening:question('你们为什么不用急着赶到登机口？','航班有一点延误',['航班已经取消','登机口就在酒店里'],'There is a short delay，所以有时间慢慢找登机口。'),reading:question('What has changed since we arrived?','We have shared a whole journey and learned together.',['We have forgotten all the new words.','We no longer need boarding passes.'],'从练习抵达，到一起拥有整段旅程，你们也在一起成长。',1),message:"Before we go, will you ask when boarding starts? Then tell me which little moment you're taking home.",messageZh:'出发前，你问问几点登机好吗？然后告诉我，你想把哪个小瞬间带回家。',reply:'Excuse me, when does boarding begin for this flight?',replyZh:'打扰一下，请问这趟航班什么时候开始登机？'}]}
];
export type LearningStep={kind:'intro';scene:number}|{kind:'word'|'quiz';scene:number;word:number}|{kind:'listen'|'read'|'speak';scene:number};
export function lessonSteps(lesson:Lesson):LearningStep[]{return [{kind:'intro',scene:0},...lesson.scenes.flatMap((s,scene):LearningStep[]=>[...Array.from({length:Math.ceil(s.words.length/5)},(_,batch)=>{const indices=s.words.slice(batch*5,batch*5+5).map((_,i)=>batch*5+i);return [...indices.map((word):LearningStep=>({kind:'word',scene,word})),...indices.map((word):LearningStep=>({kind:'quiz',scene,word}))];}).flat(),{kind:'listen',scene},{kind:'read',scene},{kind:'speak',scene}])];}
export function wordQuestion(scene:Scene,index:number):Question{
 const word=scene.words[index],options=scene.words.filter((_,i)=>i!==index).slice(0,2).map(w=>w.zh),answer=(index+1)%3;options.splice(answer,0,word.zh);
 return {prompt:word.en,options,answer,explanation:word.zh};
}
export const phaseNames={intro:'出发',word:'单词',quiz:'单词挑战',listen:'听力',read:'阅读',speak:'开口'};
const extraWords:Record<string,string[]>={
arrival:[`officer|/ˈɔːfɪsər/|工作人员；官员|The officer asks a question.|工作人员问了一个问题。
explain|/ɪkˈspleɪn/|解释|We explain our travel plans.|我们解释旅行计划。
conversation|/ˌkɑːnvərˈseɪʃən/|交谈|It is a short conversation.|这是一段简短的交谈。
collect|/kəˈlekt/|领取；收集|We need to collect our bags.|我们需要领取行李。
suitcase|/ˈsuːtkeɪs/|行李箱|That blue suitcase is mine.|那个蓝色行李箱是我的。`,`receptionist|/rɪˈsepʃənɪst/|前台接待员|The receptionist is very helpful.|前台接待员很热心。
comfortable|/ˈkʌmftərbəl/|舒适的|This chair is comfortable.|这张椅子很舒服。
explore|/ɪkˈsplɔːr/|探索；游览|We can explore the city tomorrow.|我们明天可以游览城市。
narrow|/ˈnæroʊ/|狭窄的|The hotel is on a narrow street.|酒店在一条窄街上。
upstairs|/ˌʌpˈsterz/|在楼上；往楼上|Our room is upstairs.|我们的房间在楼上。`],
morning:[`counter|/ˈkaʊntər/|柜台|Please order at the counter.|请在柜台点餐。
by mistake|/baɪ mɪˈsteɪk/|误拿；无意中|I took your cup by mistake.|我不小心拿了你的杯子。
tradition|/trəˈdɪʃən/|传统；惯例|This is our little tradition.|这是我们的小传统。
nearly|/ˈnɪrli/|差点；几乎|I nearly forgot the receipt.|我差点忘了小票。
beside|/bɪˈsaɪd/|在旁边|I'll wait beside the counter.|我会在柜台旁边等。`,`winding|/ˈwaɪndɪŋ/|蜿蜒的|We follow a winding path.|我们沿着一条弯弯的小路走。
visitor|/ˈvɪzɪtər/|游客；访客|A visitor helps us.|一位游客帮助了我们。
offer|/ˈɔːfər/|主动提出|She offers to take a photo.|她主动提出帮忙拍照。
awkward|/ˈɔːkwərd/|拘谨的；尴尬的|I feel a little awkward.|我觉得有一点拘谨。
far away|/fɑːr əˈweɪ/|遥远的；远处|The city feels far away.|城市仿佛变得很遥远。`],
city:[`direct|/dəˈrekt/|直达的；直接的|Is this a direct train?|这是直达列车吗？
passenger|/ˈpæsɪndʒər/|乘客|A passenger gives us directions.|一位乘客为我们指路。
expect|/ɪkˈspekt/|预期；想到|It is louder than I expected.|这里比我想象的更吵。
quietly|/ˈkwaɪətli/|轻声地；安静地|We talk quietly on the train.|我们在列车上轻声交谈。
victory|/ˈvɪktəri/|胜利；成功|This is a small victory.|这是个小小的胜利。`,`current|/ˈkɜːrənt/|当前的|What is the current exhibition?|目前有什么展览？
available|/əˈveɪləbəl/|可获得的；可用的|Are audio guides available?|有语音导览吗？
notice|/ˈnoʊtɪs/|留意到|Did you notice that cup?|你注意到那个杯子了吗？
detail|/ˈdiːteɪl/|细节|I like this tiny detail.|我喜欢这个小细节。
somehow|/ˈsʌmhaʊ/|不知怎么地|Somehow, it feels familiar.|不知怎么地，感觉很熟悉。`],
neighborhood:[`stall|/stɔːl/|摊位|Let's look at this stall.|我们看看这个摊位吧。
seller|/ˈselər/|卖家；摊主|The seller offers a sample.|摊主提供了一份试吃。
purchase|/ˈpɜːrtʃəs/|购买的东西；购买|It is a small purchase.|只是一笔小消费。
share|/ʃer/|分享|We can share this fruit.|我们可以分享这份水果。
street corner|/striːt ˈkɔːrnər/|街角|I'll meet you at the street corner.|我在街角等你。`,`glow|/ɡloʊ/|泛光；发亮|The city glows at sunset.|城市在日落时泛着光。
lift|/lɪft/|掀起；抬起|The breeze lifts the map.|微风掀起地图。
corner|/ˈkɔːrnər/|角；角落|Hold the corner of the map.|拿住地图的一角。
put away|/pʊt əˈweɪ/|收起来|You can put the map away.|你可以把地图收起来。
in a hurry|/ɪn ə ˈhɜːri/|赶时间；着急|Are you in a hurry?|你赶时间吗？`],
'rainy-day':[`tap|/tæp/|轻拍；轻敲|Rain taps against the window.|雨轻轻敲着窗。
sign|/saɪn/|标志；招牌|Let's stop under that sign.|我们到那个招牌下停一下。
repeat|/rɪˈpiːt/|重复|Could you repeat that, please?|可以请你再说一遍吗？
nod|/nɑːd/|点头|She nods and smiles.|她点了点头，笑了。
admit|/ədˈmɪt/|承认|I admit I am a little lost.|我承认有一点迷路。`,`pharmacist|/ˈfɑːrməsɪst/|药师|I'd like to speak to the pharmacist.|我想向药师咨询。
mild|/maɪld/|轻微的；温和的|It is a mild headache.|只是轻微头痛。
suitable|/ˈsuːtəbəl/|合适的|What options are suitable for me?|什么选择适合我？
suggest|/səˈdʒest/|建议|What would you suggest?|你有什么建议？
calm|/kɑːm/|平静的；安静的|Let's find a calm place.|找个安静的地方吧。`],
evening:[`server|/ˈsɜːrvər/|餐厅服务员|We ask the server for water.|我们请服务员拿些水。
dish|/dɪʃ/|菜肴|This dish looks lovely.|这道菜看起来很棒。
on the side|/ɑːn ðə saɪd/|单独放在一旁|The sauce is on the side.|酱汁单独放在一旁。
glance|/ɡlæns/|瞥一眼|I glance at the time.|我看了一眼时间。
hurried|/ˈhɜːrid/|匆忙的|We don't want a hurried dinner.|我们不想匆匆忙忙地吃晚饭。`,`usher|/ˈʌʃər/|引座员|The usher helps us find our seats.|引座员帮我们找座位。
stage|/steɪdʒ/|舞台|The stage lights are warm.|舞台灯光很温暖。
whisper|/ˈwɪspər/|小声说；耳语|She whispers before the show.|开演前她小声说了句话。
compare|/kəmˈper/|比较；交流看法|We compare our favorite moments.|我们交流最喜欢的片段。
understand|/ˌʌndərˈstænd/|理解；听懂|I understand the main idea.|我理解了大意。`],
homeward:[`choose|/tʃuːz/|选择|Which postcard will you choose?|你会选哪张明信片？
fit|/fɪt/|放得下；适合|It fits inside a book.|它可以夹在书里。
add|/æd/|添加|I'll add a little note.|我要加一句小留言。
sentence|/ˈsentəns/|句子|Write one short sentence.|写一句简短的话。
surprise|/sərˈpraɪz/|惊喜|Let's keep a little surprise.|留一点小惊喜吧。`,`immediately|/ɪˈmiːdiətli/|立即；马上|You don't need to answer immediately.|你不用马上回答。
while|/waɪl/|在……期间|We can talk while we wait.|我们可以边等边聊。
carry|/ˈkæri/|携带；带着|We carry these memories home.|我们把这些回忆带回家。
practice|/ˈpræktɪs/|练习|We can practice together.|我们可以一起练习。
whole|/hoʊl/|整个的；完整的|We have a whole week of memories.|我们有整整一周的回忆。`]
};
const sceneComments:Record<string,[string,string][]>= {
arrival:[["Okay, deep breath. We're really here. I'll stay right beside you.",'好，深呼吸。我们真的到这里了，我就在你旁边。'],["I saved you the window seat. We can let the city wait until morning.",'我把窗边的位置留给你。城市可以等到明天早上再逛。']],
morning:[["I nearly took your coffee again. Maybe this is becoming our thing.",'我差点又拿错你的咖啡。也许这快成为我们的小习惯了。'],["This is my favorite kind of plan. A little sunlight, and no hurry.",'这是我最喜欢的计划：一点阳光，不用着急。']],
city:[["We made it onto the right train. I'm counting that as a tiny victory.",'我们上对了车！这绝对算个小胜利。'],["That little cup in the painting reminds me of our first coffee here.",'画里的小杯子，让我想起了我们在这里的第一杯咖啡。']],
neighborhood:[["One more strawberry? I promise this is important travel research.",'再来一颗草莓？我保证这是重要的旅行研究。'],["Let's put the map away. This part of the evening doesn't need a plan.",'把地图收起来吧。接下来的夜晚，不需要计划。']],
'rainy-day':[["You can have the dry side of the umbrella. I'll try to remember the directions.",'伞下干燥的一边给你。我来努力记路线。'],["The afternoon can wait. I'd rather know you're feeling comfortable.",'下午的计划可以等等。我更在意你现在舒不舒服。']],
evening:[["A table by the window, good food, and you. That's a pretty lovely evening.",'窗边的桌子、好吃的饭，还有你。这个夜晚已经很棒了。'],["I'm glad we came together. Tell me your favorite part when the lights come back on.",'真高兴是和你一起来。等灯亮起来，告诉我你最喜欢的片段。']],
homeward:[["I wrote one little sentence for later. No peeking yet, okay?",'我给以后留了一句小小的话。先不许偷看，好不好？'],["We arrived with a plan, and now we're leaving with a story.",'来时我们带着计划，现在我们带着故事离开。']]
};
for(const lesson of lessons)lesson.scenes.forEach((scene,index)=>{
 scene.words.push(...words(extraWords[lesson.id][index]));
 scene.dialogue=[{en:sceneComments[lesson.id][index][0],zh:sceneComments[lesson.id][index][1]},{en:scene.message,zh:scene.messageZh}];
});
export function materialBlocks(scene:Scene){return [{kind:'narration',en:scene.passage,zh:scene.translation},...(scene.dialogue||[]).map(line=>({kind:'rosie',...line}))];}
export function materialText(scene:Scene){return materialBlocks(scene).map(b=>b.en).join('\n\n');}

// Extra questions refer only to details present in the shared, prewritten audio.
const listeningDetails:Record<string,[string,string,string[],string][]>={
 airport:[['你们接下来要取什么？','行李',['咖啡','演出票'],'交谈后，你们跟随标志去取行李。'],['Rosie会在哪里？','在你身边',['在酒店等你','先坐飞机离开'],'她说 I’ll stay right beside you。']],
 hotel:[['谁打开了手机上的预订？','Rosie',['前台工作人员','出租车司机'],'旁白中的 I 指 Rosie。'],['Rosie把什么留给了你？','舒服的椅子',['最后一张机票','博物馆门票'],'她说 save you the comfortable chair。']],
 cafe:[['Rosie的咖啡里加了什么？','燕麦奶',['橙汁','冰淇淋'],'她点了 a small coffee with oat milk。'],['你把小票放在哪里？','口袋里',['柜台上','行李箱里'],'旁白说 keep the receipt in your pocket。']],
 park:[['谁提出帮你们拍照？','路过的游客',['酒店前台','咖啡店员'],'A passing visitor offers to take a photo。'],['小路把你们带到了哪里？','一片小湖旁',['地铁站','机场入口'],'小路 leads us toward a small lake。']],
 subway:[['你们要坐哪个方向的列车？','往城区北部',['去机场','往城区南部'],'你们寻找 an uptown train。'],['谁一度把地图拿反了？','Rosie',['热心乘客','司机'],'旁白说 I hold the map the wrong way around。']],
 museum:[['你们拿了什么来帮助参观？','语音导览',['酒店房卡','地铁线路图'],'An audio guide is available。'],['画里描绘的是什么？','安静的房间',['热闹的机场','日落时的大桥'],'她停在 a painting of a quiet room 前。']],
 market:[['你们询问了什么支付方式？','现金',['分期付款','旅行支票'],'你们确认是否 can pay in cash。'],['最后在哪里分享水果？','阳光下的街角',['酒店前台','飞机上'],'你们在 a sunny street corner 分享水果。']],
 bridge:[['你们什么时候到桥边？','日落前',['清晨天亮前','午夜之后'],'We reach the bridge just before sunset。'],['Rosie为什么收起地图？','这一段不需要地图',['地图丢了','马上要去机场'],'她说 We don’t need it for this part。']],
 rain:[['雨点落在什么上面？','雨伞',['登机牌','博物馆门票'],'开头描写雨点敲打雨伞。'],['咖啡馆在什么对面？','银行',['机场','药房'],'指路的人说 the café is across from a bank。']],
 rest:[['你有什么不舒服？','轻微头痛',['扭伤了脚','严重牙痛'],'角色建议你把 mild headache 告诉药师。'],['Rosie更想做什么？','陪你坐着休息',['继续赶景点','马上去买纪念品'],'她说更愿意在你身边坐一会儿。']],
 dinner:[['你们想坐在哪里？','靠窗的双人桌',['吧台旁的单人位','餐厅门外'],'你们要 a table for two near the window。'],['服务员先问了什么？','是否有过敏',['航班几点起飞','住在哪个酒店'],'The server asks about any allergy。']],
 theater:[['谁帮你们找座位？','引座员',['机场工作人员','药师'],'你们 ask an usher to help us find our seat。'],['你们什么时候交流喜欢的片段？','中场休息时',['登机时','早餐时'],'During intermission, we compare our favorite moments。']],
 postcard:[['明信片上画着什么？','那座桥',['飞机','一杯咖啡'],'她选择 a postcard with a picture of the bridge。'],['你们问哪里可以买什么？','邮票',['地铁卡','早餐券'],'你们 ask where to buy a stamp。']],
 departure:[['你们拿出了什么？','各自的登机牌',['酒店房卡','演出票'],'你们 take out each boarding pass。'],['等候时Rosie问了什么？','最想留下哪个瞬间',['早餐几点开始','博物馆在哪里'],'她问 which moment you would keep。']]
};
export function sceneKey(scene:Scene){const index=lessons.flatMap(l=>l.scenes).indexOf(scene);return ['airport','hotel','cafe','park','subway','museum','market','bridge','rain','rest','dinner','theater','postcard','departure'][index]||scene.image;}
export function listeningQuestions(scene:Scene):Question[]{return [scene.listening,...(listeningDetails[sceneKey(scene)]||[]).map(([prompt,correct,wrong,explanation],i)=>question(prompt,correct,wrong,explanation,(i+1)%3))];}
