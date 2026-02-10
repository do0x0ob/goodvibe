# SupportRecord 設計說明

## 業務需求

用戶需要記錄：
1. 支持了哪些 Projects（可能多個）
2. 每個 Project 的支持金額和時間
3. 可以開始支持新項目
4. 可以結束對某個項目的支持
5. 唯一福利：可以查看被支持項目的 Progress

## 關鍵問題：如何修改 Owned Object？

### ❌ 錯誤理解

> "SupportRecord 是 owned object，需要放在 Kiosk 才能由平台調用修改"

### ✅ 正確理解

**不需要 Kiosk！** 用戶可以在交易中直接傳入自己的 owned object。

## 正確的合約設計

### support_record.move

```move
module goodvibe::support_record;

use sui::dynamic_field as df;

/// 用戶的支持記錄簿（owned object）
public struct SupportRecord has key, store {
    id: UID,
    owner: address,
}

/// 單個項目的支持記錄
public struct ProjectSupport has store, drop {
    project_id: ID,
    amount: u64,           // 支持的 btcUSDC 金額
    started_at: u64,       // 開始支持時間
    last_updated: u64,     // 最後更新時間
}

// ==================== 用戶操作 ====================

/// 創建 Support Record（用戶調用）
public fun create_support_record(ctx: &mut TxContext): SupportRecord {
    SupportRecord {
        id: object::new(ctx),
        owner: ctx.sender(),
    }
}

// ==================== Project 調用的函數 ====================

/// 開始支持一個項目（由 project 模組調用）
/// 用戶在交易中傳入自己的 SupportRecord
public(package) fun start_support(
    record: &mut SupportRecord,
    project_id: ID,
    amount: u64,
    ctx: &TxContext,
) {
    // 檢查是否已經支持過
    if (df::exists_(&record.id, project_id)) {
        // 如果已存在，更新金額
        let support = df::borrow_mut<ID, ProjectSupport>(&mut record.id, project_id);
        support.amount = support.amount + amount;
        support.last_updated = ctx.epoch_timestamp_ms();
    } else {
        // 新增支持記錄
        let support = ProjectSupport {
            project_id,
            amount,
            started_at: ctx.epoch_timestamp_ms(),
            last_updated: ctx.epoch_timestamp_ms(),
        };
        df::add(&mut record.id, project_id, support);
    }
}

/// 結束對某個項目的支持
public(package) fun end_support(
    record: &mut SupportRecord,
    project_id: ID,
) {
    if (df::exists_(&record.id, project_id)) {
        df::remove<ID, ProjectSupport>(&mut record.id, project_id);
    }
}

/// 更新支持金額（增加）
public(package) fun increase_support(
    record: &mut SupportRecord,
    project_id: ID,
    additional_amount: u64,
    ctx: &TxContext,
) {
    assert!(df::exists_(&record.id, project_id), EProjectNotSupported);
    
    let support = df::borrow_mut<ID, ProjectSupport>(&mut record.id, project_id);
    support.amount = support.amount + additional_amount;
    support.last_updated = ctx.epoch_timestamp_ms();
}

/// 更新支持金額（減少，用於部分取回）
public(package) fun decrease_support(
    record: &mut SupportRecord,
    project_id: ID,
    decrease_amount: u64,
    ctx: &TxContext,
) {
    assert!(df::exists_(&record.id, project_id), EProjectNotSupported);
    
    let support = df::borrow_mut<ID, ProjectSupport>(&mut record.id, project_id);
    assert!(support.amount >= decrease_amount, EInsufficientSupport);
    
    support.amount = support.amount - decrease_amount;
    support.last_updated = ctx.epoch_timestamp_ms();
    
    // 如果金額歸零，可以選擇移除記錄
    if (support.amount == 0) {
        df::remove<ID, ProjectSupport>(&mut record.id, project_id);
    }
}

// ==================== 查詢函數 ====================

/// 檢查是否支持某個項目
public fun is_supporting(record: &SupportRecord, project_id: ID): bool {
    df::exists_(&record.id, project_id)
}

/// 獲取對某個項目的支持金額
public fun get_support_amount(record: &SupportRecord, project_id: ID): u64 {
    if (!df::exists_(&record.id, project_id)) {
        return 0
    };
    
    let support = df::borrow<ID, ProjectSupport>(&record.id, project_id);
    support.amount
}

/// 獲取支持詳情
public fun get_support_details(record: &SupportRecord, project_id: ID): (u64, u64, u64) {
    assert!(df::exists_(&record.id, project_id), EProjectNotSupported);
    
    let support = df::borrow<ID, ProjectSupport>(&record.id, project_id);
    (support.amount, support.started_at, support.last_updated)
}

// ==================== 錯誤碼 ====================

const EProjectNotSupported: u64 = 0;
const EInsufficientSupport: u64 = 1;
```

