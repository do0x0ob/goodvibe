# Vault 與 Donation 金額聯動設計

## 🔄 核心改進

### 1. **數據聯動**
兩個組件現在共享 `Vault` 數據，實現即時金額計算聯動。

---

## 📊 計算邏輯

### VaultManagement 組件
```typescript
const vaultBalanceUSD = Number(vault.balance) / 1_000_000;
// 例如：10,000 USDC
```

### DonationManager 組件（聯動計算）
```typescript
// 從 vault balance 計算
const vaultBalanceUSD = useMemo(() => {
  return Number(vault.balance) / 1_000_000;
}, [vault.balance]);

// 計算年化收益
const estimatedAnnualYield = useMemo(() => {
  return vaultBalanceUSD * 0.052; // 5.2% APY
}, [vaultBalanceUSD]);

// 計算捐贈池
const donationPool = useMemo(() => {
  return estimatedAnnualYield * (totalDonationPercentage / 100);
}, [estimatedAnnualYield, totalDonationPercentage]);

// 計算保留收益
const retainedYield = useMemo(() => {
  return estimatedAnnualYield - donationPool;
}, [estimatedAnnualYield, donationPool]);
```

---

## 💰 實例計算

### 情境：
- **Vault Balance**: $10,000 USDC
- **APY**: 5.2%
- **Global Donation %**: 50%

### 計算流程：
```
1. Vault Balance = $10,000
2. Annual Yield = $10,000 × 5.2% = $520
3. Donation Pool = $520 × 50% = $260
4. Retained Yield = $520 - $260 = $260
```

### 項目分配（假設三個項目）：
```
Donation Pool: $260

Project A: 40% = $260 × 40% = $104/year
Project B: 35% = $260 × 35% = $91/year
Project C: 25% = $260 × 25% = $65/year

Total: 100% = $260/year
```

---

## 🎨 統一字體設計

### 標題層級
```css
h3 (組件標題):     text-xl font-serif
說明文字:          text-sm
小標籤:           text-xs uppercase tracking-wide
```

### 金額層級（統一後）

#### VaultManagement
```css
Vault Balance:    text-2xl font-serif  (統一為 2xl)
Wallet Balance:   text-xl font-serif   (統一為 xl)
標籤文字:         text-xs text-ink-500
```

#### DonationManager
```css
百分比大數字:      text-2xl font-serif  (從 3xl 降為 2xl)
捐贈池金額:       text-2xl font-serif  (保持 2xl)
保留收益:         text-xl font-serif   (保持 xl)
項目年金額:       text-xl font-serif   (保持 xl)
標籤文字:         text-xs text-ink-500
```

### Before vs After

#### Before（不一致）
```
VaultManagement:
  Vault Balance:  text-3xl  ← 太大
  Wallet:         text-lg   ← 太小

DonationManager:
  Percentage:     text-3xl  ← 太大
  Donation Pool:  text-2xl  ✓
```

#### After（統一）
```
VaultManagement:
  Vault Balance:  text-2xl  ✓ 統一
  Wallet:         text-xl   ✓ 統一

DonationManager:
  Percentage:     text-2xl  ✓ 統一
  Donation Pool:  text-2xl  ✓ 統一
  Retained:       text-xl   ✓ 統一
```

---

## 🔗 組件接口變更

### DonationManager Props

#### Before
```typescript
interface DonationManagerProps {
  vaultId: string;  // 只有 ID
  projects: Project[];
}
```

#### After
```typescript
interface DonationManagerProps {
  vault: Vault;     // 完整的 Vault 對象
  projects: Project[];
}
```

### 傳遞方式變更

#### Before（page.tsx）
```tsx
<DonationManager 
  vaultId={displayVaultId}
  projects={projects || []}
/>
```

#### After（page.tsx）
```tsx
<DonationManager 
  vault={displayVault}
  projects={projects || []}
/>
```

---

## 📱 響應式聯動

### 當 Vault Balance 變化時：

```
Vault Balance 變更
    ↓
Annual Yield 自動重算 (useMemo)
    ↓
Donation Pool 自動重算 (useMemo)
    ↓
每個 Project 的年金額自動重算
    ↓
UI 即時更新
```

### 示例：

