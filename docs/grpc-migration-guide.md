# Sui gRPC 遷移指南

## 概述

本專案已從 Sui JSON-RPC 遷移到 gRPC（Surflux 提供商）。採用**混合架構**：部分查詢使用 gRPC，部分使用 HTTP 回退，以平衡性能和穩定性。

## 架構決策

### 為什麼是混合架構？

Surflux gRPC 目前的限制：
- ❌ 不支援 `queryEvents`
- ❌ `GetObject` 有格式問題
- ⚠️ `ListDynamicFields` 不返回 `name` 字段

因此採用：
- **gRPC** 用於列表查詢（快速、高效）
- **HTTP** 用於詳情查詢和不支援的方法（穩定、可靠）

## 當前實作

### 使用 gRPC 的方法

#### ✅ getOwnedObjects
```typescript
// 使用 StateService.ListOwnedObjects
const vaults = await client.getOwnedObjects({
  owner: address,
  filter: { StructType: vaultType },
  options: { showContent: true },
});
```

### 使用 HTTP 的方法

#### ❌ queryEvents
```typescript
// Surflux 不支援，使用 HTTP
const events = await client.queryEvents({
  query: { MoveEventType: eventType },
});
```

#### ❌ getObject
```typescript
// GetObject 有格式問題，使用 HTTP
const obj = await client.getObject({
  id: objectId,
  options: { showContent: true },
});
```

### 混合使用的方法

#### ⚠️ getDynamicFields
```typescript
// 1. gRPC 獲取 fieldId 列表
// 2. HTTP getObject 獲取每個 field 的 name
const fields = await client.getDynamicFields({
  parentId: projectId,
});
```

#### ⚠️ getDynamicFieldObject
```typescript
// 1. gRPC 獲取所有 fieldIds
// 2. HTTP getObject 逐個比對 name
const fieldObj = await client.getDynamicFieldObject({
  parentId: projectId,
  name: fieldName,
});
```

## 環境設定

### .env.local
```bash
# 伺服器端使用（API routes）
SUI_GRPC_ENDPOINT=grpc.surflux.dev
SUI_GRPC_TOKEN=your-api-key

# 瀏覽器端使用（React components）
NEXT_PUBLIC_SUI_GRPC_ENDPOINT=grpc.surflux.dev
NEXT_PUBLIC_SUI_GRPC_TOKEN=your-api-key
```

### 為什麼需要兩組變數？

- **Next.js API routes**（伺服器端）只能讀取**非** `NEXT_PUBLIC_` 前綴的變數
- **React components**（瀏覽器端）只能讀取 `NEXT_PUBLIC_` 前綴的變數

## 核心代碼

### 自動選擇客戶端

```typescript
// lib/sui/client.ts
export function getSuiClient() {
  if (isGrpcEnabled()) {
    try {
      const { getGrpcSuiAdapter } = require('./grpc-adapter');
      const adapter = getGrpcSuiAdapter();
      if (adapter) return adapter;
    } catch (error) {
      console.error('gRPC adapter failed, using HTTP:', error);
    }
  }
  return suiClient; // HTTP fallback
}
```

### gRPC 適配器

```typescript
// lib/sui/grpc-adapter.ts
export function createGrpcSuiAdapter() {
  const grpcClient = getSuiGrpcClient();
  
  return {
    // ✅ 使用 gRPC
    async getOwnedObjects(params) {
      const { response } = await grpcClient.stateService.listOwnedObjects({
        owner: params.owner,
        object_type: params.filter?.StructType,
        page_size: params.limit || 50,
      });
      // 轉換格式...
    },
    
    // ❌ 使用 HTTP 回退
    async queryEvents(params) {
      const { suiClient } = await import('./client');
      return suiClient.queryEvents(params);
    },
    
    // 混合方案...
  };
}
```

## 性能分析

### gRPC 使用率：20%

| 方法 | 協議 | 原因 |
|------|------|------|
| `getOwnedObjects` | gRPC | ✅ 完全支援 |
| `queryEvents` | HTTP | ❌ Surflux 不支援 |
| `getObject` | HTTP | ❌ 格式問題 |
| `getDynamicFields` | 混合 | ⚠️ 需要 HTTP 補充 name |
| `getDynamicFieldObject` | 混合 | ⚠️ 需要 HTTP 比對 |

### 性能考量

**優點：**
- ✅ 列表查詢更快（gRPC binary protocol）
- ✅ 自動回退保證穩定性
- ✅ 應用完全正常工作

**缺點：**
- ⚠️ `getDynamicFields` 對每個 field 額外調用一次 HTTP
- ⚠️ 混合架構增加維護複雜度
- ⚠️ gRPC 使用率較低（20%）

## 測試

### 運行測試
```bash
cd frontend
npx tsx scripts/test-grpc-integration.js
```

### 預期輸出
```
✅ queryEvents (HTTP)
✅ getObject (HTTP)  
✅ getOwnedObjects (gRPC)
✅ getDynamicFields (混合)
✅ getDynamicFieldObject (混合)

總計: 5/5 通過
```

## 未來優化選項

### 選項 1：保持現狀（推薦）
- ✅ 穩定可靠
- ✅ 部分享受 gRPC 性能
- ⏱️ 無需額外工作

### 選項 2：聯繫 Surflux
報告問題：
- `GetObject` 的 `FIELD_MISSING` 錯誤
- `ListDynamicFields` 不返回 `name` 字段
- 期待修復後 gRPC 使用率可提升至 80%+

### 選項 3：完全回退 HTTP
如果：
- gRPC 性能提升不明顯
- 維護混合架構成本過高
- Surflux 長期無法修復

可以簡化為純 HTTP，等待 Sui 官方 GraphQL（2026年4月）

### 選項 4：更換提供商
評估其他 gRPC 服務商：
- QuickNode
- BlockPI
- 自建 Full Node

## 常見問題

### Q: 為什麼 updates 顯示不出來？
A: `getDynamicFields` 需要 `name` 字段。已實作混合方案：gRPC 獲取列表 + HTTP 獲取詳情。

### Q: 如何禁用 gRPC？
A: 移除 `.env.local` 中的 gRPC 配置：
```bash
# 註釋這些行
# SUI_GRPC_ENDPOINT=...
# SUI_GRPC_TOKEN=...
```

### Q: 如何監控 gRPC 使用情況？
A: 查看控制台日誌：
- `⚠️ queryEvents using HTTP fallback` = 使用 HTTP
- 無警告 = 使用 gRPC

### Q: gRPC 調用失敗怎麼辦？
A: 自動回退到 HTTP，應用不受影響。

## 相關資源

- [Sui gRPC 官方文檔](https://docs.sui.io/concepts/data-access/grpc)
- [Surflux 文檔](https://surflux.dev/docs)
- [測試腳本](../frontend/scripts/test-grpc-integration.js)
- [gRPC 客戶端](../frontend/lib/sui/grpc-client.ts)
- [適配器實作](../frontend/lib/sui/grpc-adapter.ts)

## 總結

✅ **當前狀態：生產就緒**

混合架構在性能和穩定性之間取得平衡：
- 20% 查詢使用 gRPC（列表查詢）
- 80% 查詢使用 HTTP（詳情和特殊查詢）
- 自動回退機制保證 100% 可用性

建議保持現狀，監控 Surflux 的改進情況。