### project.move 調用示例

```move
/// 用戶開始支持項目
/// 注意：資金不進入 project，只是記錄
public fun support_project<T>(
    _project: &Project<T>,  // 驗證 project 存在
    support_record: &mut SupportRecord,  // 用戶傳入自己的 record
    amount: u64,
    ctx: &TxContext,
) {
    let project_id = object::id(_project);
    
    // 調用 support_record 模組的函數
    support_record::start_support(
        support_record,
        project_id,
        amount,
        ctx
    );
    
    // 發出事件
    event::emit(SupportStartedEvent {
        project_id,
        supporter: ctx.sender(),
        amount,
        timestamp: ctx.epoch_timestamp_ms(),
    });
}

/// 用戶結束支持項目
public fun stop_supporting<T>(
    _project: &Project<T>,
    support_record: &mut SupportRecord,
    ctx: &TxContext,
) {
    let project_id = object::id(_project);
    
    support_record::end_support(support_record, project_id);
    
    event::emit(SupportEndedEvent {
        project_id,
        supporter: ctx.sender(),
        timestamp: ctx.epoch_timestamp_ms(),
    });
}
```

## 前端交易構建

```typescript
// 用戶開始支持項目
export async function buildStartSupportTx(
  projectId: string,
  supportRecordId: string,
  amount: number,
  coinType: string
) {
  const tx = new Transaction();
  
  // 用戶直接傳入自己的 SupportRecord
  tx.moveCall({
    target: `${PACKAGE_ID}::project::support_project`,
    arguments: [
      tx.object(projectId),
      tx.object(supportRecordId),  // 用戶的 owned object
      tx.pure.u64(amount),
    ],
    typeArguments: [coinType],
  });
  
  return tx;
}

// 結束支持
export async function buildStopSupportTx(
  projectId: string,
  supportRecordId: string,
  coinType: string
) {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::project::stop_supporting`,
    arguments: [
      tx.object(projectId),
      tx.object(supportRecordId),
    ],
    typeArguments: [coinType],
  });
  
  return tx;
}
```

## 為什麼不需要 Kiosk？

### Owned Object 的工作原理

1. **用戶擁有** SupportRecord
2. **用戶簽署**交易，明確同意操作
3. **用戶在交易中傳入** `&mut SupportRecord`
4. **函數修改**，但受限於函數邏輯
5. **交易結束後** SupportRecord 仍然歸用戶所有

### 關鍵點

- ✅ **訪問控制**：只有 owner 能傳入 owned object
- ✅ **明確同意**：用戶必須簽署交易
- ✅ **邏輯安全**：使用 `public(package)` 限制修改函數只能被 project 模組調用
- ✅ **簡單高效**：不需要 Kiosk 的額外複雜度

### Kiosk 的真正用途

Kiosk 主要用於：
1. **NFT 市場**：需要交易功能
2. **轉移限制**：需要阻止隨意轉移
3. **版稅系統**：需要 TransferPolicy

對於 SupportRecord，這些都不需要！

## 訪問控制說明

### `public(package)` 的作用

```move
// ✅ 只有同 package 的模組可以調用
public(package) fun start_support(...)

