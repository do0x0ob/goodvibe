# Good Vibe 最終設計文檔（基於 Stable Layer）

## 💡 核心業務邏輯

### Stable Layer 收益機制

用戶持有 **btcUSDC** 會產生收益，可以通過 `client.buildClaimTx()` 領取。

### 業務模型選擇

基於 Stable Layer 的特性，有兩種可能的模型：

---

## 🎯 模型 A：用戶主動捐贈收益（推薦）

### 流程說明

```
用戶持有 btcUSDC → 產生收益
                   ↓
用戶 Claim 收益 → 選擇捐贈比例給支持的 Project
                   ↓
Project Creator 提取累積的捐贈
```

### 優點
- ✅ **簡單直觀**：用戶明確控制自己的資產
- ✅ **靈活性高**：用戶可以選擇捐贈比例
- ✅ **安全性好**：資金始終在用戶控制下
- ✅ **無需鎖定**：用戶隨時可以 burn btcUSDC

### 合約設計

#### project.move（核心邏輯）

```move
module goodvibe::project;

use sui::coin::Coin;
use sui::balance::{Self, Balance};
use sui::event;

/// Project 財務（持有捐贈的收益）
public struct ProjectFinancial<phantom T> has store {
    balance: Balance<T>,           // 實際收到的捐贈
    total_received: u64,            // 總收到金額
    total_support_amount: u64,      // 記錄的總支持金額（用於統計）
}

/// Project 主結構
public struct Project<phantom T> has key {
    id: UID,
    creator: address,
    metadata: ProjectMetadata,
    financial: ProjectFinancial<T>,
    stats: ProjectStats,
}

// ==================== 支持記錄 ====================

/// 用戶開始支持項目（只記錄）
public fun support_project<T>(
    project: &mut Project<T>,
    support_record: &mut SupportRecord,
    amount: u64,
    ctx: &TxContext,
) {
    let project_id = object::id(project);
    let supporter = ctx.sender();
    
    // 記錄到 SupportRecord
    support_record::start_support(support_record, project_id, amount, ctx);
    
    // 更新 project 統計
    project.financial.total_support_amount = 
        project.financial.total_support_amount + amount;
    
    event::emit(SupportStartedEvent {
        project_id,
        supporter,
        amount,
        timestamp: ctx.epoch_timestamp_ms(),
    });
}

// ==================== 收益捐贈 ====================

/// 用戶捐贈收益給支持的項目
/// 這是在用戶 claim 收益後調用的
public fun donate_yield<T>(
    project: &mut Project<T>,
    yield_coin: Coin<T>,
    ctx: &TxContext,
) {
    let amount = yield_coin.value();
    let donor = ctx.sender();
    
    // 將收益加入 project balance
    project.financial.balance.join(yield_coin.into_balance());
    project.financial.total_received = 
        project.financial.total_received + amount;
    
    event::emit(YieldDonatedEvent {
        project_id: object::id(project),
        donor,
        amount,
        timestamp: ctx.epoch_timestamp_ms(),
    });
}

/// 用戶一次性 claim 並捐贈給多個項目
/// 根據 SupportRecord 中的比例分配
public fun claim_and_donate_to_supported<T>(
    support_record: &SupportRecord,
    yield_coin: Coin<T>,
    projects: vector<&mut Project<T>>,
    ctx: &TxContext,
) {
    let total_yield = yield_coin.value();
    let mut remaining = yield_coin;
    
    // 計算總支持金額
    let mut total_support = 0u64;
    let mut i = 0;
    while (i < projects.length()) {
        let project = &projects[i];
        let project_id = object::id(project);
        let support_amount = support_record::get_support_amount(support_record, project_id);
        total_support = total_support + support_amount;
        i = i + 1;
    };
    
    // 按比例分配收益
    i = 0;
    while (i < projects.length()) {
        let project = &mut projects[i];
        let project_id = object::id(project);
        let support_amount = support_record::get_support_amount(support_record, project_id);
        
        // 計算該項目應得的收益
        let project_share = (total_yield * support_amount) / total_support;
        
        if (project_share > 0) {
            let donation = remaining.split(project_share, ctx);
            donate_yield(project, donation, ctx);
        };
        
        i = i + 1;
    };
    
    // 剩餘的（如果有）返還給用戶
    if (remaining.value() > 0) {
        transfer::public_transfer(remaining, ctx.sender());
    } else {
        remaining.destroy_zero();
    };
}

// ==================== Project Creator 提取 ====================

/// Project Creator 提取累積的捐贈
public fun withdraw_donations<T>(
    project_cap: &ProjectCap,
    project: &mut Project<T>,
    amount: u64,
    ctx: &mut TxContext
): Coin<T> {
    assert!(project_cap.project_id == object::id(project), EInvalidProjectCap);
    assert!(project.financial.balance.value() >= amount, EInsufficientBalance);
    
    let withdrawn = coin::from_balance(project.financial.balance.split(amount), ctx);
    
    event::emit(DonationsWithdrawnEvent {
        project_id: object::id(project),
        creator: ctx.sender(),
        amount,
        timestamp: ctx.epoch_timestamp_ms(),
    });
    
    withdrawn
}
```

