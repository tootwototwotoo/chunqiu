// 流动事件：史载轨迹人物抵达新城市时触发
//
// 与 TIMELINE 事件同构（id/title/body/choices），但按「人物 + 年份」触发：
// 每条 ARRIVAL 一年只发一次，与玩家所在城无关（天下事，如同 timeline 的新闻）；
// 但若玩家恰在同一城，选项多一条「登门拜访」收益（结识此人）。
//
// verdict（据《史记》《左传》的一句话）用于事件正文。

export const ARRIVALS = [
  // ---------------- 孔子 ----------------
  { npc: 'kong_zi', year: -497, city: 'diqiu',
    title: '孔子适卫',
    body: '孔子去鲁，适卫。灵公问陈于孔子，孔子曰：「俎豆之事，则尝闻之矣；军旅之事，未之学也。」明日遂行。',
    choices: [
      { label: '叹其不遇', effects: [{ t: 'fame', v: 2 }], text: '你感叹圣人无处施其志。' },
      { label: '录其言以自省', effects: [{ t: 'skillxp', k: 'xuewen', v: 30 }], text: '你把孔子的话记了下来，反复体味。' },
    ] },
  { npc: 'kong_zi', year: -492, city: 'wanqiu',
    title: '孔子在陈',
    body: '孔子自卫如陈。陈侯问以故国之事，夫子对答如流，然终不见用。',
    choices: [
      { label: '求见论学', effects: [{ t: 'skillxp', k: 'biancai', v: 20 }], text: '你在陈都求见了夫子，受益良多。' },
      { label: '叹而离去', effects: [], text: '圣人尚且困于陈蔡之间，何况常人。' },
    ] },
  { npc: 'kong_zi', year: -484, city: 'qufu',
    title: '孔子归鲁',
    body: '季康子以币迎孔子，孔子归鲁。然鲁终不能用，孔子亦不求仕。乃删《诗》《书》，定礼乐。',
    choices: [
      { label: '执贽求教', effects: [{ t: 'skillxp', k: 'xuewen', v: 40 }], text: '夫子晚年讲学，你有幸列于门墙。' },
      { label: '叹其道不行', effects: [{ t: 'fame', v: 3 }], text: '你感叹圣人之道终于鲁而不行于天下。' },
    ] },

  // ---------------- 伍子胥 ----------------
  { npc: 'wu_zixu', year: -522, city: 'shangqiu',
    title: '伍员亡楚',
    body: '伍员亡楚，先走宋、继奔郑。太子建适宋，华氏之乱起，诸大夫皆惧。',
    choices: [
      { label: '闻其志', effects: [{ t: 'fame', v: 2 }], text: '你听说了伍员过昭关一夜白头之事，心为之动。' },
      { label: '不闻不问', effects: [], text: '亡人之臣，避之则吉。' },
    ] },
  { npc: 'wu_zixu', year: -518, city: 'gusu',
    title: '伍员事吴',
    body: '伍员至于吴，公子光纳之。员荐专诸于光，退耕于野以待时。',
    choices: [
      { label: '往投其门', effects: [{ t: 'fame', v: 3 }], text: '你投于伍员门下，他对你颇为赏识。' },
      { label: '但闻其名', effects: [{ t: 'fame', v: 1 }], text: '伍员之名，渐闻于诸侯。' },
    ] },

  // ---------------- 范蠡 ----------------
  { npc: 'fan_li', year: -473, city: 'tao',
    title: '范蠡去越',
    body: '范蠡浮海出齐，变姓名为鸱夷子皮。居于陶，为朱公。十九年之中三致千金，再分散与贫交疏昆弟。',
    choices: [
      { label: '执弟子礼求教', effects: [{ t: 'skillxp', k: 'shanggu', v: 40 }], text: '你从陶朱公学治生之术，深有所得。' },
      { label: '慕其名而往观', effects: [{ t: 'fame', v: 3 }], text: '你专程到陶地一睹朱公风范。' },
    ] },

  // ---------------- 孙武 ----------------
  { npc: 'sun_wu', year: -512, city: 'gusu',
    title: '孙子见吴王',
    body: '孙武以兵法见于吴王阖闾。阖闾曰：「子之十三篇，吾尽观之矣。」宫女试兵，斩二姬，遂以为将。',
    choices: [
      { label: '拜读兵法', effects: [{ t: 'skillxp', k: 'bingfa', v: 30 }], text: '你购得《孙子》十三篇抄本，日夜研读。' },
      { label: '闻其斩姬事', effects: [{ t: 'fame', v: 2 }], text: '军法如山，自此吴人知之。' },
    ] },

  // ---------------- 百里奚 ----------------
  { npc: 'bai_li_xi', year: -655, city: 'yong',
    title: '五羖大夫',
    body: '秦穆公以五羖羊皮赎百里奚于楚，授之国政。奚年七十余，谋无不当，举必有功。',
    choices: [
      { label: '往观其政', effects: [{ t: 'skillxp', k: 'quanmou', v: 30 }], text: '你在雍地考察秦政，见五羖大夫施政有序。' },
      { label: '叹其遇', effects: [{ t: 'fame', v: 2 }], text: '七十岁遇明主，亦未为晚。' },
    ] },

  // ---------------- 季札 ----------------
  { npc: 'wu_ji_zha', year: -544, city: 'qufu',
    title: '季札聘鲁',
    body: '吴公子季札聘于鲁，请观周乐。使工为之歌《周南》《召南》，札曰：「美哉！始基之矣。」',
    choices: [
      { label: '与观周乐', effects: [{ t: 'skillxp', k: 'xuewen', v: 30 }], text: '你有幸与季札同观周乐，知乐可以知政。' },
      { label: '闻其让国', effects: [{ t: 'fame', v: 3 }], text: '季札让国之义，传遍诸侯。' },
    ] },
  { npc: 'wu_ji_zha', year: -541, city: 'jiang',
    title: '季札聘晋',
    body: '季札适晋，说赵文子、韩宣子、魏献子曰：「晋国其萃于三族乎！」悦叔向，将行，谓叔向曰：「吾子好直，必思自免于难。」',
    choices: [
      { label: '记其预言', effects: [{ t: 'skillxp', k: 'quanmou', v: 25 }], text: '「三家分晋」之谶，你记在了心里。' },
      { label: '与叔向同论', effects: [{ t: 'fame', v: 2 }], text: '你与叔向论及晋之将来，各有所忧。' },
    ] },

  // ---------------- 先轸、狐偃 ----------------
  { npc: 'xian_zhen', year: -636, city: 'jiang',
    title: '重耳返晋',
    body: '重耳返晋，是为文公。从亡者狐偃、赵衰、先轸辈皆居要职。文公修政，施惠百姓。',
    choices: [
      { label: '往观新政', effects: [{ t: 'fame', v: 2 }], text: '晋国新政井然，诸侯侧目。' },
      { label: '投于麾下', effects: [{ t: 'merit', v: 5 }], text: '你入晋军效力，与先轸相识。' },
    ] },

  // ---------------- 墨子 ----------------
  { npc: 'mo_zi', year: -440, city: 'ying',
    title: '墨子止楚攻宋',
    body: '墨子闻楚将攻宋，自鲁往，裂裳裹足，十日十夜至郢。见公输般，九攻九距之，楚王乃止。',
    choices: [
      { label: '助其守御', effects: [{ t: 'skillxp', k: 'bingfa', v: 30 }], text: '你在郢都见过墨者的守城之器，叹为观止。' },
      { label: '录其言', effects: [{ t: 'fame', v: 3 }], text: '「非攻」之说，由你传于一方。' },
    ] },

  // ---------------- 扁鹊 ----------------
  { npc: 'bian_que', year: -400, city: 'ji',
    title: '扁鹊至赵',
    body: '扁鹊至赵，为带下医。过雒阳，为耳目痹医；入咸阳，为小儿医。随俗为变，名闻天下。',
    choices: [
      { label: '求诊', effects: [{ t: 'health', v: 30 }], text: '扁鹊为你诊脉，沉疴顿去。' },
      { label: '求教医道', effects: [{ t: 'skillxp', k: 'xuewen', v: 25 }], text: '「随俗为变」四字，你记了很久。' },
    ] },

  // ---------------- 公输般 ----------------
  { npc: 'gongshu_ban', year: -445, city: 'ying',
    title: '公输般为楚',
    body: '公输般自鲁至楚，为楚造云梯之械成，将以攻宋。',
    choices: [
      { label: '观其器械', effects: [{ t: 'skillxp', k: 'sheshu', v: 20 }], text: '云梯钩援之巧，你开了眼界。' },
      { label: '忧宋之祸', effects: [{ t: 'fame', v: 2 }], text: '你忧心宋国将罹兵祸，先做了防备。' },
    ] },

  // ---------------- 子路 ----------------
  { npc: 'zi_lu', year: -497, city: 'diqiu',
    title: '子路仕卫',
    body: '子路随孔子适卫，为卫大夫孔悝之邑宰。后蒲邑治水，孔子过之，三称其善。',
    choices: [
      { label: '与之论政', effects: [{ t: 'skillxp', k: 'zhengzhi', v: 0 }], text: '子路言政直而切，你深受触动。' },
      { label: '结其勇', effects: [{ t: 'rel', k: 'zi_lu', v: 10 }], text: '你与子路结为好友。' },
    ] },

  // ---------------- 子贡 ----------------
  { npc: 'zi_gong', year: -488, city: 'tao',
    title: '子贡货殖',
    body: '子贡废著鬻财于曹鲁之间，废举贮鬻。与时转货赀，家累千金。夫所至之处，国君无不分庭与之抗礼。',
    choices: [
      { label: '与之论市', effects: [{ t: 'skillxp', k: 'shanggu', v: 35 }], text: '「贵出如粪土，贱取如珠玉」，你受教了。' },
      { label: '结其谊', effects: [{ t: 'rel', k: 'zi_gong', v: 10 }], text: '你与子贡结交，往来于曹鲁之间。' },
    ] },

  // ---------------- 晏婴 ----------------
  { npc: 'yan_ying', year: -539, city: 'jiang',
    title: '晏婴聘晋',
    body: '晏婴聘于晋，叔向问齐政。婴曰：「此季世也，吾弗知。齐其为陈氏矣！民归之如流水，公弃其民而归于陈氏。」',
    choices: [
      { label: '记其言', effects: [{ t: 'skillxp', k: 'quanmou', v: 30 }], text: '「齐政卒归田氏」之谶，你深记于心。' },
      { label: '与论礼', effects: [{ t: 'fame', v: 3 }], text: '你与晏婴论礼政，受益良多。' },
    ] },

  // ---------------- 宁戚 ----------------
  { npc: 'ning_qi', year: -685, city: 'linzi',
    title: '宁戚饭牛',
    body: '宁戚卫人，饭牛车下，击牛角而疾商歌。桓公闻之曰：「异哉，非常人也！」举以为大夫。',
    choices: [
      { label: '闻其歌', effects: [{ t: 'fame', v: 2 }], text: '「南山灿，白石烂」，歌辞传开。' },
      { label: '与其结交', effects: [{ t: 'rel', k: 'ning_qi', v: 10 }], text: '你与宁戚结为朋友。' },
    ] },

  // ---------------- 弦高 ----------------
  { npc: 'xian_gao', year: -627, city: 'luoyi',
    title: '弦高犒师',
    body: '秦师袭郑，道周北门。郑商人弦高遇之，以乘韦先牛十二犒师曰：「寡君闻吾子将步师出于敝邑，敢犒从者。」秦师以为有备，遂灭滑而还。',
    choices: [
      { label: '赞其智', effects: [{ t: 'fame', v: 3 }], text: '商人救国，传为美谈。' },
      { label: '学其术', effects: [{ t: 'skillxp', k: 'shanggu', v: 20 }], text: '矫命犒师而退秦兵，你深味其中的胆识。' },
    ] },

  // ---------------- 孟明视 ----------------
  { npc: 'qin_meng_ming', year: -625, city: 'jiang',
    title: '孟明伐晋',
    body: '秦伯伐晋，济河焚舟，取王官及郊。晋人不出。封殽尸而还。遂霸西戎。',
    choices: [
      { label: '闻其事', effects: [{ t: 'fame', v: 2 }], text: '败而不馁，济河焚舟——秦伯以此立威。' },
      { label: '录其战法', effects: [{ t: 'skillxp', k: 'bingfa', v: 20 }], text: '「济河焚舟」的破釜之志，你记下了。' },
    ] },

  // ---------------- 邹衍 ----------------
  { npc: 'zou_yan', year: -290, city: 'ji',
    title: '邹衍至燕',
    body: '邹衍适燕，昭王拥彗先驱，请列弟子之座而受业。筑碣石宫，身亲往师之。',
    choices: [
      { label: '列座受业', effects: [{ t: 'skillxp', k: 'xuewen', v: 35 }], text: '你入碣石宫听邹衍讲五德终始。' },
      { label: '叹王之礼贤', effects: [{ t: 'fame', v: 2 }], text: '拥彗先驱——燕昭王礼贤下士至此。' },
    ] },

  // ---------------- 剧辛 ----------------
  { npc: 'ju_xin', year: -310, city: 'ji',
    title: '剧辛入燕',
    body: '燕昭王卑身厚币以招贤者，剧辛自赵往，与乐毅、邹衍俱见重于燕。',
    choices: [
      { label: '同往投燕', effects: [{ t: 'fame', v: 3 }], text: '你也随贤者之流入燕。' },
      { label: '闻其贤', effects: [{ t: 'fame', v: 1 }], text: '剧辛之名，渐播于诸侯。' },
    ] },

  // ---------------- 惠施 ----------------
  { npc: 'hui_shi', year: -350, city: 'jiang',
    title: '惠施相魏',
    body: '惠施多方，其书五车。为魏惠王立法，倡导「合同异」之说。庄子尝谓：「以惠子之言为大观。」',
    choices: [
      { label: '与之辩', effects: [{ t: 'skillxp', k: 'biancai', v: 35 }], text: '你与惠施辩「大一小一」，辞穷而思开。' },
      { label: '录其历物', effects: [{ t: 'skillxp', k: 'xuewen', v: 25 }], text: '「历物十事」，你抄录一份。' },
    ] },

  // ---------------- 子思 ----------------
  { npc: 'zi_si', year: -457, city: 'shangqiu',
    title: '子思适宋',
    body: '子思居卫，尝适宋。宋大夫乐朔与之言学，不悦，围子思。子思曰：「文王拘于羑里，作《周易》；吾于宋，亦将有所述。」',
    choices: [
      { label: '往受教', effects: [{ t: 'skillxp', k: 'xuewen', v: 30 }], text: '你向孔伋求教，得闻中庸之旨。' },
      { label: '闻其困而著书', effects: [{ t: 'fame', v: 2 }], text: '圣贤困厄而有所述，你深受激励。' },
    ] },

  // ---------------- 叔向 ----------------
  { npc: 'shu_xiang', year: -538, city: 'luoyi',
    title: '叔向聘周',
    body: '晋籍谈如周葬穆后，叔向责之：「数典而忘其祖。」又谓韩宣子：「政在家门，民无所依。」',
    choices: [
      { label: '闻其论', effects: [{ t: 'skillxp', k: 'biancai', v: 25 }], text: '「数典忘祖」之讥，你记下了。' },
      { label: '与之论礼', effects: [{ t: 'fame', v: 2 }], text: '你与叔向论礼乐，他称你有识。' },
    ] },

  // ---------------- 子产 ----------------
  { npc: 'zi_chan', year: -542, city: 'jiang',
    title: '子产相郑伯如晋',
    body: '子产相郑伯如晋，晋侯以鲁丧未之见。子产尽坏其馆之垣而纳车马焉。文伯复命，赵文子曰：「信，晋国之上卿也。」',
    choices: [
      { label: '闻其辞令', effects: [{ t: 'skillxp', k: 'biancai', v: 30 }], text: '「坏馆垣」之争，辞令之典范。' },
      { label: '叹其贤', effects: [{ t: 'fame', v: 3 }], text: '古之遗爱也——孔子后来如此评子产。' },
    ] },

  // ---------------- 司马穰苴 ----------------
  { npc: 'si_ma_rang_ju', year: -530, city: 'jiang',
    title: '穰苴将兵',
    body: '晏婴荐穰苴于景公：「文能附众，武能威敌。」公以为将军，将兵扞燕晋之师。斩监军庄贾，晋燕之师闻之，皆罢兵。',
    choices: [
      { label: '观其治军', effects: [{ t: 'skillxp', k: 'bingfa', v: 25 }], text: '「将在军，君命有所不受」，你亲见其行。' },
      { label: '闻其名', effects: [{ t: 'fame', v: 2 }], text: '不战而屈人之兵——穰苴做到了。' },
    ] },

  // ---------------- 养由基 ----------------
  { npc: 'yang_youji', year: -575, city: 'jiang',
    title: '养由基随军',
    body: '晋楚战于鄢陵。吕锜射楚共王中目。王召养由基，与之两矢，使射吕锜。中项，伏弢。以一矢复命。',
    choices: [
      { label: '观其射', effects: [{ t: 'skillxp', k: 'sheshu', v: 30 }], text: '「百步穿杨」，你亲眼见了。' },
      { label: '录其事', effects: [{ t: 'fame', v: 2 }], text: '一矢复命——养叔之名如日中天。' },
    ] },
];