// ❌ 如果是 public，任何外部都能調用
public fun start_support(...)
```

使用 `public(package)` 確保：
- ✅ 只有 `goodvibe::project` 可以調用
- ✅ 外部合約無法直接修改
- ✅ 用戶也無法直接調用（必須通過 project）

### 完整的保護機制

```
用戶 → 簽署交易 → 調用 project::support_project
                    ↓
         project::support_project 驗證邏輯
                    ↓
         調用 support_record::start_support (package 內部)
                    ↓
         修改 SupportRecord
```

## 完整業務流程

### 1. 用戶首次使用

```typescript
// 檢查是否有 SupportRecord
const records = await getUserOwnedObjects(address, 'SupportRecord');

if (records.length === 0) {
  // 創建 SupportRecord
  const tx = new Transaction();
  const [record] = tx.moveCall({
    target: `${PACKAGE_ID}::support_record::create_support_record`,
  });
  tx.transferObjects([record], address);
  await signAndExecute(tx);
}
```

### 2. 支持項目流程

```typescript
// 完整流程：mint btcUSDC + 記錄支持
async function supportProjectWorkflow(projectId: string, usdcAmount: number) {
  const tx = new Transaction();
  
  // 步驟 1: 通過 Stable Layer mint btcUSDC
  const btcUsdcCoin = await buildMintTx(tx, usdcAmount);
  
  // 步驟 2: btcUSDC 留在用戶錢包（自動）
  // 步驟 3: 記錄支持
  tx.moveCall({
    target: `${PACKAGE_ID}::project::support_project`,
    arguments: [
      tx.object(projectId),
      tx.object(userSupportRecordId),
      tx.pure.u64(usdcAmount),
    ],
    typeArguments: [BTCUSDC_TYPE],
  });
  
  return tx;
}
```

### 3. 取回 USDC 流程

```typescript
// 用戶直接 burn btcUSDC，不需要從任何池子提取
async function withdrawWorkflow(projectId: string, amount: number) {
  const tx = new Transaction();
  
  // 步驟 1: 更新記錄（減少支持金額）
  tx.moveCall({
    target: `${PACKAGE_ID}::support_record::decrease_support`,
    arguments: [
      tx.object(userSupportRecordId),
      tx.pure.id(projectId),
      tx.pure.u64(amount),
    ],
  });
  
  // 步驟 2: 通過 Stable Layer burn btcUSDC → USDC
  // （用戶自己的 btcUSDC，不需要任何權限）
  await buildBurnTx(tx, amount);
  
  return tx;
}
```

### 4. Project Creator Claim 收益

```typescript
// Project 創建者 claim 收益
// 注意：收益來自 btcUSDC 的 yield，不是用戶的本金
async function claimProjectYield(projectId: string) {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::project::claim_yield`,
    arguments: [
      tx.object(projectCapId),  // 證明是 project owner
      tx.object(projectId),
    ],
    typeArguments: [BTCUSDC_TYPE],
  });
  
  return tx;
}
```

## 總結

### ✅ 推薦方案（不需要 Kiosk）

- SupportRecord 是 **owned object**
- 使用 **`public(package)`** 限制修改函數
- 用戶在交易中**直接傳入**自己的 record
- **簡單、安全、高效**

### ❌ 不推薦 Kiosk

- 增加不必要的複雜度
- 需要額外的 TransferPolicy
- 用戶需要管理 KioskOwnerCap
- 對這個業務場景沒有實際好處

### 關鍵優勢

1. **用戶體驗好**：只需持有一個 SupportRecord 對象
2. **Gas 成本低**：不需要 Kiosk 的額外操作
3. **代碼簡單**：不需要 borrow/return 邏輯
4. **安全性足夠**：`public(package)` + owned object 機制

---

**結論**：您的擔憂是合理的，但 Kiosk 不是解決方案。正確的方案是使用 `public(package)` + owned object 的原生機制。
