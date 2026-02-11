# 黑客松開發 Prompt

## 專案背景

這是一個 Stable Layer 賽道的黑客松作品，目的是在短時間內開發一個功能簡單但 UI 質感良好的 DeFi 應用。

## 原始需求討論

### 兩個初始方案

#### 方案一：訂閱制內容平台
- 簡化並修改先前 Atrium (web3 Patron 半成品) 的架構重新做一個項目
- 保持 UI 整體風格，像是同一人之手但不可以完全一致
- 只保留 Profile 設定跟文字 blog 上傳功能
- 移除所有跟 3D 展示、交易有關的功能
- 業務邏輯是讓訂閱者 stake 一定金額穩定幣，用以解鎖訂閱資格(用 seal 加密控制)，若 stake 金額不足則喪失檔案解密權

#### 方案二：募資網站（最終採用）
- 讓用戶存款 USDC 並且可以選擇將當前生息的 n% (自定義)提供給募資對象
- 用 Sui 合約定義募資的項目和一些 Metadata
- 只有管理該募資項目的人 (用 cap 物件決定) 可以領出目前池子累積的金額
- 管理項目的人可以上傳資料更新該專案進度(可能是任何類型例如救助受傷動物、動物園動物認養、聯合國貧童資助、開發新專案技術等等....參考比較好的募資平台)
- 需要設計前端的類別篩選系統

## 技術要求

### 開發限制
- 黑客松時間比較短，功能簡單做、讓 UI 維持一定的質感即可
- Sui 合約的部分需要完全用 2024 年的新語法
- 不管是選哪個方向實作時都需要 Migrate 到新的 Sui gRPC 方式
- Stable Layer 目前只支持 mainnet 所以我們需要注意
- 所有編程要遵循 Cleancode 的原則，盡量不要註解

### 開發流程
1. 需要先幫我決定產品
2. 定義規格和 MVP
3. 向我回報然後開始實作

### AI Agent 分工
- **PM 總指揮**：一個 agent 作為產品經理總指揮
  - 所有視覺相關設計交給 Gemini 3 Pro
  - 編程任務使用 Sonnet 4.5
  - 過於艱難或複雜的任務用最新的 Opus

## 參考文檔

### Stable Layer SDK
- GitHub: https://github.com/StableLayer/stable-layer-sdk
- Git Clone: https://github.com/StableLayer/stable-layer-sdk.git

## 最終產品：GoodVibe

基於上述需求，最終決定採用**方案二：募資網站**的方向，開發了 **GoodVibe** - 一個基於 Stable Layer 的 DeFi 公益募資平台。

### 核心設計理念

用戶持有 btcUSDC（資產留在自己錢包），透過「支持」登記要贊助的項目與金額，等同捐贈穩定幣存款收益做公益，同時保持資金流動性。收益由項目方 claim，合約僅記錄支持關係與接收捐贈，不託管用戶資產。

### MVP 功能範圍

**支持者端：**
- 瀏覽公益項目
- 登記支持（金額、項目選擇）
- 管理支持（增加、減少、取消）
- 追蹤專案進度

**專案方端：**
- 領取捐贈收益
- 發佈專案更新
- 導出支持者名單（用於後續福利發放）

### 技術實現

**前端：** Next.js 16, React 19, TypeScript, Tailwind CSS 4, @mysten/dapp-kit, stable-layer-sdk  
**合約：** Sui Move 2024（platform、project、support_record 模組）  
**網路：** Sui Mainnet（Stable Layer 要求）

完整技術細節請參見 [README.md](./README.md)。
