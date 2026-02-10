# Dashboard 遷移指南

## 🚀 快速啟用新版 Dashboard

### 步驟 1: 更新 Dashboard 頁面

找到你的 dashboard 頁面文件並更新：

```typescript
// app/dashboard/page.tsx (或類似路徑)

// ❌ 移除舊的 import
// import { DashboardOverview } from '@/components/dashboard/DashboardOverview';

// ✅ 使用新的組件
import { DashboardV2 } from '@/components/dashboard/DashboardV2';

export default function DashboardPage() {
  return <DashboardV2 />;
}
```

### 步驟 2: 測試 API

在瀏覽器訪問（替換你的錢包地址）：
```
http://localhost:3000/api/dashboard-v2?address=YOUR_WALLET_ADDRESS
```

應該看到 JSON 響應，包含 `supporter` 和 `creator` 兩個主要區塊。

### 步驟 3: 測試功能

#### Supporter 區塊
1. ✅ 錢包餘額顯示正確（USDC + btcUSDC）
2. ✅ 支持的項目列表顯示
3. ✅ 每個項目的支持金額和時間正確
4. ✅ 點擊項目可跳轉到詳情頁

#### Creator 區塊
1. ✅ 我的項目列表顯示
2. ✅ 財務數據正確（可提取餘額、總收款、總支持額）
3. ✅ 統計數據正確（支持者數、Updates 數）
4. ✅ 點擊 "Manage Project" 跳轉到管理頁面
5. ✅ 創建新項目功能正常

### 步驟 4: 清理舊代碼（可選）

測試無誤後，可以刪除或備份舊文件：

```bash
# 備份舊文件
mv app/api/dashboard/route.ts app/api/dashboard/route.ts.backup
mv components/dashboard/DashboardOverview.tsx components/dashboard/DashboardOverview.tsx.backup
mv components/dashboard/MyProjectsManager.tsx components/dashboard/MyProjectsManager.tsx.backup
mv hooks/useDashboardData.ts hooks/useDashboardData.ts.backup
```

---

## 🔍 問題排查

### 問題 1: API 返回 400/500 錯誤

**檢查**：
```bash
# 確認環境變量配置
echo $NEXT_PUBLIC_PACKAGE_ID
```

**解決**：
確保 `.env.local` 有正確的配置：
```
NEXT_PUBLIC_PACKAGE_ID=0x39fc285f0ac0f4160ce2562652d95d9e1f7fecd2e567f3235ce540549f3fb9f6
```

### 問題 2: Supporter 區塊顯示空

**可能原因**：
- 用戶沒有創建 SupportRecord
- 用戶沒有支持任何項目

**檢查**：
打開開發者工具 Console，查找：
```
[fetchSupporterData] 
[fetchSupportedProjects]
```

### 問題 3: Creator 區塊顯示空

**可能原因**：
- 用戶沒有創建任何項目
- ProjectCap 查詢失敗

**檢查**：
控制台查找：
```
[fetchCreatorData]
```

### 問題 4: 錢包餘額顯示 0

**可能原因**：
- 錢包確實沒有餘額
- USDC_TYPE 或 STABLE_COIN_TYPE 配置錯誤

**檢查**：
```bash
# 查看配置的 coin types
grep "USDC_TYPE\|STABLE_COIN_TYPE" .env.local
```

---

## 📊 數據更新機制

### 自動刷新時機

新版 Dashboard 會在以下情況自動刷新：

1. **支持項目後**
   - Supporter 區塊更新
   - 錢包餘額更新

2. **創建項目後**
   - Creator 區塊更新
   - 項目列表增加

3. **發布 Update 後**
   - 對應項目的 Updates 數量更新

4. **提取捐款後**
   - 項目財務數據更新
   - 錢包餘額更新

### React Query 緩存設置

```typescript
{
  queryKey: ['dashboardV2', address],
  staleTime: 30 * 1000,  // 30 秒內視為新鮮數據
  retry: 2,               // 失敗重試 2 次
}
```

### 手動刷新（如果需要）

在組件中可以這樣實現：

```typescript
import { useQueryClient } from '@tanstack/react-query';

function MyComponent() {
  const queryClient = useQueryClient();
  
  const handleRefresh = () => {
    queryClient.invalidateQueries({ 
      queryKey: ['dashboardV2'] 
    });
  };
  
  return <button onClick={handleRefresh}>Refresh</button>;
}
```

---

## 🎨 UI/UX 特性

### 視覺設計
- ✅ 漸層背景的錢包卡片
- ✅ 清晰的統計數據展示
- ✅ Hover 效果和過渡動畫
- ✅ 響應式布局（桌面/移動端）

### 互動設計
- ✅ 項目卡片可點擊跳轉
- ✅ 創建表單可展開/收起
- ✅ 圖片預覽功能
- ✅ Loading 和 Error 狀態處理

### 空狀態設計
- ✅ 引導性文案
- ✅ 明確的 Call-to-Action
- ✅ 友好的圖標設計

---

## 🔗 相關文件索引

### 核心文件
- `DASHBOARD_REDESIGN.md` - 設計思路和架構說明
- `DASHBOARD_REFACTOR_COMPLETE.md` - 完整的重構報告
- `DASHBOARD_MIGRATION_GUIDE.md` - 本文檔

### 實現文件
- `app/api/dashboard-v2/route.ts` - API 實現
- `hooks/useDashboardV2.ts` - Hook 實現
- `components/dashboard/DashboardV2.tsx` - 主組件
- `components/dashboard/WalletBalanceCard.tsx` - 錢包卡片
- `components/dashboard/SupportedProjectsSection.tsx` - 支持的項目
- `components/dashboard/OwnedProjectsSection.tsx` - 我的項目
- `components/dashboard/CreateProjectForm.tsx` - 創建表單

---

## ✅ 完成檢查清單

在啟用新版前，確認：

- [ ] 所有新文件都已創建
- [ ] `.env.local` 配置正確（PACKAGE_ID 等）
- [ ] 開發服務器已重啟
- [ ] Dashboard 頁面已更新為使用 DashboardV2
- [ ] API 可以正常訪問並返回數據
- [ ] 至少測試過一次完整流程

---

## 🎯 遷移結果

### Before (舊版)
- 功能不完整（只有部分支持者數據）
- 使用 mock 數據
- 職責混亂
- 難以維護

### After (新版)
- ✅ 功能完整（支持者 + 創建者視角）
- ✅ 真實鏈上數據
- ✅ 清晰的架構
- ✅ 易於擴展和維護
- ✅ 性能優化（並行查詢、緩存）

---

## 📞 需要幫助？

如果遇到問題，請提供：
1. 控制台完整的錯誤日誌
2. API 返回的數據（如果有）
3. 瀏覽器的 Network 面板截圖
4. 預期行為 vs 實際行為的描述

祝重構順利！🎉
