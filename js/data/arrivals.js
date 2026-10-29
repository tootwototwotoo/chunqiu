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