### 前端整合流程

#### 1. 用戶開始支持項目

```typescript
import { StableLayerClient } from 'stable-layer-sdk'
import { Transaction, coinWithBalance } from '@mysten/sui/transactions'

async function startSupportingProject(
  projectId: string,
  usdcAmount: number,
  supportRecordId: string
) {
  const tx = new Transaction()
  const stableClient = new StableLayerClient({
    network: "mainnet",
    sender: userAddress
  })
  
  // 步驟 1: Mint btcUSDC
  const usdcCoin = coinWithBalance({
    balance: BigInt(usdcAmount),
    type: USDC_TYPE
  })(tx)
  
  await stableClient.buildMintTx({
    tx,
    lpToken: "btcUSDC",
    usdcCoin,
    amount: BigInt(usdcAmount),
    autoTransfer: true  // btcUSDC 自動轉給用戶
  })
  
  // 步驟 2: 記錄支持（不轉移 btcUSDC）
  tx.moveCall({
    target: `${PACKAGE_ID}::project::support_project`,
    arguments: [
      tx.object(projectId),
      tx.object(supportRecordId),
      tx.pure.u64(usdcAmount),
    ],
    typeArguments: [BTCUSDC_TYPE],
  })
  
  return tx
}
```

#### 2. 用戶 Claim 收益並捐贈

```typescript
async function claimAndDonate(supportRecordId: string, donationPercentage: number) {
  const tx = new Transaction()
  const stableClient = new StableLayerClient({
    network: "mainnet",
    sender: userAddress
  })
  
  // 步驟 1: Claim 收益（不自動轉移）
  const yieldCoin = await stableClient.buildClaimTx({
    tx,
    lpToken: "btcUSDC",
    autoTransfer: false  // 我們需要處理這個 coin
  })
  
  // 步驟 2: 計算捐贈金額
  // 如果 donationPercentage = 50，捐贈 50%，保留 50%
  if (donationPercentage > 0) {
    // 分割出要捐贈的部分
    const donationAmount = tx.moveCall({
      target: '0x2::coin::value',
      arguments: [yieldCoin],
      typeArguments: [BTCUSDC_TYPE],
    })
    
    // 計算實際捐贈金額
    // TODO: 需要獲取支持的項目列表
    const supportedProjects = await getSupportedProjects(supportRecordId)
    
    // 步驟 3: 捐贈給所有支持的項目（按比例分配）
    tx.moveCall({
      target: `${PACKAGE_ID}::project::claim_and_donate_to_supported`,
      arguments: [
        tx.object(supportRecordId),
        yieldCoin,
        tx.makeMoveVec({
          objects: supportedProjects.map(p => tx.object(p.projectId))
        }),
      ],
      typeArguments: [BTCUSDC_TYPE],
    })
  } else {
    // 不捐贈，收益全部給用戶
    tx.transferObjects([yieldCoin], userAddress)
  }
  
  return tx
}
```

