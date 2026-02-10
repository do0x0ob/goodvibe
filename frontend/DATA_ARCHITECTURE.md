# 前端資料架構設計

## 目前狀況分析

### 現有 API Routes
```
/api/projects              - 獲取所有項目列表
/api/projects/[projectId]  - 獲取單個項目詳情（新增）✅
/api/dashboard             - 用戶儀表板數據
/api/stats                 - 平台統計數據
/api/vault                 - Vault 相關數據
/api/support-record        - 支持記錄
/api/debug/*              - 調試用 API
```

### 資料來源混雜問題
目前頁面資料來源不統一：
- ✅ Projects List：使用 API (`/api/projects`)
- ✅ Dashboard：使用 API (`/api/dashboard`)
- ❌ Project Details：混合使用（部分直接查鏈上）
- ❌ Project Updates：前端直接查詢 dynamic fields
- ❌ Project Supporters：前端直接查詢事件

## 推薦架構：統一後端 API

### 優點
1. **性能優化**：後端可以實現緩存策略
2. **錯誤處理**：統一的錯誤處理和重試邏輯
3. **代碼簡潔**：前端代碼更簡單，只需要調用 HTTP API
4. **安全性**：敏感的 RPC 調用集中在後端
5. **可維護性**：鏈上查詢邏輯集中管理
6. **監控和日誌**：更容易追蹤和調試

### 缺點
1. **額外延遲**：多一層 HTTP 請求
2. **服務器負載**：需要處理更多請求
3. **實時性**：可能不如直接查詢鏈上即時

### 適用場景
- ✅ 公開數據展示（項目列表、詳情、統計）
- ✅ 需要複雜聚合的數據（supporters、updates）
- ✅ 需要緩存的高頻查詢
- ❌ 需要實時更新的數據（交易狀態）
- ❌ 用戶特定的錢包數據（直接從 dApp Kit 獲取更好）

## 建議實現方案

### 階段 1：項目詳情頁統一 API ✅ 完成

```typescript
// API: GET /api/projects/[projectId]
// 返回：
{
  project: { /* 項目基本信息 */ },
  updates: [ /* 所有更新 */ ],
  supporters: [ /* 所有支持者 */ ]
}
```

**使用方式**：
```typescript
import { useProjectDetail } from '@/hooks/useProjectDetail';

const { data, isLoading } = useProjectDetail(projectId);
// data.project, data.updates, data.supporters
```

### 階段 2：其他頁面優化（可選）

#### 選項 A：全部統一到 API（推薦用於生產環境）
```
GET /api/projects                    - 所有項目
GET /api/projects/[id]               - 項目詳情 + updates + supporters ✅
GET /api/projects/[id]/updates       - 僅更新（如果需要單獨刷新）
GET /api/projects/[id]/supporters    - 僅支持者（如果需要單獨刷新）
GET /api/dashboard?address=xxx       - 用戶儀表板 ✅
GET /api/stats                       - 平台統計 ✅
```

#### 選項 B：混合模式（推薦用於開發階段）
- 公開數據：使用 API（projects, stats）
- 用戶數據：前端直接查詢（wallet balance, user caps）
- 實時交易：前端直接執行和監聽

### 階段 3：性能優化

#### 後端緩存策略
```typescript
// 短期緩存（30秒 - 1分鐘）
- 項目列表
- 項目詳情
- Supporters 列表

// 長期緩存（5-10分鐘）
- 平台統計
- Updates（相對不變）

// 無緩存（實時）
- 用戶 wallet 數據
- 交易狀態
```

#### 前端優化
```typescript
// React Query 配置
{
  staleTime: 30000,     // 數據在 30 秒內視為新鮮
  cacheTime: 300000,    // 未使用的數據 5 分鐘後清除
  refetchOnWindowFocus: true,  // 窗口重新聚焦時刷新
}
```

## 當前實現狀態

### ✅ 已完成
1. 創建 `/api/projects/[projectId]` 統一 API
2. 創建 `useProjectDetail` hook
3. 添加詳細的調試日誌
4. 修復時間格式化函數

### 🔄 待完成
1. 更新 `ProjectDetail.tsx` 使用新的 `useProjectDetail` hook
2. 移除舊的單獨查詢 hooks（`useProjectUpdates`, `useProjectSupporters`）
3. 測試並驗證所有功能正常

### 📋 可選優化
1. 添加 API 層面的緩存（Redis/Memory）
2. 實現增量更新機制
3. 添加 WebSocket 支持實時更新
4. 實現 API rate limiting

## 推薦做法總結

### 對於你的項目
**推薦使用統一後端 API**，因為：
1. 這是一個公開展示平台，大部分是只讀數據
2. Supporters 和 Updates 需要複雜的事件聚合
3. 可以實現良好的緩存策略提升性能
4. 代碼結構更清晰，更易維護

### 保留前端直接查詢的場景
1. **交易執行**：用戶發起交易時
2. **Wallet 數據**：當前連接的錢包餘額、owned objects
3. **實時驗證**：需要最新鏈上狀態時

## 時間戳處理說明

Sui 區塊鏈返回的 `epoch_timestamp_ms()` 是標準的 Unix 毫秒時間戳：
- 直接使用即可，無需轉換
- 使用 `Date.now()` 計算相對時間
- 如果顯示不正確，可能是時區設置問題

```typescript
// ✅ 正確
const relativeTime = Date.now() - timestamp;

// ❌ 錯誤（不需要額外轉換）
const relativeTime = Date.now() - (timestamp * 1000);
```
