# 修復總結

## 問題 1: Update 時間顯示不正確 ✅ 已修復

- Sui `epoch_timestamp_ms()` 為標準 Unix 毫秒時間戳，無需轉換。
- 修正 `formatRelativeTime` 與時間戳註釋（`ProjectDetail.tsx`）。

## 問題 2: Supporters 資料沒有正確展示 ✅ 已修復

- Supporters 需從鏈上事件聚合。
- 在 `getProjectSupportersFromEvents` 增加調試日誌，統一由後端 API 處理。
- 修改：`queries.ts`、`/api/projects/[projectId]/route.ts`、`useProjectDetail.ts`、`ProjectDetail.tsx`。

## 問題 3: 統一資料來源架構 ✅ 已完成

### 設計決策：統一後端 API
- 項目為公開展示，多為只讀；利於緩存、維護與調試。

### 架構
```
前端組件 → useProjectDetail → API /api/projects/[projectId] → queries.ts → Sui RPC
```

### 新增
- API Route: `app/api/projects/[projectId]/route.ts`（project + updates + supporters）
- Hook: `useProjectDetail.ts`
- 文檔: `DATA_ARCHITECTURE.md`

### 修改
- `ProjectDetail.tsx` 改用 `useProjectDetail`，移除單獨的 updates/supporters hooks。
- `queries.ts` 增加日誌與錯誤處理。

### 可選優化
- API 層緩存、rate limiting、WebSocket 實時更新、增量更新。
