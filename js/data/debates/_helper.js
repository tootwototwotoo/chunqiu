// 三回合论辩场景构造工具
export const O = (tag, level, text, reply) => ({ tag, level, text, reply });
export const Q = (q, ...options) => ({ q, options });
export const EV = (name, concern, text) => ({ name, concern, text });

// topic 为可选主题（与通用场景同一套枚举），用于跨场景复用已持有的通用证据。
// 通用场景历来有 topic；voices 专属场景此前遗漏，导致证据链路失效。
export const S = (id, title, category, heart, authority, oppName, oppTitle, desc, concerns, evidence, outcomes, effects, followup = null, topic = null) => ({
  id, title, category, heart, authority,
  opponent: { name: oppName, title: oppTitle },
  desc, concerns, evidence: evidence ? { ...evidence, topic: evidence.topic ?? topic } : evidence,
  outcomes, effects, followup, topic,
});
