# Sui HTTP JSON-RPC 查詢 - curl 格式

## 基本設定

```bash
# Sui Mainnet RPC 端點
export SUI_RPC="https://fullnode.mainnet.sui.io:443"

# 你的專案 Package ID
export PACKAGE_ID="0xdd703e7f17da8aa2a4dc1674a185160470d15da59f8870ed75660c8e3a359e67"
```

---

## 1. queryEvents - 查詢事件

### 1.1 查詢專案創建事件
```bash
curl -X POST $SUI_RPC \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "suix_queryEvents",
    "params": [
      {
        "MoveEventType": "'$PACKAGE_ID'::project::ProjectCreatedEvent"
      },
      null,
      3,
      false
    ]
  }'
```

### 1.2 查詢專案更新事件
```bash
curl -X POST $SUI_RPC \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "suix_queryEvents",
    "params": [
      {
        "MoveEventType": "'$PACKAGE_ID'::project::ProjectUpdatedEvent"
      },
      null,
      50,
      false
    ]
  }'
```

### 1.3 查詢捐款事件
```bash
curl -X POST $SUI_RPC \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "suix_queryEvents",
    "params": [
      {
        "MoveEventType": "'$PACKAGE_ID'::donation::DonationMadeEvent"
      },
      null,
      100,
      true
    ]
  }'
```

### 1.4 查詢支持記錄事件
```bash
curl -X POST $SUI_RPC \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "suix_queryEvents",
    "params": [
      {
        "MoveEventType": "'$PACKAGE_ID'::support::SupportRecordCreatedEvent"
      },
      null,
      50,
      false
    ]
  }'
```

---

## 2. getObject - 獲取對象詳情

### 2.1 獲取專案詳情（包含完整內容）
```bash
export PROJECT_ID="0x7c1726033453dc4c9c31bbd53e4239450c93663e1eed646b4211b40f42f14231"

curl -X POST $SUI_RPC \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "sui_getObject",
    "params": [
      "'$PROJECT_ID'",
      {
        "showType": true,
        "showOwner": true,
        "showContent": true,
        "showBcs": false,
        "showDisplay": false,
        "showStorageRebate": false,
        "showPreviousTransaction": false
      }
    ]
  }'
```

### 2.2 獲取平台對象
```bash
export PLATFORM_ID="0x123..."

curl -X POST $SUI_RPC \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "sui_getObject",
    "params": [
      "'$PLATFORM_ID'",
      {
        "showContent": true
      }
    ]
  }'
```

### 2.3 獲取 Vault 詳情
```bash
export VAULT_ID="0xabc..."

curl -X POST $SUI_RPC \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "sui_getObject",
    "params": [
      "'$VAULT_ID'",
      {
        "showContent": true,
        "showType": true
      }
    ]
  }'
```

---

## 3. getOwnedObjects - 獲取擁有的對象

### 3.1 獲取用戶的所有專案
```bash
export USER_ADDRESS="0x006d980cadd43c778e628201b45cfd3ba6e1047c65f67648a88f635108ffd6eb"

curl -X POST $SUI_RPC \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "suix_getOwnedObjects",
    "params": [
      "'$USER_ADDRESS'",
      {
        "filter": {
          "StructType": "'$PACKAGE_ID'::project::Project"
        },
        "options": {
          "showType": true,
          "showContent": true
        }
      },
      null,
      50
    ]
  }'
```

### 3.2 獲取用戶的 Vault（特定代幣類型）
```bash
export VAULT_TYPE="'$PACKAGE_ID'::vault::Vault<0x6d9fc33611f4881a3f5c0cd4899d95a862236ce52b3a38fef039077b0c5b5834::btc_usdc::BtcUSDC>"

curl -X POST $SUI_RPC \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "suix_getOwnedObjects",
    "params": [
      "'$USER_ADDRESS'",
      {
        "filter": {
          "StructType": "'$VAULT_TYPE'"
        },
        "options": {
          "showContent": true
        }
      },
      null,
      50
    ]
  }'
```

### 3.3 獲取用戶的支持記錄
```bash
curl -X POST $SUI_RPC \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "suix_getOwnedObjects",
    "params": [
      "'$USER_ADDRESS'",
      {
        "filter": {
          "StructType": "'$PACKAGE_ID'::support::SupportRecord"
        },
        "options": {
          "showContent": true,
          "showType": true
        }
      },
      null,
      50
    ]
  }'
```

