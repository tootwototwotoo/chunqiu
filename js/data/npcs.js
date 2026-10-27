// 列国人物。birth/death 为负的公元前年份，null 表示不详（按出场年份判断）。
// role: ruler 国君 / minister 卿相 / general 将帅 / scholar 名士 / merchant 富商 / retainer 门客
// bias: li 好利 / yi 重义 / ming 好名 / shi 慕强（重实力与形势） —— 游说时的突破口
// pref: 偏爱的礼物；teach: 可传授的技能

export const NPCS = [
  { id: 'zheng_zhuang', name: '郑庄公', title: '郑伯', state: 'zheng', city: 'xinzheng', reign: [-722, -701], role: 'ruler',
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

  { id: 'qi_huan', name: '齐桓公', title: '齐侯', state: 'qi', city: 'linzi', birth: -716, death: -643, reign: [-685, -643], role: 'ruler',
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

  { id: 'lu_yin', name: '鲁隐公', title: '鲁侯', state: 'lu', city: 'qufu', birth: -730, death: -712, reign: [-722, -712], role: 'ruler',
    stats: { wu: 40, zhi: 58, zheng: 62, mei: 60 }, skills: { xuewen: 4, biancai: 3 }, bias: 'yi', pref: 'si', teach: ['xuewen'],
    quote: '礼，经国家、定社稷、序民人、利后嗣者也。',
    desc: '鲁国之君，摄位而治，好礼守正，然失于威断。' },

  { id: 'cao_gui', name: '曹刿', title: '鲁之谋士', state: 'lu', city: 'qufu', birth: -730, death: -660, role: 'general',
    stats: { wu: 64, zhi: 82, zheng: 48, mei: 58 }, skills: { bingfa: 7, quanmou: 5, jianshu: 4 }, bias: 'yi', pref: 'ge', teach: ['bingfa'],
    quote: '一鼓作气，再而衰，三而竭。',
    desc: '鲁国布衣，长勺之战论战于庄公，以弱胜强。' },

  { id: 'jin_wen', name: '晋文公', title: '晋侯', state: 'jin', city: 'jiang', birth: -697, death: -628, reign: [-636, -628], role: 'ruler',
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

  { id: 'chu_cheng', name: '楚成王', title: '楚王', state: 'chu', city: 'ying', birth: -700, death: -626, reign: [-671, -626], role: 'ruler',
    stats: { wu: 66, zhi: 76, zheng: 74, mei: 68 }, skills: { bingfa: 6, quanmou: 5 }, bias: 'shi', pref: 'qi', teach: ['bingfa'],
    quote: '楚虽蛮夷，亦欲观中国之政。',
    desc: '楚国之主，北向争衡，围宋救卫，一时兵威震于中原。' },

  { id: 'zi_wen', name: '子文', title: '楚之令尹', state: 'chu', city: 'ying', birth: -700, death: -630, role: 'minister',
    stats: { wu: 48, zhi: 86, zheng: 92, mei: 70 }, skills: { quanmou: 6, shanggu: 6, xuewen: 7 }, bias: 'yi', pref: 'qi', teach: ['shanggu', 'xuewen'],
    quote: '当官而行，何强之有？',
    desc: '楚之令尹，毁家纾难，治民有方，楚人颂之。' },

  { id: 'qin_mu', name: '秦穆公', title: '秦伯', state: 'qin', city: 'yong', birth: -683, death: -621, reign: [-659, -621], role: 'ruler',
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

  { id: 'song_xiang', name: '宋襄公', title: '宋公', state: 'song', city: 'shangqiu', birth: -680, death: -637, reign: [-650, -637], role: 'ruler',
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

  { id: 'wei_wen', name: '卫文公', title: '卫侯', state: 'wei', city: 'chaoge', reign: [-720, -635], role: 'ruler',
    stats: { wu: 48, zhi: 66, zheng: 72, mei: 62 }, skills: { shanggu: 5, xuewen: 4 }, bias: 'yi', pref: 'si', teach: ['shanggu'],
    quote: '卫之遗民，革车三十乘，今已三百乘矣。',
    desc: '卫国之君，国破之后励精图治，轻赋平罪，卫以复兴。' },

  { id: 'yan_zhuang', name: '燕庄公', title: '燕侯', state: 'yan', city: 'ji', reign: [-730, -658], role: 'ruler',
    stats: { wu: 44, zhi: 56, zheng: 58, mei: 60 }, skills: { bingfa: 3, xuewen: 3 }, bias: 'yi', pref: 'ge', teach: ['xuewen'],
    quote: '燕处北鄙，赖齐侯以安。',
    desc: '燕国之君，山戎侵伐，赖齐桓公救而存国。' },

  { id: 'chen_xuan', name: '陈宣公', title: '陈侯', state: 'chen', city: 'wanqiu', reign: [-720, -648], role: 'ruler',
    stats: { wu: 40, zhi: 54, zheng: 56, mei: 58 }, skills: { xuewen: 3 }, bias: 'ming', pref: 'qi', teach: ['xuewen'],
    quote: '陈，小国也，事大国以自安。',
    desc: '陈国之君，国小势微，周旋于晋楚之间。' },

  { id: 'cai_ai', name: '蔡哀公', title: '蔡侯', state: 'cai', city: 'shangcai', reign: [-730, -675], role: 'ruler',
    stats: { wu: 42, zhi: 46, zheng: 50, mei: 54 }, skills: { jianshu: 2 }, bias: 'ming', pref: 'mingzhu', teach: ['jianshu'],
    quote: '蔡人亦自有志。',
    desc: '蔡国之君，地薄兵弱，为楚所窥。' },

  { id: 'cao_gong', name: '曹共公', title: '曹伯', state: 'cao', city: 'tao', reign: [-720, -618], role: 'ruler',
    stats: { wu: 38, zhi: 44, zheng: 48, mei: 50 }, skills: { shanggu: 3 }, bias: 'li', pref: 'su', teach: ['shanggu'],
    quote: '陶为天下之中，商旅辐辏，寡人亦有以自养。',
    desc: '曹国之君，据陶之利，国小而富。' },

  { id: 'chu_zhuang', name: '楚庄王', title: '楚王', state: 'chu', city: 'ying', birth: -640, death: -591, reign: [-613, -591], role: 'ruler',
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

  { id: 'he_lu', name: '阖闾', title: '吴王', state: 'wu', city: 'gusu', birth: -537, death: -496, reign: [-515, -496], role: 'ruler',
    stats: { wu: 74, zhi: 78, zheng: 76, mei: 70 }, skills: { bingfa: 6, quanmou: 6 }, bias: 'shi', pref: 'tie', teach: ['bingfa'],
    quote: '吴虽僻远，愿与上图一争高下。',
    desc: '吴国之主，任伍胥、孙武，西破楚而入郢，东南之势成。' },

  { id: 'fu_cha', name: '夫差', title: '吴王', state: 'wu', city: 'gusu', birth: -528, death: -473, reign: [-495, -473], role: 'ruler',
    stats: { wu: 80, zhi: 62, zheng: 58, mei: 70 }, skills: { bingfa: 6, jianshu: 7 }, bias: 'ming', pref: 'xiang', teach: ['jianshu'],
    quote: '寡人岂敢忘越王之杀吾父耶！',
    desc: '吴国之主，夫椒胜越，黄池会盟，然矜功自伐，终为越所灭。' },

  { id: 'gou_jian', name: '勾践', title: '越王', state: 'yue', city: 'kuaiji', birth: -520, death: -465, reign: [-496, -465], role: 'ruler',
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
  
  // ---- 齐国世系 ----
  { id: 'qi_xiang', name: '齐襄公', title: '齐侯', state: 'qi', city: 'linzi', birth: -720, death: -686, reign: [-697, -686], role: 'ruler',
    stats: { wu: 64, zhi: 58, zheng: 52, mei: 60 }, skills: { jianshu: 5, bingfa: 4 }, bias: 'shi', pref: 'ma', teach: ['jianshu'],
    quote: '及瓜而代。', desc: '齐僖公之子，通于文姜，杀鲁桓公。后为公孙无知所弑。' },
  { id: 'qi_xiao', name: '齐孝公', title: '齐侯', state: 'qi', city: 'linzi', reign: [-642, -633], role: 'ruler',
    stats: { wu: 50, zhi: 60, zheng: 56, mei: 58 }, skills: { quanmou: 4 }, bias: 'yi', pref: 'si', teach: ['quanmou'],
    quote: '寡人赖先君之灵。', desc: '桓公之子，奔宋，宋襄公率诸侯伐齐而立之。' },
  { id: 'qi_zhao', name: '齐昭公', title: '齐侯', state: 'qi', city: 'linzi', reign: [-632, -613], role: 'ruler',
    stats: { wu: 46, zhi: 62, zheng: 58, mei: 56 }, skills: { quanmou: 5 }, bias: 'li', pref: 'yan', teach: ['quanmou'],
    quote: '晋方强，不可与之争。', desc: '孝公之弟，在位时晋楚争雄，齐事晋。' },
  { id: 'qi_qing', name: '齐顷公', title: '齐侯', state: 'qi', city: 'linzi', reign: [-598, -582], role: 'ruler',
    stats: { wu: 58, zhi: 56, zheng: 54, mei: 62 }, skills: { jianshu: 4, quanmou: 3 }, bias: 'shi', pref: 'ma', teach: ['jianshu'],
    quote: '余姑翦灭此而朝食。', desc: '鞍之战为晋所败，几被擒。后归而与晋盟。' },
  { id: 'qi_ling', name: '齐灵公', title: '齐侯', state: 'qi', city: 'linzi', reign: [-581, -554], role: 'ruler',
    stats: { wu: 54, zhi: 58, zheng: 60, mei: 58 }, skills: { bingfa: 5 }, bias: 'shi', pref: 'tie', teach: ['bingfa'],
    quote: '诸侯皆叛，寡人独守。', desc: '屡与晋争，平阴之役为晋所败。' },
  { id: 'qi_jing', name: '齐景公', title: '齐侯', state: 'qi', city: 'linzi', reign: [-547, -490], role: 'ruler',
    stats: { wu: 50, zhi: 68, zheng: 66, mei: 66 }, skills: { quanmou: 6, biancai: 4 }, bias: 'ming', pref: 'yu', teach: ['quanmou'],
    quote: '君若欲之，何患无有？', desc: '在位五十八年，晏婴佐之，齐国稍安。' },

  // ---- 晋国世系 ----
  { id: 'jin_xian', name: '晋献公', title: '晋侯', state: 'jin', city: 'jiang', birth: -710, death: -651, reign: [-676, -651], role: 'ruler',
    stats: { wu: 60, zhi: 66, zheng: 60, mei: 54 }, skills: { bingfa: 6, quanmou: 5 }, bias: 'shi', pref: 'ma', teach: ['bingfa'],
    quote: '假道于虞以伐虢。', desc: '并国十七，服国三十八。然宠骊姬，杀太子申生，晋乱自此始。' },
  { id: 'jin_hui', name: '晋惠公', title: '晋侯', state: 'jin', city: 'jiang', reign: [-650, -637], role: 'ruler',
    stats: { wu: 48, zhi: 58, zheng: 52, mei: 50 }, skills: { quanmou: 5 }, bias: 'li', pref: 'su', teach: ['quanmou'],
    quote: '吾争国于外，奈何以信？', desc: '背秦赂，韩原之败为秦所虏。' },
  { id: 'jin_xiang', name: '晋襄公', title: '晋侯', state: 'jin', city: 'jiang', reign: [-627, -621], role: 'ruler',
    stats: { wu: 66, zhi: 70, zheng: 68, mei: 60 }, skills: { bingfa: 7, quanmou: 5 }, bias: 'shi', pref: 'tie', teach: ['bingfa'],
    quote: '秦人袭郑无功，可邀于殽。', desc: '文公之子，殽之战败秦师，继父之霸。' },
  { id: 'jin_ling', name: '晋灵公', title: '晋侯', state: 'jin', city: 'jiang', reign: [-620, -607], role: 'ruler',
    stats: { wu: 44, zhi: 50, zheng: 40, mei: 46 }, skills: { jianshu: 2 }, bias: 'li', pref: 'yu', teach: ['jianshu'],
    quote: '厚敛以雕墙。', desc: '不君，为赵穿所弑。' },
  { id: 'jin_jing', name: '晋景公', title: '晋侯', state: 'jin', city: 'jiang', reign: [-599, -581], role: 'ruler',
    stats: { wu: 58, zhi: 70, zheng: 66, mei: 58 }, skills: { bingfa: 6, quanmou: 6 }, bias: 'shi', pref: 'ma', teach: ['bingfa'],
    quote: '尔无我诈。', desc: '邲之战败于楚，鞍之战败齐，晋势复振。' },
  { id: 'jin_dao', name: '晋悼公', title: '晋侯', state: 'jin', city: 'jiang', birth: -586, death: -558, reign: [-573, -558], role: 'ruler',
    stats: { wu: 56, zhi: 76, zheng: 74, mei: 64 }, skills: { quanmou: 8, biancai: 6 }, bias: 'yi', pref: 'si', teach: ['quanmou'],
    quote: '寡人始复先君之业。', desc: '十四岁即位，修政息民，三驾而楚不能与争。' },
  { id: 'jin_ping', name: '晋平公', title: '晋侯', state: 'jin', city: 'jiang', reign: [-557, -532], role: 'ruler',
    stats: { wu: 46, zhi: 60, zheng: 56, mei: 54 }, skills: { quanmou: 4 }, bias: 'ming', pref: 'yu', teach: ['quanmou'],
    quote: '吾国方盛，何忧于楚。', desc: '弭兵之会，晋楚分伯。政在六卿，公室渐卑。' },

  // ---- 楚国世系 ----
  { id: 'chu_wen', name: '楚文王', title: '楚王', state: 'chu', city: 'ying', reign: [-689, -677], role: 'ruler',
    stats: { wu: 68, zhi: 64, zheng: 58, mei: 58 }, skills: { bingfa: 7 }, bias: 'shi', pref: 'ma', teach: ['bingfa'],
    quote: '吾用兵于汉东，诸侯莫敢抗。', desc: '始都郢，灭申息，楚势始张。' },
  { id: 'chu_mu', name: '楚穆王', title: '楚王', state: 'chu', city: 'ying', reign: [-625, -614], role: 'ruler',
    stats: { wu: 60, zhi: 62, zheng: 60, mei: 54 }, skills: { bingfa: 5, quanmou: 5 }, bias: 'shi', pref: 'tie', teach: ['bingfa'],
    quote: '楚之霸，自吾始。', desc: '弑父自立，灭江六蓼，楚势盛。' },
  { id: 'chu_gong', name: '楚共王', title: '楚王', state: 'chu', city: 'ying', reign: [-590, -560], role: 'ruler',
    stats: { wu: 54, zhi: 66, zheng: 64, mei: 58 }, skills: { bingfa: 6, quanmou: 5 }, bias: 'yi', pref: 'si', teach: ['bingfa'],
    quote: '请为鄢陵之盟。', desc: '鄢陵之战为晋所败，伤目。' },
  { id: 'chu_kang', name: '楚康王', title: '楚王', state: 'chu', city: 'ying', reign: [-559, -545], role: 'ruler',
    stats: { wu: 50, zhi: 64, zheng: 62, mei: 56 }, skills: { quanmou: 5 }, bias: 'li', pref: 'qi', teach: ['quanmou'],
    quote: '弭兵之会，楚亦与焉。', desc: '与晋分伯，天下息兵。' },

  // ---- 秦国世系 ----
  { id: 'qin_de', name: '秦德公', title: '秦伯', state: 'qin', city: 'yong', reign: [-677, -676], role: 'ruler',
    stats: { wu: 50, zhi: 58, zheng: 56, mei: 52 }, skills: { quanmou: 4 }, bias: 'yi', pref: 'su', teach: ['quanmou'],
    quote: '居雍，子孙饮马于河。', desc: '始居雍城，后秦都于此三百年。' },
  { id: 'qin_cheng', name: '秦成公', title: '秦伯', state: 'qin', city: 'yong', reign: [-663, -660], role: 'ruler',
    stats: { wu: 48, zhi: 56, zheng: 54, mei: 50 }, skills: { quanmou: 4 }, bias: 'li', pref: 'ma', teach: ['quanmou'],
    quote: '秦僻在西陲，未与中国会盟。', desc: '穆公之兄，在位四年。' },
  { id: 'qin_kang', name: '秦康公', title: '秦伯', state: 'qin', city: 'yong', reign: [-620, -609], role: 'ruler',
    stats: { wu: 52, zhi: 58, zheng: 56, mei: 54 }, skills: { bingfa: 5 }, bias: 'shi', pref: 'ma', teach: ['bingfa'],
    quote: '我送舅氏，曰至渭阳。', desc: '穆公之子，与晋屡战。' },
  { id: 'qin_huan', name: '秦桓公', title: '秦伯', state: 'qin', city: 'yong', reign: [-603, -577], role: 'ruler',
    stats: { wu: 50, zhi: 56, zheng: 52, mei: 50 }, skills: { bingfa: 4 }, bias: 'shi', pref: 'tie', teach: ['bingfa'],
    quote: '河曲之盟，背之何伤。', desc: '与晋争，麻隧之战为晋所败。' },
  { id: 'qin_ai', name: '秦哀公', title: '秦伯', state: 'qin', city: 'yong', birth: -560, death: -501, reign: [-536, -501], role: 'ruler',
    stats: { wu: 44, zhi: 60, zheng: 58, mei: 56 }, skills: { quanmou: 4 }, bias: 'yi', pref: 'si', teach: ['quanmou'],
    quote: '楚虽无道，秦岂无义。', desc: '申包胥哭秦庭，哀公赋无衣，出师救楚。' },

  // ---- 鲁国世系 ----
  { id: 'lu_huan', name: '鲁桓公', title: '鲁侯', state: 'lu', city: 'qufu', birth: -731, death: -694, reign: [-711, -694], role: 'ruler',
    stats: { wu: 52, zhi: 56, zheng: 58, mei: 56 }, skills: { quanmou: 4 }, bias: 'yi', pref: 'si', teach: ['quanmou'],
    quote: '吾与舅氏，好会于泺。', desc: '与齐襄公会，为齐所杀，鲁人讳之。' },
  { id: 'lu_zhuang', name: '鲁庄公', title: '鲁侯', state: 'lu', city: 'qufu', birth: -706, death: -662, reign: [-693, -662], role: 'ruler',
    stats: { wu: 62, zhi: 60, zheng: 58, mei: 60 }, skills: { jianshu: 5, bingfa: 5 }, bias: 'shi', pref: 'ma', teach: ['bingfa'],
    quote: '长勺之役，曹刿请见。', desc: '用曹刿败齐于长勺，鲁势稍振。' },
  { id: 'lu_wen', name: '鲁文公', title: '鲁侯', state: 'lu', city: 'qufu', reign: [-625, -609], role: 'ruler',
    stats: { wu: 44, zhi: 58, zheng: 60, mei: 58 }, skills: { xuewen: 5 }, bias: 'yi', pref: 'si', teach: ['xuewen'],
    quote: '君子以为知礼。', desc: '在位时晋楚争雄，鲁事晋。' },
  { id: 'lu_xuan', name: '鲁宣公', title: '鲁侯', state: 'lu', city: 'qufu', reign: [-608, -591], role: 'ruler',
    stats: { wu: 46, zhi: 56, zheng: 62, mei: 56 }, skills: { quanmou: 5 }, bias: 'li', pref: 'yan', teach: ['quanmou'],
    quote: '初税亩。', desc: '始税亩，改井田之制。' },
  { id: 'lu_zhao', name: '鲁昭公', title: '鲁侯', state: 'lu', city: 'qufu', reign: [-541, -510], role: 'ruler',
    stats: { wu: 42, zhi: 58, zheng: 50, mei: 54 }, skills: { xuewen: 4 }, bias: 'yi', pref: 'yu', teach: ['xuewen'],
    quote: '吾闻之，为善者天报以福。', desc: '伐季氏不克，出奔，客死于晋。' },

  // ---- 宋国世系 ----
  { id: 'song_shang', name: '宋殇公', title: '宋公', state: 'song', city: 'shangqiu', reign: [-719, -711], role: 'ruler',
    stats: { wu: 52, zhi: 54, zheng: 50, mei: 50 }, skills: { bingfa: 4 }, bias: 'shi', pref: 'tie', teach: ['bingfa'],
    quote: '十年十一战，民不堪命。', desc: '在位十年而十一战，为华督所弑。' },
  { id: 'song_huan', name: '宋桓公', title: '宋公', state: 'song', city: 'shangqiu', reign: [-681, -651], role: 'ruler',
    stats: { wu: 50, zhi: 60, zheng: 58, mei: 54 }, skills: { quanmou: 5 }, bias: 'ming', pref: 'yu', teach: ['quanmou'],
    quote: '吾从齐侯，会于北杏。', desc: '从齐桓公，参葵丘之会。' },
  { id: 'song_cheng', name: '宋成公', title: '宋公', state: 'song', city: 'shangqiu', reign: [-636, -620], role: 'ruler',
    stats: { wu: 48, zhi: 58, zheng: 56, mei: 54 }, skills: { quanmou: 4 }, bias: 'yi', pref: 'si', teach: ['quanmou'],
    quote: '晋文公昔过于宋，有礼于吾先君。', desc: '背楚即晋，城濮之战从晋。' },
  { id: 'song_zhao', name: '宋昭公', title: '宋公', state: 'song', city: 'shangqiu', reign: [-619, -611], role: 'ruler',
    stats: { wu: 42, zhi: 50, zheng: 46, mei: 48 }, skills: {}, bias: 'li', pref: 'yu', teach: [],
    quote: '人不我信，我独何为。', desc: '无道，为襄夫人所杀。' },

  // ---- 补齐世系空档 ----
  { id: 'qi_yi', name: '齐懿公', title: '齐侯', state: 'qi', city: 'linzi', reign: [-612, -609], role: 'ruler',
    stats: { wu: 50, zhi: 48, zheng: 44, mei: 50 }, skills: { jianshu: 3 }, bias: 'li', pref: 'yu', teach: ['jianshu'],
    quote: '夺其妻而以为御。', desc: '弑君自立，骄纵无道，为邴歜、阎职所弑。' },
  { id: 'qi_hui', name: '齐惠公', title: '齐侯', state: 'qi', city: 'linzi', reign: [-608, -599], role: 'ruler',
    stats: { wu: 46, zhi: 56, zheng: 54, mei: 52 }, skills: { quanmou: 4 }, bias: 'yi', pref: 'si', teach: ['quanmou'],
    quote: '鲁人來朝，吾与之盟。', desc: '齐乱既定，与鲁盟于郪丘。' },
  { id: 'qi_yan', name: '齐晏孺子', title: '齐侯', state: 'qi', city: 'linzi', reign: [-489, -489], role: 'ruler',
    stats: { wu: 30, zhi: 40, zheng: 36, mei: 44 }, skills: {}, bias: 'yi', pref: 'su', teach: [],
    quote: '', desc: '景公少子，立未逾年而见杀。' },

  { id: 'jin_you', name: '晋幽公', title: '晋侯', state: 'jin', city: 'jiang', reign: [-433, -416], role: 'ruler',
    stats: { wu: 36, zhi: 44, zheng: 40, mei: 44 }, skills: {}, bias: 'yi', pref: 'su', teach: [],
    quote: '晋侯畏韩赵魏，反朝于三家。', desc: '公室卑弱，反朝于韩赵魏之君。' },

  { id: 'lu_min', name: '鲁闵公', title: '鲁侯', state: 'lu', city: 'qufu', birth: -675, death: -660, reign: [-661, -660], role: 'ruler',
    stats: { wu: 36, zhi: 48, zheng: 44, mei: 48 }, skills: {}, bias: 'yi', pref: 'si', teach: [],
    quote: '庆父不死，鲁难未已。', desc: '即位二年，为庆父所弑。' },
  { id: 'lu_xi', name: '鲁僖公', title: '鲁侯', state: 'lu', city: 'qufu', reign: [-659, -627], role: 'ruler',
    stats: { wu: 52, zhi: 64, zheng: 62, mei: 60 }, skills: { xuewen: 6, biancai: 5 }, bias: 'yi', pref: 'si', teach: ['xuewen', 'biancai'],
    quote: '淮夷来侵，吾从齐侯讨之。', desc: '从齐桓公伐楚，参葵丘之会。鲁势稍振。' },
  { id: 'lu_cheng', name: '鲁成公', title: '鲁侯', state: 'lu', city: 'qufu', reign: [-590, -573], role: 'ruler',
    stats: { wu: 44, zhi: 56, zheng: 58, mei: 54 }, skills: { quanmou: 4 }, bias: 'yi', pref: 'si', teach: ['quanmou'],
    quote: '晋楚争，鲁在其间。', desc: '鞍之战从晋，鄢陵之战亦从晋。' },
  { id: 'lu_xiang', name: '鲁襄公', title: '鲁侯', state: 'lu', city: 'qufu', reign: [-572, -542], role: 'ruler',
    stats: { wu: 42, zhi: 62, zheng: 60, mei: 58 }, skills: { xuewen: 6 }, bias: 'yi', pref: 'si', teach: ['xuewen'],
    quote: '季孙氏专鲁，公室空。', desc: '在位三十一年，政在三桓。' },
  { id: 'lu_ding', name: '鲁定公', title: '鲁侯', state: 'lu', city: 'qufu', reign: [-509, -495], role: 'ruler',
    stats: { wu: 44, zhi: 58, zheng: 56, mei: 60 }, skills: { xuewen: 5 }, bias: 'yi', pref: 'si', teach: ['xuewen'],
    quote: '孔子为司寇，鲁国大治。', desc: '用孔子，夹谷之会以礼折齐。' },

  { id: 'song_mu', name: '宋穆公', title: '宋公', state: 'song', city: 'shangqiu', reign: [-728, -720], role: 'ruler',
    stats: { wu: 46, zhi: 58, zheng: 60, mei: 54 }, skills: { xuewen: 5 }, bias: 'yi', pref: 'si', teach: ['xuewen'],
    quote: '先君舍与夷而立寡人，寡人弗敢忘。', desc: '让国于殇公，宋之贤君。' },
  { id: 'song_zhuang', name: '宋庄公', title: '宋公', state: 'song', city: 'shangqiu', reign: [-710, -692], role: 'ruler',
    stats: { wu: 50, zhi: 52, zheng: 48, mei: 50 }, skills: { quanmou: 4 }, bias: 'li', pref: 'yu', teach: ['quanmou'],
    quote: '吾纳郑伯，取其赂。', desc: '助郑厉公复位，索赂无厌。' },
  { id: 'song_min', name: '宋闵公', title: '宋公', state: 'song', city: 'shangqiu', reign: [-691, -682], role: 'ruler',
    stats: { wu: 52, zhi: 46, zheng: 44, mei: 48 }, skills: { jianshu: 3 }, bias: 'shi', pref: 'ma', teach: ['jianshu'],
    quote: '始吾敬子，今子，鲁囚也。', desc: '戏南宫万，为万所弑。' },

  { id: 'qin_ning', name: '秦宁公', title: '秦伯', state: 'qin', city: 'yong', reign: [-716, -704], role: 'ruler',
    stats: { wu: 56, zhi: 54, zheng: 50, mei: 50 }, skills: { bingfa: 4 }, bias: 'shi', pref: 'ma', teach: ['bingfa'],
    quote: '秦居西垂，与戎争。', desc: '徙居平阳，与戎战。' },
  { id: 'qin_wu', name: '秦武公', title: '秦伯', state: 'qin', city: 'yong', reign: [-697, -678], role: 'ruler',
    stats: { wu: 62, zhi: 56, zheng: 52, mei: 52 }, skills: { bingfa: 5, jianshu: 4 }, bias: 'shi', pref: 'tie', teach: ['bingfa'],
    quote: '初县杜郑。', desc: '始置县，灭小虢。秦势始张。' },
  { id: 'qin_gong', name: '秦共公', title: '秦伯', state: 'qin', city: 'yong', reign: [-608, -604], role: 'ruler',
    stats: { wu: 48, zhi: 54, zheng: 52, mei: 50 }, skills: { quanmou: 3 }, bias: 'li', pref: 'su', teach: ['quanmou'],
    quote: '秦晋之交，屡绝屡复。', desc: '在位五年，与晋相攻。' },
  { id: 'qin_jing', name: '秦景公', title: '秦伯', state: 'qin', city: 'yong', reign: [-576, -537], role: 'ruler',
    stats: { wu: 56, zhi: 62, zheng: 58, mei: 54 }, skills: { bingfa: 5, quanmou: 5 }, bias: 'shi', pref: 'ma', teach: ['bingfa'],
    quote: '秦晋之好，自此绝矣。', desc: '与晋争霸西陲，联楚抗晋。' },

  { id: 'chu_du', name: '楚堵敖', title: '楚王', state: 'chu', city: 'ying', reign: [-676, -672], role: 'ruler',
    stats: { wu: 44, zhi: 46, zheng: 42, mei: 46 }, skills: {}, bias: 'li', pref: 'yu', teach: [],
    quote: '', desc: '文王之子，为弟恽所弑。' },
  { id: 'chu_jia', name: '楚郏敖', title: '楚王', state: 'chu', city: 'ying', reign: [-544, -541], role: 'ruler',
    stats: { wu: 40, zhi: 48, zheng: 44, mei: 46 }, skills: {}, bias: 'yi', pref: 'su', teach: [],
    quote: '', desc: '康王之子，为叔父围所弑。' },
  { id: 'chu_ling', name: '楚灵王', title: '楚王', state: 'chu', city: 'ying', reign: [-540, -529], role: 'ruler',
    stats: { wu: 60, zhi: 58, zheng: 50, mei: 58 }, skills: { bingfa: 5 }, bias: 'shi', pref: 'yu', teach: ['bingfa'],
    quote: '吾欲求鼎于周。', desc: '章华之台，细腰之宫。会诸侯于申，后为弃疾所篡，自缢。' },
  { id: 'chu_ping', name: '楚平王', title: '楚王', state: 'chu', city: 'ying', reign: [-528, -516], role: 'ruler',
    stats: { wu: 46, zhi: 60, zheng: 54, mei: 56 }, skills: { quanmou: 6 }, bias: 'li', pref: 'yu', teach: ['quanmou'],
    quote: '吾闻之，仁者不违其亲。', desc: '纳太子建之妇，杀伍奢父子，伍子胥奔吴。' },
  { id: 'chu_zhao', name: '楚昭王', title: '楚王', state: 'chu', city: 'ying', reign: [-515, -489], role: 'ruler',
    stats: { wu: 50, zhi: 64, zheng: 62, mei: 58 }, skills: { quanmou: 5 }, bias: 'yi', pref: 'si', teach: ['quanmou'],
    quote: '楚国之有难，寡人之罪也。', desc: '吴入郢，出奔随。后复国。' },
  { id: 'chu_hui', name: '楚惠王', title: '楚王', state: 'chu', city: 'ying', reign: [-488, -432], role: 'ruler',
    stats: { wu: 48, zhi: 66, zheng: 64, mei: 58 }, skills: { quanmou: 6 }, bias: 'li', pref: 'qi', teach: ['quanmou'],
    quote: '楚复强矣。', desc: '灭陈、蔡、杞，楚复振。' },

  // ---- 补齐早期与末期世系 ----
  { id: 'qi_zhuang', name: '齐庄公', title: '齐侯', state: 'qi', city: 'linzi', reign: [-794, -731], role: 'ruler',
    stats: { wu: 54, zhi: 56, zheng: 54, mei: 54 }, skills: { bingfa: 4 }, bias: 'shi', pref: 'ma', teach: ['bingfa'],
    quote: '齐自太公以来，为东方大国。', desc: '齐之先君，在位六十四年。' },
  { id: 'qi_li', name: '齐釐公', title: '齐侯', state: 'qi', city: 'linzi', reign: [-730, -698], role: 'ruler',
    stats: { wu: 52, zhi: 58, zheng: 56, mei: 56 }, skills: { quanmou: 5 }, bias: 'yi', pref: 'si', teach: ['quanmou'],
    quote: '吾与郑伯，共奖王室。', desc: '齐襄公之父，与郑庄公并为东方之望。' },
  { id: 'qi_dao', name: '齐悼公', title: '齐侯', state: 'qi', city: 'linzi', reign: [-488, -485], role: 'ruler',
    stats: { wu: 42, zhi: 50, zheng: 46, mei: 50 }, skills: { quanmou: 3 }, bias: 'li', pref: 'yu', teach: ['quanmou'],
    quote: '鲍子与我盟。', desc: '为陈乞所立，未几见弑。' },
  { id: 'qi_jian', name: '齐简公', title: '齐侯', state: 'qi', city: 'linzi', reign: [-484, -481], role: 'ruler',
    stats: { wu: 44, zhi: 52, zheng: 48, mei: 50 }, skills: { quanmou: 3 }, bias: 'yi', pref: 'si', teach: ['quanmou'],
    quote: '吾早从诸御鞅之言，不及此。', desc: '为陈恒所弑，齐政尽归陈氏。' },
  { id: 'qi_ping', name: '齐平公', title: '齐侯', state: 'qi', city: 'linzi', reign: [-480, -456], role: 'ruler',
    stats: { wu: 40, zhi: 54, zheng: 50, mei: 48 }, skills: { quanmou: 4 }, bias: 'yi', pref: 'si', teach: ['quanmou'],
    quote: '齐国之政，皆归陈氏。', desc: '陈恒所立，公室虚位而已。' },

  { id: 'jin_xiao', name: '晋孝侯', title: '晋侯', state: 'jin', city: 'jiang', reign: [-739, -724], role: 'ruler',
    stats: { wu: 48, zhi: 50, zheng: 48, mei: 48 }, skills: { bingfa: 3 }, bias: 'shi', pref: 'tie', teach: ['bingfa'],
    quote: '曲沃日强，翼日弱。', desc: '曲沃庄伯弑之，晋之内乱自此始。' },
  { id: 'jin_e', name: '晋鄂侯', title: '晋侯', state: 'jin', city: 'jiang', reign: [-723, -718], role: 'ruler',
    stats: { wu: 46, zhi: 48, zheng: 46, mei: 46 }, skills: {}, bias: 'yi', pref: 'su', teach: [],
    quote: '', desc: '孝侯之子，奔随。' },
  { id: 'jin_ai', name: '晋哀侯', title: '晋侯', state: 'jin', city: 'jiang', reign: [-717, -710], role: 'ruler',
    stats: { wu: 52, zhi: 46, zheng: 44, mei: 46 }, skills: { jianshu: 3 }, bias: 'shi', pref: 'ma', teach: ['jianshu'],
    quote: '曲沃之兵，何以当之。', desc: '为曲沃武公所虏。' },
  { id: 'jin_hou_min', name: '晋侯缗', title: '晋侯', state: 'jin', city: 'jiang', reign: [-709, -678], role: 'ruler',
    stats: { wu: 44, zhi: 48, zheng: 46, mei: 46 }, skills: {}, bias: 'yi', pref: 'su', teach: [],
    quote: '', desc: '晋之末侯，为曲沃武公所灭。' },
  { id: 'jin_cheng', name: '晋成公', title: '晋侯', state: 'jin', city: 'jiang', reign: [-606, -600], role: 'ruler',
    stats: { wu: 48, zhi: 58, zheng: 56, mei: 52 }, skills: { quanmou: 4 }, bias: 'yi', pref: 'si', teach: ['quanmou'],
    quote: '吾以庶孽得国。', desc: '灵公被弑后，赵盾迎立之。' },
  { id: 'jin_li', name: '晋厉公', title: '晋侯', state: 'jin', city: 'jiang', reign: [-580, -574], role: 'ruler',
    stats: { wu: 60, zhi: 54, zheng: 48, mei: 50 }, skills: { bingfa: 6, jianshu: 4 }, bias: 'shi', pref: 'tie', teach: ['bingfa'],
    quote: '吾欲尽去群大夫。', desc: '鄢陵之战胜楚，后欲诛群大夫，反为所弑。' },
  { id: 'jin_zhao', name: '晋昭公', title: '晋侯', state: 'jin', city: 'jiang', reign: [-531, -526], role: 'ruler',
    stats: { wu: 44, zhi: 56, zheng: 52, mei: 50 }, skills: { quanmou: 4 }, bias: 'ming', pref: 'yu', teach: ['quanmou'],
    quote: '晋之政，在六卿。', desc: '平公之子，在位六年，公室益卑。' },
  { id: 'jin_qing', name: '晋顷公', title: '晋侯', state: 'jin', city: 'jiang', reign: [-525, -512], role: 'ruler',
    stats: { wu: 40, zhi: 54, zheng: 50, mei: 48 }, skills: { quanmou: 4 }, bias: 'yi', pref: 'si', teach: ['quanmou'],
    quote: '六卿强，公室卑。', desc: '铸刑鼎，政在私门。' },
  { id: 'jin_ding', name: '晋定公', title: '晋侯', state: 'jin', city: 'jiang', reign: [-511, -475], role: 'ruler',
    stats: { wu: 42, zhi: 58, zheng: 54, mei: 50 }, skills: { quanmou: 5 }, bias: 'yi', pref: 'si', teach: ['quanmou'],
    quote: '黄池之会，我与吴争长。', desc: '与吴王夫差会于黄池争长，晋犹能为诸侯先。' },

  { id: 'chu_ruo', name: '楚若敖', title: '楚君', state: 'chu', city: 'ying', reign: [-790, -764], role: 'ruler',
    stats: { wu: 50, zhi: 48, zheng: 44, mei: 46 }, skills: { bingfa: 3 }, bias: 'shi', pref: 'ma', teach: ['bingfa'],
    quote: '楚之先君，筚路蓝缕。', desc: '楚之先君，始强于江汉之间。' },
  { id: 'chu_fen', name: '楚蚡冒', title: '楚君', state: 'chu', city: 'ying', reign: [-757, -741], role: 'ruler',
    stats: { wu: 54, zhi: 50, zheng: 46, mei: 48 }, skills: { bingfa: 4 }, bias: 'shi', pref: 'ma', teach: ['bingfa'],
    quote: '楚自蚡冒，始启濮地。', desc: '楚势始张，为文王称王张本。' },

  { id: 'qin_wen', name: '秦文公', title: '秦伯', state: 'qin', city: 'yong', reign: [-765, -717], role: 'ruler',
    stats: { wu: 56, zhi: 54, zheng: 52, mei: 50 }, skills: { bingfa: 4 }, bias: 'shi', pref: 'ma', teach: ['bingfa'],
    quote: '秦始有史，以纪事。', desc: '东猎至汧渭之会，始有史官纪事。' },
  { id: 'qin_dao', name: '秦悼公', title: '秦伯', state: 'qin', city: 'yong', reign: [-490, -477], role: 'ruler',
    stats: { wu: 46, zhi: 56, zheng: 52, mei: 50 }, skills: { quanmou: 4 }, bias: 'yi', pref: 'si', teach: ['quanmou'],
    quote: '秦处西陲，静以待时。', desc: '在位十四年，秦稍安。' },

  { id: 'lu_hui', name: '鲁惠公', title: '鲁侯', state: 'lu', city: 'qufu', reign: [-768, -723], role: 'ruler',
    stats: { wu: 50, zhi: 56, zheng: 58, mei: 54 }, skills: { xuewen: 5 }, bias: 'yi', pref: 'si', teach: ['xuewen'],
    quote: '鲁秉周礼，最为守礼之国。', desc: '隐公之父，鲁之守礼者。' },
  { id: 'lu_ai', name: '鲁哀公', title: '鲁侯', state: 'lu', city: 'qufu', reign: [-494, -468], role: 'ruler',
    stats: { wu: 42, zhi: 58, zheng: 52, mei: 54 }, skills: { xuewen: 5 }, bias: 'yi', pref: 'si', teach: ['xuewen'],
    quote: '寡人生于深宫之中，未尝知哀。', desc: '孔子卒于其世，三桓益强，公奔越。' },

  { id: 'song_ding', name: '宋戴公', title: '宋公', state: 'song', city: 'shangqiu', reign: [-799, -766], role: 'ruler',
    stats: { wu: 48, zhi: 50, zheng: 46, mei: 48 }, skills: { xuewen: 3 }, bias: 'yi', pref: 'si', teach: ['xuewen'],
    quote: '宋为殷后，守商之礼。', desc: '宋之先公，戴族之所自出。' },
  { id: 'song_wu', name: '宋武公', title: '宋公', state: 'song', city: 'shangqiu', reign: [-765, -748], role: 'ruler',
    stats: { wu: 54, zhi: 50, zheng: 48, mei: 48 }, skills: { bingfa: 3 }, bias: 'shi', pref: 'ma', teach: ['bingfa'],
    quote: '狄伐宋，吾御之。', desc: '宋之长公，与狄战。' },
  { id: 'song_xuan', name: '宋宣公', title: '宋公', state: 'song', city: 'shangqiu', reign: [-747, -729], role: 'ruler',
    stats: { wu: 46, zhi: 54, zheng: 56, mei: 50 }, skills: { xuewen: 4 }, bias: 'yi', pref: 'si', teach: ['xuewen'],
    quote: '父死子继，兄死弟及，天下通义也。', desc: '让位于弟穆公，宋人贤之。' },
  { id: 'song_dao', name: '宋悼公', title: '宋公', state: 'song', city: 'shangqiu', reign: [-610, -590], role: 'ruler',
    stats: { wu: 42, zhi: 50, zheng: 48, mei: 48 }, skills: {}, bias: 'li', pref: 'yu', teach: [],
    quote: '', desc: '宋之衰世，政在六卿之后。' },
  { id: 'song_ping', name: '宋平公', title: '宋公', state: 'song', city: 'shangqiu', reign: [-575, -532], role: 'ruler',
    stats: { wu: 44, zhi: 58, zheng: 56, mei: 52 }, skills: { quanmou: 5 }, bias: 'yi', pref: 'si', teach: ['quanmou'],
    quote: '向戌弭兵，吾与焉。', desc: '在位四十四年，向戌合晋楚之成。' },
  { id: 'song_yuan', name: '宋元公', title: '宋公', state: 'song', city: 'shangqiu', reign: [-531, -517], role: 'ruler',
    stats: { wu: 40, zhi: 54, zheng: 50, mei: 50 }, skills: { quanmou: 4 }, bias: 'li', pref: 'yu', teach: ['quanmou'],
    quote: '华氏为乱，吾出奔。', desc: '华氏、向氏之乱，公奔亡。' },
  { id: 'song_jing', name: '宋景公', title: '宋公', state: 'song', city: 'shangqiu', reign: [-516, -451], role: 'ruler',
    stats: { wu: 46, zhi: 60, zheng: 58, mei: 54 }, skills: { quanmou: 5 }, bias: 'yi', pref: 'si', teach: ['quanmou'],
    quote: '宋小而固，未可轻也。', desc: '在位六十四年，宋得稍安。' },

  { id: 'chu_xiao', name: '楚霄敖', title: '楚君', state: 'chu', city: 'ying', reign: [-763, -758], role: 'ruler',
    stats: { wu: 46, zhi: 46, zheng: 42, mei: 44 }, skills: { bingfa: 3 }, bias: 'shi', pref: 'ma', teach: ['bingfa'],
    quote: '楚处荆山，自为一部。', desc: '蚡冒之兄，楚之先君。' },
  { id: 'chu_li', name: '楚厉王', title: '楚君', state: 'chu', city: 'ying', reign: [-740, -727], role: 'ruler',
    stats: { wu: 50, zhi: 46, zheng: 44, mei: 46 }, skills: { bingfa: 3 }, bias: 'shi', pref: 'tie', teach: ['bingfa'],
    quote: '楚人谓我曰厉。', desc: '蚡冒之弟，楚势渐强。' },
  { id: 'chu_wu', name: '楚武王', title: '楚王', state: 'chu', city: 'ying', reign: [-726, -690], role: 'ruler',
    stats: { wu: 66, zhi: 62, zheng: 56, mei: 56 }, skills: { bingfa: 7, quanmou: 5 }, bias: 'shi', pref: 'ma', teach: ['bingfa'],
    quote: '王不加位，我自尊耳。', desc: '始自称王，伐随而死。楚之基业自此立。' },

];

export const NPC_MAP = Object.fromEntries(NPCS.map(n => [n.id, n]));

// 随机游士/剑客之名
export const WANDERER_NAMES = ['无名剑客', '游士', '负剑之徒', '落魄士人', '山野隐者', '行脚商人', '游方医者', '江湖客'];
export const BANDIT_NAMES = ['山贼', '草寇', '劫道者', '野盗', '亡命之徒'];

export const ROLE_NAMES = { ruler: '国君', prince: '公子', retired: '前国君', minister: '卿相', general: '将帅', scholar: '名士', merchant: '富商', retainer: '门客' };

// 某人在某年的显示用身份名（国君随年份变化）
export function stageTitleOf(npc, year) {
  if (npc.role !== 'ruler') return ROLE_NAMES[npc.role] ?? '';
  const stage = rulerStageOf(npc, year);
  if (stage === 'ruler') return npc.title ?? '国君';
  if (stage === 'prince') return '公子';
  if (stage === 'retired') return '前国君';
  return '';
}

// 国君的三段身分：公子 → 国君 → 前国君，最后身故消失。
// 判定依据：birth（生年）、reign（在位起止）、death（卒年）。
// 幼年继位（即位时不足及笄）不受「及笄才出现」限制，因为已经是一国之君。
export const COMING_OF_AGE = 15;

// 推算某位国君的生卒年（缺字段时按在位期反推）
export function lifeSpanOf(npc) {
  if (!Array.isArray(npc.reign)) {
    return { birth: npc.birth ?? null, death: npc.death ?? null };
  }
  const [from, to] = npc.reign;
  // 无生年：按「即位时约 30 岁」反推
  const birth = npc.birth ?? from - 30;
  // 无卒年：退位后 5~10 年身故（用 id 派生的稳定值，避免读档变化）
  const death = npc.death ?? (to + 5 + stableHash(npc.id) % 6);
  return { birth, death };
}

function stableHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// 某人在某年的身分：'prince'（公子）/ 'ruler'（在位）/ 'retired'（前国君）/ null（不出现）
export function rulerStageOf(npc, year) {
  if (!Array.isArray(npc.reign)) return npc.role === 'ruler' ? 'ruler' : 'ruler';
  const [from, to] = npc.reign;
  const { birth, death } = lifeSpanOf(npc);

  if (death != null && year > death) return null;           // 已身故
  if (year >= from && year <= to) return 'ruler';           // 在位（含幼年继位）
  if (year > to) return 'retired';                          // 退位未卒
  // 即位之前：须已及笄
  if (birth != null && year >= birth + COMING_OF_AGE) return 'prince';
  return null;
}

export function npcAlive(npc, year) {
  if (npc.role === 'ruler') return rulerStageOf(npc, year) != null;
  const span = npc.reign ?? [npc.birth, npc.death];
  const [from, to] = span;
  if (from != null && year < from) return false;
  if (to != null && year > to) return false;
  return true;
}

export const RULERS = NPCS.filter(n => n.role === 'ruler');

// 某国在某年的在位国君（只认在位者，不含公子与前国君）
export function rulerOf(state, year) {
  return RULERS.find(n => n.state === state && rulerStageOf(n, year) === 'ruler') ?? null;
}
