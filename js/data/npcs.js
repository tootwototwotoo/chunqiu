// 列国人物。birth/death 为负的公元前年份，null 表示不详（按出场年份判断）。
// role: ruler 国君 / minister 卿相 / general 将帅 / scholar 名士 / merchant 富商 / retainer 门客
// bias: li 好利 / yi 重义 / ming 好名 / shi 慕强（重实力与形势） —— 游说时的突破口
// pref: 偏爱的礼物；teach: 可传授的技能

export const NPCS = [
  { id: 'zheng_zhuang', name: '郑庄公', title: '郑伯', state: 'zheng', city: 'xinzheng', birth: -757, death: -701, role: 'ruler',
    stats: { wu: 58, zhi: 78, zheng: 86, mei: 72 }, skills: { jianshu: 2, bingfa: 4, quanmou: 6, biancai: 3 }, bias: 'shi', pref: 'yu', teach: ['quanmou'],
    quote: '多行不义必自毙。寡人且待之。',
    desc: '郑国之主，克段于鄢，挟天子以令诸侯，号为小霸。' },

  { id: 'ji_zu', name: '祭足', title: '郑之上卿', state: 'zheng', city: 'xinzheng', birth: -750, death: -682, role: 'minister',
    stats: { wu: 46, zhi: 88, zheng: 84, mei: 60 }, skills: { quanmou: 7, biancai: 5, xuewen: 5 }, bias: 'shi', pref: 'yu', teach: ['quanmou', 'xuewen'],
    quote: '国不可一日无君，亦不可一日无谋。',
    desc: '郑国老臣，历事数君，善权变，郑之社稷系于其身。' },

  { id: 'zhu_zhiwu', name: '烛之武', title: '郑之老臣', state: 'zheng', city: 'xinzheng', birth: -706, death: -620, role: 'minister',
    stats: { wu: 24, zhi: 90, zheng: 76, mei: 82 }, skills: { biancai: 8, quanmou: 7, xuewen: 6 }, bias: 'li', pref: 'si', teach: ['biancai', 'quanmou'],
    quote: '夜缒而出，见秦伯，一言而退秦师。',
    desc: '郑国辩士，年老而不得用，然一言之辩可退千军。' },

  { id: 'xian_gao', name: '弦高', title: '郑之商人', state: 'zheng', city: 'xinzheng', birth: -680, death: -590, role: 'merchant',
    stats: { wu: 30, zhi: 70, zheng: 60, mei: 74 }, skills: { shanggu: 8, suanshu: 6, biancai: 4 }, bias: 'li', pref: 'mingzhu', teach: ['shanggu', 'suanshu'],
    quote: '商人不唯利是图，亦有利国之时。',
    desc: '郑国行商，曾以牛十二犒秦师，伪称郑君之命，全郑于危难。' },

  { id: 'qi_huan', name: '齐桓公', title: '齐侯', state: 'qi', city: 'linzi', birth: -716, death: -643, role: 'ruler',
    stats: { wu: 62, zhi: 72, zheng: 80, mei: 86 }, skills: { bingfa: 4, quanmou: 4, xuewen: 3 }, bias: 'ming', pref: 'ma', teach: ['bingfa'],
    quote: '寡人欲伯诸侯，奈何？',
    desc: '齐国之主，任管仲而修内政，尊王攘夷，为春秋首霸。' },

  { id: 'guan_zhong', name: '管仲', title: '齐相', state: 'qi', city: 'linzi', birth: -723, death: -645, role: 'minister',
    stats: { wu: 38, zhi: 96, zheng: 95, mei: 72 }, skills: { shanggu: 9, suanshu: 9, quanmou: 8, xuewen: 8, biancai: 7 }, bias: 'li', pref: 'shan', teach: ['shanggu', 'suanshu', 'quanmou'],
    quote: '仓廪实而知礼节，衣食足而知荣辱。',
    desc: '齐之相国，通货积财，设轻重九府，齐以富强。' },

  { id: 'bao_shuya', name: '鲍叔牙', title: '齐之大夫', state: 'qi', city: 'linzi', birth: -730, death: -644, role: 'minister',
    stats: { wu: 44, zhi: 76, zheng: 70, mei: 84 }, skills: { quanmou: 5, biancai: 4, xuewen: 5 }, bias: 'yi', pref: 'si', teach: ['biancai'],
    quote: '知臣莫如君，知友莫如我。',
    desc: '齐之贤大夫，让相位以荐管仲，世称其知人。' },

  { id: 'lu_yin', name: '鲁隐公', title: '鲁侯', state: 'lu', city: 'qufu', birth: -790, death: -712, role: 'ruler',
    stats: { wu: 40, zhi: 58, zheng: 62, mei: 60 }, skills: { xuewen: 4, biancai: 3 }, bias: 'yi', pref: 'si', teach: ['xuewen'],
    quote: '礼，经国家、定社稷、序民人、利后嗣者也。',
    desc: '鲁国之君，摄位而治，好礼守正，然失于威断。' },

  { id: 'cao_gui', name: '曹刿', title: '鲁之谋士', state: 'lu', city: 'qufu', birth: -730, death: -660, role: 'general',
    stats: { wu: 64, zhi: 82, zheng: 48, mei: 58 }, skills: { bingfa: 7, quanmou: 5, jianshu: 4 }, bias: 'yi', pref: 'ge', teach: ['bingfa'],
    quote: '一鼓作气，再而衰，三而竭。',
    desc: '鲁国布衣，长勺之战论战于庄公，以弱胜强。' },

  { id: 'jin_wen', name: '晋文公', title: '晋侯', state: 'jin', city: 'jiang', birth: -697, death: -628, role: 'ruler',
    stats: { wu: 64, zhi: 82, zheng: 78, mei: 80 }, skills: { bingfa: 6, quanmou: 7, biancai: 5 }, bias: 'ming', pref: 'ma', teach: ['bingfa', 'quanmou'],
    quote: '退避三舍，所以报也。',
    desc: '晋国之主，流亡十九年而后反国，城濮一战而伯诸侯。' },

  { id: 'hu_yan', name: '狐偃', title: '晋之谋主', state: 'jin', city: 'jiang', birth: -715, death: -629, role: 'minister',
    stats: { wu: 52, zhi: 90, zheng: 80, mei: 66 }, skills: { quanmou: 8, bingfa: 6, biancai: 6 }, bias: 'yi', pref: 'si', teach: ['quanmou', 'biancai'],
    quote: '战而捷，必得诸侯；若其不捷，表里山河，必无害也。',
    desc: '晋文公之舅，从亡十九年，多所筹画，晋之霸业实赖其谋。' },

  { id: 'xian_zhen', name: '先轸', title: '晋之中军将', state: 'jin', city: 'jiang', birth: -680, death: -627, role: 'general',
    stats: { wu: 88, zhi: 84, zheng: 56, mei: 62 }, skills: { bingfa: 9, jianshu: 7, sheshu: 6 }, bias: 'shi', pref: 'ma', teach: ['bingfa', 'sheshu'],
    quote: '兵者，诡道也。',
    desc: '晋国名将，城濮破楚、殽山败秦，谋勇兼资，为晋之柱石。' },

  { id: 'chu_cheng', name: '楚成王', title: '楚王', state: 'chu', city: 'ying', birth: -700, death: -626, role: 'ruler',
    stats: { wu: 66, zhi: 76, zheng: 74, mei: 68 }, skills: { bingfa: 6, quanmou: 5 }, bias: 'shi', pref: 'qi', teach: ['bingfa'],
    quote: '楚虽蛮夷，亦欲观中国之政。',
    desc: '楚国之主，北向争衡，围宋救卫，一时兵威震于中原。' },

  { id: 'zi_wen', name: '子文', title: '楚之令尹', state: 'chu', city: 'ying', birth: -700, death: -630, role: 'minister',
    stats: { wu: 48, zhi: 86, zheng: 92, mei: 70 }, skills: { quanmou: 6, shanggu: 6, xuewen: 7 }, bias: 'yi', pref: 'qi', teach: ['shanggu', 'xuewen'],
    quote: '当官而行，何强之有？',
    desc: '楚之令尹，毁家纾难，治民有方，楚人颂之。' },

  { id: 'qin_mu', name: '秦穆公', title: '秦伯', state: 'qin', city: 'yong', birth: -683, death: -621, role: 'ruler',
    stats: { wu: 60, zhi: 80, zheng: 82, mei: 78 }, skills: { bingfa: 5, quanmou: 6, shanggu: 4 }, bias: 'yi', pref: 'ma', teach: ['quanmou'],
    quote: '吾不以一眚掩大德。',
    desc: '秦国之主，广纳贤才，东服强晋，西霸戎夷。' },

  { id: 'bai_li_xi', name: '百里奚', title: '秦之大夫', state: 'qin', city: 'yong', birth: -725, death: -620, role: 'minister',
    stats: { wu: 34, zhi: 94, zheng: 92, mei: 72 }, skills: { xuewen: 8, quanmou: 7, shanggu: 6, suanshu: 7 }, bias: 'yi', pref: 'su', teach: ['xuewen', 'suanshu'],
    quote: '五羖大夫，何敢忘贫贱之交。',
    desc: '秦之贤相，五张羊皮赎身而入秦，谋国二十年，秦以强盛。' },

  { id: 'jian_shu', name: '蹇叔', title: '秦之上大夫', state: 'qin', city: 'yong', birth: -720, death: -620, role: 'minister',
    stats: { wu: 40, zhi: 90, zheng: 84, mei: 66 }, skills: { quanmou: 7, bingfa: 6, xuewen: 7 }, bias: 'yi', pref: 'ge', teach: ['quanmou', 'bingfa'],
    quote: '劳师以袭远，非所闻也。',
    desc: '秦之老臣，料事如神，殽之战前哭师，后果如其言。' },

  { id: 'song_xiang', name: '宋襄公', title: '宋公', state: 'song', city: 'shangqiu', birth: -700, death: -637, role: 'ruler',
    stats: { wu: 52, zhi: 48, zheng: 58, mei: 76 }, skills: { xuewen: 5, biancai: 4 }, bias: 'ming', pref: 'yu', teach: ['xuewen'],
    quote: '君子不重伤，不禽二毛。',
    desc: '宋国之主，慕仁义之名，泓水之战不鼓不成列，遂败。' },

  { id: 'hua_yuan', name: '华元', title: '宋之右师', state: 'song', city: 'shangqiu', birth: -620, death: -560, role: 'minister',
    stats: { wu: 54, zhi: 80, zheng: 84, mei: 78 }, skills: { biancai: 7, quanmou: 6, bingfa: 4 }, bias: 'yi', pref: 'ge', teach: ['biancai', 'quanmou'],
    quote: '敝邑易子而食，析骸以爨，虽然，城下之盟，有以国毙，不能从也。',
    desc: '宋国执政，登床劫盟，后又倡弭兵之会，以纾宋难。' },

  { id: 'xiang_xu', name: '向戌', title: '宋之左师', state: 'song', city: 'shangqiu', birth: -600, death: -530, role: 'minister',
    stats: { wu: 40, zhi: 82, zheng: 86, mei: 88 }, skills: { biancai: 9, quanmou: 7 }, bias: 'ming', pref: 'si', teach: ['biancai'],
    quote: '弭兵之会，天下息肩。',
    desc: '宋国左师，奔走列国，合晋楚之成，为春秋一大盛事。' },

  { id: 'wei_wen', name: '卫文公', title: '卫侯', state: 'wei', city: 'chaoge', birth: -720, death: -635, role: 'ruler',
    stats: { wu: 48, zhi: 66, zheng: 72, mei: 62 }, skills: { shanggu: 5, xuewen: 4 }, bias: 'yi', pref: 'si', teach: ['shanggu'],
    quote: '卫之遗民，革车三十乘，今已三百乘矣。',
    desc: '卫国之君，国破之后励精图治，轻赋平罪，卫以复兴。' },

  { id: 'yan_zhuang', name: '燕庄公', title: '燕侯', state: 'yan', city: 'ji', birth: -730, death: -658, role: 'ruler',
    stats: { wu: 44, zhi: 56, zheng: 58, mei: 60 }, skills: { bingfa: 3, xuewen: 3 }, bias: 'yi', pref: 'ge', teach: ['xuewen'],
    quote: '燕处北鄙，赖齐侯以安。',
    desc: '燕国之君，山戎侵伐，赖齐桓公救而存国。' },

  { id: 'chen_xuan', name: '陈宣公', title: '陈侯', state: 'chen', city: 'wanqiu', birth: -720, death: -648, role: 'ruler',
    stats: { wu: 40, zhi: 54, zheng: 56, mei: 58 }, skills: { xuewen: 3 }, bias: 'ming', pref: 'qi', teach: ['xuewen'],
    quote: '陈，小国也，事大国以自安。',
    desc: '陈国之君，国小势微，周旋于晋楚之间。' },

  { id: 'cai_ai', name: '蔡哀公', title: '蔡侯', state: 'cai', city: 'shangcai', birth: -730, death: -675, role: 'ruler',
    stats: { wu: 42, zhi: 46, zheng: 50, mei: 54 }, skills: { jianshu: 2 }, bias: 'ming', pref: 'mingzhu', teach: ['jianshu'],
    quote: '蔡人亦自有志。',
    desc: '蔡国之君，地薄兵弱，为楚所窥。' },

  { id: 'cao_gong', name: '曹共公', title: '曹伯', state: 'cao', city: 'tao', birth: -720, death: -618, role: 'ruler',
    stats: { wu: 38, zhi: 44, zheng: 48, mei: 50 }, skills: { shanggu: 3 }, bias: 'li', pref: 'su', teach: ['shanggu'],
    quote: '陶为天下之中，商旅辐辏，寡人亦有以自养。',
    desc: '曹国之君，据陶之利，国小而富。' },

  { id: 'chu_zhuang', name: '楚庄王', title: '楚王', state: 'chu', city: 'ying', birth: -640, death: -591, role: 'ruler',
    stats: { wu: 72, zhi: 88, zheng: 88, mei: 80 }, skills: { bingfa: 7, quanmou: 8, biancai: 4 }, bias: 'shi', pref: 'qi', teach: ['bingfa', 'quanmou'],
    quote: '三年不蜚，蜚将冲天；三年不鸣，鸣将惊人。',
    desc: '楚国之主，问鼎中原，邲之战大败晋师，遂霸诸侯。' },

  { id: 'yan_ying', name: '晏婴', title: '齐之相国', state: 'qi', city: 'linzi', birth: -578, death: -500, role: 'minister',
    stats: { wu: 35, zhi: 92, zheng: 94, mei: 86 }, skills: { biancai: 10, quanmou: 8, xuewen: 8 }, bias: 'yi', pref: 'si', teach: ['biancai', 'xuewen'],
    quote: '橘生淮南则为橘，生于淮北则为枳。',
    desc: '齐之贤相，历事三君，节俭力行，折冲樽俎之间。' },

  { id: 'shu_xiang', name: '叔向', title: '晋之太傅', state: 'jin', city: 'jiang', birth: -620, death: -528, role: 'minister',
    stats: { wu: 42, zhi: 86, zheng: 90, mei: 74 }, skills: { xuewen: 9, biancai: 8, quanmou: 6 }, bias: 'yi', pref: 'yu', teach: ['xuewen', 'biancai'],
    quote: '国将亡，必多制。',
    desc: '晋国贤大夫，博闻强识，以礼法持国论。' },

  { id: 'zi_chan', name: '子产', title: '郑之执政', state: 'zheng', city: 'xinzheng', birth: -600, death: -522, role: 'minister',
    stats: { wu: 40, zhi: 92, zheng: 96, mei: 82 }, skills: { xuewen: 9, quanmou: 8, biancai: 7, shanggu: 5 }, bias: 'yi', pref: 'yu', teach: ['xuewen', 'quanmou'],
    quote: '苟利社稷，死生以之。',
    desc: '郑国执政，铸刑书，不毁乡校，小国而能自立于晋楚之间。' },

  { id: 'lao_zi', name: '老子', title: '周之守藏史', state: 'zhou', city: 'luoyi', birth: -571, death: -471, role: 'scholar',
    stats: { wu: 26, zhi: 96, zheng: 72, mei: 80 }, skills: { xuewen: 10, biancai: 7, quanmou: 8 }, bias: 'yi', pref: 'bi', teach: ['xuewen', 'quanmou'],
    quote: '上善若水，水善利万物而不争。',
    desc: '周室守藏室之史，博古知今，其学以自隐无名为务。' },

  { id: 'kong_zi', name: '孔子', title: '鲁之学者', state: 'lu', city: 'qufu', birth: -551, death: -479, role: 'scholar',
    stats: { wu: 52, zhi: 94, zheng: 86, mei: 90 }, skills: { xuewen: 10, biancai: 8, bingfa: 4, suanshu: 5 }, bias: 'yi', pref: 'si', teach: ['xuewen', 'biancai'],
    quote: '学而时习之，不亦说乎？',
    desc: '鲁国陬邑人，少而好学，设教阙里，弟子三千，贤者七十。' },

  { id: 'sun_wu', name: '孙武', title: '吴之将军', state: 'wu', city: 'gusu', birth: -545, death: -470, role: 'general',
    stats: { wu: 78, zhi: 96, zheng: 70, mei: 66 }, skills: { bingfa: 10, quanmou: 8, jianshu: 6, xuewen: 7 }, bias: 'shi', pref: 'ma', teach: ['bingfa', 'jianshu'],
    quote: '兵者，国之大事，死生之地，存亡之道，不可不察也。',
    desc: '齐人而仕于吴，以兵法十三篇见阖闾，西破强楚，北威齐晋。' },

  { id: 'wu_zixu', name: '伍子胥', title: '吴之相国', state: 'wu', city: 'gusu', birth: -559, death: -484, role: 'minister',
    stats: { wu: 82, zhi: 88, zheng: 80, mei: 60 }, skills: { quanmou: 8, bingfa: 7, jianshu: 6 }, bias: 'yi', pref: 'ma', teach: ['quanmou', 'bingfa'],
    quote: '日暮途远，吾故倒行而逆施之。',
    desc: '楚之亡臣，父兄被戮，奔吴以谋复仇，终以吴师入郢。' },

  { id: 'he_lu', name: '阖闾', title: '吴王', state: 'wu', city: 'gusu', birth: -560, death: -496, role: 'ruler',
    stats: { wu: 74, zhi: 78, zheng: 76, mei: 70 }, skills: { bingfa: 6, quanmou: 6 }, bias: 'shi', pref: 'tie', teach: ['bingfa'],
    quote: '吴虽僻远，愿与上图一争高下。',
    desc: '吴国之主，任伍胥、孙武，西破楚而入郢，东南之势成。' },

  { id: 'fu_cha', name: '夫差', title: '吴王', state: 'wu', city: 'gusu', birth: -540, death: -473, role: 'ruler',
    stats: { wu: 80, zhi: 62, zheng: 58, mei: 70 }, skills: { bingfa: 6, jianshu: 7 }, bias: 'ming', pref: 'xiang', teach: ['jianshu'],
    quote: '寡人岂敢忘越王之杀吾父耶！',
    desc: '吴国之主，夫椒胜越，黄池会盟，然矜功自伐，终为越所灭。' },

  { id: 'gou_jian', name: '勾践', title: '越王', state: 'yue', city: 'kuaiji', birth: -520, death: -465, role: 'ruler',
    stats: { wu: 70, zhi: 86, zheng: 80, mei: 66 }, skills: { quanmou: 8, bingfa: 5 }, bias: 'shi', pref: 'tie', teach: ['quanmou'],
    quote: '卧薪尝胆，十年生聚，十年教训。',
    desc: '越国之主，败于夫椒而不屈，忍辱负重，终以三千越甲吞吴。' },

  { id: 'fan_li', name: '范蠡', title: '越之上将军', state: 'yue', city: 'kuaiji', birth: -536, death: -448, role: 'merchant',
    stats: { wu: 56, zhi: 94, zheng: 88, mei: 84 }, skills: { shanggu: 10, quanmou: 8, biancai: 7, suanshu: 8 }, bias: 'li', pref: 'mingzhu', teach: ['shanggu', 'suanshu', 'quanmou'],
    quote: '飞鸟尽，良弓藏；狡兔死，走狗烹。',
    desc: '越国谋臣，佐勾践灭吴，功成身退，浮海至陶，三致千金，号陶朱公。' },

  { id: 'wen_zhong', name: '文种', title: '越之大夫', state: 'yue', city: 'kuaiji', birth: -540, death: -472, role: 'minister',
    stats: { wu: 40, zhi: 86, zheng: 88, mei: 72 }, skills: { quanmou: 7, xuewen: 7, biancai: 6 }, bias: 'yi', pref: 'si', teach: ['quanmou', 'xuewen'],
    quote: '伐吴七术，越王用其三而吴灭。',
    desc: '越国大夫，与范蠡共佐勾践，灭吴之后不能去，终赐剑而死。' },

  { id: 'ji_liang', name: '季梁', title: '随之贤大夫', state: 'sui', city: 'sui', birth: -720, death: -660, role: 'minister',
    stats: { wu: 38, zhi: 88, zheng: 84, mei: 72 }, skills: { xuewen: 7, quanmou: 6, biancai: 5 }, bias: 'yi', pref: 'xijiao', teach: ['quanmou', 'xuewen'],
    quote: '夫民，神之主也。是以圣王先成民而后致力于神。',
    desc: '随国贤臣，谏随侯修政亲邻，以民为本，汉东赖之。' },

  { id: 'liu_xiahui', name: '展获', title: '鲁之柳下惠', state: 'lu', city: 'fei', birth: -720, death: -621, role: 'scholar',
    stats: { wu: 40, zhi: 84, zheng: 80, mei: 90 }, skills: { xuewen: 8, biancai: 6, quanmou: 4 }, bias: 'yi', pref: 'si', teach: ['xuewen', 'biancai'],
    quote: '直道而事人，焉往而不三黜？',
    desc: '鲁之贤大夫，食邑柳下。坐怀不乱，三黜而不去，士人称其和。' },

  { id: 'qu_wan', name: '屈完', title: '楚之大夫', state: 'chu', city: 'shen', birth: -700, death: -640, role: 'minister',
    stats: { wu: 54, zhi: 84, zheng: 78, mei: 86 }, skills: { biancai: 8, quanmou: 5, bingfa: 4 }, bias: 'shi', pref: 'ma', teach: ['biancai', 'quanmou'],
    quote: '君若以德绥诸侯，谁敢不服？',
    desc: '楚之辩士，召陵之盟单车入齐师，以一言折诸侯之兵。' },

  { id: 'yang_youji', name: '养由基', title: '楚之射师', state: 'chu', city: 'ying', birth: -640, death: -570, role: 'general',
    stats: { wu: 86, zhi: 60, zheng: 42, mei: 58 }, skills: { sheshu: 10, jianshu: 6, bingfa: 4 }, bias: 'ming', pref: 'ma', teach: ['sheshu', 'jianshu'],
    quote: '去柳叶者百步而射之，百发而百中。',
    desc: '楚之善射者，百步穿杨，鄢陵之战中箭而死。' },
  
  
  { id: 'you_yu', name: '由余', title: '戎王之使', state: 'qin', city: 'yong', birth: -700, death: -623, role: 'minister',
    stats: { wu: 48, zhi: 84, zheng: 78, mei: 60 }, skills: { bingfa: 7, quanmou: 6 }, bias: 'shi', pref: 'ma', teach: ['bingfa'],
    quote: '诗书礼乐，中国之所以乱也。', desc: '本西戎之臣，秦穆公以女乐间之，遂降秦，为秦谋伐戎。' },

  { id: 'zi_fan', name: '子犯', title: '晋之谋臣', state: 'jin', city: 'jiang', birth: -715, death: -629, role: 'minister',
    stats: { wu: 46, zhi: 86, zheng: 80, mei: 66 }, skills: { quanmou: 8, biancai: 6 }, bias: 'li', pref: 'yu', teach: ['quanmou'],
    quote: '战也。战而捷，必得诸侯。', desc: '狐偃，从重耳流亡十九年，城濮之战主谋。' },
  
  { id: 'wei_wu_zi', name: '魏武子', title: '晋之大夫', state: 'jin', city: 'quwo', birth: -700, death: -640, role: 'general',
    stats: { wu: 76, zhi: 70, zheng: 62, mei: 56 }, skills: { bingfa: 6, jianshu: 6 }, bias: 'shi', pref: 'tie', teach: ['jianshu'],
    quote: '从君于难，不敢有二。', desc: '从重耳出亡，后为晋之良将。' },

  
  
  { id: 'wu_ju', name: '伍举', title: '楚之大夫', state: 'chu', city: 'ying', birth: -620, death: -550, role: 'minister',
    stats: { wu: 44, zhi: 86, zheng: 80, mei: 68 }, skills: { biancai: 8, quanmou: 7 }, bias: 'ming', pref: 'qi', teach: ['biancai'],
    quote: '愿得归骨于楚。', desc: '伍子胥之祖，以直谏知名于楚。' },
  { id: 'shen_shu_shi', name: '申叔时', title: '楚之贤大夫', state: 'chu', city: 'shen', birth: -620, death: -560, role: 'scholar',
    stats: { wu: 32, zhi: 88, zheng: 84, mei: 70 }, skills: { xuewen: 9, biancai: 7 }, bias: 'yi', pref: 'si', teach: ['xuewen'],
    quote: '善为国者，赏不僭而刑不滥。', desc: '楚之老成，多所匡正，庄王亦敬惮之。' },

  { id: 'ji_wen_zi', name: '季文子', title: '鲁之上卿', state: 'lu', city: 'qufu', birth: -660, death: -568, role: 'minister',
    stats: { wu: 38, zhi: 84, zheng: 88, mei: 74 }, skills: { xuewen: 8, quanmou: 7 }, bias: 'yi', pref: 'si', teach: ['xuewen', 'quanmou'],
    quote: '妾不衣帛，马不食粟。', desc: '鲁之执政，以俭著称，三思而后行。' },
  { id: 'zang_wen_zhong', name: '臧文仲', title: '鲁之大夫', state: 'lu', city: 'qufu', birth: -700, death: -617, role: 'minister',
    stats: { wu: 36, zhi: 86, zheng: 82, mei: 70 }, skills: { xuewen: 9, biancai: 6 }, bias: 'yi', pref: 'yu', teach: ['xuewen'],
    quote: '居官者当事不避难。', desc: '鲁之老臣，历事四君，以博学多闻称。' },

  
  { id: 'si_ma_rang_ju', name: '司马穰苴', title: '齐之大司马', state: 'qi', city: 'linzi', birth: -590, death: -520, role: 'general',
    stats: { wu: 86, zhi: 84, zheng: 70, mei: 62 }, skills: { bingfa: 10, jianshu: 7 }, bias: 'shi', pref: 'ma', teach: ['bingfa'],
    quote: '将在军，君命有所不受。', desc: '斩庄贾以立威，晋燕之师闻之而退。' },

  { id: 'fan_wen_zi', name: '范文子', title: '晋之卿', state: 'jin', city: 'jiang', birth: -620, death: -574, role: 'minister',
    stats: { wu: 40, zhi: 88, zheng: 84, mei: 68 }, skills: { quanmou: 8, xuewen: 7 }, bias: 'yi', pref: 'si', teach: ['quanmou'],
    quote: '外宁必有内忧。', desc: '鄢陵之战后忧晋之必乱，果如其言。' },
  { id: 'luan_shu', name: '栾书', title: '晋之中军将', state: 'jin', city: 'jiang', birth: -620, death: -573, role: 'general',
    stats: { wu: 78, zhi: 82, zheng: 76, mei: 60 }, skills: { bingfa: 8, quanmou: 7 }, bias: 'shi', pref: 'tie', teach: ['bingfa'],
    quote: '师直为壮，曲为老。', desc: '晋之执政，鄢陵之战主帅，后弑厉公。' },

  { id: 'shen_bao_xu', name: '申包胥', title: '楚之大夫', state: 'chu', city: 'ying', birth: -560, death: -490, role: 'minister',
    stats: { wu: 42, zhi: 84, zheng: 80, mei: 74 }, skills: { biancai: 9, quanmou: 6 }, bias: 'yi', pref: 'si', teach: ['biancai'],
    quote: '子能复之，我必能兴之。', desc: '伍子胥之友，哭秦庭七日七夜，秦师乃出。' },
  { id: 'bo_pi', name: '伯嚭', title: '吴之太宰', state: 'wu', city: 'gusu', birth: -560, death: -473, role: 'minister',
    stats: { wu: 40, zhi: 80, zheng: 70, mei: 66 }, skills: { quanmou: 8, biancai: 7 }, bias: 'li', pref: 'yu', teach: ['quanmou'],
    quote: '越既服矣，何求焉？', desc: '吴之佞臣，受越之赂，谮杀伍子胥，吴遂亡。' },

  { id: 'gao_xi', name: '高傒', title: '齐之上卿', state: 'qi', city: 'linzi', birth: -730, death: -637, role: 'minister',
    stats: { wu: 60, zhi: 78, zheng: 84, mei: 68 }, skills: { quanmou: 7, biancai: 5 }, bias: 'yi', pref: 'si', teach: ['quanmou'],
    quote: '国有长君，社稷之福。', desc: '齐之世卿，与管仲同定桓公之位。' },
  { id: 'ning_qi', name: '宁戚', title: '齐之大夫', state: 'qi', city: 'linzi', birth: -720, death: -660, role: 'merchant',
    stats: { wu: 42, zhi: 84, zheng: 82, mei: 70 }, skills: { shanggu: 9, suanshu: 7, biancai: 6 }, bias: 'li', pref: 'su', teach: ['shanggu', 'suanshu'],
    quote: '浩浩乎白水！', desc: '饭牛车下，扣角而歌，桓公闻而异之，举为大夫。' },
  
];

export const NPC_MAP = Object.fromEntries(NPCS.map(n => [n.id, n]));

// 随机游士/剑客之名
export const WANDERER_NAMES = ['无名剑客', '游士', '负剑之徒', '落魄士人', '山野隐者', '行脚商人', '游方医者', '江湖客'];
export const BANDIT_NAMES = ['山贼', '草寇', '劫道者', '野盗', '亡命之徒'];

export const ROLE_NAMES = { ruler: '国君', minister: '卿相', general: '将帅', scholar: '名士', merchant: '富商', retainer: '门客' };

export function npcAlive(npc, year) {
  if (npc.birth != null && year < npc.birth) return false;
  if (npc.death != null && year > npc.death) return false;
  return true;
}
