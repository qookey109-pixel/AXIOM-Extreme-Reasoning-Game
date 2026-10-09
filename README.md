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

`src/questions.js` 整合原有題庫及 `src/expansion-v052.js` 的 12 道新題，保留生成規則、答案與 generator provenance；`src/verification.js` 提供 V0.5 統一驗證層。`question_bank.json` 是既有 **50 題**的靜態資料快照，不是 source of truth。謎題畫面由 `src/graphics.js` 繪製，`src/app.js` 處理遊戲流程，`src/styles.css` 處理固定視窗版面。

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

