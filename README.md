# GoodVibe

基於 Stable Layer SDK 的 DeFi 公益募資平台。用戶 mint btcUSDC 支持項目，資產保持在錢包中產生收益，用戶主動 claim 收益並選擇捐贈給支持的項目。

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

- Mint btcUSDC 支持項目（資產留在用戶錢包）
- 持有 btcUSDC 產生收益
- 主動 claim 收益並捐贈給支持的項目
- 隨時提取支持（burn btcUSDC 換回 USDC）
- 探索募資項目並查看進度
- 項目創建者提取捐贈並發布更新
