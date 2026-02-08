# GoodVibe

基於 Stable Layer SDK 的 DeFi 公益募資平台。用戶存入 USDC 到 Stable Layer 獲取收益，並將收益捐贈給募資項目。

## 技術棧

**前端**: Next.js 14, TypeScript, Tailwind CSS, @mysten/dapp-kit, stable-layer-sdk  
**合約**: Sui Move 2024.beta

## 快速開始

```bash
# 前端開發
cd frontend
npm install
npm run dev

# 合約編譯與部署
cd contract
sui move build
sui client publish --gas-budget 100000000
```

部署後更新 `frontend/.env.local`:
- `NEXT_PUBLIC_PACKAGE_ID`
- `NEXT_PUBLIC_PLATFORM_ID`

## 功能

- 存入 USDC 到 Stable Layer 獲取收益
- 管理個人金庫（存款/提款/領取收益）
- 探索募資項目並配置捐贈比例
- 查看平台統計數據
- 項目創建者管理功能
