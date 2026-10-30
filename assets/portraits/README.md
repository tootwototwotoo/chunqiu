# portraits / 肖像素材

运行时唯一约定：`manifest.json` 的 `portraits.[npcId].src` 指向图片文件。
代码不认任何具体图片文件名，本目录下素材**可随时重绘、换风格、增删**，
只需保持 manifest 同步（或干脆只改 manifest 里的一行 src）。

## 文件状态（生成管线的当前进度）

| 文件 | 状态 |
|---|---|
| `*-512.png`（6 张：孔子/孙武/管仲/范蠡/老子/西施） | **正式**，运行时使用 |
| `manifest.json` | **正式**，运行时读取 |
| `npc-portrait-prompts.json` | 生成管线工作文件（全 NPC 画像 prompt 清单），不进运行时 |
| `*-inkcolor-512.png`（6 张） | **占位副本**——与正式版逐字节相同，配色版尚未实际产出；产出后替换同名 inkcolor 文件并在 manifest 中切换 src |
| `manifest-inkcolor.json` | 占位（src 仍指向 -512.png，因配色版未产出） |
| `generation-prompts*.json` | 生成 prompt 记录 |
| `xi_shi-v2-512.png` / `xi_shi-richcolor-512.png` | 实验件（西施多风格尝试），未被 manifest 引用 |

## 接线方式（代码侧）

- `common.js` 的 `avatar(name, color, npcId)`：npcId 在 manifest 中有记录 →
  `<div class="avatar has-portrait"><img src=…>`（onerror 自回退字头像）
- manifest 在 `showTitle` 时惰性 fetch；就绪后 `refreshPortraits` 补渲染一次，
  消除首屏竞态窗口
- **单文件版不内联肖像**：fetch 相对路径失败自动回退，体积零增长
