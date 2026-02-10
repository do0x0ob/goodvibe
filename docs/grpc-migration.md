# Sui gRPC 遷移指南

## 概述

Sui 正在將 JSON-RPC 遷移至 gRPC，截止日期為 **2026 年 4 月**。本專案已完成 gRPC 遷移準備。

## 為什麼要遷移到 gRPC？

1. **效能提升**：gRPC 使用 Protocol Buffers 二進制序列化，比 JSON 更高效
2. **型別安全**：強型別的 proto 定義提供更好的型別檢查
3. **串流支援**：原生支援伺服器端串流，適合即時資料訂閱
4. **未來支援**：JSON-RPC 將在 2026 年 4 月後停止支援

## 架構變更

### 原本架構（JSON-RPC）

```
Frontend/Backend
    ↓
SuiClient (HTTP)
    ↓
Sui Fullnode (JSON-RPC)
```

### 新架構（gRPC）

```
Frontend/Backend
    ↓
GrpcSuiClientAdapter
    ↓
gRPC Clients (LedgerService, StateService, etc.)
    ↓
Sui Fullnode (gRPC)
```

## 檔案結構

```
frontend/lib/sui/
├── client.ts              # 主要客戶端入口（自動選擇 gRPC 或 HTTP）
├── grpc-client.ts         # gRPC 客戶端初始化與連線管理
├── grpc-adapter.ts        # gRPC 適配器（提供與 SuiClient 相容的 API）
├── grpc-events.ts         # gRPC 事件查詢實作（基於 checkpoint）
└── queries.ts             # 查詢函數（同時支援 gRPC 和 HTTP）

frontend/protos/
└── proto/                 # Sui gRPC Proto 定義檔案
    └── sui/rpc/v2/
        ├── ledger_service.proto
        ├── state_service.proto
        ├── transaction_execution_service.proto
        └── ...
```

## 設定步驟

### 1. 環境變數設定

在 `.env.local` 中加入 gRPC 端點配置：

```bash
# gRPC Configuration
# 填入你的 gRPC endpoint（例如來自 QuickNode, PublicNode 等）
SUI_GRPC_ENDPOINT=your-endpoint.sui-mainnet.quiknode.pro:9000

# 如果需要 token 認證，請填入
SUI_GRPC_TOKEN=your_access_token
```

### 2. 取得 gRPC 端點

你可以從以下提供商取得 Sui gRPC 端點：

