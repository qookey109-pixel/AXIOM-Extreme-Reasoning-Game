# AXIOM — Extreme Reasoning Game

**獨立原創極限推理遊戲**。本版 **V0.5.2 · Verification Core / Progressive Hints / 62-Puzzle Bank**。

公開遊戲： https://qookey109-pixel.github.io/AXIOM-Extreme-Reasoning-Game/

## 本版實作

- 12 大類、62 題可玩的 finite catalog，包含舊版 8 題、先前 42 題與新增 12 題可驗證原創題。
- 難度只顯示 **Hard 20 / Expert 29 / Ω 13**；標籤目前是設計分級，尚未使用實際玩家數據校準。
- 4 個**可點選的圖形選項卡**，包括圖形矩陣、圖形序列、旋轉、空間展開、硬幣排列、人物符號等；數字題也改成視覺數字卡。
- 全頁視窗內解題，手機答案為 2×2、桌機為一列 4 張；網頁本體禁止垂直／水平捲動。
- 題圖保持固定邏輯 Canvas → PNG data URL；過去 8 道題則繼續使用 `assets/png/*.png`。圖形僅等比例縮放，不由網頁 DOM 組裝。
- 可選擇題型、難度、快速 10 題或完整題組；線索／漸進式提示／放大圖／答案解析以浮層呈現，不撐長頁面。
- 每題提示先揭露**結構提示**，再揭露原本較強的提示；完整答案解析仍只在作答後顯示。每揭露一層提示各計一次提示成本。
- 鍵盤 1–4 選答案、Enter 提交、Backspace 清除。
- 解題正確率、總時間、提示次數與總分。

## 題庫 source of truth

`src/questions.js` 整合原有題庫及 `src/expansion-v052.js` 的 12 道新題，保留生成規則、答案與 generator provenance；`src/verification.js` 提供 V0.5 統一驗證層。`question_bank.json` 已同步成 **62 題**靜態匯出快照（非 source of truth）。每次新增或調整題目後執行 `npm run bank:sync`，並由 `npm test` 檢查快照與即時題庫完全一致。謎題畫面由 `src/graphics.js` 繪製，`src/app.js` 處理遊戲流程，`src/styles.css` 處理固定視窗版面。

12 大類：**數字金字塔、圓盤數字、路徑最佳化、圖形缺項、圖形序列、旋轉／鏡像、棋子移動、幣值／組合限制、排序／分組、Logic Grid、真假命題、空間／展開圖**。

## 品質檢查

`npm test`：題目數、三階難度分布、12 大類涵蓋、答案合法性、漸進提示契約、generator provenance，以及 V0.5 全題庫獨立求解驗證。CI 強制目前 **62/62 solver verified、62/62 verified unique answer、13/13 Ω 通過 family-specific machine gate**；規則推導題只在明確宣告的 bounded grammar 內宣稱 model unique。

Pull Request workflow `.github/workflows/axiom-qa.yml`：Node logic test + headless Chromium 瀏覽器，測 **320／360／375／390／430／768／1024／1440 px** 及一種橫向視窗，驗證 body 無溢出、題圖與 4 個答案圖像存在、可選擇提交。

## 待優化

- Ω 已有 machine admission gate，但目前難度仍是設計分級，仍需真人 QA 與玩家數據校準；不要把它當作臨床 IQ 評估。
- 長篇條件與解析使用彈窗內部捲動，讓主畫面維持單螢幕。
- 後續可增加更多原創題型／難度校準／玩法與每日題。
- 圖像生成仍在使用者瀏覽器的 Canvas 裡輸出為 raster PNG data URL，屬於穩定顯示技術，並不等於從網站亂數抓取他人的現成題目。

## 授權與題源

經典益智書與 MENSA／Raven 可以**研究玩法結構**，但不直接複製原題文字、商業測驗圖像或頁面排版。AXIOM 題目圖形與描述皆以專案自身生成／重新設計為主。


## V0.5.3 (research only) — Ω Promotion Gate

在原有 **62 道已公開題目**之外，加入三道**未公開**的原創高階推理候選題：Proof Compression、Necessary Clue、Counterexample Hunt。題源、唯一解及四個語義選項由 `src/promotion-candidates.js` 和獨立求解器驗證。

- `src/candidate-graphics.js`：三種題型的原創 Canvas 圖案與四選一圖卡；`scripts/check-promotion-visual.mjs` 在雲端 Chromium 測試手機與桌機圖片、圖形像素非空白，並保存 screenshot artifact。
- 研究題**不加入正式 `PUZZLES`**，`published:false`，`render.ready:false`，人工易讀性與實際難度驗收仍待完成；單純機器驗證通過不等於可直接公開。
- Necessary Clue 候選改用 4 條線索的原型 `NC-P01`，避免 5 條線索僅有 4 個答案選項的歧義。
- `npm test` 同時執行 **62 題正常遊戲 QA**、高階 prototype QA、資料快照同步檢查、與研究候選的 machine promotion gate。

## V0.6 · Cognitive Atlas — Visual Identity

- 全站視覺重新設計：light editorial / geometric exhibition，明亮象牙白、鈷藍、珊瑚紅與少量檸檬黃，明確的原創辨識度；不依賴任何外部圖片、外部字型或游標跟隨特效。
- 首頁雙欄展覽型版面，右側為 CSS-only 3×3 幾何動態圖陣；手機與低高度橫屏自動收斂為精簡的全視窗文字首頁。
- 遊戲的原始 Canvas 圖像與 62 題正確答案完全不變；重新設計選項可辨識度、選取狀態、圖像舞台、進度條、提示及結果頁層級。
- 支援鍵盤、觸控、`focus-visible` 及 `prefers-reduced-motion`，不產生不必要的 GPU 密集循環。
- `scripts/check-art-direction.mjs` 對 320×568、390×844、667×375、768×1024 與 1440×900 的首頁與遊戲做實際 browser QA，驗證選項點擊、無捲動、標題不裁切、圖片可見及降動態要求，並上傳截圖。
- 此版以視覺設計競賽標準為品質方向，不代表得到評審認可、入圍或獲獎。
