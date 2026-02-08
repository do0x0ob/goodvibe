# 全局 Mock 狀態管理系統

## 🎯 目標

建立統一的全局狀態管理，讓所有頁面共享 Mock 數據，實現跨頁面的數據同步。

---

## 📦 核心組件

### MockDataContext
位置：`frontend/contexts/MockDataContext.tsx`

提供全局狀態管理，包含：
1. **Vault 狀態**：是否創建、vault 對象
2. **捐贈配置**：全局百分比
3. **項目分配**：allocations 列表
4. **保存狀態**：未保存變更追蹤

---

## 🔄 狀態結構

### 1. Vault 狀態
```typescript
hasMockVault: boolean;           // 是否已創建 mock vault
mockVault: Vault | null;         // Mock vault 對象
createMockVault: (address: string) => void;  // 創建函數
```

### 2. 捐贈配置
```typescript
globalDonationPercentage: number;  // 全局捐贈百分比（預設 50%）
setGlobalDonationPercentage: (percentage: number) => void;
```

### 3. 項目分配
```typescript
allocations: MockAllocation[];     // 分配列表
addAllocation: (projectId: string, initialPercentage?: number) => void;
updateAllocation: (projectId: string, percentage: number) => void;
removeAllocation: (projectId: string) => void;
hasAllocation: (projectId: string) => boolean;
```

### 4. 保存狀態
```typescript
hasUnsavedChanges: boolean;
setHasUnsavedChanges: (value: boolean) => void;
saveConfiguration: () => Promise<void>;
```

---

## 🌐 使用方式

### 1. Provider 設置
`frontend/app/providers.tsx`

```tsx
<QueryClientProvider>
  <SuiClientProvider>
    <WalletProvider>
      <MockDataProvider>
        {children}
      </MockDataProvider>
    </WalletProvider>
  </SuiClientProvider>
</QueryClientProvider>
```

### 2. 在組件中使用
```tsx
import { useMockData } from '@/contexts/MockDataContext';

function MyComponent() {
  const {
    hasMockVault,
    mockVault,
    globalDonationPercentage,
    allocations,
    addAllocation,
    // ...
  } = useMockData();
  
  // 使用狀態...
}
```

---

## 🔗 跨頁面數據流

### 完整流程示例

```
1. Dashboard 頁面
   用戶點擊 "Create Vault (Demo)"
   ↓
   createMockVault(address)
   ↓
   全局狀態更新：hasMockVault = true

2. Project 頁面
   自動檢測到 hasMockVault = true
   ↓
   顯示 "Add to My Allocations" 按鈕
   ↓
   用戶點擊添加
   ↓
   addAllocation(projectId, 25)
   ↓
   全局狀態更新：allocations.push({ projectId, percentage: 25 })

3. 回到 Dashboard
   自動顯示新添加的項目
   ↓
   用戶調整百分比
   ↓
   updateAllocation(projectId, 40)
   ↓
   全局狀態更新：hasUnsavedChanges = true

4. 用戶點擊 "Save Configuration"
   ↓
   saveConfiguration()
   ↓
   模擬上鏈 (1.5秒延遲)
   ↓
   全局狀態更新：hasUnsavedChanges = false
```

---

## 🎯 各頁面的使用

### Page.tsx (Dashboard)
```tsx
const { 
  hasMockVault, 
  mockVault, 
  createMockVault 
} = useMockData();

// 顯示 vault 狀態
const displayVault = hasMockVault ? mockVault : vault;

// 創建 mock vault
const handleCreateMockVault = () => {
  if (account) {
    createMockVault(account.address);
  }
};

// 傳遞給 DonationManager
<DonationManager 
  vault={displayVault}
  projects={projects || []}
/>
```

### DonationManager.tsx
```tsx
const {
  globalDonationPercentage,
  setGlobalDonationPercentage,
  allocations,
  updateAllocation,
  removeAllocation,
  hasUnsavedChanges,
  setHasUnsavedChanges,
  saveConfiguration,
} = useMockData();

// 使用全局狀態，無需本地 useState
// 所有操作直接更新全局狀態
```

### ProjectDetail.tsx
```tsx
const { 
  hasAllocation, 
  addAllocation, 
  allocations 
} = useMockData();

// 檢查是否已添加
const isAlreadyAdded = hasAllocation(project.id);
const currentAllocation = allocations.find(a => a.projectId === project.id);

// 添加項目
const handleAddToAllocations = async () => {
  addAllocation(project.id, 25);  // 預設 25%
  toast.success('Project added!');
};
```

### project/[projectId]/page.tsx
```tsx
const { 
  hasMockVault, 
  createMockVault 
} = useMockData();

const hasVault = hasMockVault;

const handleCreateMockVault = () => {
  if (account) {
    createMockVault(account.address);
  }
};
```

---

## 📊 數據持久性

### 當前實現（內存）
```
刷新頁面 → 所有狀態重置
```

