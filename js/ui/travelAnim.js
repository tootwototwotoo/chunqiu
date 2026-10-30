// 玩家出行动画：沿道路逐段快进
//
// 动画不改变游戏逻辑——它把「已按日结算的旅程」可视化：
//   1. travelLegs 拿到逐段路径与天数
//   2. 每段动画播完时 advanceDays(该段天数)，时间与事件照常发生
//   3. 有事件 → 暂停动画，交给 app 的事件队列；处理完 resume()
//   4. 「跳过」立即结算剩余全部路段
//
// 与 travelTo 的差别只在「分段执行 + 逐帧渲染」，抵达收尾完全一致。

import { CITY_MAP } from '../data/world.js';
import { travelLegs } from '../systems/travel.js';
import { advanceDays } from '../systems/calendar.js';
import { addMoney, addStamina, player } from '../state.js';
import { checkArrivalQuests } from '../systems/quests.js';
import { arriveHauls } from '../systems/haul.js';

const FRAME_MS = 380;     // 帧间隔
const MAX_FRAMES = 8;     // 一段路最多播 8 帧

export function playTravel(app, st, toCityId, onDone) {
  const plan = travelLegs(st, toCityId);
  if (!plan) { onDone?.(null); return null; }

  const p = player(st);
  if (p.money < plan.cost) { app.toast(`盘缠不足（需 ${plan.cost} 金）。`, 'war'); return null; }
  if (p.stamina < 8) { app.toast('体力不济，先歇息几日罢。', 'war'); return null; }
  addMoney(st, -plan.cost, true);

  const s = {
    legIndex: 0, t: 0, finished: false, paused: false, timer: null,
    from: plan.legs[0].from, to: plan.legs[0].to,
    plan, notes: [], events: [],
  };

  const framesPerLeg = (leg) => Math.max(2, Math.min(MAX_FRAMES, Math.ceil(leg.days / 2)));

  const stepLeg = () => {
    const leg = plan.legs[s.legIndex];
    const res = advanceDays(st, leg.days, { travel: true });
    s.notes.push(...(res.notes ?? []));
    s.events.push(...(res.events ?? []));
    if (res.died) { finish(); return; }
    p.cityId = leg.to;
    s.legIndex += 1;
    s.t = 0;
    if (s.legIndex >= plan.legs.length) { finish(); return; }
    s.from = leg.to;
    s.to = plan.legs[s.legIndex].to;
  };

  const finish = () => {
    if (s.finished) return;
    s.finished = true;
    clearInterval(s.timer);
    addStamina(st, -plan.stamina);
    p.visitedCities = [...new Set([...(p.visitedCities ?? [p.homeCity]), toCityId])];
    st.stats.travelDays = (st.stats.travelDays ?? 0) + plan.days;
    const arr = checkArrivalQuests(st, toCityId);
    const unload = arriveHauls(st, toCityId);
    onDone?.({
      ok: true, days: plan.days, cost: plan.cost,
      notes: [...s.notes, ...(unload.notes ?? [])],
      events: s.events, quests: arr,
      died: !p.alive, unloaded: unload.arrived ?? 0,
      walked: plan.legs.map(l => l.to),
    });
  };

  s.skip = () => { while (!s.finished) stepLeg(); };
  s.resume = () => { s.paused = false; };

  s.timer = setInterval(() => {
    if (s.finished) { clearInterval(s.timer); return; }
    if (s.paused) return;
    const leg = plan.legs[s.legIndex];
    s.t += 1 / framesPerLeg(leg);
    app.onTravelProgress?.(s);
    if (s.t >= 1) {
      s.paused = true;                 // 结算期间暂停，防止重入
      stepLeg();
      app.onTravelProgress?.(s);
      if (!s.finished && !s.events.length) s.paused = false;
    }
  }, FRAME_MS);

  return s;
}

// 当前段的插值坐标（供舆图绘制玩家行走点）
export function travelProgressPos(s) {
  if (!s || s.finished) return null;
  const a = CITY_MAP[s.from], b = CITY_MAP[s.to];
  if (!a || !b) return null;
  return { x: a.x + (b.x - a.x) * s.t, y: a.y + (b.y - a.y) * s.t, to: s.to };
}
