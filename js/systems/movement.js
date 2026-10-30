// NPC 流动：史载轨迹 + 逐日行走
//
// 三层：
//   1. HISTORY_MOVES —— 史载轨迹（据《史记》《左传》），优先级最高
//   2. 规则行走 —— 每 NPC 独立判定间隔（基础间隔 + 1~90 日随机），
//      决策后沿道路逐日行走（route 状态机）
//   3. 不动者 —— 在位国君与在职卿相将帅（有职守）
//
// 国君（非在位）：基础间隔 3 个月（90 日），每次判定后下一次间隔 =
//   90 + 1~825 日随机（即最快 3 个月、最慢约 3 年触发一次）。
// 其他可动角色（名士/百工/商人）：基础间隔 1 年（360 日），
//   下一次间隔 = 360 + 1~90 日随机。
//
// 行走状态机（st.npc[n].route）：
//   null                 —— 人在城中（city 即所在城）
//   { path, legDay, legTotal, total }
//     path      [城id...] 完整路径（含出发城与终点城）
//     legDay    当前路段已走天数
//     legTotal  当前路段天数
//     total     全程天数
//   行走中 city 保持出发城；抵达日才改为终点城。
//   途中的人不属于任何城，npcsHere 天然查不到——现有逻辑零改动。

import { NPC_MAP, rulerStageOf } from '../data/npcs.js';
import { CITY_MAP } from '../data/world.js';
import { shortestPath } from './pathfind.js';
import { absDay, ri } from '../util.js';

