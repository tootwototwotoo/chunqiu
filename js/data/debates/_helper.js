// 三回合论辩场景构造工具
export const O = (tag, level, text, reply) => ({ tag, level, text, reply });
export const Q = (q, ...options) => ({ q, options });
export const EV = (name, concern, text) => ({ name, concern, text });

export const S = (id, title, category, heart, authority, oppName, oppTitle, desc, concerns, evidence, outcomes, effects, followup = null) => ({
  id, title, category, heart, authority,
  opponent: { name: oppName, title: oppTitle },
  desc, concerns, evidence, outcomes, effects, followup,
});
