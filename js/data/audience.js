// 三回合廷对：国君问政，士人应对
// level: hit 切中 / reason 有道理 / evade 空泛；tag 对应国君心性
export const AUDIENCE_THRESHOLD = 45;

export const AUDIENCE_QUESTIONS = [
  { id: 'famine', q: '今岁歉收，粮价腾贵，府库不足以赈，君将何以处之？', options: [
    { tag: 'li', level: 'hit', text: '先开仓平粜，再向邻国籴粮，秋后以新谷补足。', reply: '国君颔首：「有出有入，方不至于竭泽。」' },
    { tag: 'yi', level: 'reason', text: '减赋劝农，与民休息，二三年后自可恢复。', reply: '国君叹道：「道理虽对，眼前饥民等不得二三年。」' },
    { tag: 'shi', level: 'evade', text: '严刑止盗，禁止囤积，乱象自平。', reply: '国君皱眉：「粮从何来，你并未回答。」' },
  ]},
  { id: 'border', q: '邻国陈兵于境，使者言辞倨傲，君何以应之？', options: [
    { tag: 'shi', level: 'hit', text: '一面整军守隘，一面遣使结盟，以战备求和平。', reply: '国君目光一振：「有备而和，才谈得成。」' },
    { tag: 'yi', level: 'reason', text: '先以礼相待，申明旧盟，彼若负义，天下共讨。', reply: '国君沉吟：「礼数要做，可兵也不能不备。」' },
    { tag: 'ming', level: 'evade', text: '割让边邑，换一时安宁。', reply: '国君面色一沉：「今日割一城，明日割几城？」' },
  ]},
  { id: 'clans', q: '卿族专权，公室日卑，君将何以处之？', options: [
    { tag: 'shi', level: 'hit', text: '分其封邑、调其部曲，以势削势，不急于一朝。', reply: '国君低声道：「徐徐图之，或可不动声色。」' },
    { tag: 'yi', level: 'reason', text: '以礼法约束，厚待其贤者，使其无由生乱。', reply: '国君叹道：「礼法若管用，寡人何必忧心。」' },
    { tag: 'ming', level: 'evade', text: '尽诛其族，以绝后患。', reply: '国君摇头：「杀得尽吗？只怕先乱的是朝堂。」' },
  ]},
  { id: 'justice', q: '狱讼繁多，百姓怨嗟，君将何以平之？', options: [
    { tag: 'ming', level: 'hit', text: '亲察大狱，平反冤案，择贤者为司寇。', reply: '国君点头：「先平冤，才谈得上安民。」' },
    { tag: 'yi', level: 'reason', text: '修订刑律，明定轻重，使民知所避就。', reply: '国君道：「律令要修，可眼下冤狱更急。」' },
    { tag: 'shi', level: 'evade', text: '加派酷吏，严刑峻法，自然无人敢讼。', reply: '国君反问：「无人敢讼，怨气就消了吗？」' },
  ]},
  { id: 'trade', q: '商旅不至，府库空虚，君将何以通之？', options: [
    { tag: 'li', level: 'hit', text: '轻税通商，修驿道、立市约，使商旅有利可图。', reply: '国君笑道：「商人图利，让他们有利，路自然就通了。」' },
    { tag: 'ming', level: 'reason', text: '官营盐铁，以官府之力补商旅之缺。', reply: '国君沉吟：「官营能补一时，却怕与民争利。」' },
    { tag: 'yi', level: 'evade', text: '闭关自守，使百姓务农，不假外求。', reply: '国君摇头：「闭关自守，府库只会更空。」' },
  ]},
  { id: 'army', q: '大军将发，军粮不足，君将何以筹之？', options: [
    { tag: 'li', level: 'hit', text: '屯田积谷，以军养军，再向豪商籴买余粮。', reply: '国君点头：「屯田是长久之计，籴粮可解眼前。」' },
    { tag: 'shi', level: 'reason', text: '先发兵威，逼邻国输粮，以战养战。', reply: '国君皱眉：「以战养战，胜了还好，败了呢？」' },
    { tag: 'yi', level: 'evade', text: '加赋于民，令百姓节衣缩食以奉军。', reply: '国君叹道：「军粮有了，民心却要散了。」' },
  ]},
  { id: 'scholars', q: '士人非议朝政，清议汹汹，君将何以处之？', options: [
    { tag: 'ming', level: 'hit', text: '开言路、纳谏诤，择其善者而行，清议自平。', reply: '国君笑道：「让他们说，说得对的寡人照办。」' },
    { tag: 'yi', level: 'reason', text: '兴学宫、养士人，以教化导之。', reply: '国君点头：「教化是根本，只是见效慢些。」' },
    { tag: 'shi', level: 'evade', text: '禁止聚议，为首者治罪。', reply: '国君冷声道：「堵得住嘴，堵得住人心吗？」' },
  ]},
  { id: 'flood', q: '秋汛将至，河堤年久失修，君将何以处之？', options: [
    { tag: 'li', level: 'hit', text: '分段修堤，以工代赈，既固河防又安流民。', reply: '国君目光一亮：「以工代赈，一举两得。」' },
    { tag: 'yi', level: 'reason', text: '迁低地之民于高处，先保人命，再议修堤。', reply: '国君叹道：「迁民也是难事，但总比死人强。」' },
    { tag: 'ming', level: 'evade', text: '祭河祈安，上天自会护佑。', reply: '国君反问：「若上天不佑，谁来担这个责？」' },
  ]},
  { id: 'talent', q: '朝中乏才，政事壅滞，君将何以取士？', options: [
    { tag: 'yi', level: 'hit', text: '举寒门、试以事，不问出身，唯才是举。', reply: '国君抚掌：「英雄不问出处，正合寡人之意。」' },
    { tag: 'ming', level: 'reason', text: '依乡里清议与旧制荐举，稳重为上。', reply: '国君沉吟：「旧制稳妥，却怕漏了真才。」' },
    { tag: 'li', level: 'evade', text: '任用亲族，至少忠心可保。', reply: '国君冷笑：「忠心而无才，只会误事。」' },
  ]},
  { id: 'diplomacy', q: '诸侯会盟在即，君欲争一时之先，当以何策？', options: [
    { tag: 'shi', level: 'hit', text: '先联近邻、陈兵于会，以势压诸侯，再定盟约。', reply: '国君点头：「有势可恃，盟辞才有人听。」' },
    { tag: 'yi', level: 'reason', text: '以信义相召，让诸侯自愿推我为长。', reply: '国君叹道：「信义虽好，会盟场上还是看实力。」' },
    { tag: 'ming', level: 'evade', text: '多送礼物，买通各国大夫。', reply: '国君皱眉：「买来的盟，明日就能被别人买走。」' },
  ]},

  { id: 'oath', q: '诸侯背弃旧盟，边邑已起争端，君将何以处之？', options: [
    { tag: 'ming', level: 'hit', text: '会诸侯于旧盟之地，重订盟书，使背盟者无所遁形。', reply: '国君点头：「先把道理摆在诸侯面前。」' },
    { tag: 'yi', level: 'reason', text: '先遣使责以大义，彼若知愧，兵戈可免。', reply: '国君叹道：「义责要有兵威作后盾才管用。」' },
    { tag: 'li', level: 'evade', text: '许以边市之利，换他退兵。', reply: '国君反问：「今日许利，明日他再进一步呢？」' },
  ]},
  { id: 'plague', q: '灾后疫气流行，医者不足，君将何以处之？', options: [
    { tag: 'yi', level: 'hit', text: '征召良医、设隔离之所，官给汤药，先救疫区。', reply: '国君颔首：「先救人，再谈其余。」' },
    { tag: 'li', level: 'reason', text: '拨款购药，命各乡上报病户。', reply: '国君道：「钱要花，可谁来管这些药？」' },
    { tag: 'shi', level: 'evade', text: '封锁疫区，禁止出入。', reply: '国君皱眉：「封得住人，封不住疫气。」' },
  ]},
  { id: 'saltiron', q: '盐铁之利尽归豪商，府库日虚，君将何以处之？', options: [
    { tag: 'li', level: 'hit', text: '官营盐铁，设官榷税，余利仍许商人经营。', reply: '国君目光一亮：「官商分利，倒不至于竭泽。」' },
    { tag: 'shi', level: 'reason', text: '派兵查封私盐，杀一儆百。', reply: '国君沉吟：「查得了一时，查不了天下。」' },
    { tag: 'yi', level: 'evade', text: '与民争利非仁政，不如听其自然。', reply: '国君反问：「府库空了，仁政拿什么行？」' },
  ]},
  { id: 'luxury', q: '宗室竞相奢靡，用度逾制，君将何以处之？', options: [
    { tag: 'ming', level: 'hit', text: '申明礼制，按爵定用，逾制者夺其封邑。', reply: '国君点头：「先立规矩，再谈罚。」' },
    { tag: 'yi', level: 'reason', text: '以俭德示范，劝其自省。', reply: '国君苦笑：「寡人节俭，他们照旧。」' },
    { tag: 'li', level: 'evade', text: '削减宗室俸禄，充作军费。', reply: '国君摇头：「削俸只会逼他们另寻财路。」' },
  ]},
  { id: 'warlord', q: '边将拥兵自重，诏令不行，君将何以处之？', options: [
    { tag: 'shi', level: 'hit', text: '调其部曲、换其防区，以粮饷节制其兵。', reply: '国君低声道：「不动刀兵而削其权，最好。」' },
    { tag: 'ming', level: 'reason', text: '召其入朝，加官进爵，留在身边。', reply: '国君沉吟：「他若不肯来呢？」' },
    { tag: 'yi', level: 'evade', text: '以忠义相责，令其自请解兵。', reply: '国君反问：「他若有忠义，就不会拥兵了。」' },
  ]},
  { id: 'waterfight', q: '两邑争水，械斗将起，君将何以处之？', options: [
    { tag: 'ming', level: 'hit', text: '查旧渠碑与纳赋册，按田亩定水，立石为界。', reply: '国君点头：「有碑有册，才好断。」' },
    { tag: 'li', level: 'reason', text: '令两邑共修新渠，按出工分水。', reply: '国君道：「修渠是好事，可远水难救近火。」' },
    { tag: 'yi', level: 'evade', text: '令乡老自行调解，官府不必插手。', reply: '国君叹道：「调得成，就不会打到县衙来了。」' },
  ]},
  { id: 'clan_talent', q: '世族把持朝位，寒士无由进身，君将何以处之？', options: [
    { tag: 'yi', level: 'hit', text: '设策问、试以事，寒士与世族同场比试。', reply: '国君目光一亮：「同场比试，世族也无话可说。」' },
    { tag: 'shi', level: 'reason', text: '另立新军、新府，绕开世族旧衙门。', reply: '国君沉吟：「另起炉灶，也需钱粮。」' },
    { tag: 'ming', level: 'evade', text: '依乡里清议荐举，自然会有贤才。', reply: '国君反问：「清议还不是世族说了算？」' },
  ]},
  { id: 'punishment', q: '刑罚过滥，狱中多冤，君将何以处之？', options: [
    { tag: 'ming', level: 'hit', text: '亲录囚徒，疑罪从轻，择贤者为司寇。', reply: '国君颔首：「亲录囚徒，至少能少几桩冤案。」' },
    { tag: 'yi', level: 'reason', text: '修订刑律，明定轻重，使民知所避就。', reply: '国君道：「律要修，可眼下牢里已经满了。」' },
    { tag: 'shi', level: 'evade', text: '严刑峻法，使奸人不敢犯。', reply: '国君反问：「严到百姓不敢申冤，也算治世？」' },
  ]},
  { id: 'granary', q: '官仓账实不符，仓吏称损耗，君将何以处之？', options: [
    { tag: 'li', level: 'hit', text: '突击盘仓、对账，亏空者连坐赔偿。', reply: '国君点头：「对账连坐，仓吏才不敢伸手。」' },
    { tag: 'ming', level: 'reason', text: '遣御史巡查，公开账目于市。', reply: '国君沉吟：「公开是好事，御史肯不肯得罪人？」' },
    { tag: 'yi', level: 'evade', text: '申饬仓吏，令其自行补足。', reply: '国君冷笑：「自己补？那还是从仓里拿。」' },
  ]},
  { id: 'monopoly', q: '大商垄断市货，小贩无以为生，君将何以处之？', options: [
    { tag: 'li', level: 'hit', text: '设官市平价、限大户囤积，小贩可入市。', reply: '国君点头：「给小人一条活路，市面才稳。」' },
    { tag: 'shi', level: 'reason', text: '派兵查抄囤货，罚其重金。', reply: '国君皱眉：「抄了这家，别家还会囤。」' },
    { tag: 'ming', level: 'evade', text: '表彰义商，劝其让利。', reply: '国君反问：「义商有几个？」' },
  ]},
  { id: 'military_award', q: '军功赏罚不明，将士离心，君将何以处之？', options: [
    { tag: 'ming', level: 'hit', text: '当众核验军功簿，按功行赏，虚报者治罪。', reply: '国君颔首：「公开核功，才服众。」' },
    { tag: 'yi', level: 'reason', text: '厚待阵亡者家属，以慰军心。', reply: '国君叹道：「抚恤要做，可活着的功劳也不能含糊。」' },
    { tag: 'shi', level: 'evade', text: '加重军法，退缩者斩。', reply: '国君反问：「只罚不赏，谁还肯向前？」' },
  ]},
  { id: 'heir', q: '太子失教，近臣阿谀，君将何以处之？', options: [
    { tag: 'yi', level: 'hit', text: '择端方之士为傅，令太子习礼知民。', reply: '国君点头：「师傅选对了，比什么都强。」' },
    { tag: 'ming', level: 'reason', text: '令太子参与朝会，使知政事。', reply: '国君沉吟：「旁听容易，肯不肯听进去？」' },
    { tag: 'li', level: 'evade', text: '多给俸邑，使其安享富贵。', reply: '国君反问：「安享富贵，就能当好国君吗？」' },
  ]},
  { id: 'famine_neighbor', q: '邻国大饥，遣使求籴，君将何以处之？', options: [
    { tag: 'yi', level: 'hit', text: '平价粜粮，并附盟书，使邻国记此恩义。', reply: '国君颔首：「既救人，也结一份情义。」' },
    { tag: 'li', level: 'reason', text: '按市价加价出售，府库可获厚利。', reply: '国君叹道：「利是得了，邻国却要记恨。」' },
    { tag: 'shi', level: 'evade', text: '闭关禁籴，先保本国。', reply: '国君反问：「邻国饿死的人，就不会往我们这边跑？」' },
  ]},
  { id: 'tribute_king', q: '天子遣使索贡，礼数甚重，君将何以处之？', options: [
    { tag: 'ming', level: 'hit', text: '依礼朝贡，但贡物从简，附陈情表说明民力。', reply: '国君点头：「礼数到了，也不至于掏空府库。」' },
    { tag: 'yi', level: 'reason', text: '天子虽微，名义尚在，不可失礼。', reply: '国君沉吟：「礼要守，可使者未必体谅。」' },
    { tag: 'shi', level: 'evade', text: '托辞不贡，看天子能奈我何。', reply: '国君皱眉：「今日不贡，明日诸侯就会拿这做文章。」' },
  ]},
];

