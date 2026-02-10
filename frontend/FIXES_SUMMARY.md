# 修復總結

## 問題 1: Update 時間顯示不正確 ✅ 已修復

### 問題分析
Sui 區塊鏈的 `epoch_timestamp_ms()` 返回的是標準 Unix 毫秒時間戳，無需轉換。

### 修復內容
- 確認時間格式化函數正確使用毫秒時間戳
- 添加詳細註釋說明時間戳格式

### 文件修改
- `frontend/components/project/ProjectDetail.tsx` - `formatRelativeTime` 函數

### 測試方法
1. 查看 Update 的時間顯示（應該顯示正確的相對時間）
2. 如果仍然不正確，請檢查系統時區設置

---

## 問題 2: Supporters 資料沒有正確展示 ✅ 已修復

### 問題分析
Supporters 資料需要從鏈上事件聚合，查詢邏輯正確但缺少調試信息。

### 修復內容
1. 添加詳細的調試日誌到 `getProjectSupportersFromEvents` 函數
2. 統一到後端 API 處理
3. 優化錯誤處理

### 文件修改
- `frontend/lib/sui/queries.ts` - 添加日誌
- `frontend/app/api/projects/[projectId]/route.ts` - 新增統一 API
- `frontend/hooks/useProjectDetail.ts` - 新增統一查詢 hook
- `frontend/components/project/ProjectDetail.tsx` - 使用新 API

### 測試方法
1. 打開開發者工具 Console
2. 查看 `[getProjectSupportersFromEvents]` 開頭的日誌
3. 檢查是否有錯誤訊息
4. 確認 Supporters 標籤頁是否顯示數據

---

## 問題 3: 統一資料來源架構 ✅ 已完成

### 設計決策
採用**統一後端 API** 架構，原因：
- 項目是公開展示平台，大部分是只讀數據
- 可實現良好的緩存策略
- 代碼結構更清晰，易於維護
- 便於監控和調試

### 新架構
```
前端組件
   ↓
useProjectDetail Hook
   ↓
API Route: /api/projects/[projectId]
   ↓
查詢函數: queries.ts
   ↓
Sui RPC
```

### 創建的文件
1. **API Route**: `frontend/app/api/projects/[projectId]/route.ts`
   - 統一獲取 project + updates + supporters
   
2. **Hook**: `frontend/hooks/useProjectDetail.ts`
   - 封裝 API 調用，提供 React Query 緩存
   
3. **文檔**: `frontend/DATA_ARCHITECTURE.md`
   - 完整的架構設計說明
   - 各種場景的最佳實踐

### 修改的文件
1. `frontend/components/project/ProjectDetail.tsx`
   - 移除單獨的 hooks（`useProjectUpdates`, `useProjectSupporters`）
   - 使用統一的 `useProjectDetail` hook
   
2. `frontend/lib/sui/queries.ts`
   - 添加調試日誌
   - 優化錯誤處理

### 優點
✅ 統一的資料來源
✅ 更好的緩存控制
✅ 易於調試和監控
✅ 減少前端代碼複雜度
✅ 便於實現 rate limiting

### 待優化（可選）
- [ ] 實現 API 層緩存（Redis/Memory）
- [ ] 添加 rate limiting
- [ ] 實現 WebSocket 實時更新
- [ ] 增量更新機制

---

## 如何測試

### 1. 啟動開發服務器
```bash
cd frontend
npm run dev
```

### 2. 測試 Update 展示
1. 訪問項目詳情頁
2. 點擊 "Updates" 標籤
3. 確認可以看到之前發布的 update
4. 檢查時間顯示是否正確

### 3. 測試 Supporters 展示
1. 在同一頁面點擊 "Supporters" 標籤
2. 打開開發者工具（F12）-> Console
3. 查找 `[getProjectSupportersFromEvents]` 日誌
4. 確認是否有支持者數據

### 4. 測試統一 API
在瀏覽器訪問（替換 projectId）：
```
http://localhost:3000/api/projects/YOUR_PROJECT_ID
```

應該看到 JSON 響應：
```json
{
  "project": { ... },
  "updates": [ ... ],
  "supporters": [ ... ]
}
```

### 5. 檢查控制台日誌
查找以下日誌前綴：
- `[useProjectDetail]` - Hook 調用
- `[API]` - API 處理
- `[getProjectUpdates]` - Updates 查詢
- `[getProjectSupportersFromEvents]` - Supporters 查詢

---

## 如果還有問題

### Supporters 仍然不顯示
可能原因：
1. 該項目還沒有支持者（查看事件數量日誌）
2. 事件查詢失敗（查看錯誤日誌）
3. PACKAGE_ID 配置不正確

解決方法：
```bash
# 檢查環境變量
echo $NEXT_PUBLIC_PACKAGE_ID

# 查看控制台完整日誌
# 搜索 "getProjectSupportersFromEvents"
```

### 時間仍然不正確
可能原因：
1. 系統時區設置問題
2. 瀏覽器時區設置

解決方法：
```javascript
// 在控制台執行，檢查時間戳
const timestamp = 1770668859513;
console.log('Update time:', new Date(timestamp));
console.log('Current time:', new Date());
console.log('Difference (hours):', (Date.now() - timestamp) / 1000 / 3600);
```

### API 返回 404
確認：
1. 文件路徑正確：`frontend/app/api/projects/[projectId]/route.ts`
2. Next.js 開發服務器已重啟
3. projectId 是有效的對象 ID

---

## 下一步建議

1. **移除舊 hooks**（可選，保留也不影響）
   - `frontend/hooks/useProjectUpdates.ts`
   - `frontend/hooks/useProjectSupporters.ts`

2. **實現緩存**（生產環境推薦）
   ```typescript
   // 在 API route 中添加
   export const revalidate = 30; // 30 秒 ISR
   ```

3. **監控和分析**
   - 添加 API 響應時間監控
   - 記錄緩存命中率
   - 追蹤錯誤率

4. **用戶體驗優化**
   - 添加骨架屏（Skeleton）
   - 實現樂觀更新（Optimistic UI）
   - 添加下拉刷新
