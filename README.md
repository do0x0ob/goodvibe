# GoodVibe

基於 Stable Layer 的 DeFi 公益募資平台。用戶持有 btcUSDC（資產留在自己錢包），透過「支持」登記要贊助的項目與金額，等同捐贈穩定幣存款收益做公益，同時保持資金流動性。收益由項目方 claim，合約僅記錄支持關係與接收捐贈，不託管用戶資產。Project manager 可更新進度、導出目前捐贈者列表，供後續福利發放（如 NFT、空投）依據。

> **Demo 階段說明**：目前使用現成的 **btcUSDC** 代表公益項目穩定幣。實際的品牌穩定幣需向 Stable Layer 申請，因此平台業務邏輯設計上也是需要透過平台管理員創建項目，而非開放用戶自行創建。

## 設計核心思想

當我們看見公益項目、非營利研究或需要幫助的人，心裡想出一份力，卻也得把自己的生活顧好，未必有餘裕拿出本金去捐助。若本金不多，把資金放進 DeFi 協議賺取的利息，對個人生活的改善也相當有限。

GoodVibe 的核心想法是：**既不勉強自己，也能長期支持**。你仍持有穩定幣、資產留在自己的錢包，只需透過鏈上登記，將存款收益匯聚到你認同的專案。許多人小小的利息，就能累積成可持續的影響力。

平台上的支持紀錄不涉及個人身份，保持低調是預設選項。但若專案有成，專案方想向一路相挺的人表達感謝，可透過支持名單作為依據（例如發放 NFT 紀念徽章、代幣空投等鏈上回饋），讓善意得到回應。

## 使用流程

### 對於支持者

1. **探索專案**：瀏覽平台上的公益項目，閱讀專案介紹、查看募資進度與歷史更新
2. **登記支持**：選擇認同的專案，設定要支持的金額（btcUSDC），完成鏈上登記
   - 資產始終留在你的錢包，合約只記錄支持關係，不託管資金
   - Stable Layer 產生的存款收益會自動視為捐贈來源
3. **保持彈性**：隨時可以增加、減少支持金額，或完全結束支持，不鎖定資金
4. **追蹤進展**：回到專案頁面查看最新動態、支持者人數與募資狀況

### 對於專案方

1. **領取捐贈**：定期 claim 支持者穩定幣產生的存款收益
2. **發佈更新**：在專案頁面分享進度、成果或感謝訊息
3. **回饋支持者**：匯出支持者名單（鏈上地址與金額），作為發放 NFT、空投等鏈上回饋的依據

**Future Works**：開設專案小商城，上架紀念品（實體或虛擬商品），可透過穩定幣或品牌穩定幣購買，讓支持者能以更多元的方式參與專案。

---

## 技術棧

**前端**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, @mysten/dapp-kit, stable-layer-sdk  
**合約**: Sui Move 2024（模組：platform、project、support_record）

**AI 工具揭露**：開發過程完全使用 AI 工具，詳見 [AI_DISCLOSURE.md](./AI_DISCLOSURE.md)。

## 快速開始

```bash
# 前端開發
cd frontend
cp .env.local.example .env.local   # 複製範例，再編輯 .env.local 填入實際值
npm install
npm run dev
```

必填的 `.env.local` 變數：`NEXT_PUBLIC_SUI_NETWORK`、`NEXT_PUBLIC_PACKAGE_ID`、`NEXT_PUBLIC_PLATFORM_ID`；其餘見 [docs/deployment.md](./docs/deployment.md)。  
**gRPC（可選）**：若需啟用 [Surflux](https://surflux.dev) gRPC，在 `.env.local` 設定 `SUI_GRPC_ENDPOINT=grpc.surflux.dev` 與 `SUI_GRPC_TOKEN`（勿用 `NEXT_PUBLIC_`）；未設定則自動使用 HTTP。詳見 [docs/GRPC_FINAL_WORKING_STATUS.md](./docs/GRPC_FINAL_WORKING_STATUS.md)。

```bash
# 合約編譯與部署
cd contract
sui move build
sui client publish
```

部署後將產生的 Package ID、Platform ID 等寫回 `frontend/.env.local`；完整清單與 Mainnet 資訊見 [docs/deployment.md](./docs/deployment.md)。

## 文檔

- **[黑客松開發 Prompt](./HACKATHON_PROMPT.md)** - 原始需求討論、技術要求與產品決策過程
- 開發紀錄與設計文檔見 [docs/](./docs/README.md)。
