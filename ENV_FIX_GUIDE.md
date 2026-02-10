# 🔧 環境變數設定修正指南

## 問題說明

如果你看到 API 請求返回 404 或所有資料都是 mock 資料，這是因為環境變數設定不完整。

## 原因

在 Next.js 中：
- **API routes（伺服器端）** 需要**不帶前綴**的環境變數：`SUI_GRPC_ENDPOINT`
- **React components（瀏覽器端）** 需要 `NEXT_PUBLIC_` 前綴：`NEXT_PUBLIC_SUI_GRPC_ENDPOINT`

如果只設定 `NEXT_PUBLIC_` 版本，API routes 會無法讀取，導致 gRPC 初始化失敗。

## 解決方案

### 1. 更新 `.env.local` 檔案

在 `frontend/.env.local` 中**同時設定兩種版本**：

```bash
# gRPC Configuration (Surflux)

# ⚠️ 重要：需要同時設定兩種版本

# 伺服器端使用（API routes 必需）
SUI_GRPC_ENDPOINT=grpc.surflux.dev
SUI_GRPC_TOKEN=your_surflux_api_key_here

# 瀏覽器端使用（React components）
NEXT_PUBLIC_SUI_GRPC_ENDPOINT=grpc.surflux.dev
NEXT_PUBLIC_SUI_GRPC_TOKEN=your_surflux_api_key_here
```

### 2. 重啟開發伺服器

環境變數修改後，**必須重啟**開發伺服器：

```bash
# 停止當前的伺服器（Ctrl+C 或）
pkill -f "next dev"

# 重新啟動
cd frontend
npm run dev
```

### 3. 驗證設定

執行測試腳本確認 gRPC 正常運作：

```bash
cd frontend
npm run test-grpc
```

應該看到：

```
✅ 連線成功！
鏈資訊:
  - Chain: mainnet
  - Epoch: 1034
  - Server: sui-node/1.64.1
```

## 檢查清單

- [ ] 在 `.env.local` 中同時設定 `SUI_GRPC_ENDPOINT` 和 `NEXT_PUBLIC_SUI_GRPC_ENDPOINT`
- [ ] 在 `.env.local` 中同時設定 `SUI_GRPC_TOKEN` 和 `NEXT_PUBLIC_SUI_GRPC_TOKEN`
- [ ] 重啟開發伺服器
- [ ] 執行 `npm run test-grpc` 驗證
- [ ] 訪問 http://localhost:3000 確認資料正常

## 快速診斷

### 問題 1：所有 API 返回 mock 資料

**原因**：伺服器端環境變數未設定

**解決**：確保 `.env.local` 中有 `SUI_GRPC_ENDPOINT`（不帶 `NEXT_PUBLIC_` 前綴）

### 問題 2：瀏覽器控制台顯示 "Using HTTP JSON-RPC"

**原因**：瀏覽器端環境變數未設定

**解決**：確保 `.env.local` 中有 `NEXT_PUBLIC_SUI_GRPC_ENDPOINT`

### 問題 3：測試腳本報錯 "gRPC endpoint not configured"

**原因**：環境變數未正確載入

**解決**：
1. 檢查 `.env.local` 檔案是否在 `frontend/` 目錄下
2. 重啟開發伺服器
3. 執行 `npm run test-grpc`

## 範例檔案

完整的 `.env.local.example` 檔案在 `frontend/.env.local.example`。

複製並修改：

```bash
cd frontend
cp .env.local.example .env.local
# 編輯 .env.local，填入你的 Surflux API Key
```

## 為什麼需要兩個版本？

這是 Next.js 的設計：

| 環境 | 變數名稱 | 用途 |
|------|---------|------|
| 伺服器端（API routes） | `SUI_GRPC_ENDPOINT` | API routes 的 gRPC 查詢 |
| 瀏覽器端（React） | `NEXT_PUBLIC_SUI_GRPC_ENDPOINT` | 瀏覽器的 gRPC 查詢 |

只設定一個會導致另一個環境無法使用 gRPC！

## 驗證成功的標誌

開啟開發伺服器後，在終端中應該看到：

```
✅ Using Surflux gRPC-Web for Sui queries
```

如果看到：

```
Using HTTP JSON-RPC for Sui queries
```

表示 gRPC 未啟用，請檢查環境變數設定。

## 需要幫助？

1. 執行 `npm run test-grpc` 查看詳細錯誤
2. 檢查 `.env.local` 是否有語法錯誤
3. 確認 API Key 是否正確
4. 查看開發伺服器的控制台輸出

---

✅ 修正後，你的 API 應該能正常從 Sui 區塊鏈獲取資料，不再回退到 mock！