**用戶存入 $5,000 更多資金**

```
Before:
Vault: $10,000 → Yield: $520 → Pool (50%): $260

After:
Vault: $15,000 → Yield: $780 → Pool (50%): $390

Impact:
Project A (40%): $104 → $156 (+$52/year)
Project B (35%): $91 → $136.50 (+$45.50/year)
Project C (25%): $65 → $97.50 (+$32.50/year)
```

---

## 🎯 用戶體驗改善

### 1. **即時反饋**
- 用戶在 VaultManagement 存款/提款
- DonationManager 立即顯示新的捐贈金額
- 無需刷新頁面

### 2. **透明計算**
- 清楚顯示計算公式
- 底部註解說明來源
```
Based on $10,000.00 vault balance × 5.2% APY = $520.00 annual yield
```

### 3. **視覺一致性**
- 兩個組件使用相同的字體大小階層
- 相同的圓角 (`rounded-3xl`)
- 相同的內距 (`p-8`)
- 統一的視覺權重

---

## 🔧 技術實現細節

### useMemo 優化

```typescript
// 避免不必要的重複計算
const estimatedAnnualYield = useMemo(() => {
  return vaultBalanceUSD * 0.052;
}, [vaultBalanceUSD]);  // 只在 vault balance 變化時重算
```

### 格式化顯示

```typescript
// 統一使用 2 位小數
${donationPool.toFixed(2)}
${retainedYield.toFixed(2)}
${vaultBalanceUSD.toFixed(2)}
```

### BigInt 處理

```typescript
// 將鏈上的 BigInt 轉換為美元顯示
const vaultBalanceUSD = Number(vault.balance) / 1_000_000;
```

---

## 🎨 視覺設計細節

### 卡片統一
```css
rounded-3xl    /* 更大的圓角 */
p-8           /* 統一內距 */
shadow-lg     /* 統一陰影 */
border-ink-300/20  /* 統一邊框 */
```

### 信息層次
```
主要金額 (text-2xl) - 最重要的數字
    ↓
次要金額 (text-xl) - 相關但次要的數字
    ↓
標籤 (text-xs) - 說明性文字
```

### 顏色系統
```css
金額主色: text-ink-900 (最深)
金額次色: text-ink-700 (次深)
標籤顏色: text-ink-500 (中等)
說明文字: text-ink-600 (輔助)
```

---

## 📊 完整數據流

```
┌─────────────────────┐
│  VaultManagement    │
│  Balance: $10,000   │
└──────────┬──────────┘
           │
           ↓ vault object
┌──────────────────────────────┐
│  DonationManager             │
│                              │
│  Vault: $10,000              │
│    ↓ × 5.2% APY              │
│  Yield: $520                 │
│    ↓ × 50% donation          │
│  Pool: $260                  │
│    ↓ split to projects       │
│  • Project A: 40% = $104/yr  │
│  • Project B: 35% = $91/yr   │
│  • Project C: 25% = $65/yr   │
└──────────────────────────────┘
```

---

## ✅ 改進總結

### 數據層面
✅ Vault balance 與 donation 金額即時聯動
✅ 使用 useMemo 優化計算性能
✅ 完整的計算鏈條：balance → yield → pool → projects

### UI 層面
✅ 統一字體大小層級（2xl/xl/xs）
✅ 統一卡片樣式（圓角、內距、陰影）
✅ 統一標籤樣式（uppercase tracking-wide）

### UX 層面
✅ 即時反饋，無需刷新
✅ 透明計算，顯示公式
✅ 清晰的視覺層次

---

## 🚀 未來可擴展

### 1. 動態 APY
```typescript
// 從合約或 API 獲取實時 APY
const currentAPY = await fetchCurrentAPY();
const estimatedAnnualYield = vaultBalanceUSD * currentAPY;
```

### 2. 歷史數據對比
```typescript
// 顯示變化趨勢
const lastMonthDonation = getHistoricalDonation(-1);
const change = donationPool - lastMonthDonation;
```

### 3. 實時收益累積
```typescript
// 顯示當前已累積的收益
const accruedYield = calculateAccruedYield(vault);
```

這次改進確保了兩個核心組件的數據一致性和視覺一致性，提供了更好的用戶體驗！🎉
