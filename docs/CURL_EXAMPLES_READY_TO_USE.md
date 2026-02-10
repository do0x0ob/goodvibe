# 即用 curl 命令範例

> 這些是現成可用的 curl 命令，直接複製到終端執行即可

## 快速測試

### 1. 查詢專案創建事件
```bash
curl -X POST https://fullnode.mainnet.sui.io:443 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "suix_queryEvents",
    "params": [
      {
        "MoveEventType": "0xdd703e7f17da8aa2a4dc1674a185160470d15da59f8870ed75660c8e3a359e67::project::ProjectCreatedEvent"
      },
      null,
      3,
      false
    ]
  }' | jq '.'
```

### 2. 獲取專案詳情
```bash
# 使用上面查詢到的專案 ID
curl -X POST https://fullnode.mainnet.sui.io:443 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "sui_getObject",
    "params": [
      "0x7c1726033453dc4c9c31bbd53e4239450c93663e1eed646b4211b40f42f14231",
      {
        "showContent": true,
        "showType": true
      }
    ]
  }' | jq '.'
```

### 3. 查詢用戶擁有的專案
```bash
curl -X POST https://fullnode.mainnet.sui.io:443 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "suix_getOwnedObjects",
    "params": [
      "0x006d980cadd43c778e628201b45cfd3ba6e1047c65f67648a88f635108ffd6eb",
      {
        "filter": {
          "StructType": "0xdd703e7f17da8aa2a4dc1674a185160470d15da59f8870ed75660c8e3a359e67::project::Project"
        },
        "options": {
          "showContent": true
        }
      },
      null,
      50
    ]
  }' | jq '.'
```

### 4. 查詢 Dynamic Fields
```bash
# 測試用系統對象（0x5 有 dynamic fields）
curl -X POST https://fullnode.mainnet.sui.io:443 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "suix_getDynamicFields",
    "params": [
      "0x0000000000000000000000000000000000000000000000000000000000000005",
      null,
      3
    ]
  }' | jq '.'
```

### 5. 查詢 SUI 餘額
```bash
curl -X POST https://fullnode.mainnet.sui.io:443 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "suix_getBalance",
    "params": [
      "0x006d980cadd43c778e628201b45cfd3ba6e1047c65f67648a88f635108ffd6eb",
      "0x2::sui::SUI"
    ]
  }' | jq '.'
```

### 6. 查詢所有餘額
```bash
curl -X POST https://fullnode.mainnet.sui.io:443 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "suix_getAllBalances",
    "params": [
      "0x006d980cadd43c778e628201b45cfd3ba6e1047c65f67648a88f635108ffd6eb"
    ]
  }' | jq '.'
```

---

## 完整工作流程範例

### 流程 1: 查詢並顯示專案資訊
```bash
#!/bin/bash

echo "步驟 1: 查詢最新專案..."
RESPONSE=$(curl -s -X POST https://fullnode.mainnet.sui.io:443 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "suix_queryEvents",
    "params": [
      {"MoveEventType": "0xdd703e7f17da8aa2a4dc1674a185160470d15da59f8870ed75660c8e3a359e67::project::ProjectCreatedEvent"},
      null,
      1,
      false
    ]
  }')

echo "$RESPONSE" | jq '.result.data[0]'

echo -e "\n步驟 2: 提取專案 ID..."
PROJECT_ID=$(echo "$RESPONSE" | jq -r '.result.data[0].parsedJson.project_id')
echo "專案 ID: $PROJECT_ID"

echo -e "\n步驟 3: 獲取專案詳情..."
curl -s -X POST https://fullnode.mainnet.sui.io:443 \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 1,
    \"method\": \"sui_getObject\",
    \"params\": [
      \"$PROJECT_ID\",
      {
        \"showContent\": true,
        \"showType\": true
      }
    ]
  }" | jq '.result.data.content.fields'
```

### 流程 2: 查詢 Vault allocations
```bash
#!/bin/bash

VAULT_ID="YOUR_VAULT_ID"

echo "步驟 1: 獲取 allocations 列表..."
FIELDS=$(curl -s -X POST https://fullnode.mainnet.sui.io:443 \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 1,
    \"method\": \"suix_getDynamicFields\",
    \"params\": [\"$VAULT_ID\", null, 50]
  }")

echo "$FIELDS" | jq '.result.data | length'
echo "$FIELDS" | jq '.result.data[0]'

echo -e "\n步驟 2: 獲取第一個 allocation 詳情..."
FIRST_FIELD=$(echo "$FIELDS" | jq -r '.result.data[0].name')
echo "Field name: $FIRST_FIELD"

curl -s -X POST https://fullnode.mainnet.sui.io:443 \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 1,
    \"method\": \"suix_getDynamicFieldObject\",
    \"params\": [
      \"$VAULT_ID\",
      $FIRST_FIELD
    ]
  }" | jq '.result.data.content.fields'
```

---

## 批次查詢

### 一次獲取多個對象
```bash
curl -X POST https://fullnode.mainnet.sui.io:443 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "sui_multiGetObjects",
    "params": [
      [
        "0x7c1726033453dc4c9c31bbd53e4239450c93663e1eed646b4211b40f42f14231",
        "0x0000000000000000000000000000000000000000000000000000000000000005"
      ],
      {
        "showContent": true,
        "showType": true
      }
    ]
  }' | jq '.'
```

---

## 實用的單行命令

