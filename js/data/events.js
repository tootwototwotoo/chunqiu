// 历史时间线与随机事件
// 时间线选择：{label, hint, req:{profession?, state?, skill?}, check:{k, dc}, success:[], fail:[], text}
// 效果：{t:'money'|'fame'|'merit'|'stat'|'skill'|'rel'|'power'|'owner'|'flag'|'stamina'|'health'|'card', ...}

export const TIMELINE = [
  { id: 'ke_duan', year: -722, month: 5, title: '郑伯克段于鄢', where: { state: 'zheng' },
    body: '郑庄公之弟共叔段据京邑为乱，庄公命子封帅车二百乘伐京。京人叛段，段出奔共。',
    effects: [{ t: 'power', s: 'zheng', v: 4 }],
    choices: [
      { label: '往观郑师军容', hint: '武艺或兵法可有所得', check: { k: 'bingfa', dc: 34 },
        success: [{ t: 'skill', k: 'bingfa', v: 1 }, { t: 'fame', v: 2 }], fail: [{ t: 'fame', v: 1 }],
        text: '你混在人群里看郑军列阵，戈矛如林，鼓声不乱，颇有所悟。' },
      { label: '闭门不出', hint: '不涉是非', effects: [], text: '乱起于萧墙，你只作不知。' },
    ] },

  { id: 'zhou_huan', year: -720, month: 3, title: '周平王崩', where: { state: 'zhou' },
    body: '周平王崩于洛邑，孙林即位，是为桓王。王室益微，诸侯朝聘渐疏。',
    effects: [{ t: 'power', s: 'zhou', v: -3 }],
    choices: [
      { label: '赴洛邑观礼', hint: '结交王畿士人', effects: [{ t: 'fame', v: 3 }, { t: 'money', v: -20 }], text: '你随众人在王城之外观礼，见鼎彝陈列，礼容肃穆，心生感慨。' },
      { label: '不往', hint: '', effects: [], text: '天子之丧，于你不过一则传闻。' },
    ] },

  { id: 'lu_yin_si', year: -712, month: 11, title: '鲁隐公遇弑', where: { state: 'lu' },
    body: '公子翚谮于隐公，求为太宰，不许，遂弑隐公于蒍氏，立桓公。鲁国自此多事。',
    effects: [{ t: 'power', s: 'lu', v: -4 }],
    choices: [
      { label: '暗中查访此事', hint: '权谋之试', check: { k: 'quanmou', dc: 46 },
        success: [{ t: 'fame', v: 4 }, { t: 'skill', k: 'quanmou', v: 1 }], fail: [{ t: 'health', v: -4 }],
        text: '你在市井间探得蛛丝马迹，却也因此触了忌讳。' },
      { label: '不论国事', hint: '', effects: [], text: '鲁国之乱，非布衣所能置喙。' },
    ] },

  { id: 'xu_ge', year: -707, month: 8, title: '繻葛之战', where: { state: 'zheng' },
    body: '周桓王夺郑伯政，郑不朝。王以诸侯伐郑，战于繻葛。郑祝聃射王中肩，王师败绩。',
    effects: [{ t: 'power', s: 'zhou', v: -6 }, { t: 'power', s: 'zheng', v: 5 }],
    choices: [
      { label: '从郑军观战', hint: '箭术与胆气', check: { k: 'sheshu', dc: 44 },
        success: [{ t: 'fame', v: 5 }, { t: 'merit', v: 10 }, { t: 'skill', k: 'sheshu', v: 1 }], fail: [{ t: 'health', v: -8 }],
        text: '你随郑军左拒，见王师中军动摇，一箭之机，终身难忘。' },
      { label: '避于乡野', hint: '', effects: [{ t: 'health', v: 2 }], text: '兵锋之下，你避入乡野，听远处鼓声渐息。' },
    ] },

  { id: 'qi_huan_li', year: -685, month: 1, title: '齐桓公即位', where: { state: 'qi' },
    body: '公孙无知被杀，公子小白自莒先入齐，是为桓公。桓公不计射钩之仇，用鲍叔牙之荐，相管仲。',
    effects: [{ t: 'power', s: 'qi', v: 6 }, { t: 'flag', k: 'guan_zhong_相齐', v: true }],
    choices: [
      { label: '赴临淄求见管仲', hint: '需在齐地，或有晋身之阶', effects: [{ t: 'rel', id: 'guan_zhong', v: 10 }, { t: 'fame', v: 2 }],
        text: '你于相府门外候了半日，管仲乘车而出，瞥你一眼，命从者记下你的名字。' },
      { label: '观望齐国之变', hint: '', effects: [], text: '齐国内乱方定，你且看这新君如何行事。' },
    ] },

  { id: 'changshao', year: -684, month: 6, title: '长勺之战', where: { state: 'lu' },
    body: '齐师伐鲁，鲁庄公御之。曹刿请见，与公同乘，待齐人三鼓而后进，齐师败绩。',
    effects: [{ t: 'power', s: 'lu', v: 4 }, { t: 'power', s: 'qi', v: -3 }],
    choices: [
      { label: '随鲁军听曹刿论战', hint: '兵法之试', check: { k: 'bingfa', dc: 40 },
        success: [{ t: 'skill', k: 'bingfa', v: 1 }, { t: 'fame', v: 3 }, { t: 'rel', id: 'cao_gui', v: 8 }], fail: [{ t: 'fame', v: 1 }],
        text: '曹刿按剑立于车右，曰「未可」，你屏息听着鼓声，第一次明白「气」字的分量。' },
      { label: '远远避兵', hint: '', effects: [{ t: 'stamina', v: -3 }], text: '你避兵于山阜，看齐师车辙乱、旗靡，方知鲁人胜了。' },
    ] },

  { id: 'beixing', year: -681, month: 4, title: '北杏之会', where: { state: 'qi' },
    body: '齐桓公会宋、陈、蔡、邾于北杏，以平宋乱。诸侯始服齐，管仲之谋也。',
    effects: [{ t: 'power', s: 'qi', v: 4 }],
    choices: [
      { label: '携礼往会', hint: '花费三十金，或得声名', effects: [{ t: 'money', v: -30 }, { t: 'fame', v: 5 }, { t: 'rel', id: 'bao_shuya', v: 6 }],
        text: '会盟之坛上，诸侯歃血为盟。你立于末席，看见齐侯的旌旗在风里招展。' },
      { label: '不入会是非', hint: '', effects: [], text: '诸侯会盟，与你一个布衣何干。' },
    ] },

  { id: 'qi_ba', year: -679, month: 3, title: '齐桓公始霸', where: { state: 'qi' },
    body: '齐桓公会诸侯于鄄，宋、陈、卫、郑皆至。齐遂为诸侯长，天下翕然宗之。',
    effects: [{ t: 'power', s: 'qi', v: 5 }, { t: 'flag', k: 'hegemon', v: 'qi' }],
    choices: [
      { label: '献书于齐侯', hint: '学问或辩才', check: { k: 'xuewen', dc: 40 },
        success: [{ t: 'fame', v: 6 }, { t: 'rel', id: 'qi_huan', v: 8 }], fail: [{ t: 'fame', v: 1 }],
        text: '你陈说「尊王攘夷」之义，齐侯抚掌，命人将你的书简收于府中。' },
      { label: '不往', hint: '', effects: [], text: '霸主之名，起于会盟。' },
    ] },

  { id: 'shanrong', year: -664, month: 5, title: '齐救燕', where: { state: 'yan' },
    body: '山戎伐燕，燕告急于齐。齐桓公救燕，遂伐山戎，至于孤竹而还。燕君送齐侯出境，齐侯割燕君所至之地与燕。',
    effects: [{ t: 'power', s: 'yan', v: 3 }, { t: 'power', s: 'qi', v: 2 }],
    choices: [
      { label: '从齐师北伐山戎', hint: '武艺与胆略', check: { k: 'sheshu', dc: 46 },
        success: [{ t: 'fame', v: 5 }, { t: 'merit', v: 12 }, { t: 'skill', k: 'sheshu', v: 1 }], fail: [{ t: 'health', v: -10 }, { t: 'fame', v: 1 }],
        text: '北地苦寒，你随齐师穿过山谷，冻裂的手指终于拉开了一次弓。' },
      { label: '送燕侯一程', hint: '', effects: [{ t: 'rel', id: 'yan_zhuang', v: 8 }, { t: 'fame', v: 2 }], text: '燕侯的车驾向北而去，你立于道旁，听他说「燕人不忘齐侯之德」。' },
    ] },

  { id: 'zhaoling', year: -656, month: 7, title: '召陵之盟', where: { state: 'chu' },
    body: '齐桓公率诸侯伐楚，责包茅不入。楚使屈完如师，齐侯陈诸侯之师与之观，屈完曰：「君若以德绥诸侯，谁敢不服？」遂盟于召陵。',
    effects: [{ t: 'power', s: 'qi', v: 4 }, { t: 'power', s: 'chu', v: -2 }],
    choices: [
      { label: '为诸侯执笔盟辞', hint: '学问与辩才', check: { k: 'xuewen', dc: 48 },
        success: [{ t: 'fame', v: 8 }, { t: 'skill', k: 'biancai', v: 1 }, { t: 'money', v: 60 }], fail: [{ t: 'fame', v: 2 }],
        text: '盟辞一字之差，诸侯半日不决。你据《周礼》改定三字，遂定盟。' },
      { label: '旁观诸侯之师', hint: '', effects: [{ t: 'skill', k: 'bingfa', v: 1 }], text: '八国之师阵列于召陵，你第一次见识何为「诸侯之师」。' },
    ] },

  { id: 'kuaiqiu', year: -651, month: 8, title: '葵丘之会', where: { state: 'song' },
    body: '齐桓公会诸侯于葵丘，周天子使宰孔赐胙，命齐侯无拜。齐侯下拜受赐，诸侯皆服。盟曰：毋雍泉，毋讫籴，毋易树子，毋以妾为妻。',
    effects: [{ t: 'power', s: 'qi', v: 5 }, { t: 'flag', k: 'hegemon', v: 'qi' }],
    choices: [
      { label: '与会观礼', hint: '声名之会', effects: [{ t: 'money', v: -40 }, { t: 'fame', v: 8 }, { t: 'rel', id: 'qi_huan', v: 6 }],
        text: '坛上诸侯束牲载书，你听见齐侯一字一句念出盟辞。天下秩序，似乎就系于这几句话上。' },
      { label: '不入会', hint: '', effects: [], text: '霸主之会，往来皆卿相，与你无涉。' },
    ] },

  { id: 'hanyuan', year: -645, month: 9, title: '韩原之战', where: { state: 'qin' },
    body: '晋惠公背秦赂，秦穆公伐晋，战于韩原。晋惠公马陷泥中，为秦所俘。秦人欲杀之，穆公夫人以死请，乃归晋侯。',
    effects: [{ t: 'power', s: 'qin', v: 5 }, { t: 'power', s: 'jin', v: -4 }],
    choices: [
      { label: '从秦军观战', hint: '兵法之试', check: { k: 'bingfa', dc: 50 },
        success: [{ t: 'skill', k: 'bingfa', v: 1 }, { t: 'fame', v: 4 }], fail: [{ t: 'health', v: -8 }],
        text: '你看见晋侯的战车陷在泥里，秦人的甲士一拥而上。战阵之间，胜负只在一瞬。' },
      { label: '劝秦伯勿杀晋侯', hint: '辩才之试', check: { k: 'biancai', dc: 52 },
        success: [{ t: 'rel', id: 'qin_mu', v: 10 }, { t: 'fame', v: 6 }], fail: [{ t: 'fame', v: 1 }],
        text: '你言「杀之则天下以秦为暴」，秦伯默然，最终归晋侯于绛。' },
    ] },

  { id: 'huan_gong_si', year: -643, month: 10, title: '齐桓公卒', where: { state: 'qi' },
    body: '管仲已卒，竖刁、易牙、开方用事。桓公病，五公子争立，宫中空虚，尸在床上六十七日，虫流出户。',
    effects: [{ t: 'power', s: 'qi', v: -12 }, { t: 'flag', k: 'hegemon', v: '' }],
    choices: [
      { label: '入宫收敛桓公', hint: '重义之举', effects: [{ t: 'fame', v: 10 }, { t: 'money', v: -50 }, { t: 'rel', id: 'bao_shuya', v: 6 }],
        text: '你与数名老臣入宫，掩上那扇久无人开的大门。一代霸主，终究不过一具尸骸。' },
      { label: '叹息而去', hint: '', effects: [{ t: 'fame', v: 1 }], text: '盛极而衰，你在临淄的市上听见这个消息，只觉得风吹得冷。' },
    ] },

  { id: 'hongshui', year: -638, month: 11, title: '泓水之战', where: { state: 'song' },
    body: '宋襄公伐郑，楚救之，战于泓。宋人既成列，楚人未济，目夷请击之，公曰不可。楚人济而未成列，又请击，公曰不可。既成列而后击之，宋师大败，公伤股。',
    effects: [{ t: 'power', s: 'song', v: -6 }, { t: 'power', s: 'chu', v: 3 }],
    choices: [
      { label: '谏宋公半渡而击', hint: '兵法之试', check: { k: 'bingfa', dc: 44 },
        success: [{ t: 'rel', id: 'song_xiang', v: 4 }, { t: 'fame', v: 5 }, { t: 'skill', k: 'bingfa', v: 1 }], fail: [{ t: 'fame', v: 1 }],
        text: '你引《军志》「先人有夺人之心」，宋公摇头不语，仍待楚人成列。' },
      { label: '预避于岸', hint: '', effects: [], text: '你在岸上看着宋军溃散，泓水被血染成暗红。' },
    ] },

  { id: 'chengpu', year: -632, month: 4, title: '城濮之战', where: { state: 'jin' },
    body: '晋文公伐曹卫以救宋，楚子玉帅师来战。晋师退避三舍，战于城濮。晋下军蒙马以虎皮先犯陈蔡，楚右师溃；狐毛设二旆而退，楚左师溃。楚师败绩。',
    effects: [{ t: 'power', s: 'jin', v: 8 }, { t: 'power', s: 'chu', v: -6 }, { t: 'flag', k: 'hegemon', v: 'jin' }, { t: 'power', s: 'song', v: 2 }],
    choices: [
      { label: '从晋中军，献策破楚', hint: '兵法之试，晋地可入', req: { state: 'jin' }, check: { k: 'bingfa', dc: 56 },
        success: [{ t: 'merit', v: 60 }, { t: 'fame', v: 14 }, { t: 'rel', id: 'xian_zhen', v: 12 }, { t: 'skill', k: 'bingfa', v: 1 }],
        fail: [{ t: 'health', v: -18 }, { t: 'fame', v: 3 }],
        text: '你随先轸登车，望见楚右师阵脚已乱。战后清点军功，你的名字被记在竹简上。' },
      { label: '以辩才说楚子玉退兵', hint: '辩才之试，极难', check: { k: 'biancai', dc: 64 },
        success: [{ t: 'fame', v: 20 }, { t: 'power', s: 'jin', v: 2 }, { t: 'skill', k: 'biancai', v: 1 }], fail: [{ t: 'health', v: -10 }, { t: 'fame', v: 4 }],
        text: '你单车入楚营，陈说利害。子玉怒而不听，你退出营门时，听见身后甲叶作响。' },
      { label: '避于他国', hint: '', effects: [{ t: 'stamina', v: -5 }], text: '中原大战，你避于他国，只从行人口中听闻战况。' },
    ] },

  { id: 'xiao_zhi_zhan', year: -627, month: 4, title: '殽之战', where: { state: 'qin' },
    body: '秦穆公不听蹇叔之谏，遣孟明视等袭郑。郑商人弦高以牛十二犒师，秦师以为郑有备，灭滑而还。晋先轸伏兵于殽，秦师覆没。',
    effects: [{ t: 'power', s: 'qin', v: -6 }, { t: 'power', s: 'jin', v: 3 }, { t: 'rel', id: 'xian_gao', v: 6 }],
    choices: [
      { label: '随弦高犒秦师', hint: '在郑地，重义', req: { state: 'zheng' }, effects: [{ t: 'fame', v: 12 }, { t: 'rel', id: 'xian_gao', v: 14 }, { t: 'money', v: -40 }, { t: 'skill', k: 'shanggu', v: 1 }],
        text: '你与弦高一同驱牛入秦营，自称郑君所遣。秦人按兵，郑国得免一劫。' },
      { label: '赴殽山吊唁秦师', hint: '', effects: [{ t: 'fame', v: 3 }], text: '殽山之间尸骨相枕，你与乡人掩埋了数十具尸骸。' },
    ] },

  { id: 'bi_zhi_zhan', year: -597, month: 6, title: '邲之战', where: { state: 'chu' },
    body: '楚庄王围郑，晋师救之，战于邲。晋中军先济，士卒争舟，舟中之指可掬。楚师大胜，饮马于河，遂霸中原。',
    effects: [{ t: 'power', s: 'chu', v: 8 }, { t: 'power', s: 'jin', v: -6 }, { t: 'flag', k: 'hegemon', v: 'chu' }],
    choices: [
      { label: '从楚军，观其用兵', hint: '兵法之试，楚地', req: { state: 'chu' }, check: { k: 'bingfa', dc: 56 },
        success: [{ t: 'skill', k: 'bingfa', v: 1 }, { t: 'fame', v: 8 }, { t: 'rel', id: 'chu_zhuang', v: 10 }], fail: [{ t: 'health', v: -12 }],
        text: '你立于楚王战车之侧，看他旌旗一动，三军如臂使指。' },
      { label: '救晋军溃卒', hint: '重义，可增名声', effects: [{ t: 'fame', v: 8 }, { t: 'health', v: -6 }, { t: 'stamina', v: -10 }],
        text: '你在河岸拉起十几个晋国溃卒，他们的手指都被舟楫削断。' },
    ] },

  { id: 'an_zhi_zhan', year: -589, month: 6, title: '鞌之战', where: { state: 'qi' },
    body: '齐顷公伐鲁卫，晋郤克帅师救之，战于鞌。齐侯轻敌，不介马而驰，为晋所败。齐侯几为俘，逢丑父易位以免之。',
    effects: [{ t: 'power', s: 'jin', v: 4 }, { t: 'power', s: 'qi', v: -4 }],
    choices: [
      { label: '随晋军为御', hint: '御术与胆气', check: { k: 'jianshu', dc: 48 },
        success: [{ t: 'merit', v: 30 }, { t: 'fame', v: 6 }, { t: 'skill', k: 'jianshu', v: 1 }], fail: [{ t: 'health', v: -14 }],
        text: '战车在泥泞里打着旋，你死死拉住缰绳，听见身后箭矢破空。' },
      { label: '不预其事', hint: '', effects: [], text: '齐晋之战，与你无涉。' },
    ] },

  { id: 'yanling', year: -575, month: 6, title: '鄢陵之战', where: { state: 'zheng' },
    body: '晋厉公伐郑，楚共王救之，战于鄢陵。晋将魏锜射中楚王目，楚师夜遁。养由基善射，一箭穿杨，然终不能挽楚之败。',
    effects: [{ t: 'power', s: 'jin', v: 4 }, { t: 'power', s: 'chu', v: -3 }],
    choices: [
      { label: '与养由基比射', hint: '射术之试', check: { k: 'sheshu', dc: 58 },
        success: [{ t: 'rel', id: 'yang_youji', v: 14 }, { t: 'fame', v: 10 }, { t: 'skill', k: 'sheshu', v: 1 }], fail: [{ t: 'fame', v: 2 }, { t: 'health', v: -4 }],
        text: '百步之外的柳叶在风里颤。你射中了，养由基大笑，说「可教也」。' },
      { label: '救护伤卒', hint: '', effects: [{ t: 'fame', v: 4 }, { t: 'health', v: -3 }], text: '你在战场上奔走，把伤卒一个一个拖到车下。' },
    ] },

  { id: 'mibing', year: -546, month: 5, title: '弭兵之会', where: { state: 'song' },
    body: '宋左师向戌奔走晋楚之间，合诸侯之大夫盟于宋。晋楚之从交相见，天下息兵。向戌辞邑，曰：「以靖小国，请免之。」',
    effects: [{ t: 'power', s: 'song', v: 5 }, { t: 'flag', k: 'mibing', v: true }],
    choices: [
      { label: '为向戌执笔记盟', hint: '学问或辩才', check: { k: 'xuewen', dc: 52 },
        success: [{ t: 'fame', v: 14 }, { t: 'rel', id: 'xiang_xu', v: 12 }, { t: 'money', v: 80 }], fail: [{ t: 'fame', v: 2 }],
        text: '盟书凡七国，字字斟酌。向戌拍你的肩说：「天下自此少死许多人。」' },
      { label: '往观盟礼', hint: '', effects: [{ t: 'fame', v: 4 }], text: '诸侯之大夫会于宋，歃血之后，各自归国。' },
    ] },

  { id: 'zi_chan_si', year: -522, month: 12, title: '子产卒', where: { state: 'zheng' },
    body: '郑子产卒。孔子闻之，出涕曰：「古之遗爱也。」郑人相与哭于巷，三月不闻竽瑟之声。',
    effects: [{ t: 'power', s: 'zheng', v: -5 }],
    choices: [
      { label: '往新郑吊之', hint: '重义', effects: [{ t: 'fame', v: 6 }, { t: 'money', v: -20 }], text: '你在子产之丧上，听见郑人哭声不绝。' },
      { label: '读其刑书而叹', hint: '学问', effects: [{ t: 'skill', k: 'xuewen', v: 1 }], text: '铸于鼎上的刑书，第一次让庶民知法之所在。' },
    ] },

  { id: 'baiju', year: -506, month: 11, title: '柏举之战', where: { state: 'wu' },
    body: '吴王阖闾用伍子胥、孙武之谋，五战入郢。楚昭王出奔，吴人入楚王宫。伍子胥掘楚平王墓，鞭尸三百。',
    effects: [{ t: 'power', s: 'wu', v: 10 }, { t: 'power', s: 'chu', v: -10 }],
    choices: [
      { label: '从吴军入郢', hint: '在吴地，武艺或兵法', req: { state: 'wu' }, check: { k: 'bingfa', dc: 56 },
        success: [{ t: 'merit', v: 50 }, { t: 'fame', v: 14 }, { t: 'money', v: 150 }, { t: 'rel', id: 'wu_zixu', v: 10 }], fail: [{ t: 'health', v: -16 }],
        text: '五战五捷，吴师入郢。你站在楚王宫阶前，看伍子胥一言不发地走向平王墓。' },
      { label: '随楚人奔随', hint: '重义', effects: [{ t: 'fame', v: 6 }, { t: 'health', v: -8 }], text: '你随楚昭王奔随，山路崎岖，王的车驾在身后只剩一点尘。' },
    ] },

  { id: 'zui_li', year: -496, month: 5, title: '槜李之战', where: { state: 'wu' },
    body: '越王允常卒，勾践立。吴王阖闾伐越，越人使死士三行，属剑于颈而自刭，吴师属目，越人因而袭之。阖闾伤指，还卒于陉。',
    effects: [{ t: 'power', s: 'yue', v: 6 }, { t: 'power', s: 'wu', v: -5 }],
    choices: [
      { label: '救吴王于阵中', hint: '武艺之试', check: { k: 'jianshu', dc: 54 },
        success: [{ t: 'fame', v: 12 }, { t: 'rel', id: 'fu_cha', v: 14 }, { t: 'health', v: -10 }], fail: [{ t: 'health', v: -20 }, { t: 'fame', v: 3 }],
        text: '你扛起阖闾的时候，他的手指已经断了，血顺着甲叶往下滴。' },
      { label: '避于会稽山中', hint: '', effects: [{ t: 'stamina', v: 5 }], text: '山雨欲来，你在会稽山中听樵夫说起吴越之事。' },
    ] },

  { id: 'fujiao', year: -494, month: 3, title: '夫椒之战', where: { state: 'yue' },
    body: '吴王夫差悉发精兵伐越，败越于夫椒。勾践以甲楯五千栖于会稽，使大夫种行成于吴。',
    effects: [{ t: 'power', s: 'yue', v: -8 }, { t: 'power', s: 'wu', v: 6 }],
    choices: [
      { label: '随文种入吴营请成', hint: '辩才之试', check: { k: 'biancai', dc: 56 },
        success: [{ t: 'rel', id: 'wen_zhong', v: 12 }, { t: 'fame', v: 10 }, { t: 'skill', k: 'biancai', v: 1 }], fail: [{ t: 'fame', v: 2 }],
        text: '你与文种跪于吴营之前，说尽卑辞厚礼。夫差终于点头，越国得以不亡。' },
      { label: '入山吊越之遗民', hint: '', effects: [{ t: 'fame', v: 4 }, { t: 'rel', id: 'gou_jian', v: 8 }], text: '会稽山下，越人扶老携幼。你分了些粟米给他们。' },
    ] },

  { id: 'huangchi', year: -482, month: 7, title: '黄池之会', where: { state: 'wu' },
    body: '吴王夫差会晋定公于黄池，争长。吴人曰「于周室我为长」，晋人曰「于姬姓我为伯」。夫差以兵威胁晋，终先歃。然越已入吴，吴都告急。',
    effects: [{ t: 'power', s: 'wu', v: 3 }, { t: 'power', s: 'yue', v: 6 }],
    choices: [
      { label: '劝吴王速归', hint: '智略之试', check: { k: 'quanmou', dc: 54 },
        success: [{ t: 'fame', v: 8 }, { t: 'rel', id: 'fu_cha', v: 6 }], fail: [{ t: 'fame', v: 1 }],
        text: '你言「国本已危，争长何为」。夫差沉默良久，连夜拔营。' },
      { label: '不与', hint: '', effects: [], text: '黄池之会，诸侯争一席之位，而越人已入吴都。' },
    ] },

  { id: 'yue_mie_wu', year: -473, month: 11, title: '越灭吴', where: { state: 'yue' },
    body: '越王勾践围吴三年，吴师溃。夫差使公孙雄肉袒膝行请成，勾践不许，曰：「昔天以越赐吴，吴不受；今天以吴赐越，孤敢不听？」夫差自刭。',
    effects: [{ t: 'power', s: 'yue', v: 10 }, { t: 'power', s: 'wu', v: -14 }, { t: 'flag', k: 'hegemon', v: 'yue' }],
    choices: [
      { label: '往吊吴王', hint: '重义', effects: [{ t: 'fame', v: 10 }, { t: 'rel', id: 'fan_li', v: 8 }], text: '你看着夫差以布蒙面自刭，说「吾无面目以见子胥也」。' },
      { label: '贺越王于姑苏台', hint: '声名', effects: [{ t: 'money', v: 50 }, { t: 'fame', v: 6 }, { t: 'rel', id: 'gou_jian', v: 8 }], text: '姑苏台上，越王勾践受诸侯之贺，而范蠡已泛舟五湖。' },
    ] },
];

