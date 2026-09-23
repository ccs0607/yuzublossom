# 月满人间 · 中秋节动画贺卡

## 运行
直接双击 `index.html` 即可离线运行。若浏览器限制本地资源，可在本目录执行：

```bash
python -m http.server 8000
```

然后访问 `http://localhost:8000`。

## 动画节奏
1. 黑夜与星光开场。
2. 主场景渐显，月光光晕升起。
3. 嫦娥主题视觉进入，标题与祝福文字出现。
4. 灯笼持续升空、花瓣缓慢飘落。
5. 鼠标移动产生星尘轨迹。
6. 点击“点亮祈愿灯”弹出祝福卡，并触发星光爆发。

## 文件
- `index.html` 页面结构
- `style.css` 完整视觉与 CSS 动效
- `script.js` Canvas 星尘、灯笼/花瓣、交互动效
- `assets/hero.png` 主视觉素材
- `assets/scene_alt.png` 备用主视觉
- `assets/scene_soft.png` 备用柔和版本