### 未來改進（localStorage）
```typescript
// 在 MockDataContext 中添加
useEffect(() => {
  // 載入
  const saved = localStorage.getItem('mockData');
  if (saved) {
    const data = JSON.parse(saved);
    setHasMockVault(data.hasMockVault);
    // ...
  }
}, []);

useEffect(() => {
  // 保存
  localStorage.setItem('mockData', JSON.stringify({
    hasMockVault,
    allocations,
    globalDonationPercentage,
  }));
}, [hasMockVault, allocations, globalDonationPercentage]);
```

---

## 🎨 UI 狀態同步

### 1. Vault 創建狀態
```
任何頁面創建 vault
    ↓
全局 hasMockVault = true
    ↓
所有頁面即時更新
    • Dashboard: 顯示 vault 卡片
    • Project: 顯示 "Add" 按鈕
```

### 2. 項目添加狀態
```
Project 頁面添加項目
    ↓
全局 allocations.push()
    ↓
Dashboard: 即時顯示新項目
Project 頁面: 按鈕變為 "Already Added"
```

### 3. 配置調整狀態
```
Dashboard 調整百分比
    ↓
全局 hasUnsavedChanges = true
    ↓
顯示 "Unsaved changes" 標籤
保存按鈕啟用
```

---

## 🔧 關鍵函數

### createMockVault
```typescript
const createMockVault = (address: string) => {
  const newVault: Vault = {
    id: 'mock-vault-' + Date.now(),
    owner: address,
    balance: BigInt(10000_000_000), // $10,000
    name: 'My Vault',
    donations: {}
  };
  setMockVault(newVault);
  setHasMockVault(true);
};
```

### addAllocation
```typescript
const addAllocation = (projectId: string, initialPercentage: number = 25) => {
  // 防止重複添加
  if (allocations.find(a => a.projectId === projectId)) {
    return;
  }
  
  setAllocations([...allocations, { projectId, percentage: initialPercentage }]);
  setHasUnsavedChanges(true);
};
```

### updateAllocation
```typescript
const updateAllocation = (projectId: string, percentage: number) => {
  setAllocations(allocations.map(a => 
    a.projectId === projectId ? { ...a, percentage } : a
  ));
  setHasUnsavedChanges(true);
};
```

### saveConfiguration
```typescript
const saveConfiguration = async () => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // 實際應調用合約
  // await contract.updateDonationConfig(
  //   mockVault.id, 
  //   globalDonationPercentage, 
  //   allocations
  // );
  
  setHasUnsavedChanges(false);
  console.log('Configuration saved:', {
    vaultId: mockVault?.id,
    globalDonationPercentage,
    allocations
  });
};
```

---

## ✅ 完成的整合

### 修改的文件

1. ✅ **contexts/MockDataContext.tsx** (新建)
   - 創建全局狀態管理
   - 提供所有狀態和操作函數

2. ✅ **app/providers.tsx**
   - 添加 MockDataProvider
   - 包裹所有組件

3. ✅ **app/page.tsx** (Dashboard)
   - 移除本地 `hasMockVault` 狀態
   - 使用全局 `useMockData()`
   - 傳遞 `vault` 對象給 DonationManager

4. ✅ **components/dashboard/DonationManager.tsx**
   - 移除本地狀態
   - 使用全局狀態和函數
   - Props 改為接收 `vault` 對象
   - 計算聯動到 vault balance

5. ✅ **components/project/ProjectDetail.tsx**
   - 移除本地 percentage 狀態
   - 使用全局 `addAllocation`
   - 顯示「已添加」狀態
   - 簡化為一鍵添加（預設 25%）

6. ✅ **app/project/[projectId]/page.tsx**
   - 移除本地 vault 查詢
   - 使用全局 `hasMockVault`
   - 簡化 props 傳遞

---

## 🚀 優勢

### 1. **數據一致性**
- ✅ 單一數據源
- ✅ 無需手動同步
- ✅ 避免狀態衝突

### 2. **簡化組件**
- ✅ 減少本地狀態
- ✅ 減少 props drilling
- ✅ 代碼更簡潔

### 3. **即時響應**
- ✅ 任何頁面的操作立即反映到所有頁面
- ✅ 用戶體驗更流暢

### 4. **易於擴展**
- ✅ 新頁面直接使用 `useMockData()`
- ✅ 新狀態直接添加到 context
- ✅ 便於未來整合真實合約

---

## 🔄 與真實合約整合

當準備好連接真實合約時，只需：

1. **替換 createMockVault**
```typescript
const createMockVault = async (address: string) => {
  const txb = new TransactionBlock();
  // ... 調用合約創建 vault
  const result = await signAndExecuteTransactionBlock({ txb });
  // 更新狀態
};
```

2. **替換 addAllocation**
```typescript
const addAllocation = async (projectId: string, percentage: number) => {
  // 只更新本地狀態，實際保存在 saveConfiguration
  setAllocations([...allocations, { projectId, percentage }]);
  setHasUnsavedChanges(true);
};
```

3. **替換 saveConfiguration**
```typescript
const saveConfiguration = async () => {
  const txb = new TransactionBlock();
  // 一次性上鏈所有配置
  txb.moveCall({
    target: `${PACKAGE_ID}::donation::update_config`,
    arguments: [
      vault.id,
      globalDonationPercentage,
      allocations
    ]
  });
  await signAndExecuteTransactionBlock({ txb });
};
```