#### 3. 用戶取回本金

```typescript
async function withdrawPrincipal(
  projectId: string,
  supportRecordId: string,
  amount: number
) {
  const tx = new Transaction()
  const stableClient = new StableLayerClient({
    network: "mainnet",
    sender: userAddress
  })
  
  // 步驟 1: 減少支持記錄
  tx.moveCall({
    target: `${PACKAGE_ID}::project::decrease_support`,
    arguments: [
      tx.object(projectId),
      tx.object(supportRecordId),
      tx.pure.u64(amount),
    ],
    typeArguments: [BTCUSDC_TYPE],
  })
  
  // 步驟 2: Burn btcUSDC 換回 USDC
  await stableClient.buildBurnTx({
    tx,
    lpToken: "btcUSDC",
    amount: BigInt(amount),
    autoTransfer: true  // USDC 自動轉給用戶
  })
  
  return tx
}
```

#### 4. Project Creator 提取捐贈

```typescript
async function withdrawProjectDonations(
  projectId: string,
  projectCapId: string,
  amount: number
) {
  const tx = new Transaction()
  
  // 提取累積的捐贈（btcUSDC）
  const withdrawnCoin = tx.moveCall({
    target: `${PACKAGE_ID}::project::withdraw_donations`,
    arguments: [
      tx.object(projectCapId),
      tx.object(projectId),
      tx.pure.u64(amount),
    ],
    typeArguments: [BTCUSDC_TYPE],
    returns: ['coin'],
  })
  
  // 選項 1: 保留 btcUSDC（繼續賺收益）
  tx.transferObjects([withdrawnCoin], creatorAddress)
  
  // 選項 2: 立即換成 USDC
  const stableClient = new StableLayerClient({
    network: "mainnet",
    sender: creatorAddress
  })
  
  await stableClient.buildBurnTx({
    tx,
    lpToken: "btcUSDC",
    amount: BigInt(amount),
    autoTransfer: true
  })
  
  return tx
}
```

### UI/UX 設計

#### Project Detail 頁面

```typescript
// 用戶視角
<ProjectDetail>
  {/* 支持按鈕 */}
  <SupportButton onClick={startSupportingProject}>
    Start Supporting (Mint btcUSDC)
  </SupportButton>
  
  {/* 如果用戶已支持，顯示收益捐贈選項 */}
  {isSupporting && (
    <YieldDonationPanel>
      <p>Your btcUSDC is earning yield!</p>
      <button onClick={claimAndDonate}>
        Claim & Donate {donationPercentage}% to this project
      </button>
      <Slider 
        value={donationPercentage} 
        onChange={setDonationPercentage}
        min={0}
        max={100}
      />
    </YieldDonationPanel>
  )}
  
  {/* Progress 頁籤（只有支持者能看到）*/}
  {isSupporting && <ProgressTab />}
</ProjectDetail>
```

#### Project Manage 頁面（Creator）

```typescript
// Creator 視角
<ProjectManage>
  <DonationStats>
    <div>Total Support Amount: {totalSupportAmount} btcUSDC (recorded)</div>
    <div>Actual Donations Received: {balance} btcUSDC</div>
  </DonationStats>
  
  {/* Claim 按鈕 */}
  <button onClick={withdrawProjectDonations}>
    Withdraw {balance} btcUSDC
  </button>
  
  {/* 選項：是否立即換成 USDC */}
  <Checkbox checked={convertToUSDC} onChange={setConvertToUSDC}>
    Convert to USDC immediately
  </Checkbox>
</ProjectManage>
```

#### Dashboard（用戶）