---

## 4. getDynamicFields - 獲取動態字段列表

### 4.1 獲取 Vault 的 allocations
```bash
export VAULT_ID="0xabc..."

curl -X POST $SUI_RPC \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "suix_getDynamicFields",
    "params": [
      "'$VAULT_ID'",
      null,
      50
    ]
  }'
```

### 4.2 獲取支持記錄的 badges
```bash
export SUPPORT_RECORD_ID="0xdef..."

curl -X POST $SUI_RPC \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "suix_getDynamicFields",
    "params": [
      "'$SUPPORT_RECORD_ID'",
      null,
      100
    ]
  }'
```

### 4.3 獲取專案的 updates（動態字段）
```bash
export PROJECT_ID="0x7c1726..."

curl -X POST $SUI_RPC \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "suix_getDynamicFields",
    "params": [
      "'$PROJECT_ID'",
      null,
      50
    ]
  }'
```

---

## 5. getDynamicFieldObject - 獲取動態字段對象詳情

### 5.1 獲取特定 allocation 詳情
```bash
# 先從 getDynamicFields 獲取 field name
# name 範例: {"type":"address","value":"0x7c1726..."}

curl -X POST $SUI_RPC \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "suix_getDynamicFieldObject",
    "params": [
      "'$VAULT_ID'",
      {
        "type": "address",
        "value": "'$PROJECT_ID'"
      }
    ]
  }'
```

### 5.2 獲取特定 badge 詳情
```bash
# name 範例: {"type":"address","value":"0xabc..."}

curl -X POST $SUI_RPC \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "suix_getDynamicFieldObject",
    "params": [
      "'$SUPPORT_RECORD_ID'",
      {
        "type": "address",
        "value": "'$PROJECT_ID'"
      }
    ]
  }'
```

### 5.3 獲取特定 update 詳情（用 u64 索引）
```bash
# name 範例: {"type":"u64","value":"0"}

curl -X POST $SUI_RPC \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "suix_getDynamicFieldObject",
    "params": [
      "'$PROJECT_ID'",
      {
        "type": "u64",
        "value": "0"
      }
    ]
  }'
```

---

## 6. getBalance - 獲取餘額

### 6.1 獲取 SUI 餘額
```bash
curl -X POST $SUI_RPC \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "suix_getBalance",
    "params": [
      "'$USER_ADDRESS'",
      "0x2::sui::SUI"
    ]
  }'
```

### 6.2 獲取特定代幣餘額
```bash
export COIN_TYPE="0x6d9fc33611f4881a3f5c0cd4899d95a862236ce52b3a38fef039077b0c5b5834::btc_usdc::BtcUSDC"

curl -X POST $SUI_RPC \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "suix_getBalance",
    "params": [
      "'$USER_ADDRESS'",
      "'$COIN_TYPE'"
    ]
  }'
```

---

## 7. getAllBalances - 獲取所有餘額

```bash
curl -X POST $SUI_RPC \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "suix_getAllBalances",
    "params": [
      "'$USER_ADDRESS'"
    ]
  }'
```

---

## 8. getTransactionBlock - 獲取交易詳情

```bash
export TX_DIGEST="ABC123..."

curl -X POST $SUI_RPC \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "sui_getTransactionBlock",
    "params": [
      "'$TX_DIGEST'",
      {
        "showInput": true,
        "showEffects": true,
        "showEvents": true,
        "showObjectChanges": true,
        "showBalanceChanges": true
      }
    ]
  }'
```

---

## 9. getCheckpoint - 獲取檢查點

```bash
export CHECKPOINT_ID="12345"

curl -X POST $SUI_RPC \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "sui_getCheckpoint",
    "params": [
      "'$CHECKPOINT_ID'"
    ]
  }'
```

---

## 常用完整測試流程

