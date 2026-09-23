# 月满人间 · 中秋互动贺卡

一张会回应你的中秋贺卡:纯前端、零依赖、WebAudio 实时合成配乐。

## 在线地址

**https://yuzublossom.online**

## 交互清单

| 操作 | 效果 |
|---|---|
| 移动鼠标 | 星尘轨迹 + 全景视差(背景/月光/雾气分层) |
| 点击夜空任意处 | 烟花升空爆炸(自动落点避开嫦娥与题字区) |
| 点亮祈愿灯 | 展开祝福卡 + 许愿面板 |
| 输入心愿 → 放飞天灯 | 手写祈愿的天灯升空,计数存入 localStorage |
| ♫ 氛围 | 五声音阶程序化配乐 + 夜风底噪(WebAudio 合成,无音频文件) |
| 点击祝福卡右上「月」印 | 桂花雨彩蛋 |
| 等待 | 流星、自动烟花、萤火虫、诗词轮播(六首中秋名句) |

## 技术要点

- 单 `<canvas>` 粒子系统:星尘/烟花/流星/萤火/天灯/桂花共用一个 rAF 循环,辉光用预渲染精灵而非 shadowBlur(性能)
- 烟花自动落点避开主视觉人物区与左侧题字区
- 尊重 `prefers-reduced-motion`:降低粒子密度、停用自动烟花
- 页面隐藏时自动挂起音频上下文

## 文件

- `index.html` 页面结构
- `style.css` 视觉、CSS 动效、面板与提示层
- `script.js` 交互引擎(Canvas 粒子 + WebAudio)
- `assets/hero.png` 主视觉(嫦娥·玉兔·月)
- `assets/scene_alt.png` / `assets/scene_soft.png` 备用主视觉
- `CNAME` 自定义域名 `yuzublossom.online`(Cloudflare 代理 + GitHub Pages)

## 本地运行

```bash
python -m http.server 8000
# 访问 http://localhost:8000
```
