# 捐贈邏輯說明文檔

## 📋 方案概述

GoodVibe 平台採用 **兩階段分配邏輯**，讓用戶能夠清楚控制捐贈總額並靈活分配。

---

## 🔄 兩階段分配模式

### **第一階段：全局捐贈設定**
用戶決定將多少**比例的收益**用於捐贈。

**範例：**
```
存款：$10,000
年化收益率 (APY)：5.2%
預估年收益：$520

第一階段設定：捐贈收益的 50%
→ 捐贈池：$520 × 50% = $260
→ 保留收益：$520 × 50% = $260
```

**特點：**
- ✅ 用戶清楚知道總共捐出多少收益
- ✅ 隨時可調整全局捐贈比例（0-100%）
- ✅ 剩餘收益保留給用戶

---

### **第二階段：項目分配**
將捐贈池按比例分配給各個項目，**總和必須為 100%**。

**範例：**
```
捐贈池：$260

項目分配：
- Ocean Cleanup：40% → $260 × 40% = $104
- Education Platform：35% → $260 × 35% = $91
- Wildlife Conservation：25% → $260 × 25% = $65

總計：100% = $260
```

**特點：**
- ✅ 分配比例總和鎖定在 100%，避免超額或不足
- ✅ 每個項目獲得的實際金額會即時顯示
- ✅ 可隨時調整項目分配比例

---

## 💰 實際計算邏輯

```typescript
// 第一階段計算
const annualYield = vaultBalance * (apy / 100);
const donationPool = annualYield * (globalDonationPercentage / 100);
const retainedYield = annualYield - donationPool;

// 第二階段計算
projects.forEach(project => {
  const projectAmount = donationPool * (project.allocationPercentage / 100);
  // projectAmount 即為該項目每年獲得的捐款
});
```

---

## 🎯 使用流程

### **步驟 1：設定全局捐贈比例**
位置：`Dashboard > Global Donation Settings`

1. 使用滑動條設定捐贈比例（0-100%）
2. 即時查看捐贈池總額和保留收益
3. 根據預估年收益計算

### **步驟 2：分配給項目**
位置：`Dashboard > Allocate to Projects` 或 `Project Page > Support This Project`

1. 選擇想支持的項目
2. 設定該項目在捐贈池中的分配比例
3. 查看該項目將獲得的實際金額
4. 確認總分配不超過 100%

### **步驟 3：管理分配**
位置：`Dashboard > Active Allocations`

- 查看所有已分配的項目
- 即時顯示每個項目的分配比例和金額
- 隨時移除或調整分配
- 查看總分配狀態（是否達到 100%）

---

## 🔍 UI 組件說明

### **1. Dashboard - Global Donation Settings**
```tsx
// 位置：frontend/components/dashboard/DonationManager.tsx

- 總捐贈比例滑動條（0-100%）
- 捐贈池總額顯示
- 保留收益顯示
- 基於實際收益的計算
```

### **2. Dashboard - Allocate to Projects**
```tsx
// 位置：frontend/components/dashboard/DonationManager.tsx

- 項目選擇器
- 分配比例滑動條（0-100%）
- 剩餘分配額度提示
- 實際金額預覽
- "Add to Allocations" 按鈕
```

### **3. Dashboard - Active Allocations**
```tsx
// 位置：frontend/components/dashboard/DonationManager.tsx

- 項目列表（名稱、類別）
- 分配比例顯示
- 實際年捐款金額
- 移除按鈕
- 總分配狀態指示器（綠色=100%，橙色=未滿，紅色=超額）
```

### **4. Project Page - Support This Project**
```tsx
// 位置：frontend/components/project/ProjectDetail.tsx

- 全局捐贈提示（引導到 Dashboard）
- 分配比例滑動條
- 即時金額預覽
- "Add to My Allocations" 按鈕
```

---

## 📊 資料結構

### **API Response Structure**
```typescript
// frontend/app/api/dashboard/route.ts

{
  vault: {
    id: string;
    balance: string;  // BigInt as string
    owner: string;
    apy: number;
    estimatedAnnualYield: string;  // BigInt as string
  },
  globalSettings: {
    totalDonationPercentage: number;  // 0-100
    donationPool: string;  // BigInt as string
  },
  donations: [
    {
      projectId: string;
      allocationPercentage: number;  // 0-100
      estimatedAnnualAmount: string;  // BigInt as string
      totalDonated: string;  // BigInt as string (累積)
    }
  ],
  stats: {
    totalDonated: string;  // BigInt as string (累積總額)
    activeProjects: number;
    totalAllocationPercentage: number;  // 應該=100
  }
}
```

---

## ⚠️ 驗證規則

### **第一階段驗證**
- `totalDonationPercentage` 必須在 0-100 之間
- 捐贈池 = 年收益 × (totalDonationPercentage / 100)

### **第二階段驗證**
- 所有項目的 `allocationPercentage` 總和必須 ≤ 100
- 建議總和 = 100（充分利用捐贈池）
- 單一項目的 `allocationPercentage` 必須在 0-100 之間

### **UI 提示**
```typescript
if (totalAllocation < 100) {
  // 橙色提示：還有未分配的捐贈池
  // `${100 - totalAllocation}% of donation pool is unallocated`
}

if (totalAllocation > 100) {
  // 紅色警告：超額分配
  // `Total allocation exceeds 100% (over by ${totalAllocation - 100}%)`
}

if (totalAllocation === 100) {
  // 綠色確認：完美分配
  // `100% allocated`
}
```

---

## 🆚 與方案 A 的對比

| 特性 | 方案 A（獨立百分比） | 方案 B（兩階段分配）✅ |
|------|-------------------|---------------------|
| 總額控制 | ❌ 不明確 | ✅ 清楚明確 |
| 超額風險 | ❌ 可能超過 100% | ✅ 鎖定在 100% |
| 用戶理解 | ⚠️ 需計算總捐贈 | ✅ 直觀易懂 |
| UI 複雜度 | ⚠️ 簡單但不精確 | ✅ 稍複雜但邏輯清晰 |
| 實際金額顯示 | ❌ 難以顯示 | ✅ 即時計算顯示 |

---

## 🔄 未來擴展

### **智能建議**
- 根據用戶的捐贈歷史推薦項目
- 推薦最佳分配比例（例如平均分配或按項目需求）

### **動態調整**
- 當收益率 (APY) 變動時，自動重新計算捐贈池
- 當用戶存款或提款時，更新預估金額

### **鏈上實現**
```move
// 智能合約結構建議
struct VaultConfig {
  owner: address,
  global_donation_percentage: u64,  // 第一階段
}

struct ProjectAllocation {
  project_id: ID,
  allocation_percentage: u64,  // 第二階段
}

// 驗證函數
fun validate_allocations(allocations: &vector<ProjectAllocation>): bool {
  let total = 0u64;
  vector::for_each(allocations, |a| {
    total = total + a.allocation_percentage;
  });
  total <= 100
}
```

---

## 📝 總結

兩階段分配邏輯提供了：
1. **清晰的總額控制**：用戶明確知道捐出多少收益
2. **靈活的項目分配**：可自由調整各項目佔比
3. **避免錯誤**：總和鎖定在 100%，避免超額或不足
4. **良好的用戶體驗**：即時顯示實際金額，易於理解

這種設計符合常見募資平台的邏輯，也更適合 GoodVibe 作為專業籌款平台的定位。