### 測試 1: 獲取所有專案並查詢詳情
```bash
#!/bin/bash

# 設定變數
export SUI_RPC="https://fullnode.mainnet.sui.io:443"
export PACKAGE_ID="0xdd703e7f17da8aa2a4dc1674a185160470d15da59f8870ed75660c8e3a359e67"

# 1. 查詢專案創建事件
echo "1. 查詢專案創建事件..."
EVENTS=$(curl -s -X POST $SUI_RPC \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "suix_queryEvents",
    "params": [
      {"MoveEventType": "'$PACKAGE_ID'::project::ProjectCreatedEvent"},
      null,
      1,
      false
    ]
  }')

echo $EVENTS | jq '.'

# 2. 提取第一個專案 ID
PROJECT_ID=$(echo $EVENTS | jq -r '.result.data[0].parsedJson.project_id')
echo "找到專案 ID: $PROJECT_ID"

# 3. 獲取專案詳情
echo -e "\n2. 獲取專案詳情..."
curl -s -X POST $SUI_RPC \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "sui_getObject",
    "params": [
      "'$PROJECT_ID'",
      {"showContent": true}
    ]
  }' | jq '.'
```

### 測試 2: 查詢 Vault allocations
```bash
#!/bin/bash

export SUI_RPC="https://fullnode.mainnet.sui.io:443"
export VAULT_ID="0xYOUR_VAULT_ID"

# 1. 獲取 Vault 的所有 dynamic fields
echo "1. 獲取 allocations 列表..."
FIELDS=$(curl -s -X POST $SUI_RPC \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "suix_getDynamicFields",
    "params": ["'$VAULT_ID'", null, 50]
  }')

echo $FIELDS | jq '.'

# 2. 提取第一個 field 的 name
FIELD_NAME=$(echo $FIELDS | jq -r '.result.data[0].name')
echo "第一個 field name: $FIELD_NAME"

# 3. 獲取該 field 的詳細內容
echo -e "\n2. 獲取 allocation 詳情..."
curl -s -X POST $SUI_RPC \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "suix_getDynamicFieldObject",
    "params": [
      "'$VAULT_ID'",
      '$FIELD_NAME'
    ]
  }' | jq '.'
```

---

## 批次查詢範例

### 批次獲取多個對象
```bash
curl -X POST $SUI_RPC \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "sui_multiGetObjects",
    "params": [
      [
        "0x7c1726033453dc4c9c31bbd53e4239450c93663e1eed646b4211b40f42f14231",
        "0xabc...",
        "0xdef..."
      ],
      {
        "showContent": true,
        "showType": true
      }
    ]
  }'
```

---

## 錯誤處理範例

```bash
# 使用 jq 檢查錯誤
RESPONSE=$(curl -s -X POST $SUI_RPC \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "sui_getObject",
    "params": ["0xINVALID", {"showContent": true}]
  }')

# 檢查是否有錯誤
if echo $RESPONSE | jq -e '.error' > /dev/null; then
  echo "錯誤: $(echo $RESPONSE | jq -r '.error.message')"
  exit 1
fi

# 提取結果
echo $RESPONSE | jq '.result'
```

---

## 使用技巧

### 1. 美化輸出
```bash
# 使用 jq 格式化 JSON
curl ... | jq '.'

# 只顯示特定欄位
curl ... | jq '.result.data[].parsedJson.title'
```

### 2. 儲存結果到檔案
```bash
curl ... > response.json
cat response.json | jq '.' > formatted.json
```

### 3. 串連多個查詢
```bash
# 先查詢，再使用結果
PROJECT_ID=$(curl -s ... | jq -r '.result.data[0].parsedJson.project_id')
curl -s ... -d '{"params": ["'$PROJECT_ID'", ...]}' | jq '.'
```

### 4. 測試連接
```bash
# 簡單的 ping 測試
curl -X POST $SUI_RPC \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "sui_getCheckpoint",
    "params": ["0"]
  }' | jq '.result.sequenceNumber'
```

---

## 注意事項

1. **環境變數**: 記得在使用前設定所有必要的環境變數
2. **引號**: 在 shell 中使用變數時要正確處理引號
3. **JSON 格式**: 確保 JSON 格式正確，特別是巢狀結構
4. **速率限制**: 公共 RPC 節點可能有速率限制
5. **錯誤處理**: 始終檢查回應中的 `error` 欄位

---

## 參考資料

- [Sui JSON-RPC API 文檔](https://docs.sui.io/references/sui-api)
- [jq 教學](https://stedolan.github.io/jq/tutorial/)
- [curl 文檔](https://curl.se/docs/manual.html)