// 随机事件：{id, w, when(st), title, body, effects?, choices?}
export const RANDOM_EVENTS = [
  { id: 'bandit', w: 10, when: st => st.player.money > 60,
    title: '道遇劫匪', body: '你行至荒僻处，忽有数人持刃拦路，喝令留下财货。',
    choices: [
      { label: '拔剑相斗', hint: '以武艺退敌', check: { k: 'jianshu', dc: 40 },
        success: [{ t: 'fame', v: 3 }, { t: 'money', v: 40 }], fail: [{ t: 'money', v: -60 }, { t: 'health', v: -8 }], text: '刀光一闪，匪徒见你不是易与之辈，弃刃而走，地上还落了些散钱。' },
      { label: '舍财免祸', hint: '破财', effects: [{ t: 'money', v: -50 }], text: '你把钱袋丢过去，匪徒掂了掂，笑着让开一条路。' },
    ] },

  { id: 'sage', w: 8, when: st => st.time.year < -540,
    title: '途遇隐者', body: '林间有一老者，负薪而行，歌曰：「沧浪之水清兮，可以濯吾缨。」',
    choices: [
      { label: '上前请教', hint: '或有所得', check: { k: 'xuewen', dc: 38 },
        success: [{ t: 'skill', k: 'xuewen', v: 1 }, { t: 'fame', v: 2 }], fail: [{ t: 'fame', v: 1 }], text: '老者与你说了半日「无为」之理，你似懂非懂，却记了一辈子。' },
      { label: '致意而去', hint: '', effects: [], text: '你拱手作别，老者的歌声渐远。' },
    ] },

  { id: 'harvest', w: 12, when: () => true,
    title: '岁丰', body: '今年风调雨顺，粟麦大熟。市上粮价应声而落。',
    effects: [{ t: 'goods', g: 'su', v: -0.18 }] },

  { id: 'famine', w: 8, when: () => true,
    title: '饥荒', body: '某地大旱，赤地千里，流民载道。粟价腾贵，诸国闭关禁籴。',
    effects: [{ t: 'goods', g: 'su', v: 0.28 }, { t: 'goods', g: 'ge', v: 0.1 }] },

  { id: 'war_rumor', w: 10, when: () => true,
    title: '兵戈之讯', body: '道听途说，某国正聚兵于境上，市井之间人心惶惶。',
    effects: [{ t: 'goods', g: 'tie', v: 0.16 }, { t: 'goods', g: 'ma', v: 0.14 }] },

  { id: 'plague', w: 5, when: () => true,
    title: '疫病', body: '城中疫气流行，巷陌多闭户，医者奔走不暇。',
    effects: [{ t: 'health', v: -6 }, { t: 'goods', g: 'su', v: 0.12 }] },

  { id: 'summon', w: 7, when: st => st.player.fame >= 25 && st.player.state,
    title: '国君相召', body: '有使者至，言国君闻君之名，欲一见。',
    choices: [
      { label: '应召入宫', hint: '或有封赏', effects: [{ t: 'merit', v: 20 }, { t: 'money', v: 50 }, { t: 'fame', v: 2 }], text: '国君问以国事，你应对得体，赐金五十。' },
      { label: '称病不往', hint: '清高之名', effects: [{ t: 'fame', v: 2 }], text: '你推说抱恙，使者怫然而去。' },
    ] },

  { id: 'scholar_lecture', w: 7, when: () => true,
    title: '学宫讲席', body: '学宫之中，诸子论辩，听者盈庭。有人邀你也说几句。',
    choices: [
      { label: '登席陈说', hint: '学问或辩才', check: { k: 'xuewen', dc: 44 },
        success: [{ t: 'fame', v: 5 }, { t: 'skill', k: 'biancai', v: 1 }], fail: [{ t: 'fame', v: 1 }, { t: 'stamina', v: -4 }], text: '你引经据典，条分缕析，座中数人点头称善。' },
      { label: '默坐听讲', hint: '', effects: [{ t: 'skill', k: 'xuewen', v: 1 }], text: '你听了一整日，回去的路上还在想那句「君子和而不同」。' },
    ] },

  { id: 'merchant_offer', w: 8, when: st => st.player.money > 150,
    title: '行商之邀', body: '一位行商愿以低价赊你一批货，言明三月之内还本即可。',
    choices: [
      { label: '应下这笔生意', hint: '风险与利', check: { k: 'shanggu', dc: 38 },
        success: [{ t: 'money', v: 120 }, { t: 'skill', k: 'shanggu', v: 1 }], fail: [{ t: 'money', v: -80 }], text: '你转手将货卖往邻邑，赚了一笔差价。' },
      { label: '婉言谢绝', hint: '', effects: [], text: '你笑着摇头，说「买卖不在急上」。' },
    ] },

  { id: 'duel_challenge', w: 6, when: st => st.player.fame > 15,
    title: '剑客挑战', body: '一名游侠拦路，自称闻你之名，欲以剑会友。',
    choices: [
      { label: '应战', hint: '决斗', effects: [{ t: 'duel', who: 'wanderer' }], text: '围观者让出一片空地，剑已出鞘。' },
      { label: '抱拳谢过', hint: '', effects: [{ t: 'fame', v: -1 }], text: '你抱拳道「不敢」，那剑客冷哼一声走了。' },
    ] },

  { id: 'mentor', w: 6,
    when: st => {
      return Object.values(st.npc).some(n => n.city === st.player.cityId && n.alive && n.role === 'scholar');
    },
    title: '贤者讲学', body: '城中有贤者开讲，士人毕集。你若往听，或可请益。',
    choices: [
      { label: '前往受教', hint: '需束脩', effects: [{ t: 'money', v: -20 }, { t: 'skillxp', k: 'xuewen', v: 12 }], text: '你奉上束脩，贤者为你讲了一卷书。' },
      { label: '不往', hint: '', effects: [], text: '学在人心，不必在讲堂。' },
    ] },
];
