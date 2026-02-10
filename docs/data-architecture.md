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

- 公開數據：使用 API（projects, stats）
- 用戶數據：前端直接查詢（wallet balance, user caps）
- 實時交易：前端直接執行和監聽

### 階段 3：性能優化

- 短期緩存（30秒–1分鐘）：項目列表、項目詳情、Supporters
- 長期緩存（5–10分鐘）：平台統計、Updates
- 無緩存（實時）：用戶 wallet 數據、交易狀態

## 時間戳處理說明

Sui 區塊鏈返回的 `epoch_timestamp_ms()` 是標準的 Unix 毫秒時間戳：
- 直接使用即可，無需轉換
- 使用 `Date.now()` 計算相對時間