// ---------------- 史载轨迹 ----------------
export const HISTORY_MOVES = {
  // 孔子（孔子世家）：鲁 → 卫 → 陈 → 蔡 → 楚叶 → 卫 → 鲁
  kong_zi: [[-497, 'diqiu'], [-492, 'wanqiu'], [-489, 'shangcai'], [-484, 'qufu']],
  // 伍子胥（伍子胥列传）：楚 → 宋 → 郑 → 吴
  wu_zixu: [[-522, 'shangqiu'], [-521, 'xinzheng'], [-518, 'gusu']],
  // 范蠡（越王勾践世家 / 货殖列传）：越 → 吴 → 齐 → 陶
  fan_li: [[-473, 'tao']],
  // 文种：楚 → 越（入越佐勾践）
  wen_zhong: [[-496, 'kuaiji']],
  // 孙武：齐 → 吴（以兵法见于阖闾）
  sun_wu: [[-512, 'gusu']],
  // 伯嚭：楚奔吴
  bo_pi: [[-506, 'gusu']],
  // 计然（计倪）：晋 → 越
  yue_ji_ni: [[-496, 'kuaiji']],
  // 百里奚：虞 → 秦（穆公五羖赎之）。宛城不在城池表中，中段省略
  bai_li_xi: [[-655, 'yong']],
  // 由余：晋 → 戎 → 秦
  you_yu: [[-626, 'yong']],
  // 申包胥哭秦庭后归楚（秦庭在雍）
  shen_bao_xu: [[-506, 'yong'], [-505, 'ying']],
  // 墨子：鲁 → 楚（止楚攻宋）→ 归鲁
  mo_zi: [[-440, 'ying'], [-435, 'qufu']],
  // 荀罃被俘在楚九年归晋
  jin_luan_shu2: [[-597, 'ying'], [-588, 'jiang']],
  // 端木赐（子贡）常相鲁卫，经商曹鲁之间
  zi_gong: [[-488, 'tao']],
  // 扁鹊行医列国：齐 → 周 → 秦（据扁鹊仓公列传，略取数点）
  bian_que: [[-400, 'ji'], [-370, 'luoyi'], [-340, 'yong']],
  // 公输般：鲁 → 楚（为楚造云梯）
  gongshu_ban: [[-445, 'ying']],
  // 医和医缓视晋疾
  yi_he: [[-541, 'jiang']],
  yi_huan: [[-581, 'jiang']],
  // 子路仕卫（结缨而死）
  zi_lu: [[-497, 'diqiu'], [-480, 'diqiu']],
  // 孙良夫奔晋后归卫（新筑之战如晋乞师）
  wei_sun_liang: [[-589, 'jiang']],
  // 蔡声子使晋还楚
  cai_sheng_zi: [[-562, 'jiang']],

  // ---------------- 第二批（据《史记》《左传》再补） ----------------

  // 鬻子佐文王在周
  yu_zi: [[-700, 'luoyi']],
  // 季札让国后遍游诸国（襄公二十九年 -544 历聘鲁齐郑卫晋）
  wu_ji_zha: [[-544, 'qufu'], [-543, 'linzi'], [-542, 'xinzheng'], [-541, 'jiang'], [-538, 'gusu']],
  // 宁戚：卫人，饭牛于齐（桓公举为大夫）
  ning_qi: [[-685, 'linzi']],
  // 弦高：郑商人，犒秦师于滑（-627），事在周郑之间
  xian_gao: [[-627, 'luoyi'], [-626, 'xinzheng']],
  // 曹沫：鲁将，三败于齐，柯之盟（-681）在齐
  lu_cao_mo: [[-681, 'linzi'], [-680, 'qufu']],
  // 屈完使齐（召陵 -656）后归楚
  qu_wan: [[-656, 'tao']],
  // 伍举奔郑、将奔晋，后召还
  wu_ju: [[-552, 'xinzheng'], [-551, 'ying']],
  // 申叔时使齐（-598 县陈议）
  shen_shu_shi: [[-598, 'linzi']],
  // 辕涛涂：陈大夫，召陵之会后诱齐师东归（-656）
  chen_yuan_tao: [[-656, 'shangqiu']],
  // 僖负羁：曹大夫，馈飧置璧于晋文公（-637 过曹）
  cao_xi_fu: [[-637, 'jiang']],
  // 先轸随流亡 → 归国 → 城濮为元帅 → 殽战死
  xian_zhen: [[-655, 'diqiu'], [-636, 'jiang']],
  // 狐偃（子犯）随流亡，城濮后卒
  hu_yan: [[-655, 'diqiu'], [-636, 'jiang']],
  // 孟明视：殽败后焚船渡河伐晋
  qin_meng_ming: [[-625, 'jiang']],
  // 夫概：吴王阖闾弟，入郢后先归自立，败奔楚
  wu_fu_gai: [[-506, 'ying'], [-505, 'ying']],
  // 诸稽郢：越大夫，使吴（前马之职）
  yue_zhu_ji: [[-494, 'gusu']],

  // ---------------- 战国士人（稷下与周游） ----------------

  // 淳于髡：齐赘婿，稷下先生；数使诸侯
  chunyu_kun: [[-350, 'jiang']],
  // 邹衍：齐 → 燕（昭王拥彗先驱），晚年归齐
  zou_yan: [[-290, 'ji']],
  // 剧辛：赵人 → 燕（燕昭王招贤）
  ju_xin: [[-310, 'ji']],
  // 惠施：宋人，相魏
  hui_shi: [[-350, 'jiang']],
  // 子思：居卫，尝适宋（困于宋）、归卫
  zi_si: [[-457, 'shangqiu'], [-455, 'diqiu']],
  // 叔向：晋平公时聘于周、使郑
  shu_xiang: [[-538, 'luoyi'], [-537, 'jiang']],
  // 子产：相郑，晋楚之聘频繁
  zi_chan: [[-542, 'jiang'], [-536, 'jiang'], [-522, 'xinzheng']],
  // 晏婴：相齐，使晋
  yan_ying: [[-539, 'jiang']],
  // 季文子：鲁正卿，多次如晋
  ji_wen_zi: [[-610, 'jiang']],
  // 臧文仲：鲁大夫，如晋
  zang_wen_zhong: [[-629, 'jiang']],
  // 司马穰苴：齐景公时将兵扞燕晋
  si_ma_rang_ju: [[-530, 'jiang']],
  // 养由基：鄢陵之战随军
  yang_youji: [[-575, 'jiang']],
};

// 查某 NPC 某年史载应在的城
export function cityAt(def, year) {
  const moves = HISTORY_MOVES[def.id];
  if (!moves?.length) return def.city;
  let city = def.city;
  for (const [y, c] of moves) {
    if (year >= y) city = c; else break;
  }
  return city;
}

// ---------------- 规则行走参数 ----------------

// 可动角色的判定间隔（基础值，实际 = 基础 + 1~90 日随机）
export const MOVE_INTERVAL = {
  ruler: 90,             // 国君（非在位）：基础 3 个月；最慢 = 90 + 825 ≈ 3 年
  rulerSpread: 825,      // 国君的随机上限
  wander: 360,           // 名士/百工/商人：基础 1 年；最慢 = 360 + 90 ≈ 15 个月
  wanderSpread: 90,
};

// 角色档位：'none' 不动；'special' 国君（非在位走）；'wander' 游历
export const MOVE_PROFILE = {
  ruler: 'special',
  minister: 'none',
  general: 'none',
  scholar: 'wander',
  artisan: 'wander',
  merchant: 'wander',
  noble: 'none',
  retainer: 'wander',
};

