# AXIOM — Extreme Reasoning Game

**獨立極限推理遊戲**。目前版本：**V0.3.2 · Locked Raster prototype**。

## 本次上傳
- 8 道已接入流程的原創視覺推理練習題，採 Hard / Expert / Ω 三種玩家可見難度。
- 題圖先設計為 SVG 原始資產，雲端 GitHub Actions 轉成高解析 PNG。
- 網頁優先載入 `assets/png/*.png`；首次雲端生成前回退到隔離式 `<img src="assets/*.svg">`，不會出現破圖。
- 支援圖片等比例縮放、手機點圖放大、提示與總結。
- 12 大題型架構、擴充 50 題與自動唯一解驗證器屬後續開發，**尚未完成**。

## Source & licensing
題型機制可研究經典數學謎題與公開領域素材，正式內容不直接搬運 MENSA / Raven 商業測驗原題。

## Cloud-only deployment
1. 主分支上的 `.github/workflows/render-assets.yml` 自動產生靜態 PNG，並提交回 GitHub。
2. 靜態網站入口：`index.html`。如需公開 GitHub Pages，將 Pages source 設定為 Deploy from branch → main / (root)。
3. GitHub Actions 必須允許 workflow 寫入 repository contents；若該權限被限制，圖形可由 SVG fallback 顯示，但 PNG 尚未建立。
