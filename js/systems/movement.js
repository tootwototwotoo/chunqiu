// NPC 流动数据与规则
//
// 三层：
//   1. HISTORY_MOVES —— 史载轨迹（据《史记》《左传》），优先级最高
//   2. 规则流动 —— 名士/百工/商人概率游历；非在位国君全图游历
//   3. 不动者 —— 在位国君与在职卿相将帅（有职守）
//
// moves 格式：[[年, 城], ...] 升序；取「≤ 当前年的最后一条」，
// 故首条之前用 def.city（出生地）。

// ---------------- 史载轨迹 ----------------
export const HISTORY_MOVES = {
  // 孔子（孔子世家）：鲁 → 卫 → 陈 → 蔡 → 楚叶 → 卫 → 鲁
  kong_zi: [[-497, 'diqiu'], [-492, 'wanqiu'], [-489, 'shangcai'], [-484, 'qufu']],
  // 伍子胥（伍子胥列传）：楚 → 宋 → 郑 → 吴
  wu_zixu: [[-522, 'shangqiu'], [-521, 'xinzheng'], [-518, 'gusu']],
  // 范蠡（越王勾践世家 / 货殖列传）：越 → 吴 → 齐 → 陶
  fan_li: [[-473, 'tao']],
  // 文种：楚宛 → 越（入越佐勾践）
  wen_zhong: [[-496, 'kuaiji']],
  // 孙武：齐 → 吴（以兵法见于阖闾）
  sun_wu: [[-512, 'gusu']],
  // 伯嚭：楚奔吴
  bo_pi: [[-506, 'gusu']],
  // 计然（计倪）：晋 → 越
  yue_ji_ni: [[-496, 'kuaiji']],
  // 百里奚：虞 → 秦（穆公五羖赎之）。宛城不在城池表中，中段省略；
  // 数据出生城已是雍，故首条只需标记到秦之年
  bai_li_xi: [[-655, 'yong']],
  // 由余：晋 → 戎 → 秦
  you_yu: [[-626, 'yong']],
  // 申包胥哭秦庭后归楚（秦庭在雍）
  shen_bao_xu: [[-506, 'yong'], [-505, 'ying']],
  // 墨子：鲁 → 楚（止楚攻宋）→ 归鲁
  mo_zi: [[-440, 'ying'], [-435, 'qufu']],
  // 吴起之前，魏舒居晋；荀罃被俘在楚九年归晋
  jin_luan_shu2: [[-597, 'ying'], [-588, 'jiang']],
  // 端木赐（子贡）常相鲁卫，经商曹鲁之间
  zi_gong: [[-488, 'tao']],
  // 屈完使齐后归楚
  // 晏婴相齐，终生在齐（不动）

  // 优孟（楚）、师旷（晋）、医和/医缓（秦，行医列国）
  yi_he: [[-541, 'jiang']],          // 视晋平公疾
  yi_huan: [[-581, 'jiang']],        // 视晋景公疾
  // 扁鹊行医列国：齐 → 赵 → 周 → 秦（据扁鹊仓公列传，略取数点）
  bian_que: [[-400, 'ji'], [-370, 'luoyi'], [-340, 'yong']],
  // 公输般：鲁 → 楚（为楚造云梯）
  gongshu_ban: [[-445, 'ying']],
  // 庄子：宋蒙，尝钓于濮水（濮在宋卫之交），不改其都
  // 老莱子居楚蒙山之阳；列子居郑圃四十年（不动）

  // 孔门弟子各散列国：子路仕卫（结缨而死）
  zi_lu: [[-497, 'diqiu'], [-480, 'diqiu']],
  // 子贡之外：曾参居鲁（不动）；冉有仕鲁（不在表中）
  // 宓子贱治单父；巫马期亦仕鲁（不在表中，城池无单父）

  // 戎狄之师由余已列；秦将孟明视终老秦（不动）
  // 孙良夫奔晋后归卫（新筑之战 -589 前后如晋乞师）
  wei_sun_liang: [[-589, 'jiang']],

  // 楚材晋用 / 晋材楚用典型：
  // 申公巫臣奔晋（不在表中）；蔡声子使晋还楚
  cai_sheng_zi: [[-562, 'jiang']],
};

// ---------------- 规则流动 ----------------

// 角色 → 流动档位。'none' = 有职守不动
export const MOVE_PROFILE = {
  ruler: 'special',        // 在位不动；非在位（公子/前君）全图游历
  minister: 'none',
  general: 'none',
  scholar: 'wander',       // 名士：游历
  artisan: 'wander',       // 百工：游历（谋生）
  merchant: 'wander',      // 商人：行商
  noble: 'none',
  retainer: 'wander',
};

// 游历参数：每次尝试的年数间隔、概率、目标距离
export const WANDER = {
  intervalYears: 5,        // 每隔几年掷一次
  chance: 0.35,            // 掷中则迁
  maxRoadDays: 20,         // 目标距原城的路程上限
};

// 非在位国君（公子/前君）：全图游历，间隔更宽
export const RULER_WANDER = {
  intervalYears: 8,
  chance: 0.5,
  maxRoadDays: 30,
};

// ---------------- 运行时 ----------------

// 查某 NPC 某年的所在城
export function cityAt(def, year) {
  const moves = HISTORY_MOVES[def.id];
  if (!moves?.length) return def.city;
  let city = def.city;
  for (const [y, c] of moves) {
    if (year >= y) city = c; else break;
  }
  return city;
}