// 路程上限：超过此天数的目的地不选
export const MAX_ROAD_DAYS = { special: 90, wander: 20 };  // 键与 MOVE_PROFILE 的档位值对应

// 下一次判定的间隔（日）：基础 + 1~spread 随机
export function nextInterval(st, kind) {
  if (kind === 'special') return MOVE_INTERVAL.ruler + ri(st, 1, MOVE_INTERVAL.rulerSpread);
  return MOVE_INTERVAL.wander + ri(st, 1, MOVE_INTERVAL.wanderSpread);
}

// ---------------- 行走状态机 ----------------

// 决策：该 NPC 今天是否该出发？返回 route 对象或 null
// entry 为 st.npc 条目（含 city 与 nextMoveDay）
export function decideRoute(st, def, entry, today) {
  const profile = MOVE_PROFILE[def.role] ?? 'none';
  if (profile === 'none') return null;
  // 在位国君不动
  if (def.role === 'ruler' && rulerStageOf(def, st.time.year) === 'ruler') return null;
  // 尚未到判定日
  if (today < (entry.nextMoveDay ?? 0)) return null;

  const kind = profile;   // 'special' | 'wander'
  const maxDays = MAX_ROAD_DAYS[kind];

  // 选目的地：路程可达且 ≤ 上限
  const from = entry.city;
  const pool = Object.keys(CITY_MAP).filter(c => {
    if (c === from) return false;
    const d = shortestPath(from, c, st)?.days ?? 999;
    return d > 0 && d <= maxDays;
  });
  // 无论是否成行，先排下一次判定（避免每天重掷）
  entry.nextMoveDay = today + nextInterval(st, kind);
  if (!pool.length) return null;
  const to = pool[ri(st, 0, pool.length - 1)];
  const path = shortestPath(from, to, st);
  if (!path || path.days <= 0) return null;

  // 路径拆为逐段（相邻城 + 段天数）
  const legs = [];
  for (let i = 1; i < path.path.length; i++) {
    const a = path.path[i - 1], b = path.path[i];
    const d = shortestPath(a, b, st)?.days ?? 1;
    legs.push({ from: a, to: b, days: Math.max(1, d) });
  }
  const total = legs.reduce((s, l) => s + l.days, 0);
  return { path: path.path.slice(), legDay: 0, legTotal: legs[0].days, total, legs, legIndex: 0 };
}

// 每日推进：行走中的人走一天；到判定日的人出发
// 返回「今日抵达新城」的人物 id 数组（供音信）
export function stepNpcTravel(st) {
  const today = absDay(st.time);
  const arrived = [];
  for (const n of Object.values(st.npc)) {
    const def = NPC_MAP[n.id];
    if (!def || !n.alive) { if (n.route) n.route = null; continue; }

    // ---- 史载轨迹优先 ----
    if (HISTORY_MOVES[def.id]) {
      const target = cityAt(def, st.time.year);
      if (target !== n.city) {
        // 节点年到了：瞬移对齐（史实优先；若在途则中断在途）
        n.city = target;
        n.route = null;
      }
      continue;
    }

    // ---- 行走中 ----
    if (n.route) {
      n.route.legDay += 1;
      if (n.route.legDay >= n.route.legTotal) {
        // 本段走完
        n.route.legIndex += 1;
        if (n.route.legIndex >= n.route.legs.length) {
          // 全程抵达
          n.city = n.route.path[n.route.path.length - 1];
          n.route = null;
          arrived.push(n.id);
        } else {
          // 进入下一段
          const leg = n.route.legs[n.route.legIndex];
          n.route.legDay = 0;
          n.route.legTotal = leg.days;
        }
      }
      continue;
    }

    // ---- 人在城中：判定是否出发 ----
    const route = decideRoute(st, def, n, today);
    if (route) {
      n.route = route;
      // 出发日不算抵达；city 保持出发城
    }
  }
  // 音信（限相识者，由调用方过滤）
  return arrived;
}

// 某人当前的实际位置（城 id 或 null=在途）
// 在途时同时给出插值进度（供舆图绘制）
export function positionOf(entry) {
  if (!entry.route) return { city: entry.city, onRoad: false };
  const r = entry.route;
  const leg = r.legs[r.legIndex];
  const a = CITY_MAP[leg.from], b = CITY_MAP[leg.to];
  const t = r.legDay / r.legTotal;
  return {
    onRoad: true,
    from: leg.from, to: leg.to,
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    progress: t,
  };
}

// 旧接口兼容：史载轨迹人物的所在城（决策层外部仍可用）
export { cityAt as cityAtHistory };
