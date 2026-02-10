# Dashboard 重構設計

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
  - Fields: `{ id, project_id }`
- **Project** (shared object)
  - metadata: title, description, category, cover_image_url
  - financial: balance, total_received, total_support_amount
  - stats: supporter_count, is_active, created_at

需要聚合的信息：
1. 創建的項目列表（從 ProjectCap 查詢）
2. 每個項目的完整數據
3. 財務統計（可提取餘額、總收款）
4. 運營統計（支持者數、Updates 數）

## API 設計

### 統一端點：GET /api/dashboard

**請求參數**：
```typescript
?address=<user_address>
```

**響應結構**：
```typescript
{
  // 贊助人數據
  supporter: {
    hasRecord: boolean;
    recordId?: string;
    wallet: {
      usdc: string;      // 原生 USDC
      btcUSDC: string;   // Stable Layer btcUSDC
    };
    supportedProjects: [
      {
        projectId: string;
        supportInfo: {
          amount: string;
          startedAt: number;
          lastUpdated: number;
        };
        projectData: {
          title: string;
          category: string;
          imageUrl: string;
          creator: string;
          totalSupportAmount: string;
          supporterCount: number;
          isActive: boolean;
        };
      }
    ];
  };
  
  // 創建者數據
  creator: {
    projectCount: number;
    projects: [
      {
        projectId: string;
        projectCapId: string;
        metadata: {
          title: string;
          description: string;
          category: string;
          imageUrl: string;
        };
        financial: {
          balance: string;           // 可提取的捐款
          totalReceived: string;     // 累計收到的捐款
          totalSupportAmount: string; // 總支持金額
        };
        stats: {
          supporterCount: number;
          updatesCount: number;
          isActive: boolean;
          createdAt: string;
        };
      }
    ];
  };
}
```

## 查詢邏輯

### Supporter 數據流
```
1. getUserSupportRecord(address) → recordId
2. getDynamicFields(recordId) → [ProjectSupport]
3. For each ProjectSupport:
   - getProjectById(project_id) → Project data
   - 聚合支持信息 + 項目信息
4. getCoins(address, USDC_TYPE) → USDC balance
5. getBtcUSDCBalance(address) → btcUSDC balance
```

### Creator 數據流
```
1. getOwnedObjects(address, ProjectCap) → [ProjectCap]
2. For each ProjectCap:
   - getProjectById(project_id) → Project data
   - getProjectUpdates(project_id).length → updates count
   - 聚合項目完整數據
```

## 組件結構

```
DashboardOverview
├── SupporterSection
│   ├── WalletBalanceCard
│   │   ├── USDC Balance
│   │   └── btcUSDC Balance
│   └── SupportedProjectsList
│       └── SupportedProjectCard × N
└── CreatorSection
    ├── ProjectsStatsCard
    └── OwnedProjectsList
        └── OwnedProjectCard × N
            ├── Financial Stats
            ├── Supporter Stats
            └── Management Actions
```

## 優化建議

1. **緩存策略**
   - Dashboard 數據 staleTime: 30s
   - 錢包餘額 staleTime: 10s（較頻繁更新）
   - 項目數據 staleTime: 60s

2. **並行查詢**
   - Supporter 和 Creator 數據可並行查詢
   - 多個項目的詳情可並行查詢

3. **錯誤處理**
   - 部分數據失敗不影響其他數據顯示
   - 提供降級展示（顯示部分可用數據）

4. **性能考慮**
   - 限制單次查詢的項目數量（例如最多 50 個）
   - 使用虛擬滾動處理大量項目列表
