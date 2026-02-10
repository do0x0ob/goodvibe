# gRPC 遷移狀態

## ✅ 完成狀態

gRPC 遷移已完成，採用**混合架構**（gRPC + HTTP），所有功能正常運作。

## 📊 使用情況

```
✅ getOwnedObjects      → gRPC (列表查詢)
⚠️ getDynamicFields     → gRPC + HTTP (混合)
⚠️ getDynamicFieldObject → gRPC + HTTP (混合)
❌ queryEvents          → HTTP (Surflux 不支援)
❌ getObject            → HTTP (格式問題)

gRPC 使用率: 20%
```

## 🧪 測試

```bash
cd frontend
npx tsx scripts/test-grpc-integration.js
```

預期：5/5 通過 ✅

## 📚 文檔

詳見 [`docs/grpc-migration-guide.md`](./docs/grpc-migration-guide.md)

## 🔧 環境設定

`.env.local` 需要配置：
```bash
SUI_GRPC_ENDPOINT=grpc.surflux.dev
SUI_GRPC_TOKEN=your-api-key
NEXT_PUBLIC_SUI_GRPC_ENDPOINT=grpc.surflux.dev
NEXT_PUBLIC_SUI_GRPC_TOKEN=your-api-key
```

## 💡 關鍵決策

**為什麼是混合架構？**

Surflux gRPC 限制：
- 不支援 `queryEvents`
- `GetObject` 有格式錯誤
- `ListDynamicFields` 不返回 `name` 字段

因此採用 gRPC 用於快速列表查詢，HTTP 用於穩定的詳情查詢。

## 🎯 建議

**保持現狀**（推薦）
- ✅ 穩定運行
- ✅ 部分性能提升
- ✅ 自動回退保證可用性

可選：聯繫 Surflux 報告問題，期待未來改進。