// ---------------- 补遗（第二批：剩余轨迹节点） ----------------
ARRIVALS.push(
  { npc: 'kong_zi', year: -489, city: 'shangcai',
    title: '孔子在蔡',
    body: '孔子自陈适蔡。陈蔡大夫相与发徒役围孔子于野，不得行，绝粮。从者病，莫能兴。孔子讲诵弦歌不衰。',
    choices: [
      { label: '馈以粟粮', effects: [{ t: 'fame', v: 3 }], text: '你在绝粮之时送去粟米，夫子谢而不受其名。' },
      { label: '闻弦歌之声', effects: [{ t: 'skillxp', k: 'xuewen', v: 30 }], text: '困厄之中弦歌不辍——你记住了这一课。' },
    ] },
  { npc: 'wu_zixu', year: -521, city: 'xinzheng',
    title: '伍员过郑',
    body: '伍员自宋奔郑。太子建适郑，郑人善之。建又适晋，与晋谋袭郑，郑人知之，乃杀建。员惧，携建子胜奔吴。',
    choices: [
      { label: '闻其险途', effects: [{ t: 'skillxp', k: 'quanmou', v: 20 }], text: '避祸如避火——伍员的路线本身就是一部求生之书。' },
      { label: '不闻不问', effects: [], text: '亡人之行，不可与闻。' },
    ] },
  { npc: 'wen_zhong', year: -496, city: 'kuaiji',
    title: '文种入越',
    body: '文种自楚入越，与范蠡同佐勾践。种曰：「贾人夏则资皮，冬则资絺，旱则资舟，水则资车，以待乏也。」',
    choices: [
      { label: '录其言', effects: [{ t: 'skillxp', k: 'shanggu', v: 25 }], text: '「旱则资舟」四字，你记下了。' },
      { label: '与其结交', effects: [{ t: 'rel', k: 'wen_zhong', v: 10 }], text: '你与文种相识于越。' },
    ] },
  { npc: 'bo_pi', year: -506, city: 'gusu',
    title: '伯嚭奔吴',
    body: '楚郤宛之难，伯州犁之孙嚭出奔吴。吴王以为大夫。后为太宰，与伍员同朝而异志。',
    choices: [
      { label: '观其为人', effects: [{ t: 'skillxp', k: 'quanmou', v: 15 }], text: '被离谓子胥：「嚭为人鹰视而狼顾，不可亲也。」' },
      { label: '与之往来', effects: [{ t: 'rel', k: 'bo_pi', v: 8 }], text: '你与太宰嚭有了往来。' },
    ] },
  { npc: 'yue_ji_ni', year: -496, city: 'kuaiji',
    title: '计倪佐越',
    body: '计倪自晋入越。勾践问策，倪曰：「知斗则修备，时用则知物。二者形，则万货之情可得而观已。」',
    choices: [
      { label: '求教计然之术', effects: [{ t: 'skillxp', k: 'shanggu', v: 30 }], text: '「万货之情可得而观」，你入迷了。' },
      { label: '录其策', effects: [{ t: 'skillxp', k: 'suanshu', v: 20 }], text: '计然七策，你抄录了数条。' },
    ] },
  { npc: 'you_yu', year: -626, city: 'yong',
    title: '由余入秦',
    body: '由余自戎使秦。穆公示以宫室积聚，由余曰：「使鬼为之，则劳神矣；使人为之，亦苦民矣。」穆公患其贤，用内史廖之谋，以女乐间之，由余遂降。',
    choices: [
      { label: '与论治道', effects: [{ t: 'skillxp', k: 'quanmou', v: 25 }], text: '「苦民矣」三字，你回味良久。' },
      { label: '观秦之谋', effects: [{ t: 'fame', v: 2 }], text: '一队女乐胜过千军——你见识了秦国的手段。' },
    ] },
  { npc: 'shen_bao_xu', year: -506, city: 'yong',
    title: '申包胥哭秦庭',
    body: '吴师入郢。申包胥如秦乞师，立依于庭墙而哭，日夜不绝声，勺饮不入口，七日。秦哀公为之赋《无衣》，遂出师。',
    choices: [
      { label: '助其哭庭', effects: [{ t: 'fame', v: 5 }], text: '你陪他立了三日，理解了什么叫「必存之」。' },
      { label: '录其事', effects: [{ t: 'skillxp', k: 'biancai', v: 25 }], text: '七日之哭换一国之师——你记下这则外交奇局。' },
    ] },
  { npc: 'shen_bao_xu', year: -505, city: 'ying',
    title: '申包胥归楚',
    body: '秦师救楚，吴师败退。申包胥返郢。昭王赏之，包胥曰：「吾为君也，非为身也。」遂逃赏。',
    choices: [
      { label: '叹其义', effects: [{ t: 'fame', v: 4 }], text: '哭庭求师，功成逃赏——你以此自勉。' },
      { label: '与之论国', effects: [{ t: 'skillxp', k: 'quanmou', v: 20 }], text: '你与申包胥论复国之道。' },
    ] },
  { npc: 'mo_zi', year: -435, city: 'qufu',
    title: '墨子归鲁',
    body: '墨子止楚攻宋后归鲁。弟子问：「胜楚何以为功？」墨子曰：「善为守者，不知攻者之巧也。宋之社稷可保，而吾道行矣。」',
    choices: [
      { label: '入其门', effects: [{ t: 'skillxp', k: 'bingfa', v: 25 }], text: '你随墨者习守御之法。' },
      { label: '闻其道', effects: [{ t: 'fame', v: 2 }], text: '兼爱与非攻，你听了整日。' },
    ] },
  { npc: 'jin_luan_shu2', year: -597, city: 'ying',
    title: '荀罃囚楚',
    body: '邲之战，荀罃为楚所俘。郑贾人将出之，罃曰：「吾不信也。」贾人如晋，罃实归之。',
    choices: [
      { label: '闻其守', effects: [{ t: 'fame', v: 2 }], text: '被俘而不失其节，你深以为敬。' },
      { label: '记其事', effects: [{ t: 'skillxp', k: 'quanmou', v: 15 }], text: '郑贾人之谋与荀罃之拒，皆是一课。' },
    ] },
  { npc: 'jin_luan_shu2', year: -588, city: 'jiang',
    title: '荀罃归晋',
    body: '晋归楚俘，楚亦归荀罃。罃归而佐晋，后为中军元帅，修甲兵，通好戎狄，晋悼公复霸，罃之力也。',
    choices: [
      { label: '拜见', effects: [{ t: 'rel', k: 'jin_luan_shu2', v: 10 }], text: '你拜见荀罃，相谈甚欢。' },
      { label: '录其谋', effects: [{ t: 'skillxp', k: 'bingfa', v: 20 }], text: '「三驾疲楚」之策，你听他亲述。' },
    ] },
  { npc: 'yi_he', year: -541, city: 'jiang',
    title: '医和视晋平公疾',
    body: '晋平公病。秦伯使医和视之，曰：「疾不可为也。是谓近女室，疾如蛊。非鬼非食，惑以丧志。」',
    choices: [
      { label: '求诊', effects: [{ t: 'health', v: 25 }], text: '医和顺带为你诊了脉。' },
      { label: '闻「六气」', effects: [{ t: 'skillxp', k: 'xuewen', v: 25 }], text: '「阴淫寒疾，阳淫热疾」，你录下了六气之说。' },
    ] },
  { npc: 'yi_huan', year: -581, city: 'jiang',
    title: '医缓视晋景公疾',
    body: '晋景公梦疾为二竖子。秦伯使医缓为之。二竖子曰：「彼良医也，惧伤我，焉逃之？」其一曰：「居肓之上、膏之下，若我何？」',
    choices: [
      { label: '观其诊', effects: [{ t: 'skillxp', k: 'xuewen', v: 20 }], text: '「病入膏肓」之典，你亲见其事。' },
      { label: '求方', effects: [{ t: 'health', v: 20 }], text: '医缓为你开了一剂汤药。' },
    ] },
  { npc: 'bian_que', year: -370, city: 'luoyi',
    title: '扁鹊过雒阳',
    body: '扁鹊过雒阳，闻周人爱老人，即为耳目痹医。随俗为变，名闻天下。',
    choices: [
      { label: '求诊', effects: [{ t: 'health', v: 30 }], text: '扁鹊诊你耳目之疾，手到病除。' },
      { label: '观其术', effects: [{ t: 'skillxp', k: 'xuewen', v: 20 }], text: '「随俗为变」——你观其行医如观政。' },
    ] },
  { npc: 'bian_que', year: -340, city: 'yong',
    title: '扁鹊入秦',
    body: '扁鹊入咸阳，为小儿医。秦太医令李醯自知伎不如，使人刺杀之。',
    choices: [
      { label: '叹其亡', effects: [{ t: 'fame', v: 3 }], text: '技高而见妒——扁鹊之死你叹了很久。' },
      { label: '求其遗方', effects: [{ t: 'skillxp', k: 'xuewen', v: 25 }], text: '你重金购得扁鹊遗方数卷。' },
    ] },
  { npc: 'zi_lu', year: -480, city: 'diqiu',
    title: '子路治蒲',
    body: '子路为蒲大夫，孔子过之，入其境曰：「善哉！由恭敬以信矣。」入其邑曰：「善哉！由忠信以宽矣。」',
    choices: [
      { label: '观其政', effects: [{ t: 'skillxp', k: 'quanmou', v: 20 }], text: '「恭敬以信、忠信以宽」，你亲见子路治绩。' },
      { label: '劝其慎', effects: [{ t: 'rel', k: 'zi_lu', v: 12 }], text: '你劝子路避卫国内乱，他笑而不答。' },
    ] },
  { npc: 'wei_sun_liang', year: -589, city: 'jiang',
    title: '孙良夫乞师',
    body: '卫侯使孙良夫如晋乞师。新筑之败，良夫仲叔于奚救之。良夫与臧宣叔如晋，晋师为之出。',
    choices: [
      { label: '闻其谋', effects: [{ t: 'skillxp', k: 'quanmou', v: 15 }], text: '败军之将如何借力复国，你学了一课。' },
      { label: '随军观战', effects: [{ t: 'skillxp', k: 'bingfa', v: 20 }], text: '你随晋师观鞍之战。' },
    ] },
  { npc: 'cai_sheng_zi', year: -562, city: 'jiang',
    title: '蔡声子聘晋',
    body: '蔡声子聘于晋。归楚后谓令尹子木曰：「楚多淫刑，其大夫逃死于四方，而资之以谋楚。」遂进「楚材晋用」之论。',
    choices: [
      { label: '记其论', effects: [{ t: 'skillxp', k: 'quanmou', v: 25 }], text: '「楚材晋用」——四字千钧。' },
      { label: '与之论刑', effects: [{ t: 'skillxp', k: 'biancai', v: 20 }], text: '你与声子论楚国刑罚之失。' },
    ] },
  { npc: 'yu_zi', year: -700, city: 'luoyi',
    title: '鬻子佐周',
    body: '鬻熊年九十见文王。文王曰：「老矣。」对曰：「使臣捕兽逐麋则老矣，使臣坐策国事尚少。」遂为文王师。',
    choices: [
      { label: '执弟子礼', effects: [{ t: 'skillxp', k: 'xuewen', v: 30 }], text: '你从鬻子学政论，深知「老而可用」。' },
      { label: '叹其辩', effects: [{ t: 'fame', v: 2 }], text: '九十岁的策士——你记下了这个先例。' },
    ] },
  { npc: 'wu_ji_zha', year: -543, city: 'linzi',
    title: '季札聘齐',
    body: '季札适齐，说晏平仲曰：「子速纳邑与政。无邑无政，乃免于难。齐国之政，将有所归；未得所归，难未歇也。」',
    choices: [
      { label: '记其言', effects: [{ t: 'skillxp', k: 'quanmou', v: 25 }], text: '晏婴因此免于栾高之难——季札的眼光你见识了。' },
      { label: '与观齐政', effects: [{ t: 'fame', v: 2 }], text: '你在临淄与季札同论齐政。' },
    ] },
  { npc: 'wu_ji_zha', year: -542, city: 'xinzheng',
    title: '季札聘郑',
    body: '季札适郑，见子产，如旧相识。与之缟带，子产献纻衣焉。谓子产曰：「郑之执政侈，难将至矣，政必及子。子为政，慎之以礼。」',
    choices: [
      { label: '闻「慎之以礼」', effects: [{ t: 'skillxp', k: 'xuewen', v: 25 }], text: '缟带纻衣之交，你亲见其礼。' },
      { label: '与同游', effects: [{ t: 'rel', k: 'wu_ji_zha', v: 10 }], text: '你随季札游于郑市。' },
    ] },
  { npc: 'wu_ji_zha', year: -538, city: 'gusu',
    title: '季札归吴',
    body: '季札遍聘上国而归。徐君已死，于是解其宝剑，系于徐君冢树而去。从者曰：「徐君已死，尚谁予乎？」季子曰：「不然。始吾心已许之，岂以死倍吾心哉！」',
    choices: [
      { label: '观挂剑', effects: [{ t: 'fame', v: 4 }], text: '「始吾心已许之」——你亲眼见了季札挂剑。' },
      { label: '录其事', effects: [{ t: 'skillxp', k: 'xuewen', v: 25 }], text: '心诺重于千金——你把这则故事讲给很多人听。' },
    ] },
  { npc: 'xian_gao', year: -626, city: 'xinzheng',
    title: '弦高归郑',
    body: '秦师既退，郑穆公以存国之赏赏弦高。弦高辞曰：「诈而得赏，则郑国之政废矣。」遂徙其商队而东。',
    choices: [
      { label: '闻其辞赏', effects: [{ t: 'fame', v: 3 }], text: '「诈而得赏则政废」——商人风骨，你记下了。' },
      { label: '与之同商', effects: [{ t: 'skillxp', k: 'shanggu', v: 20 }], text: '你与弦高的商队同行了一段。' },
    ] },
  { npc: 'lu_cao_mo', year: -681, city: 'linzi',
    title: '曹沫劫盟',
    body: '鲁庄公与齐桓公会于柯。曹沫执匕首劫桓公，桓公左右莫敢动。管仲曰：「君何反其侵地？」桓公许之。',
    choices: [
      { label: '观其勇', effects: [{ t: 'skillxp', k: 'jianshu', v: 25 }], text: '劫盟于万军之中——你见了曹沫的胆。' },
      { label: '记其事', effects: [{ t: 'fame', v: 3 }], text: '一剑而复三败之地，你记下这则奇闻。' },
    ] },
  { npc: 'qu_wan', year: -656, city: 'tao',
    title: '屈完使齐',
    body: '齐侯陈诸侯之师，与屈完乘而观之。齐侯曰：「以此众战，谁能御之？」屈完对曰：「君若以德绥诸侯，谁敢不服？」',
    choices: [
      { label: '闻其辞令', effects: [{ t: 'skillxp', k: 'biancai', v: 30 }], text: '「方城为城，汉水为池」，你记下了这段外交辞令。' },
      { label: '随观会盟', effects: [{ t: 'fame', v: 2 }], text: '召陵之盟，你在现场。' },
    ] },
  { npc: 'wu_ju', year: -552, city: 'xinzheng',
    title: '伍举奔郑',
    body: '椒举将奔晋。声子遇之于郑郊，班荆相与食，而言复故。',
    choices: [
      { label: '闻「班荆道故」', effects: [{ t: 'fame', v: 3 }], text: '班荆道故——这个典故你亲见了。' },
      { label: '闻其怨', effects: [{ t: 'skillxp', k: 'quanmou', v: 15 }], text: '楚国的内耗，你从伍举的抱怨里听得分明。' },
    ] },
  { npc: 'shen_shu_shi', year: -598, city: 'linzi',
    title: '申叔时使齐',
    body: '申叔时使于齐，反，复命而退。楚子使让之曰：「夏徵舒弑其君，诸侯县陈，尔独不庆。」对曰：「牵牛以蹊人之田，而夺之牛。蹊者有罪矣，而夺之牛，罚已重矣。」',
    choices: [
      { label: '闻「蹊田夺牛」', effects: [{ t: 'skillxp', k: 'biancai', v: 25 }], text: '这个比喻的分量，你当场掂量了。' },
      { label: '与之论义', effects: [{ t: 'fame', v: 2 }], text: '讨罪而不贪地，义之所在。' },
    ] },
  { npc: 'chen_yuan_tao', year: -656, city: 'shangqiu',
    title: '辕涛涂谋齐',
    body: '齐侯还师，将道陈郑之间。辕涛涂谓郑申侯曰：「师出于陈郑之间，国必甚病。若出于东方，观兵于东夷，循海而归，可也。」',
    choices: [
      { label: '记其谋', effects: [{ t: 'skillxp', k: 'quanmou', v: 20 }], text: '小国在大国夹缝中的自保术，你见识了。' },
      { label: '叹其反受其祸', effects: [{ t: 'fame', v: 1 }], text: '涛涂终以此得罪于齐——谋身者反自谋。' },
    ] },
  { npc: 'cao_xi_fu', year: -637, city: 'jiang',
    title: '重耳过曹',
    body: '晋公子重耳过曹，曹共公闻其骈胁，欲观其裸。僖负羁之妻曰：「晋公子从者皆足以相国。」负羁乃馈盘飧，置璧焉。公子受飧反璧。',
    choices: [
      { label: '闻「受飧反璧」', effects: [{ t: 'skillxp', k: 'quanmou', v: 20 }], text: '识人于落难之时——僖负羁之妻的眼光，你叹服。' },
      { label: '闻其祸', effects: [{ t: 'fame', v: 2 }], text: '曹共公因无礼而致国灭，你记下这个教训。' },
    ] },
  { npc: 'xian_zhen', year: -655, city: 'diqiu',
    title: '重耳奔狄',
    body: '骊姬之乱，重耳奔狄，从者狐偃、赵衰、颠颉、魏武子、司空季子。居狄十二年。',
    choices: [
      { label: '随行观士', effects: [{ t: 'skillxp', k: 'quanmou', v: 20 }], text: '流亡队伍里全是将相之才——你识得了。' },
      { label: '录其居狄', effects: [{ t: 'fame', v: 2 }], text: '「居狄十二年」，一段传奇的开头。' },
    ] },
  { npc: 'hu_yan', year: -636, city: 'jiang',
    title: '狐偃归晋',
    body: '重耳返晋即位。至河，子犯以璧授公子曰：「臣负羁绁从君巡于天下，罪甚多矣。」公子曰：「所不与舅氏同心者，有如白水！」投其璧于河。',
    choices: [
      { label: '观河盟', effects: [{ t: 'fame', v: 3 }], text: '「有如白水」——你亲见投璧之誓。' },
      { label: '与之论政', effects: [{ t: 'skillxp', k: 'quanmou', v: 25 }], text: '狐偃论晋政，字字切要。' },
    ] },
  { npc: 'yue_zhu_ji', year: -494, city: 'gusu',
    title: '诸稽郢使吴',
    body: '吴师入越，勾践使诸稽郢行成于吴。郢曰：「句践请盟，愿春秋朝聘，委质为臣。」吴王许之。伍员谏曰：「不可！吴越邻邦，此天以越赐吴。」吴王弗听。',
    choices: [
      { label: '观其辞令', effects: [{ t: 'skillxp', k: 'biancai', v: 25 }], text: '「请为前马」之辞，卑而不可犯。' },
      { label: '闻伍员之谏', effects: [{ t: 'skillxp', k: 'quanmou', v: 20 }], text: '「不可」二字，伍员说了，没人听。' },
    ] },
  { npc: 'chunyu_kun', year: -350, city: 'jiang',
    title: '淳于髡使诸侯',
    body: '淳于髡数使诸侯，未尝屈辱。齐王赐之金，髡曰：「臣饮一斗亦醉，一石亦醉。酒极则乱，乐极则悲。」',
    choices: [
      { label: '与共饮', effects: [{ t: 'stamina', v: 30 }], text: '与髡同醉，乐极而知其谏。' },
      { label: '闻其讽', effects: [{ t: 'skillxp', k: 'biancai', v: 30 }], text: '「一鸣惊人」之后的又一场滑稽谏——你在场。' },
    ] },
  { npc: 'zi_si', year: -455, city: 'diqiu',
    title: '子思归卫',
    body: '子思自宋归卫。卫侯言计非是，而群臣和者如出一口。子思曰：「君出言自以为是，而卿大夫莫敢矫其非。君臣既自贤矣，而群下同声贤之。」',
    choices: [
      { label: '闻其论', effects: [{ t: 'skillxp', k: 'quanmou', v: 25 }], text: '「自以为是而群下同声」——你记下这句判词。' },
      { label: '执弟子礼', effects: [{ t: 'skillxp', k: 'xuewen', v: 25 }], text: '你从子思学中庸之道。' },
    ] },
  { npc: 'shu_xiang', year: -537, city: 'jiang',
    title: '叔向论季世',
    body: '叔向谓韩宣子曰：「虽吾公室，今亦季世也。戎马不驾，卿无军行，公乘无人，卒列无长。庶民罢敝，而宫室滋侈。」',
    choices: [
      { label: '记其论', effects: [{ t: 'skillxp', k: 'quanmou', v: 25 }], text: '「公室之季世」，你抄录了这段话。' },
      { label: '与之同忧', effects: [{ t: 'rel', k: 'shu_xiang', v: 10 }], text: '你与叔向论晋之将乱，相谈至夜。' },
    ] },
  { npc: 'zi_chan', year: -536, city: 'jiang',
    title: '子产再聘晋',
    body: '子产再如晋。赵景子问政。子产曰：「君子长国家者，非无贿之患，而无令名之难。」',
    choices: [
      { label: '闻「令名」之论', effects: [{ t: 'skillxp', k: 'biancai', v: 25 }], text: '「无令名之难」——子产论名实之要。' },
      { label: '闻其刑书', effects: [{ t: 'skillxp', k: 'xuewen', v: 20 }], text: '你向子产问起铸刑书之事。' },
    ] },
  { npc: 'zi_chan', year: -522, city: 'xinzheng',
    title: '子产卒',
    body: '子产卒，仲尼闻之，出涕曰：「古之遗爱也。」郑人皆哭泣，悲之如亡亲戚。',
    choices: [
      { label: '往吊', effects: [{ t: 'fame', v: 4 }], text: '你赴郑吊唁，见郑人哭之如亲。' },
      { label: '录其政', effects: [{ t: 'skillxp', k: 'quanmou', v: 30 }], text: '你整理子产为政之迹，成一篇传述。' },
    ] },
  { npc: 'ji_wen_zi', year: -610, city: 'jiang',
    title: '季文子如晋',
    body: '季文子相宣成，无衣帛之妾，无食粟之马。仲孙它谏之，文子曰：「吾观国人，其父兄之食粗而衣恶者犹多矣。吾是以不敢。」',
    choices: [
      { label: '闻其俭', effects: [{ t: 'fame', v: 3 }], text: '「妾不衣帛，马不食粟」，你亲见其居。' },
      { label: '与之论俭', effects: [{ t: 'rel', k: 'ji_wen_zi', v: 10 }], text: '你与季文子论「独居荣华」之辩。' },
    ] },
  { npc: 'zang_wen_zhong', year: -629, city: 'jiang',
    title: '臧文仲如晋',
    body: '臧文仲如晋，与韩宣子论「居官者当事不避难，在位者恤民之患」。其言录于鲁史。',
    choices: [
      { label: '闻其言', effects: [{ t: 'skillxp', k: 'quanmou', v: 20 }], text: '「当事不避难」，你记下这句官箴。' },
      { label: '与之论礼', effects: [{ t: 'rel', k: 'zang_wen_zhong', v: 10 }], text: '你与臧文仲论祭祀与民本。' },
    ] },
);