### 快速查看專案數量
```bash
curl -s -X POST https://fullnode.mainnet.sui.io:443 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"suix_queryEvents","params":[{"MoveEventType":"0xdd703e7f17da8aa2a4dc1674a185160470d15da59f8870ed75660c8e3a359e67::project::ProjectCreatedEvent"},null,100,false]}' \
  | jq '.result.data | length'
```

### 快速查看用戶餘額
```bash
curl -s -X POST https://fullnode.mainnet.sui.io:443 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"suix_getBalance","params":["0x006d980cadd43c778e628201b45cfd3ba6e1047c65f67648a88f635108ffd6eb","0x2::sui::SUI"]}' \
  | jq -r '.result.totalBalance'
```

### 提取專案標題
```bash
curl -s -X POST https://fullnode.mainnet.sui.io:443 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"suix_queryEvents","params":[{"MoveEventType":"0xdd703e7f17da8aa2a4dc1674a185160470d15da59f8870ed75660c8e3a359e67::project::ProjectCreatedEvent"},null,5,false]}' \
  | jq -r '.result.data[].parsedJson.title'
```

---

## 錯誤處理範例

```bash
#!/bin/bash

RESPONSE=$(curl -s -X POST https://fullnode.mainnet.sui.io:443 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "sui_getObject",
    "params": ["0xINVALID_ID", {"showContent": true}]
  }')

# 檢查是否有錯誤
if echo "$RESPONSE" | jq -e '.error' > /dev/null; then
  echo "❌ 錯誤發生:"
  echo "$RESPONSE" | jq '.error'
  exit 1
fi

# 成功
echo "✅ 成功:"
echo "$RESPONSE" | jq '.result'
```

---

## 性能測試

### 測試響應時間
```bash
echo "測試 queryEvents 響應時間..."
time curl -s -X POST https://fullnode.mainnet.sui.io:443 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "suix_queryEvents",
    "params": [
      {"MoveEventType": "0xdd703e7f17da8aa2a4dc1674a185160470d15da59f8870ed75660c8e3a359e67::project::ProjectCreatedEvent"},
      null,
      10,
      false
    ]
  }' > /dev/null
```

### 測試不同 RPC 節點
```bash
#!/bin/bash

ENDPOINTS=(
  "https://fullnode.mainnet.sui.io:443"
  "https://sui-mainnet.blockvision.org"
  "https://sui-mainnet.nodeinfra.com"
)

for endpoint in "${ENDPOINTS[@]}"; do
  echo "測試: $endpoint"
  time curl -s -X POST "$endpoint" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"sui_getCheckpoint","params":["0"]}' \
    > /dev/null
  echo ""
done
```

---

## 調試技巧

### 顯示完整 HTTP 標頭
```bash
curl -v -X POST https://fullnode.mainnet.sui.io:443 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "sui_getCheckpoint",
    "params": ["0"]
  }'
```

### 儲存請求和回應
```bash
# 儲存請求
cat > request.json << 'EOF'
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "suix_queryEvents",
  "params": [
    {"MoveEventType": "0xdd703e7f17da8aa2a4dc1674a185160470d15da59f8870ed75660c8e3a359e67::project::ProjectCreatedEvent"},
    null,
    3,
    false
  ]
}
EOF

# 發送並儲存回應
curl -X POST https://fullnode.mainnet.sui.io:443 \
  -H "Content-Type: application/json" \
  -d @request.json > response.json

# 格式化查看
cat response.json | jq '.' > response-formatted.json
```

---

## 常見查詢模式

### 1. 按類型查詢事件
```bash
# 捐款事件
curl -s -X POST https://fullnode.mainnet.sui.io:443 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "suix_queryEvents",
    "params": [
      {"MoveEventType": "0xdd703e7f17da8aa2a4dc1674a185160470d15da59f8870ed75660c8e3a359e67::donation::DonationMadeEvent"},
      null,
      50,
      false
    ]
  }' | jq '.result.data[] | {donor: .parsedJson.donor, amount: .parsedJson.amount}'
```

### 2. 按地址查詢擁有的對象
```bash
# 查詢所有類型
curl -s -X POST https://fullnode.mainnet.sui.io:443 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "suix_getOwnedObjects",
    "params": [
      "0x006d980cadd43c778e628201b45cfd3ba6e1047c65f67648a88f635108ffd6eb",
      null,
      null,
      50
    ]
  }' | jq '.result.data[] | {id: .data.objectId, type: .data.type}'
```

### 3. 遞迴查詢 Dynamic Fields
```bash
#!/bin/bash

PARENT_ID="YOUR_PARENT_ID"
CURSOR=""

while true; do
  RESPONSE=$(curl -s -X POST https://fullnode.mainnet.sui.io:443 \
    -H "Content-Type: application/json" \
    -d "{
      \"jsonrpc\": \"2.0\",
      \"id\": 1,
      \"method\": \"suix_getDynamicFields\",
      \"params\": [\"$PARENT_ID\", $([ -n "$CURSOR" ] && echo "\"$CURSOR\"" || echo "null"), 50]
    }")
  
  echo "$RESPONSE" | jq '.result.data[]'
  
  CURSOR=$(echo "$RESPONSE" | jq -r '.result.nextCursor // empty')
  HAS_NEXT=$(echo "$RESPONSE" | jq -r '.result.hasNextPage')
  
  if [ "$HAS_NEXT" != "true" ]; then
    break
  fi
done
```

---

## 提示

- 使用 `jq` 來格式化和過濾 JSON 輸出
- 添加 `-s` 標誌到 curl 來隱藏進度條
- 使用 `\` 來分行，讓命令更易讀
- 儲存常用的請求到檔案中 (`-d @file.json`)
- 使用環境變數來管理常用的 ID 和地址
