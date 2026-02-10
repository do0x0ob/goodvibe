# Mainnet Deployment Information

## 部署時間
2026-02-10

## 網絡
Mainnet

## 部署的模組
- platform
- project
- support_record
- vault

---

## 關鍵對象 ID

### Package ID
```
0x39fc285f0ac0f4160ce2562652d95d9e1f7fecd2e567f3235ce540549f3fb9f6
```

### DonationPlatform (Shared Object)
```
0xa05bb307a0a04abac061316ffe76df6efad71b449e10a24f8852bd57602f9c99
```

### UpgradeCap (Owned by Deployer)
```
0x334a0ec47b90b7ac1f4417572d55d5f1bd4004ca9d018ca92f2620fd086c9c5e
```

### Deployer Address
```
0x006d980cadd43c778e628201b45cfd3ba6e1047c65f67648a88f635108ffd6eb
```

---

## Gas 費用

- Computation Cost: 537,000 MIST (0.000537 SUI)
- Storage Cost: 79,488,400 MIST (0.0794884 SUI)
- Total Cost: ~0.08 SUI

---

## Transaction Details

**Digest:**
```
2eghK6ZBhtkfEnzvbS6DHxQyN2n78rHaZMkQPcbrq75e
```

**Explorer:**
```
https://suiscan.xyz/mainnet/tx/2eghK6ZBhtkfEnzvbS6DHxQyN2n78rHaZMkQPcbrq75e
```

---

## 環境變數配置

已更新 `frontend/.env.local`:

```env
NEXT_PUBLIC_SUI_NETWORK=mainnet
NEXT_PUBLIC_PACKAGE_ID=0x39fc285f0ac0f4160ce2562652d95d9e1f7fecd2e567f3235ce540549f3fb9f6
NEXT_PUBLIC_PLATFORM_ID=0xa05bb307a0a04abac061316ffe76df6efad71b449e10a24f8852bd57602f9c99
NEXT_PUBLIC_UPGRADE_CAP_ID=0x334a0ec47b90b7ac1f4417572d55d5f1bd4004ca9d018ca92f2620fd086c9c5e
NEXT_PUBLIC_USDC_TYPE=0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC
NEXT_PUBLIC_STABLE_COIN_TYPE=0x6d9fc33611f4881a3f5c0cd4899d95a862236ce52b3a38fef039077b0c5b5834::btc_usdc::BtcUSDC
```

---

## 下一步

1. **重啟開發服務器**
   ```bash
   cd frontend
   npm run dev
   ```

2. **測試功能**
   - 創建 Support Record
   - 支持項目
   - 查看 Dashboard
   - 測試 Creator 功能

3. **生產部署**
   ```bash
   npm run build
   npm start
   ```

---

## 重要提示

- ⚠️ 請妥善保管 UpgradeCap ID
- ⚠️ 只有擁有 UpgradeCap 的地址才能升級合約
- ✅ Platform ID 是 shared object，所有用戶都可以使用
- ✅ Package ID 是新部署的合約地址

---

**部署狀態**: ✅ 成功  
**版本**: 1  
**Epoch**: 1033
