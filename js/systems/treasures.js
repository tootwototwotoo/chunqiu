// 献宝：把珍宝献给国君换功勋与名声；玄璧可助册命；集齐六种得称号
import { TREASURES, TREASURE_IDS } from '../data/treasures.js';
import { player, addMerit, addFame, addLog, addGoods } from '../state.js';
import { STATES } from '../data/world.js';


// 献宝收益：珍稀程度越高，功勋与名声越厚
export const OFFER_GAIN = {
  yu: { merit: 10, fame: 4 },
  mingzhu: { merit: 16, fame: 6 },
  shan: { merit: 24, fame: 8 },
  xijiao: { merit: 32, fame: 10 },
  xiang: { merit: 42, fame: 13 },
  bi: { merit: 56, fame: 18 },
};

export function offerableTreasures(st) {
  const p = player(st);
  return TREASURE_IDS
    .filter(id => (p.inventory[id] ?? 0) > 0)
    .map(id => ({ id, def: TREASURES[id], have: p.inventory[id], ...OFFER_GAIN[id] }));
}


export function offerTreasure(st, gemId) {
  const p = player(st);
  if (!p.stateId) return { ok: false, msg: '尚未出仕，无从献宝。' };
  const def = TREASURES[gemId];
  if (!def) return { ok: false, msg: '并无此宝。' };
  if ((p.inventory[gemId] ?? 0) <= 0) return { ok: false, msg: `囊中并无${def.name}。` };
  const gain = OFFER_GAIN[gemId];
  addGoods(st, gemId, -1);
  addMerit(st, gain.merit, true);
  addFame(st, gain.fame, true);
  st.stats.treasuresOffered = (st.stats.treasuresOffered ?? 0) + 1;
  st.flags.offeredTreasures = st.flags.offeredTreasures ?? {};
  st.flags.offeredTreasures[gemId] = (st.flags.offeredTreasures[gemId] ?? 0) + 1;
  const stateName = STATES[p.stateId]?.name ?? '';
  addLog(st, `献${def.name}于${stateName}廷，功勋+${gain.merit}，名声+${gain.fame}。`, 'big');
  return {
    ok: true, def, gain,
    msg: `国君受${def.name}，命藏于内府。功勋+${gain.merit}，名声+${gain.fame}。`,
  };
}

// 玄璧：册命请封时若囊中有玄璧，概率显著提升（献出即消耗）
export const BI_PETITION_BONUS = 0.15;

export function biPetitionBonus(st) {
  return (player(st).inventory.bi ?? 0) > 0 ? BI_PETITION_BONUS : 0;
}

// 集齐六种珍宝的称号与结局加成
export function collectedTreasureKinds(st) {
  const inv = player(st).inventory;
  return TREASURE_IDS.filter(id => (inv[id] ?? 0) > 0);
}

export function treasureHonor(st) {
  const owned = collectedTreasureKinds(st);
  const n = owned.length;
  if (n >= 6) return { name: '富可敌国', bonus: 240, text: '六宝俱备，诸侯侧目。' };
  if (n >= 4) return { name: '多宝之家', bonus: 120, text: '家藏四宝，称富于一方。' };
  if (n >= 2) return { name: '小有珍玩', bonus: 40, text: '案头数宝，亦足自娱。' };
  return null;
}

// 六种珍宝全部献过（不论现持）
export function offeredAllKinds(st) {
  const off = st.flags.offeredTreasures ?? {};
  return TREASURE_IDS.every(id => (off[id] ?? 0) > 0);
}

export function treasureSummary(st) {
  const owned = collectedTreasureKinds(st);
  return {
    owned,
    count: owned.length,
    total: TREASURE_IDS.length,
    honor: treasureHonor(st),
    offered: st.stats.treasuresOffered ?? 0,
  };
}
