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
];