---

## 📊 狀態流向圖

```
┌─────────────────────────────────────┐
│     MockDataContext (Global)        │
│                                     │
│  • hasMockVault: boolean            │
│  • mockVault: Vault                 │
│  • globalDonationPercentage: 50     │
│  • allocations: [                   │
│      { projectId: 'A', %: 40 },     │
│      { projectId: 'B', %: 35 },     │
│      { projectId: 'C', %: 25 }      │
│    ]                                │
│  • hasUnsavedChanges: boolean       │
└────────────┬────────────────────────┘
             │
    ┌────────┴────────┬─────────┐
    │                 │         │
    ↓                 ↓         ↓
┌─────────┐    ┌──────────┐ ┌─────────┐
│Dashboard│    │ Project  │ │ Project │
│         │    │ Page     │ │ Detail  │
│ • Read  │    │          │ │         │
│ • Update│    │ • Read   │ │ • Read  │
│ • Save  │    │ • Check  │ │ • Add   │
└─────────┘    └──────────┘ └─────────┘
```

---

## 🎮 操作流程

### A. 創建 Vault
```
任何頁面
  ↓ 點擊 "Create Vault (Demo)"
  ↓ createMockVault(address)
  ↓
Context: hasMockVault = true
         mockVault = {...}
  ↓
所有頁面更新
  • Dashboard: 顯示 vault 卡片 ✓
  • Project: 顯示 "Add" 按鈕 ✓
```

### B. 添加項目
```
Project Detail 頁面
  ↓ 點擊 "Add to My Allocations"
  ↓ addAllocation(projectId, 25)
  ↓
Context: allocations.push({ projectId, percentage: 25 })
         hasUnsavedChanges = true
  ↓
即時更新
  • Project 頁面: 按鈕變為 "Already Added" ✓
  • Dashboard: 列表顯示新項目 ✓
```

### C. 調整配置
```
Dashboard
  ↓ 調整 Global Percentage 滑桿
  ↓ setGlobalDonationPercentage(60)
  ↓
Context: globalDonationPercentage = 60
         hasUnsavedChanges = true
  ↓
即時計算更新
  • 捐贈池金額更新 ✓
  • 所有項目年金額更新 ✓
  • "Unsaved changes" 標籤顯示 ✓
```

### D. 調整項目比例
```
Dashboard
  ↓ 拖動項目滑桿
  ↓ updateAllocation(projectId, 45)
  ↓
Context: allocations[i].percentage = 45
         hasUnsavedChanges = true
  ↓
即時更新
  • 總分配百分比重算 ✓
  • 項目年金額重算 ✓
  • 驗證狀態更新 ✓
```

### E. 保存配置
```
Dashboard
  ↓ 點擊 "Save Configuration"
  ↓ saveConfiguration()
  ↓
模擬上鏈 (1.5秒)
  ↓
Context: hasUnsavedChanges = false
  ↓
完成
  • "Unsaved changes" 標籤消失 ✓
  • 保存按鈕禁用 ✓
  • 顯示成功 toast ✓
```

---

## 🔍 狀態查詢示例

### 檢查項目是否已添加
```tsx
// Project Detail 頁面
const isAlreadyAdded = hasAllocation(project.id);

if (isAlreadyAdded) {
  // 顯示 "Already Added" 狀態
  return <AlreadyAddedState />;
} else {
  // 顯示 "Add" 按鈕
  return <AddButton />;
}
```

### 獲取當前分配
```tsx
const currentAllocation = allocations.find(a => a.projectId === project.id);

if (currentAllocation) {
  console.log(`Current allocation: ${currentAllocation.percentage}%`);
}
```

### 計算總分配
```tsx
const totalAllocation = allocations.reduce((sum, a) => sum + a.percentage, 0);

if (totalAllocation === 100) {
  // 完美分配 ✓
} else if (totalAllocation < 100) {
  // 未滿
} else {
  // 超額
}
```

---

## 🎉 優勢總結

### Before（分散狀態）
```
❌ Dashboard 有本地 hasMockVault
❌ Project Page 有本地 hasMockVault
❌ DonationManager 有本地 allocations
❌ ProjectDetail 有本地 percentage
❌ 狀態不同步
❌ 需要手動同步
```

### After（全局狀態）
```
✅ 單一數據源 (MockDataContext)
✅ 所有頁面共享狀態
✅ 自動同步，無需手動處理
✅ 數據一致性保證
✅ 簡化的組件邏輯
✅ 更好的用戶體驗
```

---

## 🔐 類型安全

```typescript
// Context 提供完整的 TypeScript 類型
interface MockDataContextType {
  hasMockVault: boolean;
  mockVault: Vault | null;
  globalDonationPercentage: number;
  allocations: MockAllocation[];
  // ... 所有方法都有明確的類型定義
}

// 自動類型推導和檢查
const { hasMockVault } = useMockData();  // hasMockVault: boolean ✓
```

---

現在整個應用使用統一的全局 Mock 狀態管理，所有頁面的數據完全同步！🎉
