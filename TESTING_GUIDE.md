# GoodVibe 測試指南

## 問題：為什麼 Start Supporting 報錯？

當前顯示的項目都是 **mock 測試數據**（ID 格式為 `mock-1`、`mock-2` 等），不是真實的鏈上項目。Mock 數據無法用於真實交易，所以會報錯：

```
Invalid input: Received "0x0000000000000000000000000000000000000000000000000000000000mock-1"
```

## 解決方案：創建真實項目

### 步驟 1：創建項目

1. **訪問應用**：http://localhost:3000
2. **連接錢包**（確保有足夠的 SUI 用於 gas）
3. **進入 Dashboard**或找到 "Create Project" 按鈕
4. **填寫項目信息**：
   - 標題：測試項目 1
   - 描述：這是用於測試的第一個項目
   - 類別：Technology
   - 封面圖片 URL：https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2070&auto=format&fit=crop

5. **提交交易**並等待確認

### 步驟 2：刷新獲取真實項目

1. 創建成功後，**刷新頁面**（或清除緩存後刷新）
2. API 會從鏈上獲取你剛創建的真實項目
3. 真實項目的 ID 格式會是：`0x...`（66 個字符的十六進制地址）

### 步驟 3：創建 Support Record

在 Start Supporting 之前，你需要先創建一個 Support Record：

1. 進入 Dashboard
2. 找到 "Create Support Record" 按鈕（如果有的話）
3. 或者第一次點擊 Start Supporting 時會自動提示創建

### 步驟 4：測試 Start Supporting

1. 找到你剛創建的真實項目
2. 點擊 "Start Supporting" 按鈕
3. 輸入金額（建議小額測試，如 0.1 USDC）
4. 確認交易

## 技術細節

### 為什麼需要真實項目？

- `buildStartSupportingTx` 函數會調用 `tx.object(projectId)`
- Sui SDK 要求 `projectId` 必須是有效的對象 ID（66 字符十六進制）
- Mock ID（如 `"mock-1"`）不符合格式，會被拒絕

### API 如何獲取項目？

```typescript
// frontend/app/api/projects/route.ts
export async function GET() {
  // 1. 嘗試從鏈上獲取
  const chainProjects = await getAllProjects(suiClient, PACKAGE_ID);
  
  // 2. 如果鏈上有項目，使用真實數據
  if (chainProjects.length > 0) {
    return NextResponse.json(chainProjects);
  }
  
  // 3. 否則回退到 mock 數據
  return NextResponse.json(MOCK_PROJECTS);
}
```

## 檢查鏈上項目

你可以在 SuiVision 上查看已創建的項目：

```
https://suivision.xyz/package/{PACKAGE_ID}?network=mainnet
```

Package ID: `0x39fc285f0ac0f4160ce2562652d95d9e1f7fecd2e567f3235ce540549f3fb9f6`

## 常見問題

### Q: 如何知道我的項目創建成功了？
A: 
1. 交易成功會返回 digest
2. 可以在 SuiVision 上查看交易
3. 刷新頁面後應該能看到真實項目

### Q: 創建項目需要多少 gas？
A: 大約需要 0.01-0.02 SUI 的 gas 費用

### Q: 為什麼刷新後還是 mock 數據？
A: 
- 檢查瀏覽器控制台的日誌
- API 可能在查詢項目時出錯
- 確認 PACKAGE_ID 配置正確

## 下一步

創建項目成功後，你就可以：

1. ✅ 測試 Start Supporting 功能
2. ✅ 測試 Withdraw 功能
3. ✅ 測試 Yield Donation 功能

祝測試順利！🎉
