# GoodVibe

基於 Stable Layer 的 DeFi 公益募資平台。用戶持有 btcUSDC（資產留在自己錢包），透過「支持」登記要贊助的項目與金額，等同捐贈穩定幣存款收益做公益，同時保持資金流動性。收益由項目方 claim，合約僅記錄支持關係與接收捐贈，不託管用戶資產。Project manager 可更新進度、導出目前捐贈者列表，供後續福利發放（如 NFT、空投）依據。

## 技術棧

**前端**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, @mysten/dapp-kit, stable-layer-sdk  
**合約**: Sui Move 2024（模組：platform、project、support_record）

**AI 工具揭露**：開發過程曾使用 AI 輔助工具，詳見 [AI_DISCLOSURE.md](./AI_DISCLOSURE.md)。

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

## 功能

- 持有 btcUSDC 並登記支持項目（資產留在用戶錢包，合約不託管）
- 持有 btcUSDC 產生收益（Stable Layer）
- 用戶捐贈穩定幣存款收益做公益，收益由項目方 claim，資金保持流動性
- 隨時增加／減少或結束支持登記
- 探索募資項目並查看進度、Updates、Supporters
- 項目創建者：claim／提取捐贈、發布更新、導出捐贈者列表（供 NFT／空投等福利發放）、管理項目

## 文檔

開發紀錄與設計文檔見 [docs/](./docs/README.md)。