#### QuickNode
1. 註冊 [QuickNode](https://www.quicknode.com/)
2. 建立 Sui Mainnet 端點
3. 端點格式：`https://[endpoint-name].sui-mainnet.quiknode.pro:9000`
4. 複製 endpoint 和 token

#### 自架節點
如果你運行自己的 Sui fullnode：
```bash
# 在 fullnode 設定中啟用 gRPC
# gRPC 預設監聽 port 9000
SUI_GRPC_ENDPOINT=your-node-domain.com:9000
```

### 3. 驗證設定

設定完成後，應用程式會自動使用 gRPC：

```typescript
import { getSuiClient, isGrpcEnabled } from '@/lib/sui/client';

// 檢查是否啟用 gRPC
console.log('gRPC enabled:', isGrpcEnabled());

// 取得客戶端（自動選擇 gRPC 或 HTTP）
const client = getSuiClient();
```

## API 對應

### Sui gRPC Services

| 服務 | 用途 | 對應的原 JSON-RPC 方法 |
|------|------|----------------------|
| **LedgerService** | 查詢 objects, transactions, checkpoints | `getObject`, `getTransaction`, `getCheckpoint` |
| **StateService** | 查詢餘額、擁有的物件 | `getBalance`, `getOwnedObjects` |
| **TransactionExecutionService** | 執行交易 | `executeTransactionBlock` |
| **SubscriptionService** | 訂閱 checkpoint 更新 | N/A（新功能） |
| **MovePackageService** | 查詢 Move package 資訊 | `getNormalizedMoveModule` |
| **SignatureVerificationService** | 驗證簽名 | N/A（新功能） |

### 事件查詢的重要變更

**JSON-RPC 方式：**
```typescript
// 直接查詢事件
const events = await client.queryEvents({
  query: { MoveEventType: 'pkg::module::Event' },
  limit: 50,
});
```

**gRPC 方式：**
```typescript
// 透過 checkpoint 掃描事件
import { queryEventsViaGrpc } from '@/lib/sui/grpc-events';

const result = await queryEventsViaGrpc({
  query: { MoveEventType: 'pkg::module::Event' },
  limit: 50,
});
```

> ⚠️ **注意**：gRPC 的事件查詢使用 checkpoint 掃描，可能比 JSON-RPC 慢。對於即時監控，建議使用 `subscribeToEvents()` 串流訂閱。

## 使用方式

### 在 API Routes 中使用

```typescript
// app/api/projects/route.ts
import { getSuiClient } from '@/lib/sui/client';
import { getAllProjects } from '@/lib/sui/queries';

export async function GET() {
  const client = getSuiClient(); // 自動使用 gRPC（如果已設定）
  const projects = await getAllProjects(client, PACKAGE_ID);
  return NextResponse.json(projects);
}
```

### 在 React Hooks 中使用

```typescript
// hooks/useProjects.ts
import { useSuiClient } from '@mysten/dapp-kit';
import { getAllProjects } from '@/lib/sui/queries';

export function useProjects() {
  // 注意：在瀏覽器端仍使用 HTTP，因為 gRPC 僅支援 Node.js
  const client = useSuiClient();
  
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => getAllProjects(client, PACKAGE_ID),
  });
}
```

### 訂閱即時事件

```typescript
import { subscribeToEvents } from '@/lib/sui/grpc-events';

// 訂閱新的專案建立事件
const unsubscribe = subscribeToEvents(
  {
    query: { MoveEventType: `${PACKAGE_ID}::project::ProjectCreatedEvent` },
  },
  (event) => {
    console.log('New project created:', event);
  },
  (error) => {
    console.error('Subscription error:', error);
  }
);

// 取消訂閱
unsubscribe();
```

## 向後相容性

### 混合模式運行

專案支援同時運行 gRPC 和 HTTP JSON-RPC：

- **未設定 `SUI_GRPC_ENDPOINT`**：使用傳統 HTTP JSON-RPC
- **已設定 `SUI_GRPC_ENDPOINT`**：
  - 伺服器端（API routes）：使用 gRPC
  - 瀏覽器端：仍使用 HTTP（因為 gRPC 客戶端僅支援 Node.js）

### 回退機制

如果 gRPC 連線失敗，系統會自動回退到 HTTP JSON-RPC：

```typescript
export function getSuiClient() {
  if (isGrpcEnabled() && typeof window === 'undefined') {
    try {
      const adapter = getGrpcSuiAdapter();
      if (adapter) return adapter;
    } catch (error) {
      console.error('gRPC failed, falling back to HTTP:', error);
    }
  }
  return suiClient; // 回退到 HTTP
}
```

## 效能考量

### gRPC 優勢

- ✅ 更小的訊息大小（Protocol Buffers vs JSON）
- ✅ 更快的序列化/反序列化
- ✅ 支援串流（即時資料）
- ✅ 更好的型別安全

### 注意事項

- ⚠️ 事件查詢在 gRPC 中使用 checkpoint 掃描，可能較慢
- ⚠️ 需要額外的 proto 檔案（約 2MB）
- ⚠️ gRPC 僅在 Node.js 環境可用（不支援瀏覽器）

## 除錯

### 啟用詳細日誌

```typescript
// 在 grpc-client.ts 中
export const GRPC_DEBUG = process.env.GRPC_DEBUG === 'true';

if (GRPC_DEBUG) {
  console.log('gRPC request:', method, request);
  console.log('gRPC response:', response);
}
```

### 常見問題

**Q: 為什麼瀏覽器端還是用 HTTP？**  
A: `@grpc/grpc-js` 僅支援 Node.js。瀏覽器需要使用 `@grpc/grpc-web`，這是不同的實作。目前我們在伺服器端（API routes）使用 gRPC，客戶端使用 HTTP。

**Q: gRPC 連線失敗怎麼辦？**  
A: 檢查：
1. `SUI_GRPC_ENDPOINT` 是否正確
2. 端點是否需要 SSL（預設使用 SSL）
3. `SUI_GRPC_TOKEN` 是否正確（如果需要）
4. 防火牆是否允許 port 9000

**Q: 事件查詢太慢？**  
A: gRPC 事件查詢使用 checkpoint 掃描。建議：
1. 減少 `checkpointsToScan` 參數
2. 使用 `subscribeToEvents` 串流訂閱即時事件
3. 考慮建立事件索引服務

## 遷移檢查清單

- [x] 安裝 gRPC 依賴（`@grpc/grpc-js`, `@grpc/proto-loader`）
- [x] 下載 Sui proto 檔案
- [x] 建立 gRPC 客戶端（`grpc-client.ts`）
- [x] 建立適配器層（`grpc-adapter.ts`）
- [x] 實作事件查詢（`grpc-events.ts`）
- [x] 更新 `client.ts` 支援自動選擇
- [ ] 設定 `SUI_GRPC_ENDPOINT` 環境變數
- [ ] 測試所有 API 端點
- [ ] 監控效能指標
- [ ] 更新部署文件

## 參考資源

- [Sui gRPC 官方文件](https://docs.sui.io/concepts/data-access/grpc)
- [Sui Proto 定義](https://github.com/MystenLabs/sui-apis)
- [QuickNode Sui gRPC 教學](https://quicknode.com/docs/sui/sui-grpc)
- [gRPC 官方文件](https://grpc.io/docs/)

## 結論

完成 gRPC 遷移後：

1. 設定 `SUI_GRPC_ENDPOINT` 環境變數
2. 應用程式會自動在伺服器端使用 gRPC
3. 瀏覽器端繼續使用 HTTP（相容性）
4. 在 2026 年 4 月前完成完整測試和部署

如有任何問題，請參考本文件或查閱官方資源。
