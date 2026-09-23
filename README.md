# 月满人间 · 中秋互动贺卡

当前版本已经按重新下载到 `assets/` 的美术资源重新完成场景分层和动画编排。页面为纯前端实现，不依赖第三方框架或远程图片。

## 开场叙事

1. 黑夜星辰苏醒
2. 星光向月轮聚拢
3. 明月从云后升起
4. 月面渐亮并产生柔和光晕
5. 两层云海掠过
6. 嫦娥轮廓先出现
7. 完整场景从人物区域向外显现
8. 飘带与桂花加入局部动态
9. “中秋”书法标题落笔
10. 场景恢复为完整主视觉并进入交互状态

## 交互

- 点击夜空产生星光粒子
- 点击明月或“触月”产生月光涟漪
- 输入祝福并放飞带文字的天灯
- 澄月、桂雨、灯海三种氛围切换
- 氛围音乐为 WebAudio 程序化生成，需用户主动开启
- 支持跳过和完整重播
- 桌面端提供轻量视差
- 移动端有单独布局
- 尊重 `prefers-reduced-motion`

## 当前使用的资源

原始下载文件保留在 `assets/`。

为了降低加载成本，网页运行时使用转换后的 WebP 资源：

`assets/generated/`

- `chang_e_silhouette.webp`
- `moon.webp`
- `clouds_near.webp`
- `clouds_far.webp`
- `petals.webp`
- `ribbons.webp`
- `title.webp`
- `final_scene.webp`

这些文件均由本机 `assets/` 中的 PNG 转换得到，没有改变原图内容。

## 核心文件

- `index.html` 页面结构
- `style.css` 场景分层、动画阶段、响应式布局
- `app.js` 开场时间线、Canvas 粒子、天灯、模式和 WebAudio
- `script.js` 旧版脚本，当前页面不再引用

## 本地运行

```bash
python -m http.server 8000
```

访问：

`http://127.0.0.1:8000/`

## 本轮验收

已在本机 Chromium/Edge Headless 中完成以下检查：

- 所有 WebP 资源 HTTP 200
- 所有页面图片均成功解码
- JavaScript 语法检查通过
- 完整开场可自动进入 `phase-complete`
- 自定义天灯正常生成
- 桂雨模式正常生成粒子
- 触月反馈正常
- 音频开关正常
- 390×844 移动端布局通过
- 页面运行时 JavaScript 错误为 0

修改前备份：

`D:\yuzublossom_backup_before_asset_rebuild_20260923_1852`

