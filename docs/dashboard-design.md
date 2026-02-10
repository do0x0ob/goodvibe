# Dashboard 設計

## 業務邏輯分析

### 贊助人視角（Supporter）
從合約獲取的數據：
- **SupportRecord** (用戶擁有的對象)
  - Dynamic fields: `ProjectSupport { project_id, amount, started_at, last_updated }`
- **Wallet Balance**
  - USDC 餘額（直接查詢）
  - btcUSDC 餘額（從 Stable Layer SDK）

需要聚合的信息：
1. 支持的項目列表（從 SupportRecord dynamic fields）
2. 每個項目的詳細信息（title, category, image）
3. 每個項目的統計（total_support_amount, supporter_count）
4. 自己的支持金額和時間

### 創建者視角（Creator）
從合約獲取的數據：
- **ProjectCap** (用戶擁有的對象)
- **Project** (shared object)：metadata、financial、stats

需要聚合的信息：
1. 創建的項目列表（從 ProjectCap 查詢）
2. 每個項目的完整數據
3. 財務統計（可提取餘額、總收款）
4. 運營統計（支持者數、Updates 數）

## API 設計

### 統一端點：GET /api/dashboard

**請求參數**：`?address=<user_address>`

**響應**：包含 `supporter`（錢包餘額、支持的項目列表）與 `creator`（項目數、項目列表與財務/運營統計）。

## 查詢邏輯

### Supporter 數據流
1. getUserSupportRecord(address) → recordId
2. getDynamicFields(recordId) → [ProjectSupport]
3. For each ProjectSupport: getProjectById(project_id) → 聚合
4. getCoins(address, USDC_TYPE) / getBtcUSDCBalance(address)

### Creator 數據流
1. getOwnedObjects(address, ProjectCap) → [ProjectCap]
2. For each ProjectCap: getProjectById、getProjectUpdates → 聚合

## 組件結構

- DashboardOverview
  - SupporterSection：WalletBalanceCard、SupportedProjectsList
  - CreatorSection：ProjectsStatsCard、OwnedProjectsList

## 優化建議

- 緩存：Dashboard 30s、錢包 10s、項目 60s
- 並行查詢 Supporter / Creator 與多項目詳情
- 部分失敗時降級展示，不影響其他區塊