export const AUDIENCE_FOLLOW_UPS = [
  { id: 'fu_grain', follow: true, q: '君复问：粮价若再涨，百姓买不起，又当如何？', options: [
    { tag: 'li', level: 'hit', text: '官仓限量平粜，同时严查囤积，双管齐下。', reply: '国君点头：「有粮可买，价才压得住。」' },
    { tag: 'yi', level: 'reason', text: '先赈最贫者，余者听其自便。', reply: '国君叹道：「赈得了一时，赈不了一世。」' },
    { tag: 'shi', level: 'evade', text: '派兵封市，禁止涨价。', reply: '国君反问：「封了市，粮从何处来？」' },
  ]},
  { id: 'fu_army', follow: true, q: '君复问：军粮只够一月，援军却要三月才到，如何撑住？', options: [
    { tag: 'shi', level: 'hit', text: '收缩防线、集中兵力，先守要害，再图反击。', reply: '国君点头：「舍小保大，才有得守。」' },
    { tag: 'li', level: 'reason', text: '就地征粮，许以战后减免赋税。', reply: '国君沉吟：「就地征粮，怕要激起民怨。」' },
    { tag: 'yi', level: 'evade', text: '令将士以忠义自励，死守待援。', reply: '国君反问：「空言忠义，能当军粮吗？」' },
  ]},
  { id: 'fu_clans', follow: true, q: '君复问：若卿族先发制人，君当如何自处？', options: [
    { tag: 'shi', level: 'hit', text: '先调外兵入卫，再以君命分其党羽。', reply: '国君低声道：「先保君位，再论其他。」' },
    { tag: 'yi', level: 'reason', text: '召诸卿共誓，以宗庙之盟约束彼此。', reply: '国君叹道：「盟誓对无信之人，没有多少用。」' },
    { tag: 'ming', level: 'evade', text: '下罪己诏，平息其怨。', reply: '国君摇头：「罪己可以，退让却不行。」' },
  ]},
  { id: 'fu_justice', follow: true, q: '君复问：若翻案牵出先君旧臣，君敢动吗？', options: [
    { tag: 'ming', level: 'hit', text: '只论案情，不问身份，公开审理。', reply: '国君目光一凝：「公开审，才没人能暗中插手。」' },
    { tag: 'yi', level: 'reason', text: '为其保留体面，令其自请致仕。', reply: '国君沉吟：「留体面可以，冤案还是要平。」' },
    { tag: 'shi', level: 'evade', text: '到此为止，不再深究。', reply: '国君反问：「冤者不服，这案子算结了吗？」' },
  ]},
  { id: 'fu_oath', follow: true, q: '君复问：若诸侯会盟时公然辱我，君将何以应之？', options: [
    { tag: 'ming', level: 'hit', text: '当场援引盟辞，令史官记其失礼，再议后图。', reply: '国君点头：「先占住礼字，他便理亏。」' },
    { tag: 'yi', level: 'reason', text: '以大局为重，暂忍一时。', reply: '国君叹道：「忍可以，但不能白忍。」' },
    { tag: 'li', level: 'evade', text: '送他厚礼，求他改口。', reply: '国君冷声道：「送得越多，他越轻我。」' },
  ]},
  { id: 'fu_river', follow: true, q: '君复问：修堤之费，府库只能出一半，余数何来？', options: [
    { tag: 'li', level: 'hit', text: '以工代赈、富户摊派，再向邻县借料。', reply: '国君点头：「三处凑一凑，或可成事。」' },
    { tag: 'yi', level: 'reason', text: '劝富户捐输，许其立碑记名。', reply: '国君沉吟：「捐输要有名分，他们才肯。」' },
    { tag: 'ming', level: 'evade', text: '先动工再说，钱不够再想办法。', reply: '国君反问：「动工到一半没钱，堤怎么办？」' },
  ]},
  { id: 'fu_talent', follow: true, q: '君复问：所举之人若行事乖张，君当如何？', options: [
    { tag: 'yi', level: 'hit', text: '举者连坐，用人不察者同罚。', reply: '国君点头：「有连坐，举荐才不敢乱来。」' },
    { tag: 'ming', level: 'reason', text: '先试以小任，观其行事再定。', reply: '国君沉吟：「试任可以，只怕耽误了正事。」' },
    { tag: 'li', level: 'evade', text: '既然举了，便护到底。', reply: '国君反问：「护他，谁护国事？」' },
  ]},
  { id: 'fu_meeting', follow: true, q: '君复问：会盟之上，晋楚争长，君欲站在哪一边？', options: [
    { tag: 'shi', level: 'hit', text: '不急于站队，先联小国自成一势，待两强相争再定。', reply: '国君目光一亮：「先有自重之势，才谈得上取舍。」' },
    { tag: 'yi', level: 'reason', text: '依周礼尊卑定席次，不偏不倚。', reply: '国君叹道：「礼若能定，就不会争了。」' },
    { tag: 'ming', level: 'evade', text: '谁给的好处多，就站谁那边。', reply: '国君冷笑：「今日贪利，明日两边都轻你。」' },
  ]},
  { id: 'fu_trade', follow: true, q: '君复问：若商旅来时课以轻税，府库入不敷出，君当如何？', options: [
    { tag: 'li', level: 'hit', text: '先养商三年，再渐增其税；商既成群，税自重。', reply: '国君点头：「先养后取，才取得到。」' },
    { tag: 'yi', level: 'reason', text: '省去冗费，胜于加税。', reply: '国君沉吟：「省费也是难事，冗员都是人情。」' },
    { tag: 'shi', level: 'evade', text: '商既愿来，多取一些无妨。', reply: '国君反问：「多取一些，他们还来第二回吗？」' },
  ]},
  { id: 'fu_scholars', follow: true, q: '君复问：士人既议朝政，其言又多迂阔，君尚纳之乎？', options: [
    { tag: 'ming', level: 'hit', text: '纳其言之可行者，迂阔者不罪，自无怨望。', reply: '国君笑道：「只取可用的，不必与他争辩。」' },
    { tag: 'yi', level: 'reason', text: '设学宫养其才，使有为而不为乱。', reply: '国君点头：「给他们去处，比堵他们的嘴强。」' },
    { tag: 'shi', level: 'evade', text: '择其言事切直者，先治一二人以立威。', reply: '国君摇头：「立了威，清议只会更凶。」' },
  ]},
  { id: 'fu_plague', follow: true, q: '君复问：疫气既起，若封城断行，恐民生断绝，君当如何？', options: [
    { tag: 'yi', level: 'hit', text: '不封全城，只隔病户，粮药仍由官送。', reply: '国君点头：「隔病不隔人，才是正办。」' },
    { tag: 'li', level: 'reason', text: '募医者巡诊，官给其食，重赏之下必有应者。', reply: '国君沉吟：「重赏募医，也是一法。」' },
    { tag: 'shi', level: 'evade', text: '尽封四门，任其自生自灭。', reply: '国君面色一变：「这是要死多少人？」' },
  ]},
  { id: 'fu_saltiron', follow: true, q: '君复问：官营既立，豪民必怨，君将何以处之？', options: [
    { tag: 'li', level: 'hit', text: '许其承办一隅，官定其价，纳课于官。', reply: '国君点头：「留他们一条活路，省得生乱。」' },
    { tag: 'shi', level: 'reason', text: '严刑峻法，有犯者没其家。', reply: '国君叹道：「杀得几个人，杀不尽人心。」' },
    { tag: 'yi', level: 'evade', text: '既已官营，不必再问其怨。', reply: '国君反问：「不问其怨，其怨就不在吗？」' },
  ]},
  { id: 'fu_luxury', follow: true, q: '君复问：禁用奢侈，恐失诸侯欢心，君当如何取舍？', options: [
    { tag: 'yi', level: 'hit', text: '君自俭以率下，不禁人之所有。', reply: '国君点头：「上不奢，下自知节。」' },
    { tag: 'ming', level: 'reason', text: '于国用者禁之，于礼宾者许之。', reply: '国君沉吟：「内外有别，倒也可行。」' },
    { tag: 'shi', level: 'evade', text: '一概严令禁止，违者罚金。', reply: '国君皱眉：「罚得诸侯不来，值吗？」' },
  ]},
  { id: 'fu_heir', follow: true, q: '君复问：若诸子各结党羽，君将何以定储？', options: [
    { tag: 'yi', level: 'hit', text: '早定长幼之序，明告于宗庙，绝其觊觎。', reply: '国君颔首：「名分早定，才少流血。」' },
    { tag: 'shi', level: 'reason', text: '择其贤者，藉朝臣之议以定。', reply: '国君叹道：「议出来的储君，未必肯认。」' },
    { tag: 'li', level: 'evade', text: '此事延后再议，先观其行。', reply: '国君反问：「延到何时？等他们先动手吗？」' },
  ]},
  { id: 'fu_tribute', follow: true, q: '君复问：天子既弱，贡赋尚输否？', options: [
    { tag: 'yi', level: 'hit', text: '如数输之，使天下知君守礼，而王师可借其名。', reply: '国君点头：「礼数守着，名分就在我这边。」' },
    { tag: 'li', level: 'reason', text: '量力输之，不必全额。', reply: '国君沉吟：「半输半留，天子也无可奈何。」' },
    { tag: 'shi', level: 'evade', text: '王室既微，不必再输。', reply: '国君反问：「不输贡赋，诸侯怎样看你？」' },
  ]},
  { id: 'fu_granary', follow: true, q: '君复问：积谷既多，若遇灾年尽散，来年又当如何？', options: [
    { tag: 'li', level: 'hit', text: '常留三分之一为来年种食，散其有余。', reply: '国君点头：「留底再散，才散得起。」' },
    { tag: 'yi', level: 'reason', text: '尽散以救眼下，来年再募粟补仓。', reply: '国君叹道：「来年募粟，价必更高。」' },
    { tag: 'ming', level: 'evade', text: '紧要时全数散出，以收民心。', reply: '国君反问：「民心收了，明年拿什么救？」' },
  ]},

];