```typescript
<Dashboard>
  <MyBtcUSDCPanel>
    <div>My btcUSDC Balance: {btcUsdcBalance}</div>
    <div>Estimated Yield: {estimatedYield} per year</div>
    <button onClick={claimYield}>Claim Yield</button>
  </MyBtcUSDCPanel>
  
  <SupportedProjectsList>
    {supportedProjects.map(project => (
      <ProjectCard>
        <h3>{project.name}</h3>
        <p>Supporting with: {project.supportAmount} btcUSDC</p>
        <button onClick={() => decreaseSupport(project.id)}>
          Reduce Support
        </button>
        <button onClick={() => endSupport(project.id)}>
          Stop Supporting
        </button>
      </ProjectCard>
    ))}
  </SupportedProjectsList>
</Dashboard>
```

---

## 🎯 模型 B：鎖定 btcUSDC（更複雜）

### 流程說明

```
用戶將 btcUSDC 鎖定在合約中
         ↓
合約代為 Claim 收益
         ↓
收益自動分配給 Project
         ↓
用戶可以隨時解鎖取回本金
```

### 問題

❌ **Stable Layer 不支援這種模式**
- Claim 必須由 btcUSDC 持有者發起
- 無法由合約代為 Claim
- 如果鎖定在合約，合約無法調用 `buildClaimTx`

### 結論

**不推薦使用模型 B**，Stable Layer 的設計不支援這種方式。

---

## ✅ 推薦實作：模型 A

### 優勢總結

1. **技術可行**：完全符合 Stable Layer 的設計
2. **用戶友好**：資金始終在用戶控制下
3. **靈活性高**：用戶可以自由選擇捐贈比例
4. **激勵對齊**：用戶持有 btcUSDC 越多，收益越多，可以捐更多

### 核心特點

- ✅ btcUSDC 始終在用戶錢包
- ✅ 用戶定期 claim 收益
- ✅ 用戶選擇捐贈比例（0-100%）
- ✅ 捐贈自動按支持比例分配給多個項目
- ✅ Project creator 提取累積的捐贈
- ✅ 用戶隨時可以 burn btcUSDC 取回 USDC

### 關鍵指標

**對用戶**：
- 支持的項目列表
- 每個項目的支持金額
- 總 btcUSDC 餘額
- 可 claim 的收益
- 已捐贈的總額

**對 Project Creator**：
- 記錄的總支持金額（統計用）
- 實際收到的捐贈金額
- 可提取的餘額

---

## 📝 實作優先級

### Phase 1: 核心功能

1. ✅ 整合 Stable Layer SDK
   - Mint btcUSDC
   - Claim 收益
   - Burn btcUSDC

2. ✅ SupportRecord 系統
   - 創建 record
   - 記錄支持
   - 更新支持

3. ✅ Project 基礎
   - 創建 project
   - 接收捐贈
   - Creator 提取

### Phase 2: 增強功能

4. ✅ 智能分配
   - 按比例分配收益
   - 一鍵捐贈給多個項目

5. ✅ UI/UX 優化
   - Dashboard
   - Project Detail
   - Project Manage

### Phase 3: 高級功能

6. 🔄 自動化（可選）
   - 設定自動捐贈比例
   - 定期提醒 claim

7. 📊 分析工具
   - 收益統計
   - 捐贈趨勢
   - 項目影響力

---

## 🧪 測試計劃

### 單元測試

- [ ] SupportRecord CRUD
- [ ] Project support 流程
- [ ] Yield donation 邏輯
- [ ] 比例計算正確性

### 整合測試

- [ ] Stable Layer SDK 整合
- [ ] 完整 support 流程
- [ ] Claim 和捐贈流程
- [ ] Withdraw 流程

### 前端測試

- [ ] UI 流程完整性
- [ ] 錯誤處理
- [ ] 邊界條件

---

## 🚀 部署清單

### 合約

- [ ] 更新 project.move
- [ ] 完善 support_record.move
- [ ] 移除 badge 相關
- [ ] Testnet 測試
- [ ] Mainnet 升級

### 前端

- [ ] 整合 Stable Layer SDK
- [ ] 實作 UI 組件
- [ ] 測試完整流程
- [ ] 部署

---

**設計完成日期**: 2026-02-10  
**基於**: Stable Layer SDK  
**狀態**: 待實作
